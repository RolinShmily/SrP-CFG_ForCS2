<h1 align="center">SrP-CFG v3</h1>
<h4 align="center">面向 CS2 的模块化 CFG Runtime、桌面安装器与可检索中文知识库</h4>
<div align="center">

<img src="https://cdn.jsdelivr.net/gh/RolinShmily/SrP-CFG_ForCS2@refs/heads/main/app/website/public/favicon.ico" alt="SrP-CFG 图标">

[![stars](https://img.shields.io/github/stars/RolinShmily/SrP-CFG_ForCS2.svg?style=flat&color=green)](https://github.com/RolinShmily/SrP-CFG_ForCS2)
[![fork](https://img.shields.io/github/forks/RolinShmily/SrP-CFG_ForCS2.svg?style=flat&color=critical)](https://github.com/RolinShmily/SrP-CFG_ForCS2)
![license](https://img.shields.io/github/license/RolinShmily/SrP-CFG_ForCS2)
[![release](https://img.shields.io/github/release/RolinShmily/SrP-CFG_ForCS2.svg?style=flat&color=blue)](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases)

</div>

## 快速开始

> 安装唯一配置包 `SrP-CFG_Runtime_Core.zip`。游戏内输入 `srp_help` 可随时打开完整控制台帮助。

SrP-CFG v3 把配置拆成四个明确边界：**Runtime 注册能力，Preset 提供确定性起点，User 保存个人最终覆盖，VCFG 由 CS2 / Steam Cloud 管理当前可持久状态**。普通用户只需维护 `srp-cfg/user/custom.cfg`，无需修改仓库内的功能或案例文件。

1. 从[下载页](https://cfg.srprolin.top/download)获取 MSI / Portable，或直接下载 Runtime Core。
2. 使用 Desktop 检测 Steam、CS2 与当前账号路径，并安装到 `game/csgo/cfg/`。
3. 在“我的配置”中选择一种模式：
   - **Runtime + VCFG**：不启用 `srp_apply_*`，普通设置继续由游戏保存。
   - **Preset + User**：启用一个 `srp_apply_default / echo / yszh / visionl`，再在下方写个人差异。
4. 游戏内执行 `srp_reload` 重放 `Runtime → User` 启动链；执行 `srp_help` 查看模块入口。

| 入口 | 作用 | 是否覆盖物理按键 |
| :--- | :--- | :---: |
| `srp_help` | 打开功能、模式、Preset 与恢复命令索引 | 否 |
| `srp_apply_default / echo / yszh / visionl` | 应用完整设置与键位案例 | 是 |
| `srp_practice` / `srp_preview` / `srp_demo` | 只应用对应会话设置 | 否 |
| 对应的 `*_keys` 入口 | 设置后再安装工作区键位 | 是 |
| `srp_reset_valve` | 建立可审计的 Valve 偏好与键位测试基线 | 是 |
| `srp_reload` | 重新注册 Runtime，并最后执行 `user/custom.cfg` | 取决于 User |

## 能力范围

- **Runtime Core**：准星 / 持枪视角、自动视角、刀具、Zeus、跑图、饰品预览、地图指南和 HLAE Demo 模式。
- **Desktop**：只读检测 VCFG、管理 `custom.cfg`、安装 / 更新 / 回滚 / 卸载 Runtime，并保护用户配置。
- **文档中心**：按架构、安装、功能、模式和参考分组；先理解覆盖与持久化边界，再启用功能。
- **指令中心**：中文 / 英文 / 拼音检索 CS2 官方命令；变量卡片展示默认值、引擎 Min/Max 约束、说明范围与明确离散取值。
- **双知识库 AI**：独立检索 SrP-CFG 源码结构和 CS2 官方指令数据，避免把项目用法与通用 Cvar 语义混在一起。

### 项目入口

- [官网](https://cfg.srprolin.top/)
- [文档中心](https://cfg.srprolin.top/docs) · [v3 架构](https://cfg.srprolin.top/docs/srpcfg-1) · [使用指南](https://cfg.srprolin.top/docs/srpcfg-3)
- [CS2 指令中心](https://cfg.srprolin.top/commands)
- [下载 Installer / Runtime Core](https://cfg.srprolin.top/download)
- [GitHub Releases](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases)
- [关于 CFG 你要了解的二三事](https://blog.srprolin.top/posts/srp-cfg/)

## Desktop 界面

<p align="center">
  <img src="./app/website/src/assets/desktop-user-config.png" alt="SrP-CFG Desktop 我的配置页面" width="100%">
</p>

<details>
  <summary><strong>展开查看其余界面</strong></summary>
  <br>
  <p align="center">
    <img src="./app/website/src/assets/desktop-quick-start.png" alt="快速开始页面" width="49%">
    <img src="./app/website/src/assets/desktop-download.png" alt="配置包下载页面" width="49%">
  </p>
  <p align="center">
    <img src="./app/website/src/assets/desktop-install.png" alt="安装配置页面" width="49%">
    <img src="./app/website/src/assets/desktop-recovery-center.png" alt="恢复中心页面" width="49%">
  </p>
  <p align="center">
    <img src="./app/website/src/assets/desktop-current-installation.png" alt="当前安装页面" width="49%">
    <img src="./app/website/src/assets/desktop-about.png" alt="关于页面" width="49%">
  </p>
</details>

## Installer 安装器

在 [Releases](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases) 或[项目下载页](https://cfg.srprolin.top/download)获取 MSI / Portable。Desktop 把暂存、路径检测、部署、用户配置和恢复边界集中到一个可审计界面中。

### 功能说明

- 自动检测 Steam、CS2、游戏 CFG、Annotations、Video 与账号 CFG 路径
- 只读统计当前账号 VCFG 的按键绑定与偏好设置，可按需生成 CFG 命令写入 `custom.cfg`
- 下载唯一 Runtime Core，或导入 ZIP、CFG、TXT 与文件夹
- 支持覆盖与追加安装，并记录安装器负责的受管文件
- 在"我的配置"中直接维护 `user/custom.cfg` 与 `srp_apply_*` 起点，支持从 VCFG 自动写入当前按键与偏好
- 更新、回滚和卸载 Runtime 时保护用户配置
- 分开管理上一个 Runtime、安装前原文件与只读 VCFG 快照
- 支持检查更新、实时日志与安装结果审计

## 数据与 AI 工作流

| 工作流 | 触发条件 | 处理链 | 产物 |
| :--- | :--- | :--- | :--- |
| CS2 指令更新 | 每日 02:00 UTC / 手动 | SteamTracking `commands.txt` + `convars.txt` → Workers AI 中文翻译（仅新增项）→ 数值结构化 → Vectorize 增量同步 | `commands.json`、命令向量索引 |
| SrP-CFG 源码索引 | `config/**` 推送 / 手动 | CFG 解析与校验 → 按命令、绑定、模块和帮助切片 → BGE-M3 embedding → 独立 Vectorize 索引 | SrP-CFG 源码知识库 |
| 网站问答 | 用户选择知识库并提问 | Turnstile → 查询 embedding → 仅检索所选物理索引 → Llama 3.2 回答 | 来源边界明确的中文回答 |

本地验证数据模型：

```bash
python .github/scripts/test_command_values.py
pnpm check:config-index
pnpm --filter @srp-cfg/website check
```

## 项目结构

```text
SrP-CFG_ForCS2/
├── config/                         # 唯一 Runtime Core 的配置源
│   ├── autoexec.cfg                # CS2 启动入口
│   ├── annotations/                # 地图指南资源
│   ├── video/                      # 视频设置资源
│   └── srp-cfg/
│       ├── runtime/                # 持久 alias 与模块注册
│       ├── helps/                  # 控制台帮助入口
│       ├── features/               # 常驻功能模块
│       ├── modes/                  # 显式工作模式
│       ├── presets/                # Default / 朋友案例 / Valve 基线
│       └── user/custom.cfg         # 用户唯一配置窗口
├── app/
│   ├── website/                    # Astro 官网与文档中心
│   ├── desktop/                    # Electron + React 桌面端
│   └── shared/                     # 共享类型、UI 与内容
├── msi/                            # WiX v6 MSI 项目
├── .github/                        # CI、Release 与打包脚本
└── README.md
```

## 运行环境

**普通用户：** 下载 `SrP-CFG_Installer.msi`、`SrP-CFG_Portable.zip` 或 `SrP-CFG_Runtime_Core.zip` 即可使用。

**开发者环境：**

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 10+
- [.NET 8 SDK](https://dotnet.microsoft.com/) 与 [WiX Toolset v6](https://wixtoolset.org/)（仅 MSI）

### 开发

```bash
pnpm install
pnpm dev:web
pnpm dev:desktop
```

### 构建与校验

```bash
pnpm build:web
pnpm package:desktop
pnpm build:msi

pnpm --filter @srp-cfg/website check
pnpm check:config-index

python .github/scripts/test_command_values.py
python .github/scripts/validate_cfg.py
python .github/scripts/build_packages.py
python .github/scripts/validate_cfg.py --packages
```

## 仓库活动

![仓库活动](https://repobeats.axiom.co/api/embed/55700fe0f86a32b2418b023fa87c8ec214153ef0.svg "Repobeats analytics image")
