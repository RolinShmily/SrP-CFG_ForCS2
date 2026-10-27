<div align="center">

[English](CONTRIBUTING.md) | [简体中文](CONTRIBUTING.zh-CN.md)

</div>

# Contributing to SrP-CFG

Thanks for taking the time to improve SrP-CFG. This guide covers the practical parts:
how to set up the repo, what to run before opening a pull request, and the conventions
the project already follows.

By participating you agree to our [Code of Conduct](CODE_OF_CONDUCT.md). For security
issues, follow the [security policy](SECURITY.md) instead of opening a public issue.

---

## Ways to Contribute

| Type | Where |
| :--- | :--- |
| Bug report / feature request | [Open an issue](https://github.com/RolinShmily/SrP-CFG_ForCS2/issues/new) |
| Keybind / convar tuning, presets | `config/srp-cfg/**` |
| Feature or mode module | `config/srp-cfg/features/**`, `config/srp-cfg/modes/**` |
| Video template | `config/video/**` |
| Map guide (KV3 annotations) | `config/annotations/**` |
| Core logic, parsers, transactions | `app/core/**` |
| `srpcfg` CLI | `app/cli/**` |
| Desktop app (Qt 6 / QML) | `app/gui/**` |
| Website and docs | `website/**`, `docs/**` |
| Audit and packaging scripts | `scripts/**` |
| Translation | Any `*.md` file with a `.zh-CN.md` (or English) counterpart |

Adding a preset, feature, mode, or map guide usually needs **no C++ or QML change** —
each package carries a `catalog.json` that drives the CLI lists, GUI cards, and editor
file options. See [`docs/CONFIG_CATALOG.md`](docs/CONFIG_CATALOG.md).

## Environment Setup

**Prerequisites**

- CMake 3.21+ and a C++17 compiler (MSVC 2022 on Windows, GCC/Clang elsewhere).
- Qt 6.8 with `qtshadertools` — only for `app/gui`. Automated builds use
  `win64_msvc2022_64` on Windows.
- Node.js 22+ and pnpm 11.3 — only for `website/` and the release scripts.
- Python 3.12 — only for the audit/packaging scripts, which use the standard library.

```bash
git clone --recurse-submodules https://github.com/RolinShmily/SrP-CFG_ForCS2.git
cd SrP-CFG_ForCS2

# Core + CLI only (no Qt toolchain needed)
cmake --preset core
cmake --build --preset core
ctest --preset core

# Website: type-check, unit tests, static build
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm lint
pnpm build
```

The Qt application is built through the configured presets. If Qt is not auto-detected
under `C:/Qt/6.*/msvc2022_64`, pass `-DCMAKE_PREFIX_PATH=<Qt kit>`:

```bash
cmake --preset release-msvc
cmake --build --preset release-msvc
```

`app/gui/3rdparty/HuskarUI` is a submodule — clone with `--recurse-submodules`, or run
`git submodule update --init --recursive` before configuring the GUI.

Release packaging (`installer/`, portable ZIPs) is out of scope for most
contributions — see [`README.md`](README.md) and [`website/README.md`](website/README.md).

## Ground Rules for `config/`

This is where most contributions land, and where correctness matters most.

- **Never `exec` an absolute or user-specific path.** All includes are relative to
  `game/csgo/cfg/` so the packages stay relocatable.
- **Keep the four-layer boundary.** Layer 1 is the Valve baseline / preset templates,
  Layer 2 the independently loaded features, Layer 3 the mode entrypoints bound to keys,
  and Layer 4 `user/custom.cfg`, which is user-exclusive: runtime code must never write
  to it.
- **Every feature/mode directory stays self-consistent**: `settings.cfg` (values),
  `keymap.cfg` (bindings), `runtime.cfg` (logic), `with-keymap.cfg` (opt-in keymap
  entrypoint). Presets use `settings.cfg`, `keymap.cfg`, and `apply.cfg`.
- **Register new entries in `catalog.json`** — stable `id`, localized
  `description_zh` / `description_en`, tags, and the exact `files` list. The catalog is
  the single source for GUI cards, CLI listing, and packaging.
- **Comments use `//`**, either on their own line or trailing a command — never `/* */`.
  The house style is **English first, Chinese inline after the `//`** on definition
  lines, so both audiences can read the file:
  ```cfg
  // Load the autoview feature runtime.
  exec srp-cfg/features/autoview/runtime.cfg // 加载武器自适应视角的 Runtime 命令。
  ```
- **Keep each command on a single line.** CS2 parses line by line, so never indent a
  command and never break it across lines.
- **No generated files in a pull request.** `config/**` is the source of truth; this
  directory is packaged as-is by `scripts/package-website.py` and the release workflow.
  Do not hand-edit `website/public/third-party-licenses.txt`
  (produced by `node scripts/collect-licenses.mjs`).

## Ground Rules for Code

- **Respect the boundaries.** `app/core` is C++17 with no Qt dependency; `app/cli` is a
  thin front-end over it; `app/gui` adds Qt/HuskarUI presentation only. UI code must not
  gain filesystem or parsing logic, and core code must not depend on QML.
- **All configuration writes go through the backup transaction system.** Never write
  into the game directory directly: stage, diff, then commit — and restore the working
  copy on failure.
- **Do not widen the network surface.** Package manifests and archives are fetched from
  `https://cfg.srprolin.com` only, over HTTPS, without redirects, with size and SHA-256
  validation. See [`docs/CONFIG_PACKAGES_AND_MEDIA.md`](docs/CONFIG_PACKAGES_AND_MEDIA.md)
  and [`docs/BOUNDARY_CONDITIONS.md`](docs/BOUNDARY_CONDITIONS.md).
- **Add tests with the change.** Core behaviour belongs in `app/core/tests/`
  (CTest), website logic in `website/tests/*.test.mjs`, package rules in
  `scripts/test_website_packages.py`.

## Verify Before You Push

Run the same checks as CI. Each is dependency-light and completes in seconds:

```bash
# 1. Core + CLI build and isolated fixture tests
cmake --preset core && cmake --build --preset core && ctest --preset core

# 2. Repository integrity: versions, catalogs, declared files, doc presence
python3 scripts/check_repository.py

# 3. Package manifest rules (three packages, HTTPS origin, sizes, hashes)
python3 scripts/test_website_packages.py

# 4. Website: unit tests, type-check, production build
pnpm test
pnpm lint
pnpm build
```

If you touched the website's static output or the package layout, also run the packaging
steps CI runs:

```bash
python3 scripts/package-website.py
node scripts/collect-licenses.mjs
```

If you touched `app/gui`, build the desktop target with Qt 6.8 (see above); CI builds it
on Windows with MSVC 2022 and does not run QML tests.

If you edit anything under `.github/workflows/`, run
[actionlint](https://github.com/rhysd/actionlint) over it. It is a single binary (no
package manager needed) and it also runs `shellcheck` on every `run:` block, which
catches quoting and unquoted-variable mistakes that only surface at release time
otherwise:

```bash
actionlint -color            # checks .github/workflows/** by default
```

## Commit Messages

The history follows [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <subject>
```

Common types: `feat`, `fix`, `refactor`, `docs`, `chore`, `perf`, `release`.
Common scopes: `core`, `cli`, `gui`, `website`, `config`, `ci`, `deps`, `skill`.

```text
feat(config): add nuke spawn preset for practice mode
fix(gui): keep the VCFG editor from overwriting the user layer
docs(website): describe the four-layer architecture model
```

Keep the subject imperative and under ~72 characters. Use the body to explain
*why*, not *what*.

## Branches and Pull Requests

1. Fork the repository and branch off `main`
   (e.g. `feat/nuke-spawn-preset`, `fix/vcfg-overwrite`).
2. Make focused commits — one logical change per commit.
3. Describe the change, the verification you ran, and link the issue it closes.
4. Make sure CI is green, then request review.

Small, self-contained pull requests get reviewed and merged fastest. For
architectural changes to the runtime layers, the core API, or the package layout,
please open an issue to discuss the design before writing code.

Thanks for contributing.
