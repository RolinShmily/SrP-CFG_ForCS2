---
title: knife.cfg
description: 匕首模型切换，支持 21 种刀具模型预览
---

> 匕首模型切换配置文件

## 简介

knife.cfg 允许在练习模式下通过控制台切换 21 种匕首模型，用于预览不同刀具的外观和检视动画。使用 `subclass_create` 命令在准星位置生成对应模型。

## 激活方式

在 autoexec.cfg 中按 `J` 键加载。加载后在控制台输入对应编号（500-526）切换刀具模型。

## 使用方法

1. 进入自建房或开启作弊的服务器
2. 按 `J` 键加载 knife.cfg
3. 在控制台输入刀具编号（如 `507` 切换为爪子刀）
4. 按 `F` 检视刀具外观

## 刀具模型列表

| 编号 | 刀具模型 | 英文名 |
| :--- | :--- | :--- |
| 500 | 刺刀 | Bayonet |
| 503 | 海豹短刀 | Seal Knife |
| 505 | 折叠刀 | Flip Knife |
| 506 | 穿肠刀 | Gut Knife |
| 507 | 爪子刀 | Karambit |
| 508 | M9 刺刀 | M9 Bayonet |
| 509 | 猎杀者匕首 | Huntsman |
| 512 | 弯刀 | Bowie |
| 514 | 鲍伊猎刀 | Bear Knife |
| 515 | 蝴蝶刀 | Butterfly |
| 516 | 暗影双匕 | Shadow Daggers |
| 517 | 系绳匕首 | Paracord |
| 518 | 求生匕首 | Survival |
| 519 | 熊刀 | Ursus |
| 520 | 折刀 | Falchion |
| 521 | 流浪者匕首 | Nomad |
| 522 | 短剑 | Stiletto |
| 523 | 锯齿爪刀 | Classic |
| 524 | 默认匕首 | Default |
| 525 | 骷髅匕首 | Skeleton |
| 526 | 尼泊尔 | Kukri |

## 相关文件

- [autoexec.cfg](/docs/autoexec) — 主配置，按 `J` 键加载本文件

## 注意事项

- 2025 年 8 月 15 日更新后，原来的 knife 命令不再适用，新版使用 `subclass_create` 命令实现
- 此功能仅在作弊模式下有效（需要 sv_cheats 1）
- 生成的刀具在准星位置出现，可按 `F` 检视
