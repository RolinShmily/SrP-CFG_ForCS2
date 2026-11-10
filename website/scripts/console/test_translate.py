"""Unit tests for translation parsing and work scheduling."""

from __future__ import annotations

import json
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from parse_upstream import source_hash  # noqa: E402
from translate import (  # noqa: E402
    build_work_items,
    contains_cjk,
    missing_numbers,
    parse_translations,
    strip_fences,
    translate_chunk,
)


class EmptyBackend:
    def complete(self, system, user):
        return '{"translations":[]}'


class TestParseTranslations(unittest.TestCase):
    def test_parses_plain_json(self):
        text = json.dumps(
            {"translations": [{"key": "convar:a", "zh": "甲"}]}, ensure_ascii=False
        )
        results, missing = parse_translations(text, {"convar:a"})
        self.assertEqual(results, {"convar:a": "甲"})
        self.assertEqual(missing, set())

    def test_strips_markdown_fence(self):
        text = "```json\n{\"translations\":[{\"key\":\"convar:a\",\"zh\":\"甲\"}]}\n```"
        results, _ = parse_translations(text, {"convar:a"})
        self.assertEqual(results["convar:a"], "甲")

    def test_ignores_unknown_keys_and_reports_missing(self):
        text = json.dumps(
            {
                "translations": [
                    {"key": "convar:a", "zh": "甲"},
                    {"key": "convar:extra", "zh": "乙"},
                ]
            },
            ensure_ascii=False,
        )
        results, missing = parse_translations(text, {"convar:a", "convar:b"})
        self.assertEqual(results, {"convar:a": "甲"})
        self.assertEqual(missing, {"convar:b"})

    def test_tolerates_prose_around_json(self):
        text = 'Here is the result: {"translations":[{"key":"convar:a","zh":"甲"}]} done'
        results, _ = parse_translations(text, {"convar:a"})
        self.assertEqual(results["convar:a"], "甲")

    def test_strip_fences_leaves_plain_text(self):
        self.assertEqual(strip_fences("hello"), "hello")


class TestHelpers(unittest.TestCase):
    def test_missing_numbers(self):
        self.assertEqual(missing_numbers("Range 0-100, default 5", "范围 0-100，默认 6"), ["5"])
        self.assertEqual(missing_numbers("Value 0.5", "值 0.5"), [])

    def test_contains_cjk(self):
        self.assertTrue(contains_cjk("帧率上限"))
        self.assertFalse(contains_cjk("fps_max"))


class TestWorkItems(unittest.TestCase):
    def record(self, name, description):
        return {
            "type": "convar",
            "name": name,
            "default": "0",
            "min": None,
            "max": None,
            "flags": ["release"],
            "description": description,
        }

    def test_skips_fresh_translation(self):
        record = self.record("fps_max", "Frame rate limit")
        fresh = {
            "convar:fps_max": {
                "zh": "帧率上限。",
                "basis": "english",
                "sourceHash": source_hash("Frame rate limit"),
                "promptVersion": "console-zh-v1",
            }
        }
        items = build_work_items(
            [record], fresh, {}, allow_inferred=True, force=False
        )
        self.assertEqual(items, [])

    def test_retranslates_when_source_changes(self):
        record = self.record("fps_max", "New text")
        stale = {
            "convar:fps_max": {
                "zh": "旧译文",
                "basis": "english",
                "sourceHash": source_hash("Old text"),
            }
        }
        items = build_work_items([record], stale, {}, allow_inferred=True, force=False)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["basis"], "english")

    def test_infers_only_when_allowed(self):
        record = self.record("mystery", "")
        items = build_work_items([record], {}, {}, allow_inferred=True, force=False)
        self.assertEqual(items[0]["basis"], "name-flags")
        self.assertIsNone(items[0]["sourceHash"])

        items = build_work_items([record], {}, {}, allow_inferred=False, force=False)
        self.assertEqual(items, [])

    def test_human_override_is_never_touched(self):
        record = self.record("fps_max", "Frame rate limit")
        items = build_work_items(
            [record],
            {},
            {"convar:fps_max": {"zh": "人工译文"}},
            allow_inferred=True,
            force=True,
        )
        self.assertEqual(items, [])

    def test_force_retranslates_fresh_entry(self):
        record = self.record("fps_max", "Frame rate limit")
        fresh = {
            "convar:fps_max": {
                "zh": "帧率上限。",
                "basis": "english",
                "sourceHash": source_hash("Frame rate limit"),
                "promptVersion": "console-zh-v1",
            }
        }
        items = build_work_items([record], fresh, {}, allow_inferred=True, force=True)
        self.assertEqual(len(items), 1)


class TestTranslationLoopTermination(unittest.TestCase):
    def test_no_progress_partial_response_terminates(self):
        """A model that returns no usable Chinese must not recurse forever."""
        items = [
            {
                "key": "convar:a",
                "name": "a",
                "type": "convar",
                "default": "0",
                "min": None,
                "max": None,
                "flags": ["release"],
                "en": "Alpha",
                "basis": "english",
                "sourceHash": source_hash("Alpha"),
            },
            {
                "key": "convar:b",
                "name": "b",
                "type": "convar",
                "default": "0",
                "min": None,
                "max": None,
                "flags": ["release"],
                "en": "Beta",
                "basis": "english",
                "sourceHash": source_hash("Beta"),
            },
        ]
        state = {"failures": 0, "max_failures": 100}
        with mock.patch("translate.time.sleep", return_value=None):
            result = translate_chunk(EmptyBackend(), items, state)
        self.assertEqual(result, {})
        self.assertGreater(state["failures"], 0)
        self.assertLess(state["failures"], state["max_failures"])


if __name__ == "__main__":
    unittest.main()
