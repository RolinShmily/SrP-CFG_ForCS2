---
title: annotations 地图道具指南
description: 在 CS2 小地图上显示投掷物站位与瞄准标记，覆盖 4 张竞技地图
---

> 模块目录：`config/annotations/`

## 简介

annotations 利用 CS2 的 kv3 地图标注系统，在游戏内小地图（雷达 / Tab 地图）上叠加显示投掷物道具指南。每个标注点包含站位、瞄准方向、投掷方式（左键/跳投/双键）、投掷物类型（烟/闪/火/雷）等信息。

内置 4 张竞技地图的完整道具指南：

| 地图 | 指南文件 | 标注节点数 |
| :--- | :--- | :--- |
| Dust II | `SrP-Dust2-Guide.txt` | ~30+ |
| Inferno | `SrP-Inferno-Guide.txt` | ~40+ |
| Mirage | `SrP-Mirage-Guide.txt` | ~50+ |
| Ancient | `SrP-Ancient-Guide.txt` | ~30+ |

## 安装位置

安装器会将注解文件部署到 CS2 的 `annotations/local/` 目录下：

```
csgo/
└── annotations/
    └── local/
        ├── SrP-Dust2-Guide.txt
        ├── SrP-Inferno-Guide.txt
        ├── SrP-Mirage-Guide.txt
        └── SrP-Ancient-Guide.txt
```

## 使用方法

1. 在桌面端安装器中勾选 annotations 类别，或手动将指南 `.txt` 文件复制到 `csgo/annotations/local/`
2. 启动 CS2 并进入对应地图
3. 打开游戏内小地图（默认 `Tab` 键或雷达）
4. 地图上将显示编号的投掷物标注点，每个节点包含：
   - **主节点**（空心圆）：投掷站位，显示编号
   - **瞄准目标点**（准星标记）：瞄准位置与投掷说明
   - **落地标记**（方形）：投掷物落点（部分道具）

## 标注点示例

以 Dust II 为例，标注覆盖 A 大、中门、B 区等关键区域：

| 编号 | 位置 | 道具 | 投掷方式 |
| :--- | :--- | :--- | :--- |
| 1 | A大 | 闪光弹 | 左键跳投 |
| 2 | 中门 | 满封烟 | 左键投掷 |
| 3 | A大 | 辅助闪光 | 左键跳投 |
| 4 | 中门 | 满封烟 | 左键投掷 |
| 5 | B1层 | 烟 | 左键跳投 |
| 6 | 中门近点 | 烟 | 双键跳投 |
| 7 | 中门 | 过点烟 | 左键跳投 |

所有投掷方式统一为中文标注：**左键投掷**、**左键跳投**、**双键跳投**、**蹲下投掷**。

## 相关文件

- [autoexec.cfg](/docs/autoexec) — v3 启动引导
- [guidemake 功能](/docs/guidemake) — 在地图中自定义定位标注点

## 注意事项

- annotations 文件格式为 CS2 kv3，必须放置在 `csgo/annotations/local/` 目录下才能被游戏读取
- 每个 `.txt` 文件对应一张地图，文件名前缀需与 `MapName` 字段关联
- 标注点仅在自建房或离线模式中可用，不影响官匹与完美平台
- 如需创建自己的地图指南，可使用 `guidemake` 功能配合游戏内控制台定位坐标，再写入 kv3 文件
