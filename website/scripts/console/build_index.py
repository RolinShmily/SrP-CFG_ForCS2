#!/usr/bin/env python3
"""Merge upstream facts, translations, and overrides into the search index.

The index is the only console artifact served to the browser. It is generated,
not hand-edited. Detail-page loaders should read the canonical data files at
build time instead of this reduced index.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from parse_upstream import record_key, source_hash

SCHEMA_VERSION = 1
DEFAULT_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "console"
DEFAULT_OUTPUT = Path(__file__).resolve().parents[2] / "public" / "data" / "console-index.json"
SUMMARY_LIMIT = 120
INTERNAL_FLAGS = {"developmentonly", "defensive"}

# Deterministic fallback categories. Overrides always win. This is deliberately
# not an AI decision: category assignment must be reproducible and reviewable.
CATEGORY_PREFIXES = (
    ("graphics", ("r_", "fps_", "mat_", "vid_", "cl_showfps")),
    ("audio", ("snd_", "volume", "voice_", "play", "adsp_", "dsp_")),
    ("network", ("cl_interp", "rate", "net_", "cl_net")),
    ("mouse", ("m_", "sensitivity", "zoom_sensitivity", "joystick", "in_")),
    ("practice", ("bot_", "sv_grenade", "mp_")),
    ("system", ("bind", "key_", "alias", "con_", "host_", "exec", "echo")),
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


def normalize_name(name: str) -> str:
    return name.lstrip("+-").lower()


def heuristic_category(record: dict) -> str:
    if any(flag.lower() == "cheat" for flag in record.get("flags", [])):
        return "cheats"

    name = normalize_name(record["name"])
    if name.startswith(("cl_crosshair", "crosshair", "cl_viewmodel", "viewmodel", "cl_hud", "hud_")):
        return "gameplay"
    for category, prefixes in CATEGORY_PREFIXES:
        if name.startswith(prefixes):
            return category
    return "system"


def truncate_summary(text: str) -> str:
    compact = " ".join(text.split())
    if len(compact) <= SUMMARY_LIMIT:
        return compact
    return compact[: SUMMARY_LIMIT - 1].rstrip() + "…"


def translation_status(
    record: dict,
    translation: dict | None,
    override: dict,
) -> tuple[str, str, bool, str]:
    """Return (status, basis, inferred, zh)."""
    override_zh = str(override.get("zh", "")).strip()
    if override_zh:
        return "human-edited", "human", False, override_zh

    if not translation:
        return "missing", "", False, ""

    zh = str(translation.get("zh", "")).strip()
    basis = str(translation.get("basis", ""))
    description = record.get("description", "").strip()
    if basis == "name-flags":
        if description:
            return "stale", basis, False, zh
        return "inferred", basis, True, zh
    if basis != "english":
        return "stale", basis, False, zh
    if not description:
        return "stale", basis, False, zh
    if translation.get("sourceHash") != source_hash(record.get("description", "")):
        return "stale", basis, False, zh
    return "translated", basis, False, zh


def build_index(data_dir: Path) -> dict:
    convars = load_json(data_dir / "convars.json")["records"]
    commands = load_json(data_dir / "commands.json")["records"]
    translations = load_json(data_dir / "translations.json").get("records", {})
    overrides = load_json(data_dir / "overrides.json").get("records", {})
    categories = load_json(data_dir / "categories.json")["categories"]
    metadata = load_json(data_dir / "metadata.json")

    records = []
    counts = {
        "total": 0,
        "convars": 0,
        "commands": 0,
        "withEnglish": 0,
        "withoutEnglish": 0,
        "translated": 0,
        "humanEdited": 0,
        "inferred": 0,
        "stale": 0,
        "missing": 0,
        "indexable": 0,
    }

    for record in convars + commands:
        key = record_key(record)
        translation = translations.get(key)
        override = overrides.get(key, {})
        status, basis, inferred, zh = translation_status(record, translation, override)
        description = record.get("description", "")
        has_english = bool(description.strip())
        internal = any(
            flag.lower() in INTERNAL_FLAGS for flag in record.get("flags", [])
        )
        category = override.get("category") or heuristic_category(record)
        indexable = (
            status in {"translated", "human-edited"} and not internal and bool(zh)
        )

        summary = truncate_summary(
            zh
            if status in {"translated", "human-edited", "inferred"}
            else description
        )
        records.append(
            {
                "key": key,
                "name": record["name"],
                "type": record["type"],
                "category": category,
                "flags": record.get("flags", []),
                "default": record.get("default"),
                "summary": summary,
                "translationStatus": status,
                "basis": basis,
                "inferred": inferred,
                "indexable": indexable,
            }
        )

        counts["total"] += 1
        counts["convars" if record["type"] == "convar" else "commands"] += 1
        counts["withEnglish" if has_english else "withoutEnglish"] += 1
        counts["indexable"] += int(indexable)
        counts[
            {
                "translated": "translated",
                "human-edited": "humanEdited",
                "inferred": "inferred",
                "stale": "stale",
                "missing": "missing",
            }[status]
        ] += 1

    records.sort(key=lambda item: (0 if item["type"] == "convar" else 1, item["name"].lower()))

    upstream = metadata.get("upstream", {})
    return {
        "schemaVersion": SCHEMA_VERSION,
        "upstream": {
            "repository": upstream.get("repository"),
            "commit": upstream.get("commit"),
            "fetchedAt": upstream.get("fetchedAt"),
        },
        "categories": [
            {"slug": item["slug"], "zh": item["zh"], "en": item["en"]}
            for item in categories
        ],
        "counts": counts,
        "records": records,
    }


def compare_index(expected: dict, actual: dict) -> list[str]:
    problems: list[str] = []
    if expected.get("schemaVersion") != actual.get("schemaVersion"):
        problems.append("schemaVersion differs")
    if expected.get("upstream") != actual.get("upstream"):
        problems.append("upstream commit differs")
    if expected.get("categories") != actual.get("categories"):
        problems.append("category table differs")
    if expected.get("counts") != actual.get("counts"):
        problems.append(
            f"counts differ: expected {expected.get('counts')}, actual {actual.get('counts')}"
        )

    expected_records = {item["key"]: item for item in expected.get("records", [])}
    actual_records = {item["key"]: item for item in actual.get("records", [])}
    missing = sorted(set(expected_records) - set(actual_records))
    extra = sorted(set(actual_records) - set(expected_records))
    if missing:
        problems.append(f"missing keys in index: {missing[:10]}")
    if extra:
        problems.append(f"extra keys in index: {extra[:10]}")
    if not missing and not extra:
        changed = [
            key
            for key in expected_records
            if expected_records[key] != actual_records[key]
        ]
        if changed:
            problems.append(f"{len(changed)} record(s) differ, e.g. {changed[:10]}")
    return problems


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail if the committed index differs from the generated one.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    index = build_index(args.data_dir)

    if args.check:
        if not args.output.exists():
            print(f"error: index does not exist: {args.output}", file=sys.stderr)
            return 1
        actual = json.loads(args.output.read_text(encoding="utf-8"))
        problems = compare_index(index, actual)
        if problems:
            for problem in problems:
                print(f"error: {problem}", file=sys.stderr)
            return 1
        print(f"OK: {args.output} is up to date")
        return 0

    write_json(args.output, index)
    counts = index["counts"]
    print(
        f"Wrote {counts['total']} records to {args.output}\n"
        f"  translated: {counts['translated']}, human-edited: {counts['humanEdited']}, "
        f"inferred: {counts['inferred']}, stale: {counts['stale']}, "
        f"missing: {counts['missing']}, indexable: {counts['indexable']}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # noqa: BLE001 - CLI boundary
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1)
