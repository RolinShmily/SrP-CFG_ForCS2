"""Unit tests for status derivation and indexability."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from build_index import build_index  # noqa: E402
from parse_upstream import source_hash  # noqa: E402


class TestBuildIndex(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.data_dir = Path(self.temporary.name)
        self.write(
            "convars.json",
            {
                "schemaVersion": 1,
                "type": "convar",
                "records": [
                    {
                        "type": "convar",
                        "name": "fps_max",
                        "default": "400",
                        "min": None,
                        "max": None,
                        "flags": ["clientdll", "archive"],
                        "description": "Frame rate limit",
                    },
                    {
                        "type": "convar",
                        "name": "mystery",
                        "default": "0",
                        "min": None,
                        "max": None,
                        "flags": ["release"],
                        "description": "",
                    },
                    {
                        "type": "convar",
                        "name": "dev_only",
                        "default": "1",
                        "min": None,
                        "max": None,
                        "flags": ["developmentonly", "clientdll"],
                        "description": "Development only setting",
                    },
                ],
            },
        )
        self.write(
            "commands.json",
            {
                "schemaVersion": 1,
                "type": "command",
                "records": [
                    {
                        "type": "command",
                        "name": "alias",
                        "flags": ["clientdll", "release"],
                        "description": "Alias a command.",
                    }
                ],
            },
        )
        self.write(
            "translations.json",
            {
                "schemaVersion": 1,
                "promptVersion": "console-zh-v1",
                "records": {
                    "convar:fps_max": self.entry("帧率上限。", "english", source_hash("Frame rate limit")),
                    "convar:mystery": self.entry("推测用于控制某个未文档化变量。", "name-flags", None),
                    "convar:dev_only": self.entry("仅开发用设置。", "english", source_hash("Development only setting")),
                    "command:alias": self.entry("为命令创建别名。", "english", source_hash("Alias a command.")),
                },
            },
        )
        self.write(
            "overrides.json",
            {
                "schemaVersion": 1,
                "records": {
                    "command:alias": {"zh": "人工修订的别名说明。", "category": "system"}
                },
            },
        )
        self.write(
            "categories.json",
            {
                "schemaVersion": 1,
                "categories": [
                    {"slug": "graphics", "zh": "画面与视频", "en": "Graphics & Video"},
                    {"slug": "system", "zh": "系统与引擎", "en": "System & Engine"},
                ],
            },
        )
        self.write(
            "metadata.json",
            {
                "schemaVersion": 1,
                "upstream": {
                    "repository": "SteamTracking/GameTracking-CS2",
                    "commit": "abc123",
                    "fetchedAt": "2026-11-10T00:00:00Z",
                    "files": {
                        "convars": {
                            "path": "DumpSource2/convars.txt",
                            "sha256": "sha256:" + "a" * 64,
                            "bytes": 100,
                            "records": 3,
                        },
                        "commands": {
                            "path": "DumpSource2/commands.txt",
                            "sha256": "sha256:" + "b" * 64,
                            "bytes": 100,
                            "records": 1,
                        },
                    },
                },
                "counts": {
                    "total": 4,
                    "convars": 3,
                    "commands": 1,
                    "withEnglish": 3,
                    "withoutEnglish": 1,
                },
            },
        )

    def tearDown(self):
        self.temporary.cleanup()

    def write(self, name, payload):
        (self.data_dir / name).write_text(
            json.dumps(payload, ensure_ascii=False), encoding="utf-8"
        )

    @staticmethod
    def entry(zh, basis, source_hash_value):
        return {
            "zh": zh,
            "basis": basis,
            "sourceHash": source_hash_value,
            "producer": "agent-seed",
            "model": "test-model",
            "promptVersion": "console-zh-v1",
            "translatedAt": "2026-11-10T00:00:00Z",
        }

    def test_statuses_and_indexability(self):
        index = build_index(self.data_dir)
        records = {record["key"]: record for record in index["records"]}

        self.assertEqual(records["convar:fps_max"]["translationStatus"], "translated")
        self.assertTrue(records["convar:fps_max"]["indexable"])
        self.assertEqual(records["convar:fps_max"]["category"], "graphics")

        self.assertEqual(records["convar:mystery"]["translationStatus"], "inferred")
        self.assertTrue(records["convar:mystery"]["inferred"])
        self.assertFalse(records["convar:mystery"]["indexable"])

        # Documented but internal: translated, yet not indexable.
        self.assertEqual(records["convar:dev_only"]["translationStatus"], "translated")
        self.assertFalse(records["convar:dev_only"]["indexable"])

        # Human overrides win over the AI entry.
        self.assertEqual(records["command:alias"]["translationStatus"], "human-edited")
        self.assertTrue(records["command:alias"]["indexable"])
        self.assertEqual(records["command:alias"]["summary"], "人工修订的别名说明。")
        self.assertEqual(records["command:alias"]["category"], "system")

        self.assertEqual(
            index["counts"],
            {
                "total": 4,
                "convars": 3,
                "commands": 1,
                "withEnglish": 3,
                "withoutEnglish": 1,
                "translated": 2,
                "humanEdited": 1,
                "inferred": 1,
                "stale": 0,
                "missing": 0,
                "indexable": 2,
            },
        )

    def test_inferred_entry_becomes_stale_when_english_appears(self):
        convars = json.loads((self.data_dir / "convars.json").read_text(encoding="utf-8"))
        for record in convars["records"]:
            if record["name"] == "mystery":
                record["description"] = "Now documented upstream"
        self.write("convars.json", convars)

        index = build_index(self.data_dir)
        records = {record["key"]: record for record in index["records"]}
        self.assertEqual(records["convar:mystery"]["translationStatus"], "stale")
        self.assertFalse(records["convar:mystery"]["inferred"])
        self.assertFalse(records["convar:mystery"]["indexable"])


if __name__ == "__main__":
    unittest.main()
