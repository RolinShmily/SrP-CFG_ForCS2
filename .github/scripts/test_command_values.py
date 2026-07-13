import copy
import json
import sys
import unittest
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from command_values import (  # noqa: E402
    enrich_command,
    extract_options,
    parse_convar_metadata,
)
from sync_vectorize import format_value_metadata  # noqa: E402


class CommandValueMetadataTests(unittest.TestCase):
    def test_parser_separates_engine_constraints_from_flags(self):
        flags, bounds = parse_convar_metadata(
            "min: -20, max: 20, gamedll clientdll replicated release"
        )

        self.assertEqual(bounds, {"min": "-20", "max": "20"})
        self.assertEqual(flags, ["gamedll", "clientdll", "replicated", "release"])

    def test_numeric_enrichment_keeps_constraint_provenance(self):
        command = {
            "n": "sample",
            "d": "0.5",
            "f": ["archive"],
            "t": "var",
            "cn": "控制透明度。",
            "value": {"constraint": {"min": "0", "max": "1"}},
        }

        enriched = enrich_command(command)

        self.assertEqual(
            enriched["value"]["constraint"], {"min": "0", "max": "1"}
        )
        self.assertNotIn("documented_range", enriched["value"])
        self.assertIn("引擎元数据限制为 0–1", enriched["value"]["description"])

    def test_prose_range_is_not_labeled_as_engine_constraint(self):
        command = {
            "n": "sample",
            "d": "0",
            "f": ["release"],
            "t": "var",
            "cn": "取值范围1到99时显示预测结果。",
        }

        enriched = enrich_command(command)

        self.assertNotIn("constraint", enriched["value"])
        self.assertEqual(
            enriched["value"]["documented_range"], {"min": "1", "max": "99"}
        )
        self.assertIn("不代表引擎强制 Min/Max", enriched["value"]["description"])

    def test_explicit_enum_values_are_structured(self):
        options = extract_options("难度：0=简单，1=普通，2=困难，3=专家。")

        self.assertEqual(
            options,
            [
                {"value": "0", "label": "简单"},
                {"value": "1", "label": "普通"},
                {"value": "2", "label": "困难"},
                {"value": "3", "label": "专家"},
            ],
        )

    def test_contextual_number_is_not_misread_as_enum(self):
        self.assertEqual(
            extract_options("针对准星样式 1：设置固定准星分支之间的间距。"),
            [],
        )

    def test_non_numeric_defaults_do_not_receive_numeric_metadata(self):
        command = {
            "n": "sample",
            "d": "automatic",
            "f": ["archive"],
            "t": "var",
            "cn": "选择自动模式。",
            "value": {"description": "stale"},
        }

        self.assertNotIn("value", enrich_command(command))

    def test_vector_metadata_flattens_nested_value_data(self):
        command = {
            "value": {
                "constraint": {"min": "0", "max": "2"},
                "documented_range": {"min": "1", "max": "2"},
                "options": [
                    {"value": "0", "label": "关闭"},
                    {"value": "1", "label": "开启"},
                ],
                "description": "默认值为 0。",
            }
        }

        description, ranges, options = format_value_metadata(command)

        self.assertEqual(description, "默认值为 0。")
        self.assertEqual(ranges, "引擎约束: 0–2；说明范围: 1–2")
        self.assertEqual(options, "0=关闭；1=开启")

    def test_repository_data_obeys_numeric_schema(self):
        path = SCRIPT_DIR.parents[1] / "app/website/public/data/commands.json"
        commands = json.loads(path.read_text(encoding="utf-8"))

        numeric = [
            command
            for command in commands
            if command.get("t") == "var"
            and __import__("re").fullmatch(
                r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?",
                str(command.get("d", "")).strip(),
            )
        ]
        self.assertTrue(numeric)
        self.assertTrue(all("value" in command for command in numeric))
        self.assertFalse(
            any(
                flag.rstrip(",").lower() in {"min:", "max:"}
                for command in commands
                for flag in command.get("f", [])
            )
        )

        for command in numeric:
            value = command["value"]
            self.assertIn("description", value)
            self.assertNotIn("min", value)
            self.assertNotIn("max", value)
            option_values = [option["value"] for option in value.get("options", [])]
            self.assertEqual(len(option_values), len(set(option_values)))

    def test_enrichment_is_idempotent(self):
        command = {
            "n": "sample",
            "d": "1",
            "f": ["min:", "0,", "max:", "2,", "archive"],
            "t": "var",
            "cn": "模式：0=关闭，1=自动，2=开启。",
        }

        first = enrich_command(copy.deepcopy(command))
        second = enrich_command(copy.deepcopy(first))
        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
