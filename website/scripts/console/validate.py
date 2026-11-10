#!/usr/bin/env python3
"""Validate the committed console dataset.

The validator is the contract between the upstream fact layer, the translation
cache, human overrides, and the generated search index. It runs without network
access in CI.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from parse_upstream import NAME_RE, NUMBER_RE, record_key, source_hash

SCHEMA_VERSION = 1
DEFAULT_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "console"
SHA256_RE = re.compile(r"^sha256:[0-9a-f]{64}$")
KEY_RE = re.compile(r"^(convar|command):(.+)$")
CJK_RE = re.compile(r"[㐀-䶿一-鿿]")
PRODUCERS = {"agent-seed", "workers-ai"}
BASES = {"english", "name-flags"}
STATUSES = {"human-edited", "translated", "inferred", "stale", "missing"}


def load_json(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Missing required file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def contains_cjk(text: str) -> bool:
    return bool(CJK_RE.search(text))


def load_records(data_dir: Path, kind: str) -> list[dict]:
    filename = "convars.json" if kind == "convar" else "commands.json"
    payload = load_json(data_dir / filename)
    if payload.get("schemaVersion") != SCHEMA_VERSION:
        raise ValueError(f"{filename}: unsupported schemaVersion")
    if payload.get("type") != kind:
        raise ValueError(f"{filename}: expected type {kind!r}")
    records = payload.get("records")
    if not isinstance(records, list):
        raise ValueError(f"{filename}: records must be a list")
    return records


def validate_records(records: list[dict], kind: str) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    seen: set[str] = set()

    for index, record in enumerate(records):
        label = f"{kind}[{index}]"
        if not isinstance(record, dict):
            errors.append(f"{label}: record must be an object")
            continue

        name = record.get("name")
        if not isinstance(name, str) or not name:
            errors.append(f"{label}: missing name")
            continue
        label = f"{kind}:{name}"

        if record.get("type") != kind:
            errors.append(f"{label}: type must be {kind!r}")
        if name in seen:
            errors.append(f"{label}: duplicate name")
        seen.add(name)
        if not NAME_RE.fullmatch(name):
            errors.append(f"{label}: invalid name characters")

        flags = record.get("flags")
        if not isinstance(flags, list) or any(
            not isinstance(flag, str) or not flag for flag in flags
        ):
            errors.append(f"{label}: flags must be a list of non-empty strings")
        else:
            for flag in flags:
                if flag.rstrip(":").lower() in {"min", "max"}:
                    errors.append(f"{label}: bound leaked into flags: {flag!r}")

        description = record.get("description")
        if not isinstance(description, str):
            errors.append(f"{label}: description must be a string")
        elif "<no description>" in description:
            errors.append(f"{label}: placeholder description was not normalized")

        if kind == "convar":
            default = record.get("default")
            if not isinstance(default, str):
                errors.append(f"{label}: convar default must be a string")
            for bound in ("min", "max"):
                value = record.get(bound)
                if value is not None and (
                    not isinstance(value, str) or not NUMBER_RE.fullmatch(value)
                ):
                    errors.append(f"{label}: {bound} must be a numeric string or null")
        else:
            for unexpected in ("default", "min", "max"):
                if unexpected in record:
                    errors.append(f"{label}: command must not have {unexpected!r}")

    return errors, warnings


def validate_translations(
    translations: dict,
    records_by_key: dict[str, dict],
    *,
    allow_stale: bool = False,
) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if translations.get("schemaVersion") != SCHEMA_VERSION:
        errors.append("translations.json: unsupported schemaVersion")
    if not isinstance(translations.get("promptVersion"), str):
        errors.append("translations.json: promptVersion must be a string")
    entries = translations.get("records")
    if not isinstance(entries, dict):
        errors.append("translations.json: records must be an object")
        return errors, warnings

    for key, entry in entries.items():
        label = f"translation {key}"
        match = KEY_RE.fullmatch(key)
        if not match:
            errors.append(f"{label}: key must look like convar:name or command:name")
            continue
        record = records_by_key.get(key)
        if record is None:
            errors.append(f"{label}: no matching upstream record")
            continue

        if not isinstance(entry, dict):
            errors.append(f"{label}: entry must be an object")
            continue

        zh = entry.get("zh")
        if not isinstance(zh, str) or not zh.strip():
            errors.append(f"{label}: zh must be a non-empty string")
        elif not contains_cjk(zh):
            errors.append(f"{label}: zh contains no Chinese characters")

        basis = entry.get("basis")
        if basis not in BASES:
            errors.append(f"{label}: basis must be one of {sorted(BASES)}")
            continue

        source = record.get("description", "")
        has_english = bool(source.strip())
        if basis == "english" and not has_english:
            message = f"{label}: basis=english but the upstream description is empty"
            if allow_stale:
                warnings.append(message)
            else:
                errors.append(message)
        if basis == "name-flags" and has_english:
            message = (
                f"{label}: basis=name-flags but the upstream description is not empty"
            )
            if allow_stale:
                warnings.append(message)
            else:
                errors.append(message)

        expected_hash = source_hash(source)
        if basis == "english":
            if entry.get("sourceHash") != expected_hash:
                message = f"{label}: sourceHash is stale; run translate.py to refresh it"
                if allow_stale:
                    warnings.append(message)
                else:
                    errors.append(message)
        elif entry.get("sourceHash") is not None:
            errors.append(f"{label}: name-flags entries must not carry sourceHash")

        producer = entry.get("producer")
        if producer not in PRODUCERS:
            errors.append(f"{label}: producer must be one of {sorted(PRODUCERS)}")
        for field in ("model", "promptVersion", "translatedAt"):
            if not isinstance(entry.get(field), str) or not entry[field].strip():
                errors.append(f"{label}: {field} must be a non-empty string")

        if isinstance(zh, str) and len(zh) > 300:
            warnings.append(f"{label}: translation is unusually long ({len(zh)} chars)")

    return errors, warnings


def validate_overrides(
    overrides: dict,
    records_by_key: dict[str, dict],
    category_slugs: set[str],
) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if overrides.get("schemaVersion") != SCHEMA_VERSION:
        errors.append("overrides.json: unsupported schemaVersion")
    entries = overrides.get("records")
    if not isinstance(entries, dict):
        errors.append("overrides.json: records must be an object")
        return errors, warnings

    for key, entry in entries.items():
        label = f"override {key}"
        if not KEY_RE.fullmatch(key):
            errors.append(f"{label}: key must look like convar:name or command:name")
            continue
        if key not in records_by_key:
            errors.append(f"{label}: no matching upstream record")
            continue
        if not isinstance(entry, dict):
            errors.append(f"{label}: entry must be an object")
            continue

        if "zh" in entry:
            zh = entry["zh"]
            if not isinstance(zh, str) or not zh.strip():
                errors.append(f"{label}: zh must be a non-empty string")
            elif not contains_cjk(zh):
                errors.append(f"{label}: zh contains no Chinese characters")

        if "category" in entry and entry["category"] not in category_slugs:
            errors.append(
                f"{label}: unknown category {entry['category']!r}; "
                f"expected one of {sorted(category_slugs)}"
            )

        if "note" in entry and not isinstance(entry["note"], str):
            errors.append(f"{label}: note must be a string")

        unknown = set(entry) - {"zh", "category", "note"}
        if unknown:
            warnings.append(f"{label}: unknown override field(s): {sorted(unknown)}")

    return errors, warnings


def validate_categories(categories: dict) -> tuple[list[str], list[str], set[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    if categories.get("schemaVersion") != SCHEMA_VERSION:
        errors.append("categories.json: unsupported schemaVersion")
    items = categories.get("categories")
    if not isinstance(items, list):
        errors.append("categories.json: categories must be a list")
        return errors, warnings, set()

    slugs: set[str] = set()
    for index, item in enumerate(items):
        label = f"category[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{label}: must be an object")
            continue
        slug = item.get("slug")
        if not isinstance(slug, str) or not slug:
            errors.append(f"{label}: missing slug")
            continue
        if slug in slugs:
            errors.append(f"{label}: duplicate slug {slug!r}")
        slugs.add(slug)
        for field in ("zh", "en"):
            if not isinstance(item.get(field), str) or not item[field].strip():
                errors.append(f"{label}: {field} must be a non-empty string")
    return errors, warnings, slugs


def validate_metadata(metadata: dict, records_by_kind: dict[str, list[dict]]) -> list[str]:
    errors: list[str] = []
    if metadata.get("schemaVersion") != SCHEMA_VERSION:
        errors.append("metadata.json: unsupported schemaVersion")
    upstream = metadata.get("upstream")
    if not isinstance(upstream, dict):
        return errors + ["metadata.json: upstream must be an object"]
    for field in ("repository", "commit", "fetchedAt"):
        if not isinstance(upstream.get(field), str) or not upstream[field].strip():
            errors.append(f"metadata.json: upstream.{field} must be a non-empty string")

    files = upstream.get("files")
    if not isinstance(files, dict):
        return errors + ["metadata.json: upstream.files must be an object"]
    for name, kind in (("convars", "convar"), ("commands", "command")):
        entry = files.get(name)
        if not isinstance(entry, dict):
            errors.append(f"metadata.json: upstream.files.{name} missing")
            continue
        if not isinstance(entry.get("path"), str) or not entry["path"]:
            errors.append(f"metadata.json: upstream.files.{name}.path missing")
        if not isinstance(entry.get("sha256"), str) or not SHA256_RE.fullmatch(
            entry["sha256"]
        ):
            errors.append(f"metadata.json: upstream.files.{name}.sha256 invalid")
        if not isinstance(entry.get("bytes"), int) or entry["bytes"] <= 0:
            errors.append(f"metadata.json: upstream.files.{name}.bytes invalid")
        if entry.get("records") != len(records_by_kind[kind]):
            errors.append(
                f"metadata.json: upstream.files.{name}.records does not match "
                f"{len(records_by_kind[kind])} parsed records"
            )

    counts = metadata.get("counts")
    if not isinstance(counts, dict):
        return errors + ["metadata.json: counts must be an object"]
    expected = {
        "convars": len(records_by_kind["convar"]),
        "commands": len(records_by_kind["command"]),
        "total": len(records_by_kind["convar"]) + len(records_by_kind["command"]),
    }
    for key, value in expected.items():
        if counts.get(key) != value:
            errors.append(
                f"metadata.json: counts.{key} is {counts.get(key)!r}, expected {value}"
            )
    with_english = sum(
        bool(record["description"].strip())
        for records in records_by_kind.values()
        for record in records
    )
    if counts.get("withEnglish") != with_english:
        errors.append(
            f"metadata.json: counts.withEnglish is {counts.get('withEnglish')!r}, "
            f"expected {with_english}"
        )
    if counts.get("withoutEnglish") != expected["total"] - with_english:
        errors.append("metadata.json: counts.withoutEnglish is inconsistent")

    return errors


def validate_all(
    data_dir: Path = DEFAULT_DATA_DIR,
    *,
    allow_stale: bool = False,
) -> tuple[list[str], list[str]]:
    convars = load_records(data_dir, "convar")
    commands = load_records(data_dir, "command")
    records_by_kind = {"convar": convars, "command": commands}
    records_by_key = {
        record_key(record): record for record in convars + commands
    }

    categories_payload = load_json(data_dir / "categories.json")
    category_errors, category_warnings, category_slugs = validate_categories(
        categories_payload
    )

    errors: list[str] = []
    warnings: list[str] = []
    for kind, records in records_by_kind.items():
        item_errors, item_warnings = validate_records(records, kind)
        errors.extend(item_errors)
        warnings.extend(item_warnings)

    translation_errors, translation_warnings = validate_translations(
        load_json(data_dir / "translations.json"),
        records_by_key,
        allow_stale=allow_stale,
    )
    override_errors, override_warnings = validate_overrides(
        load_json(data_dir / "overrides.json"), records_by_key, category_slugs
    )
    metadata_errors = validate_metadata(
        load_json(data_dir / "metadata.json"), records_by_kind
    )

    errors.extend(category_errors + translation_errors + override_errors + metadata_errors)
    warnings.extend(category_warnings + translation_warnings + override_warnings)
    return errors, warnings


def print_report(errors: list[str], warnings: list[str]) -> None:
    for warning in warnings:
        print(f"warning: {warning}")
    for error in errors:
        print(f"error: {error}")
    if errors:
        print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")
    else:
        print(f"OK: dataset is valid ({len(warnings)} warning(s))")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=DEFAULT_DATA_DIR,
        help="Directory containing the console dataset",
    )
    parser.add_argument(
        "--allow-stale",
        action="store_true",
        help="Report stale translations as warnings instead of errors (sync workflow)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        errors, warnings = validate_all(args.data_dir, allow_stale=args.allow_stale)
    except Exception as error:  # noqa: BLE001 - CLI boundary
        print(f"error: {error}", file=sys.stderr)
        return 1
    print_report(errors, warnings)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
