---
title: SrP-CFG v3
description: 功能 Runtime、内置 Preset、用户配置和 VCFG 概览
---

## v3 解决什么问题

CS2 的 VCFG 可以保存当前键位与可归档 ConVar，却不能保存 alias 实现、多文件模块、注释和项目结构。SrP-CFG 因此引入了分层架构，将职责边界清晰划分。

---

## 分层架构与模型

### 启动调用流程

```text
CS2 载入 VCFG
    ↓
Runtime 注册能力
    ↓
User：可选 Preset 起点 → 个人覆盖
    ↓
CS2 可保存最终状态到 VCFG / Steam Cloud
```

### 职责边界

| 层 | 负责什么 | 启动行为 | 所有者 |
| :--- | :--- | :--- | :--- |
| Runtime | 公共入口、alias、功能实现 | 每次启动只注册能力 | 项目维护者 |
| Preset | 偏好与实体按键案例 | 由 User 中的 `srp_apply_*` 选择 | 案例作者 |
| User | Preset 选择与用户最终差异 | Runtime 之后执行 | 当前用户 |
| VCFG | 当前绑定与可归档 ConVar 的序列化状态 | CS2 载入并可能重写 | CS2 / Steam Cloud |

Preset 不是独立启动层，它是 User 层可以调用的一组 Runtime 内置资源。

---

## 只有一个配置包

```text
SrP-CFG_Runtime_Core.zip
```

它包含全部 Runtime、Default / Echo / YSZH / VisionL、Valve 基线、`user/custom.cfg`、Feature、Mode 和帮助文件。内置 Preset 不再对应独立 ZIP。

### autoexec 启动只有两步

`autoexec.cfg` 的逻辑非常简单：

```text
exec srp-cfg/runtime/init.cfg
execifexists srp-cfg/user/custom.cfg
```

1. **Runtime 初始化**：注册功能和 alias，但不主动应用普通偏好或实体键位。
2. **加载 User 配置**：`user/custom.cfg` 决定是否调用一个内置 Preset，再执行用户自己的最终覆盖。

---

## 双功能使用模式

用户可以根据需求选择以下两种使用模式之一：

### 1. 模板/只使用功能模式 (Runtime + VCFG)

`custom.cfg` 不启用任何 `srp_apply_*`。Runtime 只提供跑图、准星查看、预览、Demo/HLAE 等功能与 alias。普通设置（如灵敏度、准星、画面等）完全交由游戏菜单、VCFG 和 Steam Cloud 自动保存与管理。

### 2. Preset + 用户模式 (Runtime + Preset + User)

在 `custom.cfg` 顶部选择一个 Preset 作为起点，并在下方写入个人差异：

```text
srp_apply_default

sensitivity 0.95
bind "mouse5" "+voicerecord"
```

每次启动和执行 `srp_reload` 时，都会按相同顺序（Runtime → Preset → 个人覆盖）重放。后面的同名命令会覆盖 Preset，因此结果明确、可审查，且不需要复制或修改仓库内的案例文件。

---

## 内置 Preset

Default、Echo、YSZH、VisionL 位于：

```text
presets/<name>/
├── settings.cfg   # 偏好，保留解释性注释
├── keymap.cfg     # 实体键位，保留布局说明
└── apply.cfg      # 继承与执行顺序
```

Runtime 注册了四个入口：

```text
srp_apply_default
srp_apply_echo
srp_apply_yszh
srp_apply_visionl
```

每个入口只执行对应 Preset 的 `apply.cfg`，不会再次执行 User。这一单向关系既能避免 `custom.cfg → srp_apply_* → custom.cfg` 的无限递归，也能保证位于 Preset 命令之后的个人设置自然覆盖案例值。

---

## User 层

`srp-cfg/user/custom.cfg` 是当前用户唯一需要维护的文件。桌面安装器的“我的配置”页面可以直接编辑它，并在安装、更新、回滚和卸载 Runtime 时保护其内容。

保存后在控制台执行 `srp_reload`，会重新注册 Runtime，并按 `custom.cfg` 的实际顺序重放 Preset 起点与个人覆盖。

---

## Valve 测试基线

执行 `srp_reset_valve` 可以帮助排查问题。它会：

- 调用当前 CS2 自带的 `binddefaults`；
- 恢复所有当前被 SrP-CFG 修改的可归档偏好字段；
- 恢复少量预览 / Demo 模式改变的会话画面字段；
- 保持 VCFG、Steam Cloud 元数据和 `cs2_video.txt` 不被第三方直接写入。

`presets/valve/` 包含了可审计的测试基线：
- `keymap.cfg` 调用游戏自带的 `binddefaults`。
- `settings.cfg` 恢复所有当前被 SrP-CFG 修改的可归档偏好，并恢复少量模式会改变的会话画面字段。
- 不删除 VCFG、不修改 `_lastclouded`、不修改 `remotecache.vdf`、不处理 `cs2_video.txt`。

它故意不执行 User，非常适合排查问题究竟来自 Valve 默认、某个 Preset、个人覆盖还是 VCFG 当前状态。测试结束后执行 `srp_reload` 即可返回正常的 Runtime → User 链。

---

## 统一 Feature / Mode 结构

项目中的功能和模式模块遵循统一的文件结构：

```text
<module>/
├── runtime.cfg       # 只定义持久 alias，保证 VCFG 同步来的 alias 绑定在换机后仍有实现
├── settings.cfg      # 应用功能或模式状态，不包含顶层实体键位操作
├── keymap.cfg        # 只保存实体键位，便于用户审查模块会接管哪些键
├── with-keymap.cfg   # 严格先执行设置，再执行键位
└── help.cfg          # 保存控制台黑话、内部命令和使用说明
```

### 实体按键解耦

模块的普通入口只应用设置，带 `_keys` 的入口才应用工作区按键。例如：

```text
srp_practice       // 仅开启跑图设置
srp_practice_keys  // 开启设置并接管按键
```

这样用户可以灵活取用跑图、预览、指南或 HLAE 功能，而不必无条件交出实体键位控制。

---

## 帮助系统

每个模块都配备了 `help.cfg`。在游戏控制台输入 `srp_help` 查看索引，再使用 `srp_help_practice`、`srp_help_demo`、`srp_help_reset` 等命令可直接在控制台查看使用说明。

---

## 目录结构

完整配置包部署到 CS2 后的目录树结构如下：

```text
config/
├── autoexec.cfg
├── annotations/
├── video/
└── srp-cfg/
    ├── runtime/      # 核心运行库
    ├── helps/        # 帮助系统
    ├── features/     # 独立功能（如准星、视频偏好）
    ├── modes/        # 独立模式（如跑图、预览、Demo/HLAE）
    ├── presets/      # 内置 Preset（如 Default, YSZH）与 Valve 基线
    └── user/         # 用户配置目录（包含 custom.cfg）
```

---

## 继续阅读

- [使用指南](/docs/srpcfg-3)
- [autoexec.cfg](/docs/autoexec)
- [VCFG 与 Steam Cloud](/docs/vcfg)
