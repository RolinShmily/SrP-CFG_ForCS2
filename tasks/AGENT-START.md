# 新 Agent 启动提示词（可直接用于 `pi -p --no-session "..."`）

你是 SrP-CFG 重构项目的执行 agent，接手正在进行的「Electron→Tauri + Astro→React SSG」重构。

## 第一步：读文件（必须按顺序读完再动手）

1. `tasks/PROGRESS.md` —— 交接手册（进度、环境坑、下一步任务、遗留注意点）
2. `tasks/README.md` —— 分层任务总览 + 架构决策表 D1-D10（必须遵守）
3. `tasks/layer-3-website-react/TASK.md` —— 你本次负责的层
4. `tasks/layer-3-website-react/api-contract.md` —— /api/chat 契约（禁止改动 worker.ts）

## 环境铁律

- 分支：`refactor/tauri-vite-react`（先 `git checkout` 确认）
- **pnpm install 必须带 `--registry=https://registry.npmmirror.com`**（npm 官方源证书报错）
- WSL/Linux 环境，无 sudo；tauri 壳（app/desktop/src-tauri）无法编译，**不要碰**；Rust 测试只跑 `cargo test -p srp-cfg-core`
- **绝对不要修改**：`app/website/src/worker.ts`、`wrangler.json`、`src/lib/ai-stream.ts`（AI 服务，L3 零改动）
- **绝对不要删除**：`app/website/src/pages/`、`src/layouts/`、`src/content/`、`astro.config.ts`（Astro 旧结构，全部迁移完成后才删）
- 共享组件（@srp-cfg/ui）lint：不得出现 `window.api`/`electron`/`@tauri-apps`/`astro:`

## 本次任务：L3.2 首页 React 化（本环境可完整验证）

把 Astro 首页完整迁移到 React Router 7 框架模式（SSG），复用 @srp-cfg/ui 共享组件。

### 迁移对象（Astro 旧 → React 新）
- `src/pages/index.astro` → `src/app/routes/home.tsx`（真实首页，替换占位）
- `src/components/Hero.astro`、`Features.astro`、`Showcase.astro`、`Steps.astro`、`CTA.astro`、`TerminalDemo.astro` → `src/app/components/`（React 化，组件名如 `Hero.tsx`）
- 通用小组件：`SectionHeader.astro` → 用共享 `@srp-cfg/ui` 的 `SectionHeader`；`ButtonLink.astro` → 共享 `Button`（Link 包装）；`Card.astro` → 共享 `Card`

### 转换规则
- lucide-astro → lucide-react（website 已有依赖）
- `Astro.props` → React props；`class:` 列表 → `clsx` 或模板字符串
- `data-astro-prefetch` 属性删除；`<a href>` 内链 → react-router `<Link>`
- 动画类名（tech-grid/hero-reveal 等）若依赖 global.css 中定义的样式则保留类名不动
- `LATEST_VERSION` 来自 `src/data/version.ts`（有顶层 await！）——**不要直接 import**，在 home.tsx 里先渲染 "v3" 静态文案或改用客户端 fetch，标注 TODO 等 L3.2 下载页处理
- 演示图片：Showcase 用 `src/assets/desktop-*.png`（import 进模块即可）

### 验收标准（全部满足才算完成）
1. `cd app/website && npx react-router build` 成功，无 TS/rollup 报错
2. `build/client/index.html` 包含：首页标题、Hero 文案、至少 2 张演示图 `<img>`、Features/Steps 区块文字
3. `curl -s localhost` 不可用就直接 grep 产物；确认布局（Nav/Footer）仍在
4. `npx tsc --noEmit -p tsconfig.json`（如 website 有 tsconfig 则跑，没有就跳过）
5. 所有新组件消费 ≥ 3 个 `@srp-cfg/ui` 导出（SectionHeader/Card/Button/Badge 等）
6. 工作区无对 `src/pages/`、`worker.ts` 的改动

### 提交规范
- 完成后：`git add -A && git commit`，message 以 `feat(website): migrate home page to React SSG` 开头，正文列出迁移的组件清单
- 一个 commit 只做一件事；中途遇到阻塞先记录再继续，不要改其他层

### 完成后输出
- `git log --oneline -1` 确认提交
- 用 5 行以内总结：迁移了哪些组件、构建是否通过、预渲染 HTML 验证结果、遗留 TODO
