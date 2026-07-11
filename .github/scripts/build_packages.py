#!/usr/bin/env python3
"""Build SrP-CFG release ZIPs from packages.json without shell-dependent commands."""

from __future__ import annotations

import json
import os
from pathlib import Path, PurePosixPath
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path.cwd()


def iter_files(source: Path):
    if source.is_file():
        yield source
        return
    if source.is_dir():
        yield from sorted(path for path in source.rglob("*") if path.is_file())
        return
    raise FileNotFoundError(source)


def common_base(paths: list[Path]) -> Path:
    existing = [path for path in paths if path.exists()]
    if not existing:
        return ROOT

    candidates = [path if path.is_dir() else path.parent for path in existing]
    return Path(os.path.commonpath([str(path) for path in candidates]))


def normalise_archive_name(raw: str) -> str:
    value = raw.replace("\\", "/").lstrip("/")
    target = PurePosixPath(value)
    if not value or any(part in {"", ".", ".."} for part in target.parts):
        raise ValueError(f"Unsafe archive target: {raw!r}")
    return target.as_posix()


def build_package(package: dict) -> str:
    package_name = package["name"]
    output_name = f"{package['zip_name']}.zip"
    output_path = ROOT / output_name
    sources = [Path(item) for item in package.get("files", [])]
    base = common_base(sources)

    print(f"  Building {package_name} -> {output_name}")

    entries: dict[str, Path] = {}
    for source in sources:
        for file_path in iter_files(source):
            archive_name = normalise_archive_name(file_path.relative_to(base).as_posix())
            previous = entries.get(archive_name)
            if previous is not None and previous != file_path:
                raise ValueError(
                    f"Package {package_name} maps multiple files to {archive_name}: "
                    f"{previous} and {file_path}"
                )
            entries[archive_name] = file_path

    with ZipFile(output_path, "w", compression=ZIP_DEFLATED) as archive:
        for archive_name, file_path in sorted(entries.items()):
            archive.write(file_path, archive_name)

    print(f"  Created {output_name} ({len(entries)} files)")
    return output_name


def main():
    with open("packages.json", "r", encoding="utf-8") as file:
        packages = json.load(file)

    if len(packages) != 1 or packages[0].get("name") != "runtime_core":
        raise ValueError("v3 build input must contain only runtime_core")

    build_package(packages[0])
    print("\nBuilt the Runtime Core package")


if __name__ == "__main__":
    main()
