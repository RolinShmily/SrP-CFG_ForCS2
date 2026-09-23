"""两个预检脚本的单元测试（无网络、无凭据）。

预检本身是「守门人」：如果它们自己的判断逻辑有 bug，会静默放行坏模型。因此这里把
test_cf_ai.py（翻译链路）和 test_worker_llm.py（网站流式问答）的纯逻辑都测一遍。
"""

import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import test_cf_ai
import test_worker_llm


class TestCfAiPreflight(unittest.TestCase):
    """预检必须能挡住「模型把中文译成拼音」这类质量退化。"""

    def test_contains_cjk_rejects_pinyin(self):
        self.assertTrue(test_cf_ai.contains_cjk("你好"))
        self.assertFalse(test_cf_ai.contains_cjk("nǐ hǎo"))
        self.assertFalse(test_cf_ai.contains_cjk("hello"))

    def test_flags_pinyin_translation(self):
        translated = {
            "sv_cheats": {"desc_cn": "nǐ hǎo", "category": "cheats"},
            "cl_crosshairstyle": {"desc_cn": "准星样式", "category": "gameplay"},
        }
        problems = test_cf_ai.check_translations(translated)
        self.assertTrue(any("不含中文" in p for p in problems), problems)

    def test_flags_missing_and_bad_category(self):
        translated = {"sv_cheats": {"desc_cn": "", "category": "cheats"}}
        problems = test_cf_ai.check_translations(translated)
        self.assertTrue(any("desc_cn 为空" in p for p in problems), problems)
        self.assertTrue(any("没有返回" in p for p in problems), problems)

    def test_passes_on_good_output(self):
        translated = {
            "sv_cheats": {"desc_cn": "允许在服务器上使用作弊", "category": "cheats"},
            "cl_crosshairstyle": {"desc_cn": "准星样式", "category": "gameplay"},
        }
        self.assertEqual(test_cf_ai.check_translations(translated), [])


class TestWorkerLlmPreflight(unittest.TestCase):
    def test_reads_model_from_worker_source(self):
        """模型名必须从 worker.ts 解析，避免预检和线上跑的不是同一个模型。"""
        model = test_worker_llm.read_worker_model()
        self.assertEqual(model, test_worker_llm.read_worker_model(test_worker_llm.WORKER_SOURCE))
        self.assertTrue(model.startswith("@cf/"), model)

    def test_raises_when_model_declaration_missing(self):
        with mock.patch("builtins.open", side_effect=OSError("boom")):
            with self.assertRaises(RuntimeError):
                test_worker_llm.read_worker_model("nope.ts")

    def test_gateway_id_matches_worker_source(self):
        """预检必须走生产同一个 AI Gateway，否则网关侧的模型限制不会被发现。"""
        with open(test_worker_llm.WORKER_SOURCE, "r", encoding="utf-8") as f:
            source = f.read()
        self.assertIn(f'id: "{test_worker_llm.AI_GATEWAY_ID}"', source)

    def test_configured_model_has_enough_context(self):
        """worker.ts 的上下文预算按 32K 标定，配置的模型不得低于该窗口。"""
        model = test_worker_llm.read_worker_model()
        window = test_worker_llm.CONTEXT_WINDOWS.get(model)
        self.assertIsNotNone(window, f"{model} 未登记上下文窗口")
        self.assertGreaterEqual(window, test_worker_llm.REQUIRED_CONTEXT_WINDOW)

    def test_extract_text_matches_ai_stream_priority(self):
        # 与 app/website/src/ai-stream.ts 的 extractText 优先级保持一致。
        self.assertEqual(test_worker_llm.extract_text({"response": "a"}), "a")
        self.assertEqual(test_worker_llm.extract_text({"delta": "b"}), "b")
        self.assertEqual(
            test_worker_llm.extract_text({"choices": [{"delta": {"content": "c"}}]}), "c"
        )
        self.assertEqual(test_worker_llm.extract_text({"usage": {}}), "")

    def test_detects_reasoning_field(self):
        self.assertTrue(test_worker_llm.has_reasoning_field({"reasoning_content": "x"}))
        self.assertTrue(
            test_worker_llm.has_reasoning_field({"choices": [{"delta": {"reasoning_content": "x"}}]})
        )
        self.assertFalse(test_worker_llm.has_reasoning_field({"response": "x"}))

    def test_flags_empty_stream(self):
        problems = test_worker_llm.check_stream("", False)
        self.assertTrue(any("没有产生任何正文" in p for p in problems), problems)

    def test_flags_pinyin_output(self):
        problems = test_worker_llm.check_stream("nǐ hǎo", False)
        self.assertTrue(any("不含中文" in p for p in problems), problems)

    def test_flags_inline_thinking_leak(self):
        tag_open = "<" + "think>"
        problems = test_worker_llm.check_stream(f"答案是 1 {tag_open}让我想想", False)
        self.assertTrue(any("思考内容泄漏" in p for p in problems), problems)

    def test_flags_reasoning_field_burn(self):
        problems = test_worker_llm.check_stream("正常中文回答", True)
        self.assertTrue(any("reasoning 字段" in p for p in problems), problems)

    def test_passes_on_clean_chinese_stream(self):
        self.assertEqual(test_worker_llm.check_stream("sv_cheats 用于开启服务器作弊。", False), [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
