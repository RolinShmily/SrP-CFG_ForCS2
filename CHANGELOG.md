# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **config**: Add the `srp-cfg-csgo` package (v3.4.2-csgo), a Source 1 port of the runtime core with presets, modules, and `autoexec_csgo.cfg` for the CS:GO edition.
- **website**: Offer `srp-cfg-csgo` as a fourth downloadable configuration package with localized copy and ZIP layout validation.
- **worker**: Add Cloudflare Worker `/releases/latest.json` and `/releases/download/<tag>/<file>` streaming proxy (`worker/index.ts`, `run_worker_first = ["/releases/*"]`) so desktop and website software downloads share `https://cfg.srprolin.com` with byte-identical GitHub Release SHA-256 digests.
- **tests**: Consolidate tests under top-level `tests/` (`tests/core`, `tests/gui`, `tests/content`, `tests/worker`).
- **ci**: Split lightweight `test.yml` (repo/content/worker checks + dual-OS core CTest) and reusable Windows `build.yml` from `release.yml`; fail the Valve upstream drift workflow when detection crashes instead of reporting a silent success.

### Changed
- **content**: Rename `config/` to `content/` and decouple packaging into `scripts/package_content.py`, publishing the isolated manifest at `/packages/manifest.json` (retaining `/packages.json` as a compatibility alias).
- **core**: Flatten `src/core/include/srp/core/` and `src/core/src/` into `src/core/` with `#include "core/<header>"`; point desktop update and package checks to `https://cfg.srprolin.com/releases/latest.json` and `/packages/manifest.json` with redirects disabled.
- **website**: Route software downloads through `cfg.srprolin.com` by default (replacing third-party `gh-proxy.org`) while keeping direct GitHub Releases switching.
- **config**: Bump `srp-cfg` preset baseline package to v3.4.3 (update default preset sensitivity to 0.53, viewmodel to v06, and mwheelup to invprev; refine crosshair-view library presets 05/06 and switch the default preset crosshair to c06).
- **ci**: Integrate CHANGELOG release notes extraction into GitHub Actions release workflow and manifest generation.
- **ci**: Update actions to checkout/setup-node/setup-python v7, pnpm/action-setup v6, and action-gh-release v3; pin previously floating action refs.
- **ci**: Keep console dataset validation strict for pull requests but allow stale translations during scheduled upstream syncs, and retry the sync push once after rebasing.
- **release**: Validate CHANGELOG structure before building release artifacts; keep GitHub Releases focused on software binaries (`gui.zip`, `setup.exe`, `latest.json`).
- **repo**: Consolidate `THIRD_PARTY_NOTICES.md` and `licenses/` into a single self-contained plain-text `THIRD_PARTY_NOTICES`; move `run_gui.bat` to `scripts/run-gui.bat`; simplify GitHub issue templates.
- **docs**: Streamline `docs/` into four flat guides (`architecture.md`, `design.md`, `reference.md`, `development.md`), move showcase images to `assets/`, and rewrite bilingual READMEs with player-first usage steps.

### Removed
- **cli**: Remove `src/cli/`, `skills/srpcfg-cli/`, CLI release archives, and installer PATH registry integration to focus the product on the desktop workbench.
- **repo**: Remove redundant root and GitHub boilerplate (`CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.github/dependabot.yml`, `.github/PULL_REQUEST_TEMPLATE.md`).

### Fixed
- **tests**: Derive expected package versions, catalog counts, and module IDs from shipped content instead of pinning release numbers, eliminating false CI failures after config bumps.
- **console**: Silence expected translation-failure output in unit tests.
- **website**: Fix package readiness check after removing `srpcfg-cli` from the content manifest.

## [3.4.9] - 2026-11-09

> **zh**: 安装器新增可选 CLI PATH 环境变量集成。  
> **en**: Inno Setup installer adds optional CLI PATH environment variable integration.

### Added
- **installer**: Add optional CLI PATH environment variable integration during installation, allowing `srpcfg` to be executed directly from any terminal.

## [3.4.8] - 2026-11-09

> **zh**: 视频设置新增 16:10 分辨率预设；GUI 优化大屏自适应与嵌入式设置/关于页面。  
> **en**: Add 16:10 aspect ratio resolution presets; optimize GUI layout and responsive styling.

### Added
- **video**: Add 16:10 aspect ratio resolution presets (`1680x1050`, `1440x900`, `1280x800`).

### Fixed
- **gui**: Preserve hero section aspect ratio and seamlessly embed settings and about views into the main workspace.

## [3.4.7] - 2026-11-09

> **zh**: 导航与侧栏切换至语义化 Lucide 图标；精简绿色便携包体积。  
> **en**: Migrate sidebar navigation to Lucide SVG icons; trim standalone GUI portable archive.

### Added
- **gui**: Introduce shared semantic Lucide SVG icon set for sidebar and page headers.

### Optimized
- **gui**: Cache media catalog data and optimize dark/light theme switching animations.
- **release**: Strip redundant VC redist installer and unused software OpenGL DLL from portable GUI package.

## [3.4.6] - 2026-11-09

> **zh**: 修复安装器图标路径。  
> **en**: Fix installer icon path pointing to moved GUI assets.

### Fixed
- **release**: Correct installer icon target after moving application source layout.

## [3.4.5] - 2026-11-09

> **zh**: 源码目录架构重构为 src/ 模块化分层；文档中心全面整理重构。  
> **en**: Reorganize application sources into src/ and restructure project documentation.

### Changed
- **refactor**: Move application sources into structured `src/` hierarchy (`core`, `cli`, `gui`).
- **docs**: Reorganize documentation into architecture, development, reference, and user guides.

### Fixed
- **gui**: Align runtime action triggers and restore dropdown scrolling.

## [3.4.4] - 2026-10-26

> **zh**: 修复组件运行时与官网配置包分离规则。  
> **en**: Separate configuration packages from CLI skill and refine runtime action triggers.

### Fixed
- **website**: Disentangle config packages from agent skill downloads in web showcase.
- **gui**: Refine runtime card action button states and event propagation.

## [3.4.3] - 2026-10-26

> **zh**: 官方服务与配置分发全面迁移至 .com 域名；配置包升版至 3.4.1。  
> **en**: Migrate official domains and package endpoints to .com; bump srp-cfg to 3.4.1.

### Changed
- **core**: Migrate official package manifest and release endpoints to `cfg.srprolin.com`.
- **config**: Bump `srp-cfg` package baseline to v3.4.1 with updated domain references.
- **skill**: Bump `srpcfg-cli` skill to v1.0.2.

## [3.4.2] - 2026-10-07

> **zh**: GUI 首页下半区重构，新增 SrP-CFG 运行时状态卡。  
> **en**: Redesign home page lower half with integrated SrP-CFG runtime status card.

### Added
- **gui**: Add unified SrP-CFG runtime status card integrating assembly and online update statuses.
- **skill**: Rename skill package to `srpcfg-cli` (v1.0.1).

## [3.4.1] - 2026-10-06

> **zh**: 引入独立 srpcfg CLI 命令行工具与配套 Agent Skill。  
> **en**: Introduce standalone srpcfg CLI tool and bundled AI Agent Skill.

### Added
- **cli**: Expose standalone `srpcfg` binary with zero-dependency C++17 core.
- **skill**: Add `srpcfg-cli` Agent Skill for automated CS2 configuration inspection and management.

## [3.4.0] - 2026-10-05

> **zh**: 全新 C++17 / Qt 6 架构重构，原生桌面 GUI、原子配置包与非侵入式挂载。  
> **en**: Complete C++17 / Qt 6 native rewrite with HuskarUI, atomic config packages, and non-invasive autoexec mounting.

### Added
- **core**: Native C++17 core engine with transactional backup, safe staging, and non-invasive autoexec mounting.
- **gui**: Modern desktop GUI powered by Qt 6 and HuskarUI with fluent dark/light theming.
- **packages**: Decoupled atomic configuration packages (`srp-cfg`, `video`, `annotations`) with Cloudflare Worker delivery.
- **installer**: Automated Inno Setup packaging and standalone portable ZIP distribution.
