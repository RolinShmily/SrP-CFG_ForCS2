---
title: 使用指南
description: SrP-CFG 安装器使用说明与基础操作指南
---

> 使用 SrP-CFG Installer 安装和管理 CFG 预设

## 安装方式

### 方式一：SrP-CFG Installer（推荐）

默认勾选 **安装 CFG 文件（全局配置）**，并显示安装路径和备份路径。

默认没有勾选 **安装 视频预设文件（用户配置）** 和 **安装 地图指南预设文件**，但均显示目标路径和备份路径。

你只需要将获得的 `ZIP`、`CFG` 类型文件，拖入 **文件选择框**，点击 **开始安装**，即可体验该套 CFG 的所有功能。

### 方式二：手动安装

将 `default/` 目录中的所有文件复制到 CS2 的 cfg 目录：

```
SteamLibrary\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg\
```

### 方式三：MSI 安装包

项目提供 MSI 安装包，可从 [下载页面](/download) 获取。安装后文件会自动部署到正确位置。

## 视频预设文件安装

由于这一步需要确定好 **Steam 用户**，涉及到安装目录的选择，你需要根据指示找到你的 **Steam 好友代码**：

1. 勾选 **安装 视频预设文件（用户配置）**
2. 在 **Steam 用户** 中选择你的好友代码
3. 点击 **开始安装**

手动安装路径：`Steam/userdata/{好友代码}/730/local/cfg/cs2_video.txt`

详见 [cs2_video.txt 文档](/docs/cs2_video)。

## 备份还原说明

无论你是否手动进行备份，安装器均会在 **开始安装** 时同步进行备份操作。如果需要恢复原设置：

1. 删除 **目标路径** 中的所有文件
2. 将 **备份位置** 中的 `ZIP` 文件全部解压至 **目标路径**

## CFG 加载顺序

CS2 启动时自动加载 `autoexec.cfg`，它会依次执行：

1. `crosshair_view.cfg` — 准星与持枪视角预设
2. `custom.cfg` — 用户定制化配置

其他 CFG 文件通过快捷键按需加载。详见 [autoexec.cfg 文档](/docs/autoexec)。

## 常见问题

**Q: 安装后没有效果？**
A: 确认文件在正确的 cfg 路径下，确认控制台已启用（游戏设置 → 游戏 → 启用开发者控制台）。

**Q: 如何恢复默认设置？**
A: 删除安装的 cfg 文件，从备份 ZIP 中解压原始文件。

**Q: 4 号键不是默认的投掷物轮切？**
A: 该套 CFG 中 4 号键绑定为电击枪。如需恢复，请在控制台输入 `bind "4" "slot4"`，并删除 zeus.cfg 或注释掉 `exec zeus.cfg` 行。

**Q: 滚轮不能切换装备了？**
A: 默认滚轮绑定为跳跃。恢复方法：`bind "mwheeldown" "invnext"` 和 `bind "mwheelup" "invprev"`。
