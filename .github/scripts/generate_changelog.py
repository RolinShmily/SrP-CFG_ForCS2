#!/usr/bin/env python3
"""
生成格式化的 GitHub Release 更新日志
"""

import subprocess
import os
import sys


def generate_changelog(prev_tag: str, current_tag: str) -> str:
    """
    生成格式化的更新日志

    Args:
        prev_tag: 上一个版本标签
        current_tag: 当前版本标签

    Returns:
        格式化的更新日志字符串
    """
    # 获取完整的提交信息（包括每个commit的所有行）
    result = subprocess.run(
        ['git', 'log', f'{prev_tag}..{current_tag}', '--pretty=fuller'],
        capture_output=True,
        text=True,
        encoding='utf-8',
        errors='replace'
    )

    commits_raw = result.stdout.strip()

    if not commits_raw:
        return "无提交记录"

    # 更简单的方式：直接解析每个commit
    # 按 "commit <hash>" 分割
    import re

    lines = []

    # 使用 findall 找到所有 commit 内容
    pattern = r'commit ([a-f0-9]{40,})\n(.*?)(?=\ncommit [a-f0-9]{40,}|\Z)'
    matches = re.findall(pattern, commits_raw, re.DOTALL)

    for commit_hash, content in matches:
        lines.append("")
        process_single_commit(commit_hash, content, lines)

    if not lines:
        return "无提交记录"

    return '\n'.join(lines)


def process_single_commit(commit_hash: str, block_content: str, lines: list):
    """处理单个commit的内容"""
    block_lines = block_content.strip().split('\n')
    message_lines = []

    for line in block_lines:
        line_stripped = line.strip()

        if line_stripped.startswith('Author:') or line_stripped.startswith('AuthorDate:'):
            continue
        elif line_stripped.startswith('Commit:') or line_stripped.startswith('CommitDate:'):
            continue
        elif line_stripped:
            # 这应该是commit message
            message_lines.append(line_stripped)

    # 输出commit信息
    if message_lines:
        subject = message_lines[0]
        body = '\n'.join(message_lines[1:]) if len(message_lines) > 1 else ""

        # 使用commit hash作为引用
        short_hash = commit_hash[:7] if commit_hash else ""

        # 格式化为三级标题，更清晰
        lines.append(f"### {subject}")
        lines.append(f"> `{short_hash}`")

        # 如果有详细内容，完整展示
        if body.strip():
            # 将body的每行作为列表项展示
            for bline in body.strip().split('\n'):
                bline = bline.strip()
                if bline and not bline.startswith('Co-Authored-By'):
                    # 确保以列表格式展示
                    if not bline.startswith('-') and not bline.startswith('*'):
                        bline = f"- {bline}"
                    lines.append(bline)


def main():
    """主函数"""
    prev_tag = os.environ.get('PREV_TAG', '')
    current_tag = os.environ.get('CURRENT_TAG', '')

    if not prev_tag:
        print("错误: 未找到 PREV_TAG 环境变量", file=sys.stderr)
        sys.exit(1)

    if not current_tag:
        print("错误: 未找到 CURRENT_TAG 环境变量", file=sys.stderr)
        sys.exit(1)

    # 生成并输出更新日志
    changelog = generate_changelog(prev_tag, current_tag)
    print(changelog, end='')


if __name__ == '__main__':
    main()
