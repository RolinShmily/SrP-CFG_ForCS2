#!/usr/bin/env python3
"""Fetch and normalize the upstream CS2 ConVar/Command dump.

This script only maintains upstream facts. Translation is a separate command
(translate.py) so a model outage cannot corrupt or block the fact layer.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

from parse_upstream import ParsedFile, parse_upstream, source_hash

REPOSITORY = "SteamTracking/GameTracking-CS2"
FILES = {
    "convar": "DumpSource2/convars.txt",
    "command": "DumpSource2/commands.txt",
}
SCHEMA_VERSION = 1
BOM = "﻿"
DEFAULT_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "console"


def utc_now() -> str:
    return (
        datetime.now(timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z")
    )


def load_json(path: Path) -> dict | None:
    if not path.exists():
        return None
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


def fetch_bytes(url: str, *, headers: dict | None = None, attempts: int = 3) -> bytes:
    request_headers = {
        "User-Agent": "srp-cfg-console-sync/1.0",
        "Accept": "*/*",
    }
    if headers:
        request_headers.update(headers)

    last_error: Exception | None = None
    for attempt in range(attempts):
        request = urllib.request.Request(url, headers=request_headers)
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError) as error:
            last_error = error
            if attempt + 1 < attempts:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"GET {url} failed after {attempts} attempts: {last_error}")


def latest_commit_for_path(path: str, headers: dict) -> dict:
    url = (
        f"https://api.github.com/repos/{REPOSITORY}/commits"
        f"?path={quote(path, safe='/')}&per_page=1"
    )
    payload = json.loads(fetch_bytes(url, headers=headers).decode("utf-8"))
    if not isinstance(payload, list) or not payload:
        raise RuntimeError(f"Unexpected GitHub commit payload for {path}: {payload!r}")
    return payload[0]


def resolve_latest_commit() -> str:
    """Resolve the newest commit touching either dump file.

    Using `path=DumpSource2` would also pick up schema-only commits and create
    empty data commits. Querying the two files keeps the snapshot tied to an
    actual ConVar/Command change.
    """
    token = os.environ.get("GITHUB_TOKEN")
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    commits = [latest_commit_for_path(path, headers) for path in FILES.values()]
    newest = max(
        commits,
        key=lambda item: item.get("commit", {})
        .get("committer", {})
        .get("date", ""),
    )
    return newest["sha"]


def fetch_dump(commit: str, path: str) -> str:
    url = f"https://raw.githubusercontent.com/{REPOSITORY}/{commit}/{path}"
    return fetch_bytes(url).decode("utf-8").lstrip(BOM)


def read_payloads(data_dir: Path) -> tuple[dict | None, dict | None]:
    return (
        load_json(data_dir / "convars.json"),
        load_json(data_dir / "commands.json"),
    )


def count_english(records: list[dict]) -> tuple[int, int]:
    with_english = sum(bool(record["description"].strip()) for record in records)
    return with_english, len(records) - with_english


def prune_translations(data_dir: Path, records: list[dict]) -> int:
    """Drop translations for records that no longer exist upstream.

    Removed records are recoverable from git history. Keeping orphan keys would
    make validate.py fail forever after an upstream deletion.
    """
    path = data_dir / "translations.json"
    payload = load_json(path)
    if not payload:
        return 0

    valid = {f"{record['type']}:{record['name']}" for record in records}
    existing = payload.get("records", {})
    kept = {key: existing[key] for key in sorted(existing) if key in valid}
    removed = len(existing) - len(kept)
    if removed:
        payload["records"] = kept
        write_json(path, payload)
    return removed


def build_metadata(
    commit: str,
    parsed: dict[str, ParsedFile],
) -> dict:
    convars = parsed["convar"].records
    commands = parsed["command"].records
    all_records = convars + commands
    with_english, without_english = count_english(all_records)

    return {
        "schemaVersion": SCHEMA_VERSION,
        "upstream": {
            "repository": REPOSITORY,
            "commit": commit,
            "fetchedAt": utc_now(),
            "files": {
                "convars": {
                    "path": FILES["convar"],
                    "sha256": parsed["convar"].sha256,
                    "bytes": parsed["convar"].byte_length,
                    "records": len(convars),
                },
                "commands": {
                    "path": FILES["command"],
                    "sha256": parsed["command"].sha256,
                    "bytes": parsed["command"].byte_length,
                    "records": len(commands),
                },
            },
        },
        "counts": {
            "total": len(all_records),
            "convars": len(convars),
            "commands": len(commands),
            "withEnglish": with_english,
            "withoutEnglish": without_english,
        },
    }


def print_summary(metadata: dict, *, prefix: str = "") -> None:
    counts = metadata["counts"]
    upstream = metadata["upstream"]
    print(
        f"{prefix}upstream {upstream['repository']} @ {upstream['commit']}\n"
        f"{prefix}  ConVars : {counts['convars']}\n"
        f"{prefix}  Commands: {counts['commands']}\n"
        f"{prefix}  Total   : {counts['total']}\n"
        f"{prefix}  English : {counts['withEnglish']}\n"
        f"{prefix}  Missing : {counts['withoutEnglish']}"
    )


def existing_counts(data_dir: Path) -> dict | None:
    metadata = load_json(data_dir / "metadata.json")
    if not metadata:
        return None
    counts = metadata.get("counts")
    return counts if isinstance(counts, dict) else None


def check_drop_guard(
    previous: dict | None,
    current: dict,
    *,
    allow_large_changes: bool,
) -> None:
    if allow_large_changes or not previous:
        return
    for key in ("convars", "commands", "total"):
        old = int(previous.get(key, 0))
        new = int(current.get(key, 0))
        if old and new < old * 0.8:
            raise RuntimeError(
                f"Refusing to write: {key} dropped from {old} to {new} "
                "(more than 20%). Re-run with --allow-large-changes after "
                "checking the upstream format."
            )


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=DEFAULT_DATA_DIR,
        help="Directory containing convars.json / commands.json / metadata.json",
    )
    parser.add_argument(
        "--commit",
        help="Upstream commit SHA. Defaults to the latest commit touching DumpSource2.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fetch and parse, print counts, but do not write files.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Process even when the upstream commit matches metadata.json.",
    )
    parser.add_argument(
        "--allow-large-changes",
        action="store_true",
        help="Allow a >20%% drop in record counts.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    data_dir: Path = args.data_dir
    data_dir.mkdir(parents=True, exist_ok=True)

    previous_metadata = load_json(data_dir / "metadata.json")
    previous_commit = (
        previous_metadata.get("upstream", {}).get("commit")
        if previous_metadata
        else None
    )

    commit = args.commit or resolve_latest_commit()
    if not args.force and not args.check and commit == previous_commit:
        print(f"Upstream commit {commit} already synced; nothing to do.")
        return 0

    print(f"Fetching {REPOSITORY} @ {commit} ...")
    convars_text = fetch_dump(commit, FILES["convar"])
    commands_text = fetch_dump(commit, FILES["command"])
    parsed = parse_upstream(convars_text, commands_text)
    for kind in parsed.values():
        kind.records.sort(key=lambda record: record["name"].lower())
    metadata = build_metadata(commit, parsed)

    check_drop_guard(
        existing_counts(data_dir),
        metadata["counts"],
        allow_large_changes=args.allow_large_changes,
    )

    print_summary(metadata)

    if args.check:
        previous = existing_counts(data_dir)
        if previous:
            print(
                "Previous counts: "
                f"{previous.get('total')} total "
                f"({previous.get('convars')} convars, "
                f"{previous.get('commands')} commands)"
            )
        print("--check: no files written.")
        return 0

    convars_payload = {
        "schemaVersion": SCHEMA_VERSION,
        "type": "convar",
        "records": parsed["convar"].records,
    }
    commands_payload = {
        "schemaVersion": SCHEMA_VERSION,
        "type": "command",
        "records": parsed["command"].records,
    }

    write_json(data_dir / "convars.json", convars_payload)
    write_json(data_dir / "commands.json", commands_payload)

    all_records = parsed["convar"].records + parsed["command"].records
    removed = prune_translations(data_dir, all_records)
    if removed:
        print(f"Pruned {removed} translation(s) for removed upstream records.")

    write_json(data_dir / "metadata.json", metadata)
    print(f"Wrote {len(all_records)} records to {data_dir}")

    stale = 0
    translations = load_json(data_dir / "translations.json")
    if translations:
        records_by_key = {
            f"{record['type']}:{record['name']}": record for record in all_records
        }
        for key, entry in translations.get("records", {}).items():
            record = records_by_key.get(key)
            if record and entry.get("sourceHash") != source_hash(
                record["description"]
            ):
                stale += 1
        if stale:
            print(
                f"{stale} translation(s) are stale and will be refreshed by "
                "translate.py."
            )

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # noqa: BLE001 - CLI boundary
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1)
