---
title: 项目说明
description: SrP-CFG For CS2 -- 适用于 CS2 各场景的 CFG 预设文件
---

# SrP-CFG For CS2

> 适用于 CS2 各场景的 CFG 预设文件，由 RoL1n 开发维护

## 简介

SrP-CFG 是一套为 CS2（Counter-Strike 2）玩家打造的全套预设 CFG 配置文件。本项目提供多种实用功能，包括准星视角预设、跑图练习、Demo 录制回放、匕首切换、饰品截图等，旨在覆盖 CS2 的各类使用场景。

## 快速开始

1. [下载](/download) 最新版本的安装包或 ZIP 预设包
2. 使用 [SrP-CFG Installer](/docs/srpcfg-3) 安装，或手动将文件复制到 CS2 cfg 目录
3. 启动 CS2，按 `~` 打开控制台，确认 `autoexec Enabled!` 字样

详细安装步骤请参阅 [使用指南](/docs/srpcfg-3)。

## 包含文件

| 功能 | 文件 | 文档 |
| :--- | :--- | :--- |
| 自启动基础设置 | `autoexec.cfg` | [查看](/docs/autoexec) |
| 准星与持枪视角 | `crosshair_view.cfg` | [查看](/docs/crosshair_view) |
| 个人自建房跑图 | `practice.cfg` | [查看](/docs/practice) |
| HLAE Demo 观看 | `demo_hlae.cfg` | [查看](/docs/demo_hlae) |
| 匕首模型切换 | `knife.cfg` | [查看](/docs/knife) |
| 电击枪快速切换 | `zeus.cfg` | [查看](/docs/zeus) |
| 武器自适应视角 | `autoview.cfg` | [查看](/docs/autoview) |
| 饰品预览检视 | `previewmode.cfg` | [查看](/docs/previewmode) |
| 地图指南制作 | `guidemake.cfg` | [查看](/docs/guidemake) |
| 视频设置 | `cs2_video.txt` | [查看](/docs/cs2_video) |

## 文件加载关系

```
autoexec.cfg （CS2 启动时自动加载）
├── exec crosshair_view  （准星与视角预设）
│   └── crosshair_library/*.cfg  （准星代码库）
├── exec custom  （用户定制化配置）
│
├── [P 键] exec practice  （跑图练习）
│   └── spawn/*.cfg  （出生点预设）
├── [J 键] exec knife  （匕首模型）
├── [] 键] exec demo_hlae  （HLAE Demo）
├── [[ 键] exec autoview  （自适应视角）
├── [9 键] exec previewmode  （饰品预览）
├── [zeus] exec zeus  （电击枪切换）
└── [gm] exec guidemake  （地图指南）
```

## 功能速览

- **准星系统**：8 组准星预设 + 8 组视角预设，一键轮换，12 色切换
- **跑图练习**：出生点传送（11 张地图）、Bot 控制、道具轨迹预测、竞技模拟
- **Demo 录制**：HLAE 镜头运镜、动态模糊录制、速度控制
- **快捷购买**：F3~F11 一键购买常用装备
- **聊天轮盘**：3 页 24 个战术语音快捷指令

## 开源信息

- **仓库地址**: [RolinShmily/SrP-CFG_ForCS2](https://github.com/RolinShmily/SrP-CFG_ForCS2)
- **许可证**: [GPL-3.0](https://github.com/RolinShmily/SrP-CFG_ForCS2/blob/main/LICENSE)
- **版本发布**: [GitHub Releases](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases)

## 贡献与定制

### 加入我们

该项目保持长期更新维护，如果您有特色功能想贡献至此项目，欢迎提交 PR 或联系作者。

### 用户定制

如果你想使用专属定制版本（带有你的名字），可以在仓库中提交 Issue，联系作者获取定制化配置。

### 投递须知

请先查看 [使用指南](/docs/srpcfg-3) 了解默认键位和指令功能。我们默认您只需要 `autoexec.cfg` 中的个性化配置。

**请按以下模板提交需求：**

```
用户名：（建议英文）
功能说明：（例如：将烟雾弹单独绑定为C键）
键位绑定：（例如：C、左Alt）
控制台指令：（例如：pd）
```

## 联系方式

- 个人博客: [blog.srprolin.top](https://blog.srprolin.top/about/)
- B站主页: [RoL1n_SrP](https://space.bilibili.com/422744280)
- GitHub: [RolinShmily](https://github.com/RolinShmily)
