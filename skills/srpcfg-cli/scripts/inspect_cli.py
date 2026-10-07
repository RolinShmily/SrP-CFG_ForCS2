#!/usr/bin/env python3
"""Inspect srpcfg version/help without detecting Steam or modifying configuration."""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--exe', help='srpcfg executable path; defaults to PATH lookup')
    args = parser.parse_args()
    candidate = args.exe or shutil.which('srpcfg') or shutil.which('srpcfg.exe')
    if not candidate:
        print(json.dumps({'success': False, 'error': 'srpcfg executable not found; supply --exe or install it on PATH'}))
        return 1
    executable = Path(candidate).expanduser().resolve()
    if not executable.is_file():
        print(json.dumps({'success': False, 'error': 'Executable path is not a file'}))
        return 1
    results = {}
    for name, arguments in [('version', ['version']), ('help', ['--help'])]:
        try:
            result = subprocess.run([str(executable), *arguments], capture_output=True,
                                    encoding='utf-8', errors='replace', timeout=15)
        except (OSError, subprocess.TimeoutExpired) as error:
            print(json.dumps({'success': False, 'error': str(error), 'executable': str(executable)}))
            return 1
        results[name] = {'exit_code': result.returncode, 'stdout': result.stdout.strip(),
                         'stderr': result.stderr.strip()}
        if result.returncode != 0:
            print(json.dumps({'success': False, 'executable': str(executable), 'results': results}, ensure_ascii=False))
            return 1
    print(json.dumps({'success': True, 'executable': str(executable), 'results': results}, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
