# 组件规范 (Components)

> 本文档规定 SrP-CFG 客户端在 `src/gui/qml/` 中的组件选型顺序、封装组件的职责边界，以及 `objectName` / `Accessible` 约定。视觉取值见 [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)，交互行为见 [UX_GUIDELINES.md](UX_GUIDELINES.md)。

---

## 1. 选型顺序：HuskarUI-first

按下表从上到下选择，能落在上一档就不要自己造：

| 档位 | 内容 | 说明 |
| :--- | :--- | :--- |
| 1. HuskarUI 原生组件 | `HusWindow`、`HusInput`、`HusSelect`、`HusCheckBox`、`HusToolTip`、`HusScrollBar`、`HusDivider`、`HusMessage`、`HusCaptionButton`、`HusModal` | 默认选择。自带主题联动、键盘行为与无障碍基础 |
| 2. 本项目封装 | `AppButton`、`AppIcon`、`AppSidebar`、`AppHeaderExtras`、`AppModal`、`AppCodeEditor`、`AppFeedback`、`PackagePanel`、`RuntimePanel`、`MediaEditorPanel`、`AssemblyModuleCard` | 当原生组件不足以表达本项目语义（令牌、反馈通道、复合布局）时使用 |
| 3. 原生 QtQuick | `Rectangle` / `Item` / `Text` / `RowLayout` / `ColumnLayout` / `Flickable` | 仅用于布局与容器（见第 4 节），不用于可交互控件的自造 |

卡片在本项目里**不是** `HusCard`：统一用 `Rectangle` + `color: MetaTheme.cardBg` + `border.color: MetaTheme.cardBorder` + `radius: MetaTheme.radiusLg`，以保证层级表达策略（边框而非阴影）一致。

---

## 2. HuskarUI 组件映射表

| 组件 | 本项目用法 | 关键属性 / 约束 |
| :--- | :--- | :--- |
| `HusWindow` | `Main.qml` 根对象 | `minimumWidth: 980`、`minimumHeight: 640`、`color: MetaTheme.canvasBg`；定制 `captionBar`（`color: MetaTheme.sidebarBg`、`winIcon`、`winTitleColor`、`showThemeButton: false`、`showTopButton: false`）；交互项通过 `captionBar.addInteractionItem()` 注入 |
| `HusCaptionButton` | 标题栏主题切换（`AppHeaderExtras`） | `Layout.preferredWidth: 38`、`iconSource` 在 `HusIcon.BulbOutlined` / `HusIcon.BulbFilled` 间切换，`onClicked: PreferencesController.setDarkMode(!HusTheme.isDark)`，必须配 `HusToolTip` |
| `HusMessage` | `Main.qml` 唯一反馈宿主（`objectName: "appFeedbackHost"`） | 挂在 `captionBar` 下沿、`width: mainWindow.width`、`z: 999`、`colorBg: MetaTheme.cardBg`、`colorMessage: MetaTheme.textPrimary`；通过 `AppFeedback.host` 绑定，页面不得另建消息条 |
| `HusModal` | 仅通过 `AppModal` 使用 | 不直接实例化；确认/取消按钮由 `AppModal` 提供 `AppButton` delegate |
| `HusInput` | 路径与搜索字段 | 只读路径固定 `readOnly: true` + `selectByMouse: true` + `onTextChanged: cursorPosition = 0`；底色 `colorBg: MetaTheme.surfaceSoft`、文字 `colorText: MetaTheme.textPrimary`；完整值用 `HusToolTip` |
| `HusSelect` | 预设/文件/账号/视频选项/字体选择 | 必设 `textRole` + `valueRole`、`clearEnabled: false`；`sizeHint: "small"` 用于紧凑行；图标或纯选项下拉补 `contentDescription`；`showToolTip: true` 用于长文本 |
| `HusCheckBox` | 装配模块选择、地图指南选择 | `colorText: MetaTheme.textPrimary`、`colorIndicator` 取 `MetaTheme.starkBlack` / `MetaTheme.cardBg`；不用于二选一的设置项（那用两个 `AppButton`） |
| `HusScrollBar` | 所有 `Flickable` 的纵向滚动 | `ScrollBar.vertical: HusScrollBar {}`；代码编辑器内按 `AsNeeded` / `AlwaysOff` 动态切换 `policy` |
| `HusDivider` | 关于页“链接”与“作者”分区的分隔 | `colorSplit: MetaTheme.divider`、`animationEnabled: HusTheme.animationEnabled`；卡片内轻分割可直接用 1px `Rectangle color: MetaTheme.divider` |
| `HusToolTip` | 截断文本、图标按钮、危险动作的解释 | 必须由触发元素自己持有；不要把长文案塞进 `Text.elide` 后不给提示 |
| `HusTheme` | 主题单例 | 只读 `isDark`、`animationEnabled`、`Primary.fontPrimaryFamily`；配色一律经 `MetaTheme` 间接引用 |
| `HusIcon` | 图标常量 | 只用作 `iconSource: HusIcon.XxxOutlined` 这类常量，不拼字符串 |
| `HusApi` | 剪贴板 | `HusApi.setClipboardText(...)` 后立即给出 `AppFeedback.success(...)` 反馈 |

---

## 3. 本项目封装组件

| 组件 | 基类 | 职责 | 使用边界 |
| :--- | :--- | :--- | :--- |
| `AppButton` | `HusIconButton` | 把 `HusButton.Type_Primary` / `Type_Default` / `Type_Text` 映射到 `MetaTheme` 令牌；关闭扩散波纹（`effectEnabled: false`）；统一 `radiusBg.all: MetaTheme.radiusMd` | **所有**按钮都用它（含纯图标按钮）。不要直接实例化 `HusButton` / `HusIconButton`，否则会丢掉令牌与动效策略 |
| `AppIcon` | `Item` + `MultiEffect` | 把 SVG 图标按 `color` 着色，`sourceSize` 按 2× 采样保证清晰 | 只用于**单色**图标；多色品牌图（CS2 logo、头像）直接 `Image` |
| `AppSidebar` | `Rectangle` | 一体化侧栏：主导航、可折叠的“CFG 自由装配”组、底部运行状态卡与“关于/设置”；对外暴露 `activeRoute`、`assemblyRequested`、`aboutRequested`、`settingsRequested` | 路由状态的唯一持有者。内部 `NavItem` / `NavSubItem` 为私有内联组件，不要跨文件复用 |
| `AppHeaderExtras` | `RowLayout` | 标题栏右侧账号胶囊（头像 + 名称 + 下拉角标）与主题切换按钮；`onRequestAccountSwitch` 交由 `Main.qml` 处理 | 通过 `captionBar.addInteractionItem` 注入，不要在标题栏区域另起布局 |
| `AppModal` | `HusModal` | 统一弹窗外观（`colorBg: cardBg`、`radiusLg`）与 `AppButton` 确认/取消 delegate | 所有确认弹窗的唯一入口；用 `openWarning()` 打开，业务逻辑放 `onConfirm` |
| `AppCodeEditor` | `Rectangle` | CFG/媒体配置编辑视口：`CodeEditorGutter`（C++ 行号槽）+ `TextEdit`（等宽、`NoWrap`、`PlainText`）+ 双 `HusScrollBar` + 24px 底部状态栏（路径、缩放百分比、行数、`UTF-8`、语法标签）；内置 `Ctrl+=` / `Ctrl+-` / `Ctrl+0` 缩放（9–28，默认 12）与 100% 复位 | 仅用于文本配置文件编辑。外部通过 `text` / `readOnly` / `editorController` / `currentFilePath` / `syntaxLabel` 驱动，不要在页面里重写内部 TextEdit |
| `AppFeedback` | `QtObject` 单例 | 转发 `success(message)` / `error(message)` 到 `HusMessage` 宿主 | 全项目唯一提示入口；宿主不存在时静默丢弃 |
| `PackagePanel` | `Rectangle` | 展示单个配置包版本、更新状态与操作（`packageId` 取 `srp-cfg` / `video` / `annotations`） | 包相关操作集中在它内部，页面只给 `packageId` |
| `RuntimePanel` | `Rectangle` | 总览页的 SrP-CFG 运行时卡片：装配状态、版本徽标、检查/更新入口 | 只出现在总览页，宽度跟随左列卡片 |
| `MediaEditorPanel` | `Rectangle` | 媒体配置编辑器容器：文件 `HusSelect`、复位/保存按钮、`AppCodeEditor`、`Ctrl+S` 保存 | 视频与地图标注页共用，通过 `controller` 与 `pageVisible` 注入 |
| `AssemblyModuleCard` | `Rectangle` | 装配页单个模块卡：启用开关、按键手势、命令预览与复制、添加/移除 | 只服务于装配页模块列表 |

---

## 4. 何时允许原生 QtQuick

**允许**：

- 布局与容器：`RowLayout` / `ColumnLayout` / `Item` / `Rectangle`（卡片、卡片内嵌块、圆形头像底、1px 分割线）。
- 文本：页面标题、字段标签、数值、状态栏元信息（需要精确控制 `pixelSize` / `elide` / `wrapMode` 时用 `Text`）。
- 滚动：`Flickable` + `HusScrollBar`，`boundsBehavior: Flickable.StopAtBounds`。
- 轻量交互层：悬停/选中的 `opacity` 图层、焦点描边层、`MouseArea`、`HoverHandler`。
- 系统对话框：`FolderDialog`（选择 Steam / CS2 / 媒体目录）。
- 图表/视口类无 HuskarUI 对应物的内容（`Image`、`MultiEffect`）。

**不允许**：自造按钮、输入框、下拉框、复选框、开关、弹窗、toast、滚动条、工具提示。这些已有 HuskarUI 组件或本项目封装；自造会破坏主题联动、键盘行为与一致性。

---

## 5. objectName 约定

- 命名 `camelCase`，语义前缀 + 控件类型或动作，全局唯一。
- 页面根：`aboutPage`、`settingsPage`、`assemblyWorkspace`；提示宿主：`appFeedbackHost`。
- 导航：`navAbout`、`navSettings`（其余导航项靠 `Accessible.name` 定位）。
- 动作：`valveSaveButton`、`valveResetButton`、`valveAssembleButton`、`valveUnloadButton`、`settingsSave`、`settingsCancel`、`mediaSaveButton`、`videoApplyButton`、`annotationDeployButton`、`appUpdateCheck`。
- 状态文本：`appUpdateStatus`；选项：`languageZh`、`languageEn`、`themeLight`、`themeDark`、`fontSearch`、`fontSelect`、`storePath`、`mediaFileSelect`、`valveFileSelect`、`openStore`。
- 弹窗：`assemblyBindingModal`、`valveReplaceModal`。
- Repeater/动态行：`<名称>_<模型标识>`，如 `guideChoice_<guideId>`、`guideCopy_<guideId>`、`moduleAdd_<moduleId>`、`moduleRemove_<moduleId>`、`moduleKeys_<moduleId>`、`launchKey_<moduleId>`、`videoOption_<key>`、`aboutLink_<kind>`。
- 滚动视口：`editorFlickable`、`assemblyOperationScroll`、`assemblyOuterScrollBar`、`videoOperationsScroll`。
- 约束：`objectName` 是 QML 控制器/界面测试的查找键，**不得随语言或主题变化**，重命名必须同一次提交内更新测试。

---

## 6. Accessible 与替代表述

- 可点击的自定义容器（导航项、装配组头）必须设置：`Accessible.role: Accessible.Button`、`Accessible.name`（当前语言的可见标签）、`Accessible.focusable: true`、`Accessible.onPressAction`，并处理 `Keys.onPressed` 的 Enter / Return / Space。
- 图标按钮与纯图标入口必须给 `contentDescription`（HuskarUI 组件的无障碍/提示属性），例如复制按钮传 `page.t("valve.copy")`。
- 被 `elide` 截断的文本必须配 `HusToolTip`（侧边栏用 `visible: labelText.truncated`）。
- 复选框的 `text` 即其可访问名称，不要留空再用相邻 `Text` 冒充标签。
- 焦点可见性由元素自己提供 1px `primaryColor` 描边，不得依赖系统默认绘制。

---

## 7. 新增组件流程

1. 先确认第 1 节第 1、2 档都无法表达需求，再写第 3 档。
2. 颜色、圆角、字号全部来自 `MetaTheme`；`Behavior` 全部受 `HusTheme.animationEnabled` 控制。
3. 组件放在 `src/gui/qml/components/`，命名 `App*`（封装）或语义名（业务组件），并在本文件第 3 节加一行职责与边界。
4. 暴露属性用 `property` / `signal`，内部实现不向上泄漏（不暴露内部 `Rectangle` 或 `TextEdit` 引用）。
5. 需要被测试或脚本定位的关键节点补 `objectName`，可点击节点补 `Accessible`。
6. 在浅色、深色、980 × 640 三种条件下确认外观与可用性，再更新截图。
