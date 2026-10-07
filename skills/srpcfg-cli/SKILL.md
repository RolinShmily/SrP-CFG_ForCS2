---
name: srpcfg-cli
license: MIT
description: Manage Counter-Strike 2 configuration with the SrP-CFG srpcfg CLI. Use this skill whenever the user asks to diagnose Steam/CS2 paths or accounts, inspect or assemble SrP presets/features, bind mode launchers, update configuration packages, edit/apply cs2_video.txt, deploy/remove map guides, or automate SrP-CFG operations. Keep staging edits separate from game deployment and check binding conflicts before accepting them.
compatibility: Requires srpcfg (Windows srpcfg.exe) and its bundled config directory. Windows is required for Steam detection, online updates, game launch, and Explorer integration; Python 3 is optional for the inspection helper.
---

# SrP-CFG CLI

Use `srpcfg` to carry out the user's requested CS2 configuration operation through the shared core. Consult [references/commands.md](references/commands.md) for supported commands, targets, side effects and exit codes. Treat the installed executable's `--help` as the current syntax authority; this reference describes the matching repository version.

## Locate and inspect

1. Find `srpcfg` on PATH or the user's extracted/installed software directory. On Windows the name is `srpcfg.exe`; PowerShell needs `& "<absolute-path>/srpcfg.exe"` or `./srpcfg.exe` if it is not on PATH. Quote paths and pass arguments separately.
2. Run `version` and `--help`. If desired, run `python <skill-dir>/scripts/inspect_cli.py --exe <executable>` for a JSON report of those two read-only calls. Do not execute a similarly named program from an untrusted directory.
3. Keep the packaged `config/` with the executable. If the CLI is absent, report the missing dependency and link https://cfg.srprolin.top or https://github.com/RolinShmily/SrP-CFG_ForCS2/releases. Do not substitute obsolete `srp`/`srp_cli` binaries, download/run software without authorization, or invent installation commands.
4. Match output language with `--zh` or `--en`. Output is human-readable, except the inspection helper; the CLI has no `--json`, `--dry-run` or persistent account selection option.

## Choose the target before changing files

Run `detect` and `users` when the task depends on automatic Steam detection. `switch-user <accountId>` only inspects that account in the current invocation; it does not switch Steam or persist the target for later commands. Do not run it and then assume later writes target that user.

Use explicit paths when given or when working in a fixture:

- `--cfg-dir`: game `game/csgo/cfg`, for presets and Valve/feature/mode assembly.
- `--user-cfg-dir`: account `Steam/userdata/<accountId>/730/local/cfg`, for `video-apply` only.
- `--annotations-dir`: game `game/csgo/annotations/local`, for listing/deploying/removing guides.
- `--store`: application staging root, not a game directory. Even staging inspection can initialize offline packages there.

Automatic-target commands such as VCFG cleanup and `reset-valve` do not support explicit account or CFG overrides. Stop if automatic detection does not identify the intended account; do not use ignored flags to pretend a target was selected.

## Execute only the requested scope

- Discover IDs with `presets`, `modules`, `annotations`. Content is catalog-driven; do not hardcode a fixed number of maps or modules. Preset output includes its stable ID. The game alias displayed by these commands is not a shell subcommand.
- `packages-check` inspects online metadata. `package-update <id>` updates staging only. It neither installs SrP into the game nor assembles newly added modules.
- Preset and assembly writes require an installed SrP runtime and matching deployed module files. This CLI has no `install`, `reinstall` or `uninstall` subcommand. If installation/redeployment is required, explain the failure and direct the user to the GUI Overview install/reassemble action. Do not copy folders or rewrite autoexec as a fallback.
- Default feature assembly loads settings only. Add `--keymap` only when the user wants module keys too. Valve operations require `--settings`, `--keymap` or both and can cancel the active preset; state that effect before execution.
- Modes create launch-key bindings; they do not run during startup. First run `mode-bind <id> --key <key>` without `--confirm`. Exit 2 reports a conflict and performs no write. Show the previous and proposed commands. Only repeat with `--confirm` if the user already explicitly authorized that overwrite or approves this concrete conflict. Do not automatically confirm as a retry. Removing a launcher does not restore an overwritten binding.
- `video-set` edits the staging file. For “save only”, stop after `video-status` verification. Run `video-apply` separately only if game deployment is requested. It merges supported fields, preserves hardware/monitor/unknown fields, requires an existing game-generated video file, and refuses writes while CS2 runs. Do not terminate the game or replace the whole file to bypass a refusal.
- Guide deployment/removal affects the selected guide ID, preserving personal `mapguide`. Listing `annotations` does not select a guide. Removing a guide does not uninstall the whole configuration package.
- `package-reset` replaces the selected saved working copy with the current downloaded original; explicitly disclose this loss of customization when the user's request is ambiguous.
- VCFG cleanup and `reset-valve` affect personal settings/keys. Confirm the requested scope and account if not already explicit. `reset-valve` both assembles Valve settings/keys and clears current-account VCFG convars/keybinds; it is not a staging reset.

## Verify and report

Check each exit code before the next dependent command. Exit 0 means success or no change, 1 means failure, and 2 is the mode-conflict decision above. Never reinterpret failure as success based on a partial output line.

After a change, rerun the corresponding `video-status`, `annotations`, `modules`, `presets`, or `valve-status` with the same paths/store. Use read-only inspection of the intended file if stronger evidence is needed. Core-generated backups are retained; do not delete them. Inspection success does not prove the game has loaded the result. Game commands retain their `srp_*` names (for example `srp_reload`); do not rename them to `srpcfg_*`.

Report briefly in the user's language:

- executable version and target path/account;
- exact operation and whether it changed staging or game files;
- exit code and verified resulting state;
- any conflict, missing runtime, running-game refusal, network failure or required next action.

Do not claim installation, deployment, restoration of old bindings, in-game activation or successful downloads without evidence.
