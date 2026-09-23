"""网站问答所用 LLM 的预检（app/website/src/worker.ts）。

worker.ts 走流式接口，且它的上下文预算（MAX_HISTORY_ITEMS × MAX_HISTORY_CONTENT_LENGTH
等）是按 32K 上下文窗口标定的，最坏输入约 31,300 字符。因此换模型时有两条硬约束：

1. 上下文窗口不得低于 32,000 tokens，否则长对话会溢出；
2. 模型不得把思考内容（reasoning）混进正文 —— Qwen3 等推理模型会把思考计入
   max_tokens，既可能挤掉正文，也可能被用户直接看到。

第 2 点无法离线验证，只能真实调用一次。本脚本用与 ai-stream.ts 完全相同的取文逻辑
解析流式响应，因此预检通过就意味着线上解析路径也能正常工作。

任一检查不通过即以非零码退出。
"""

import json
import os
import re
import sys
import urllib.request

# 模型 -> 上下文窗口（tokens），取自 Cloudflare Workers AI 各模型页的 "Context Window"。
# 新增候选模型时在此登记，否则预检会直接报错，避免未评估的模型被静默启用。
CONTEXT_WINDOWS = {
    "@cf/meta/llama-3.1-8b-instruct-fp8": 32_000,
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast": 24_000,
    "@cf/qwen/qwen3-30b-a3b-fp8": 32_768,
    "@cf/zai-org/glm-4.7-flash": 131_072,
}

# worker.ts 的上下文预算按此窗口标定，低于它即视为回归。
REQUIRED_CONTEXT_WINDOW = 32_000

# worker.ts 里 env.AI.run(...) 走的 AI Gateway id。预检也走同一个网关，
# 才能覆盖“网关侧对模型有限制”这类只会在生产暴露的问题。
# test_ai_preflights.py 会断言该值与 worker.ts 保持一致，防止两边漂移。
AI_GATEWAY_ID = "srp-cfg"

# 仓库根目录：.github/scripts/ -> .github/ -> <repo>
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORKER_SOURCE = os.path.join(REPO_ROOT, "app", "website", "src", "worker.ts")

# 触发中文回答的探针；同时要求模型给出足够长的正文，以便暴露思考内容泄漏。
PROBE_MESSAGE = "请用一句完整的中文说明 CS2 里 sv_cheats 指令的作用。"

# 必须带上与 worker.ts 同构的 system prompt：/no_think 是写在 system prompt 里的
# 软开关，只发 user 消息会得到“思考未关闭”的假警报（首版预检就踩过这个坑）。
# test_ai_preflights.py 会断言 worker.ts 确实含 /no_think，防止两边脱节。
PROBE_SYSTEM_PROMPT = (
    "你是 CS2 官方控制台指令与变量助手。只解答 CS2 官方控制台指令与变量相关问题，"
    "使用中文、简练、并以完整句子结束。\n/no_think"
)

REASONING_MARKERS = ("<" + "think", "</" + "think", "<|thinking|>", "thinking_process")


def worker_uses_no_think(source_path=WORKER_SOURCE):
    """确认 worker.ts 的 system prompt 里确实带了 /no_think 软开关。

    探针会带上同构的 system prompt，因此这里必须保证线上真的有这个开关 ——
    否则探针会测到一个线上不存在的配置。
    """
    try:
        with open(source_path, "r", encoding="utf-8") as f:
            source = f.read()
    except OSError as e:
        raise RuntimeError(f"无法读取 {source_path}: {e}") from e
    return "/no_think" in source


def read_worker_model(source_path=WORKER_SOURCE):
    """从 worker.ts 解析实际使用的 LLM_MODEL，避免文档与代码脱节。"""
    try:
        with open(source_path, "r", encoding="utf-8") as f:
            source = f.read()
    except OSError as e:
        raise RuntimeError(f"无法读取 {source_path}: {e}") from e

    match = re.search(r'^const LLM_MODEL\s*=\s*"([^"]+)"', source, re.MULTILINE)
    if not match:
        raise RuntimeError(f"在 {source_path} 中找不到 LLM_MODEL 声明")
    return match.group(1)


def extract_text(payload):
    """与 app/website/src/ai-stream.ts 的 extractText 保持一致的取值优先级。"""
    if isinstance(payload.get("response"), str):
        return payload["response"]
    if isinstance(payload.get("delta"), str):
        return payload["delta"]
    choices = payload.get("choices")
    if isinstance(choices, list) and choices and isinstance(choices[0], dict):
        delta = choices[0].get("delta")
        if isinstance(delta, dict) and isinstance(delta.get("content"), str):
            return delta["content"]
    return ""


def has_reasoning_field(payload):
    """检测响应里是否单独携带推理内容字段。"""
    if any(k in payload for k in ("reasoning_content", "reasoning")):
        return True
    choices = payload.get("choices")
    if isinstance(choices, list) and choices and isinstance(choices[0], dict):
        delta = choices[0].get("delta")
        if isinstance(delta, dict) and any(k in delta for k in ("reasoning_content", "reasoning")):
            return True
    return False


def stream_chat(model, token, account, message, timeout=90):
    """发起一次真实流式调用，返回 (正文, 是否出现过独立推理字段, 事件数)。"""
    payload = {
        "messages": [
            {"role": "system", "content": PROBE_SYSTEM_PROMPT},
            {"role": "user", "content": message},
        ],
        "max_tokens": 512,
        "temperature": 0.2,
        "stream": True,
    }
    url = f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{model}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "cf-aig-gateway-id": AI_GATEWAY_ID,
        },
        method="POST",
    )

    text_parts = []
    saw_reasoning_field = False
    events = 0

    with urllib.request.urlopen(req, timeout=timeout) as resp:
        for raw_line in resp:
            line = raw_line.decode("utf-8", errors="replace").strip()
            if not line or not line.startswith("data:"):
                continue
            data = line[len("data:"):].strip()
            if not data or data == "[DONE]":
                continue
            try:
                chunk = json.loads(data)
            except json.JSONDecodeError:
                continue
            events += 1
            if has_reasoning_field(chunk):
                saw_reasoning_field = True
            text_parts.append(extract_text(chunk))

    return "".join(text_parts), saw_reasoning_field, events


def contains_cjk(text):
    return any("\u4e00" <= ch <= "\u9fff" for ch in text)


def check_stream(text, saw_reasoning_field):
    """返回问题列表，空列表表示通过。"""
    problems = []
    if not text.strip():
        problems.append("流式响应没有产生任何正文内容（解析逻辑与模型返回结构可能不匹配）")
        return problems

    if not contains_cjk(text):
        problems.append(f"正文不含中文，疑似拼音或英文: {text[:120]!r}")

    leaked = [marker for marker in REASONING_MARKERS if marker in text]
    if leaked:
        problems.append(
            f"思考内容泄漏到正文（命中 {leaked}）: {text[:200]!r}"
            " —— /no_think 未生效或该模型不支持关闭思考，需改用非推理模型或调大 MAX_OUTPUT_TOKENS"
        )

    if saw_reasoning_field:
        problems.append(
            "响应携带独立的 reasoning 字段；ai-stream.ts 只读 content，因此不会展示给用户，"
            "但这些 token 仍计入 max_tokens，可能挤掉正文，建议确认思考是否真的已关闭"
        )
    return problems


def main():
    token = os.environ.get("CLOUDFLARE_AI_TOKEN")
    account = os.environ.get("CLOUDFLARE_ACCOUNT_ID") or os.environ.get("CF_ACCOUNT_ID")
    if not token or not account:
        print("::error::缺少 CLOUDFLARE_AI_TOKEN 或 CLOUDFLARE_ACCOUNT_ID。")
        return 1

    try:
        model = read_worker_model()
    except RuntimeError as e:
        print(f"::error::{e}")
        return 1

    print("网站 LLM 预检")
    print(f"  Model      : {model}")

    window = CONTEXT_WINDOWS.get(model)
    if window is None:
        print(f"::error::模型 {model} 未在 CONTEXT_WINDOWS 中登记，无法确认上下文窗口是否够用。")
        print(f"          请先查阅 Cloudflare 模型页并把窗口大小加入 {__file__}。")
        return 1

    print(f"  Context    : {window:,} tokens (要求 >= {REQUIRED_CONTEXT_WINDOW:,})")
    if window < REQUIRED_CONTEXT_WINDOW:
        print(
            f"::error::上下文窗口 {window:,} 低于 worker.ts 预算所需的 "
            f"{REQUIRED_CONTEXT_WINDOW:,}，长对话会溢出。请换用更大窗口的模型，"
            "或同步压缩 MAX_HISTORY_ITEMS / MAX_HISTORY_CONTENT_LENGTH。"
        )
        return 1

    if not worker_uses_no_think():
        print(
            f"::error::{WORKER_SOURCE} 的 system prompt 里没有 /no_think，"
            "而本预检会带上它做探针 —— 两边配置不一致，预检结果无意义。"
        )
        return 1

    try:
        text, saw_reasoning, events = stream_chat(model, token, account, PROBE_MESSAGE)
    except Exception as e:
        print(f"::error::流式调用失败（{model}）: {type(e).__name__}: {e}")
        return 1

    print(f"  流式事件数 : {events}")
    print(f"  正文       : {text[:200]!r}")

    problems = check_stream(text, saw_reasoning)
    if problems:
        for problem in problems:
            print(f"::error::预检失败 - {problem}")
        return 1

    print("🎉 预检通过：上下文窗口达标、流式解析正常、无思考内容泄漏、中文正文正常。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
