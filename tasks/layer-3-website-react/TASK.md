# Layer 3 — Website 重构（Astro → Vite + React + Router 7 SSG）

> 目标：将静态页面层从 Astro 迁移到 **Vite + React 19 + React Router 7（框架模式 SSG）**；**AI worker（worker.ts）原样保留**（D6）；指令检索中心 SEO 化（D9）；展示 Desktop 演示素材（D7）。
> 前置：Layer 1（共享组件）。worker.ts 及其测试（worker.test.ts / ai-stream.test.ts）**本层不动**。

## 总体架构（迁移后）

```
app/website/
├── vite.config.ts            # Vite + React + Tailwind v4 + react-router 插件
├── react-router.config.ts    # SSG 配置（ssr:true + prerender 路由清单）
├── wrangler.json             # 不变（assets=dist + worker.ts 共存）
├── src/
│   ├── worker.ts             # 原样保留（AI /api/chat）
│   ├── lib/                  # ai-stream.ts 等保留
│   ├── app/                  # React Router 应用
│   │   ├── routes/           # 页面路由（对应原 pages/*.astro）
│   │   │   ├── index.tsx     # 首页
│   │   │   ├── download.tsx  # 下载页
│   │   │   ├── about.tsx     # 关于页
│   │   │   ├── docs/         # 文档中心
│   │   │   └── commands.tsx  # 指令检索中心
│   │   └── components/       # 页面组件（消费 @srp-cfg/ui）
│   ├── content/              # Velite 内容（docs 迁移）
│   ├── data/                 # version.ts / navigation.ts / config-knowledge/ 保留
│   └── styles/global.css     # design tokens 与 L1 对齐
└── public/data/commands.json # 保留（SSG 阶段转为预渲染数据源）
```

## 任务

### 3.1 工程骨架
- [ ] `vite.config.ts`：react 插件 + `@tailwindcss/vite` + `@react-router/dev` 插件。
- [ ] `react-router.config.ts`：`ssr: true`，配置 `prerender` 路由清单（首版：`/` `/download` `/about` `/docs` `/docs/*` `/commands`）。
- [ ] `package.json` scripts：`dev` / `build`（SSG 产出 dist）/ `preview`；`deploy` 仍为 `build + wrangler deploy`。
- [ ] 移除 astro 依赖（astro、@astrojs/mdx、@astrojs/sitemap、lucide-astro、@astrojs/check）。
- [ ] `MainLayout` / `BaseLayout` / `DocLayout` / `DocsIndexLayout` 的 React 等价物（布局层）。

### 3.2 页面迁移（先静态等价，再优化）
- [ ] 首页（Hero / Features / Showcase / CTA / Steps / TerminalDemo）
- [ ] 下载页（版本获取逻辑 `data/version.ts` 适配：原 Astro 顶层 `await` 需改为 SSG loader 或构建期注入）
- [ ] 关于页
- [ ] 文档中心（DocsToc / DocsNavigation / 目录树）
- [ ] 指令检索中心（见 3.4，独立成节）

### 3.3 内容管线（Velite，替代 Astro Content Collections — D8）
- [ ] 引入 Velite，配置 `velite.config.ts`：schema 与现 `content.config.ts` 对齐（title/description）。
- [ ] 迁移 `src/content/docs/` 18 篇 md → Velite 管理；frontmatter 校验 + 类型生成。
- [ ] 文档渲染：MDX/CommonMark + `rehype-slug` 锚点（保留现有行为）+ 目录生成（TOC）。
- [ ] sitemap 生成（替换 @astrojs/sitemap，SSG 后输出 sitemap.xml）。
- [ ] `@srp-cfg/content` 包接 Velite 产出（可选，若 Desktop 文档预览复用）。

### 3.4 指令检索中心 SEO 化（D9 — 用户强调项）
- [ ] 由"客户端 fetch `commands.json`"改为 **SSG 构建期预渲染**：
  - 方案：构建时读取 `public/data/commands.json`（~984KB），按首屏热门/分类生成静态 HTML 卡片；检索仍客户端过滤（数据可随包下发或按需加载）。
  - 关键页面对爬虫可见：指令名 + 中文释义 + 分类 + 默认值直接出现在 HTML。
- [ ] 指令详情 SEO：为高频指令生成独立锚点/路径（可选：`/commands/{name}` 静态页，控制规模，先做分类页）。
- [ ] AI 面板完整迁移（Turnstile + `/api/chat` + SSE 流式渲染，逻辑来自现 `commands.astro` 的 script 部分，React 化）。
- [ ] 保留复制指令、拼音检索、排除作弊、无限滚动等功能。

### 3.5 AI worker 集成（D6 — 不动 worker.ts）
- [ ] `worker.ts`、`wrangler.json`、`src/lib/ai-stream.ts` **零改动**。
- [ ] 前端 `/api/chat` 调用、Turnstile 集成在 React 侧等价实现（对齐 api-contract.md，见 L0.5）。
- [ ] 验证：SSG 产物部署后 `/api/chat` 与静态资源同一 Worker 域名下工作。

### 3.6 Desktop 演示素材展示（D7）
- [ ] `src/assets/desktop-*.png`（9 张）迁移/保留，首页 Showcase 区域以 React 组件展示。
- [ ] 演示图展示组件可直接复用 `@srp-cfg/ui` 的 Card/Modal（点击放大预览）。

### 3.7 SEO 收尾
- [ ] 每页 meta/OG/Twitter 标签（React Helmet 或 `react-router` 的 meta 能力）。
- [ ] 结构化数据（JSON-LD：下载软件、FAQ、指令数据）。
- [ ] `robots.txt` / sitemap.xml 接入 Cloudflare 部署。
- [ ] 验证：`curl` 构建产物确认指令页 HTML 内含指令文本（爬虫可见性检查）。

## 验收标准

- [ ] `pnpm build:web` 产出静态 dist，`wrangler dev` 本地可跑通页面 + `/api/chat`
- [ ] 18 篇文档全部可访问，锚点/TOC 行为与现版一致
- [ ] 指令检索中心：无 JS 时核心指令内容仍可见（curl 验证）；功能与现版等价
- [ ] `worker.ts` / `wrangler.json` 与迁移前 diff 为空
- [ ] 页面视觉与现版一致（截图对比），至少消费 5 个共享组件
- [ ] sitemap + robots 就位

## 参考文件

- `tasks/layer-0-baseline/TASK.md`（0.5 接口契约）
- `app/website/src/pages/*.astro`（迁移来源）
- `app/website/src/components/*.astro`（组件来源）
- `app/website/src/content.config.ts`（schema 基准）
- `app/website/src/lib/ai-stream.ts`（SSE 解析，保留）
- `app/website/public/data/commands.json`（指令数据源）
