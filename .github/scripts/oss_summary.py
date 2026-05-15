#!/usr/bin/env python3
"""
生成 OSS 上传结果的 GitHub Step Summary。
由 CI 的 "Upload to Aliyun OSS" 步骤调用。

用法: python3 .github/scripts/oss_summary.py
"""

import json
import os


def main():
    with open('upload_results.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    tag = os.environ.get('TAG', '')

    summary_parts = []
    summary_parts.append("## ✅ OSS Upload Result\n")
    summary_parts.append(f"**Tag:** {tag}  \n")
    summary_parts.append(f"**Total Files:** {data['total']}  \n")
    summary_parts.append(f"**✅ Success:** {data['success']}  \n")

    if data['failed'] > 0:
        summary_parts.append(f"**❌ Failed:** {data['failed']}  \n")

    summary_parts.append("\n### Upload Details\n")
    summary_parts.append("| File | Source | Target | Status |\n")
    summary_parts.append("|------|--------|--------|--------|\n")

    for result in data['results']:
        source = result.get('source', '-')
        target = result.get('target', '-')
        overwritten = result.get('overwritten', False)

        if result.get('success', False):
            public_url = result.get('public_url', '')
            source_display = f"`{source}`"
            target_display = f"[{target}]({public_url})"
            status_display = "✅ (覆盖)" if overwritten else "✅"
        else:
            source_display = f"`{source}`"
            target_display = f"`{target}`"
            status_display = "❌"

        summary_parts.append(f"| **{result['display']}** | {source_display} | {target_display} | {status_display} |\n")

    # 写入 Summary
    with open(os.environ.get('GITHUB_STEP_SUMMARY', '/dev/null'), 'a') as f:
        f.write(''.join(summary_parts))


if __name__ == '__main__':
    main()
