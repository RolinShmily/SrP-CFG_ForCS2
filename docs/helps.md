---
title: 控制台帮助系统
description: srp_help 主题索引与模块黑话命令说明
---

v3 为每个 feature 与 mode 增加 `help.cfg`。帮助文件只输出说明，不修改偏好、服务器状态或按键。

## 总入口

```text
srp_help
```

它会列出所有主题命令：

| 命令 | 内容 |
| :--- | :--- |
| `srp_help_presets` | Default、Echo、YSZH、VisionL 案例 |
| `srp_help_reset` | Valve 基线重置与能力边界 |
| `srp_help_crosshair` | c00-c07、v00-v07、颜色与投掷物准星 |
| `srp_help_autoview` | view_0、view_1 与武器视角键表 |
| `srp_help_knife` | 匕首模型数字编号 |
| `srp_help_zeus` | att0、att1、+firr 攻击包装 |
| `srp_help_practice` | spawn、gkd、gg、plant、xray 等跑图黑话 |
| `srp_help_pwa_prac` | 完美世界跑图专属键位映射说明 |
| `srp_help_preview` | depre、changeblur、changefov、changeang |
| `srp_help_guidemake` | srp_guide_* 地图指南命令 |
| `srp_help_demo` | HLAE 录制、镜头、速度与显示命令 |

## 为什么帮助放在模块目录

例如 practice：

```text
modes/practice/
├── runtime.cfg
├── settings.cfg
├── keymap.cfg
├── with-keymap.cfg
└── help.cfg
```

命令实现、设置、键位和术语说明位于同一模块目录。维护某个功能时不需要在全局帮助文件中反向查找。

## 帮助不会自动执行模块

`srp_help_demo` 只展示 Demo/HLAE 术语，不会启用 HLAE 设置，也不会执行 `binddefaults`。真正应用功能仍需使用 `srp_demo` 或 `srp_demo_keys`。

同理，查看 `srp_help_reset` 不会执行重置。
