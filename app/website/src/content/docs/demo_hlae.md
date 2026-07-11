---
title: demo-hlae 模式
description: HLAE Demo 观看预设，含镜头运镜、动态模糊录制、速度控制
---

> 模块目录：`srp-cfg/modes/demo-hlae/`

## 简介

demo-hlae 模式为 HLAE（Half-Life Advanced Effects）demo 回放提供完整的按键预设和录制工具。参考自 [Purp1e](https://github.com/Purple-CSGO/CSGO-Config-Presets)，整合了动态模糊录制功能。

## 前置条件

- 安装 [HLAE](https://github.com/advancedfx/advancedfx) — CS2 demo 回放增强工具
- 配置 [FFmpeg](https://ffmpeg.org/) — 用于动态模糊录制（可选）

## 激活方式

输入 `srp_demo` 只应用 HLAE/录制设置。输入 `srp_demo_keys` 才会先执行 Valve `binddefaults`，再安装完整创作键表；Default 案例中的 `]` 键调用带按键入口。

HLAE 模式会重绑大量普通键、鼠标键和小键盘键，属于明确的侵入式会话模式。

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
| 队友头顶标识 | `ralt` | - |
| 广角 POV | `=` | - |
| 显示对局头像 | - | `avatars` |
| 显示对局人数 | - | `numbers` |
| 显示 demo 下方小字 | - | `demoshow` |
| 屏蔽 demo 下方小字 | - | `demonoshow` |

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
| 屏蔽/恢复击杀信息 | `\` | `block` |
| 切换助攻显示 | - | `ass` |
| 关闭 BGM、MVP、无线电 | - | `mute` |
| 回合开始无灰色 | - | `post` |
| 开启投掷物落点预测 | - | `grenadeon` |
| 关闭投掷物落点预测 | - | `grenadeoff` |

## 使用流程

1. 启动 CS2，播放 demo
2. 输入 `srp_demo_keys`；只想应用录制设置时使用 `srp_demo`
3. 使用快捷键控制回放、运镜和录制

## 动态模糊录制

使用 `bluron` 和 `bluroff` 控制动态模糊录制模式：

- **bluron**：开启动态模糊，使用矩形方法，强度 1，曝光 0.7，输出 60fps
- **bluroff**：关闭动态模糊，恢复正常录制

当前案例使用 FFmpeg 以 600fps 源采样，配合 HLAE 的 `mirv_streams record` 功能。

## 相关文件

- [autoexec.cfg](/docs/autoexec) — v3 Runtime、内置 Preset 与用户层入口

## 注意事项

- HLAE 录制功能需要 HLAE 正确安装并注入 CS2
- 动态模糊录制需要 FFmpeg 配置正确
- 镜头摆放模式需按 ESC 退出
- 播放速度循环：0.1x → 0.2x → 0.25x → 1x → 4x → 8x
- 这些实体绑定会进入 user keys VCFG；录制结束后应显式恢复正常对局键位
- v3 已修正旧文件中“先绑定部分 HLAE 键、随后 binddefaults 将其清除”的顺序问题
