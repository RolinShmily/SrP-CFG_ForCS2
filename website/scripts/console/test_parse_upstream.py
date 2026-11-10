"""Unit tests for the strict upstream parser."""

from __future__ import annotations

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from parse_upstream import ParseError, parse_file, source_hash  # noqa: E402


CONVARS = """\
cl_crosshairstyle 2 (min: 0, max: 5, clientdll archive release)
\tCrosshair style

bot_chatter "normal" (clientdll archive)
\t<no description>

cl_showfps 0 (developmentonly clientdll defensive)
\tShow frame time (FPS) in the HUD.  0=never, 1=only if poor, 2=always
"""

COMMANDS = """\
+lookatweapon (clientdll release)
\tLook at the current weapon.

alias (clientdll release)
\tAlias a command.
"""


class TestConvarParser(unittest.TestCase):
    def test_parses_headers_bounds_and_descriptions(self):
        parsed = parse_file(CONVARS, "convar")
        records = {record["name"]: record for record in parsed.records}
        self.assertEqual(set(records), {"cl_crosshairstyle", "bot_chatter", "cl_showfps"})

        crosshair = records["cl_crosshairstyle"]
        self.assertEqual(crosshair["default"], "2")
        self.assertEqual(crosshair["min"], "0")
        self.assertEqual(crosshair["max"], "5")
        self.assertEqual(crosshair["flags"], ["clientdll", "archive", "release"])
        self.assertEqual(crosshair["description"], "Crosshair style")

        # Tab-indented text containing parentheses must remain a description,
        # never become a header.
        showfps = records["cl_showfps"]
        self.assertIn("0=never", showfps["description"])
        self.assertEqual(showfps["flags"], ["developmentonly", "clientdll", "defensive"])

    def test_quoted_default_and_no_description(self):
        parsed = parse_file(CONVARS, "convar")
        chatter = next(r for r in parsed.records if r["name"] == "bot_chatter")
        self.assertEqual(chatter["default"], "normal")
        self.assertEqual(chatter["description"], "")

    def test_multi_line_description_is_joined(self):
        text = "sv_test 1 (release)\n\tline one\n\tline two\n"
        record = parse_file(text, "convar").records[0]
        self.assertEqual(record["description"], "line one\nline two")

    def test_header_without_description_is_allowed(self):
        text = "sv_test 1 (release)\n\nsv_other 2 (release)\n"
        records = parse_file(text, "convar").records
        self.assertEqual([r["description"] for r in records], ["", ""])

    def test_bad_header_raises(self):
        with self.assertRaises(ParseError):
            parse_file("this is not a header\n", "convar")

    def test_orphan_description_raises(self):
        with self.assertRaises(ParseError):
            parse_file("\torphan description\n", "convar")

    def test_duplicate_name_raises(self):
        with self.assertRaises(ParseError):
            parse_file("sv_test 1 (release)\nsv_test 2 (release)\n", "convar")


class TestCommandParser(unittest.TestCase):
    def test_parses_plus_and_minus_commands(self):
        text = COMMANDS + "-lookatweapon (clientdll release)\n\tRelease the look.\n"
        parsed = parse_file(text, "command")
        records = {record["name"]: record for record in parsed.records}
        self.assertIn("+lookatweapon", records)
        self.assertIn("-lookatweapon", records)
        self.assertNotIn("default", records["+lookatweapon"])
        self.assertEqual(records["+lookatweapon"]["flags"], ["clientdll", "release"])


class TestSourceHash(unittest.TestCase):
    def test_whitespace_changes_do_not_invalidate(self):
        self.assertEqual(source_hash("a  b\nc"), source_hash("a b c"))

    def test_empty_description_has_no_hash(self):
        self.assertIsNone(source_hash("   "))

    def test_different_text_changes_hash(self):
        self.assertNotEqual(source_hash("a b"), source_hash("a c"))


if __name__ == "__main__":
    unittest.main()
