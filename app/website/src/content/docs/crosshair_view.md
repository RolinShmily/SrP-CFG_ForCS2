---
title: crosshair-view 功能
description: 准星与持枪视角预设配置，含 8 组准星和 8 组视角预设
---

> v3 中可通过 `srp_crosshair_view` 显式加载。它会修改准星与持枪视角 ConVar，这些值可能由 CS2 持久化；Runtime Core 不会在启动时自动应用。

> 模块目录：`srp-cfg/features/crosshair-view/`

## 简介

crosshair-view 模块提供准星预设切换、持枪视角切换、准星颜色切换、投掷物准星开关等功能。Runtime 会永久注册其 alias；`srp_crosshair_view` 只应用 c00/v00，`srp_crosshair_view_keys` 才绑定 7/8 与方向键。

由于 Valve 的脚本指令单条长度限制，准星参数需通过 CFG 文件加载。更换准星依赖 `srp-cfg/features/crosshair-view/library/` 中的准星代码库。

## 功能表

### 准星预设切换

| 功能 | 快捷键 | 控制台别名 |
| :--- | :--- | :--- |
| 一键轮换准星预设 | `7` | - |
| 查询当前准星预设 | - | `whoamic` |
| 切换到指定准星 | - | `c00` ~ `c07` |
| 开关准星中心点 | `←` | - |
| 是否开启投掷物准星 | `↓` | `switchthrow` |

### 视角预设切换

| 功能 | 快捷键 | 控制台别名 |
| :--- | :---: | :---: |
| 一键轮换视角预设 | `8` | - |
| 查询当前视角预设 | - | `whoamiv` |
| 切换到指定视角 | - | `v00` ~ `v07` |

### 准星颜色

控制台输入对应别名即可切换准星颜色：

| 别名 | 颜色 | RGB |
| :--- | :--- | :--- |
| `red` | 红色 | 255/0/0 |
| `orange` | 橙色 | 255/165/0 |
| `yellow` | 黄色 | 255/255/0 |
| `green` | 绿色 | 0/255/0 |
| `cyan` | 青色 | 0/255/255 |
| `blue` | 蓝色 | 0/0/255 |
| `purple` | 紫色 | 128/0/128 |
| `black` | 黑色 | 0/0/0 |
| `white` | 白色 | 255/255/255 |
| `pink` | 粉色 | 255/192/203 |
| `brown` | 棕色 | 165/42/42 |
| `gray` | 灰色 | 128/128/128 |

### 其他功能

| 功能 | 控制台别名 |
| :--- | :--- |
| 投掷时保持玩家自定义准星 | `keep` |

## crosshair_library 准星预设

| 预设 | 文件 | 准星代码 | 描述 |
| :--- | :--- | :--- | :--- |
| c00 | 00.cfg | `CSGO-hkk78-Mz6UK-XJ9t2-Dv3E3-qbOUD` | 默认准星（白色经典静态小十字） |
| c01 | 01.cfg | `CSGO-H9mcs-8GDFZ-MfxkQ-2Kx7O-pTLoD` | 细线静态标准小准星 |
| c02 | 02.cfg | `CSGO-oK2db-LY2wT-seq73-YTnJB-3bOUD` | 跟枪抖动动态准星 |
| c03 | 03.cfg | `CSGO-9StUb-FrcBs-HhYjr-mzVip-YScNE` | 移动聚焦动态准星 |
| c04 | 04.cfg | `CSGO-pqEaF-5AKXB-DCdnh-vpxAJ-94GSQ` | 小圆点静态准星 |
| c05 | 05.cfg | `CSGO-Q4APO-buiyc-i9V7H-7sxJN-Zy8rN` | 导播专用大号准星 |
| c06 | 06.cfg | `CSGO-LpB26-mhWAt-srQVK-fEE34-BWxTC` | Anyingi\_Csgo 准星 |
| c07 | 07.cfg | `CSGO-mFiak-CTXws-wdhEJ-i3CK3-y5LsE` | 犬升 dog41 准星 |

> **提示：** 准星代码可在游戏内设置界面的"准星"选项中导入。

## 视角预设

| 预设 | 参数 (FOV / X / Y / Z / preset) | 描述 |
| :--- | :--- | :--- |
| v00 | 68 / 2 / 2 / -1 / 0 | 默认视角 M7 |
| v01 | 60 / 0 / 1 / -2 / 0 | Niko 中心视角 |
| v02 | 68 / 2.5 / -1 / -2 / 0 | 大幅偏右开阔视角 |
| v03 | 68 / 1.5 / -2 / -2 / 0 | 偏右偏中开阔视角 |
| v04 | 65 / 2.5 / -2 / -2 / 0 | 不挡视野视角 |
| v05 | 62 / 2.5 / 2 / -2 / 0 | 导播 demo 视角 |
| v06 | 68 / 2.5 / 0 / -1.5 / 3 | Anyingi\_Csgo 视角 |
| v07 | 68 / 2.5 / 2 / -2 / 0 | 犬升 dog41 视角 |

## 使用方法

1. 输入 `srp_crosshair_view` 应用推荐状态；需要模块按键时输入 `srp_crosshair_view_keys`
2. 按 `7` 键轮换准星预设，按 `8` 键轮换视角预设
3. 控制台输入 `c00`~`c07` 切换指定准星，`v00`~`v07` 切换指定视角
4. 控制台输入颜色别名（red、blue 等）切换准星颜色
5. 输入 `whoamic` 或 `whoamiv` 查询当前预设

## 相关文件

- [autoexec.cfg](/docs/autoexec) — v3 启动引导与三层说明
- `srp-cfg/features/crosshair-view/library/` — 准星预设 cfg 文件夹（00.cfg ~ 07.cfg）

## 注意事项

- 切换准星后，按 `7`/`8` 键的轮换链会从当前位置继续
- 由于 Valve 脚本长度限制，准星参数无法直接写在 autoexec 中，必须通过 cfg 文件加载
