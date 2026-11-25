#!/usr/bin/env python3
"""Verify static download manifests, ZIP contents and reproducible package hashes."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile

REPO = Path(__file__).resolve().parent.parent.parent
# Derive the expected set from the repository so a newly added content package
# cannot be silently omitted from the published manifest.
CONTENT_PACKAGES = {
    path.name for path in (REPO/'content').iterdir()
    if path.is_dir() and (path/'VERSION.txt').is_file()
}
with tempfile.TemporaryDirectory(prefix='srp-content-test-') as temporary:
    output = Path(temporary)
    command = [sys.executable, str(REPO/'scripts/package_content.py'), '--output', str(output)]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL)
    manifest = json.loads((output/'packages/manifest.json').read_text(encoding='utf-8'))
    assert manifest == json.loads((output/'packages.json').read_text(encoding='utf-8'))
    assert manifest['schema_version'] == 1
    assert set(manifest['packages']) == CONTENT_PACKAGES
    for package_id, entry in manifest['packages'].items():
        name = entry['url'].rsplit('/', 1)[1]
        archive = output/'packages'/name
        data = archive.read_bytes()
        assert len(data) == entry['size']
        assert hashlib.sha256(data).hexdigest() == entry['sha256']
        assert entry['url'].startswith(f'https://cfg.srprolin.com/packages/{package_id}-v')
        assert (output/'packages'/f'{package_id}-latest.zip').read_bytes() == data
        with zipfile.ZipFile(archive) as zipped:
            assert zipped.testzip() is None
            names = zipped.namelist()
            assert not any('..' in Path(name).parts or name.startswith('/') for name in names)
            assert not any('__pycache__' in name or name.endswith(('.pyc', '.bak', '.tmp')) for name in names)
            if package_id == 'srp-cfg':
                assert 'autoexec.cfg' in names and 'srp-cfg/runtime/init.cfg' in names
            elif package_id == 'srp-cfg-csgo':
                assert 'autoexec_csgo.cfg' in names and 'srp-cfg-csgo/runtime/init.cfg' in names and 'srp-cfg-csgo/catalog.json' in names
            elif package_id == 'video':
                assert 'cs2_video.txt' in names
            else:
                assert 'catalog.json' in names
        print(f'PASS: {package_id} manifest, size/hash and archive layout')
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL)
    repeated = json.loads((output/'packages.json').read_text(encoding='utf-8'))
    assert repeated['packages'] == manifest['packages']
    print('PASS: repeated packaging preserves all content-addressed filenames and hashes')
