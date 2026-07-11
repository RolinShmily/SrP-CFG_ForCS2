#!/usr/bin/env python3
"""Parse the single v3 Runtime Core package into packages.json for CI."""

from __future__ import annotations

import json
from pathlib import Path

import yaml


CONFIG_PATH = Path(".github/packages.yaml")
OUTPUT_PATH = Path("packages.json")
EXPECTED_PACKAGES = {"runtime_core"}
EXPECTED_ZIP_NAME = "SrP-CFG_Runtime_Core"


def main() -> None:
    config = yaml.safe_load(CONFIG_PATH.read_text(encoding="utf-8")) or {}
    packages = config.get("packages")
    if not isinstance(packages, dict) or set(packages) != EXPECTED_PACKAGES:
        found = sorted(packages) if isinstance(packages, dict) else packages
        raise ValueError(
            f"v3 must define only runtime_core; found {found!r}"
        )

    package = packages["runtime_core"]
    if package.get("zip_name") != EXPECTED_ZIP_NAME:
        raise ValueError(
            f"runtime_core.zip_name must be {EXPECTED_ZIP_NAME!r}"
        )
    files = package.get("files")
    if not isinstance(files, list) or not files or not all(isinstance(item, str) for item in files):
        raise ValueError("runtime_core.files must be a non-empty string list")

    output = [{
        "name": "runtime_core",
        "zip_name": EXPECTED_ZIP_NAME,
        "display_name": package.get("display_name", "Runtime Core"),
        "description": package.get("description", ""),
        "files": list(dict.fromkeys(files)),
    }]
    OUTPUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print("Parsed the runtime_core package")


if __name__ == "__main__":
    main()
