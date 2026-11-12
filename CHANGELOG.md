# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **config**: Bump `srp-cfg` preset baseline package to v3.4.2 (update default preset sensitivity to 0.53, viewmodel to v06, and mwheelup to invprev).
- **ci**: Integrate CHANGELOG release notes extraction into GitHub Actions release workflow and manifest generation.

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
