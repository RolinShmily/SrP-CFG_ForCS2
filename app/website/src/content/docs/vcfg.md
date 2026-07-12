---
title: VCFG 与 Steam Cloud
description: CS2 持久配置文件的实测结论、能力边界与 v3 设计依据
---

> 调研基线：2026-07-10。VCFG 是 CS2 管理的持久状态，不是供配置包直接分发的新版 autoexec。

## 结论

- CFG 是命令脚本；VCFG 是游戏把当前绑定和可归档 ConVar 序列化后的状态。
- CFG 放在游戏目录还是账号目录，不决定执行结果是否持久化。
- VCFG 能保存“键名 → 命令字符串”，不能保存 alias 实现、多文件模块、注释或版本结构。
- 删除 CFG 不会撤销此前已经写入 VCFG 的值。
- 第三方安装器适合只读解析和外部快照，不应在 CS2 / Steam Cloud 背后覆盖 VCFG。

## 观察到的文件

典型目录：

```text
Steam/userdata/<accountId>/730/local/cfg/
```

| 文件 | 已观察内容 | 同步情况 |
| :--- | :--- | :--- |
| `cs2_user_keys_0_slot0.vcfg` | `bindings`、`analogbindings` | 日志显示上传为 `cs2_user_keys.vcfg` |
| `cs2_user_convars_0_slot0.vcfg` | 用户级 `convars` | 日志显示上传为 `cs2_user_convars.vcfg` |
| `cs2_machine_convars.vcfg` | 大量机器相关 ConVar | 本次 remote cache 未观察到对应云对象 |
| `cs2_user_keys_0_slot1..3.vcfg` | 其他 split-screen slot，通常为空 | 由游戏决定 |
| `cs2_video.txt` | 视频设备与画质，KeyValues 文本 | 独立资产，不是 VCFG |

“用户级”和“机器级”是依据当前文件内容、命名与云记录做出的工程分类，不是 Valve 对第三方承诺的永久 schema。

## 本机实测

同一台机器上三个实际 CS2 账号的 slot 0 均存在 keys、user convars、machine convars、两份 `_lastclouded` 镜像和 `cs2_video.txt`。只读解析得到：

- 绑定数分别为 65、88、87。
- 用户 ConVar 均为 92。
- 机器 ConVar 为 336–338。

数量差异说明安装器必须动态读取，不能把字段表或条目数写死。

本机 `game/csgo/console.log` 的同一启动序列还显示：

```text
[SplitScreen] Writing configuration for slot 0
Saved 'cs2_user_keys.vcfg' to SteamRemoteStorage
Saved 'cs2_user_convars.vcfg' to SteamRemoteStorage
[InputService] execing autoexec.cfg
[InputService] execing ...自定义 CFG
[SplitScreen] Writing configuration for slot 0
Saved 'cs2_user_keys.vcfg' to SteamRemoteStorage
Saved 'cs2_user_convars.vcfg' to SteamRemoteStorage
```

这证明至少在该版本中，游戏会先载入/保存账号状态，再执行 autoexec，随后再次保存。也就是说，Preset 与 User 中执行的绑定或可归档 ConVar 可能成为新的持久状态。

`game/csgo/gameinfo.gi` 同时声明：

```text
"UserSettingsPathID" "USRLOCAL"
"UserSettingsFileEx" "cs2_"
```

Steam 的 `remotecache.vdf` 则列出了远端对象 `cs2_user_keys.vcfg` 与 `cs2_user_convars.vcfg`。

## VCFG 能做什么

- 保存键名到命令字符串的映射。
- 保存游戏标记为可归档的用户或机器 ConVar。
- 由游戏在设置变化、启动、退出或其他时机重写。
- 对部分用户级状态，通过 Steam Remote Storage 跨设备同步。

## VCFG 不能做什么

- 不会保存 alias 的实现。例如它可以保存 `bind p srp_practice_keys`，但不会保存 `srp_practice_keys` 如何加载 practice 模块。
- 不能自然表达多文件依赖、注释、发行包继承或用户层优先级。
- 不能保证第三方手工编辑后不被游戏或云端版本覆盖。
- 不能替代 `cs2_video.txt` 处理硬件相关画质。
- 不能让侵入式模式自动回滚按键。

## 对 v3 架构的直接影响

### Alias 必须永久属于 Runtime

只要某个可能同步的绑定引用 `keyhud`、`srp_practice_keys`、`view_0` 或 Zeus 攻击 alias，对应定义就必须在每台机器启动时注册。v3 因此让每个模块的 `runtime.cfg` 永久注册 alias。

### Preset 与 VCFG 是不同能力

Preset 是确定性案例，VCFG 是游戏保存的当前状态。v3 不会由发行包自动选择 Preset；是否重放案例取决于用户有没有在 `user/custom.cfg` 中启用 `srp_apply_*`。

启用后，一次典型启动顺序是：VCFG 先载入当前状态，Runtime 注册能力，User 调用 Preset，随后 User 的其余命令最终覆盖。CS2 之后仍可能把结果保存回 VCFG。

### 两种模式都来自同一个 Runtime Core

不启用 `srp_apply_*` 时，Runtime 不会主动重放普通偏好和键位。用户可继续在游戏菜单中修改，由 VCFG 保存；需要明确、可审查的个性化项仍可写入 `user/custom.cfg`。

启用一个 `srp_apply_*` 时，Preset 涉及的字段会在每次启动或 `srp_reload` 时重放。游戏内修改若要跨启动保留，应写在该命令之后；若希望完全由 VCFG 管理，则停用 Preset。

在控制台单独执行 `srp_apply_<name>` 只改变当前状态，不会再次执行 User。CS2 后续是否以及何时写盘仍由游戏控制；需要重放完整 User 链时使用 `srp_reload`。

### Valve 重置仍不写 VCFG

`srp_reset_valve_keys` 使用游戏公开的 `binddefaults`，让当前 CS2 版本读取自己的 `user_keys_default.vcfg`。偏好重置则显式恢复 SrP-CFG 实际涉及的字段。两者都通过控制台状态改变，让 CS2 决定何时保存，不覆盖序列化文件。

本机安装与当前公开跟踪数据给出的证据是：

- 游戏随包文件 `game/csgo/cfg/user_keys_default.vcfg` 明确提供默认 `bindings` 与 `analogbindings`。
- `engine2.dll` 将 `binddefaults` 描述为 `Bind all keys to their default values`；当前命令转储也把它标为 release 命令。
- 当前命令转储中唯一类似全局 ConVar 重置的 `reset_gameconvars` 被标为 cheat；没有可用的 `cvar_reset`。
- `machine_convars_default.vcfg` 本身为空，并明确要求默认值由代码或 `gameinfo.gi` 提供，因此不能把它当作完整偏好模板。
- `presets/valve/settings.cfg` 的默认值以当前 CS2 ConVar 转储为基线，并由校验器保证覆盖所有 SrP-CFG 实际触及的客户端偏好字段。

所以 `srp_reset_valve` 的准确能力边界是“恢复当前游戏自带的默认键位，并恢复 SrP-CFG 管理范围内的 Valve 默认偏好”。它不会伪造一个 Valve 并未提供的“重置任意未知 ConVar”能力。

## 安装器边界与 VCFG 写入

SrP-CFG Installer 会：

1. 只读统计 bindings、analog bindings、用户 ConVar 与机器 ConVar。
2. 支持"写入 VCFG 当前配置"功能：只读解析 VCFG 文件，对比 `presets/valve/settings.cfg`（Valve 基准线），只过滤出用户修改过的 ConVar 命令写入 `custom.cfg` 的独立分区（按键绑定全量导出）。重复导入会自动替换旧块，并支持一键撤销（撤销标记保存在文件中，跨会话有效）。
3. 在安装可能应用偏好或键位的未知自定义 CFG 前保存账号级 JSON 基线。
4. 阻止 `.vcfg`、`.vcfg_lastclouded` 与 `remotecache.vdf` 进入暂存和发行包。
5. 明确区分 Runtime 回滚、安装前原文件、User 保护与 VCFG 状态快照。

安装器不会：

1. 直写或覆盖游戏的 `.vcfg` 序列化文件。
2. 修改 `_lastclouded` 镜像。
3. 修改 `remotecache.vdf`。

这种"读取 VCFG 生成 CFG 文本追加到 `custom.cfg`，让游戏启动时自己执行命令"的设计，既保证了 VCFG 被破坏时的安全边界，又实现了偏好的可视化与持久化。
## 公开资料与能力边界

- Steam Cloud 的一般同步机制：[Steamworks Cloud 文档](https://partner.steamgames.com/doc/features/cloud)
- KeyValues 格式背景：[Valve Developer Community — KeyValues](https://developer.valvesoftware.com/wiki/KeyValues)
- 当前 CS2 默认键位文件镜像：[GameTracking-CS2 — user_keys_default.vcfg](https://github.com/SteamDatabase/GameTracking-CS2/blob/master/game/csgo/cfg/user_keys_default.vcfg)
- 当前 CS2 命令及权限标记：[GameTracking-CS2 — commands.txt](https://github.com/SteamDatabase/GameTracking-CS2/blob/master/DumpSource2/commands.txt)
- 当前 CS2 ConVar 默认值与标记：[GameTracking-CS2 — convars.txt](https://github.com/SteamDatabase/GameTracking-CS2/blob/master/DumpSource2/convars.txt)

Valve 目前没有公开一份面向第三方工具、承诺长期稳定的 CS2 VCFG schema。文件名、节点层级、slot 规则、字段归属和保存时机都可能随游戏更新改变，所以解析器必须容错、未知节点不作假设。
