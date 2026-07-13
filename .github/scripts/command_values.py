import json
import re
import sys
from pathlib import Path

NUMBER_PATTERN = r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?"
NUMERIC_DEFAULT_RE = re.compile(rf"^{NUMBER_PATTERN}$")
BOUND_RE = re.compile(rf"(?:^|\s)(min|max):\s*({NUMBER_PATTERN}),?", re.IGNORECASE)
DESCRIPTION_RANGE_RES = (
    re.compile(
        rf"(?:取值范围|范围(?:为|是|从)?|Range(?: is)?(?: from)?|between)\s*[:：]?\s*"
        rf"\[?\(?\s*({NUMBER_PATTERN})\s*(?:到|至|[-–—~])\s*({NUMBER_PATTERN})",
        re.IGNORECASE,
    ),
    re.compile(rf"\[\s*({NUMBER_PATTERN})\s*[-–—~]\s*({NUMBER_PATTERN})\s*\]"),
)
OPTION_RES = (
    re.compile(
        rf"(?<![\w.])([<>]=?\s*{NUMBER_PATTERN}|{NUMBER_PATTERN})\s*(?:=|:|：)\s*"
        r"([^，,；;。\n（）()\[\]{}]{1,100})"
    ),
    re.compile(
        rf"(?<![\w.])([<>]=?\s*{NUMBER_PATTERN}|{NUMBER_PATTERN})\s*(?:表示|为|代表)\s*"
        r"([^，,；;。\n（）()\[\]{}]{1,100})"
    ),
)
SPECIAL_OPTION_RE = re.compile(
    r"(?<!\w)(负数|正数|非零|零)\s*(?:=|:|：|表示|为|代表)\s*"
    r"([^，,；;。\n（）()\[\]{}]{1,100})"
)


def parse_convar_metadata(metadata: str) -> tuple[list[str], dict[str, str]]:
    """Separate official min/max constraints from ConVar flags."""
    bounds: dict[str, str] = {}
    for match in BOUND_RE.finditer(metadata):
        bounds[match.group(1).lower()] = match.group(2)

    flags_text = BOUND_RE.sub(" ", metadata).replace(",", " ")
    flags = [flag for flag in flags_text.split() if flag]
    return flags, bounds


def clean_legacy_flags(flags: list[str]) -> tuple[list[str], dict[str, str]]:
    """Migrate old records where `min:` / `max:` were accidentally stored as flags."""
    cleaned: list[str] = []
    bounds: dict[str, str] = {}
    index = 0
    while index < len(flags):
        token = str(flags[index]).strip()
        key = token.rstrip(":").lower()
        if key in {"min", "max"} and token.endswith(":") and index + 1 < len(flags):
            bounds[key] = str(flags[index + 1]).rstrip(",")
            index += 2
            continue
        cleaned.append(token.rstrip(","))
        index += 1
    return cleaned, bounds


def extract_description_range(text: str) -> dict[str, str]:
    for pattern in DESCRIPTION_RANGE_RES:
        match = pattern.search(text)
        if match:
            return {"min": match.group(1), "max": match.group(2)}
    return {}


def _option_sort_key(option: dict[str, str]) -> tuple[int, float | str]:
    value = option["value"].replace(" ", "")
    try:
        return 0, float(value)
    except ValueError:
        return 1, value


def extract_options(text: str) -> list[dict[str, str]]:
    """Extract only value mappings explicitly stated by the Chinese description."""
    found: list[dict[str, str]] = []
    seen: set[str] = set()

    for pattern in OPTION_RES:
        for match in pattern.finditer(text):
            value = match.group(1).replace(" ", "")
            label = match.group(2).strip(" ：:=，,；;。")
            prefix = text[max(0, match.start() - 10) : match.start()]
            if not label or value in seen or "样式" in prefix:
                continue
            seen.add(value)
            found.append({"value": value, "label": label})

    for match in SPECIAL_OPTION_RE.finditer(text):
        value = match.group(1)
        label = match.group(2).strip(" ：:=，,；;。")
        if label and value not in seen:
            seen.add(value)
            found.append({"value": value, "label": label})

    # A lone contextual number is often an example rather than an enum. Keep only
    # explicit sentinel meanings such as 0=disabled or -1=unlimited.
    if len(found) == 1:
        label = found[0]["label"]
        sentinel_terms = (
            "关闭",
            "禁用",
            "不限制",
            "无限制",
            "永久",
            "默认",
            "启用",
            "全额",
            "单像素",
            "自定义",
        )
        if not any(term in label for term in sentinel_terms):
            return []

    return sorted(found, key=_option_sort_key)


def enrich_command(command: dict) -> dict:
    flags, legacy_bounds = clean_legacy_flags(command.get("f", []))
    command["f"] = flags

    default = str(command.get("d", "")).strip()
    if command.get("t") != "var" or not NUMERIC_DEFAULT_RE.fullmatch(default):
        command.pop("value", None)
        return command

    existing_value = command.get("value") if isinstance(command.get("value"), dict) else {}
    existing_constraint = (
        existing_value.get("constraint")
        if isinstance(existing_value.get("constraint"), dict)
        else {}
    )
    constraint = {
        key: str(candidate)
        for key in ("min", "max")
        if (candidate := existing_constraint.get(key) or legacy_bounds.get(key)) is not None
        and str(candidate) != ""
    }

    description = str(command.get("cn", ""))
    documented_range = extract_description_range(description)
    options = extract_options(description)

    value: dict[str, object] = {}
    if constraint:
        value["constraint"] = constraint
    if documented_range and documented_range != constraint:
        value["documented_range"] = documented_range
    if options:
        value["options"] = options

    if constraint.get("min") and constraint.get("max"):
        range_note = f"引擎元数据限制为 {constraint['min']}–{constraint['max']}。"
    elif constraint.get("min"):
        range_note = f"引擎元数据仅公开下限 {constraint['min']}，未公开固定上限。"
    elif constraint.get("max"):
        range_note = f"引擎元数据仅公开上限 {constraint['max']}，未公开固定下限。"
    elif documented_range:
        range_note = (
            f"上游说明列出的有效范围为 {documented_range['min']}–{documented_range['max']}；"
            "这不代表引擎强制 Min/Max。"
        )
    else:
        range_note = "上游未公开固定的 Min/Max 限制。"

    option_note = "已识别的离散取值含义见下方。" if options else "具体控制对象与作用见上方释义。"
    value["description"] = f"默认值为 {default}。{range_note}{option_note}"
    command["value"] = value
    return command


def enrich_dataset(commands: list[dict]) -> list[dict]:
    return [enrich_command(command) for command in commands]


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "app/website/public/data/commands.json")
    commands = json.loads(path.read_text(encoding="utf-8"))
    enrich_dataset(commands)
    path.write_text(json.dumps(commands, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    numeric = [command for command in commands if "value" in command]
    ranged = [
        command
        for command in numeric
        if command["value"].get("constraint") or command["value"].get("documented_range")
    ]
    enumerated = [command for command in numeric if command["value"].get("options")]
    print(
        f"Enriched {len(numeric)} numeric ConVars: "
        f"{len(ranged)} with sourced ranges, {len(enumerated)} with explicit value mappings."
    )


if __name__ == "__main__":
    main()
