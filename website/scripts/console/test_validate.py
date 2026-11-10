"""Unit tests for the dataset contract."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from parse_upstream import source_hash  # noqa: E402
from validate import validate_all  # noqa: E402


def base_dataset() -> dict[str, dict]:
    convar = {
        "type": "convar",
        "name": "fps_max",
        "default": "400",
        "min": None,
        "max": None,
        "flags": ["clientdll", "archive"],
        "description": "Frame rate limit",
    }
    command = {
        "type": "command",
        "name": "alias",
        "flags": ["clientdll", "release"],
        "description": "Alias a command.",
    }
    undocumented = {
        "type": "convar",
        "name": "mystery",
        "default": "0",
        "min": None,
        "max": None,
        "flags": ["release"],
        "description": "",
    }
    return {
        "convars.json": {
            "schemaVersion": 1,
            "type": "convar",
            "records": [convar, undocumented],
        },
        "commands.json": {
            "schemaVersion": 1,
            "type": "command",
            "records": [command],
        },
        "translations.json": {
            "schemaVersion": 1,
            "promptVersion": "console-zh-v1",
            "records": {
                "convar:fps_max": {
                    "zh": "帧率上限。",
                    "basis": "english",
                    "sourceHash": source_hash("Frame rate limit"),
                    "producer": "agent-seed",
                    "model": "test-model",
                    "promptVersion": "console-zh-v1",
                    "translatedAt": "2026-11-10T00:00:00Z",
                },
                "command:alias": {
                    "zh": "为命令创建别名。",
                    "basis": "english",
                    "sourceHash": source_hash("Alias a command."),
                    "producer": "agent-seed",
                    "model": "test-model",
                    "promptVersion": "console-zh-v1",
                    "translatedAt": "2026-11-10T00:00:00Z",
                },
                "convar:mystery": {
                    "zh": "推测用于控制某个未文档化变量。",
                    "basis": "name-flags",
                    "sourceHash": None,
                    "producer": "agent-seed",
                    "model": "test-model",
                    "promptVersion": "console-zh-v1",
                    "translatedAt": "2026-11-10T00:00:00Z",
                },
            },
        },
        "overrides.json": {"schemaVersion": 1, "records": {}},
        "categories.json": {
            "schemaVersion": 1,
            "categories": [
                {"slug": "graphics", "zh": "画面与视频", "en": "Graphics & Video"},
                {"slug": "system", "zh": "系统与引擎", "en": "System & Engine"},
            ],
        },
        "metadata.json": {
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
                        "records": 2,
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
                "total": 3,
                "convars": 2,
                "commands": 1,
                "withEnglish": 2,
                "withoutEnglish": 1,
            },
        },
    }


class TestValidate(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.data_dir = Path(self.temporary.name)
        self.dataset = base_dataset()
        self.write_all()

    def tearDown(self):
        self.temporary.cleanup()

    def write_all(self):
        for name, payload in self.dataset.items():
            (self.data_dir / name).write_text(
                json.dumps(payload, ensure_ascii=False), encoding="utf-8"
            )

    def test_valid_dataset_passes(self):
        errors, _ = validate_all(self.data_dir)
        self.assertEqual(errors, [])

    def test_stale_translation_fails(self):
        self.dataset["translations.json"]["records"]["convar:fps_max"][
            "sourceHash"
        ] = source_hash("old text")
        self.write_all()
        errors, _ = validate_all(self.data_dir)
        self.assertTrue(any("sourceHash is stale" in error for error in errors))

    def test_allow_stale_downgrades_to_warning(self):
        self.dataset["translations.json"]["records"]["convar:fps_max"][
            "sourceHash"
        ] = source_hash("old text")
        self.write_all()
        errors, warnings = validate_all(self.data_dir, allow_stale=True)
        self.assertEqual(errors, [])
        self.assertTrue(any("sourceHash is stale" in warning for warning in warnings))

    def test_name_flags_translation_for_documented_convar_fails(self):
        entry = self.dataset["translations.json"]["records"]["convar:fps_max"]
        entry["basis"] = "name-flags"
        entry["sourceHash"] = None
        self.write_all()
        errors, _ = validate_all(self.data_dir)
        self.assertTrue(any("basis=name-flags" in error for error in errors))

    def test_english_translation_for_empty_description_fails(self):
        entry = self.dataset["translations.json"]["records"]["convar:mystery"]
        entry["basis"] = "english"
        entry["sourceHash"] = source_hash("Alias a command.")
        self.write_all()
        errors, _ = validate_all(self.data_dir)
        self.assertTrue(any("basis=english" in error for error in errors))

    def test_orphan_override_fails(self):
        self.dataset["overrides.json"]["records"]["convar:missing"] = {"zh": "不存在"}
        self.write_all()
        errors, _ = validate_all(self.data_dir)
        self.assertTrue(any("no matching upstream record" in error for error in errors))

    def test_duplicate_record_fails(self):
        self.dataset["convars.json"]["records"].append(
            dict(self.dataset["convars.json"]["records"][0])
        )
        self.write_all()
        errors, _ = validate_all(self.data_dir)
        self.assertTrue(any("duplicate name" in error for error in errors))

    def test_command_with_default_fails(self):
        self.dataset["commands.json"]["records"][0]["default"] = "0"
        self.write_all()
        errors, _ = validate_all(self.data_dir)
        self.assertTrue(any("must not have 'default'" in error for error in errors))

    def test_metadata_count_mismatch_fails(self):
        self.dataset["metadata.json"]["counts"]["total"] = 99
        self.write_all()
        errors, _ = validate_all(self.data_dir)
        self.assertTrue(any("counts.total" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
