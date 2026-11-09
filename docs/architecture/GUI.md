# GUI 层：QML / Controller / Core

本文描述 `src/gui` 的实际结构：QML 界面、控制器（`src/*_controller.*`）与 `srp_core` 的分工，以及路由、监听、主题与异步边界。分层总览见 [OVERVIEW.md](OVERVIEW.md)。

## 1. 三层关系

```text
src/gui/qml/                 src/gui/src/                      src/core
Main.qml / pages/*.qml   →   *Controller (QObject 单例)     →   srp::core::* 同步函数
（展示、交互、绑定时长）      （状态缓存、信号、i18n 转换）        （文件事务、解析、网络）
```

QML 不出现文件路径、不调用 `QFile`、不解析配置；控制器不写 QML 组件、不持有界面对象；Core 不认识 Qt 类型。三处唯一的跨界契约是：控制器用 `Q_INVOKABLE` 暴露动作、用 `Q_PROPERTY` 暴露状态、用 `messageNotify(bool, QString)` 汇报结果。

## 2. 注册与构造顺序

`src/gui/src/main.cpp` 按依赖顺序创建，并全部注册为 `SrPGui` 模块的 QML 单例：

| 顺序 | 实例 / QML 名 | 说明 |
| --- | --- | --- |
| 1 | `PreferencesController` | 构造函数内即读取 QSettings 并应用语言、字体与主题，必须早于任何读文案的控制器 |
| 2 | `PackageController` | 构造函数内调用 `initializePackages()`，确定暂存区与首次运行初始化 |
| 3 | `OverviewController` | 环境检测；其 `languageChanged` 显式连接到 `PackageController::refresh` |
| 4 | `AppUpdateController` | 仅持 `QFutureWatcher`，无启动期 IO |
| 5 | `VideoController` / `AnnotationsController` | 同类的两个 `MediaController` 实例（`video=true/false`） |
| 6 | `PresetsController` | 读取预设列表与编辑器文档，命令行 `--preset` / `--file` / `--zoom` 在此应用 |
| 7 | `AssemblyController` | 依赖预设与环境状态；`--route assembly_*` 时预开文件 |

`CodeEditorGutter` 以 `qmlRegisterType` 注册；`Cs2CfgHighlighter` 由控制器通过 `attachHighlighter(QQuickTextDocument*, bool)` 安装，QML 不直接创建。

## 3. 控制器职责

| Controller（实例） | 页面 | 职责 | 关键状态 / 信号 |
| --- | --- | --- | --- |
| `OverviewController` | `OverviewPage`，标题栏 `AppHeaderExtras` | 环境探测（Steam/CS2/账号/版本/cfg 路径）、账号切换、Convars 统计、安装/卸载/基线重置、清空 convars/keybinds、语言切换、打开目录、启动游戏 | 18 个属性（`detectionChanged` / `accountChanged` / `convarsChanged` / `srpInstallStateChanged` / `languageChanged`），`promptInstallSrp`、`messageNotify` |
| `PresetsController` | `PresetsPage` | 预设列表与激活、文件选择、编辑器文档与脏标记、缩放、语法高亮、安装引导、恢复出厂文件 | `availablePresets` / `selectedPreset*` / `editorContent` / `isEditorDirty` / `editorFontSize`，`presetsChanged`、`editorContentChanged`、`editorDirtyChanged`、`promptInstallSrp` |
| `AssemblyController` | `AssemblyPage` + `AssemblyModuleCard` | Valve 基线装配/解挂、Feature/Mode 装配、冲突与覆盖确认、统一工作区文档编辑 | `modules` / `availableFiles` / `settingsAssembled` / `keymapAssembled` / `isBusy` / `canSave`，`promptBindingConflict`、`promptReplacePreset`、`actionCompleted`、`busyChanged` |
| `MediaController`（Video） | `VideoPage` + `MediaEditorPanel` | `cs2_video.txt` 的 KV3 编辑、字段选择、校验、应用（CS2 运行中拒绝）、过期检测 | `options` / `validationError` / `outdated` / `baseVersion`，`stateChanged`、`actionCompleted` |
| `MediaController`（Annotations） | `AnnotationsPage` + `MediaEditorPanel` | 地图指南列表、单文件编辑与校验、安装/卸载所选指南、外部冲突标记 | `guides` / `availableFiles` / `validationError`，`catalogChanged`、`stateChanged` |
| `PackageController` | `RuntimePanel` / `PackagePanel` | 包清单检查与更新（后台）、状态横幅、更新徽标 | `packages` / `busy` / `status`，`packageChanged`、`messageNotify` |
| `AppUpdateController` | `AboutPage` | 软件版本检查（后台）、发布信息与链接 | `version` / `busy` / `status` / `latestVersion` / `releaseNotes` / `updateAvailable` / `website` / `blog` / `project` / `releases` |
| `PreferencesController` | `SettingsPage` | 语言、字体、主题、暂存区路径展示与打开 | `language` / `fontFamily` / `effectiveFontFamily` / `fontFamilies` / `storePath` / `darkMode`，`preferencesChanged` |

控制器之间不互相调用业务函数；唯一的显式连接是 `OverviewController::languageChanged → PackageController::refresh`（由 `main.cpp` 建立），避免 `PackageController` 在语言变化后仍显示旧文案。

## 4. QVariantList 数据形状

所有列表都是 `QVariantList<QVariantMap>`，字段名即 QML 访问名，没有 `QAbstractListModel`：

| 属性 | 字段 |
| --- | --- |
| `usersList` | `name`, `accountId`, `steamId64`, `avatar`（`file://` URL 字符串） |
| `availablePresets` | `id`, `displayName`, `command`, `hasDiff`, `descriptionZh`, `descriptionEn`, `files[]`, `tagsZh[]`, `tagsEn[]`, `label`（`displayName` + ` (*)`） |
| `availableFiles`（预设） | `label`, `value`：`settings.cfg` / `keymap.cfg` / `user/custom.cfg` |
| `availableFiles`（装配） | `label`（带 `(*)` 表示与出厂模板不同）, `value`（相对路径） |
| `modules` | `id`, `name`, `category`, `directory`, `command`, `keymapCommand`, `settings`, `keymap`, `launchKeys[]`, `legacyAutoLoad` |
| 视频 `options` | `key`, `label`, `choices[{label, value}]`, `index` |
| 指南 `guides` | `id`, `name`, `installed`, `matches`, `command` |
| 指南 `availableFiles` | `label`（文件名 + `(*)`）, `value`（索引） |
| `packages` | `id`, `version`, `latest`, `updateAvailable` |

草稿保护相关的一致性规则：列表刷新时若当前项已被外部删除或改写，控制器会把当前项的旧元数据重新插入列表，保证 `selected*` 索引与编辑器内容不跳变。

## 5. 页面路由

`Main.qml` 不使用 `StackView`/`Loader`，而是把所有页面同时实例化，用 `sidebar.activeRoute` 控制 `visible`，因此切页不销毁编辑状态：

| 路由值 | 页面 |
| --- | --- |
| `overview` | `OverviewPage` |
| `presets` | `PresetsPage` |
| `assembly_baseline` / `assembly_features` / `assembly_modes` / `assembly_usercfg` | `AssemblyPage`（`visible: activeRoute.startsWith("assembly_")`，内部锚点滚动，见 [自由装配工作区](../reference/ASSEMBLY_WORKSPACE.md)） |
| `video_settings` | `VideoPage` |
| `map_guides` | `AnnotationsPage` |
| `about` | `AboutPage` |
| `settings` | `SettingsPage` |

关于与设置**已是页面路由**，不再是弹窗；路由可见性天然保留编辑器草稿与页面状态。持久化、更新检查与验证记录见 [关于、设置与软件版本检查](../reference/APP_DIALOGS_AND_UPDATES.md)。

启动入口：`engine.setInitialProperties({{"initialRoute", ...}})` 把 `--route` 传给 `Main.qml`；`AppSidebar` 初始化 `activeRoute`，`AssemblyPage.initialSection` 用它决定首屏滚动位置。`Component.onCompleted` 只在 `about`/`settings` 时再确认一次，避免非法路由落空白。

## 6. 文件监听与草稿保护

三个编辑类控制器都持有 `QFileSystemWatcher` + 单次 `QTimer` 去抖（预设 150 ms、装配 150 ms、媒体 180 ms），同时监听目标文件与其父目录，用于覆盖原子替换导致的 inode 变化。

| 场景 | 行为 |
| --- | --- |
| 外部变更、本地无草稿 | 静默重载内容并重置脏标记（`synchronize*` / `refresh`） |
| 外部变更、本地有草稿 | 保留本地内容，仅提示一次（`presets.external_change_unsaved`）；媒体额外置 `m_externalConflict`，阻止应用直到用户处理 |
| 切换文件/预设、执行装配 | `guardDraft()` / `canChangeCustomCfg()` 先拦截并提示保存（`valve.save_first` / `presets.save_before_load`） |
| 写回文件 | 走 `encodeDocument` 还原 BOM/CRLF；保存成功后重载文档，因此 `.bak` 与磁盘内容始终是唯一真源 |

`isEditorDirty` 一律通过“当前内容 ≠ 上次读盘内容”判断，不依赖 QML 侧计数。

## 7. 主题与偏好持久化

- 持久化介质是 `QSettings`（`IniFormat`、`UserScope`、组织 `SrP`、应用 `SrP-CFG`），键为 `ui/language`、`ui/fontFamily`、`ui/darkMode`。
- `PreferencesController` 构造时应用：`srp::core::setLanguage()` → `OverviewController::setLanguage()` → `HusTheme::instance()->setDarkMode()` → `QGuiApplication::setFont()` + `HusTheme::installThemePrimaryFontFamiliesBase()`。因此在 QML 加载前主题与字体已就位，无闪烁。
- 主题切换即时生效并立即落盘；`QSettings::status() != NoError` 时回滚内存状态并提示 `preferences.save_failed`。语言与字体在 `SettingsPage` 中先存草稿（`draftLanguage` / `draftFont`，含 `dirty` 标记），点保存才提交，失败不改变界面。
- 颜色/尺寸令牌集中在 QML 单例 `MetaTheme`（`HusTheme.isDark` 驱动），组件不硬编码色值；设计规范见 [DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md)。
- 命令行诊断覆盖：`--dark` / `--light` 在 `PreferencesController` 构造之后覆盖主题，`--en` 强制英文；这类参数只影响当前会话，不回写 QSettings。

## 8. 异步与主线程边界

- 仅网络操作使用 `QtConcurrent::run` + `QFutureWatcher`：`PackageController`（`checkPackageUpdates` / `updatePackage`）、`AppUpdateController`（`checkAppUpdate`）。工作线程只调用 Core 并返回结果结构体，不触碰任何 `QObject`；`finished` 回到主线程后再改属性、发信号。
- 结果应用有显式降级：静默检查（`checkUpdatesSilently`）失败不弹提示，只保留状态文案；`PackageController` 析构时 `waitForFinished()`，避免线程引用已销毁对象。
- 其余操作（探测、装配、保存、部署、基线重置）都在主线程同步执行：它们是单文件或单目录的有界事务，引入线程会带来草稿/监听/生命周期竞态；单次耗时不足以触发 UI 冻结。
- QML 侧不做 `XMLHttpRequest`/`fetch`，所有远端访问统一经 Core 的 WinHTTP 实现，便于校验与超时控制（见 [配置暂存、视频设置与地图标注](../reference/CONFIG_PACKAGES_AND_MEDIA.md)）。

## 9. 共享编辑器与组件

- `Cs2CfgHighlighter`：`QSyntaxHighlighter` 适配器，控制器通过 `attachHighlighter(document, isDark)` 安装，`updateTheme(isDark)` 重刷配色。
- `CodeEditorGutter`：`QQuickItem` 行号栏，`qmlRegisterType` 注册后在 `AppCodeEditor` 中使用。
- `AppCodeEditor` 统一承载文本区、`CodeEditorGutter` 行号欄与缩放；语法高亮不由组件自行创建，而由控制器 `attachHighlighter` 安装。`MetaTheme` / `AppFeedback` 是 QML 单例（`QT_QML_SINGLETON_TYPE`）。
- `AppFeedback` 把 `success/error` 转发到 `Main.qml` 中的 `HusMessage`，四个控制器（Overview / Package / Preferences / AppUpdate）的 `messageNotify` 都在 `Main.qml` 内集中连接，页面无需各自实现提示。

## 10. 已知暂缓项

- 不拆分 `controllers/` / `models/` / `services/` 目录，也不引入 `QAbstractListModel`：当前列表规模与嵌套深度用 `QVariantList` 足够。
- 本地文件写入不迁移到线程池（理由见第 8 节与 [OVERVIEW.md](OVERVIEW.md)）。
- 不实现 GUI ↔ CLI 的实时联动（无 IPC/daemon），依靠文件监听 + 刷新覆盖。
