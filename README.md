<h1 align="center">SrP-CFG</h1>
<h4 align="center">Modular Counter-Strike 2 Configuration Workspace · Modern Qt Desktop Suite · Pure Open-Source Engine</h4>

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/RolinShmily/SrP-CFG_ForCS2?color=orange)](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/RolinShmily/SrP-CFG_ForCS2/ci.yml?branch=main&label=CI)](https://github.com/RolinShmily/SrP-CFG_ForCS2/actions)
[![Deploy Worker](https://img.shields.io/github/actions/workflow/status/RolinShmily/SrP-CFG_ForCS2/deploy-worker.yml?branch=main&label=Cloudflare)](https://cfg.srprolin.top)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20x64-brightgreen.svg)](#)

[English](README.md) | [简体中文](README.zh-CN.md)

</div>

---

## 💡 Core Philosophy

> **"Unpack the features, keep the choices; runtime belongs to the engine, preferences belong to the player."**

In Counter-Strike 2, Valve introduced the VCFG mechanism to manage players' keybindings and engine convars. Traditional monolithic "all-in-one" CFG packs frequently overwrite personal habits or cause irreversible conflicts with Steam Cloud synchronization.

**SrP-CFG** decouples functional logic from personal preferences through an explicit layered execution model and independent modular packages:

```text
CS2 Engine Boot
  ↓ Loads Steam Cloud VCFG (native persistent game state)
  ↓ Executes autoexec.cfg (non-invasive transparent mount)
  ↓ Layer 1: Valve Baseline / Presets (optional starting baseline, cleanly unloadable)
  ↓ Layer 2: Feature Modules (AutoView, crosshair view, Knife, Zeus, etc.)
  ↓ Layer 3: Mode Launchers (Practice, Preview, Demo bound to keys; not executed on game boot)
  ↓ Layer 4: user/custom.cfg (highest-priority user override layer, strictly isolated & preserved)
```

---

## 📦 Three Decoupled Packages

All configuration components are completely decoupled, versioned independently, and distributed separately:

| Package Identifier | Target Installation Path | Description |
| :--- | :--- | :--- |
| **`srp-cfg`** | `game/csgo/cfg/` | **Runtime Core Base**. Includes command engine, feature modules, mode sessions, community presets, and `custom.cfg` user layer. |
| **`video`** | `Steam/userdata/<ID>/730/local/cfg/` | **Competitive Video Template**. Structured parser for `cs2_video.txt` that preserves local GPU/monitor hardware IDs and unknown fields. |
| **`annotations`** | `game/csgo/annotations/local/` | **Native Map Guides**. Standard CS2 KV3 format; multiple guides coexist without clobbering personal `mapguide` files. |

---

## 🖥️ Modern Architecture

The repository enforces clean separation of concerns:

```text
SrP-CFG_ForCS2/
├── app/
│   ├── core/                  # C++17 pure logic library (VCFG/CFG/KV3 parsing, atomic backups, staging store)
│   ├── cli/                   # srpcfg CLI tool (automation, CI & script friendly)
│   └── gui/                   # SrP-CFG desktop app (Qt 6 + HuskarUI + QML + QWindowKit)
├── config/                    # Shipped offline bundled configuration packages
│   ├── srp-cfg/               # Runtime scripts, catalog.json, presets & modules
│   ├── video/                 # cs2_video.txt template & versioning
│   └── annotations/           # Native map guide resources
├── website/                   # Official showcase & documentation (Next.js 16 + React 19 + Tailwind CSS)
├── installer/                 # Windows official installer script (Inno Setup)
├── scripts/                   # Repository sanity checks, drift detection & local utilities
├── docs/                      # Architecture specifications, workspace designs & boundary contracts
└── CMakeLists.txt             # Root unified build file
```

### Safety & Resilience Highlights

1. **Zero Injection · Purely Native**: Operates strictly through CS2 native `+exec`, standard `.cfg`, and KV3 files. **Zero DLL injection, zero memory modification, zero hooks**.
2. **Multi-Generation Atomic Backups**: Before writing to game files or updating working copies, the backup writer creates `.bak` files and retains up to 20 deduplicated historical snapshots. Failed writes roll back automatically.
3. **Staging Transaction Model**: Package downloads and updates land in a writable staging area (`Original` / `Work`). Customized working copies are preserved when upstream updates arrive.
4. **Running Game Guard**: Detects running CS2 processes and pauses video configuration writes to prevent being overwritten on game exit.
5. **Bilingual UI & Flexible Theming**: Clean light theme default with optional dark mode and live Simplified Chinese / English language switching.

---

## 🚀 Quick Start

### Option 1: Desktop Workspace (Recommended)

1. Download the installer (`setup.exe`) or portable archive (`gui.zip`) from [GitHub Releases](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases) or the [Official Website](https://cfg.srprolin.top/).
2. Launch **SrP-CFG**; the application automatically detects Steam, CS2, and active accounts.
3. Initialize in **Overview**, configure modules in **Presets** or **Free Assembly**, and fine-tune `custom.cfg` in the integrated code editor.

### Option 2: Command Line Interface (CLI)

```bash
# View help and available subcommands
srpcfg --help

# List module statuses
srpcfg modules

# Assemble a feature module (e.g. autoview)
srpcfg feature-assemble autoview --keymap

# Bind a launch key; inspect any conflict before approving --confirm
srpcfg mode-bind practice --key p

# Deploy a map guide (e.g. mirage)
srpcfg annotation-deploy mirage
```

---

## 🎮 Essential Game Console Commands

| Console Command | Description | Overwrites Keybinds |
| :--- | :--- | :---: |
| `srp_help` | Open the in-game command index and menu | No |
| `srp_practice` | Enter offline practice mode (infinite ammo, grenade trajectories, bot controls) | No |
| `srp_preview` | Activate inspect and skin preview environment | No |
| `srp_demo` | Start DEMO / HLAE playback enhancement mode | No |
| `srp_apply_default` | Apply official competitive preset | Yes |
| `srp_apply_echo` / `srp_apply_visionl` / `srp_apply_yszh` | Apply popular community presets | Yes |
| `srp_reload` | Re-execute the `Runtime → User` boot chain immediately | Depends on custom.cfg |

---

## 🛠️ Local Build & Development

### Requirements
- **C++ Compiler**: C++17 compatible compiler (MSVC 2022 on Windows, or GCC / Clang)
- **CMake**: >= 3.21
- **Qt 6**: >= 6.5 (desktop GUI needs Core, Gui, Quick, QuickControls2, Concurrent and ShaderTools, including private development headers)
- **Node.js & pnpm**: Node >= 22, pnpm 11+ (required for official website)

### Building Core and CLI (No Qt Required)
```bash
cmake --preset core
cmake --build --preset core
ctest --preset core
```

### Building Full Desktop Application (Visual Studio 2022)
```bash
git submodule update --init --recursive
cmake --preset windows-msvc
cmake --build --preset release-msvc
# Launch the desktop client
run_gui.bat
```

### Running Website Local Preview
```bash
cd website
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm lint
pnpm build
pnpm preview
```

---

## Agent Skill

The repository and software bundles include [srpcfg-cli](skills/srpcfg-cli/SKILL.md). The [website download section](https://cfg.srprolin.top/#download) also provides an independently versioned skill ZIP. Extract it and add `srpcfg-cli` to your agent's skill directory to manage CS2 configuration through the verified CLI workflow. The skill ZIP does not include the CLI executable. The executable is `srpcfg.exe` on Windows; keep it with the bundled `config/` directory. In PowerShell, use `./srpcfg.exe` unless it is on PATH. Game console aliases retain their `srp_*` names.

## 🤝 Contributing

Issues and Pull Requests are welcome! Before submitting:
- Follow the architectural boundaries: core logic belongs in `app/core`, GUI in `app/gui`.
- All configuration file writes must use the backup transaction system.
- For third-party licensing obligations, see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## 📄 License

SrP-CFG is open source software released under the **[MIT License](LICENSE)**.  
Copyright (c) 2025-2026 **RoL1n_SrP**.

Third-party components follow their respective open-source licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for full details.

*Counter-Strike, Counter-Strike 2, CS2, Steam, and Valve are registered trademarks of Valve Corporation. This project is an independent open-source tool and is not affiliated with or endorsed by Valve Corporation.*
