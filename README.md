<h1 align="center">SrP-CFG</h1>
<h4 align="center">适用于CS2各场景的CFG预设文件</h4>

<div align="center">

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
|                           视频设置                            |   `cs2_video.txt`    |

你会需要的链接：

- [项目说明书](https://doc.srprolin.top/posts/SrP-CFG_CS2/srpcfg-1.html) | 本项目的一些废话
- [下载地址](https://doc.srprolin.top/posts/SrP-CFG_CS2/srpcfg-2.html) | 顾名思义
- [使用指南](https://doc.srprolin.top/posts/SrP-CFG_CS2/srpcfg-3.html) | 按键、控制台命令功能表
- [更新日志](https://doc.srprolin.top/posts/SrP-CFG_CS2/srpcfg-4.html) | 查看最新更新

## Installer 安装器

在[Release](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases)和[项目下载地址](https://doc.srprolin.top/posts/SrP-CFG_CS2/srpcfg-2.html)中均发布了便携版，无须任何依赖，一键启用。

WPF 图形界面安装器，运行后直接拖入下载好的 `zip` 包或 CFG/TXT 文件即可安装本预设。

### ✏️ 功能说明 (Features)
- 自动检测 Steam 路径和游戏全局 CFG 路径
- 自动检测 Steam 用户并支持手动选择
- 自动备份全局 CFG 文件夹为 `cfg_backup.zip`
- 自动备份用户视频预设文件为 `user_cfg_backup.zip`
- 支持安装全局 CFG 文件和用户视频预设文件（可单独选择）
- 拖入 `zip`、`cfg` 单文件、`txt` 单文件或文件夹自动检测并安装
- 实时日志输出，清晰的安装进度反馈
- 一键打开备份文件位置，直接定位到备份文件
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
dotnet build
```

### 🚀 发布（Publish）
```bash
dotnet publish -c Release
```

> 项目已配置默认发布参数（Self-Contained + SingleFile + win-x64），直接运行 `dotnet publish` 即可生成独立运行的安装器。

## 仓库活动

![仓库活动](https://repobeats.axiom.co/api/embed/55700fe0f86a32b2418b023fa87c8ec214153ef0.svg "Repobeats analytics image")
