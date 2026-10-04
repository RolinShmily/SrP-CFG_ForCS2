# Meta 高级黑白极简设计语言系统 (Meta Stark Monochrome Design System)

> 本文档规范 SrP-CFG 客户端的视觉设计哲学、色彩令牌、排版体系、组件形态与微交互动效标准。作为后续单页面逐步落地重构的唯一全局设计基准（Single Source of Truth）。

---

## 1. 核心设计哲学 (Design Philosophy)

- **告别廉价浓郁彩色**：摒弃传统工具软件泛滥的饱和度过高的蓝色与花哨渐变，以深邃黑曜石（Obsidian）、纯粹钛晶白（Titanium White）与精致冷灰阶作为视觉基座。
- **极致反差与克制点缀 (Stark Contrast)**：
  - **浅色模式 (Light)**：极轻冷白画布与曜黑主交互元素形成高反差，干净利落、具有极强的现代印刷与画廊工业质感；
  - **深色模式 (Dark)**：黑曜石沉浸深色背景与纯白高反差主操作按钮呼应，暗室中清晰醒目、高级深邃；
  - **语义状态极度克制**：绿（`#10b981` 成功/在线）、黄（`#f59e0b` 警示/未装配）、红（`#ef4444` 危险重置）仅作为微小的指示灯小圆点或状态微胶囊点缀出现，绝不使用大面积彩底抢夺焦点。
- **一体化与空间呼吸感 (Seamless Continuity)**：窗口标题栏与侧边栏无缝相融，消除生硬割裂的切线；卡片采用极细柔和微描边与呼吸微浮动。

---

## 2. 颜色设计令牌 (Color Design Tokens)

### 2.1 核心黑白主色 (Primary Monochrome Tokens)

| 令牌名 | 浅色模式值 (Light) | 深色模式值 (Dark) | 用途说明 |
| :--- | :--- | :--- | :--- |
| `primaryColor` | `#141517` (极深曜黑) | `#ffffff` (纯粹高光白) | 主操作按钮底色、核心强调徽标、选中高光指示条 |
| `primaryHover` | `#27272a` | `#e4e4e7` | 悬停态深度渐变 |
| `primaryPressed` | `#000000` | `#d4d4d8` | 按下触感反馈深度 |
| `primaryTint` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.08)` | 菜单选中胶囊底色、微交互悬浮背景 |
| `onPrimaryText` | `#ffffff` (纯白字) | `#000000` (正黑字) | 主按钮文本与图标色 |

### 2.2 表面与画布体系 (Surfaces & Backgrounds)

| 令牌名 | 浅色模式值 (Light) | 深色模式值 (Dark) | 用途说明 |
| :--- | :--- | :--- | :--- |
| `canvasBg` | `#fbfcfd` (极轻冷白) | `#09090b` (黑曜石深黑) | 应用程序顶层主画布背景 |
| `sidebarBg` | `#f3f4f6` (柔和云灰) | `#101114` (微深黑) | 左侧一体化侧边导航栏底色 |
| `cardBg` | `#ffffff` (纯白) | `#15171b` (钛晶黑) | 独立内容卡片与面板底色 |
| `surfaceSoft` | `rgba(0, 0, 0, 0.03)` | `rgba(255, 255, 255, 0.04)` | 卡片内嵌列表项、二级微衬底 |
| `cardBorder` | `rgba(0, 0, 0, 0.07)` | `rgba(255, 255, 255, 0.09)` | 1px 极细精雕微边框 |
| `divider` | `rgba(0, 0, 0, 0.06)` | `rgba(255, 255, 255, 0.07)` | 内容区与工具栏分割线 |

### 2.3 文本层级体系 (Neutral Typography Hierarchy)

| 令牌名 | 浅色值 | 深色值 | 层次定位 |
| :--- | :--- | :--- | :--- |
| `textPrimary` | `#09090b` (极深正黑) | `#f4f4f5` (高亮纯白) | 主标题、卡片大标题、核心数值、主文字 |
| `textSecondary`| `#3f3f46` (中阶深灰) | `#a1a1aa` (钛金属灰) | 字段标签、副标题、导航菜单普通项 |
| `textTertiary` | `#71717a` (冷灰) | `#71717a` (中灰) | 说明文字、时间戳、次要辅助提示 |
| `textDisabled` | `#a1a1aa` (极浅灰) | `#52525b` (暗灰) | 禁用状态文字、微弱边注 |

### 2.4 克制语义状态令牌 (Restrained Semantic Tokens)

| 状态 | 核心色值 | 表现规范 |
| :--- | :--- | :--- |
| **就绪 / 成功 (Success)** | `#10b981` (极客翠绿) | 仅用于状态指示微点（8×8px 带呼吸动画）、数值高光、轻量 Tag |
| **警示 / 注意 (Warning)** | `#f59e0b` (电竞暖琥珀) | 用于需关注的非致命项（未装配规则、待检测状态） |
| **危险 / 破坏 (Critical)** | `#ef4444` (警示红) | 用于重置、全量清空等不可逆高危动作微按钮 |

---

## 3. 圆角与空间几何规范 (Radius & Spacing Metrics)

### 3.1 圆角系统 (Radius Tokens)
- `radiusSm` (4px)：微型 Badge、内部操作小按钮、微型指示胶囊
- `radiusMd` (8px)：标准按钮（`HusButton`）、输入框（`HusInput`）、内嵌列表条目
- `radiusLg` (12px)：代码编辑器面板、弹出框、模态对话框
- `radiusXl` (16px)：顶层大型 Hero 卡片、主视口独立功能卡片（`HusCard`）
- `radiusPill` (100px)：纯圆头像与指示圆点

### 3.2 布局间距标尺 (Spacing Scale)
- `4px` / `8px`：紧凑组件内部元素间距（图标与文本之间）
- `12px` / `16px`：表单项垂直间距、卡片内部组件间隙
- `16px` / `20px`：主内容视口外边距（Margined Layout）
- `24px`：大功能块之间的节奏分隔

---

## 4. 组件形态与微动效规范 (Component Guidelines & Motion)

### 4.1 主操作按钮 (Primary Action Button)
- **形态**：
  - 浅色下曜黑底白字，深色下纯白底黑字；
  - 移除大面积蓝底或渐变炫光，保留微小边框高光。
- **微交互**：
  - 悬停：微浮放大 `scale: 1.025`，过渡时长 `160ms`，缓动曲线 `Easing.OutCubic`；
  - 按下：下沉弹簧反馈 `scale: 0.97`。

### 4.2 沉浸式一体化侧边栏 (Fluid Seamless Sidebar)
- **无缝衔接**：取消标题栏下方的横切线，侧边栏自顶部一通到底；
- **选中态指示器 (Active Indicator)**：
  - 胶囊底色：深色下 `rgba(255, 255, 255, 0.08)`，浅色下 `rgba(0, 0, 0, 0.05)`；
  - 竖向呼吸条：左侧内嵌一条 3px 宽、18px 高的纯色指示条（浅色黑、深色纯白），带 `180ms` 平滑展开过渡；
- **折叠态体验**：
  - 宽度在 64px（图标紧凑态）与 220px（标准展开态）之间平滑动画过渡（200ms `OutCubic`）；
  - 折叠状态下鼠标悬停图标，右侧平滑弹出 `HusToolTip` 气泡提示。

### 4.3 卡片微悬浮 (Card Elevation)
- 鼠标滑入卡片区域时，卡片轻柔上浮 2px（`y: -2px`），过渡时长 `180ms`；
- 卡片细微外边框在悬停时微亮为高纯度钛晶色。

### 4.4 页面流体切换 (Page Transition Animator)
- 页面切换路由时，主视图采用统一的微位移与淡入（`opacity: 0.15 -> 1.0`，`translateY: 8px -> 0px`，时长 `200ms`）；
- 避免任何空白闪烁或硬切顿挫。

---

## 5. QML / HuskarUI 落地实现范式代码

```qml
// MetaTheme.qml 单例规范结构示例
pragma Singleton
import QtQuick
import HuskarUI.Basic

QtObject {
    id: meta

    // 核心黑白自适应
    readonly property color starkBlack: "#141517"
    readonly property color starkWhite: "#ffffff"
    readonly property color obsidian: "#09090b"

    readonly property color primaryColor: HusTheme.isDark ? starkWhite : starkBlack
    readonly property color primaryTint: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.09) : Qt.rgba(0, 0, 0, 0.05)

    // 表面色自适应
    readonly property color currentBg: HusTheme.isDark ? obsidian : "#fbfcfd"
    readonly property color currentSidebarBg: HusTheme.isDark ? "#101114" : "#f3f4f6"
    readonly property color currentCardBg: HusTheme.isDark ? "#15171b" : starkWhite
    readonly property color currentSurfaceSoft: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.04) : "#f3f4f6"
    readonly property color currentBorder: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.09) : Qt.rgba(0, 0, 0, 0.07)
    readonly property color currentTextPrimary: HusTheme.isDark ? "#f4f4f5" : "#09090b"
    readonly property color currentTextSecondary: HusTheme.isDark ? "#a1a1aa" : "#52525b"

    // 圆角标准
    readonly property real radiusSm: 4
    readonly property real radiusMd: 8
    readonly property real radiusLg: 12
    readonly property real radiusXl: 16
}
```

---

## 6. 单页面迭代开发检查清单 (Per-Page Checklist)

后续每一个界面的重构需严格对照以下指标：
- [ ] 界面是否遵循黑白纯粹高反差风格，无任何冗余大面积蓝底？
- [ ] 主操作按钮是否在亮色下曜黑白字、暗色下高光白底黑字？
- [ ] 标题栏与侧边栏是否维持一体化无缝贯通？
- [ ] 关键数据或路径项是否支持 ToolTip 完整悬停预览与一键快捷动作？
- [ ] 页面在 `HusTheme.Light` 与 `HusTheme.Dark` 切换时是否能 0 报错顺畅自适应？
- [ ] 所有的交互元素是否包含 Hover/Pressed 微动效反馈？
