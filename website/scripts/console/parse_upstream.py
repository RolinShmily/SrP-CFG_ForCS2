#!/usr/bin/env python3
"""Parse SteamTracking/GameTracking-CS2 DumpSource2 dumps.

Upstream format (master, DumpSource2):

    convar_name default (flags min: 0, max: 100)
        English description, one or more tab-indented lines

    command_name (flags)
        English description

The parser is deliberately strict. A non-tab line that is not a valid header
raises ParseError instead of being skipped: when Valve changes the dump format,
the sync must stop for review rather than silently persist a truncated dataset.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass

NUMBER = r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?"
NUMBER_RE = re.compile(rf"^{NUMBER}$")
BOUND_RE = re.compile(rf"\b(min|max):\s*({NUMBER})", re.IGNORECASE)
NAME_RE = re.compile(r"^[A-Za-z0-9_+\-]+$")
CONVAR_HEADER_RE = re.compile(
    rf"^(?P<name>\S+)\s+(?P<default>.*?)\s*\((?P<meta>[^()]*)\)\s*$"
)
COMMAND_HEADER_RE = re.compile(rf"^(?P<name>\S+)\s*\((?P<meta>[^()]*)\)\s*$")


class ParseError(ValueError):
    """Raised when the upstream dump no longer matches the expected format."""


@dataclass
class ParsedFile:
    records: list[dict]
    text: str
    sha256: str
    byte_length: int


def sha256_text(text: str) -> str:
    return "sha256:" + hashlib.sha256(text.encode("utf-8")).hexdigest()


def source_hash(description: str) -> str | None:
    """Stable hash of the English source used to invalidate translations.

    Whitespace changes alone must not invalidate a translation, so the hash is
    computed over whitespace-collapsed text. Empty descriptions hash to None:
    there is no source text to translate.
    """
    normalized = " ".join(description.split())
    if not normalized:
        return None
    return sha256_text(normalized)


def strip_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def parse_meta(meta: str) -> tuple[list[str], str | None, str | None]:
    """Split `flags min: 0, max: 100` into flags and numeric bounds.

    Bounds are engine metadata, not flags. Keeping them in `flags` was a legacy
    bug that made downstream value parsing ambiguous.
    """
    bounds: dict[str, str] = {}
    for match in BOUND_RE.finditer(meta):
        bounds[match.group(1).lower()] = match.group(2)

    remainder = BOUND_RE.sub(" ", meta)
    flags = [token for token in re.split(r"[,\s]+", remainder) if token]

    for flag in flags:
        if flag.rstrip(":").lower() in {"min", "max"}:
            raise ParseError(f"Unparsed bound token in flags: {meta!r}")

    return flags, bounds.get("min"), bounds.get("max")


def parse_file(text: str, kind: str) -> ParsedFile:
    """Parse one dump file.

    `kind` is `convar` or `command`. The returned records contain only upstream
    facts; translations never enter this layer.
    """
    if kind not in {"convar", "command"}:
        raise ValueError(f"Unsupported record kind: {kind!r}")

    header_re = CONVAR_HEADER_RE if kind == "convar" else COMMAND_HEADER_RE
    records: list[dict] = []
    current: dict | None = None
    description_lines: list[str] = []

    def flush_description() -> None:
        if current is None:
            return
        description = "\n".join(description_lines).strip()
        current["description"] = "" if description == "<no description>" else description

    for lineno, raw in enumerate(text.splitlines(), start=1):
        if raw.startswith("\t"):
            if current is None:
                raise ParseError(
                    f"line {lineno}: description without a preceding header: {raw!r}"
                )
            piece = raw.strip()
            if piece and piece != "<no description>":
                description_lines.append(piece)
            continue

        if not raw.strip() or raw.lstrip().startswith("---"):
            flush_description()
            current = None
            description_lines = []
            continue

        header = raw.strip()
        match = header_re.match(header)
        if not match:
            raise ParseError(
                f"line {lineno}: unrecognized {kind} header: {header!r}"
            )

        name = match.group("name")
        if not NAME_RE.fullmatch(name):
            raise ParseError(f"line {lineno}: invalid {kind} name: {name!r}")

        flags, min_value, max_value = parse_meta(match.group("meta"))
        record: dict = {"type": kind, "name": name, "flags": flags}
        if kind == "convar":
            record["default"] = strip_quotes(match.group("default").strip())
            record["min"] = min_value
            record["max"] = max_value

        flush_description()
        records.append(record)
        current = record
        description_lines = []

    flush_description()

    names = {record["name"] for record in records}
    if len(names) != len(records):
        duplicates = sorted(
            name for name in names if sum(r["name"] == name for r in records) > 1
        )
        raise ParseError(f"duplicate {kind} names: {duplicates[:10]}")

    return ParsedFile(
        records=records,
        text=text,
        sha256=sha256_text(text),
        byte_length=len(text.encode("utf-8")),
    )


def parse_upstream(convars_text: str, commands_text: str) -> dict[str, ParsedFile]:
    return {
        "convar": parse_file(convars_text, "convar"),
        "command": parse_file(commands_text, "command"),
    }


def record_key(record: dict) -> str:
    return f"{record['type']}:{record['name']}"
