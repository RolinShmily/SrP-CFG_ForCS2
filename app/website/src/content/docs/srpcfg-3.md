---
title: 使用指南
description: 从安装 Runtime Core 到选择 Preset、维护个人配置与 Valve 重置
---

## 第一步：安装唯一配置包

下载：

```text
SrP-CFG_Runtime_Core.zip
```

它已经包含完整 Runtime、Default / Echo / YSZH / VisionL、Valve 基线与用户配置入口，不需要再选择用户专属包或 Presets 包。

1. 启动 SrP-CFG Installer。
2. 在“下载”页面获取 Runtime Core。
3. 确认 Steam、CS2 与当前 Steam 账号检测正确。
4. CFG 目标使用推荐的 `game/csgo/cfg/`。
5. 首次安装通常使用“覆盖安装”。
6. 打开“我的配置”，决定下面两种模式中的一种。

## 模式 A：只使用 Runtime 功能

在 `user/custom.cfg` 中保持所有 `srp_apply_*` 都被注释：

```text
// srp_apply_default
// srp_apply_echo
// srp_apply_yszh
// srp_apply_visionl
```

启动时 Runtime 只注册功能和 alias，不主动重放普通偏好与实体键位。你可以继续在 CS2 菜单中修改灵敏度、准星、HUD 和按键，由游戏决定如何写入 VCFG / Steam Cloud。

## 模式 B：Preset 起点 + 个人配置

只启用一个起点，并把所有个人差异写在它下面：

```text
srp_apply_yszh

// 我的最终语音键
unbind "v"
bind "mouse5" "+voicerecord"

// 我的灵敏度与准星
sensitivity 0.95
c06
cyan
```

每次启动都会依次执行“Runtime → YSZH → 个人差异”。后面的同名命令会覆盖 Preset，所以不需要复制或修改仓库内的 YSZH 文件。

## 以 YSZH 用户为例

假设你希望取得 YSZH 的灵敏度、画面、准星和偏好设置，同时保留自己的部分按键：

1. 在安装器“我的配置”页面点击 `srp_apply_yszh`。
2. 在编辑器中检查该命令只有一行处于启用状态。
3. 把自己的按键、灵敏度或其他差异写在它下面。
4. 保存；若 CS2 已运行，在控制台执行 `srp_reload`。
5. 以后需要持久保留的改动继续写在同一文件中。

如果只在游戏里修改了一个被 YSZH 定义的字段，当前会话会变化，但下一次启动或 `srp_reload` 会再次应用 YSZH。此时把最终值写进 `custom.cfg`，或者注释掉 Preset 命令、改由 VCFG 管理即可。

## Default 与其他案例

可选起点为：

```text
srp_apply_default
srp_apply_echo
srp_apply_yszh
srp_apply_visionl
```

点击安装器按钮只会修改尚未保存的编辑器草稿；保存后才写入磁盘。四个命令都不会再次调用 `custom.cfg`，因此可以安全地位于该文件顶部。

若在游戏控制台手动执行 `srp_apply_yszh`，只会立即应用 YSZH，不会自动补上个人覆盖。要按完整配置重新执行，请使用：

```text
srp_reload
```

## 回到 Valve 原始测试基线

控制台执行：

```text
srp_reset_valve
```

它会恢复 SrP-CFG 管理范围内的 Valve 默认偏好，并调用游戏自带 `binddefaults`。它故意不执行 User，方便在纯基线上测试。

常用变体：

```text
srp_reset_valve_settings
srp_reset_valve_keys
srp_reset_valve_user
```

重置改变的是当前游戏状态，不会删除 `custom.cfg`，也不会由安装器直接覆盖 VCFG。完成测试后执行 `srp_reload`，返回自己的 Runtime → User 链。

## 功能与按键为什么分成两个命令

例如：

```text
srp_preview       // 只应用预览设置
srp_preview_keys  // 设置 + 预览工作区键位
```

practice、guidemake、demo、crosshair-view、autoview、zeus 都采用同一规则。这样可以先检查 `keymap.cfg`，再决定是否交出实体键位。

## 查看模块术语

```text
srp_help
srp_help_presets
srp_help_practice
srp_help_guidemake
srp_help_preview
srp_help_demo
srp_help_crosshair
srp_help_reset
```

## 需求应该放在哪里

| 需求 | 推荐位置 |
| :--- | :--- |
| 只使用功能，普通设置随游戏保存 | 不启用 `srp_apply_*`，交给 VCFG |
| 每次启动使用作者推荐值 | `custom.cfg` 顶部写 `srp_apply_default` |
| 每次启动使用 YSZH 等案例 | `custom.cfg` 顶部写相应 `srp_apply_*` |
| 在案例之上保留个人差异 | 写在同一 `custom.cfg` 的 Preset 命令之后 |
| 排查问题、回到可审计基线 | `srp_reset_valve` |
| 分辨率、显卡和设备画质 | 游戏设置或 `cs2_video.txt` |

## 继续阅读

- [autoexec.cfg](/docs/autoexec)
- [VCFG 与 Steam Cloud](/docs/vcfg)
- [practice 模式](/docs/practice)
- [Demo / HLAE](/docs/demo_hlae)
