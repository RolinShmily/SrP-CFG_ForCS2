<h1 align="center">SrP-CFG</h1>
<h4 align="center">适用于 CS2 各场景的模块化 CFG Runtime</h4>

<div align="center">

<img src="https://cdn.jsdelivr.net/gh/RolinShmily/SrP-CFG_ForCS2@refs/heads/main/app/website/public/favicon.ico" alt="SrP-CFG 图标">

[![stars](https://img.shields.io/github/stars/RolinShmily/SrP-CFG_ForCS2.svg?style=flat&color=green)](https://github.com/RolinShmily/SrP-CFG_ForCS2)
[![fork](https://img.shields.io/github/forks/RolinShmily/SrP-CFG_ForCS2.svg?style=flat&color=critical)](https://github.com/RolinShmily/SrP-CFG_ForCS2)
![license](https://img.shields.io/github/license/RolinShmily/SrP-CFG_ForCS2)
[![release](https://img.shields.io/github/release/RolinShmily/SrP-CFG_ForCS2.svg?style=flat&color=blue)](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases)

</div>

## 📖 简介

> 所有功能 CFG 都会在控制台输出导航信息；输入 `srp_help` 可以随时查看入口。

SrP-CFG v3 将功能 Runtime、内置 Preset 案例、用户偏好与 CS2 的 VCFG 持久状态分层管理。Runtime 负责注册 alias、Feature 与 Mode；用户只需维护 `srp-cfg/user/custom.cfg`，可以保持 VCFG 托管，也可以选择 Default / Echo / YSZH / VisionL 作为配置起点并继续覆盖。

当前只发行一个配置包：`SrP-CFG_Runtime_Core.zip`。

| 功能 | 位置 / 命令 |
| :--- | :--- |
| Runtime 启动与功能注册 | `autoexec.cfg`、`srp-cfg/runtime/` |
| 用户唯一配置入口 | `srp-cfg/user/custom.cfg` |
| 内置完整 Preset 案例 | `srp_apply_default / echo / yszh / visionl` |
| Valve 测试基线 | `srp_reset_valve` |
| 准星与持枪视角库 | `srp_crosshair_view` |
| 武器自适应视角 | `srp_autoview` |
| 匕首与电击枪功能 | `srp_knife`、`srp_zeus` |
| 跑图练习模式 | `srp_practice` |
| 饰品预览模式 | `srp_preview` |
| 地图指南制作 | `srp_guidemake` |
| HLAE Demo 录制 | `srp_demo` |

你会需要的链接：

- [项目官网](https://cfg.srprolin.top/)
- [项目文档](https://cfg.srprolin.top/docs)
- [下载地址](https://cfg.srprolin.top/download)
- [关于 CFG 你要了解的二三事](https://blog.srprolin.top/posts/srp-cfg/)

## 🖥️ Desktop 界面

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

## 🛠 Installer 安装器

在 [Release](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases) 或[项目官网](https://cfg.srprolin.top/download)下载 MSI / Portable。Desktop 会把配置暂存、路径检测、部署、个人配置与恢复边界集中到一个界面中。

### ✏️ 功能说明

- 自动检测 Steam、CS2、游戏 CFG、Annotations、Video 与账号 CFG 路径
- 读取当前账号 VCFG / Steam Cloud 概况，但不直接覆盖 Valve 管理文件
- 下载唯一 Runtime Core，或导入 ZIP、CFG、TXT 与文件夹
- 支持覆盖与追加安装，并记录安装器负责的受管文件
- 在“我的配置”中直接维护 `user/custom.cfg` 与 `srp_apply_*` 起点
- 更新、回滚和卸载 Runtime 时保护用户配置
- 分开管理上一个 Runtime、安装前原文件与只读 VCFG 快照
- 支持检查更新、实时日志与安装结果审计

## 🌳 项目结构

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

## 📦 运行环境

**普通用户：** 下载 `SrP-CFG_Installer.msi`、`SrP-CFG_Portable.zip` 或 `SrP-CFG_Runtime_Core.zip` 即可使用。

**开发者环境：**

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 10+
- [.NET 8 SDK](https://dotnet.microsoft.com/) 与 [WiX Toolset v6](https://wixtoolset.org/)（仅 MSI）

### 💻 开发

```bash
pnpm install
pnpm dev:web
pnpm dev:desktop
```

### 🚀 构建与校验

```bash
pnpm build:web
pnpm package:desktop
pnpm build:msi

python .github/scripts/validate_cfg.py
python .github/scripts/build_packages.py
python .github/scripts/validate_cfg.py --packages
```

## 🏠 仓库活动

![仓库活动](https://repobeats.axiom.co/api/embed/55700fe0f86a32b2418b023fa87c8ec214153ef0.svg "Repobeats analytics image")
