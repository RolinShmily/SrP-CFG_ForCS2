# Contributing to SrP-CFG

Thanks for helping improve SrP-CFG. This guide covers where contributions go, the project's core rules, and how to open a pull request. For toolchain setup, build commands, and the full verification checklist, see [`docs/development.md`](docs/development.md).

## Where to Contribute

| Area | Path |
| :--- | :--- |
| Bug reports & feature requests | [Open an issue](https://github.com/RolinShmily/SrP-CFG_ForCS2/issues/new/choose) |
| CS2 presets, features, modes, runtime | `content/srp-cfg/**` |
| CS:GO standalone package | `content/srp-cfg-csgo/**` |
| Video template & KV3 map guides | `content/video/**`, `content/annotations/**` |
| C++17 core engine | `src/core/**` |
| Windows desktop app (Qt 6 / QML) | `src/gui/**` |
| Website & `/console` reference | `website/**` |
| Cloudflare Worker release proxy | `worker/**` |
| Tests & automation scripts | `tests/**`, `scripts/**` |
| Docs & bilingual README | `docs/**`, `README.md`, `README.zh-CN.md` |

Adding a preset, feature, mode, or map guide usually requires **no C++ or QML changes**—each package's `catalog.json` drives the desktop UI and packaging pipeline. See [`docs/reference.md`](docs/reference.md).

## Ground Rules

### Content Packages (`content/`)

- **Keep the 4-layer CFG boundary**: Layer 1 baseline/presets, Layer 2 independent features, Layer 3 key-bound session modes, Layer 4 `user/custom.cfg` (user-exclusive; runtime must never modify it). See [`docs/architecture.md`](docs/architecture.md).
- **Keep `.cfg` files portable and parse-safe**: use paths relative to `game/csgo/cfg/` (or `csgo/cfg/` for `srp-cfg-csgo`) in `exec`, put one command per line, and use `//` for comments (never `/* */`).
- **Register entries in `catalog.json`**: update the package `catalog.json` (`schema_version: 1`) and `runtime/commands.cfg` (when adding an entry command). Do not add `VERSION.txt` files—packages are tracked by SHA-256 and `updated_at`.
- **Keep module layouts consistent**: presets use `settings.cfg`, `keymap.cfg`, and `apply.cfg`; features and modes use `settings.cfg` and `runtime.cfg` (plus optional `keymap.cfg` and `with-keymap.cfg`).

### Code & Repository

- **Respect layer boundaries**: `src/core` must stay pure C++17 with zero Qt dependencies and build standalone (`cmake -S src/core`). `src/gui` is presentation only and must not perform raw config parsing or filesystem writes.
- **Use atomic backup writes**: every write or removal targeting user/game directories must go through `writeConfigWithBackup` / `removeConfigWithBackup`.
- **Keep the network contract strict**: client updates and downloads must only target `https://cfg.srprolin.com` over HTTPS with redirects disabled, size limits, and SHA-256 verification.
- **Keep generated files out of PRs**: do not commit build outputs, packaged ZIPs, or hand-edited `website/public/third-party-licenses.txt` (generated via `pnpm --filter srp-cfg-website licenses:collect`). Update [`THIRD_PARTY_NOTICES`](THIRD_PARTY_NOTICES) whenever adding a runtime dependency.
- **Add tests for behavior changes**: place tests under `tests/` (`tests/core`, `tests/content`, `tests/worker`, `tests/website`, `tests/console`).

## Verification Before Pushing

Run the checks relevant to your changes—detailed commands and setup steps are in [`docs/development.md`](docs/development.md):

- **Repo, content, and worker**: `scripts/check_repository.py`, `tests/content/test_content_packages.py`, and `tests/worker/*.test.mjs`.
- **C++ core**: `cmake --preset core && cmake --build --preset core && ctest --preset core` (plus standalone `src/core` build).
- **Website & `/console`**: `test`, `console:test`, `lint`, and `build` scripts in `website/package.json`.
- **Desktop GUI (`src/gui`)**: build on Windows with Qt 6.8+ and smoke-test with `scripts/run-gui.bat` (check `srp_gui_debug.log` for QML errors).
- **Workflows (`.github/workflows/`)**: validate with `actionlint`.

## Commits & Pull Requests

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <subject>
```

- **Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `ci`, `chore`, `perf`
- **Scopes**: `core`, `gui`, `content`, `website`, `console`, `worker`, `tests`, `ci`, `docs`, `repo`

Keep subjects imperative and concise (~72 chars); explain *why* in the body when helpful.

1. Fork the repo and branch off `main` (e.g. `feat/inferno-guide`, `fix/video-merge`).
2. Keep each PR focused on a single logical change; open an issue first to discuss larger architectural or catalog schema changes.
3. Describe the change, list the checks you ran, and link related issues.
