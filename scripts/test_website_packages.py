#!/usr/bin/env python3
"""Verify static download manifests, ZIP contents and reproducible package hashes."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile

REPO = Path(__file__).resolve().parent.parent
with tempfile.TemporaryDirectory(prefix='srpcfg-download-test-') as temporary:
    output = Path(temporary)
    command = [sys.executable, str(REPO/'scripts/package-website.py'), '--output', str(output)]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL)
    manifest = json.loads((output/'packages.json').read_text(encoding='utf-8'))
    assert manifest['schema_version'] == 1
    assert set(manifest['packages']) == {'srp-cfg', 'video', 'annotations', 'srpcfg-cli'}
    for package_id, entry in manifest['packages'].items():
        name = entry['url'].rsplit('/', 1)[1]
        archive = output/'packages'/name
        data = archive.read_bytes()
        assert len(data) == entry['size']
        assert hashlib.sha256(data).hexdigest() == entry['sha256']
        assert entry['url'].startswith(f'https://cfg.srprolin.top/packages/{package_id}-v')
        assert (output/'packages'/f'{package_id}-latest.zip').read_bytes() == data
        with zipfile.ZipFile(archive) as zipped:
            assert zipped.testzip() is None
            names = zipped.namelist()
            assert not any('..' in Path(name).parts or name.startswith('/') for name in names)
            assert not any('__pycache__' in name or name.endswith(('.pyc', '.bak', '.tmp')) for name in names)
            if package_id == 'srpcfg-cli':
                assert all(name.startswith('srpcfg-cli/') for name in names)
                for relative in ['SKILL.md', 'VERSION.txt', 'LICENSE.txt', 'references/commands.md', 'scripts/inspect_cli.py']:
                    assert f'srpcfg-cli/{relative}' in names
                assert zipped.read('srpcfg-cli/SKILL.md') == (REPO/'skills/srpcfg-cli/SKILL.md').read_bytes()
                assert zipped.read('srpcfg-cli/LICENSE.txt') == (REPO/'LICENSE').read_bytes()
            elif package_id == 'srp-cfg':
                assert 'autoexec.cfg' in names and 'srp-cfg/runtime/init.cfg' in names
            elif package_id == 'video':
                assert 'cs2_video.txt' in names
            else:
                assert 'catalog.json' in names
        print(f'PASS: {package_id} manifest, size/hash and archive layout')
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL)
    repeated = json.loads((output/'packages.json').read_text(encoding='utf-8'))
    assert repeated['packages'] == manifest['packages']
    print('PASS: repeated packaging preserves all content-addressed filenames and hashes')
