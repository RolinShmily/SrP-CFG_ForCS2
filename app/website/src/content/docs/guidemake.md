---
title: guidemake 模式
description: 地图指南制作工具，在练习模式下创建投掷物标识
---

> 设置文件：`srp-cfg/modes/guidemake/settings.cfg`

## 简介

guidemake 模式用于在 CS2 练习环境中创建投掷物标识地图指南。创建的标识可在游戏内查看，也可上传至创意工坊分享给其他玩家。

## 激活方式

推荐输入 `srp_guidemake`，只加载制作设置。需要整套快捷键时输入 `srp_guidemake_keys`，它会额外绑定 `Z/X/C/V/6/Del/Enter`。需要在练习模式下使用。

## 可选按键表

下表按键只在执行 `srp_guidemake_keys` 后自动绑定；使用 `srp_guidemake` 时不会覆盖投掷物键。

| 功能 | 快捷键 | 说明 |
| :--- | :--- | :--- |
| 创建手雷标识 | `Z` | 创建 HE 手雷投掷物标识 |
| 创建闪光弹标识 | `X` | 创建 Flash 闪光弹投掷物标识 |
| 创建烟雾弹标识 | `C` | 创建 Smoke 烟雾弹投掷物标识 |
| 创建燃烧弹标识 | `V` | 创建 Molotov/Incendiary 燃烧弹投掷物标识 |
| 创建诱饵弹标识 | `6` | 创建 Decoy 诱饵弹投掷物标识 |
| 删除上一个标识 | `Del` | 删除最近创建的标识 |
| 保存地图指南 | `Enter` | 保存为 "mapguide" |
| 上传至创意工坊 | `srp_guide_upload` | 控制台输入，原始指令: `workshop_annotation_submit` |

## 使用流程

1. 进入 CS2 练习模式
2. 加载设置：`srp_guidemake`；若需要快捷键表，改用 `srp_guidemake_keys`
3. 投掷出投掷物后保持视角不动
4. 按下对应快捷键创建投掷物标识
5. 按下 `Enter` 保存地图指南

## 控制台指令

| 指令 | 说明 |
| :--- | :--- |
| `sv_allow_annotations_access_level 2` | 允许查看和编辑地图指南 |
| `annotation_create grenade [type] "label"` | 创建投掷物描点（type: smoke/flash/he/molotov/incendiary/decoy） |
| `annotation_delete_previous_node_set` | 删除上一个标识 |
| `annotation_clear` | 清除全部标识 |
| `annotation_save "filename"` | 保存地图指南 |

## 文件保存位置

保存路径：`...\SteamLibrary\steamapps\common\Counter-Strike Global Offensive\game\csgo\annotations\local\mapguide`

## 相关文件

- [practice 模式](/docs/practice) — 跑图配置（配合使用）
- `annotations/` — 已制作的地图指南数据（Dust2、Inferno、Mirage、Ancient）

## 注意事项

> **提示：** 按下快捷键后，标识会以 "label" 命名。保存后打开对应的 TXT 文件，对每一组标识进行文本编辑。建议在地图上创建一个标识后就进行保存，并重新启动进入游戏，方便后续查找和修改。

> **注意：** 制作好后请务必将该指南的文件夹名、文件名进行修改，以避免与其他指南冲突。首次使用建议只创建一个标识后保存，并重新启动进入游戏确认效果。

> **VCFG：** `_keys` 入口的投掷物键与保存键会被 CS2 持久化。退出制作模式不会自动还原，恢复时应执行自己的 Preset/User、`srp_reset_valve_keys`，或在游戏内重新绑定。
