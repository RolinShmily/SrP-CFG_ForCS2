# @srp-cfg/ui — 共享 React 组件库

> Desktop-first：组件源自 `app/desktop/src/renderer/components/`，Desktop 与 Website 共同消费。

## 约定（必须遵守）

1. **纯 UI 边界**：组件只接收 props，禁止：
   - `window.api` / `electron` / `@tauri-apps` / `astro:` 引用（CI grep 校验）
   - 领域类型（SteamUser、DetectionResult 等）进入 props（用泛型/基本类型）
   - 平台 API 调用（剪贴板除外：`CopyButton` 用 `navigator.clipboard`，失败静默）
2. **样式只用 design tokens**：`bg-bg-card`、`text-accent`、`border-border`、`font-display`、`rounded-[var(--radius)]` 等。
   - 两个消费端（desktop / website）在各自 `global.css` 的 `@theme` 里定义了**同名 token、不同值**，组件自动适配各端主题。
   - 禁止硬编码颜色值（如 `text-zinc-400`）、禁止使用单端自定义类（如 `ui-page-title`）。
3. **依赖极简**：仅 `react` + `clsx`。图标一律内联 SVG，不引入 lucide（避免与 lucide-astro/lucide-react 两端差异纠缠）。
4. **源码直出**：`exports` 指向 `./src/index.ts`（无构建步骤），由消费端 Vite 编译。workspace 内任何 React 工程可直接 import。

## Design tokens（两端同名）

| 类别 | Token 名 |
| :--- | :--- |
| 背景 | `bg` / `bg-card` / `bg-hover` / `bg-raised` |
| 边框 | `border` / `border-highlight` |
| 强调 | `accent` / `accent-light` / `accent-bg` / `accent-glow` |
| 语义 | `green` / `red` / `teal` / `blue` / `purple` / `cyan` |
| 文本 | `text` / `text-secondary` / `text-muted` / `text-faint` |
| 字体 | `font-display` / `font-body` / `font-mono` |
| 圆角 | `radius` / `radius-sm`（经 `var()` 使用） |

## 组件清单

`Button` · `Card` · `PageHeader` · `SectionHeader` · `LabeledValue` · `Badge` · `Modal` · `CopyButton` · `Skeleton` · `EmptyState`

## 校验命令

```bash
# 禁止出现平台/领域引用
grep -rn "window.api\|electron\|@tauri-apps\|astro:" app/shared/ui/src || echo OK
```
