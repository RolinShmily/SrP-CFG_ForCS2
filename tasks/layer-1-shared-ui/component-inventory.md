# 组件清单与抽取决策（L0.3）

> 盘点 Desktop 与 Website 现有组件，按 A/B/C 三档归类（A 抽入共享库 / B 抽象结构 / C 留原地）。
> 依据决策：D7（desktop-first）、D10（纯 UI 边界）。

## 一、Desktop 组件（`app/desktop/src/renderer/components/`）

| 组件 | 依赖 window.api | 归类 | 结论 |
| :--- | :--- | :--- | :--- |
| `PageHeader` | 否 | **A** | 纯展示，直接进共享库（已有现成实现） |
| `PathRow` | 否 | **A** | label/value 行，泛化为 `LabeledValue` 进共享库 |
| `TitleBar` | 是（窗口控制） | **C** | 平台相关，留桌面（L2 加 data-tauri-drag-region） |
| `Sidebar` | 是（getVersion 等） | **C** | 桌面导航 + 版本信息，留桌面；布局结构可参考 |
| `InstallActions` | 是（install*） | **C** | 业务核心，留桌面 |
| `UpdateModal` | 是（getUpdateHistory） | **B** | Modal 结构抽 `Modal` 进共享库；更新内容留桌面 |
| `DownloadsList` | 是 | **C** | 业务列表，留桌面 |
| `UploadZone` | 是（getFilePaths） | **C** | 依赖拖拽路径 API，留桌面（L2 换插件实现） |
| `UploadedList` | 是 | **C** | 业务列表，留桌面 |
| `SteamStatusBanner` | 否 | **C** | 领域逻辑（Steam 状态），留桌面 |
| `DetectionCard` | 否 | **C** | 领域逻辑（检测结果展示），留桌面；卡片样式参考 |
| `ConfirmAppendModal` | 否 | **B** | Modal 结构 → 共享；冲突列表留桌面 |
| `LogPanel` | 否（订阅 log 事件） | **B** | 日志面板结构 → 共享 `LogView` 可选；订阅逻辑留桌面 |
| `PageHeader` 同类页面骨架 | 否 | **A** | 见上 |

**抽取候选（A 档）**：`PageHeader`、`LabeledValue`(PathRow)、`Modal`、`Card`、`Badge/Tag`、`CopyButton`、`InlineCode/CodeBlock`、`Skeleton`、`EmptyState`、`Toggle/Checkbox`。

## 二、Website 组件（`app/website/src/components/*.astro`）

| 组件 | 依赖 | L3 处理 |
| :--- | :--- | :--- |
| `ButtonLink.astro` | Button 样式 | 共享 `Button` 的 React 版（asChild 或 Link 包装） |
| `SectionHeader.astro` | — | **进共享库**（Desktop 的 PageHeader 与其同构，可统一） |
| `Card.astro` | — | 共享 `Card` |
| `Footer.astro` | navigation.ts | Website 本地 React 组件（引用共享 Card/Button） |
| `Nav.astro` | navigation.ts | Website 本地（Router Link 适配） |
| `Hero.astro` | version.ts / TerminalDemo | Website 本地（TerminalDemo 可进共享库作展示组件） |
| `Showcase.astro` | desktop-*.png 素材 | **Website 本地**（D7：Desktop 演示图展示区，用共享 Card/Modal 放大预览） |
| `CTA.astro` / `Steps.astro` / `Features.astro` | SectionHeader | Website 本地组合（复用共享组件） |
| `TerminalDemo.astro` | version.ts | 可选进共享库（终端演示，纯展示） |
| `DocsToc.astro` | headings props | Website 本地（文档 TOC，纯展示可共享） |
| `DocsNavigation.astro` | astro:content | Website 本地（Velite 数据适配） |
| `BilibiliIcon.astro` | — | Website 本地 SVG |

## 三、共享库 v1 组件集（L1 交付物）

```
@srp-cfg/ui/src/components/
├── Button.tsx        (已有，扩 variant/size)
├── Card.tsx          (新)
├── Modal.tsx         (新，抽自 ConfirmAppendModal)
├── PageHeader.tsx    (新，搬自 desktop)
├── SectionHeader.tsx (新，合并 desktop PageHeader 与 astro SectionHeader 能力)
├── LabeledValue.tsx  (新，源自 PathRow)
├── Badge.tsx         (新)
├── CopyButton.tsx    (新)
├── CodeBlock.tsx     (新)
├── Skeleton.tsx      (新)
└── EmptyState.tsx    (新)
```

## 四、边界规则（D10 落地检查）

- 共享组件 grep 校验：不得出现 `window.api`、`electron`、`@tauri-apps`、`astro:`。
- 领域类型（SteamUser、DetectionResult 等）不入共享组件 props，用泛型/基本类型。
- 样式统一用 design tokens（`bg-bg-card`、`text-accent` 等），L1.3 先核对两套 global.css token 一致性。
