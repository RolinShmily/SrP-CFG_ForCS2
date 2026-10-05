#!/usr/bin/env python3
"""
Repository sanity and release readiness check for SrP-CFG.
Validates version consistency, catalog structures, declared files,
license declarations, and ensures clean project structure without external dependencies.
"""

import sys
import re
import json
from pathlib import Path

def main():
    repo_root = Path(__file__).resolve().parent.parent
    errors = []

    print("[*] Running SrP-CFG repository integrity check...")

    # 1. Essential project documents
    required_docs = ["LICENSE", "README.md", "README.zh-CN.md", "THIRD_PARTY_NOTICES.md"]
    for doc in required_docs:
        path = repo_root / doc
        if not path.is_file():
            errors.append(f"Missing required project document: {doc}")
        elif path.stat().st_size == 0:
            errors.append(f"Project document is empty: {doc}")

    # 2. Package version numbers
    semver_pattern = re.compile(r"^\d+\.\d+\.\d+$")
    packages = ["srp-cfg", "video", "annotations"]
    for pkg in packages:
        ver_file = repo_root / "config" / pkg / "VERSION.txt"
        if not ver_file.is_file():
            errors.append(f"Missing package VERSION.txt: config/{pkg}/VERSION.txt")
            continue
        ver = ver_file.read_text(encoding="utf-8").strip()
        if not semver_pattern.match(ver):
            errors.append(f"Invalid semver '{ver}' in config/{pkg}/VERSION.txt")
        else:
            print(f"    [OK] Package '{pkg}': v{ver}")

    # 3. Catalog integrity
    catalogs = [
        ("srp-cfg", repo_root / "config" / "srp-cfg" / "catalog.json"),
        ("annotations", repo_root / "config" / "annotations" / "catalog.json"),
    ]
    for pkg, cat_path in catalogs:
        if not cat_path.is_file():
            errors.append(f"Missing catalog.json: {cat_path.relative_to(repo_root)}")
            continue
        try:
            data = json.loads(cat_path.read_text(encoding="utf-8"))
        except Exception as e:
            errors.append(f"Malformed JSON in {cat_path.relative_to(repo_root)}: {e}")
            continue

        if data.get("schema_version") != 1:
            errors.append(f"Unsupported schema_version in {cat_path.relative_to(repo_root)}")

        entries = data.get("entries", [])
        if not isinstance(entries, list) or len(entries) == 0:
            errors.append(f"Catalog {pkg} has no entries")
            continue

        pkg_dir = cat_path.parent
        for entry in entries:
            entry_id = entry.get("id")
            if not entry_id:
                errors.append(f"Catalog entry missing 'id' in {pkg}")
                continue
            entry_dir = entry.get("directory", "")
            for rel_file in entry.get("files", []):
                file_path = pkg_dir / entry_dir / rel_file
                if not file_path.is_file():
                    errors.append(f"Catalog file missing on disk: {file_path.relative_to(repo_root)}")

        print(f"    [OK] Catalog '{pkg}': {len(entries)} valid entries verified")

    # 4. Root CMake application version check
    cmake_path = repo_root / "CMakeLists.txt"
    if cmake_path.is_file():
        cmake_content = cmake_path.read_text(encoding="utf-8")
        match = re.search(r'set\(SRP_APP_VERSION\s+"([^"]+)"', cmake_content)
        if match:
            app_ver = match.group(1)
            if not semver_pattern.match(app_ver):
                errors.append(f"Invalid SRP_APP_VERSION '{app_ver}' in CMakeLists.txt")
            else:
                print(f"    [OK] CMake App Version: v{app_ver}")
        else:
            errors.append("Could not find SRP_APP_VERSION in CMakeLists.txt")

    # 5. Guard against lingering legacy artifacts
    legacy_markers = [
        "src-tauri",
        "app/desktop",
        "app/website",
        "app/shared",
    ]
    for marker in legacy_markers:
        p = repo_root / marker
        if p.exists():
            errors.append(f"Lingering legacy directory found: {marker}")

    if errors:
        print("\n[!] Repository check failed with errors:")
        for err in errors:
            print(f"    - {err}")
        sys.exit(1)

    print("[*] All repository integrity checks passed successfully.\n")

if __name__ == "__main__":
    main()
