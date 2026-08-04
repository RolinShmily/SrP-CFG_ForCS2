# Layer 1 — 共享组件库（@srp-cfg/ui 扩展）

> 目标：以 Desktop 现有组件为来源，建立一套**纯 UI、无业务依赖、无平台依赖**的共享组件库，供 Desktop 与 Website 共同消费（D7/D10）。
> 前置：Layer 0 的组件清单。

## 设计原则

1. **Desktop-first**：组件从 Desktop 的 `app/desktop/src/renderer/components/` 与页面中抽取、抽象而来；Website 是消费者。
2. **纯 UI 边界**：组件只接收 props，不 import `window.api`、不依赖 Steam/CFG 领域逻辑、不做平台 API 调用。
3. **样式统一**：使用 Tailwind v4 + 现有 design tokens（`text-accent`、`bg-bg-card`、`font-display` 等）。两个消费端已用同一套 token（desktop `global.css` / website `global.css` 需确认 token 一致，不一致则在 L1 统一）。
4. **类型共享**：`@srp-cfg/ui` 依赖 `@srp-cfg/types`（存在，当前仅导出类型）。

## 任务

- [ ] **1.1 完善 @srp-cfg/ui 包配置**
  - `package.json`：增加 `react`/`react-dom` peerDeps（已有）、`tsconfig`（JSX、paths）、Tailwind 消费说明。
  - 增加 Storybook 或至少一个 playground 页面（可选，先不引入重量级工具，用 website 页面当 playground）。
  - 确认 monorepo 内两个消费端都能直接 import 源码（Vite 天然支持 workspace 源码，无需构建步骤）。

- [ ] **1.2 抽取基础组件（A 档）**
  - 从 Desktop 抽取/抽象以下组件（具体实现以现有代码为准）：
    - `Card`（Desktop 大量 `bg-bg-card border-border rounded-[12px]` 卡片结构）
    - `PageHeader`（已有现成，直接搬）
    - `LabeledValue`（源自 `PathRow`，label/value 行，泛化）
    - `Modal`（源自 `ConfirmAppendModal` / `UpdateModal` 的结构：遮罩 + 面板 + 关闭）
    - `Badge` / `Tag`（Desktop 安装包内 flag 标签样式）
    - `CopyButton`（Desktop 复制指令按钮行为，含"已复制"反馈）
    - `CodeBlock` / `InlineCode`
    - `Skeleton`（Desktop/Website 加载占位）
    - `EmptyState`（空结果提示）
  - 每抽取一个：`@srp-cfg/ui` 导出 + Desktop 改引用 + 视觉回归确认。

- [ ] **1.3 统一 design tokens**
  - 对比 `app/desktop/src/renderer/styles/global.css` 与 `app/website/src/styles/global.css` 的 CSS 变量，整理出一份共享 token 清单。
  - 共享组件内部一律使用 token 类名（不写死颜色值）。
  - 产出：`@srp-cfg/ui` 内 `tokens.md` 或注释说明。

- [ ] **1.4 Website 组件 React 化清单**
  - 盘点 website 16 个 `.astro` 组件，标记：
    - 可直接用共享组件替代的（Button、Card、SectionHeader→共享）
    - 需要 React 化且可进共享库的（Footer、Nav 结构类）
    - 领域独有、留 website 的（TerminalDemo、Showcase 等）
  - 产出：`component-inventory.md` 更新（本轮落地 React 侧）。

## 验收标准

- [ ] `@srp-cfg/ui` 导出 ≥ 8 个基础组件
- [ ] Desktop 至少 5 处改为引用共享组件，构建通过、无视觉回归
- [ ] Website 尚未重构前不强制消费（L3 才接入），但组件本身不依赖任何平台 API
- [ ] 所有共享组件无 `window.api` / `electron` / `@tauri-apps` 引用（grep 验证）

## 参考文件

- `app/shared/ui/src/index.ts`（当前导出 Button）
- `app/shared/ui/src/components/Button.tsx`（组件模板范式）
- `app/desktop/src/renderer/components/`（组件来源）
