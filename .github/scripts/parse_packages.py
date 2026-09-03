#!/usr/bin/env python3
"""Parse decoupled components into packages.json for CI."""

from __future__ import annotations

import json
from pathlib import Path

import yaml


CONFIG_PATH = Path(".github/packages.yaml")
OUTPUT_PATH = Path("packages.json")


def main() -> None:
    config = yaml.safe_load(CONFIG_PATH.read_text(encoding="utf-8")) or {}
    packages = config.get("packages")
    if not isinstance(packages, dict):
        raise ValueError("packages must be a dictionary")

    output = []
    for pkg_name, pkg in packages.items():
        zip_name = pkg.get("zip_name", f"SrP-CFG_{pkg_name}")
        files = pkg.get("files", [])
        output.append({
            "name": pkg_name,
            "zip_name": zip_name,
            "display_name": pkg.get("display_name", pkg_name),
            "description": pkg.get("description", ""),
            "files": list(dict.fromkeys(files)),
        })

    OUTPUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Parsed {len(output)} packages: {[p['name'] for p in output]}")


if __name__ == "__main__":
    main()
