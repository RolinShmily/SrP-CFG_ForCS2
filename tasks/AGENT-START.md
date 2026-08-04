# 新 Agent 启动提示词（可直接用于 `pi -p --no-session "..."`）

你是 SrP-CFG 重构项目的执行 agent，接手 **L3 收尾**：删除 Astro 旧结构、切换构建/部署链路到 React Router SSG。

## 第一步：读文件（必须按顺序读完再动手）

1. `tasks/PROGRESS.md` —— 交接手册（进度、环境坑、下一步任务、遗留注意点）
2. `tasks/README.md` —— 分层任务总览 + 架构决策表 D1-D10（必须遵守）
3. `tasks/layer-3-website-react/TASK.md` —— L3 总体任务
4. `tasks/layer-3-website-react/api-contract.md` —— /api/chat 契约（禁止改动 worker.ts）

## 环境铁律

- 分支：`refactor/tauri-vite-react`（先 `git checkout` 确认）
- **pnpm install 必须带 `--registry=https://registry.npmmirror.com`**（npm 官方源证书报错）
- WSL/Linux 环境，无 sudo；tauri 壳（app/desktop/src-tauri）无法编译，**不要碰**；Rust 测试只跑 `cargo test -p srp-cfg-core`
- **绝对不要修改**：`app/website/src/worker.ts`、`wrangler.json`（部署拓扑）、`src/lib/ai-stream.ts`（AI 服务）
- 共享组件（@srp-cfg/ui）lint：不得出现 `window.api`/`electron`/`@tauri-apps`/`astro:`

## 本次任务：L3 收尾（删除 Astro 旧结构 + 部署链路统一，本环境可完整验证）

背景：5 个页面（首页/下载/关于/文档/指令）已全部迁移到 React Router SSG（提交 3954011~f60786e），
Astro 旧结构现在可以安全删除。删除前先跑一次 `pnpm build:web` 确认基线是绿的。

### 任务清单（按顺序）

1. **Velite 数据源迁移**（必须先做，否则删 content/ 后文档中心没数据）
   - 把 `src/content/docs/` 16 篇 md 移到独立目录（建议 `content/docs/` 或 `src/content-docs/`）
   - 更新 `velite.config.ts` 的 `root` 指向新目录
   - 重新 `pnpm build:web` 验证 16 篇文档仍正常预渲染

2. **删除 Astro 旧结构**（一个 commit 只做一件事，拆 2-3 个 commit）
   - `src/pages/`、`src/layouts/`、`src/components/*.astro`（保留 icons/ 里被 React 复用的？先 grep 确认）、
     `astro.config.ts`、`src/content.config.ts`
   - `package.json`：移除 astro/@astrojs/mdx/@astrojs/sitemap/@astrojs/check/lucide-astro 依赖；
     scripts 改为 `"dev": "vite dev"`、`"build": "velite --clean && react-router build"`、
     `"preview": "vite preview"`、`"deploy": "pnpm build && npx wrangler deploy"`
   - `tsconfig.json`：不再 extends `astro/tsconfigs/strict`（改为 vite 标准配置，保留
     `jsx: react-jsx`、`paths`（@/* 与 @shared/*）、`.velite` include；可参考 desktop 的 tsconfig）

3. **部署链路统一（L3.5 遗留）**
   - 现状：react-router 输出 `build/`，但 `wrangler.json` 的 `assets.directory` 指向 `./dist`
   - 二选一：a) vite.config 把 outDir 改成 `dist`（注意 react-router 的 client/server 输出结构，改前先读文档）；
     b) 改 `wrangler.json` assets 指向 `./build/client`
   - 目标：`wrangler dev` 本地能跑通静态页面（/api/chat 走 worker 逻辑，无需真连 AI）

4. **清理验证**
   - `grep -rn "astro" src/ package.json vite.config.ts tsconfig.json`（允许的残留：注释里提及、`@srp-cfg/ui` 无）
   - 移除 `src/vite-env.d.ts` 里若有的 astro 相关声明；`Showcase.tsx` 的 `toUrl()`（ImageMetadata 收敛）现在可去掉

### 验收标准（全部满足才算完成）

1. `pnpm build:web` 成功，22 个 HTML 预渲染（/ + /download + /about + /docs + 16 文档 + /commands），
   `build/client/sitemap.xml` 仍生成、robots.txt 仍在
2. `package.json` 无 astro 依赖；`grep -rn "astro" src/` 无 import 引用
3. 旧 Astro 文件全部删除（git status 确认），`src/app/` 结构完整
4. `npx tsc --noEmit -p tsconfig.json`：**不得新增错误**（删除 astro.config 后原来那 2 个 astro.config 错误应消失，
   只允许遗留 vite.config.ts 的 Plugin 类型错误，或顺手 dedupe 修掉）
5. `worker.ts` / `src/lib/ai-stream.ts` / `wrangler.json`（除非任务 3 选择改它）零改动
6. 共享组件 lint 干净

### 提交规范

- 拆 commit：① Velite 数据源迁移 + 验证 ② 删除 Astro 结构 + 依赖/scripts/tsconfig ③ 部署链路统一
- message 以 `refactor(website):` 或 `feat(website):` 开头，正文列出改动与验证结果
- 中途遇到阻塞先记录再继续，不要改其他层

### 完成后输出

- `git log --oneline -5` 确认提交
- 用 5 行以内总结：删除了什么、构建/预渲染验证结果、部署链路最终形态、遗留 TODO
- 如 PROGRESS.md 需要更新（勾选任务），顺带提交一个 docs 更新 commit
