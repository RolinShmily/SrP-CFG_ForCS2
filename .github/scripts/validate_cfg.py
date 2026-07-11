#!/usr/bin/env python3
"""Validate the SrP-CFG source tree and optional release ZIP artifacts."""

from __future__ import annotations

import argparse
import re
from pathlib import Path, PurePosixPath
from zipfile import ZipFile

import yaml


ROOT = Path.cwd()
CONFIG_ROOT = ROOT / "config"
PACKAGES_FILE = ROOT / ".github" / "packages.yaml"
V3_ROOT_ENTRIES = {"autoexec.cfg", "annotations", "video", "srp-cfg"}
V3_ROOT_DIRECTORIES = {"annotations", "video", "srp-cfg"}
FORBIDDEN_V3_PATH_PARTS = {
    "classic", "legacy", "migration", "profiles", "selectors", "generated", "startup.cfg"
}
FORBIDDEN_PERSISTENCE_SUFFIXES = (".vcfg", ".vcfg_lastclouded")
EXEC_RE = re.compile(r"\bexec(?:ifexists)?\s+[\"']?([A-Za-z0-9_./\\-]+)", re.IGNORECASE)
DIRECT_EXEC_RE = re.compile(
    r"^\s*exec(?:ifexists)?\s+[\"']?([A-Za-z0-9_./\\-]+)",
    re.IGNORECASE | re.MULTILINE,
)
DIRECT_EXEC_LINE_RE = re.compile(
    r"^\s*exec(?:ifexists)?\s+[\"']?([A-Za-z0-9_./\\-]+)[\"']?\s*$",
    re.IGNORECASE,
)
ALIAS_LINE_RE = re.compile(r'^\s*alias\s+"?([^"\s]+)"?\s+"(.*)"\s*$', re.IGNORECASE)
PHYSICAL_BIND_RE = re.compile(r"^\s*(?:bind|unbind)\b", re.IGNORECASE | re.MULTILINE)
KEYMAP_LINE_RE = re.compile(r"^\s*(?:bind|unbind|binddefaults)\b", re.IGNORECASE)
EXPECTED_AUTOEXEC_CHAIN = [
    "srp-cfg/runtime/init.cfg",
    "srp-cfg/user/custom.cfg",
]
EXPECTED_RUNTIME_CHAIN = [
    "srp-cfg/runtime/commands.cfg",
    "srp-cfg/runtime/aliases.cfg",
    "srp-cfg/features/crosshair-view/runtime.cfg",
    "srp-cfg/features/autoview/runtime.cfg",
    "srp-cfg/features/knife/runtime.cfg",
    "srp-cfg/features/zeus/runtime.cfg",
    "srp-cfg/modes/practice/runtime.cfg",
    "srp-cfg/modes/preview/runtime.cfg",
    "srp-cfg/modes/guidemake/runtime.cfg",
    "srp-cfg/modes/demo-hlae/runtime.cfg",
]
PRESET_NAMES = {"default", "echo", "yszh", "visionl", "valve"}
MODULE_FILES = {"runtime.cfg", "settings.cfg", "keymap.cfg", "with-keymap.cfg", "help.cfg"}
RESETTABLE_COMMAND_RE = re.compile(
    r"^(?:cl_|r_|snd_|viewmodel_|hud_|safezone|spec_|voice_|engine_|mm_|"
    r"gameinstructor|func_break|zoom_|tv_listen_|fps_max$|con_enable$|crosshair$|"
    r"sensitivity$|m_yaw$|volume$|fog_override$|fov_cs_debug$|host_timescale$)",
    re.IGNORECASE,
)
RESET_COVERAGE_IGNORE = {"cl_ticktiming"}
REQUIRED_RUNTIME_ALIASES = {
    "keyhud", "back", "zeus", "gm", "lefthand", "debounce", "silencer",
    "avatars", "numbers", "tracer", "ping", "squareon", "squareoff", "round",
    "sniperon", "sniperoff", "flyn", "flyralt", "ps", "pd", "show", "notshow",
    "srp_apply_default", "srp_apply_echo", "srp_apply_yszh", "srp_apply_visionl",
    "srp_reset_valve", "srp_reset_valve_user", "srp_reset_valve_settings",
    "srp_reset_valve_keys", "srp_crosshair_view", "srp_crosshair_view_keys",
    "srp_autoview", "srp_autoview_keys", "srp_zeus", "srp_zeus_keys", "srp_knife",
    "srp_practice", "srp_practice_keys", "srp_preview", "srp_preview_keys",
    "srp_demo", "srp_demo_keys", "srp_guidemake", "srp_guidemake_keys",
    "srp_reload", "srp_help", "srp_help_presets", "srp_help_reset",
    "srp_help_crosshair", "srp_help_autoview", "srp_help_knife", "srp_help_zeus",
    "srp_help_practice", "srp_help_preview", "srp_help_guidemake", "srp_help_demo",
    "c00", "c01", "c02", "c03", "c04", "c05", "c06", "c07",
    "v00", "v01", "v02", "v03", "v04", "v05", "v06", "v07",
    "keyc", "keyv", "switchthrow", "view_0", "view_1",
    "red", "orange", "yellow", "green", "cyan", "blue", "purple", "black",
    "white", "pink", "brown", "gray", "spawn", "gkd", "gg", "plant", "xray",
    "+Pucci", "-Pucci", "switchperson", "switch-impactsNpreview",
    "depre", "changeblur", "changefov", "changeang++", "changeang--",
    "srp_guide_he", "srp_guide_flash", "srp_guide_smoke", "srp_guide_fire",
    "srp_guide_decoy", "srp_guide_delete", "srp_guide_save", "srp_guide_upload",
    "rec", "rec_end", "campath", "campath_draw", "gear_up", "gear_down",
    "bluron", "bluroff", "demoshow", "demonoshow",
    "att0", "att1", "+firr1", "-firr1", "+firr2", "-firr2",
}


class ValidationError(RuntimeError):
    pass


def is_forbidden_persistence_file(raw_name: str) -> bool:
    name = PurePosixPath(raw_name.replace("\\", "/")).name.lower()
    return name.endswith(FORBIDDEN_PERSISTENCE_SUFFIXES) or name == "remotecache.vdf"


def cfg_name(raw: str) -> str:
    value = raw.replace("\\", "/").lstrip("/")
    if not value.lower().endswith(".cfg"):
        value += ".cfg"
    target = PurePosixPath(value)
    if any(part in {"", ".", ".."} for part in target.parts):
        raise ValidationError(f"Unsafe exec target: {raw!r}")
    return target.as_posix()


def executable_text(text: str) -> str:
    lines = []
    for line in text.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("//"):
            continue
        lines.append(line.split("//", 1)[0])
    return "\n".join(lines)


def exec_targets(text: str, direct_only: bool = False) -> list[str]:
    pattern = DIRECT_EXEC_RE if direct_only else EXEC_RE
    executable = executable_text(text)
    return [cfg_name(match.group(1)) for match in pattern.finditer(executable)]


def read_cfg(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def validate_cfg_syntax(name: str, text: str) -> None:
    for line_number, raw_line in enumerate(text.splitlines(), start=1):
        if raw_line.lstrip().startswith("//"):
            continue
        code = raw_line.split("//", 1)[0]
        quote_count = code.count('"')
        if quote_count % 2:
            raise ValidationError(f"Unbalanced quotes in {name}:{line_number}: {raw_line}")
        if code.lstrip().lower().startswith("alias ") and quote_count > 4:
            raise ValidationError(
                f"Nested quotes in alias definition {name}:{line_number}: {raw_line}"
            )


def validate_editable_line_comments(name: str, text: str) -> None:
    """Require a local explanation for every user-editable command line."""
    for line_number, raw_line in enumerate(text.splitlines(), start=1):
        stripped = raw_line.strip()
        if not stripped or stripped.startswith("//"):
            continue
        if "//" not in raw_line:
            raise ValidationError(
                f"Editable CFG command is missing an inline comment: "
                f"{name}:{line_number}: {stripped}"
            )


def assert_no_cycles(graph: dict[str, list[str]], start: str, label: str) -> None:
    active: list[str] = []
    visited: set[str] = set()

    def visit(node: str) -> None:
        if node in active:
            cycle = " -> ".join([*active[active.index(node):], node])
            raise ValidationError(f"{label} exec recursion: {cycle}")
        if node in visited:
            return
        active.append(node)
        for target in graph.get(node, []):
            visit(target)
        active.pop()
        visited.add(node)

    visit(start)


def assert_runtime_registration_only(
    cfg_text: dict[str, str], start: str, label: str
) -> set[str]:
    pending = [start]
    visited: set[str] = set()

    while pending:
        name = pending.pop()
        if name in visited or name not in cfg_text:
            continue
        visited.add(name)

        for raw_line in executable_text(cfg_text[name]).splitlines():
            line = raw_line.strip()
            if not line:
                continue
            match = DIRECT_EXEC_LINE_RE.match(line)
            if match:
                pending.append(cfg_name(match.group(1)))
                continue
            if re.match(r"^(?:alias|echo|echoln)\b", line, re.IGNORECASE):
                continue
            raise ValidationError(f"{label} executes non-Runtime command in {name}: {line}")

    return visited


def direct_exec_targets(text: str) -> list[str]:
    return exec_targets(text, direct_only=True)


def runtime_aliases(cfg_text: dict[str, str], files: set[str]) -> set[str]:
    aliases: set[str] = set()
    definitions: dict[str, tuple[str, str]] = {}
    for name in files:
        for line in executable_text(cfg_text[name]).splitlines():
            match = ALIAS_LINE_RE.match(line.strip())
            if not match:
                continue
            alias_name = match.group(1)
            alias_key = alias_name.lower()
            body = match.group(2)
            previous = definitions.get(alias_key)
            if previous is not None and previous[0] != body:
                raise ValidationError(
                    f"Runtime alias collision for {alias_name}: {previous[1]} and {name}"
                )
            definitions[alias_key] = (body, name)
            aliases.add(alias_name)
            if '"' in match.group(2):
                raise ValidationError(
                    f"Runtime alias contains nested quotes in {name}: {line.strip()}"
                )
    return aliases


def command_heads(text: str) -> set[str]:
    commands: set[str] = set()
    for raw_line in executable_text(text).splitlines():
        line = raw_line.strip()
        if not line or re.match(r"^(?:bind|unbind|binddefaults)\b", line, re.IGNORECASE):
            continue
        alias_match = ALIAS_LINE_RE.match(line)
        segments = alias_match.group(2).split(";") if alias_match else line.split(";")
        for segment in segments:
            match = re.match(r"^([^\s]+)", segment.strip())
            if match:
                commands.add(match.group(1).lower())
    return commands


def validate_valve_reset_coverage(cfg_text: dict[str, str]) -> None:
    managed: set[str] = set()
    for name, text in cfg_text.items():
        if name.startswith("srp-cfg/presets/valve/"):
            continue
        for command in command_heads(text):
            if RESETTABLE_COMMAND_RE.match(command) and command not in RESET_COVERAGE_IGNORE:
                managed.add(command)

    valve_name = "srp-cfg/presets/valve/settings.cfg"
    valve_commands = command_heads(cfg_text[valve_name])
    missing = sorted(managed.difference(valve_commands))
    if missing:
        raise ValidationError(
            "Valve baseline is missing SrP-managed client fields: " + ", ".join(missing)
        )


def validate_preset_layout(names: dict[str, Path]) -> None:
    preset_root = CONFIG_ROOT / "srp-cfg" / "presets"
    actual_presets = {path.name for path in preset_root.iterdir() if path.is_dir()}
    if actual_presets != PRESET_NAMES:
        raise ValidationError(
            "Preset directories must be exactly: "
            + ", ".join(sorted(PRESET_NAMES))
            + f"; found {sorted(actual_presets)!r}"
        )

    for preset in sorted(PRESET_NAMES):
        prefix = f"srp-cfg/presets/{preset}"
        apply_name = f"{prefix}/apply.cfg"
        settings_name = f"{prefix}/settings.cfg"
        keymap_name = f"{prefix}/keymap.cfg"
        for required in (apply_name, settings_name, keymap_name):
            if required not in names:
                raise ValidationError(f"Preset {preset} is missing {required}")

        # Every built-in preset is a complete, peer-level example. A personal
        # preset must never inherit Default implicitly because that would hide
        # part of its effective settings and keymap from review.
        expected_execs = [settings_name, keymap_name]
        actual_execs = direct_exec_targets(read_cfg(names[apply_name]))
        if actual_execs != expected_execs:
            raise ValidationError(
                f"Preset {preset} apply order must be {expected_execs!r}; "
                f"found {actual_execs!r}"
            )

        settings_raw = read_cfg(names[settings_name])
        keymap_raw = read_cfg(names[keymap_name])
        settings = executable_text(settings_raw)
        keymap = executable_text(keymap_raw)
        if "//" not in settings_raw or "//" not in keymap_raw:
            raise ValidationError(f"Preset {preset} settings/keymap must retain explanatory comments")
        if re.search(r"^\s*alias\b", settings, re.IGNORECASE | re.MULTILINE):
            raise ValidationError(f"Preset settings cannot define aliases: {settings_name}")
        if PHYSICAL_BIND_RE.search(settings) or re.search(
            r"^\s*binddefaults\b", settings, re.IGNORECASE | re.MULTILINE
        ):
            raise ValidationError(f"Preset settings cannot bind keys: {settings_name}")
        if re.search(r"^\s*alias\b", keymap, re.IGNORECASE | re.MULTILINE):
            raise ValidationError(f"Preset keymap cannot define aliases: {keymap_name}")
        for line in keymap.splitlines():
            stripped = line.strip()
            if stripped and not KEYMAP_LINE_RE.match(stripped):
                raise ValidationError(
                    f"Preset keymap may contain only bind/unbind/binddefaults: "
                    f"{keymap_name}: {stripped}"
                )

    valve_keymap = executable_text(read_cfg(names["srp-cfg/presets/valve/keymap.cfg"]))
    if not re.search(r"^\s*binddefaults\b", valve_keymap, re.IGNORECASE | re.MULTILINE):
        raise ValidationError("Valve baseline keymap must use the game's binddefaults command")

    commands_name = "srp-cfg/runtime/commands.cfg"
    command_aliases = {
        match.group(1).lower(): match.group(2)
        for line in executable_text(read_cfg(names[commands_name])).splitlines()
        if (match := ALIAS_LINE_RE.match(line.strip()))
    }
    for preset in ("default", "echo", "yszh", "visionl"):
        alias_name = f"srp_apply_{preset}"
        expected = f"exec srp-cfg/presets/{preset}/apply.cfg"
        actual = command_aliases.get(alias_name)
        if actual != expected:
            raise ValidationError(
                f"{alias_name} must be safe inside user/custom.cfg and equal {expected!r}; "
                f"found {actual!r}"
            )


def validate_module_layout(names: dict[str, Path], cfg_text: dict[str, str]) -> None:
    for family in ("features", "modes"):
        family_root = CONFIG_ROOT / "srp-cfg" / family
        for module_dir in sorted(path for path in family_root.iterdir() if path.is_dir()):
            module = module_dir.name
            prefix = f"srp-cfg/{family}/{module}"
            actual_files = {path.name for path in module_dir.iterdir() if path.is_file()}
            if actual_files != MODULE_FILES:
                raise ValidationError(
                    f"Module {family}/{module} must contain exactly {sorted(MODULE_FILES)!r}; "
                    f"found {sorted(actual_files)!r}"
                )

            runtime_name = f"{prefix}/runtime.cfg"
            settings_name = f"{prefix}/settings.cfg"
            keymap_name = f"{prefix}/keymap.cfg"
            with_keymap_name = f"{prefix}/with-keymap.cfg"
            help_name = f"{prefix}/help.cfg"

            assert_runtime_registration_only(cfg_text, runtime_name, f"Module {family}/{module}")
            settings = executable_text(cfg_text[settings_name])
            if PHYSICAL_BIND_RE.search(settings) or re.search(
                r"^\s*binddefaults\b", settings, re.IGNORECASE | re.MULTILINE
            ):
                raise ValidationError(f"Module settings cannot bind physical keys: {settings_name}")

            keymap = executable_text(cfg_text[keymap_name])
            for line in keymap.splitlines():
                stripped = line.strip()
                if stripped and not KEYMAP_LINE_RE.match(stripped):
                    raise ValidationError(
                        f"Module keymap may contain only bind/unbind/binddefaults: "
                        f"{keymap_name}: {stripped}"
                    )

            expected_execs = [settings_name, keymap_name]
            actual_execs = direct_exec_targets(cfg_text[with_keymap_name])
            if actual_execs != expected_execs:
                raise ValidationError(
                    f"Module {family}/{module} with-keymap order must be {expected_execs!r}; "
                    f"found {actual_execs!r}"
                )

            for line in executable_text(cfg_text[help_name]).splitlines():
                stripped = line.strip()
                if stripped and not re.match(r"^(?:echo|echoln)\b", stripped, re.IGNORECASE):
                    raise ValidationError(f"Module help may contain only echo output: {help_name}: {stripped}")


def validate_source() -> None:
    root_entries = {entry.name: entry for entry in CONFIG_ROOT.iterdir()}
    unexpected_root_entries = sorted(set(root_entries).difference(V3_ROOT_ENTRIES))
    if unexpected_root_entries:
        raise ValidationError(
            "config/ root contains files outside the v3 layout: "
            + ", ".join(unexpected_root_entries)
        )

    missing_root_entries = sorted(V3_ROOT_ENTRIES.difference(root_entries))
    if missing_root_entries:
        raise ValidationError(
            "config/ root is missing required v3 entries: "
            + ", ".join(missing_root_entries)
        )

    if not root_entries["autoexec.cfg"].is_file():
        raise ValidationError("config/autoexec.cfg must be a file")
    invalid_directories = sorted(
        name for name in V3_ROOT_DIRECTORIES if not root_entries[name].is_dir()
    )
    if invalid_directories:
        raise ValidationError(
            "config/ v3 directory entries are not directories: "
            + ", ".join(invalid_directories)
        )

    forbidden_source_files = sorted(
        path.relative_to(CONFIG_ROOT).as_posix()
        for path in CONFIG_ROOT.rglob("*")
        if path.is_file() and is_forbidden_persistence_file(path.name)
    )
    if forbidden_source_files:
        raise ValidationError(
            "config/ contains game-managed persistence files:\n  "
            + "\n  ".join(forbidden_source_files)
        )

    forbidden_paths = sorted(
        path.relative_to(CONFIG_ROOT).as_posix()
        for path in CONFIG_ROOT.rglob("*")
        if any(part.lower() in FORBIDDEN_V3_PATH_PARTS for part in path.relative_to(CONFIG_ROOT).parts)
    )
    if forbidden_paths:
        raise ValidationError(
            "v3 contains forbidden compatibility paths:\n  "
            + "\n  ".join(forbidden_paths)
        )

    cfg_paths = sorted(CONFIG_ROOT.rglob("*.cfg"))
    if not cfg_paths:
        raise ValidationError("No CFG files found under config/")

    names = {path.relative_to(CONFIG_ROOT).as_posix(): path for path in cfg_paths}
    graph: dict[str, list[str]] = {}
    missing: list[str] = []

    for name, path in names.items():
        text = read_cfg(path)
        validate_cfg_syntax(name, text)
        for target in exec_targets(text):
            if target not in names:
                missing.append(f"{name} -> {target}")
        graph[name] = [target for target in exec_targets(text, direct_only=True) if target in names]

    if missing:
        raise ValidationError("Missing exec targets:\n  " + "\n  ".join(missing))

    cfg_text = {name: read_cfg(path) for name, path in names.items()}

    for name, text in cfg_text.items():
        is_settings_or_keymap = name.endswith(("/settings.cfg", "/keymap.cfg"))
        is_crosshair_library = name.startswith(
            "srp-cfg/features/crosshair-view/library/"
        )
        if is_settings_or_keymap or is_crosshair_library:
            validate_editable_line_comments(name, text)

    autoexec_chain = direct_exec_targets(cfg_text["autoexec.cfg"])
    if autoexec_chain != EXPECTED_AUTOEXEC_CHAIN:
        raise ValidationError(
            f"autoexec startup order must be {EXPECTED_AUTOEXEC_CHAIN!r}; "
            f"found {autoexec_chain!r}"
        )

    user_config_name = "srp-cfg/user/custom.cfg"
    if user_config_name not in names:
        raise ValidationError("Missing user-owned final override: srp-cfg/user/custom.cfg")

    runtime_init_name = "srp-cfg/runtime/init.cfg"
    runtime_chain = direct_exec_targets(cfg_text[runtime_init_name])
    if runtime_chain != EXPECTED_RUNTIME_CHAIN:
        raise ValidationError(
            f"Runtime init order must be {EXPECTED_RUNTIME_CHAIN!r}; found {runtime_chain!r}"
        )

    runtime_files = assert_runtime_registration_only(
        cfg_text, runtime_init_name, "Source Runtime"
    )
    aliases = runtime_aliases(cfg_text, runtime_files)
    missing_aliases = sorted(REQUIRED_RUNTIME_ALIASES.difference(aliases))
    if missing_aliases:
        raise ValidationError(
            "Runtime is missing required persistent aliases: " + ", ".join(missing_aliases)
        )

    validate_preset_layout(names)
    validate_module_layout(names, cfg_text)
    validate_valve_reset_coverage(cfg_text)

    assert_runtime_registration_only(cfg_text, "autoexec.cfg", "Source Runtime Core")

    assert_no_cycles(graph, "autoexec.cfg", "Source autoexec")

    config = yaml.safe_load(PACKAGES_FILE.read_text(encoding="utf-8"))
    packages = config.get("packages", {})
    if set(packages) != {"runtime_core"}:
        raise ValidationError(
            f"v3 release packages must contain only runtime_core; found {sorted(packages)!r}"
        )
    if packages["runtime_core"].get("zip_name") != "SrP-CFG_Runtime_Core":
        raise ValidationError(
            "runtime_core ZIP name must remain SrP-CFG_Runtime_Core"
        )
    for package_name, package in packages.items():
        for raw in package.get("files", []):
            source = ROOT / raw
            if not source.exists():
                raise ValidationError(f"Package {package_name} source does not exist: {raw}")
            source_files = [source] if source.is_file() else (
                path for path in source.rglob("*") if path.is_file()
            )
            for source_file in source_files:
                if is_forbidden_persistence_file(source_file.name):
                    raise ValidationError(
                        f"Package {package_name} includes forbidden persistence file: "
                        f"{source_file.relative_to(ROOT).as_posix()}"
                    )
        if package.get("base") or package.get("overrides"):
            raise ValidationError(
                f"Package {package_name} still uses removed v2 base/override behavior"
            )

    print(f"[OK] Source CFG architecture: {len(cfg_paths)} CFG files")


def validate_zip(zip_path: Path, package_name: str) -> None:
    with ZipFile(zip_path) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise ValidationError(f"{zip_path.name} contains duplicate archive entries")

        for raw_name in names:
            normalized = raw_name.replace("\\", "/")
            path = PurePosixPath(normalized)
            if raw_name != normalized or path.is_absolute() or ".." in path.parts:
                raise ValidationError(f"{zip_path.name} contains unsafe path: {raw_name}")
            if is_forbidden_persistence_file(normalized):
                raise ValidationError(
                    f"{zip_path.name} contains forbidden persistence file: {raw_name}"
                )
            if any(part.lower() in FORBIDDEN_V3_PATH_PARTS for part in path.parts):
                raise ValidationError(
                    f"{zip_path.name} contains forbidden compatibility path: {raw_name}"
                )

        archive_roots = {
            PurePosixPath(name).parts[0]
            for name in names
            if PurePosixPath(name).parts
        }
        unexpected_roots = sorted(archive_roots.difference(V3_ROOT_ENTRIES))
        missing_roots = sorted(V3_ROOT_ENTRIES.difference(archive_roots))
        if unexpected_roots or missing_roots:
            details = []
            if unexpected_roots:
                details.append(f"unexpected: {', '.join(unexpected_roots)}")
            if missing_roots:
                details.append(f"missing: {', '.join(missing_roots)}")
            raise ValidationError(
                f"{zip_path.name} violates the v3 archive root layout ({'; '.join(details)})"
            )

        required = {
            "autoexec.cfg",
            "srp-cfg/user/custom.cfg",
        }
        absent = sorted(required.difference(names))
        if absent:
            raise ValidationError(f"{zip_path.name} is missing: {', '.join(absent)}")

        cfg_text: dict[str, str] = {}
        for name in names:
            if name.lower().endswith(".cfg"):
                cfg_text[name] = archive.read(name).decode("utf-8-sig")
                validate_cfg_syntax(name, cfg_text[name])

        missing: list[str] = []
        graph: dict[str, list[str]] = {}
        for name, content in cfg_text.items():
            for target in exec_targets(content):
                if target not in cfg_text:
                    missing.append(f"{name} -> {target}")
            graph[name] = [target for target in exec_targets(content, direct_only=True) if target in cfg_text]
        if missing:
            raise ValidationError(
                f"{zip_path.name} has missing exec targets:\n  " + "\n  ".join(missing)
            )

        autoexec_chain = direct_exec_targets(cfg_text["autoexec.cfg"])
        if autoexec_chain != EXPECTED_AUTOEXEC_CHAIN:
            raise ValidationError(
                f"{zip_path.name} has invalid startup order: {autoexec_chain!r}"
            )

        runtime_init_name = "srp-cfg/runtime/init.cfg"
        runtime_chain = direct_exec_targets(cfg_text[runtime_init_name])
        if runtime_chain != EXPECTED_RUNTIME_CHAIN:
            raise ValidationError(
                f"{zip_path.name} has invalid Runtime init order: {runtime_chain!r}"
            )
        runtime_files = assert_runtime_registration_only(
            cfg_text, runtime_init_name, f"{zip_path.name} Runtime"
        )
        aliases = runtime_aliases(cfg_text, runtime_files)
        missing_aliases = sorted(REQUIRED_RUNTIME_ALIASES.difference(aliases))
        if missing_aliases:
            raise ValidationError(
                f"{zip_path.name} is missing Runtime aliases: {', '.join(missing_aliases)}"
            )

        if package_name != "runtime_core":
            raise ValidationError(f"Unexpected v3 package key: {package_name}")
        assert_runtime_registration_only(cfg_text, "autoexec.cfg", zip_path.name)

        assert_no_cycles(graph, "autoexec.cfg", zip_path.name)
        print(f"[OK] {zip_path.name}: {len(names)} entries")


def validate_packages() -> None:
    config = yaml.safe_load(PACKAGES_FILE.read_text(encoding="utf-8"))
    for package_name, package in config.get("packages", {}).items():
        zip_path = ROOT / f"{package.get('zip_name', package_name)}.zip"
        if not zip_path.is_file():
            raise ValidationError(f"Built package not found: {zip_path.name}")
        validate_zip(zip_path, package_name)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--packages", action="store_true", help="also validate built ZIP files")
    args = parser.parse_args()

    try:
        validate_source()
        if args.packages:
            validate_packages()
    except (OSError, ValueError, ValidationError) as error:
        raise SystemExit(f"[ERROR] {error}") from error


if __name__ == "__main__":
    main()
