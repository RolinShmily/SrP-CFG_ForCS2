<h1 align="center">SrP-CFG v3</h1>
<h4 align="center">Modular CS2 CFG Runtime, High-Performance Desktop Suite & Searchable Knowledge Base</h4>
<div align="center">

<img src="https://cdn.jsdelivr.net/gh/RolinShmily/SrP-CFG_ForCS2@refs/heads/main/app/website/public/favicon.ico" alt="SrP-CFG Icon" width="72">

[![stars](https://img.shields.io/github/stars/RolinShmily/SrP-CFG_ForCS2.svg?style=flat&color=green)](https://github.com/RolinShmily/SrP-CFG_ForCS2)
![license](https://img.shields.io/github/license/RolinShmily/SrP-CFG_ForCS2)
[![release](https://img.shields.io/github/release/RolinShmily/SrP-CFG_ForCS2.svg?style=flat&color=blue)](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/RolinShmily/SrP-CFG_ForCS2)

<br>

[English](README.md) | [简体中文](README.zh-CN.md)

</div>

---

## 💡 Core Philosophy

> **Functionality belongs to the runtime; personal preferences belong to you.**

In Counter-Strike 2, Valve introduced the VCFG mechanism to manage players' keybindings and engine convars. Traditional monolithic "all-in-one" CFG packs frequently overwrite personal habits or get lost in Steam Cloud synchronization conflicts.

SrP-CFG establishes explicit boundaries through a **Four-Layer Architecture Model** and **Three Decoupled Modular Packages**:

- **Layer A · Runtime Core**: Permanently and read-only registers the alias engine, resident features, and mode sessions with zero pollution.
- **Layer B · Presets**: Provides deterministic, auditable template starting points (RoL1n, Echo, YSZH, VisionL, and CS2 Default Settings).
- **Layer C · User Layer**: Maintained exclusively by the player via `user/custom.cfg`, with one-click Steam VCFG preference extraction and **absolute physical protection** during updates.
- **Layer D · VCFG / Cloud**: Natively serialized by CS2 and Steam Cloud. The Desktop app reads it safely without breaking cloud sync.

```text
CS2 Engine Boot
  ↓ Loads Steam Cloud VCFG (Local persistent state)
  ↓ Executes autoexec.cfg
  ↓ Layer A: Runtime Core (Read-only alias / help / mode registration)
  ↓ Layer B: Preset Template (Optional starting baseline)
  ↓ Layer C: user/custom.cfg (Final personal override with highest priority)
```

---

## 📦 Three Decoupled Packages

Monolithic bundles are split into three independently distributed artifacts:

| Package Name | Target Directory | Description |
| :--- | :--- | :--- |
| **`SrP-CFG_Runtime_Core.zip`** | `game/csgo/cfg/` | **Mandatory Core Base**. Includes `autoexec.cfg`, runtime command engine, feature modules, modes, and preset templates. |
| **`SrP-CFG_Map_Guides.zip`** | `game/csgo/annotations/` | **Native Map Annotations**. Standard CS2 `MapAnnotationNode` KV3 structures with complete lineup lineups for Mirage, Inferno, Dust2, Ancient, etc. |
| **`SrP-CFG_Video_Settings.zip`** | `game/csgo/cfg/` | **Competitive Video Settings**. Deeply optimized `cs2_video.txt` preset tuned for high refresh rates (144Hz/240Hz+) and minimal input latency. |

---

## 🚀 Quick Start

### Method 1: Using the Desktop Suite (Recommended)

1. Download the installer (`SrP-CFG_Installer.msi` or `SrP-CFG_Setup_x64.exe`) from the [Download Center](https://cfg.srprolin.top/download) or [GitHub Releases](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases).
2. Launch the desktop app; it will automatically detect Steam, CS2, and active account paths.
3. In **Component Downloads**, fetch the decoupled packages via high-speed mirror or GitHub direct download, or drag in custom configuration ZIPs.
4. In **Component Installation**, preview the pre-deployment file diff (`[New]` / `[Overwrite]` / `[Protected]`), toggle needed components, and deploy in one click.
5. In **Config Injection**, pick a preset template, extract your Steam VCFG preferences, and fine-tune `custom.cfg` with the built-in editor.

### Method 2: Manual ZIP Installation (CLI Mode)

1. Download `SrP-CFG_Runtime_Core.zip` and extract its contents into `game/csgo/cfg/`.
2. (Optional) Extract `SrP-CFG_Map_Guides.zip` into `game/csgo/annotations/`.
3. (Optional) Extract `SrP-CFG_Video_Settings.zip` into `game/csgo/cfg/`.
4. Launch CS2 and type `srp_help` in the game console to browse all available commands.

---

## 🎮 Essential Console Commands

| Command Entrypoint | Description | Overwrites Physical Keybinds |
| :--- | :--- | :---: |
| `srp_help` | Open complete index for features, modes, presets, and reset commands | No |
| `srp_practice` | Activate offline Practice Mode (infinite ammo, grenade trajectories, bot controls) | No |
| `srp_preview` | Activate skin / knife inspect preview mode | No |
| `srp_demo` | Activate HLAE / DEMO playback enhanced mode | No |
| `srp_apply_default` | Apply RoL1n's personal competitive settings and keybind preset | Yes |
| `srp_apply_echo` / `yszh` / `visionl` | Apply selected community templates | Yes |
| `srp_reset_valve` | Apply auditable CS2 default keybinds and engine settings baseline | Yes |
| `srp_reload` | Re-execute the `Runtime → User` boot chain to apply changes immediately | Depends on User |

---

## 🖥️ Desktop Suite

Built on **Tauri v2 + Rust Core + React 19** (installer bundle ≤ 20MB, runtime memory < 40MB), providing a fully auditable 5-stage pipeline:

<p align="center">
  <img src="./app/shared/images/desktop-1.png" alt="SrP-CFG Desktop Quick Start Page" width="100%">
</p>

<details>
  <summary><strong>Click to view all interface screenshots</strong></summary>
  <br>
  <p align="center">
    <img src="./app/shared/images/desktop-2.png" alt="Component Downloads Page" width="49%">
    <img src="./app/shared/images/desktop-3.png" alt="Component Installation Page" width="49%">
  </p>
  <p align="center">
    <img src="./app/shared/images/desktop-4.png" alt="Config Injection Page" width="49%">
    <img src="./app/shared/images/desktop-5.png" alt="Current Installation Page" width="49%">
  </p>
  <p align="center">
    <img src="./app/shared/images/desktop-6.png" alt="Recovery Center Page" width="49%">
    <img src="./app/shared/images/desktop-7.png" alt="About Page" width="49%">
  </p>
</details>

### Six Key Capabilities

1. **Smart Environment Detection**: Automatically discovers Steam paths, CS2 game libraries, active account VCFG folders, and running CS2 process detection.
2. **Decoupled Packages & Sandbox Staging**: Dual-channel downloads (direct / mirror) and custom package ingestion with automatic classification into a sandboxed staging area.
3. **Pre-deployment File Diff Audit**: Audits physical file changes before installation (`[New]`, `[Overwrite]`, `[Protected]`), with custom path overrides and soft CS2 running prompts.
4. **Config Injection & VCFG Extraction**: Switch presets with live previews; extract keybindings and sensitivity from Steam Cloud `cs2_user_keys.vcfg` into `custom.cfg` with one-click undo support.
5. **CS2 Specialized Code Editor**: Built-in CodeMirror 6 with custom CS2 ConVar / Action syntax highlighting and Maple Mono NF CN ligatures, supporting instant `Ctrl+S` saving.
6. **Multi-Root Explorer & Snapshot Archiving**: Real-time physical tree browser across CFG, Annotations, and Video roots; auto-generates timestamped ZIP snapshots before every installation with configurable retention limits (default 10) and one-click rollback.

---

## 🔒 100% Valve Safe · Zero Injection Guarantee

- **Pure Native Execution**: SrP-CFG strictly operates via CS2's built-in `+exec` launch parameters and standard `.cfg` / `.txt` files. **Zero DLL injection, zero memory tampering, zero engine hooks**.
- **Non-destructive VCFG Reading**: The desktop client only reads Steam local persistence files, without corrupting cloud sync states.
- **Full VAC Safety**: 100% compliant and safe across official matchmaking, Premier, and third-party competitive platforms (FACEIT, 5E, PerfectWorld).

---

## 🌐 Official Website & Knowledge Base Ecosystem

- **Official Website**: [https://cfg.srprolin.top/](https://cfg.srprolin.top/)
- **Documentation Center**: [https://cfg.srprolin.top/docs](https://cfg.srprolin.top/docs) (Architecture, User Guides, Modes, and Reference)
- **CS2 Command Center**: [https://cfg.srprolin.top/commands](https://cfg.srprolin.top/commands) (Over 2,785+ official commands & ConVars with fuzzy search, default values, and engine constraints)
- **AI Assistant**: Powered by Cloudflare Workers + Vectorize + Workers AI, independently indexing SrP-CFG source code and official CS2 commands.

---

## 📁 Repository Structure

```text
SrP-CFG_ForCS2/
├── config/                         # Configuration sources for decoupled packages
│   ├── autoexec.cfg                # CS2 startup entrypoint
│   ├── annotations/                # Map guide resources (KV3 MapAnnotationNode)
│   ├── video/                      # Competitive video settings (cs2_video.txt)
│   └── srp-cfg/
│       ├── runtime/                # Persistent aliases & module registrations
│       ├── helps/                  # In-game console help menus
│       ├── features/               # Resident feature modules (crosshair, viewmodel, jumpthrow)
│       ├── modes/                  # Explicit session modes (practice, preview, demo)
│       ├── presets/                # Template presets (RoL1n, Echo, YSZH, CS2 Default)
│       └── user/custom.cfg         # User-exclusive personal configuration window
├── app/
│   ├── website/                    # Official site & docs (Vite + React Router 7 SSG, 2800+ pre-rendered pages, Velite content pipeline)
│   ├── desktop/                    # Desktop suite (Tauri v2 + React 19 + pure logic `core/` Rust crate)
│   └── shared/                     # Shared UI components (@srp-cfg/ui), TypeScript types, and image assets
├── .github/
│   ├── workflows/                  # GitHub Actions CI/CD workflows
│   └── scripts/                    # Validation, packaging, and parsing scripts
└── README.md
```

---

## 🛠️ Local Development & Build

### Prerequisites

- **Node.js**: 22+
- **pnpm**: 10+
- **Rust**: Latest Stable (MSVC toolchain for Windows Tauri builds)
- **Python**: 3.10+ (Recommended with `uv`)

### Starting Development

```bash
# Install dependencies
pnpm install

# Start website & documentation dev server
pnpm dev:web

# Start desktop app in development mode
pnpm dev:desktop
```

### Build & Testing

```bash
# Build website SSG static output
pnpm build:web

# Build desktop installer packages (MSI + NSIS Setup)
pnpm --filter @srp-cfg/desktop tauri build

# Run Rust Core unit tests (84+ test cases)
cargo test -p srp-cfg-core --manifest-path app/desktop/src-tauri/Cargo.toml

# Validate CFG syntax and decoupled packaging pipelines
uv run --with pyyaml python3 .github/scripts/validate_cfg.py --packages
```

---

## 🙏 Acknowledgements

- [Maple Mono](https://github.com/subframe7536/maple-font) by [@subframe7536](https://github.com/subframe7536) — A delightful open-source rounded monospace font with ligatures (licensed under the [SIL Open Font License 1.1](https://github.com/subframe7536/maple-font/blob/main/LICENSE)). The built-in CS2 code editor and documentation site use Maple Mono NF CN for monospace typography.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Counter-Strike 2 is a registered trademark of Valve Corporation. This project is an independent open-source tool and is not affiliated with Valve Corporation.
