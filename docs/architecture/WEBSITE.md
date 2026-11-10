# website 架构（React Router / Console / SEO）

本文件说明 `website/` 的实际结构：路由、构建、Console 数据、SEO、CI 与部署。
它只写已经存在的实现；新增路由或改变数据契约时，同一提交内更新本文件。

## 1. 技术栈与边界

- React 19 + TypeScript + Vite 8
- React Router 8.5.1 Framework Mode
- `ssr: false` + 构建期预渲染（SSG），线上没有 Node.js 运行时
- Tailwind CSS 3、Motion、Radix UI、Lucide
- Cloudflare Workers Static Assets 托管 `cfg.srprolin.com`

`website/` 是 pnpm workspace 中唯一的 JS 包（`srp-cfg-website`）。根 `package.json` 只保留 workspace 元数据，所有 npm 脚本与依赖都在 `website/package.json`。

## 2. 目录

```text
website/
├─ react-router.config.ts     # appDirectory、ssr:false、prerender、routeDiscovery
├─ vite.config.ts             # reactRouter() + @ 别名
├─ src/
│  ├─ root.tsx                # <html>、Meta、Links、Scripts、I18n/Motion Provider
│  ├─ routes.ts               # 路由树
│  ├─ layouts/
│  │  ├─ site-layout.tsx      # 统一 Navbar + Footer + Outlet
│  │  └─ console-layout.tsx   # 同一 Navbar + Console 二级导航 + Footer
│  ├─ routes/
│  │  ├─ home.tsx
│  │  ├─ not-found.tsx
│  │  └─ console/             # index、convars、commands、categories、flags、changes
│  ├─ components/
│  │  ├─ navbar.tsx           # `/` 与 `/console` 共用的单一导航条
│  │  └─ console/             # 搜索、表格、状态、复制、详情等
│  ├─ lib/console/
│  │  ├─ types.ts             # 索引 / 记录 / 翻译 / 详情类型
│  │  ├─ catalog.server.ts    # 构建期读取 data/console 与索引
│  │  ├─ seo.ts               # canonical、OG、JSON-LD、URL 构造
│  │  ├─ paths.ts             # 详情 / 分类 / Flag 路径
│  │  └─ use-console-index.ts # 浏览器按需加载 console-index.json
│  ├─ locales/                # 站点文案 + console.ts
│  └─ styles/console.css
├─ scripts/console/           # 数据解析、同步、翻译、校验、索引
├─ scripts/seo/build-sitemap.mjs
├─ data/console/              # 上游事实、翻译、overrides、分类、metadata
├─ public/                    # _headers、404.html、robots.txt、静态资源
└─ build/client/              # react-router build 输出（忽略）
```

## 3. 路由

`src/routes.ts` 的当前结构：

```text
/                       site-layout -> home
/console                console-layout -> index
/console/convars        console-layout -> 列表
/console/convars/:name  console-layout -> ConVar 详情
/console/commands       console-layout -> 列表
/console/commands/:name console-layout -> Command 详情
/console/categories     console-layout -> 分类索引
/console/categories/:slug
/console/flags
/console/flags/:flag
/console/changes
*                       not-found
```

- 官网仍然是 `/` 单页，没有拆成 Home / Features / Downloads。
- `/console` 是独立路由组，有自己的二级导航，但与官网共用同一个 Root、Navbar 品牌、Footer 和设计变量。
- 站内链接使用 React Router `Link`，内部链接统一 `prefetch="intent"`。
- 路由切换使用 `.route-page` 的**位移动画**（`translateY(6px) -> none`）。不要重新引入从 `opacity: 0` 开始的动画：客户端导航重建 keyed wrapper 时，动画未及时完成会让正文长时间不可见。
- 页面主体始终可读；动画只是增强，不是内容可见性的前提。

## 4. 构建与静态输出

- `react-router.config.ts`：`appDirectory: "src"`、`ssr: false`、`routeDiscovery: { mode: "initial" }`。
- `prerender` 路径来源：
  - React Router 的静态路由（`getStaticPaths()`）
  - `catalog.server.ts` 的 `getPrerenderPaths()`：全部 ConVar/Command 详情、分类、Flags
- 输出：`website/build/client`。
  - 静态页和详情页生成 `index.html`
  - 客户端导航所需数据生成对应的 `.data`
  - `__spa-fallback.html` 保留，但 Cloudflare 使用 `not_found_handling = "404-page"`
- `+lookatweapon` 这类命令同时生成 `+lookatweapon/` 和 `%2Blookatweapon/`；canonical 统一指向 `%2B`。
- `wrangler.toml` 的 `[assets] directory = "./website/build/client"`。
- `public/404.html` 提供真正的 404 页面；`public/_headers` 管理缓存。

本机命令：

```bash
cd website
pnpm dev          # predev 先生成 Console 索引与 sitemap
pnpm build        # prebuild 先生成索引与 sitemap，再 react-router build
pnpm preview      # 服务 build/client
pnpm test         # 下载逻辑 Node tests
pnpm lint         # tsc --noEmit
```

## 5. Console 数据

数据源与契约见 [`website/scripts/console/README.md`](../../website/scripts/console/README.md)。核心分层：

```text
data/console/convars.json      上游 ConVar 事实
data/console/commands.json     上游 Command 事实
data/console/translations.json AI 译文 + sourceHash + producer
data/console/overrides.json    人工修订，永远优先
data/console/categories.json   分类词表
data/console/metadata.json     上游 commit、文件 SHA-256、计数
```

- 初始全量译本由本地会话模型生成，`producer = "agent-seed"`。
- 后续新增/变更由 Workers AI `@cf/meta/llama-3.3-70b-instruct-fp8-fast` 增量翻译，`producer = "workers-ai"`。
- 英文 `sourceHash` 或 `promptVersion` 变化才会重译；人工 overrides 不会被覆盖。
- `public/data/console-index.json` 是构建产物，由 `console:prepare` 生成，不提交；浏览器按需加载。
- 列表默认隐藏 `developmentonly` / `defensive`，可勾选“包含开发/内部记录”查看全部；分类 / Flags 详情默认同样隐藏，并在页面注明。
- 详情页由构建期 Loader 读取 `data/console`，直接访问 URL 也能看到完整正文。

## 6. SEO

- `src/lib/console/seo.ts` 的 `pageMeta()` 统一输出 title、description、canonical、robots、Open Graph、Twitter。
- JSON-LD：
  - 首页：`WebSite` + `SoftwareApplication`
  - 详情：`DefinedTerm` + `BreadcrumbList`
  - 列表 / 分类 / Flags / 数据更新：`CollectionPage`
- `scripts/seo/build-sitemap.mjs` 从 `console-index.json` 生成 `public/sitemap.xml`，只收录 `indexable` 详情、分类、Flags 和静态页。
- `public/robots.txt` 指向 sitemap，排除 `/assets/`、`/data/`、`/packages/`。
- noindex：inferred、internal、stale、missing 详情；这些页面仍可直链访问，但不进入 sitemap。
- `_headers` 对 sitemap 使用 revalidate，对 robots 缓存一小时，对 console index 使用 revalidate。

## 7. CI 与部署

| 工作流 | 职责 |
| --- | --- |
| `deploy-worker.yml` | PR 与 push 到 `main` 且命中网站相关路径：打包配置包 → 测试/lint → 收集许可 → build；PR 只构建，push/手动再 Wrangler 部署 `website/build/client` |
| `ci-console.yml` | 命中 Console 数据/脚本/组件时跑 Python 单测、严格校验、索引生成 |
| `update-console-data.yml` | 每天 02:00 UTC + 手动；同步上游、Workers AI 增量翻译、校验、生成索引、提交 `website/data/console` |

`update-console-data.yml` 需要：

- `CLOUDFLARE_ACCOUNT_ID`：Cloudflare 账户 ID
- `CLOUDFLARE_AI_TOKEN`：Account → Workers AI → Read/Edit
- `GITHUB_TOKEN`：自动注入，用于读取上游 commit 与 push，无需手动创建

`deploy-worker.yml` 继续使用 `CLOUDFLARE_API_TOKEN`（Workers Scripts Edit）和 `CLOUDFLARE_ACCOUNT_ID`。建议 AI token 与部署 token 分开，按最小权限配置。

注意：

- 预检和翻译步骤是 `continue-on-error: true`；模型或凭据失败时上游事实仍会更新，缺失/过期译文下次重试。
- `GITHUB_TOKEN` 推送的 commit 不会触发监听 `push` 的 deploy 工作流；数据实际变化后需显式 `workflow_dispatch` 触发一次部署，或改用 PAT / `workflow_run` 串联。
- `update-console-data.yml` 的 `force` 输入只强制上游同步，不强制重译；全量重译需本地 `translate.py --backend workers-ai --force`。

## 8. 维护规则

- 新增页面：`routes.ts` 加路由 + 页面模块导出 `meta`；Console 页面复用 `pageMeta` 与 `consoleCopy`。
- 新增数据字段：同步更新 `scripts/console/types.ts`、`validate.py`、`build_index.py`、`catalog.server.ts` 和 `src/lib/console/types.ts`。
- 修改翻译 prompt：必须在 `translate.py` 中 bump `PROMPT_VERSION`，否则旧译文会被视为新鲜。
- 不要手改 `convars.json`、`commands.json`、`translations.json`、`metadata.json`、`console-index.json`、`sitemap.xml`；它们由脚本生成。
- 根目录不新增 npm 依赖或数据脚本；新增依赖与命令放入 `website/package.json`。
