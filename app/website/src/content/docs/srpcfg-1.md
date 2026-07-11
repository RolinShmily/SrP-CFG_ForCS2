---
title: SrP-CFG v3
description: 功能 Runtime、内置 Preset、用户配置和 VCFG 概览
---

## v3 解决什么问题

CS2 的 VCFG 可以保存当前键位与可归档 ConVar，却不能保存 alias 实现、多文件模块、注释和项目结构。SrP-CFG 因此把职责分成：

```text
Runtime 注册功能
→ User 可选 Preset 起点
→ User 个人覆盖
→ CS2 自己管理最终 VCFG 状态
```

## 只有一个配置包

```text
SrP-CFG_Runtime_Core.zip
```

它包含全部 Runtime、Default / Echo / YSZH / VisionL、Valve 基线、`user/custom.cfg`、Feature、Mode 和帮助文件。Preset 是包内可调用的配置案例，不是另一套发行流程。

## 双功能使用模式

### 模板模式

`custom.cfg` 不启用任何 `srp_apply_*`。Runtime 只提供跑图、准星查看、预览、Demo/HLAE 等功能与 alias；普通设置由游戏菜单和 VCFG 管理。

### Preset + 用户模式

在 `custom.cfg` 顶部选择一个起点，再在下面写个人差异：

```text
srp_apply_default

sensitivity 0.95
bind "mouse5" "+voicerecord"
```

每次启动都会按相同顺序应用，个人设置最终覆盖 Preset。Echo、YSZH、VisionL 只是继承 Default 后写入各自差异的案例，和任何仓库外用户处于同一级。

## User 层

`srp-cfg/user/custom.cfg` 是当前用户唯一需要维护的文件。桌面安装器的“我的配置”页面可以直接编辑它，并在安装、更新、回滚和卸载 Runtime 时保护内容。

保存后执行 `srp_reload`，会重新注册 Runtime，并按 `custom.cfg` 的实际顺序重放 Preset 起点与个人覆盖。

## Valve 测试基线

执行 `srp_reset_valve` 可以：

- 调用当前 CS2 自带的 `binddefaults`；
- 恢复所有当前被 SrP-CFG 修改的可归档偏好字段；
- 恢复少量预览 / Demo 模式改变的会话画面字段；
- 保持 VCFG、Steam Cloud 元数据和 `cs2_video.txt` 不被第三方直接写入。

它故意不执行 User，适合排查问题究竟来自 Valve 默认、某个 Preset、个人覆盖还是 VCFG 当前状态。测试结束后执行 `srp_reload` 即可返回正常配置。

## 模块命令

模块的普通入口只应用设置，带 `_keys` 的入口才应用工作区按键。例如：

```text
srp_practice
srp_practice_keys
```

这样用户可以取用跑图、预览、指南或 HLAE 功能，而不必无条件让模块接管键盘。

## 帮助系统

每个模块都有 `help.cfg`。输入 `srp_help` 查看索引，再使用 `srp_help_practice`、`srp_help_demo`、`srp_help_reset` 等命令查看控制台术语。

## 继续阅读

- [使用指南](/docs/srpcfg-3)
- [v3 分层架构](/docs/architecture)
- [autoexec.cfg](/docs/autoexec)
- [VCFG 与 Steam Cloud](/docs/vcfg)
