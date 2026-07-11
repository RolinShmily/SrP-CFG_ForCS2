# SrP-CFG for CS2

SrP-CFG v3 是一套面向 Counter-Strike 2 的“功能 Runtime + 内置 Preset + 用户配置”系统。VCFG 继续由 CS2 / Steam Cloud 管理；SrP-CFG 负责 VCFG 无法保存的 alias、模块、注释和可审查的配置起点。

```text
CS2 载入 VCFG 当前状态
        ↓
Runtime 注册功能与 alias
        ↓
user/custom.cfg
  ├─ 可选：srp_apply_default / echo / yszh / visionl
  └─ 用户自己的最终覆盖
        ↓
CS2 之后可能把最终绑定与可归档 ConVar 写回 VCFG
```

## 唯一配置包

v3 只发行：

```text
SrP-CFG_Runtime_Core.zip
```

它已经包含完整 Runtime、`user/custom.cfg`、Default / Echo / YSZH / VisionL 内置 Preset、Valve 重置基线、全部 Feature / Mode 与帮助文件。Preset 是 Runtime 内的可调用配置起点，不再是独立下载包，也没有 `startup.cfg` 自动选择层。

## 用户的两种使用方式

普通用户只需要维护：

```text
srp-cfg/user/custom.cfg
```

### 只使用功能模板

不启用任何 `srp_apply_*`：

```cfg
// srp_apply_default
// srp_apply_echo
// srp_apply_yszh
// srp_apply_visionl
```

Runtime 每次启动只注册功能和 alias，不主动覆盖普通偏好与实体键位。灵敏度、准星、HUD 和按键可以继续在游戏里修改并由 VCFG / Steam Cloud 保存。

### 使用 Preset 起点并叠加个人差异

在 `custom.cfg` 顶部启用一个命令，再把自己的设置写在下面：

```cfg
srp_apply_yszh

// 我的最终覆盖
sensitivity 0.95
c06
cyan
bind "mouse5" "+voicerecord"
```

每次启动的实际顺序是“YSZH 起点 → 个人覆盖”。Default、Echo、YSZH、VisionL 与仓库外用户处于同一层级：它们只是可以复用、查看和修改的案例。

选择 Preset 后，它涉及的字段会在每次启动或 `srp_reload` 时重新应用。在游戏菜单里对这些字段做的修改若要长期保留，应同步写到 `custom.cfg` 的 Preset 命令之后；若希望完全由游戏保存，则注释掉 `srp_apply_*`。

## YSZH 用户流程

1. 下载并安装 `SrP-CFG_Runtime_Core.zip`。
2. 在桌面端打开“我的配置”。
3. 选择 `srp_apply_yszh`，或直接把它写在 `custom.cfg` 顶部。
4. 在下面写入自己的灵敏度、准星、画面偏好和按键差异。
5. 保存后启动 CS2；若游戏已运行，在控制台执行 `srp_reload`。
6. 后续改动继续写在这一个文件中，安装器更新、回滚和卸载 Runtime 都会保护它。

四个内置入口是：

```text
srp_apply_default
srp_apply_echo
srp_apply_yszh
srp_apply_visionl
```

这些命令只加载对应 Preset，不会自己再次执行 `custom.cfg`。因此它们可安全地写进 `custom.cfg`；若在控制台单独运行，则只会立即应用 Preset，运行 `srp_reload` 才会重放完整的“Runtime → custom.cfg”链。

## Valve 基线重置

```text
srp_reset_valve
srp_reset_valve_settings
srp_reset_valve_keys
srp_reset_valve_user
```

- `srp_reset_valve_keys` 调用当前 CS2 自带的 `binddefaults`。
- `srp_reset_valve_settings` 恢复 SrP-CFG 实际涉及的 Valve 默认偏好与少量会话画面状态。
- `srp_reset_valve` 同时执行二者，但故意不重放 `custom.cfg`，便于在 Valve 基线上测试。
- `srp_reset_valve_user` 会在重置后立即执行 `custom.cfg`。

重置不会删除或直接覆盖 `.vcfg`、`_lastclouded`、`remotecache.vdf`，也不会修改硬件相关的 `cs2_video.txt`。完成纯基线测试后，执行 `srp_reload` 即可返回自己的正常配置链。

## 启动入口

`default/autoexec.cfg` 只有两步：

```cfg
exec srp-cfg/runtime/init.cfg
execifexists srp-cfg/user/custom.cfg
```

`runtime/init.cfg` 先注册命令、alias 与模块实现，随后 `custom.cfg` 决定是否调用内置 Preset，并执行个人覆盖。v2 的 `profiles/`、`selectors/`、`generated/` 与 v3 早期方案中的 `startup.cfg` 都已删除：现在不再由打包流程替用户选择配置。

## 统一模块结构

每个 Feature 和 Mode 都采用相同结构：

```text
<module>/
├── runtime.cfg       # 持久 alias；Runtime 每次启动注册
├── settings.cfg      # 功能或模式状态，不修改物理按键
├── keymap.cfg        # 只包含实体键位操作
├── with-keymap.cfg   # 先 settings，再 keymap
└── help.cfg          # 控制台黑话、命令与使用说明
```

普通入口只应用设置，带 `_keys` 的入口才修改实体键位，例如：

```text
srp_practice       / srp_practice_keys
srp_preview        / srp_preview_keys
srp_guidemake      / srp_guidemake_keys
srp_demo           / srp_demo_keys
srp_crosshair_view / srp_crosshair_view_keys
```

输入 `srp_help` 可查看全部帮助主题。

## 目录结构

```text
default/
├── autoexec.cfg
├── annotations/
├── video/
└── srp-cfg/
    ├── runtime/
    ├── helps/
    ├── features/
    ├── modes/
    ├── presets/
    │   ├── valve/
    │   ├── default/
    │   ├── echo/
    │   ├── yszh/
    │   └── visionl/
    └── user/
```

`default/` 根目录不再保留 v2 的散装功能 CFG。`annotations/` 和 `video/` 是特殊安装类别，其余配置统一位于 `srp-cfg/`。

## VCFG 边界

- VCFG 保存当前绑定和可归档 ConVar，不保存 alias 实现、模块依赖、注释或项目版本结构。
- CFG 执行后的绑定与可归档值仍可能被 CS2 保存到 VCFG；把 CFG 放入游戏目录并不会隔离 Steam Cloud。
- 安装器只读解析 VCFG 并保存外部 JSON 基线，不直接写回游戏管理文件。
- `cs2_video.txt` 是独立视频资产，不属于 VCFG，也不适合作为跨硬件通用基线。

## 本地开发

环境要求：Node.js 22+、pnpm 10+；构建 MSI 还需要 .NET 8 SDK 与 WiX Toolset v6。

```bash
pnpm install
pnpm dev:web
pnpm dev:desktop
pnpm build:web
pnpm build:desktop
dotnet build msi -c Release
```

CFG 与唯一发行包校验：

```bash
python .github/scripts/validate_cfg.py
python .github/scripts/parse_packages.py
python .github/scripts/build_packages.py
python .github/scripts/validate_cfg.py --packages
```

## 链接

- 官网：<https://srprolin.top>
- GitHub：<https://github.com/RolinShmily/SrP-CFG_ForCS2>
- Releases：<https://github.com/RolinShmily/SrP-CFG_ForCS2/releases>
