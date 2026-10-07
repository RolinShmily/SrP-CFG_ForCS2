<h1 align="center">SrP-CFG</h1>
<h4 align="center">模块化 Counter-Strike 2 配置工作台 · 现代 Qt 桌面套件 · 纯净开源引擎</h4>

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/RolinShmily/SrP-CFG_ForCS2?color=orange)](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/RolinShmily/SrP-CFG_ForCS2/ci.yml?branch=main&label=CI)](https://github.com/RolinShmily/SrP-CFG_ForCS2/actions)
[![Deploy Worker](https://img.shields.io/github/actions/workflow/status/RolinShmily/SrP-CFG_ForCS2/deploy-worker.yml?branch=main&label=Cloudflare)](https://cfg.srprolin.top)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20x64-brightgreen.svg)](#)

[简体中文](README.zh-CN.md) | [English](README.md)

</div>

---

## 💡 核心设计理念

> **“把功能展开，把选择留给你；系统属于引擎，偏好属于玩家。”**

在 Counter-Strike 2 中，Valve 引入了全新的 VCFG 机制管理键位与引擎变量。传统单体“大包”CFG 往往覆盖玩家个人习惯，或者在 Steam 云存档同步时产生不可逆的冲突。

**SrP-CFG** 彻底解耦功能逻辑与个人偏好，构建清晰的分层执行模型与独立模块化配置包：

```text
CS2 引擎启动
  ↓ 加载 Steam Cloud VCFG（游戏原生持久化状态）
  ↓ 执行 autoexec.cfg（无感透明挂载）
  ↓ Layer 1: Valve 基线 / 预设模板（可选起步基准，可完全卸载）
  ↓ Layer 2: 特性模块（AutoView / 准星视角 / Knife / Zeus 等独立加载）
  ↓ Layer 3: 模式入口（练习 / 预览 / Demo 等绑定按键按需触发，启动时不直接执行）
  ↓ Layer 4: user/custom.cfg（最高优先级个人覆盖层，物理隔离绝不破坏）
```

---

## 📦 三大独立配置包

所有功能组件完全解耦，独立版本管理、独立分发，不强制捆绑：

| 配置包标识 | 目标部署路径 | 说明 |
| :--- | :--- | :--- |
| **`srp-cfg`** | `game/csgo/cfg/` | **运行时核心底座**。包含命令引擎、特性模块、模式会话、社区预设及 `custom.cfg` 用户专属层。 |
| **`video`** | `Steam/userdata/<ID>/730/local/cfg/` | **竞技画面模板**。结构化解析 `cs2_video.txt`，自动保留本机显卡/屏幕硬件标识与未知字段。 |
| **`annotations`** | `game/csgo/annotations/local/` | **原生地图标注指南**。标准 CS2 KV3 格式，多图并存且绝不覆盖玩家个人 `mapguide`。 |

---

## 🖥️ 现代化工程架构

工程采用模块化目录设计，严格遵循职责边界分离：

```text
SrP-CFG_ForCS2/
├── app/
│   ├── core/                  # C++17 纯逻辑核心库 (VCFG/CFG/KV3 解析、原子备份、暂存区事务)
│   ├── cli/                   # srpcfg 独立命令行工具 (自动化管理、CI 与脚本友好)
│   └── gui/                   # SrP-CFG 桌面端应用 (Qt 6 + HuskarUI + QML + QWindowKit)
├── config/                    # 源码内置的离线出厂配置包
│   ├── srp-cfg/               # 运行时脚本、catalog.json、预设与模块
│   ├── video/                 # cs2_video.txt 模板与版本标识
│   └── annotations/           # 原生地图标注资源
├── website/                   # 官方展示与文档站点 (Next.js 16 + React 19 + Tailwind CSS)
├── installer/                 # Windows 官方安装器脚本 (Inno Setup)
├── scripts/                   # 工程审计、漂移检测与本地辅助脚本
├── docs/                      # 架构规范、工作区设计与边界约定文档
└── CMakeLists.txt             # 统一根构建文件
```

### 核心安全与防护特性

1. **零注入 · 纯原生**：仅通过 CS2 原生 `+exec`、标准 `.cfg` 与 KV3 机制运作。**零 DLL 注入、零内存修改、零 Hook**。配置兼容性仍随游戏版本变化。
2. **多代快照与原子备份**：写入游戏或更新工作副本前，自动建立 `.bak` 并保留最多 20 份不同内容的去重历史备份，写入失败自动回滚。
3. **暂存区事务机制**：配置包下载更新先落盘到用户可写暂存区（Original / Work），玩家手工微调的工作副本在包更新时受保护。
4. **游戏运行安全互锁**：探测 CS2 进程状态，游戏运行时暂停画面配置写入，防止退出时被游戏覆盖。
5. **双语支持与主题随心**：默认浅色界面（更清晰专业），支持一键切换深色模式与中英文实时语言切换。

---

## 🚀 快速上手

### 方式 1：使用桌面工作台（推荐）

1. 前往 [GitHub Releases](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases) 或 [官方网站](https://cfg.srprolin.top/) 下载安装版 (`setup.exe`) 或免安装绿色便携版 (`gui.zip`)。
2. 启动 **SrP-CFG**，程序将自动识别 Steam、CS2 路径以及活跃用户。
3. 在**总览**中完成初始化装配；在**预设包**或**自由装配**中定制功能；在右侧固定代码编辑器中即时微调 `custom.cfg`。

### 方式 2：使用命令行工具 (CLI)

```bash
# 查看帮助与子命令
srpcfg --help

# 查看所有模块状态
srpcfg modules

# 装配特定功能模块 (如 autoview)
srpcfg feature-assemble autoview --keymap

# 为练习模式绑定启动键；遇冲突先查看，再明确批准 --confirm
srpcfg mode-bind practice --key p

# 部署特定地图标注 (如 mirage)
srpcfg annotation-deploy mirage
```

---

## 🎮 常用游戏内控制台指令

| 控制台命令 | 作用说明 | 覆盖物理按键 |
| :--- | :--- | :---: |
| `srp_help` | 打开游戏内帮助与命令索引菜单 | 否 |
| `srp_practice` | 进入离线跑图训练模式（无限弹药、投掷物轨迹、Bot 控制） | 否 |
| `srp_preview` | 激活检视与换肤预览环境 | 否 |
| `srp_demo` | 启动 DEMO / HLAE 录像观战增强模式 | 否 |
| `srp_apply_default` | 应用官方精选竞技预设 | 是 |
| `srp_apply_echo` / `srp_apply_visionl` / `srp_apply_yszh` | 应用精选社区知名模板 | 是 |
| `srp_reload` | 重新执行 `Runtime → User` 启动链立即重载 | 视用户配置 |

---

## 🛠️ 本地编译与开发

### 环境要求
- **C++ 编译器**：支持 C++17 的 MSVC (Visual Studio 2022) 或 GCC / Clang
- **CMake**：>= 3.21
- **Qt 6**：>= 6.5 (桌面 GUI 需要 Core、Gui、Quick、QuickControls2、Concurrent、ShaderTools 及私有开发头文件)
- **Node.js & pnpm**：Node >= 22, pnpm 11+ (官方网站需要)

### 编译核心与命令行 (无需 Qt)
```bash
cmake --preset core
cmake --build --preset core
ctest --preset core
```

### 编译桌面完整版 (Visual Studio 2022)
```bash
git submodule update --init --recursive
cmake --preset windows-msvc
cmake --build --preset release-msvc
# 运行桌面客户端
run_gui.bat
```

### 运行官方网站本地预览
```bash
cd website
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm lint
pnpm build
pnpm preview
```

---

## 智能体 Skill

仓库和软件包随附 [srpcfg-cli](skills/srpcfg-cli/SKILL.md)。[网站下载区](https://cfg.srprolin.top/#download) 另提供独立版本的 Skill ZIP，解压后将 `srpcfg-cli` 文件夹加入智能体的技能目录，即可按 CLI 工作流管理 CS2 配置。技能 ZIP 不包含 CLI 可执行文件。Windows 命令文件为 `srpcfg.exe`，请与随附 `config/` 保持在一起；PowerShell 中未加入 PATH 时使用 `./srpcfg.exe`。游戏内控制台 alias 仍使用原有 `srp_*` 名称。

## 🤝 贡献与规范

欢迎提交 Issue 与 Pull Request！在提交之前请注意：
- 严格遵循逻辑分层原则：核心逻辑沉淀在 `app/core`，界面呈现由 `app/gui` 负责。
- 所有对配置文件的写操作必须通过备份器事务，确保提供 `.bak` 与回滚路径。
- 详情请查阅 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

---

## 📄 开源许可证

本项目基于 **[MIT License](LICENSE)** 开源发布。  
Copyright (c) 2025-2026 **RoL1n_SrP**.

第三方组件遵循其各自的开源许可证要求，详细声明参见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

*Counter-Strike, Counter-Strike 2, CS2, Steam, Valve 均为 Valve Corporation 的注册商标。本项目为独立开源工具，与 Valve Corporation 没有任何关联或官方背书。*
