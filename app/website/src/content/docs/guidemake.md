---
title: guidemake.cfg
---

> 地图指南制作专用配置文件，适合在练习模式下使用

- 首次使用建议先只创建一个标识后进行保存，并重新启动进入游戏
- 创建的标识会以 "label" 命名，方便后续编辑

::: tip 提示
按下快捷键后，标识会以 "label" 命名。保存后打开对应的 TXT 文件，对每一组标识进行文本编辑。
建议在地图上创建一个标识后就进行保存，并在此文件中进行序号编辑，方便后续查找和修改。
:::

## 功能表

|      功能      |  快捷键  | 说明                                              |
| :------------: | :------: | :------------------------------------------------ |
|  创建手雷标识  |   `Z`    | 创建 HE 手雷投掷物标识                            |
| 创建闪光弹标识 |   `X`    | 创建 Flash 闪光弹投掷物标识                       |
| 创建高爆弹标识 |   `C`    | 创建 Smoke 烟雾弹投掷物标识                       |
| 创建燃烧弹标识 |   `V`    | 创建 Molotov/Incendiary 燃烧弹投掷物标识          |
| 创建诱饵弹标识 |   `6`    | 创建 Decoy 诱饵弹投掷物标识                       |
| 删除上一个标识 |  `Del`   | 删除最近创建的标识                                |
|  保存地图指南  | `Enter`  | 保存为 "mapguide"                                 |
| 上传至创意工坊 | `upload` | 原始指令:`workshop_annotation_submit`(控制台输入) |

## 控制台指令

### 允许查看和编辑地图指南

```bash
sv_allow_annotations_access_level 2
```

### 创建投掷物描点

```bash
annotation_create grenade [smoke|flash|he|molotov|incendiary|decoy] "label"
```

### 删除上一个标识

```bash
annotation_delete_previous_node_set
```

### 清除全部标识

```bash
annotation_clear
```

### 保存地图指南

```bash
annotation_save "filename"
```

## 使用流程

1. 进入 CS2 练习模式
2. 加载本配置文件：`exec guidemake`
3. 投掷出投掷物后保持视角不动
4. 按下对应快捷键创建投掷物标识
5. 按下 `Enter` 保存地图指南

## 文件保存位置

保存位置: `...\SteamLibrary\steamapps\common\Counter-Strike Global Offensive\game\csgo\annotations\local\mapguide`

## 注意事项

- 制作好之后，请务必将该指南的文件夹名、文件名进行修改，以避免与其他指南冲突
- 首次使用建议只创建一个标识后保存，并重新启动进入游戏
- 建议在地图上创建一个标识后就进行保存，并在 TXT 文件中进行序号编辑
