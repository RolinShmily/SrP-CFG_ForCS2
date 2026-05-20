---
title: demo_hlae.cfg
description: HLAE Demo 观看预设，含镜头运镜、动态模糊录制、速度控制
---

> 使用 HLAE 观看 demo 的配置文件

## 简介

demo_hlae.cfg 为 HLAE（Half-Life Advanced Effects）demo 回放提供完整的按键预设和录制工具。参考自 [Purp1e](https://github.com/Purple-CSGO/CSGO-Config-Presets)，整合了动态模糊录制功能。

## 前置条件

- 安装 [HLAE](https://github.com/advancedfx/advancedfx) — CS2 demo 回放增强工具
- 配置 [FFmpeg](https://ffmpeg.org/) — 用于动态模糊录制（可选）

## 激活方式

在 autoexec.cfg 中按 `]` 键启用。需要先在 demo 播放界面中加载。

## 功能表

### Demo 控制

| 功能 | 快捷键 | 控制台别名 |
| :--- | :--- | :--- |
| demoUI 开关 | `Q` / `Shift+F2` | `demoui` |
| demo 暂停 | `P` / `鼠标中键` | - |
| 快退 5 秒 | `,` | - |
| 快进 5 秒 | `.` | - |
| 增加播放速度 | `MOUSE5` 前侧键 | - |
| 减少播放速度 | `MOUSE4` 后侧键 | - |
| 标记当前 tick | `U` | - |
| 跳转标记 tick | `I` | - |

### 镜头运镜

| 功能 | 快捷键 | 控制台别名 |
| :--- | :--- | :--- |
| 镜头摆放模式（ESC 退出） | `R` | - |
| 添加镜头 | `Capslock` | - |
| 清空镜头 | `Delete` | - |
| 镜头激活 | `T` | - |
| 镜头轨迹显示 | `Y` | - |
| 运镜回退 0.25s | `[` | - |
| 运镜快进 0.25s | `]` | - |
| 运镜 FOV 修改 | - | `f10`~`f100` |
| 运镜开始为当前视角 | - | `pos` |
| 运镜开始为当前 tick | - | `time` |
| 解绑运镜模式按键 | - | `t` |

### 显示控制

| 功能 | 快捷键 | 控制台别名 |
| :--- | :--- | :--- |
| 只保留准星和击杀 | `H` | - |
| 只显示当前玩家击杀 | `J` | - |
| 准星开关 | `V` | - |
| HUD 开关 | `B` | - |
| X 光透视 | `X` | - |
| 雷达开关 | `N` | - |
| 静音 | `M` | - |
| 开关 CSGO 语音 | `K` | - |
| 开关 CS2 语音 | `'` | - |
| 查看玩家信息和语音屏蔽 | `L` | - |
| 队友头顶标识 | `ralt` | - |
| 广角 POV | `=` | - |
| 显示对局头像 | - | `avatars` |
| 显示对局人数 | - | `numbers` |
| 显示 demo 下方小字 | - | `show` |
| 屏蔽 demo 下方小字 | - | `noshow` |

### 录制功能

| 功能 | 快捷键 | 控制台别名 |
| :--- | :--- | :--- |
| 开启 HLAE 录制 | `↑` | - |
| 关闭 HLAE 录制 | `↓` | - |
| 设置录制开始 tick | `F5` | - |
| 设置录制结束 tick | `F6` | - |
| 打印 mirv_cmd 信息 | `F7` | - |
| 清除 mirv_cmd 指令 | `F8` | - |
| 开启动态模糊录制 | - | `bluron` |
| 关闭动态模糊录制 | - | `bluroff` |

### 其他

| 功能 | 快捷键 | 控制台别名 |
| :--- | :--- | :--- |
| 切换击杀信息显示 | `\` | `ass` |
| 关闭 BGM、MVP、无线电 | - | `mute` |
| 回合开始无灰色 | - | `post` |
| 开启投掷物落点预测 | - | `grenadeon` |
| 关闭投掷物落点预测 | - | `grenadeoff` |

## 使用流程

1. 启动 CS2，播放 demo
2. 按 `]` 键加载 demo_hlae.cfg
3. 使用快捷键控制回放、运镜和录制

## 动态模糊录制

使用 `bluron` 和 `blurroff` 控制动态模糊录制模式：

- **bluron**：开启动态模糊，使用矩形方法，强度 1，曝光 0.7，输出 60fps
- **bluroff**：关闭动态模糊，恢复正常录制

录制使用 FFmpeg 以 1080fps 采样，配合 HLAE 的 `mirv_streams record` 功能。

## 相关文件

- [autoexec.cfg](/docs/autoexec) — 主配置，按 `]` 键加载本文件

## 注意事项

- HLAE 录制功能需要 HLAE 正确安装并注入 CS2
- 动态模糊录制需要 FFmpeg 配置正确
- 镜头摆放模式需按 ESC 退出
- 播放速度循环：0.1x → 0.2x → 0.25x → 1x → 4x → 8x
