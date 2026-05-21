---
title: 使用指南
description: SrP-CFG 安装器使用说明与基础操作指南
---

> 使用 SrP-CFG Installer 安装和管理 CFG 预设

## 安装方式

### 方式一：SrP-CFG Installer（推荐）

可以由官网下载/软件内置下载预设包，你只需要将获得的 `ZIP`、`CFG` 类型文件，拖入 **文件选择框**，点击 **开始安装**，即可体验该套 CFG 的所有功能。

### 方式二：手动安装

将 预设包目录中的`cfg`文件复制到 CS2 的 cfg 目录：

```
SteamLibrary\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg\
```

## CFG 加载顺序

CS2 启动时自动加载 `autoexec.cfg`，它会依次执行：

1. `crosshair_view.cfg` — 准星与持枪视角预设
2. `custom.cfg` — 用户定制化配置

其他 CFG 文件通过快捷键按需加载。详见 [autoexec.cfg 文档](/docs/autoexec)。

## 常见问题

**Q: 安装后没有效果？**
A: 确认文件在正确的 cfg 路径下，确认控制台已启用（游戏设置 → 游戏 → 启用开发者控制台），然后在控制台输入`exec autoexec`手动加载配置。

**Q: 4 号键不是默认的投掷物轮切？**
A: 该套 CFG 中 4 号键绑定为电击枪。如需恢复，请在控制台输入 `bind "4" "slot4"`，并删除 zeus.cfg 或注释掉 `exec zeus.cfg` 行(默认预设包已经禁用)。

**Q: 滚轮不能切换装备了？**
A: 默认滚轮绑定为跳跃。恢复方法：`bind "mwheeldown" "invnext"` 和 `bind "mwheelup" "invprev"`。
