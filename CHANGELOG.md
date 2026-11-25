# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.5.0] - 2026-11-25

> **zh**: 官网与指令中心重构为统一现代暗色 UI 并集成 Pagefind 全文检索；内容包移除 VERSION.txt 改为 SHA-256 与更新日期校验；Cloudflare Worker 新增 /releases/* 流式反代；精简 CLI、扁平化 core 并统一 tests/ 与 CI/CD 工作流。  
> **en**: Rebuilt website and CS2 Console Hub with a unified dark UI and Pagefind full-text search; replaced content package VERSION.txt with SHA-256 and update dates; added Cloudflare Worker /releases/* proxy; dropped CLI, flattened core, and unified tests/ and CI/CD workflows.

### Added
- **website**: Rebuild the site with a unified dark-slate & CS2 amber design system, dedicated `/download` center, global `Ctrl+K` command palette, and chunked **Pagefind** static full-text search (Chinese/English + ConVar/Command filters) across 5,500+ CS2 console records.
- **worker**: Add Cloudflare Worker `/releases/latest.json` and `/releases/download/<tag>/<file>` streaming proxy (`worker/index.ts`, `run_worker_first = ["/releases/*"]`) so desktop and website software downloads share `https://cfg.srprolin.com` with byte-identical GitHub Release SHA-256 digests.
- **content**: Add the `srp-cfg-csgo` package, a Source 1 port of the runtime core with presets, modules, and `autoexec_csgo.cfg` for the CS:GO edition, available in the website Download Center.
- **tests**: Consolidate all test suites under top-level `tests/` (`tests/core`, `tests/gui`, `tests/content`, `tests/worker`, `tests/website`, `tests/console`).

### Changed
- **content**: Rename `config/` to `content/`, remove per-package `VERSION.txt`, and switch content packaging (`scripts/package_content.py`) and desktop staging/update checks to pure SHA-256 + `updated_at` (`YYYYMMDD`), published at `/packages/manifest.json` (retaining `/packages.json` as a compatibility alias).
- **core**: Flatten `src/core/include/srp/core/` and `src/core/src/` into `src/core/` with `#include "core/<header>"`; point desktop update and package checks to `https://cfg.srprolin.com/releases/latest.json` and `/packages/manifest.json` with redirects disabled; detect outdated staged edits by byte comparison against package originals.
- **website**: Route software downloads through `cfg.srprolin.com` by default (replacing third-party `gh-proxy.org`) while keeping direct GitHub Releases switching.
- **content**: Update default `srp-cfg` preset baseline (sensitivity 0.53, viewmodel v06, mwheelup invprev, refined crosshair presets 05/06 with default c06).
- **ci**: Consolidate GitHub Actions into 5 focused workflows (`test.yml`, `deploy.yml`, `update.yml`, `build.yml`, `release.yml`); merge console validation into `test.yml` and combine scheduled console sync + weekly Valve baseline drift checks into `update.yml`; update actions to v6/v7 and integrate CHANGELOG extraction into `release.yml`.
- **repo**: Consolidate `THIRD_PARTY_NOTICES.md` and `licenses/` into a single self-contained plain-text `THIRD_PARTY_NOTICES`; move `run_gui.bat` to `scripts/run-gui.bat`; simplify GitHub issue templates.
- **docs**: Streamline `docs/` into four flat guides (`architecture.md`, `design.md`, `reference.md`, `development.md`), move showcase images to `assets/`, and rewrite bilingual READMEs with player-first usage steps.

### Removed
- **cli**: Remove `src/cli/`, `skills/srpcfg-cli/`, CLI release archives, and installer PATH registry integration to focus the product on the desktop workbench.
- **content**: Remove `content/*/VERSION.txt` and legacy SemVer version tracking for content packages.
- **repo**: Remove redundant root and GitHub boilerplate (`CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.github/dependabot.yml`, `.github/PULL_REQUEST_TEMPLATE.md`) and legacy Valve SVG background assets (`website/public/cs2/`).

### Fixed
- **tests**: Derive expected packages, catalog counts, and module IDs from shipped content instead of pinning release numbers, eliminating false CI failures after content updates.
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
