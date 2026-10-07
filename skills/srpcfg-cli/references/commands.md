# Command reference

Run `srpcfg --help` before use. Examples below use a command on PATH; PowerShell can use `& "C:/path/srpcfg.exe"` instead. A command takes one action per invocation. Keep positional IDs immediately after their subcommand. Use only flags documented for that action; unsupported flags may be ignored by this CLI version.

## Common options and paths

| Option | Scope |
| --- | --- |
| `--zh` | Chinese output, default |
| `--en`, `--english` | English output |
| `-h`, `--help` | Help, exits without executing another action |
| `--cfg-dir <path>` | Preset and Valve/feature/mode operations and status; target game CFG directory |
| `--store <path>` | Application package staging root; also supplies source metadata/defaults to assembly |
| `--user-cfg-dir <path>` | `video-apply` target account CFG directory only |
| `--annotations-dir <path>` | Guide listing/deployment/removal target annotations/local directory |

`--cfg-dir` is not a staging location. `--store` is not a game target. No `--account`, `--json`, `--dry-run`, `install`, `reinstall`, `uninstall`, `preset-save` or `preset-reset` command exists. Do not infer CLI flags from GUI screenshot/preview flags.

## Diagnostics and external actions

| Command | Effect |
| --- | --- |
| `version` | Print software version only |
| `detect` | Default command; diagnose Steam, CS2, users and current-user VCFG counts |
| `users` | List detected Steam account IDs and names |
| `switch-user <accountId>` | Inspect that account's CFG path/counts for this invocation, not persistent selection |
| `convars-status` | Inspect automatically detected current-account convars/keybind counts |
| `launch` | Launch CS2 using Steam protocol; only do so if requested |
| `open-cfg` | Open automatically detected global CFG folder in Explorer; may create a missing folder |
| `open-user-cfg` | Open automatically detected current-account CFG folder in Explorer; may create a missing folder |
| `app-update-check` | Manual software Release check; prints website/Releases links, never downloads/installs |

`convars-clean-srp` is a legacy token accepted by the argument parser but has no implementation. Do not use it.

## Personal VCFG and baseline operations

| Command | Effect |
| --- | --- |
| `convars-clean-all` | Remove current-account VCFG convars with backups |
| `keybinds-clean-all` | Remove current-account VCFG keybinds with backups |
| `reset-valve` | Assemble both Valve settings/keys, cancel preset entry, then clear automatically detected account's VCFG convars/keybinds |

These use automatic detection. Neither `switch-user` nor `--user-cfg-dir` retargets them. `reset-valve` preserves the personal layer but changes assembly entries and VCFG; it does not erase all CFG files.

## Presets, Valve, features and mode launchers

SrP must already be installed in the game. Staging updates containing new runtime commands/files require GUI Overview reassembly before those entries can be used.

| Command | Effect |
| --- | --- |
| `presets` | List catalog presets, stable IDs, active marker and differences |
| `preset-load <id>` | Enable the preset entry in installed custom.cfg |
| `preset-unload` | Remove preset entries, preserve personal commands |
| `valve-status` | Report assembled settings, keys and active preset |
| `valve-assemble --settings` | Add Valve settings; cancels active preset |
| `valve-assemble --keymap` | Add Valve keys; cancels active preset |
| `valve-assemble --settings --keymap` | Add both; cancels active preset |
| `valve-unload --settings` / `--keymap` / both | Remove only selected Valve scope |
| `modules` | Discover catalog feature/mode IDs and assembly/launcher states |
| `feature-assemble <id>` | Assemble settings only |
| `feature-assemble <id> --keymap` | Assemble settings and optional default keys |
| `feature-unload <id>` | Remove all direct entries for that feature |
| `mode-bind <id> --key <key>` | Bind a launcher for mode settings |
| `mode-bind <id> --key <key> --keymap` | Apply mode keys when that launcher is triggered |
| `mode-bind ... --confirm` | Explicitly accept a reported binding/legacy entry conflict |
| `mode-unbind <id>` | Remove mode launchers and legacy direct entries; does not restore overwritten keys |

Statuses describe configuration text, not a complete runtime simulation. Mode launchers are deferred. Do not execute their settings during startup as a substitute. Feature unload and mode removal preserve unrelated compound commands according to core parsing.

Examples:

```text
srpcfg modules --cfg-dir "D:/CS2/game/csgo/cfg" --en
srpcfg feature-assemble autoview --cfg-dir "D:/CS2/game/csgo/cfg"
srpcfg mode-bind practice --key f6 --cfg-dir "D:/CS2/game/csgo/cfg"
```

If the last command exits 2, inspect its previous/new command preview before deciding whether to repeat with `--confirm`. Do not add confirmation preemptively. User-provided IDs may refer to additional catalog entries; lists are not limited to the examples above.

## Independent staging packages

Package protocol IDs are `srp-cfg`, `video`, `annotations`; content within them is extensible.

| Command | Effect |
| --- | --- |
| `packages` | Initialize offline staging if needed; print versions and working-copy root |
| `packages-check` | Fetch https://cfg.srprolin.top/packages.json; no update or deployment |
| `package-update <id>` | Download verified package into a new staging generation; edited copies retain their baseline |
| `package-reset <id> --file <relative>` | Back up and restore one working file from current package original |

A reset path is package-relative, safe, and declared editable by the package catalog. Example: `video --file cs2_video.txt`, `srp-cfg --file valve/settings.cfg`, or a guide's declared `directory/file.txt`. Inspect metadata instead of assuming arbitrary files are editable. `user/custom.cfg` belongs to the srp-cfg staging package when used here; this operation does not restore the installed game copy.

Invalid manifests, archive hashes, paths or catalogs are rejected; update failures keep the previous generation. Don't bypass checks by downloading and extracting directly into work or game folders. Network operations require Windows; offline Core/CLI tests can run elsewhere.

## Video

| Command | Effect |
| --- | --- |
| `video-status` | Inspect staged values; may initialize staging |
| `video-set --field <key> --value <value>` | Validate and save a supported staging option |
| `video-apply` | Merge staging options into detected current-account cs2_video.txt |
| `video-apply --user-cfg-dir <path>` | Merge into an explicit account CFG directory |

`video-apply` requires an existing game-generated file and refuses while CS2 runs. Preserves target GPU/monitor/refresh/unknown fields and backs up the previous bytes. Hardware fields are not editable form options.

```text
srpcfg video-status --store "C:/temp/srpcfg-store"
srpcfg video-set --field setting.msaa_samples --value 2 --store "C:/temp/srpcfg-store"
srpcfg video-status --store "C:/temp/srpcfg-store"
```

This example stops after a staging save. Only apply when game deployment is requested. Resolution uses `--field resolution --value 1920x1080`; field/value validity comes from core, not arbitrary key-value replacement.

## Map guides

| Command | Effect |
| --- | --- |
| `annotations` | Discover guide IDs and installed states |
| `annotation-deploy <id>` | Validate and deploy that staged guide |
| `annotation-remove <id>` | Back up and remove that guide file only |

Use `--annotations-dir` for explicit targets. Guides deploy to `annotations/local/<directory>/<directory>.txt`. Personal `mapguide/mapguide.txt` and other guides remain untouched. The game load command is `annotation_load <directory>`; stable catalog ID need not equal directory name. No automatic game loading is performed.

## Results and backups

- `0`: success or no change; verify the corresponding status using the same target/store.
- `1`: failure; report stderr/error and do not run a dependent action.
- `2`: mode binding needs confirmation; no write before approval.

Operations use core backups and atomic writes where supported. Recent `.bak` files and up to 20 distinct-content history snapshots under `.backups/<filename>/` are retained. The CLI has no general rollback command; never claim it can recover an overwritten binding automatically.
