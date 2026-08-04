---
title: autoexec.cfg
description: v3 的 Runtime、User、内置 Preset 与重载顺序
---

v3 的 `autoexec.cfg` 只建立稳定的两步顺序：

```text
exec srp-cfg/runtime/init.cfg
execifexists srp-cfg/user/custom.cfg
```

## 第一步：Runtime

`runtime/init.cfg` 注册公共命令、公共 alias 与每个模块的 `runtime.cfg`。这些文件只建立能力，不主动应用个人偏好或普通实体键位。

因此，即使 VCFG 把 `P → srp_practice_keys`、`7 → keyc` 或其他 alias 命令同步到新机器，只要 Runtime 已安装，对应实现就会在启动时重新注册。

## 第二步：User

`user/custom.cfg` 是普通用户唯一需要编辑的启动配置。它可以只写个人差异，也可以先调用一个内置 Preset：

```text
srp_apply_yszh

// 位于 Preset 后面的命令拥有最终覆盖权
sensitivity 0.95
c06
cyan
bind "mouse5" "+voicerecord"
```

四个起点命令是：

```text
srp_apply_default
srp_apply_echo
srp_apply_yszh
srp_apply_visionl
```

它们由 Runtime 预先注册，分别单向执行 `presets/<name>/apply.cfg`。Preset 不会再次执行 `custom.cfg`，否则把命令写入 User 会形成递归。

## 两种用户模式

### 不启用 Preset

Runtime 只注册功能。灵敏度、准星、HUD、声音和普通键位可继续在游戏内修改，由 CS2 的 VCFG / Steam Cloud 管理。

### 启用一个 Preset

每次启动先应用确定的案例起点，再继续执行同一个 `custom.cfg` 中的个人差异。若在游戏菜单里修改了 Preset 涉及的字段，下次启动会被起点重放；想长期保留，应把最终值写在 Preset 命令之后，或停用该 Preset。

这两种模式都来自同一个 `SrP-CFG_Runtime_Core.zip`。v3 没有独立 Presets 包，也没有 `startup.cfg`。

## 为什么控制台执行 srp_apply_* 不会自动补上 User

在 `custom.cfg` 中执行时，文件后续行本来就会继续运行，个人覆盖自然生效。在控制台单独执行时，`srp_apply_*` 只立即应用对应案例，不会自动重放 User。

需要重新应用完整正常配置时，执行：

```text
srp_reload
```

它等价于重新执行 `autoexec.cfg`，顺序仍是 Runtime → User，并由 User 内部决定是否应用 Preset。

## Valve 重置命令

| 命令 | 行为 |
| :--- | :--- |
| `srp_reset_valve` | Valve 偏好基线 + 游戏默认键位，不重放 User |
| `srp_reset_valve_settings` | 只恢复 SrP 涉及的偏好与会话字段 |
| `srp_reset_valve_keys` | 只调用游戏自带的 `binddefaults` |
| `srp_reset_valve_user` | Valve 基线后立即执行 User |

纯基线测试结束后执行 `srp_reload`，即可返回 Runtime → User 的正常链。若 User 中启用了 Preset，它也会随之重新应用。

## 功能与按键入口

普通命令只应用模块设置；带 `_keys` 的命令才安装实体键位：

```text
srp_crosshair_view / srp_crosshair_view_keys
srp_autoview       / srp_autoview_keys
srp_zeus           / srp_zeus_keys
srp_practice       / srp_practice_keys
srp_preview        / srp_preview_keys
srp_guidemake      / srp_guidemake_keys
srp_demo           / srp_demo_keys
```

`srp_knife` 没有默认实体键位，只注册并刷新数字模型命令。输入 `srp_help` 可查看全部帮助主题。

## 与 VCFG 的先后关系

一次常见启动可概括为：

```text
CS2 载入账号 VCFG
→ Runtime 注册功能
→ User 可选地应用 Preset
→ User 后续行覆盖
→ CS2 之后可能保存最终状态
```

所以把 CFG 放进游戏目录并不会隔离 VCFG。是否每次重放偏好，不由发行包决定，而由当前用户是否在 `custom.cfg` 中启用 `srp_apply_*` 决定。

## 已删除的选择层

v2 的 `selectors/` 和 `generated/active-profile.cfg` 用于构建不同用户包；v3 早期草案中的 `startup.cfg` 用于区分 Core 与自动 Default 包。最终架构只保留一个包，并把选择权放回 User，因此这些路径都不再存在。
