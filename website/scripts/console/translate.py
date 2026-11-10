#!/usr/bin/env python3
"""Translate the console dataset in batches.

Two backends share one prompt and one output schema:

* `local`      - the current session model, used once to seed the full corpus.
* `workers-ai` - Cloudflare Workers AI (Llama 3.3 70B), used by CI for new or
                 changed records.

The script is resumable: it skips translations whose source hash is fresh and
saves after every batch. AI never writes to the upstream fact layer and never
overrides `overrides.json`.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from parse_upstream import record_key, source_hash

SCHEMA_VERSION = 1
PROMPT_VERSION = "console-zh-v1"
WORKERS_AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
DEFAULT_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "console"
NUMERIC_RE = re.compile(r"[+-]?\d+(?:\.\d+)?")
CJK_RE = re.compile(r"[㐀-䶿一-鿿]")
THINK_RE = re.compile(r"<think\b[^>]*>.*?</" + "think>", re.DOTALL)

SYSTEM_PROMPT = """You are a CS2 console reference editor. Translate or describe each item in the JSON batch.

Rules:
1. If `en` is non-empty: translate it faithfully into Simplified Chinese. If `en` is a bare value, identifier, or non-prose fragment (e.g. "1", "Test", "bugbug", "name <arg>"), write a brief Chinese note based on `name`, `type`, `default`, and `flags` instead of returning the fragment unchanged. Preserve every number, unit, comparison operator, bitmask, sentinel value, enum label, and inline code exactly. Do not invent constraints, defaults, or behavior.
2. If `en` is empty: write a brief, cautious Simplified Chinese note inferred only from `name`, `type`, `default`, and `flags`. Use wording such as "推测" or "可能" when uncertain. Do not invent exact ranges, units, or behavior. Keep it under 60 Chinese characters.
3. Never translate or alter command/variable names or flag names.
4. Use mainland Chinese player terminology. Keep common technical terms readable.
5. Every `zh` value must contain Simplified Chinese characters, including inferred descriptions.
6. Return only JSON in this exact shape, without Markdown fences:
{"translations":[{"key":"convar:fps_max","zh":"..."}]}
"""


def utc_now() -> str:
    return (
        datetime.now(timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z")
    )


def load_json(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Missing required file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    os.replace(temporary, path)


def contains_cjk(text: str) -> bool:
    return bool(CJK_RE.search(text))


def strip_reasoning(text: str) -> str:
    return THINK_RE.sub("", text).strip()


def strip_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned


def parse_translations(text: str, expected_keys: set[str]) -> tuple[dict[str, str], set[str]]:
    cleaned = strip_fences(strip_reasoning(text))
    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start < 0 or end <= start:
            raise
        payload = json.loads(cleaned[start : end + 1])

    items = payload.get("translations") if isinstance(payload, dict) else None
    if not isinstance(items, list):
        raise RuntimeError(f"Model did not return a translations list: {cleaned[:300]!r}")

    results: dict[str, str] = {}
    for item in items:
        if not isinstance(item, dict):
            continue
        key = item.get("key")
        zh = item.get("zh")
        if isinstance(key, str) and key in expected_keys and isinstance(zh, str):
            translated = zh.strip()
            if translated:
                results[key] = translated
    return results, expected_keys - set(results)


def missing_numbers(source: str, translation: str) -> list[str]:
    return [
        number
        for number in NUMERIC_RE.findall(source)
        if number not in translation
    ]


def build_user_prompt(items: list[dict]) -> str:
    payload = [
        {
            "key": item["key"],
            "name": item["name"],
            "type": item["type"],
            "default": item.get("default"),
            "min": item.get("min"),
            "max": item.get("max"),
            "flags": item.get("flags", []),
            "en": item.get("en", ""),
        }
        for item in items
    ]
    return json.dumps(payload, ensure_ascii=False)


class Backend:
    producer = ""
    model = ""
    max_tokens = 4096
    timeout = 60

    def complete(self, system: str, user: str) -> str:
        raise NotImplementedError


class LocalBackend(Backend):
    producer = "agent-seed"

    def __init__(self) -> None:
        self.base = os.environ.get("ANTHROPIC_BASE_URL", "").rstrip("/")
        self.token = os.environ.get("ANTHROPIC_AUTH_TOKEN", "")
        self.model = (
            os.environ.get("ANTHROPIC_DEFAULT_HAIKU_MODEL")
            or os.environ.get("ANTHROPIC_DEFAULT_SONNET_MODEL")
            or ""
        )
        if not self.base or not self.token or not self.model:
            raise RuntimeError(
                "Local backend needs ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, "
                "and a model environment variable."
            )
        self.max_tokens = 8192
        self.timeout = 120

    def complete(self, system: str, user: str) -> str:
        body = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": 0.1,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }
        request = urllib.request.Request(
            self.base + "/v1/messages",
            data=json.dumps(body).encode("utf-8"),
            headers={
                "content-type": "application/json",
                "x-api-key": self.token,
                "anthropic-version": "2023-06-01",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=self.timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
        blocks = payload.get("content")
        if not isinstance(blocks, list):
            raise RuntimeError(f"Unexpected local response: {payload!r}")
        text = "".join(
            block.get("text", "")
            for block in blocks
            if isinstance(block, dict) and block.get("type") == "text"
        )
        if not text.strip():
            raise RuntimeError(f"Local model returned no text: {payload!r}")
        return text


class WorkersAIBackend(Backend):
    producer = "workers-ai"
    model = WORKERS_AI_MODEL

    def __init__(self) -> None:
        self.token = os.environ.get("CLOUDFLARE_AI_TOKEN") or os.environ.get(
            "CLOUDFLARE_API_TOKEN", ""
        )
        self.account = os.environ.get("CLOUDFLARE_ACCOUNT_ID") or os.environ.get(
            "CF_ACCOUNT_ID", ""
        )
        if not self.token or not self.account:
            raise RuntimeError(
                "Workers AI backend needs CLOUDFLARE_AI_TOKEN (or "
                "CLOUDFLARE_API_TOKEN) and CLOUDFLARE_ACCOUNT_ID."
            )
        self.max_tokens = 4096
        self.timeout = 60

    def complete(self, system: str, user: str) -> str:
        body = {
            "max_tokens": self.max_tokens,
            "temperature": 0.1,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        url = (
            "https://api.cloudflare.com/client/v4/accounts/"
            f"{self.account}/ai/run/{self.model}"
        )
        request = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "content-type": "application/json",
                "authorization": f"Bearer {self.token}",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=self.timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))

        if not payload.get("success", False):
            raise RuntimeError(f"Workers AI request failed: {payload.get('errors')!r}")
        result = payload.get("result")
        if not isinstance(result, dict):
            raise RuntimeError(f"Unexpected Workers AI result: {payload!r}")
        if isinstance(result.get("response"), str):
            return result["response"]
        choices = result.get("choices")
        if isinstance(choices, list) and choices and isinstance(choices[0], dict):
            message = choices[0].get("message")
            if isinstance(message, dict) and isinstance(message.get("content"), str):
                return message["content"]
            if isinstance(choices[0].get("text"), str):
                return choices[0]["text"]
        raise RuntimeError(f"Could not locate text in Workers AI result: {payload!r}")


def make_backend(name: str) -> Backend:
    if name == "local":
        return LocalBackend()
    if name == "workers-ai":
        return WorkersAIBackend()
    raise ValueError(f"Unknown backend: {name!r}")


def build_work_items(
    records: list[dict],
    translations: dict,
    overrides: dict,
    *,
    allow_inferred: bool,
    force: bool,
) -> list[dict]:
    items: list[dict] = []
    for record in records:
        key = record_key(record)
        override = overrides.get(key, {})
        if str(override.get("zh", "")).strip():
            continue

        description = record.get("description", "").strip()
        if not description and not allow_inferred:
            continue

        basis = "english" if description else "name-flags"
        current_hash = source_hash(description)
        existing = translations.get(key)

        if existing and not force:
            fresh = (
                existing.get("basis") == basis
                and existing.get("sourceHash") == current_hash
                and existing.get("promptVersion") == PROMPT_VERSION
                and str(existing.get("zh", "")).strip()
            )
            if fresh:
                continue

        items.append(
            {
                "key": key,
                "name": record["name"],
                "type": record["type"],
                "default": record.get("default"),
                "min": record.get("min"),
                "max": record.get("max"),
                "flags": record.get("flags", []),
                "en": description,
                "basis": basis,
                "sourceHash": current_hash,
            }
        )

    items.sort(key=lambda item: (0 if item["type"] == "convar" else 1, item["name"].lower()))
    return items


def translate_chunk(
    backend: Backend,
    items: list[dict],
    state: dict,
    *,
    depth: int = 0,
) -> dict[str, str]:
    if not items:
        return {}
    if depth > 8:
        raise RuntimeError("translation recursion exceeded depth 8")
    expected = {item["key"] for item in items}
    indent = "  " * depth
    last_error: Exception | None = None

    for attempt in range(3):
        if state["failures"] >= state["max_failures"]:
            raise RuntimeError(
                f"Failure budget of {state['max_failures']} exhausted; "
                f"{len(items)} item(s) left untranslated."
            )
        try:
            text = backend.complete(SYSTEM_PROMPT, build_user_prompt(items))
            results, missing = parse_translations(text, expected)
            invalid = {
                key: value
                for key, value in results.items()
                if not value.strip() or not contains_cjk(value)
            }
            for key in invalid:
                results.pop(key, None)
                missing.add(key)
            if invalid:
                print(
                    f"{indent}warning: {len(invalid)} translation(s) lacked Chinese; retrying"
                )

            if missing and len(items) > 1:
                missing_items = [item for item in items if item["key"] in missing]
                # A partial response is only useful if it made progress. If the
                # model rejected every item in this chunk (often because it
                # returned English instead of Chinese), recursing with the
                # identical chunk would loop forever. Raise so the bounded
                # retry/split path below takes over.
                if len(missing_items) == len(items):
                    raise RuntimeError(
                        f"model produced no usable Chinese for {len(items)} item(s)"
                    )
                print(
                    f"{indent}partial response: retrying {len(missing_items)} "
                    f"missing item(s)"
                )
                retried = translate_chunk(
                    backend, missing_items, state, depth=depth + 1
                )
                results.update(retried)
                return results

            if missing:
                raise RuntimeError(
                    f"model did not translate {sorted(missing)[:3]}"
                )

            for item in items:
                if item["basis"] != "english":
                    continue
                lost = missing_numbers(item["en"], results[item["key"]])
                if lost:
                    print(
                        f"{indent}warning: {item['key']} lost numeric token(s): "
                        f"{lost[:5]}"
                    )
            return results
        except Exception as error:  # noqa: BLE001 - retry boundary
            state["failures"] += 1
            last_error = error
            print(
                f"{indent}error translating {len(items)} item(s) "
                f"(attempt {attempt + 1}/3): {error}"
            )
            if attempt + 1 < 3:
                time.sleep(2 ** attempt)

    if len(items) == 1:
        print(f"{indent}giving up on {items[0]['key']}: {last_error}")
        return {}

    midpoint = len(items) // 2
    print(f"{indent}splitting failed batch of {len(items)} into halves")
    left = translate_chunk(backend, items[:midpoint], state, depth=depth + 1)
    right = translate_chunk(backend, items[midpoint:], state, depth=depth + 1)
    left.update(right)
    return left


def save_translations(path: Path, translations: dict) -> None:
    payload = {
        "schemaVersion": SCHEMA_VERSION,
        "promptVersion": PROMPT_VERSION,
        "records": dict(sorted(translations.items())),
    }
    write_json(path, payload)


def preflight(backend: Backend) -> int:
    samples = [
        {
            "key": "convar:sv_cheats",
            "name": "sv_cheats",
            "type": "convar",
            "default": "0",
            "min": None,
            "max": None,
            "flags": ["replicated", "release"],
            "en": "Allow cheats on server",
        },
        {
            "key": "convar:mp_freezetime",
            "name": "mp_freezetime",
            "type": "convar",
            "default": "6",
            "min": "0",
            "max": "60",
            "flags": ["game", "release"],
            "en": "How many seconds to keep players frozen when the round starts",
        },
        {
            "key": "convar:cl_crosshairstyle",
            "name": "cl_crosshairstyle",
            "type": "convar",
            "default": "2",
            "min": "0",
            "max": "5",
            "flags": ["clientdll", "archive", "release"],
            "en": "Crosshair style",
        },
        {
            "key": "convar:r_drawparticles",
            "name": "r_drawparticles",
            "type": "convar",
            "default": "1",
            "min": None,
            "max": None,
            "flags": ["clientdll", "cheat", "release"],
            "en": "Enable/disable particle rendering",
        },
        {
            "key": "convar:snd_volume",
            "name": "snd_volume",
            "type": "convar",
            "default": "1",
            "min": "0",
            "max": "1",
            "flags": ["clientdll", "archive"],
            "en": "",
        },
    ]
    for sample in samples:
        sample["basis"] = "english" if sample["en"] else "name-flags"
        sample["sourceHash"] = source_hash(sample["en"])

    print(
        f"Preflight: backend={backend.producer} model={backend.model} "
        f"max_tokens={backend.max_tokens}"
    )
    state = {"failures": 0, "max_failures": 10}
    results = translate_chunk(backend, samples, state)
    if len(results) != len(samples):
        print(
            f"error: preflight returned {len(results)}/{len(samples)} translations",
            file=sys.stderr,
        )
        return 1

    for sample in samples:
        print(f"  {sample['key']} -> {results[sample['key']]}")
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--backend",
        choices=("local", "workers-ai"),
        default="workers-ai",
        help="local = one-time seed via the session model; workers-ai = CI incremental",
    )
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument(
        "--batch-size",
        type=int,
        default=0,
        help="Items per request. Defaults to 20 (local) or 15 (workers-ai).",
    )
    parser.add_argument("--limit", type=int, default=0, help="Only process the first N items.")
    parser.add_argument("--force", action="store_true", help="Retranslate fresh entries too.")
    parser.add_argument(
        "--no-inferred",
        action="store_true",
        help="Do not generate descriptions for records with no English source.",
    )
    parser.add_argument("--preflight", action="store_true", help="Run a small quality check and exit.")
    parser.add_argument("--dry-run", action="store_true", help="Call the model but do not write.")
    parser.add_argument("--max-failures", type=int, default=30)
    parser.add_argument("--sleep", type=float, default=0.2, help="Seconds between batches.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    backend = make_backend(args.backend)

    if args.preflight:
        return preflight(backend)

    data_dir: Path = args.data_dir
    convars = load_json(data_dir / "convars.json")["records"]
    commands = load_json(data_dir / "commands.json")["records"]
    translations_payload = load_json(data_dir / "translations.json")
    translations = translations_payload.get("records", {})
    overrides = load_json(data_dir / "overrides.json").get("records", {})

    items = build_work_items(
        convars + commands,
        translations,
        overrides,
        allow_inferred=not args.no_inferred,
        force=args.force,
    )
    if args.limit:
        items = items[: args.limit]

    if not items:
        print("All eligible records already have fresh translations.")
        return 0

    batch_size = args.batch_size or (20 if args.backend == "local" else 15)
    state = {"failures": 0, "max_failures": args.max_failures}
    total = len(items)
    print(
        f"Translating {total} item(s) with {backend.producer} "
        f"({backend.model}), batch size {batch_size}"
    )

    for offset in range(0, total, batch_size):
        batch = items[offset : offset + batch_size]
        results = translate_chunk(backend, batch, state)
        if results:
            timestamp = utc_now()
            for item in batch:
                zh = results.get(item["key"])
                if not zh:
                    continue
                translations[item["key"]] = {
                    "zh": zh,
                    "basis": item["basis"],
                    "sourceHash": item["sourceHash"],
                    "producer": backend.producer,
                    "model": backend.model,
                    "promptVersion": PROMPT_VERSION,
                    "translatedAt": timestamp,
                }
            if not args.dry_run:
                save_translations(data_dir / "translations.json", translations)
        done = min(offset + batch_size, total)
        print(f"  {done}/{total} processed", flush=True)
        if args.sleep and done < total:
            time.sleep(args.sleep)

    if args.dry_run:
        print("--dry-run: translations were not written.")
    else:
        print(f"Saved {len(translations)} translation(s) to {data_dir / 'translations.json'}")
    return 0 if state["failures"] < state["max_failures"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # noqa: BLE001 - CLI boundary
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1)
