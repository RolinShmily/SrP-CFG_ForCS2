#!/usr/bin/env python3
"""Build deterministic content package ZIPs and the download manifest."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import shutil
import zipfile

REPO = Path(__file__).resolve().parent.parent
ORIGIN = 'https://cfg.srprolin.com'
CONTENT_IDS = ('srp-cfg', 'video', 'annotations', 'srp-cfg-csgo')
# Packages rooted in a named directory inside the game's cfg folder use that prefix.
PREFIXED = {'srp-cfg', 'srp-cfg-csgo'}
AUTOEXEC = {
    'srp-cfg': ('autoexec.cfg', REPO/'content/autoexec.cfg'),
    'srp-cfg-csgo': ('autoexec_csgo.cfg', REPO/'content/autoexec_csgo.cfg'),
}


def entries(directory, prefix=''):
    for path in sorted(directory.rglob('*')):
        if path.is_symlink():
            raise ValueError(f'Symlink cannot be distributed: {path}')
        relative = path.relative_to(directory)
        if any(part in ('.backups', '__pycache__', '.git') for part in relative.parts):
            continue
        if path.is_file() and path.suffix not in ('.bak', '.tmp', '.pyc'):
            yield prefix + relative.as_posix(), path.read_bytes()


def build_package(output, package_id, directory, files):
    version = (directory/'VERSION.txt').read_text(encoding='utf-8').strip()
    if not re.fullmatch(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?', version):
        raise ValueError(f'Invalid version for {package_id}: {version}')
    archive = output/f'{package_id}-v{version}.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipped:
        for name, content in sorted(files):
            info = zipfile.ZipInfo(name, date_time=(2025, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            zipped.writestr(info, content)
    content = archive.read_bytes()
    digest = hashlib.sha256(content).hexdigest()
    addressed = output/f'{package_id}-v{version}-{digest}.zip'
    shutil.copyfile(archive, addressed)
    shutil.copyfile(archive, output/f'{package_id}-latest.zip')
    return {'version': version, 'size': len(content), 'sha256': digest,
            'url': f'{ORIGIN}/packages/{addressed.name}'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=REPO/'website/public')
    args = parser.parse_args()
    output = args.output.resolve()
    archives = output/'packages'
    archives.mkdir(parents=True, exist_ok=True)
    packages = {}
    for package_id in CONTENT_IDS:
        directory = REPO/'content'/package_id
        prefix = f'{package_id}/' if package_id in PREFIXED else ''
        files = list(entries(directory, prefix))
        if package_id in AUTOEXEC:
            name, path = AUTOEXEC[package_id]
            files.append((name, path.read_bytes()))
        packages[package_id] = build_package(archives, package_id, directory, files)
    manifest = {'schema_version': 1, 'published_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
                'packages': packages}
    manifest_json = json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'
    (archives/'manifest.json').write_text(manifest_json, encoding='utf-8')
    (output/'packages.json').write_text(manifest_json, encoding='utf-8')
    for package_id, entry in packages.items():
        print(f"{package_id} v{entry['version']} {entry['size']} bytes SHA-256 {entry['sha256']}")


if __name__ == '__main__':
    main()
