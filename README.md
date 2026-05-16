<h1 align="center">SrP-CFG</h1>
<h4 align="center">适用于CS2各场景的CFG预设文件</h4>

<div align="center">

<img src="https://cdn.jsdelivr.net/gh/RolinShmily/SrP-CFG_ForCS2@refs/heads/main/wpf/Resources/app.ico" alt="图标">

[![stars](https://img.shields.io/github/stars/RolinShmily/SrP-CFG_ForCS2.svg?style=flat&color=green)](https://github.com/RolinShmily/SrP-CFG_ForCS2)
[![fork](https://img.shields.io/github/forks/RolinShmily/SrP-CFG_ForCS2.svg?style=flat&color=critical)](https://github.com/RolinShmily/SrP-CFG_ForCS2)
![license](https://img.shields.io/github/license/RolinShmily/SrP-CFG_ForCS2)
[![release](https://img.shields.io/github/release/RolinShmily/SrP-CFG_ForCS2.svg?style=flat&color=blue)](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases)

</div>

## 简介

> 所有的 CFG 在运行后都会在控制台输出导航信息，请注意查看。

文件功能表：

|                             功能                              |         文件         |
| :-----------------------------------------------------------: | :------------------: |
|                        自启动基础设置                         |    `autoexec.cfg`    |
|                        准星与持枪视角                         | `crosshair_view.cfg` |
|                        个人自建房跑图                         |    `practice.cfg`    |
| 使用[HLAE](https://github.com/advancedfx/advancedfx)观看 demo |   `demo_hlae.cfg`    |
|                         匕首模型切换                          |     `knife.cfg`      |
|                        电击枪快速切换                         |      `zeus.cfg`      |
|                       武器自适应视角切换                       |    `autoview.cfg`    |
|                       饰品预览检视工具模式                    |    `previewmode.cfg`    |
|                       地图指南制作模式                        |    `guidemake.cfg`    |
|                       各大地图指南预设                        | `annotations/dust2`等  |
|                           视频设置                            |   `cs2_video.txt`    |

你会需要的链接：

- [项目说明书](https://doc.srprolin.top/SrP-CFG_CS2/srpcfg-1.html) 
- [下载地址](https://doc.srprolin.top/SrP-CFG_CS2/srpcfg-2.html) 
- [关于CFG你要了解的二三事](https://blog.srprolin.top/posts/srp-cfg/) 

## Installer 安装器

![SrP-Installer](site/img.webp)

在[Release](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases)和[项目下载地址](https://doc.srprolin.top/SrP-CFG_CS2/srpcfg-2.html)中均发布了便携版，无须任何依赖，一键启用。

WPF 图形界面安装器，运行后直接拖入下载好的 `zip` 包或 CFG/TXT 文件即可安装本预设。

### ✏️ 功能说明 (Features)
- 自动检测 Steam 路径、游戏全局 CFG 路径和地图指南路径
- 自动检测 Steam 用户并支持手动选择
- 自动备份全局 CFG 文件夹为 `cfg_backup.zip`
- 自动备份用户视频预设文件为 `user_cfg_backup.zip`
- 自动备份地图指南文件为 `annotations_backup.zip`
- 支持安装全局 CFG 文件（可单独选择）
- 支持安装用户视频预设文件（仅识别 `cs2_video.txt`，可单独选择）
- 支持安装地图指南预设文件（复制 annotations 子目录到 `csgo/annotations/local/`，可单独选择）
- 目标目录不存在时自动创建（需游戏至少运行过一次）
- 拖入 `zip`、`cfg` 单文件或文件夹自动检测并安装
- 实时日志输出，清晰的安装进度反馈
- 一键打开备份文件位置，直接定位到备份文件

## 🌳项目结构

```
SrP-CFG_ForCS2/
├── default/                  # 默认配置（官方完整版）
│   ├── autoexec.cfg          # 自启动基础设置
│   ├── custom.cfg            # 用户定制化覆盖占位（默认为空）
│   ├── crosshair_view.cfg    # 准星与持枪视角
│   ├── practice.cfg          # 个人自建房跑图
│   ├── demo_hlae.cfg         # HLAE 观看 demo
│   ├── knife.cfg             # 匕首模型切换
│   ├── zeus.cfg              # 电击枪快速切换
│   ├── autoview.cfg          # 武器自适应视角切换
│   ├── previewmode.cfg       # 饰品预览检视工具模式
│   ├── guidemake.cfg         # 地图指南制作模式
│   ├── cs2_video.txt         # 视频设置
│   ├── annotations/          # 各大地图指南预设
│   ├── crosshair_library/    # 准星库
│   └── spawn/                # 出生点配置
├── custom/                   # 定制版覆盖配置（替换 default/custom.cfg）
│   ├── echo/custom.cfg       # Echo 定制版覆盖
│   ├── yszh/custom.cfg       # yszh 定制版覆盖
│   └── visionl/custom.cfg    # VisionL 定制版覆盖
├── wpf/                      # WPF 安装器（.NET 8）
│   ├── MainWindow.xaml(.cs)  # 主界面 UI 逻辑
│   ├── InstallerService.cs   # 安装核心业务逻辑
│   ├── UpdateService.cs      # 自动更新服务
│   └── Resources/            # 应用图标等资源
├── msi/                      # WiX v6 MSI 安装包项目
│   ├── Package.wxs           # MSI 包定义
│   └── Setup.wixproj         # WiX 项目文件
├── .github/                  # CI/CD 与发布配置
│   ├── workflows/            # GitHub Actions 工作流
│   ├── scripts/              # 构建/发布辅助脚本
│   ├── packages.yaml         # 打包配置
│   ├── oss-upload.yaml       # OSS 上传配置
│   └── release/template.md   # Release Notes 模板
└── README.md
```

### 📦 运行环境（Runtime Requirements）

本安装器基于 `.NET 8` 和 WPF 构建。

用户运行 `Installer` 需要满足以下条件：

✔ 若使用"独立运行"（Self-Contained）发布

无需安装任何运行库，直接运行发布的 `SrP-CFG_Installer.exe` 即可。

✔ 若使用"框架依赖"（Framework-Dependent）方式发布

用户需要安装：

`.NET 8 Desktop Runtime`（Windows x64）
[点击跳转下载](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)

开发者需要安装：

`.NET 8 SDK`（推荐）
用于编译/发布项目
[点击跳转下载](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)

### 💻 构建（Build）
```bash
# 构建安装器
dotnet build wpf
# 构建 MSI 安装包
dotnet build msi -c Release
```

### 🚀 发布（Publish）
```bash
dotnet publish -c Release
```

> 项目已配置默认发布参数（Self-Contained + SingleFile + win-x64），直接运行 `dotnet publish` 即可生成独立运行的安装器。

### 📀 MSI 安装包

基于 [WiX Toolset v6](https://wixtoolset.org/) 构建 MSI 安装包，通过 Windows 原生安装机制提升系统信任度。

```bash
dotnet build msi -c Release
```

输出：`msi/bin/Release/SrP-CFG_Installer_Setup.msi`

特性：
- 标准安装向导（欢迎 → 许可协议 → 安装路径 → 进度 → 完成）
- 安装到 `Program Files`，创建开始菜单和桌面快捷方式
- 支持"程序与功能"卸载

## 仓库活动

![仓库活动](https://repobeats.axiom.co/api/embed/55700fe0f86a32b2418b023fa87c8ec214153ef0.svg "Repobeats analytics image")
