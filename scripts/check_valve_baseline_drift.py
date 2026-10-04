#!/usr/bin/env python3
"""
CS2 Valve Baseline Drift Detector
Compares config/srp-cfg/valve/settings.cfg against SteamDatabase/GameTracking-CS2 DumpSource2
to detect deprecated convars and upstream default value changes.
"""

import os
import re
import sys
import json
import urllib.request
from typing import Dict, Tuple, List, Set

UPSTREAM_BASE = "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master"
CONVARS_URL = f"{UPSTREAM_BASE}/DumpSource2/convars.txt"
COMMANDS_URL = f"{UPSTREAM_BASE}/DumpSource2/commands.txt"
COMMIT_API_URL = "https://api.github.com/repos/SteamDatabase/GameTracking-CS2/commits?path=DumpSource2/convars.txt&page=1&per_page=1"

# 纯内置引擎指令，不需要作为 convar 校验
KNOWN_COMMANDS = {
    "echo",
    "firstperson",
    "thirdperson",
    "binddefaults",
    "exec",
    "execifexists"
}

# 明确由 SrP-CFG 特意设定的值 (允许偏离 Valve 原生关闭状态)
INTENTIONAL_OVERRIDES = {
    "con_enable": "true"  # Valve 默认 false，但作为 CFG 体系必须开启开发者控制台
}

def fetch_text(url: str, timeout: int = 15) -> str:
    headers = {"User-Agent": "SrP-CFG-Drift-Detector/1.0"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="ignore")

def fetch_latest_commit() -> Tuple[str, str, str]:
    headers = {"User-Agent": "SrP-CFG-Drift-Detector/1.0"}
    req = urllib.request.Request(COMMIT_API_URL, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data and len(data) > 0:
                c = data[0]
                sha = c.get("sha", "")[:7]
                date = c.get("commit", {}).get("committer", {}).get("date", "")
                msg = c.get("commit", {}).get("message", "").split("\n")[0]
                return sha, date, msg
    except Exception as e:
        print(f"[Warning] Failed to fetch commit info: {e}", file=sys.stderr)
    return "unknown", "unknown", "unknown"

def parse_local_settings(file_path: str) -> Dict[str, str]:
    convars = {}
    if not os.path.exists(file_path):
        print(f"[Error] Local file not found: {file_path}", file=sys.stderr)
        return convars

    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("//"):
                continue
            if "//" in line:
                line = line.split("//")[0].strip()
            parts = line.split(maxsplit=1)
            if len(parts) >= 2:
                key = parts[0].strip()
                val = parts[1].strip().strip('"')
                convars[key] = val
            elif len(parts) == 1:
                key = parts[0].strip()
                convars[key] = ""
    return convars

def parse_upstream_convars(raw_text: str) -> Dict[str, Dict[str, str]]:
    convars = {}
    pattern = re.compile(r"^([a-zA-Z0-9_]+)\s+([^\s\(]+(?:\s+[^\s\(]+)*)?(?:\s+\((.*?)\))?$")
    for line in raw_text.splitlines():
        line = line.strip()
        if not line or line.startswith("\t") or line.startswith("<"):
            continue
        m = pattern.match(line)
        if m:
            name = m.group(1)
            val = m.group(2) if m.group(2) is not None else ""
            flags = m.group(3) if m.group(3) is not None else ""
            convars[name] = {"value": val, "flags": flags}
    return convars

def parse_upstream_commands(raw_text: str) -> Set[str]:
    commands = set()
    pattern = re.compile(r"^([a-zA-Z0-9_\+]+)\s*(\(.*?\))?")
    for line in raw_text.splitlines():
        line = line.strip()
        if not line or line.startswith("\t"):
            continue
        m = pattern.match(line)
        if m:
            commands.add(m.group(1))
    return commands

def normalize_val(v: str) -> str:
    s = str(v).strip().strip('"\'').lower()
    if s in {"1", "true"}:
        return "true"
    if s in {"0", "false"}:
        return "false"
    return s

def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    local_cfg = os.path.join(repo_root, "config", "srp-cfg", "valve", "settings.cfg")

    print("[*] Fetching latest GameTracking-CS2 commit metadata...")
    sha, commit_date, commit_msg = fetch_latest_commit()

    print("[*] Reading local config/srp-cfg/valve/settings.cfg...")
    local_dict = parse_local_settings(local_cfg)
    print(f"    Loaded {len(local_dict)} entries from local baseline.")

    print(f"[*] Fetching upstream convars from {CONVARS_URL}...")
    convars_text = fetch_text(CONVARS_URL)
    upstream_convars = parse_upstream_convars(convars_text)
    print(f"    Loaded {len(upstream_convars)} upstream ConVars.")

    print(f"[*] Fetching upstream commands from {COMMANDS_URL}...")
    commands_text = fetch_text(COMMANDS_URL)
    upstream_commands = parse_upstream_commands(commands_text)
    print(f"    Loaded {len(upstream_commands)} upstream Commands.")

    # 1. 废弃 / 移除检查
    missing_convars = []
    for k in local_dict:
        if k in KNOWN_COMMANDS or k in upstream_commands:
            continue
        if k not in upstream_convars:
            missing_convars.append(k)

    # 2. 默认值漂移检查
    drifted_convars = []
    for k, local_val in local_dict.items():
        if k in upstream_convars:
            up_val = upstream_convars[k]["value"]
            if normalize_val(local_val) != normalize_val(up_val):
                is_intentional = (k in INTENTIONAL_OVERRIDES and INTENTIONAL_OVERRIDES[k] == local_val)
                drifted_convars.append({
                    "convar": k,
                    "local": local_val,
                    "upstream": up_val,
                    "flags": upstream_convars[k]["flags"],
                    "intentional": is_intentional
                })

    # 生成 Markdown 报告
    lines = []
    lines.append("# CS2 Valve Baseline Upstream Drift Report")
    lines.append(f"**Tracking Commit:** [`{sha}`](https://github.com/SteamDatabase/GameTracking-CS2/commit/{sha}) - *{commit_msg}* ({commit_date})  ")
    lines.append(f"**Checked File:** `config/srp-cfg/valve/settings.cfg` ({len(local_dict)} entries)\n")

    has_critical = len(missing_convars) > 0
    unexpected_drifts = [d for d in drifted_convars if not d["intentional"]]

    if not has_critical and len(unexpected_drifts) == 0:
        lines.append("### :white_check_mark: Status: 100% In Sync")
        lines.append("All Convars in the Valve baseline exist in upstream CS2 and match expected default values.")
    else:
        if has_critical:
            lines.append("### :x: Critical: Deprecated / Removed Convars Detected")
            lines.append("The following Convars exist in `settings.cfg` but are **NOT** present in the latest CS2 build:")
            for c in missing_convars:
                lines.append(f"- :warning: `{c}`")
            lines.append("\n> **Action required:** These variables should be audited and removed from `settings.cfg`.\n")

        if unexpected_drifts:
            lines.append("### :warning: Notice: Valve Default Value Drift")
            lines.append("| ConVar | Local Setting | Upstream Default | Flags |")
            lines.append("| :--- | :---: | :---: | :--- |")
            for d in unexpected_drifts:
                lines.append(f"| `{d['convar']}` | `{d['local']}` | `{d['upstream']}` | `{d['flags']}` |")
            lines.append("\n> **Notice:** Review if Valve has officially altered standard game defaults.\n")

    report_content = "\n".join(lines)
    print("\n" + report_content)

    # 写入报告文件
    report_file = os.path.join(repo_root, "drift_report.md")
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(report_content)

    # 写入 GitHub Step Summary (如果在 CI 环境)
    if "GITHUB_STEP_SUMMARY" in os.environ:
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write(report_content)

    # 导出标志供 GitHub Actions step 判断
    if "GITHUB_OUTPUT" in os.environ:
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as f:
            f.write(f"has_critical={'true' if has_critical else 'false'}\n")
            f.write(f"has_drift={'true' if len(unexpected_drifts) > 0 else 'false'}\n")
            f.write(f"commit_sha={sha}\n")

    if has_critical:
        sys.exit(2)
    sys.exit(0)

if __name__ == "__main__":
    main()
