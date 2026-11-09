# SrP-CFG 分层架构与职责边界

本文记录当前 C++ Core / CLI / Qt Quick GUI 的实际分层、依赖方向与运行模型，是 2026-11 架构审计后的定稿版本。目标是让新增功能有明确落点，而不是引入概念化的 Service/Manager 层。

相关文档：[GUI 层](GUI.md) · [构建与发布](BUILD_AND_RELEASE.md) · [配置暂存与媒体](../reference/CONFIG_PACKAGES_AND_MEDIA.md) · [文件事务实现](../reference/FILE_TRANSACTIONS.md) · [Valve 装配与备份](../reference/VALVE_ASSEMBLY.md)

## 1. 分层与依赖方向

```text
┌─────────────────────────────┐   ┌─────────────────────────────┐
│ src/gui  (Qt Quick 进程)     │   │ src/cli  (控制台进程)        │
│ QML → Controller → Core      │   │ argv → Core                  │
└──────────────┬──────────────┘   └──────────────┬──────────────┘
               │                                 │
               └───────────────┬─────────────────┘
                               ▼
                 ┌───────────────────────────┐
                 │ src/core (静态库 srp_core) │
                 │ 业务规则 · 文件事务 · 解析  │
                 └─────────────┬─────────────┘
                               ▼
                文件系统：游戏 cfg / 用户 cfg / 包暂存区 / 备份历史
                外部资源：Steam 安装清单、配置文件包清单与 ZIP、发布清单 JSON
```

依赖只有一个方向：上层依赖下层，下层不知道上层存在。`srp_core` 的唯一输出是返回值（`ConfigWriteResult`、解析结果、i18n 键），不回调、不发信号、不持有界面状态。

## 2. 硬性依赖规则

1. `srp_core` 不包含 Qt、QML、CLI 头文件，也不引用 GUI 符号；只有 C++17 标准库与平台 API。可脱离根工程单独 `cmake -S src/core -B ...` 构建与测试。
2. CLI 只链接 `srp_core`；GUI 链接 `srp_core` + Qt/HuskarUI。两者都不链接对方的实现，共享代码只能下沉到 Core。
3. QML 只做展示与交互编排，不直接读写文件、不解析 CFG/KV3、不拼接业务路径。所有路径由 Core 推导（如 `cs2CfgPathForInstallDir`）。
4. Controller 只调用 Core 的同步业务函数，并把结果翻译成信号/属性；不允许 Controller 之间互相调用业务函数，只通过信号通信。
5. 本地文件写入不迁移到线程池。理由见第 7 节。

### 为什么不引入 Daemon / IPC / LocalSocket

CLI 与 GUI 是同一份 Core 的两个前端，跨进程一致性由文件状态 + 原子替换 + `StoreLock` + `QFileSystemWatcher` 保证，不需要常驻服务：

- 数据本身是磁盘文件，进程内没有独占的业务状态需要共享；CLI 每次调用都重新探测，GUI 通过文件监听刷新。
- 引入 daemon 会新增生命周期、权限（安装目录写权限）、崩溃恢复、开机自启与卸载清理问题，而这些都不是当前用户故事的一部分。
- 单一写者模型不成立时（用户同时开 GUI 与 CLI），冲突已由“原子替换 + 包更新锁 + 草稿保护提示”覆盖，收益不足以抵消复杂度。

## 3. Core 模块职责

| 头文件 | 职责 | 关键约定 |
| --- | --- | --- |
| `types.h` | `SteamUser` / `DetectionResult` / `Cs2InstallState` 等共享结构 | 纯数据，无行为 |
| `detection.h` | Steam/CS2 路径、账号、版本探测；纯字符串 VDF/ACF 解析 | `cs2CfgPathForInstallDir()` / `cs2AnnotationsPathForInstallDir()` 是路径推导的唯一来源 |
| `config_backup.h` | `ConfigWriteResult`、原子写入、`.bak` + 最多 20 份历史、失败保原文件 | 所有业务写文件都经过 `writeConfigWithBackup` / `removeConfigWithBackup` |
| `actions.h` | 安装/卸载运行环境、基线重置、打开目录、启动游戏 | 返回 `ConfigWriteResult`，错误为可翻译键 |
| `assembly.h` | custom.cfg 指令解析、特性/模式/Valve 装配、装配文件读写 | 保留 BOM、CRLF、注释与个人层字节 |
| `preset.h` | 预设扫描/激活/文件读写/恢复出厂模板 | 文件写入委托 `saveAssemblyFile`，与装配共用备份路径 |
| `catalog.h` | 包条目清单（`catalog.json`）、文件白名单、路径安全 | `catalogSafePath` / `catalogFileAllowed` 是路径校验入口 |
| `packages.h` | 包暂存区、generation 事务、清单下载与校验、按条目暂存 | `StoreLock` 防跨进程并发；失败保留旧 generation |
| `media_config.h` | `cs2_video.txt` 与 KV3 标注解析/合并/应用；地图指南部署 | 保留硬件与未知字段；`isCs2Running()` 为真时拒绝应用视频设置 |
| `vcfg.h` | 用户 VCFG convars/keybinds 统计与清空 | 清空同样走备份写入 |
| `text_document.h` | BOM / CRLF 检测与规范化（`decodeDocument` / `encodeDocument`） | GUI 三个编辑器共用，避免各自实现 |
| `app_update.h` | 版本比较、发布清单解析、站点 URL | 仅接受稳定版本与受信 URL |
| `i18n.h` | 中英文文案表（`tr(key)`） | Core 返回的 `error` 字段是键，由 GUI/CLI 翻译 |

结构评估结论：Core 按“一个领域 = 一个头文件 + 一个 .cpp”组织，不拆 `domain/`、`infra/` 子层；当前 13 个模块之间只有单向依赖（`packages` → `catalog`/`media_config`，`assembly`/`preset` → `config_backup`），没有循环。

## 4. 真实调用链

```text
QML 点击「装配」
  → AssemblyController::requestFeature(moduleId, keys=false)
  → guardDraft()：有未保存草稿则 emit messageNotify(false, presets.external_change_unsaved) 并中止
  → Core: isSrpInstalled → assembleFeature → transformCommands → writeConfigWithBackup
  → 原子替换 custom.cfg，写 .bak 与历史
  → 信号 actionCompleted / messageNotify → QML 刷新

QML 切换预设
  → PresetsController::loadCurrentPreset
  → Core: loadPreset → setPresetEntry → writeConfigWithBackup
  → QFileSystemWatcher(150ms 去抖) → synchronizeCurrentFile → editorContentChanged

GUI 更新配置包（后台）
  → PackageController::updatePackage(id)
  → QtConcurrent::run → Core: StoreLock → 下载 ZIP → 校验 sha256/路径 → 暂存 generations/<id> → current.txt 切换

CLI: srpcfg mode-bind practice --key f6
  → cli main.cpp 解析子命令与参数
  → Core: planModeBinding → applyModeBinding(confirmed) → writeConfigWithBackup
  → stdout i18n 文案 + 退出码
```

## 5. 错误与原子性约定

- 业务函数返回 `ConfigWriteResult { success, changed, error }`。`success` 表示事务完成，`changed` 表示内容确有差异（无差异不产生备份），`error` 是 i18n 键（如 `pkg.write_failed`）或底层可读文本；调用方负责 `tr()` 后展示。不再用 `bool` 表示业务失败。
- `writeConfigWithBackup`：同目录临时文件 → `MoveFileExW(REPLACE_EXISTING)` / POSIX `rename`；Windows 对共享冲突做有限重试。写入前保留 `.bak` 与去重历史（最多 20 份）；失败时目标文件保持完整并恢复旧 `.bak`。
- 包更新使用 generation 目录：内容写入新 `generations/<name>`，成功后以 `writeConfigWithBackup` 覆写 `current.txt` 指针，再清理旧 generation（保留新的 2 份）。失败时 `current.txt` 不动，旧 generation 继续可用。
- `StoreLock` 是进程级锁：Windows 以独占句柄打开 `<store>/.update-lock`，POSIX 以目录创建占位；冲突方得到 `pkg.busy`。进程内另有 `std::recursive_mutex` 保护同一 store 的调用。
- `autoexec.cfg` 只插入/移除受管块，用户原有指令逐字节保留；挂载与解挂同样走原子写入。
- 运行时约束：`isCs2Running()` 为真时拒绝应用 `cs2_video.txt`；标注部署前执行 `validateAnnotation`。逐条实现与边界用例见 [文件事务](../reference/FILE_TRANSACTIONS.md)。

## 6. CLI / GUI 双进程状态模型

| 维度 | GUI | CLI |
| --- | --- | --- |
| 进程生命周期 | 常驻，持有编辑草稿与选中项 | 一次性命令，退出即丢弃状态 |
| 唯一真实状态 | Core 返回值 + 磁盘文件 | 磁盘文件 |
| 外部变化感知 | `QFileSystemWatcher` + 150/180ms 去抖 | 不感知，每次调用重新探测 |
| 并发写保护 | 备份写入 + `StoreLock`（包更新） | 同左 |
| 冲突表现 | 有草稿时只提示，不清空编辑器 | 直接覆盖/失败返回错误键 |

因此 CLI 的写入对 GUI 是“外部变化”：GUI 在无草稿时静默同步编辑器，有草稿时只提示 `presets.external_change_unsaved`，由用户决定保存或放弃。包暂存区是两者唯一共享的可变目录，通过 `setPackageStoreRoot` 可显式重定向（便携包与隔离测试）。

## 7. 启动顺序与线程 / 异步策略

GUI（`src/gui/src/main.cpp`）：

1. 解析诊断参数（`--route` / `--preset` / `--file` / `--store` / `--dark` / `--screenshot` 等）。
2. `QGuiApplication` + 组织名、应用名、版本（来自 Core `applicationVersion()`）；注册图标与 HuskarUI 图标字体。
3. `QQmlApplicationEngine` → `HusApp::initialize`。
4. `PreferencesController`（构造函数内读取 QSettings、应用语言与主题、安装字体）。
5. `PackageController` → `OverviewController`（`languageChanged` 连到 `packageCtrl->refresh`）→ `AppUpdateController` → 两个 `MediaController` → `PresetsController` → `AssemblyController`。
6. 加载 `qrc:/SrPGui/qml/Main.qml`，`objectCreated` 回调处理窗口尺寸/最大化与截图后退出。

顺序即依赖顺序：语言与主题必须早于任何 Controller 读文案；暂存区必须在环境检测之前确定；编辑类 Controller 最后创建，避免启动期二次刷新。

线程边界：只有网络访问跨线程。`PackageController` 与 `AppUpdateController` 用 `QtConcurrent::run` + `QFutureWatcher`，结果回到主线程再改属性/发信号；其余（检测、装配、保存、部署）都是主线程上的有界本地文件事务，GUI 不为其建立状态机。CLI 全同步，无工作线程。构建与测试细节见 [BUILD_AND_RELEASE.md](BUILD_AND_RELEASE.md)。

## 8. 关于 2026-11 审计清单

审计的逐条修复记录（如 `copyToClipboard` 死调用、`autoexec` 流未关闭导致原子替换失败、`installSrp` 顺序依赖）属于变更历史，不在本文重复维护；其中仍有效的结构性结论已写在第 2、5、6、7 节，暂缓项写在 [GUI.md](GUI.md) 第 10 节。新增修复无需回填本文章。
