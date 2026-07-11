---
title: practice 模式
description: 自建房跑图配置，含出生点传送、Bot 控制、道具练习等工具
---

> 设置文件：`srp-cfg/modes/practice/settings.cfg`

## 简介

practice 模式提供完整的跑图练习环境，包括作弊模式开启、出生点传送、Bot 控制、道具轨迹预测、竞技模拟等功能。需要在自建房（开启作弊）中使用。

出生点预设参考于 [Bad0RANG3](https://github.com/Bad0RANG3/CS2PraticeCFG)。

## 激活方式

推荐在控制台输入 `srp_practice`。该入口只加载练习设置，不改写 F 键、方向键、鼠标侧键等实体绑定。

需要整套练习快捷键时输入 `srp_practice_keys`。它先加载设置，再执行 `keymap.cfg`。Default 案例把 `P` 绑定到这个 Runtime 命令。

## 两层结构

| 文件 | 内容 | VCFG 影响 |
| :--- | :--- | :--- |
| `srp-cfg/modes/practice/runtime.cfg` | `spawn`、`gkd`、`gg` 等持久 alias | 只注册命令，不改变状态 |
| `srp-cfg/modes/practice/settings.cfg` | 服务器、Bot、轨迹等设置 | 主要是当前会话/服务器状态 |
| `srp-cfg/modes/practice/keymap.cfg` | F1-F12、方向键、N、K、L、鼠标侧键等绑定 | 会写入 user keys VCFG |
| `srp-cfg/modes/practice/with-keymap.cfg` | 按顺序组合 settings 与 keymap | 会应用上述两类结果 |
| `srp-cfg/modes/practice/help.cfg` | 控制台黑话与入口说明 | 仅输出帮助 |

## 可选按键表

下表只有在执行 `srp_practice_keys` 后才生效；`srp_practice` 不会占用这些键。

| 功能 | 快捷键 | 控制台别名 |
| :--- | :--- | :--- |
| 切换队友头顶显示 | `ralt` | - |
| 弹着点与道具轨迹预测 | `↑` | - |
| 杀死 Bot | `↓` | - |
| 重新开始 | `→` | - |
| 补全护甲 | `F1` | - |
| 自动回血 | `F2` | - |
| 切换人称视角 | `F3` | - |
| 添加 Bot | `F4` | - |
| 使 Bot 蹲下 | `F5` | - |
| 使 Bot 模仿操作 | `F6` | - |
| 视角放大镜 | `F7` | - |
| 删除 Bot | `F8` | - |
| 友伤状态 | `F9` | - |
| Bhop 连跳 | `F12` | - |
| 重现最近一次道具 | `L` | - |
| 加速时间流逝 | `0` | - |
| 放置 Bot | `MOUSE5` | - |
| 飞行模式 | `N` | - |
| 显示速度信息 | `K` | - |
| 实体显示 | `.` | - |
| 弹夹容量状态（无限弹药切换） | `/` | - |
| 清除地图指南标识 | `rshift` | - |
| 标准实战模拟 | - | `gkd` |
| 恢复跑图模式 | - | `gg` |
| 加载出生点预设 | - | `spawn` |
| 任意处安包 | - | `plant` |
| 投掷物轨迹/X光开关 | - | `xray` |

## 竞技模拟

使用 `gkd` 命令可以快速切换到类竞技环境（关闭作弊、关闭无限弹药、关闭自动复活、冻结时间 4 秒、重新开始），用于测试道具在实战条件下的效果。

使用 `gg` 命令可恢复跑图模式（开启作弊、自动复活、无限弹药、全队语音、任意地点购买）。

## 出生点预设系统

### 使用方法

1. 在跑图模式下（推荐输入 `srp_practice`），控制台输入 `spawn`
2. 输入地图别名（如 `inferno`、`dust2`）加载对应地图的出生点
3. 输入出生位别名（如 `CT1`、`T3`）传送到指定出生点

### 支持地图

| 地图 | 控制台别名 |
| :--- | :--- |
| 炼狱小镇 | `inferno` |
| 沙漠 2 | `dust2` |
| 荒漠迷城 | `mirage` |
| 远古遗迹 | `ancient` |
| 核子危机 | `nuke` |
| 殒命大厦 | `vertigo` |
| 阿努比斯 | `anubis` |
| 办公室 | `office` |
| 意大利 | `italy` |
| 列车停放站 | `train` |
| 死亡游乐园 | `overpass` |

### 出生位说明

每张地图有 CT（警察）和 T（匪徒）两组出生点，分别用 CT1~CT15 和 T1~T15 命名。不同地图的出生点数量不同，输入不存在的编号会提示错误。

### 预设文件

| 文件 | 说明 |
| :--- | :--- |
| `srp-cfg/modes/practice/spawn/spawn.cfg` | 路由文件，定义地图别名 |
| `srp-cfg/modes/practice/spawn/init_spawns.cfg` | 初始化文件，重置所有出生位 |
| `srp-cfg/modes/practice/spawn/*.cfg` | 11 张地图的出生点坐标 |

## 相关文件

- [autoexec.cfg](/docs/autoexec) — v3 Runtime、内置 Preset 与用户层入口
- [guidemake 模式](/docs/guidemake) — 地图指南制作（配合跑图使用）

## 注意事项

- `srp_practice` 不会加载实体按键；`srp_practice_keys` 的按键会被 CS2 保存到 VCFG，离开地图不会自动恢复
- 练习按键表与正常对局键位冲突时，后执行的绑定优先
- 出生点传送仅在已配置的 11 张地图上有效
- `gkd` 命令会关闭作弊模式，恢复竞技条件
