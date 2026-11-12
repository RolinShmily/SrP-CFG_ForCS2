#!/usr/bin/env python3
"""
Extract version release notes and bilingual summaries from CHANGELOG.md for CI release and manifests.
Usage:
  python scripts/extract_changelog.py --version 3.4.9 --body-file dist/release_notes.md
  python scripts/extract_changelog.py --version 3.4.9 --notes-zh
  python scripts/extract_changelog.py --version 3.4.9 --notes-en
  python scripts/extract_changelog.py --check
"""

import argparse
import io
import json
from pathlib import Path
import re
import sys

# Ensure UTF-8 output on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

REPO = Path(__file__).resolve().parent.parent
CHANGELOG_PATH = REPO / "CHANGELOG.md"

SECTION_HEADER_RE = re.compile(r"^##\s+\[?v?([0-9]+\.[0-9]+\.[0-9]+)\]?(?:\s*-\s*([^\n]+))?", re.MULTILINE)
ZH_SUMMARY_RE = re.compile(r"^>\s*(?:\*\*)?zh(?:\*\*)?:\s*(.+)$", re.MULTILINE | re.IGNORECASE)
EN_SUMMARY_RE = re.compile(r"^>\s*(?:\*\*)?en(?:\*\*)?:\s*(.+)$", re.MULTILINE | re.IGNORECASE)


def parse_changelog(content: str):
    matches = list(SECTION_HEADER_RE.finditer(content))
    sections = {}
    for i, match in enumerate(matches):
        ver = match.group(1)
        date_str = match.group(2) or ""
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        raw_body = content[match.end():end].strip()

        zh_match = ZH_SUMMARY_RE.search(raw_body)
        en_match = EN_SUMMARY_RE.search(raw_body)

        zh_summary = zh_match.group(1).strip() if zh_match else f"SrP-CFG v{ver} 发布"
        en_summary = en_match.group(1).strip() if en_match else f"SrP-CFG v{ver} Release"

        # Remove trailing markdown references/dividers if at end of file
        body = content[start:end].strip()

        sections[ver] = {
            "version": ver,
            "date": date_str.strip(),
            "notes_zh": zh_summary,
            "notes_en": en_summary,
            "body": body,
            "content_only": raw_body,
        }
    return sections


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--changelog", type=Path, default=CHANGELOG_PATH)
    parser.add_argument("--version", type=str, help="Target SemVer version (e.g. 3.4.9 or v3.4.9)")
    parser.add_argument("--notes-zh", action="store_true", help="Print Chinese summary")
    parser.add_argument("--notes-en", action="store_true", help="Print English summary")
    parser.add_argument("--body-file", type=Path, help="Write full release markdown to file")
    parser.add_argument("--json", action="store_true", help="Output JSON metadata")
    parser.add_argument("--check", action="store_true", help="Validate CHANGELOG structure")
    args = parser.parse_args()

    if not args.changelog.is_file():
        print(f"Error: CHANGELOG file not found at {args.changelog}", file=sys.stderr)
        sys.exit(1)

    text = args.changelog.read_text(encoding="utf-8")
    sections = parse_changelog(text)

    if args.check:
        if not sections:
            print("Error: No version sections found in CHANGELOG.md", file=sys.stderr)
            sys.exit(1)
        for ver, data in sections.items():
            if not data["notes_zh"] or not data["notes_en"]:
                print(f"Warning: Version {ver} missing bilingual summary blockquotes", file=sys.stderr)
        print(f"PASS: {len(sections)} version sections parsed in {args.changelog.name}")
        return

    if not args.version:
        print("Error: --version or --check must be specified", file=sys.stderr)
        sys.exit(1)

    clean_ver = args.version.lstrip("v").strip()
    if clean_ver not in sections:
        # Fallback if version section not found
        fallback_zh = f"SrP-CFG v{clean_ver} 发布"
        fallback_en = f"SrP-CFG v{clean_ver} Release"
        fallback_body = f"## [{clean_ver}]\n\n{fallback_en}\n"
        if args.notes_zh:
            print(fallback_zh)
            return
        if args.notes_en:
            print(fallback_en)
            return
        if args.body_file:
            args.body_file.parent.mkdir(parents=True, exist_ok=True)
            args.body_file.write_text(fallback_body, encoding="utf-8")
            return
        if args.json:
            print(json.dumps({
                "version": clean_ver,
                "notes_zh": fallback_zh,
                "notes_en": fallback_en,
                "body": fallback_body,
            }, ensure_ascii=False))
            return
        print(f"Warning: Version {clean_ver} not found in {args.changelog.name}", file=sys.stderr)
        sys.exit(1)

    entry = sections[clean_ver]

    if args.notes_zh:
        print(entry["notes_zh"])
        return
    if args.notes_en:
        print(entry["notes_en"])
        return
    if args.body_file:
        args.body_file.parent.mkdir(parents=True, exist_ok=True)
        args.body_file.write_text(entry["body"] + "\n", encoding="utf-8")
        return
    if args.json:
        print(json.dumps(entry, ensure_ascii=False, indent=2))
        return

    print(entry["body"])


if __name__ == "__main__":
    main()
