# Meta 高级黑白极简设计语言系统 (Meta Stark Monochrome Design System)

> 本文档规范 SrP-CFG 客户端的视觉设计哲学、色彩令牌、排版体系、层级表达与主题机制。视觉取值的唯一事实来源是 [`src/gui/qml/MetaTheme.qml`](../../src/gui/qml/MetaTheme.qml)；本文档与之不一致时以代码为准，并应立即修正本文档。交互规则见 [UX_GUIDELINES.md](UX_GUIDELINES.md)，组件选型见 [COMPONENTS.md](COMPONENTS.md)。

---

## 1. 核心设计哲学 (Design Philosophy)

- **告别廉价浓郁彩色**：摒弃工具软件常见的饱和蓝与花哨渐变，以黑曜石（Obsidian）、钛晶白与冷灰阶作为视觉基座。
- **极致反差与克制点缀 (Stark Contrast)**：
  - **浅色模式 (Light)**：极轻冷白画布配曜黑主交互元素，具备现代印刷与画廊工业质感；
  - **深色模式 (Dark)**：黑曜石沉浸背景配纯白主操作按钮，暗室中清晰可辨；
  - **语义状态极度克制**：成功/警示/危险只以 5–8px 指示点、状态小徽标或数值高光出现，绝不用大面积彩底抢夺焦点。浅色模式下语义色使用加深变体以保证对比度（见 2.6）。
- **一体化与空间呼吸感 (Seamless Continuity)**：定制标题栏与侧边栏同色贯通；卡片以 1px 微描边表达层级，只有侧边栏与内容区的交界使用一条轻量边缘阴影。
- **静止优先 (Calm by Default)**：动效只用于状态切换，不做装饰性弹跳与波纹；关闭系统动画后界面必须完全可用。

---

## 2. 颜色设计令牌 (Color Tokens)

全部令牌随 `HusTheme.isDark` 自适应，写作 `HusTheme.isDark ? dark : light`。

### 2.1 核心黑白与主操作色

| 令牌名 | Light | Dark | 用途 |
| :--- | :--- | :--- | :--- |
| `primaryColor` | `#141517` | `#ffffff` | 主按钮底色、选中指示条、焦点描边 |
| `primaryHover` | `#27272a` | `#e4e4e7` | 主按钮悬停 |
| `primaryPressed` | `#000000` | `#d4d4d8` | 主按钮按下 |
| `primaryTint` | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.09)` | 文本选区、轻量强调底 |
| `onPrimaryText` | `#ffffff` | `#09090b` | 主按钮文字与图标 |

`starkBlack` `#141517`、`starkWhite` `#ffffff`、`obsidian` `#09090b` 是上述令牌的基础常量，业务代码优先使用语义令牌。

### 2.2 次级/默认按钮 (Default Button Palette)

浅色模式下必须给出实体底色，否则会出现“白底白按、悬停不明显”的问题。

| 令牌名 | Light | Dark | 用途 |
| :--- | :--- | :--- | :--- |
| `btnDefaultBg` | `#f1f3f5` | `rgba(255,255,255,0.05)` | 默认按钮常态底色 |
| `btnDefaultHoverBg` | `#e2e6ea` | `rgba(255,255,255,0.11)` | 悬停底色 |
| `btnDefaultPressedBg` | `#d8dde2` | `rgba(255,255,255,0.18)` | 按下底色 |
| `btnDefaultBorder` | `#e2e8f0` | `rgba(255,255,255,0.10)` | 常态 1px 边框 |
| `btnDefaultHoverBorder` | `#cbd5e1` | `rgba(255,255,255,0.22)` | 悬停/按下边框 |
| `btnDefaultText` | `#1e293b` | `#f4f4f5` | 默认按钮文字 |

### 2.3 侧边栏交互态

| 令牌名 | Light | Dark | 用途 |
| :--- | :--- | :--- | :--- |
| `sidebarHoverBg` | `#e2e6ea` | `rgba(255,255,255,0.06)` | 导航项悬停层、账号胶囊悬停层 |
| `sidebarSelectedBg` | `#ffffff` | `rgba(255,255,255,0.10)` | 选中导航项底色 |
| `sidebarSelectedBorder` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.12)` | 选中导航项描边 |
| `sidebarSelectedBorderWidth` | `1` | `1` | 选中描边宽度 |

### 2.4 表面与画布

| 令牌名 | Light | Dark | 用途 |
| :--- | :--- | :--- | :--- |
| `canvasBg` | `#fbfcfd` | `#09090b` | 窗口与内容区底色 |
| `sidebarBg` | `#f3f4f6` | `#101114` | 侧边栏与标题栏底色 |
| `cardBg` | `#ffffff` | `#15171b` | 卡片、编辑器容器、弹窗底色 |
| `surfaceSoft` | `#f3f4f6` | `rgba(255,255,255,0.04)` | 卡片内嵌块、只读输入底、头像底 |
| `cardBorder` | `rgba(0,0,0,0.07)` | `rgba(255,255,255,0.09)` | 1px 卡片描边 |
| `divider` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.07)` | 分割线（侧边栏与内容区之间、卡片内分区） |
| `edgeShadow` | `rgba(15,23,42,0.08)` | `rgba(0,0,0,0.45)` | 侧边栏/内容区交界的轻量边缘阴影渐变起始色 |

### 2.5 文本层级

| 令牌名 | Light | Dark | 层次 |
| :--- | :--- | :--- | :--- |
| `textPrimary` | `#09090b` | `#f4f4f5` | 页面标题、卡片标题、核心数值 |
| `textSecondary` | `#52525b` | `#a1a1aa` | 字段标签、副标题、导航普通项 |
| `textTertiary` | `#64748b` | `#71717a` | 说明、时间戳、状态栏元信息 |
| `textDisabled` | `#a1a1aa` | `#52525b` | 禁用文字、未选中子项圆点 |

### 2.6 克制的语义状态

浅色模式使用加深变体，保证在 `#ffffff` / `#fbfcfd` 上可读；深色模式使用提亮变体。

| 令牌名 | Light | Dark | 表现规范 |
| :--- | :--- | :--- | :--- |
| `statusSuccess` | `#047857` | `#34d399` | 就绪/已装配：5px 圆点、状态文字、结果徽标 |
| `statusWarning` | `#b45309` | `#fbbf24` | 未定位/待处理/未保存草稿提示 |
| `statusCritical` | `#b91c1c` | `#f87171` | 缺失、清空、卸载等危险动作的悬停文字 |
| `watermark` | `rgba(0,0,0,0.03)` | `rgba(255,255,255,0.04)` | 极低对比水印底 |

### 2.7 代码编辑器视口

| 令牌名 | Light | Dark | 用途 |
| :--- | :--- | :--- | :--- |
| `editorBg` | `#f8fafc` | `#0c0d10` | 编辑视口底色 |
| `editorGutterBg` | `#f1f5f9` | `#121418` | 行号槽与底部状态栏 |
| `editorBorder` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` | 视口描边与状态栏上边线 |

---

## 3. 层级表达：边框优先，阴影仅限交界

- **卡片一律用边框表达层级**：`color: MetaTheme.cardBg` + `border.color: MetaTheme.cardBorder` + `border.width: 1` + `radius: MetaTheme.radiusLg`。禁止给卡片叠加 `DropShadow` / `MultiEffect` 做“浮起”。
- **卡片层级中唯一允许的阴影**是内容区左缘的 12px 水平渐变：起点 `MetaTheme.edgeShadow`，终点 `transparent`，`z: 5`，用于让侧边栏与内容区的交界有轻微层次，替代逐卡片阴影的高开销做法。`HusModal` 自带的弹窗阴影属于组件库行为，不在此限制内。
- 卡片与内容块不做悬停位移或缩放；悬停反馈只出现在可交互元素（导航项、按钮、账号胶囊）上，并且用独立的 `opacity` 图层切换，**不要对 `transparent` 与颜色做插值**（会产生灰黑闪烁）。

---

## 4. 圆角、间距与字体

### 4.1 圆角

- `radiusSm` 4：子导航项、微徽标、缩放百分比小块
- `radiusMd` 8：按钮、输入框、导航项、代码编辑器视口
- `radiusLg` 12：卡片、弹窗、媒体编辑面板
- `radiusXl` 16：预留的顶层大容器
- `radiusPill` 100：标题栏账号胶囊、头像圆点

### 4.2 间距标尺

- 4 / 6：图标与文字、紧凑行内间距
- 8 / 10：按钮组、表单行内间距
- 12 / 16：卡片内部 `anchors.margins`（普通卡 16，Hero 卡 12）
- 16 / 24：页面级 `margins`（总览 16，预设/视频/标注 24）
- 正文列宽上限 `Math.min(parent.width - 48, 920)`，避免超宽行长

### 4.3 字体

- 正文族取自 `MetaTheme.fontFamily`（即 `HusTheme.Primary.fontPrimaryFamily`），随设置页选择的普通字体变化；不要硬编码族名。
- 代码族固定为 `"Cascadia Code, JetBrains Mono, Consolas, monospace"`，不随界面字体变化。
- 字号阶梯：10（状态栏、元信息）、11（标签、子导航）、12（正文、导航）、13（卡片标题）、18/20/22（页面标题与产品名）、28（指标大数字）。
- 加粗只用于标题、选中项与关键数值，不做全篇强调。

---

## 5. 按钮形态

- 主按钮：`type: HusButton.Type_Primary`，浅色曜黑底白字、深色纯白底黑字，无边框。
- 默认按钮：`type: HusButton.Type_Default`，使用 2.2 的调色板，保留 1px 边框，悬停/按下时底色与边框同时加深。
- 文字按钮：`type: HusButton.Type_Text`，常态透明、悬停 `surfaceSoft`，用于“重新检测”这类次级操作。
- 危险动作不用红色实底；在默认按钮上叠加悬停态红/琥珀底色与 `statusCritical` / `statusWarning` 文字，且必须经过二次确认（见 UX 规则）。
- 全部按钮统一 `radiusBg.all: MetaTheme.radiusMd`，并禁用 HuskarUI 外圈扩散波纹（`effectEnabled: false`）。

---

## 6. 动效规范（减少动效）

- 所有 `Behavior` 必须带 `enabled: HusTheme.animationEnabled`，动画关闭时界面直接跳到终态。
- 时长参考：悬停淡入 90ms、选中淡入 110ms、展开/折叠 180–220ms，缓动统一 `Easing.OutQuad` / `Easing.InOutQuad`。
- 无按钮缩放弹跳、无卡片上浮、无页面 3D 位移；页面切换是 `visible` 直接切换，不做转场动画。
- 动画对象限于 `opacity`、`rotation`、`Layout.preferredHeight` 这类廉价属性；不要给阴影或颜色做长动画。

---

## 7. 主题持久化与浅/深色切换

- 用户偏好存于 `QSettings`（`SrP` / `SrP-CFG`），键名 `ui/darkMode`，由 `PreferencesController` 在构造时读取并调用 `HusTheme::instance()->setDarkMode(...)`，因此重启后直接以保存值渲染。
- 运行时切换入口有两处，都调用 `PreferencesController.setDarkMode(bool)`：标题栏 `AppHeaderExtras` 里的 `HusCaptionButton`（灯泡图标，`HusIcon.BulbOutlined` / `HusIcon.BulbFilled`）与设置页的“浅色/深色”按钮组。切换立即写回 `ui/darkMode` 并 `sync()`，失败时回滚。
- 命令行 `--dark` / `--light` 只用于抓图与诊断，会覆盖已保存值但不写回偏好。
- 代码一律通过 `MetaTheme` 取色，禁止在页面里写死主题相关的颜色字面量；需要随主题变化的逻辑用 `Connections { target: HusTheme; function onDarkModeChanged() }` 通知控制器刷新（如语法高亮）。
- 反向约束：主题切换后不允许出现白底白字、深灰插值闪烁或残留旧色块；每个页面都要在两种主题下目视确认。

---

## 8. 落地检查清单

- [ ] 颜色是否全部来自 `MetaTheme`，没有新增字面量？
- [ ] 卡片是否只用 1px 边框表达层级，阴影只出现在侧边栏/内容区交界？
- [ ] 主按钮在浅色下是否曜黑底白字、深色下纯白底黑字，且悬停/按下可辨？
- [ ] 浅色模式语义色是否使用 `#047857` / `#b45309` / `#b91c1c` 加深变体？
- [ ] 所有 `Behavior` 是否受 `HusTheme.animationEnabled` 控制，且没有缩放弹跳？
- [ ] 浅色/深色切换后是否 0 报错、无闪烁、无错位，且重启后保持上次主题？
- [ ] 最小窗口 980 × 640 下内容是否仍可滚动完整可见？
