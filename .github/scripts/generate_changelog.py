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
    # 获取提交信息
    result = subprocess.run(
        ['git', 'log', f'{prev_tag}..{current_tag}', '--pretty=format:%s|||%b'],
        capture_output=True,
        text=True
    )

    commits = result.stdout.strip()

    if not commits:
        return "无提交记录"

    lines = []
    for commit in commits.split('\n'):
        if '|||' in commit:
            subject, body = commit.split('|||', 1)
            # 三级标题：commit 主题
            lines.append(f"### {subject}")

            # 如果有详细内容，转为无序列表
            if body.strip():
                for line in body.strip().split('\n'):
                    line = line.strip()
                    # 过滤掉协作者信息和空行
                    if line and not line.startswith('Co-Authored-By'):
                        # 确保以 '-' 开头
                        if not line.startswith('-'):
                            line = f"- {line}"
                        lines.append(line)

            # 空行分隔
            lines.append("")

    return '\n'.join(lines)


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
