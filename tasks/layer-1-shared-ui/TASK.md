# Layer 1 — 共享组件库（@srp-cfg/ui 扩展）

> 目标：以 Desktop 现有组件为来源，建立一套**纯 UI、无业务依赖、无平台依赖**的共享组件库，供 Desktop 与 Website 共同消费（D7/D10）。
> 前置：Layer 0 的组件清单。

## 设计原则

1. **Desktop-first**：组件从 Desktop 的 `app/desktop/src/renderer/components/` 与页面中抽取、抽象而来；Website 是消费者。
2. **纯 UI 边界**：组件只接收 props，不 import `window.api`、不依赖 Steam/CFG 领域逻辑、不做平台 API 调用。
3. **样式统一**：使用 Tailwind v4 + 现有 design tokens（`text-accent`、`bg-bg-card`、`font-display` 等）。两个消费端已用同一套 token（desktop `global.css` / website `global.css` 需确认 token 一致，不一致则在 L1 统一）。
4. **类型共享**：`@srp-cfg/ui` 依赖 `@srp-cfg/types`（存在，当前仅导出类型）。

## 任务

- [x] **1.1 完善 @srp-cfg/ui 包配置**
  - ✅ 新增 `tsconfig.json`（bundler 解析、react-jsx）与 `README.md`（约定/tokens/校验命令）
  - ✅ 确认 exports 指向源码（`./src/index.ts`），Vite 消费端直接编译，无需构建步骤
  - ✅ 确认双端 token 同名（desktop/website 各自 @theme 定义同名变量，值不同 → 组件自适应）

- [x] **1.2 抽取基础组件（A 档）**
  - ✅ 已抽取 9 个组件进 `@srp-cfg/ui`：Card / PageHeader / SectionHeader / LabeledValue / Badge / Modal / CopyButton / Skeleton / EmptyState（+ 已有 Button）
  - ✅ Desktop 已接入：6 个页面改用共享 PageHeader，DetectionCard 改用 LabeledValue；本地 PageHeader.tsx / PathRow.tsx 已删除
  - ✅ 验证：`tsc -p tsconfig.renderer.json` 通过；`vite build` 通过（1665 模块 / 2.7s）
  - ⏳ 待后续：Modal/CopyButton/Badge 在 Desktop 页面中的实际替换（L2.7 接入或后续页面重构时顺带）

- [x] **1.3 统一 design tokens**
  - ✅ 核对 desktop/website 两套 `global.css`：**token 变量名完全一致，值不同**（桌面 bg #0b0d14 vs 网站 #090b10；accent #e8790c vs #f28a1a；radius 8px vs 12px）
  - ✅ 结论：不做值统一（保持两端各自主题），共享组件只引用 token 名；已在 `@srp-cfg/ui/README.md` 记录 token 清单与约束

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
