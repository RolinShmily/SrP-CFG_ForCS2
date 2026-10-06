#!/usr/bin/env python3
"""Run skill command scenarios in isolated fixtures (not an LLM benchmark)."""
import argparse
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--exe', required=True)
    parser.add_argument('--bundle', required=True, help='Repository or packaged config directory')
    parser.add_argument('--output', help='Optional skill-creator review workspace iteration directory')
    args = parser.parse_args()
    executable = Path(args.exe).resolve()
    bundle = Path(args.bundle).resolve()
    skill = Path(__file__).resolve().parents[1]
    evals = json.loads((skill/'evals/evals.json').read_text(encoding='utf-8'))['evals']
    with tempfile.TemporaryDirectory(prefix='srpcfg-eval-') as temporary:
        root = Path(temporary)
        store = root/'store'
        calls = []
        # Each command receives a separate argument list, never a shell command string.
        def run(*arguments, code=0):
            result = subprocess.run([str(executable), *map(str, arguments)], cwd=bundle.parent,
                                    capture_output=True, encoding='utf-8', errors='replace', timeout=30)
            calls.append({'arguments': list(map(str, arguments)), 'exit_code': result.returncode,
                          'stdout': result.stdout, 'stderr': result.stderr})
            if result.returncode != code:
                raise RuntimeError(f'Unexpected exit {result.returncode}, expected {code}: {arguments}\n{result.stderr}')
            return result

        def finish(number, title, assertions, start):
            passed = sum(item['passed'] for item in assertions)
            if args.output:
                directory = Path(args.output)/f'eval-{number}-{title}'
                output = directory/'with_skill/outputs'
                output.mkdir(parents=True, exist_ok=True)
                metadata = {'eval_id': number, 'eval_name': title, 'prompt': evals[number-1]['prompt'],
                            'assertions': [item['text'] for item in assertions]}
                (directory/'eval_metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
                (output/'commands.json').write_text(json.dumps(calls, ensure_ascii=False, indent=2), encoding='utf-8')
                report = f'# {title}\n\nExecuted by a deterministic Python harness, not an independent agent. No baseline or token benchmark was run.\n\n'
                report += '\n'.join(f"- {'PASS' if item['passed'] else 'FAIL'}: {item['text']} — {item['evidence']}" for item in assertions)
                (output/'report.md').write_text(report, encoding='utf-8')
                grading = {'expectations': assertions, 'summary': {'passed': passed, 'failed': len(assertions)-passed,
                           'total': len(assertions), 'pass_rate': passed/len(assertions)},
                           'timing': {'total_duration_seconds': round(time.monotonic()-start, 3)}}
                (output.parent/'grading.json').write_text(json.dumps(grading, ensure_ascii=False, indent=2), encoding='utf-8')
            for item in assertions:
                print(f"{'PASS' if item['passed'] else 'FAIL'}: {item['text']}")
            calls.clear()
            if passed != len(assertions):
                raise RuntimeError(f'{title}: some expectations failed')

        start = time.monotonic()
        run('version')
        help_text = run('--help').stdout
        account = root/'account'
        account.mkdir()
        account_file = account/'cs2_video.txt'
        account_file.write_bytes(b'"video.cfg" { "VendorID" "1002" "setting.msaa_samples" "8" }\r\n')
        account_before = account_file.read_bytes()
        run('video-status', '--store', store)
        run('video-set', '--field', 'setting.msaa_samples', '--value', '2', '--store', store)
        after = run('video-status', '--store', store).stdout
        finish(1, 'staging-only-video', [
            {'text': 'Help exposes srpcfg as the CLI name', 'passed': 'Usage: srpcfg ' in help_text, 'evidence': help_text.splitlines()[0]},
            {'text': 'Staged MSAA is 2 after saving', 'passed': 'setting.msaa_samples = 2' in after, 'evidence': 'video-status reports setting.msaa_samples = 2'},
            {'text': 'Game account file remains byte-identical and video-apply was not called', 'passed': account_file.read_bytes()==account_before and all(c['arguments'][0]!='video-apply' for c in calls), 'evidence': 'Account fixture bytes compared; command trace contains video-set/status only'}
        ], start)

        start = time.monotonic()
        cfg = root/'game/cfg'
        shutil.copytree(bundle/'srp-cfg', cfg/'srp-cfg')
        (cfg/'autoexec.cfg').write_text('exec srp-cfg/runtime/init.cfg\n', encoding='utf-8')
        custom = cfg/'srp-cfg/user/custom.cfg'
        custom.write_bytes(b'\xef\xbb\xbfbind "f6" "echo existing"\r\nsensitivity "1.37"\r\n')
        original = custom.read_bytes()
        modules = run('modules', '--cfg-dir', cfg, '--store', store).stdout
        conflict = run('mode-bind', 'practice', '--key', 'f6', '--cfg-dir', cfg, '--store', store, '--en', code=2)
        preset_output = run('presets', '--cfg-dir', cfg, '--store', store).stdout
        finish(2, 'unapproved-mode-conflict', [
            {'text': 'Practice is discovered and presets expose stable IDs', 'passed': 'practice:' in modules and '[default]' in preset_output, 'evidence': 'modules includes practice; presets includes [default]'},
            {'text': 'Binding reports conflict exit 2 and previous/proposed commands without --confirm', 'passed': conflict.returncode==2 and 'echo existing' in conflict.stderr and 'srp_practice' in conflict.stderr and all('--confirm' not in c['arguments'] for c in calls), 'evidence': conflict.stderr.strip()},
            {'text': 'custom.cfg remains byte-identical and no backup/write occurred', 'passed': custom.read_bytes()==original and not Path(str(custom)+'.bak').exists(), 'evidence': 'Compared BOM/CRLF source bytes and absence of .bak'}
        ], start)

        start = time.monotonic()
        local = root/'game/annotations/local'
        personal = local/'mapguide/mapguide.txt'
        personal.parent.mkdir(parents=True)
        personal.write_bytes(b'personal guide\r\n')
        other = local/'SrP-Dust2-Guide/SrP-Dust2-Guide.txt'
        other.parent.mkdir()
        other.write_bytes(b'unrelated guide\r\n')
        personal_before, other_before = personal.read_bytes(), other.read_bytes()
        guides = run('annotations', '--annotations-dir', local, '--store', store).stdout
        run('annotation-deploy', 'mirage', '--annotations-dir', local, '--store', store)
        target = local/'SrP-Mirage-Guide/SrP-Mirage-Guide.txt'
        deployed = target.read_bytes()
        listed = run('annotations', '--annotations-dir', local, '--store', store, '--en').stdout
        run('annotation-remove', 'mirage', '--annotations-dir', local, '--store', store)
        run('annotations', '--annotations-dir', local, '--store', store, '--en')
        finish(3, 'selective-guide-removal', [
            {'text': 'Mirage is discovered and deployed from staging', 'passed': 'mirage:' in guides and deployed==(bundle/'annotations/SrP-Mirage-Guide/SrP-Mirage-Guide.txt').read_bytes() and bool(re.search(r'^mirage: Deployed$', listed, re.MULTILINE)), 'evidence': 'Listing, deployed source bytes and Deployed state checked'},
            {'text': 'Only selected guide is removed and its exact bytes are backed up', 'passed': not target.exists() and Path(str(target)+'.bak').read_bytes()==deployed, 'evidence': 'Mirage live file absent; .bak matches deployed bytes'},
            {'text': 'Personal mapguide and unrelated Dust2 file remain byte-identical', 'passed': personal.read_bytes()==personal_before and other.read_bytes()==other_before, 'evidence': 'Both unrelated fixture files compared after deploy/remove'}
        ], start)
    print('ALL SRPCFG SKILL COMMAND SCENARIOS PASSED')


if __name__ == '__main__':
    main()
