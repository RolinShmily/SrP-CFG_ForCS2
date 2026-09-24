---
title: autoview 功能
description: 武器自适应视角切换，主武器使用独立视角预设
---

> 模块目录：`srp-cfg/features/autoview/`

## 简介

autoview 模块会在武器切换时自动切换持枪视角。主武器使用独立的自定义视角预设（默认 v06），切换至副武器、匕首、电击枪、投掷物等其他装备时自动切换为默认 M7 视角（v00）。

此功能适合希望主武器有更开阔的视野、同时其他装备保持标准视角的玩家。

## 激活方式

输入 `srp_autoview` 只重置 `view_0/view_1` 功能映射，不修改实体键。输入 `srp_autoview_keys` 才会安装武器槽位键表；Default 案例中的 `[` 键调用后者。

因此用户可以先查看 `keymap.cfg`，再决定是否让模块接管武器键。

## 工作原理

加载后，按键 1-6 和 z/x/c/v 会被重绑，在切换武器的同时自动调用视角切换 alias：

- 主武器（按键 1）调用 `view_0`，默认为 v06
- 其他装备（按键 2-6, z, x, c, v）调用 `view_1`，默认为 v00

## 受影响的按键

| 按键 | 武器槽位 | 视角预设 |
| :--- | :--- | :--- |
| 1 | 主武器 | view_0 (v06) |
| 2 | 副武器 | view_1 (v00) |
| 3 | 匕首 | view_1 (v00) |
| 4 | 电击枪 | view_1 (v00) |
| 5 | C4 | view_1 (v00) |
| 6 | 诱饵弹 | view_1 (v00) |
| z | 高爆手雷 | view_1 (v00) |
| x | 闪光弹 | view_1 (v00) |
| c | 烟雾弹 | view_1 (v00) |
| v | 燃烧弹 | view_1 (v00) |

## 自定义

如需更改主武器视角预设，查看 `srp-cfg/features/autoview/runtime.cfg` 中的 `view_0` alias，将 `v06` 替换为 v00-v07 中的任意预设。同理可修改 `view_1`。

## 相关文件

- [crosshair-view 功能](/docs/crosshair_view) — 视角预设定义（v00-v07）
- [autoexec.cfg](/docs/autoexec) — v3 Runtime、内置 Preset 与用户层入口

## 注意事项

- Runtime 会自动注册 crosshair-view 的 v00-v07，无需先应用准星/视角设置
- 无法实现 Q 键切换装备时的视角更换（CS2 引擎限制）
- 加载后按键 1-6/Z/X/C/V 的绑定会被写入 user keys VCFG
- `srp_reload` 不会猜测原按键；可用 `srp_reset_valve_keys`、自己的 Preset/User，或游戏设置恢复
