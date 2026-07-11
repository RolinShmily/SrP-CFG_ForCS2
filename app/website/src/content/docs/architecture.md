---
title: v3 分层架构
description: Runtime、内置 Preset、用户层与 VCFG 的职责边界
---

## 一句话模型

```text
CS2 载入 VCFG
    ↓
Runtime 注册能力
    ↓
User：可选 Preset 起点 → 个人覆盖
    ↓
CS2 可保存最终状态到 VCFG / Steam Cloud
```

| 层 | 负责什么 | 启动行为 | 所有者 |
| :--- | :--- | :--- | :--- |
| Runtime | 公共入口、alias、功能实现 | 每次启动只注册能力 | 项目维护者 |
| Preset | 偏好与实体按键案例 | 由 User 中的 `srp_apply_*` 选择 | 案例作者 |
| User | Preset 选择与用户最终差异 | Runtime 之后执行 | 当前用户 |
| VCFG | 当前绑定与可归档 ConVar 的序列化状态 | CS2 载入并可能重写 | CS2 / Steam Cloud |

Preset 不是独立启动层。它是 User 层可以调用的一组 Runtime 内置资源。

## autoexec 只有两步

```text
exec srp-cfg/runtime/init.cfg
execifexists srp-cfg/user/custom.cfg
```

1. Runtime 注册功能和 alias，但不主动应用普通偏好或实体键位。
2. `user/custom.cfg` 决定是否调用一个内置 Preset，再执行用户自己的最终覆盖。

v3 不包含 `startup.cfg`。发行流程不会替用户选择 Default 或任何朋友配置。

## 唯一发行包

```text
SrP-CFG_Runtime_Core.zip
```

这个包完整包含 Runtime、User 文件、Default / Echo / YSZH / VisionL、Valve 基线、Feature、Mode 与帮助系统。内置 Preset 不再对应独立 ZIP。

## 为什么删除 selectors、generated 和 startup

旧架构需要在构建时决定某个发行包使用哪个 Profile，因此出现了 `selectors/` 与 `generated/active-profile.cfg`。后来的双包草案又用 `startup.cfg` 区分“只注册 Runtime”和“自动应用 Default”。

v3 最终把选择权交给 `user/custom.cfg`：

```text
srp_apply_yszh

// YSZH 之上的个人差异
sensitivity 0.95
```

因此打包时不再生成选择文件，也不需要自动启动 Preset 层。一个发行包即可同时支持“只用 Runtime”和“Preset + User”两种模式。

## 内置 Preset

Default、Echo、YSZH、VisionL 位于：

```text
presets/<name>/
├── settings.cfg   # 偏好，保留解释性注释
├── keymap.cfg     # 实体键位，保留布局说明
└── apply.cfg      # 继承与执行顺序
```

Runtime 注册四个入口：

```text
srp_apply_default
srp_apply_echo
srp_apply_yszh
srp_apply_visionl
```

每个入口只执行对应 `apply.cfg`，不会再次执行 User。这一单向关系既避免 `custom.cfg → srp_apply_* → custom.cfg` 无限递归，也保证同一文件中位于 Preset 命令之后的个人设置自然覆盖案例值。

## User 层的两种模式

### Runtime + VCFG

`custom.cfg` 不启用 `srp_apply_*`。Runtime 只注册功能，普通游戏设置继续由菜单、VCFG 和 Steam Cloud 管理。

### Runtime + Preset + User

`custom.cfg` 顶部启用一个 `srp_apply_*`，后面写个人差异。每次启动和 `srp_reload` 都重放相同顺序，因此结果明确、可审查。

桌面安装器的“我的配置”页面只编辑这一个文件。覆盖安装、Runtime 回滚、恢复原文件、删除受管文件和卸载模板时，安装器都会保护它。

## 统一 Feature / Mode 结构

```text
<module>/
├── runtime.cfg
├── settings.cfg
├── keymap.cfg
├── with-keymap.cfg
└── help.cfg
```

- `runtime.cfg`：只定义持久 alias，保证 VCFG 同步来的 alias 绑定换机后仍有实现。
- `settings.cfg`：应用功能或模式状态，不包含顶层实体键位操作。
- `keymap.cfg`：只保存实体键位，便于用户审查模块会接管哪些键。
- `with-keymap.cfg`：严格先执行设置，再执行键位。
- `help.cfg`：保存控制台黑话、内部命令和使用说明。

alias 需要一个很小的 `runtime.cfg`，因为把它与会立即执行的设置混在一起，要么迫使 Runtime 启动时修改偏好，要么让 VCFG 同步来的 alias 绑定在重启后失去实现。

## Valve 基线

`presets/valve/` 不是用户案例，而是可审计的测试基线：

- `keymap.cfg` 调用游戏自带的 `binddefaults`。
- `settings.cfg` 恢复所有当前被 SrP-CFG 修改的可归档偏好，并恢复少量模式会改变的会话画面字段。
- 不删除 VCFG、不修改 `_lastclouded`、不修改 `remotecache.vdf`、不处理 `cs2_video.txt`。

`srp_reset_valve` 故意不执行 User，方便纯基线测试；`srp_reload` 会返回正常的 Runtime → User 链。

## 目录树

```text
config/
├── autoexec.cfg
├── annotations/
├── video/
└── srp-cfg/
    ├── runtime/
    ├── helps/
    ├── features/
    ├── modes/
    ├── presets/
    └── user/
```

发行校验会拒绝额外根目录入口、`profiles/selectors/generated/startup.cfg` 兼容路径、缺失的 exec 目标、Runtime 中的顶层实体设置、模块结构不一致及缺少 User 层的 ZIP。
