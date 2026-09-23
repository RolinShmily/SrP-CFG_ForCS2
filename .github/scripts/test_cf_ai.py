"""更新 CS2 命令库前的 Cloudflare Workers AI 预检。

必须在 update_commands.py 之前执行：它用与正式流程完全相同的模型、参数和解析逻辑做一次
真实调用，从而在消耗批量配额或写坏数据之前，暴露三类问题：

1. 凭据/模型不可用（401、模型下线、超时）；
2. 返回结构变化（不同模型族的 result 结构不同，解析会失败）；
3. 中文质量退化——例如 llama-3.1-8b 会把 "hello" 译成拼音 "nǐ hǎo" 而不是「你好」。

任一检查不通过即以非零码退出，阻断后续的数据更新。
"""

import json
import os
import sys

from update_commands import (
    ALLOWED_CATEGORIES,
    CF_MODEL,
    TRANSLATION_MAX_TOKENS,
    _translate_chunk,
)

# 覆盖一条普通变量和一条游戏内常用变量，确保模型确实在产出中文释义。
SAMPLE_COMMANDS = [
    {"n": "sv_cheats", "d": "0", "en": "Allow cheats on server", "t": "var", "f": []},
    {"n": "cl_crosshairstyle", "d": "2", "en": "Crosshair style", "t": "var", "f": []},
]


def contains_cjk(text):
    """判断文本是否含中日韩统一表意文字——拼音和英文都不含。"""
    return any("\u4e00" <= ch <= "\u9fff" for ch in text)


def check_translations(translated):
    """返回问题列表，空列表表示全部通过。"""
    problems = []
    for item in SAMPLE_COMMANDS:
        name = item["n"]
        info = translated.get(name)
        if not isinstance(info, dict):
            problems.append(f"{name}: 模型没有返回该命令的释义")
            continue

        desc = str(info.get("desc_cn", "")).strip()
        if not desc:
            problems.append(f"{name}: desc_cn 为空")
        elif not contains_cjk(desc):
            problems.append(f"{name}: desc_cn 不含中文（疑似拼音或英文）: {desc!r}")

        category = str(info.get("category", "")).strip()
        if category not in ALLOWED_CATEGORIES:
            problems.append(f"{name}: category 非法: {category!r}")
    return problems


def main():
    token = os.environ.get("CLOUDFLARE_AI_TOKEN")
    account = os.environ.get("CLOUDFLARE_ACCOUNT_ID") or os.environ.get("CF_ACCOUNT_ID")

    if not token or not account:
        print("::error::缺少 CLOUDFLARE_AI_TOKEN 或 CLOUDFLARE_ACCOUNT_ID。")
        return 1

    print("Cloudflare Workers AI 预检")
    print(f"  Account ID : {account[:6]}...{account[-6:] if len(account) > 12 else ''}")
    print(f"  Model      : {CF_MODEL}")
    print(f"  max_tokens : {TRANSLATION_MAX_TOKENS}")
    print(f"  样本命令   : {', '.join(item['n'] for item in SAMPLE_COMMANDS)}")

    try:
        translated = _translate_chunk(SAMPLE_COMMANDS, token, account)
    except Exception as e:
        print(f"::error::Workers AI 调用失败（{CF_MODEL}）: {type(e).__name__}: {e}")
        print("请检查：凭据是否有效、模型是否仍可用、返回结构是否与解析逻辑匹配。")
        return 1

    print(f"原始响应: {json.dumps(translated, ensure_ascii=False)}")

    problems = check_translations(translated)
    if problems:
        for problem in problems:
            print(f"::error::预检失败 - {problem}")
        return 1

    for item in SAMPLE_COMMANDS:
        info = translated[item["n"]]
        print(f"  ✅ {item['n']} -> {info.get('desc_cn')} [{info.get('category')}]")

    print("🎉 预检通过：模型可用，返回结构可解析，中文释义正常。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
