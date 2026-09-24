"""update_commands.py 的单元测试（无网络、无凭据，全部走 mock）。

覆盖三类回归：
1. 请求必须显式带 max_tokens —— Cloudflare 默认 256 会把 40 条命令的 JSON 响应截断，
   导致 json 解析报 "Unterminated string starting at ..."，历史上已复发两次
   （2026-09-10 cl_decryptdata_key、2026-09-23 create_explosion_damage）。
2. 失败必须能推进：原样重发同一个过大请求只会重复失败，需要拆批；同时要有失败预算兜底。
3. 单条命令翻译失败不得拖垮整个每日更新，且不得把低质量兜底文案永久写进缓存。
"""

import json
import os
import shutil
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import update_commands as uc


class FakeResponse:
    def __init__(self, payload):
        self._payload = json.dumps(payload).encode("utf-8")

    def read(self):
        return self._payload

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def make_item(name, desc="does a thing"):
    return {"n": name, "d": "0", "en": desc, "t": "var", "f": [], "value": {}}


class TestExtractResponseText(unittest.TestCase):
    def test_reads_classic_response_field(self):
        self.assertEqual(uc._extract_response_text({"response": "hello"}), "hello")

    def test_reads_chat_completions_shape(self):
        payload = {"choices": [{"message": {"role": "assistant", "content": "hi"}}]}
        self.assertEqual(uc._extract_response_text(payload), "hi")

    def test_reads_choice_text_fallback(self):
        self.assertEqual(uc._extract_response_text({"choices": [{"text": "yo"}]}), "yo")

    def test_raises_when_no_text_present(self):
        with self.assertRaises(RuntimeError):
            uc._extract_response_text({"usage": {}})
        with self.assertRaises(RuntimeError):
            uc._extract_response_text("not a dict")


class TestStripReasoning(unittest.TestCase):
    def test_removes_think_block(self):
        tag_open, tag_close = "<" + "think>", "</" + "think>"
        text = f"{tag_open}let me reason{tag_close}{{\"a\": 1}}"
        self.assertEqual(uc._strip_reasoning(text), '{"a": 1}')

    def test_leaves_plain_text_untouched(self):
        self.assertEqual(uc._strip_reasoning('{"a": 1}'), '{"a": 1}')

    def test_keeps_unclosed_think_output(self):
        """输出被截断时不能把内容整段吃掉，否则会掩盖真正的截断错误。"""
        text = "<" + "think>no closing tag"
        self.assertEqual(uc._strip_reasoning(text), text)


class TestTranslateChunk(unittest.TestCase):
    def test_sends_max_tokens_and_parses_fenced_json(self):
        captured = {}

        def fake_urlopen(req, timeout=None):
            captured["body"] = json.loads(req.data.decode("utf-8"))
            captured["timeout"] = timeout
            captured["url"] = req.full_url
            fenced = (
                "```json\n"
                + json.dumps({"translations": [{"name": "a", "desc_cn": "甲", "category": "network"}]})
                + "\n```"
            )
            return FakeResponse({"success": True, "result": {"response": fenced}})

        with mock.patch.object(uc.urllib.request, "urlopen", fake_urlopen):
            result = uc._translate_chunk([make_item("a")], "tok", "acct")

        # 核心回归点：必须显式带 max_tokens，否则 Cloudflare 默认 256 会把 JSON 截断。
        self.assertEqual(captured["body"]["max_tokens"], uc.TRANSLATION_MAX_TOKENS)
        self.assertGreater(uc.TRANSLATION_MAX_TOKENS, 256)
        self.assertEqual(captured["timeout"], uc.TRANSLATION_TIMEOUT_SECONDS)
        self.assertGreaterEqual(uc.TRANSLATION_TIMEOUT_SECONDS, 60)
        self.assertIn(uc.CF_MODEL, captured["url"])
        self.assertEqual(result["a"]["desc_cn"], "甲")

    def test_parses_chat_completions_response(self):
        def fake_urlopen(req, timeout=None):
            body = {"choices": [{"message": {"content": json.dumps(
                {"translations": [{"name": "a", "desc_cn": "乙", "category": "audio"}]}
            )}}]}
            return FakeResponse({"success": True, "result": body})

        with mock.patch.object(uc.urllib.request, "urlopen", fake_urlopen):
            result = uc._translate_chunk([make_item("a")], "tok", "acct")

        self.assertEqual(result["a"]["desc_cn"], "乙")

    def test_raises_on_truncated_json(self):
        def fake_urlopen(req, timeout=None):
            truncated = '{"translations": [{"name": "a", "desc_cn": "unterminated'
            return FakeResponse({"success": True, "result": {"response": truncated}})

        with mock.patch.object(uc.urllib.request, "urlopen", fake_urlopen):
            with self.assertRaises(json.JSONDecodeError):
                uc._translate_chunk([make_item("a")], "tok", "acct")

    def test_raises_on_api_error_flag(self):
        def fake_urlopen(req, timeout=None):
            return FakeResponse({"success": False, "errors": [{"code": 7000, "message": "nope"}]})

        with mock.patch.object(uc.urllib.request, "urlopen", fake_urlopen):
            with self.assertRaises(RuntimeError):
                uc._translate_chunk([make_item("a")], "tok", "acct")


class TestTranslateBatchSplitting(unittest.TestCase):
    def setUp(self):
        # 不要真的睡，否则拆批路径会跑几十秒。
        patcher = mock.patch.object(uc.time, "sleep", lambda *_: None)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_splits_oversized_chunk_until_it_fits(self):
        """模拟「块太大就必然失败」，验证拆批最终能把整批翻完。"""
        calls = []

        def fake_chunk(batch, cf_token, cf_account):
            calls.append(len(batch))
            if len(batch) > 4:
                raise json.JSONDecodeError("Unterminated string", "", 796)
            return {item["n"]: {"name": item["n"], "desc_cn": "译", "category": "network"} for item in batch}

        batch = [make_item(f"c{i}") for i in range(15)]
        with mock.patch.object(uc, "_translate_chunk", fake_chunk):
            result = uc._translate_batch(batch, "tok", "acct", {"failures": 0})

        self.assertEqual(len(result), 15)
        self.assertTrue(any(n > 4 for n in calls), "应当先尝试原始大小再拆批")
        self.assertTrue(any(n <= 4 for n in calls), "应当拆到能成功的大小")

    def test_returns_empty_for_hopeless_single_item_without_raising(self):
        def always_fail(batch, cf_token, cf_account):
            raise TimeoutError("The read operation timed out")

        with mock.patch.object(uc, "_translate_chunk", always_fail):
            result = uc._translate_batch([make_item("doomed")], "tok", "acct", {"failures": 0})

        self.assertEqual(result, {})

    def test_failure_budget_bounds_a_total_outage(self):
        """上游完全不可用时必须尽早停手，而不是拆批重试到天荒地老。"""
        calls = []

        def always_fail(batch, cf_token, cf_account):
            calls.append(len(batch))
            raise TimeoutError("The read operation timed out")

        items = [make_item(f"n{i}") for i in range(60)]
        with mock.patch.object(uc, "_translate_chunk", always_fail):
            result = uc.translate_new_commands(items, "tok", "acct")

        self.assertEqual(result, {})
        self.assertLessEqual(len(calls), uc.MAX_TOTAL_FAILURES)
        self.assertLessEqual(uc.MAX_TOTAL_FAILURES, 30)

    def test_translate_new_commands_chunks_by_initial_batch_size(self):
        seen = []

        def fake_chunk(batch, cf_token, cf_account):
            seen.append(len(batch))
            return {item["n"]: {"name": item["n"], "desc_cn": "译", "category": "system"} for item in batch}

        items = [make_item(f"n{i}") for i in range(40)]
        with mock.patch.object(uc, "_translate_chunk", fake_chunk):
            result = uc.translate_new_commands(items, "tok", "acct")

        self.assertEqual(len(result), 40)
        self.assertEqual(seen, [15, 15, 10])
        self.assertLessEqual(uc.INITIAL_BATCH_SIZE, 20)


class TestMainDegradation(unittest.TestCase):
    """端到端验证 main() 的降级路径：不崩、不写坏数据、不推进 SHA。"""

    NEW_SHA = "newsha0000000000000000000000000000000000"

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        old_cwd = os.getcwd()
        os.chdir(self.tmp)
        self.addCleanup(os.chdir, old_cwd)

        os.makedirs("app/website/src/data/generated", exist_ok=True)
        os.makedirs(".github/scripts", exist_ok=True)
        # 一个已存在的命令，用于确认缓存复用逻辑未被破坏。
        with open("app/website/src/data/generated/commands.json", "w", encoding="utf-8") as f:
            json.dump([{"n": "existing_cmd", "d": "0", "f": [], "en": "old", "t": "var",
                        "cn": "既有释义", "c": "system", "value": {}}], f)
        with open(".github/scripts/last_sha.txt", "w", encoding="utf-8") as f:
            f.write("oldsha")

        self.items = [make_item("existing_cmd"), make_item("good_new"), make_item("bad_new")]

    def _run(self, translations):
        with mock.patch.object(uc, "get_upstream_latest_commit_sha", lambda: self.NEW_SHA), \
             mock.patch.object(uc, "fetch_and_parse", lambda url, is_convar: [] if is_convar else self.items), \
             mock.patch.object(uc, "translate_new_commands", lambda *a, **k: translations), \
             mock.patch.dict(os.environ, {"CLOUDFLARE_AI_TOKEN": "t", "CLOUDFLARE_ACCOUNT_ID": "a"}):
            uc.main()

    def test_skips_untranslated_and_keeps_sha_for_retry(self):
        self._run({"good_new": {"name": "good_new", "desc_cn": "好", "category": "network"}})

        with open("app/website/src/data/generated/commands.json", encoding="utf-8") as f:
            data = {c["n"]: c for c in json.load(f)}

        self.assertIn("good_new", data)
        self.assertIn("existing_cmd", data)
        self.assertNotIn("bad_new", data)
        self.assertEqual(data["existing_cmd"]["cn"], "既有释义")
        self.assertEqual(data["good_new"]["cn"], "好")

        # 关键：SHA 不推进，下次运行会重新尝试 bad_new。
        with open(".github/scripts/last_sha.txt", encoding="utf-8") as f:
            self.assertEqual(f.read().strip(), "oldsha")

    def test_advances_sha_when_everything_translated(self):
        self._run({
            "good_new": {"name": "good_new", "desc_cn": "好", "category": "network"},
            "bad_new": {"name": "bad_new", "desc_cn": "坏", "category": "system"},
        })

        with open(".github/scripts/last_sha.txt", encoding="utf-8") as f:
            self.assertEqual(f.read().strip(), self.NEW_SHA)

        with open("app/website/src/data/generated/commands.json", encoding="utf-8") as f:
            data = {c["n"]: c for c in json.load(f)}
        self.assertIn("bad_new", data)

    def test_total_translation_outage_does_not_crash(self):
        self._run({})

        with open("app/website/src/data/generated/commands.json", encoding="utf-8") as f:
            data = {c["n"]: c for c in json.load(f)}
        self.assertEqual(set(data), {"existing_cmd"})
        with open(".github/scripts/last_sha.txt", encoding="utf-8") as f:
            self.assertEqual(f.read().strip(), "oldsha")


if __name__ == "__main__":
    unittest.main(verbosity=2)
