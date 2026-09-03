---
title: Desktop 使用指南
description: 从 Desktop 安装器五阶段流水线到组件部署、配置注入与灾备回滚
---

## Desktop 五阶段使用流程

SrP-CFG Desktop 将原本复杂的目录查找与配置部署，拆解为清晰的五阶段流水线：

```text
1. 组件下载 ──> 2. 组件安装 ──> 3. 配置注入 ──> 4. 当前安装 ──> 5. 恢复中心
  (获取组件)      (队列与快照)     (模版与VCFG)     (物理文件树)    (灾备回滚)
```

---

## 阶段一：组件下载 (Download)

在桌面端左侧导航进入「**组件下载**」：

1. **官方解耦组件**：
   - **Runtime Core**（核心必须）：包含 `autoexec.cfg`、完整 `srp-cfg/` 核心机制、Preset 模版案例与用户配置入口。
   - **Map Guides**（可选标点）：包含各竞技地图的跑位与道具投掷标点集。
   - **Video Settings**（可选画质）：包含兼顾竞技帧率与画质的 CS2 视频配置模版。
2. **下载与导入模式**：
   - 每个组件均支持「国内镜像加速」与「GitHub 直连」双通道，下载后自动进入暂存区并加入预安装队列。
   - 亦可直接拖入任意自定义的第三方 ZIP、CFG、TXT 或文件夹，安装器会自动进行智能分类与解压暂存。

---

## 阶段二：组件安装 (Install)

进入「**组件安装**」页面：

1. **环境与路径自检**：安装器会自动探测 Steam 根目录、CS2 游戏路径、当前登录 Steam 账号以及各组件目标路径（如 `game/csgo/cfg/`、`game/csgo/annotations/`）。
2. **预安装队列与差异审计**：查看待安装的配置包，展开「查看待安装文件明细」，提前审查每一项文件的 **[新增]**、**[覆盖]** 或 **[受保护]** 状态。
3. **独立组件开关**：根据需求自由勾选/取消勾选 Runtime Core、Map Guides 或 Video Config。
4. **安全保护与自动快照**：
   - 勾选「自动备份受影响目录（推荐）」：安装执行瞬间会自动打包生成全量快照 ZIP 归档。
   - 勾选「保护 custom.cfg」：严禁任何安装或更新操作覆盖你的个人配置。
5. 点击「**立即安装所选组件**」完成物理部署。

---

## 阶段三：配置注入与偏好定制 (Config Injection)

进入「**配置注入**」页面，在此管理唯一的 `srp-cfg/user/custom.cfg`：

### 1. 预设模版快速切换 (Presets)
顶部提供了多种预设起点，点击即可在编辑器中一键置换：
- **RoL1n 自用模版 (Default)**：`srp_apply_default`
- **Echo 模版**：`srp_apply_echo`
- **YSZH 模版**：`srp_apply_yszh`
- **VisionL 模版**：`srp_apply_visionl`
- **CS2 默认设置**：`srp_reset_valve`
- **无预设 / 纯 CLI 模式**：注释全部预设，完全交由游戏云存档与手动控制台指令

### 2. VCFG 偏好智能提取助手
若你希望保留当前游戏账号里的实际按键与偏好：
1. 检测卡片会自动匹配当前 Steam 账号的 `cs2_user_keys.vcfg` 与 `cs2_user_convars.vcfg`。
2. 点击「**读取并注入 VCFG**」，安装器只读解析并对比 Valve 官方默认值，只提取你改过的按键与参数。
3. 提取结果安全插入在 Preset Layer 与 User Layer 之间。
4. 若后续不需要，可随时点击「**一键撤销注入**」无损移除。

### 3. 内置专业代码编辑器 (CodeMirror 6)
- 配备 CS2 专有语法高亮（高亮 alias、bind、cvar、武器指令、按键与注释）。
- 底部直接编写你的最终覆盖代码，快捷键 `Ctrl + S` 快速保存。

---

## 阶段四：当前安装与文件树 (Current Installation)

进入「**当前安装**」页面：
- 实时物理扫描 CS2 安装目录下的三大组件根路径（游戏 CFG、标点集、画质配置）。
- 点击任意文件节点，右侧即可通过内置编辑器就地查看源码、编辑并保存修改。

---

## 阶段五：恢复中心与历史快照 (Recovery Center)

进入「**恢复中心**」页面：
- **全量快照归档**：展示历史每次安装前自动生成的带时间戳全量备份。
- **一键无损回滚**：随时点击「恢复此快照」，即可将当前环境还原到对应的历史时间点。
- **自定义保留上限**：可在右上角设定快照最大保留份数（默认为 10 份，采用先进先出 FIFO 自动清理），亦可手动创建永久命名快照。

---

## 游戏内常用命令与调试

写入后的 `custom.cfg` 布局：

```text
// ─── SrP-CFG Preset Layer ───
srp_apply_default
// ─── Preset Layer End ───

// ─── VCFG Import Layer (2026/07/12 20:30:00) ───
bind "a" "+moveleft"
sensitivity 1.5
// ─── VCFG Import Layer End ───

// ─── SrP-CFG User Layer ───
// 手动编写的个人差异
// ─── User Layer End ───
```

VCFG Import Layer 中的命令位于 Preset 之后、User 之前，因此优先级低于 User Layer 中的同名命令。如果需要覆盖某个导入值，在 User Layer 中写一行新的即可。

## 回到 Valve 原始测试基线

控制台执行：

```text
srp_reset_valve
```

它会恢复 SrP-CFG 管理范围内的 Valve 默认偏好，并调用游戏自带 `binddefaults`。它故意不执行 User，方便在纯基线上测试。

常用变体：

```text
srp_reset_valve_settings
srp_reset_valve_keys
srp_reset_valve_user
```

重置改变的是当前游戏状态，不会删除 `custom.cfg`，也不会由安装器直接覆盖 VCFG。完成测试后执行 `srp_reload`，返回自己的 Runtime → User 链。

## 功能与按键为什么分成两个命令

例如：

```text
srp_preview       // 只应用预览设置
srp_preview_keys  // 设置 + 预览工作区键位
```

practice、guidemake、demo、crosshair-view、autoview、zeus 都采用同一规则。这样可以先检查 `keymap.cfg`，再决定是否交出实体键位。

## 查看模块术语

```text
srp_help
srp_help_presets
srp_help_practice
srp_help_guidemake
srp_help_preview
srp_help_demo
srp_help_crosshair
srp_help_reset
```

## 需求应该放在哪里

| 需求 | 推荐位置 |
| :--- | :--- |
| 只使用功能，普通设置随游戏保存 | 不启用 `srp_apply_*`，交给 VCFG |
| 每次启动使用作者推荐值 | `custom.cfg` 顶部写 `srp_apply_default` |
| 每次启动使用 YSZH 等案例 | `custom.cfg` 顶部写相应 `srp_apply_*` |
| 在案例之上保留个人差异 | 写在同一 `custom.cfg` 的 Preset 命令之后 |
| 把当前游戏设置持久化到 `custom.cfg` | 安装器"写入 VCFG 当前配置"，自动对比 Valve 默认值 |
| 排查问题、回到可审计基线 | `srp_reset_valve` |
| 分辨率、显卡和设备画质 | 游戏设置或 `cs2_video.txt` |

## 继续阅读

- [autoexec.cfg](/docs/autoexec)
- [VCFG 与 Steam Cloud](/docs/vcfg)
- [practice 模式](/docs/practice)
- [Demo / HLAE](/docs/demo_hlae)
