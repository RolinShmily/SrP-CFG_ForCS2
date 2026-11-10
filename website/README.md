# SrP-CFG 产品展示网站

React 19 / TypeScript / React Router 8 Framework Mode / Vite / Tailwind CSS / Motion / Radix UI / Lucide，`ssr: false` + 构建期预渲染，部署到 Cloudflare Worker。线上没有 Node.js 运行时，也不需要应用服务器。

## 本地开发与预览

```bash
cd website
pnpm dev        # React Router 开发服务器，默认 http://127.0.0.1:5173/
```

生产构建与静态预览：

```bash
pnpm build
pnpm preview
```

`pnpm build` 先运行 `prebuild`（校验 Console 数据并生成 `public/data/console-index.json`），然后执行 `react-router build`。`react-router.config.ts` 设置 `appDirectory: "src"`、`ssr: false`、`routeDiscovery: "initial"`，并为 `/`、`/console`、全部 ConVar/Command 详情、分类和 flags 生成 HTML 与 `.data` 文件。输出位于 `website/build/client`；浏览器端由 React Router 接管 hydration 和客户端导航。

`/` 保留原来的单页产品展示；`/console` 是独立的 CS2 指令中心。详情页由构建期 Loader 从 `data/console` 读取全文，直接用 URL 访问也能看到正文。

```bash
pnpm test
pnpm lint
```

test 使用 Node >=22.18 内置 TypeScript stripping；lint 是严格 TypeScript 检查。`licenses:collect` 收集生产依赖许可证到 `public/third-party-licenses.txt`。

运行时图片路径由 `src/lib/downloads.ts` 的 `assetPath()` 读取 Vite `BASE_URL`；站点按根路径部署。`scripts/preview.mjs` 服务 `build/client`，不是线上运行时。

## 页面和动效

- 首屏：介绍 APP、srpcfg CLI 和智能体 Skill；真实桌面窗口截图，滚动错位视差与 CSS 3D 透视。
- 产品特性：原生文件、暂存、备份及 Skill 协助配置四项能力。
- APP 展示：五个页面、中英文真实截图、带图标的手动标签与前后切换、键盘切页。无自动轮播或放大弹窗。
- 配置装配：四个配置职责层的空间展示，展开/收起及层选择。只有装饰面板接受 3D 倾斜，文字和代码保持原生尺寸正向渲染，避免整层缩放引起的模糊。模式以按键触发，不暗示启动时立即执行。
- 下载中心：桌面软件、srpcfg CLI 介绍、三个独立配置包和 srpcfg-cli ZIP；Skill 卡片附安装说明。
- Console：`/console` 独立布局，提供总览、ConVars、Commands、分类、Flags 与数据更新；支持浏览器端搜索、筛选、详情、复制配置片段和上游来源展示。
- 顶部是一条统一导航条：品牌、站点分区、Console 与操作区共用同一个圆角容器，`/` 与 `/console` 使用同一组件；滚动后收紧但不拆成多个浮岛。GitHub 旁的 Skill 按钮直达 `#srpcfg-cli` 下载卡片；手机保留带无障碍名称的紧凑 Skill 图标和可键盘关闭的菜单。
- 保留既有 Valve CS2 SVG 背景；没有复制参考站的图片或品牌资源。
- 减少动态效果模式禁用视差和空间变换。页脚提供品牌、链接、图标技术栈与明确的 MIT License 链接，不显示备案信息。

软件截图位于 public/app，以 WebP 保存（约 60–105 KB/张）。中文为浅色界面，英文部分包含深色界面。截图为当前 Qt/C++ 应用真实捕获，不是可远程操作的桌面，也不会修改游戏配置。

## i18n

简体中文默认，English 可切换并保存在 localStorage。页面文案、导航、演示说明、下载状态、Console 和错误处理均有两种语言；html lang 随语言切换，页面标题由路由 `meta` 决定，避免语言切换覆盖预渲染 SEO 标题。语言和下载来源读取失败不阻止页面。

## 软件下载

默认加速源：

`https://gh-proxy.org/https://github.com/RolinShmily/SrP-CFG_ForCS2/releases/...`

可切换 GitHub 原生源并记忆选择。读取最新 release/download/latest.json，失败时尝试 GitHub Releases API（可能受限流影响）。仅启用正式、版本匹配、来自指定仓库的 GUI ZIP / Setup EXE 链接，排除 CLI ZIP 和预发布。

无清单或无匹配资产时显示状态、重试与官方 Releases 入口，不硬编码新版本或虚构制品。SHA-256 与文件大小存在时显示。页面只链接下载，不自动执行校验、安装或升级。

正式软件 Release 提供 latest.json、GUI ZIP、CLI ZIP 和 Setup EXE。解析测试同时覆盖受控清单与缺失制品的回退行为。

## 独立配置包

读取同源 packages.json，通过 Cloudflare Worker 提供 srp-cfg、video、annotations 的独立版本、大小、SHA-256 与 ZIP 下载。软件镜像选择不改配置包来源；配置包不依赖软件 Release。CI 在构建前从 config 打包并生成真实清单。

## Console 数据

`/console` 的 CS2 ConVar/Command 数据、校验、翻译和索引生成在 `scripts/console/`，上游事实与译文落在 `data/console/`。浏览器搜索索引 `public/data/console-index.json` 在 `pnpm build` 的 `prebuild` 阶段生成，不提交进 git。初始译本由本地模型全量生成，后续新增/变更由 Cloudflare Workers AI 增量维护。详见 `scripts/console/README.md`。

## SEO

- 每个路由通过 React Router `meta` 输出 title、description、canonical、robots、Open Graph 和 Twitter 标签。
- ConVar/Command 详情额外输出 `DefinedTerm` + `BreadcrumbList` JSON-LD；首页输出 `WebSite` + `SoftwareApplication` JSON-LD。
- `pnpm seo:build` 从 `public/data/console-index.json` 生成 `public/sitemap.xml`，只收录 `indexable` 详情页、分类、Flags 和静态页；`prebuild` / `predev` 会自动执行。
- `public/robots.txt` 指向 sitemap；`_headers` 对 `sitemap.xml` 使用 revalidate，对 `robots.txt` 缓存一小时。

## CLI 与 Skill

网站介绍 `srpcfg.exe` 的命令行工作流，并提供独立 `srpcfg-cli` ZIP。下载后解压，将 `srpcfg-cli/` 放入智能体的技能目录；运行技能仍需安装 CLI，ZIP 不包含可执行文件。游戏内 alias 继续使用 `srp_*`。

Skill 的版本来自 `skills/srpcfg-cli/VERSION.txt`，独立于软件和配置包。`scripts/package-website.py` 使用 Python 标准库生成四种 ZIP、带 SHA 的文件名及 packages.json，Skill ZIP 含顶层目录和 MIT LICENSE.txt，过滤缓存/备份。APP core 只处理原有三个游戏配置包，忽略网站清单中的 Skill 条目。

本地生成可下载资源：

```bash
python scripts/package-website.py
pnpm build
```

## 部署

`deploy-worker.yml` 在 main 更新或手动触发时打包三个配置包与 Skill ZIP、运行解析测试/类型检查、构建 `website/build/client`，并使用 Cloudflare Wrangler 部署静态 Worker。根目录 `wrangler.toml` 定义 Worker `srp-cfg` 和静态资源目录，显式关闭 workers.dev 地址和版本预览 URL（`workers_dev = false`、`preview_urls = false`）；不声明 Custom Domain，也没有服务器入口脚本。网站从 `/` 加载资源，缺失路径返回真正的 404，不将 ZIP/JSON 请求回退成首页。

CI 通过仓库 Secrets `CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN` 认证；凭据不写入 TOML。Token 需要 Worker 部署权限。CI 不修改官网 DNS 或域名绑定；官网 `cfg.srprolin.com` 由 Cloudflare 控制台单独绑定到该 Worker。官网与 APP 配置更新需在该域名绑定完成后验证；本地预览使用 `pnpm preview`。

配置清单及 ZIP 下载地址统一为 `https://cfg.srprolin.com/packages.json` 和 `/packages/`。APP core 只信任该 HTTPS 域名下的配置路径。旧版 APP/CLI 中的 `.top` 或更早 gh-pages 地址编译在程序内，需要下载安装 3.4.3 或后续版本。配置下载器禁止 HTTP 重定向，旧域名 301/302 或直接返回含 `.com` ZIP 地址的新清单均无法兼容旧版；若需保留旧客户端更新，旧域名必须直接提供仍使用旧域名下载 URL 的兼容清单和 ZIP。GitHub Releases 继续发布软件制品。

`website/public/_headers` 禁止缓存配置清单，对 Vite 内容哈希静态资源（`/assets/*`）启用长期缓存。Wrangler 版本固定在工作流中。

根路径已按 React Router 静态预渲染验证；`wrangler.toml` 的静态资源目录为 `./website/build/client`，与 `react-router build` 的输出一致。

## 验证记录

测试下载元数据的仓库边界、版本错配、制品筛选、配置包 SHA/大小和镜像拼接。真实浏览器验证中英文和来源持久化、键盘切页、手动前后切换、导航聚合、层展开/收起、手机菜单、375/390px 无溢出、减少动态效果、API 失败回退与无水合异常。预渲染另验证：静态 HTML 含真实首屏文案与截图、禁用 JavaScript 时首屏与揭示内容可见、启用 JavaScript 后 hydration 正常；根路径、`/console`、ConVar/Command 详情直链均生成独立 HTML。

截图及本地验证脚本在 build-gui/verification-website（忽略目录，不参与部署）。依赖变更包括引入 `react-router` / `@react-router/dev`，移除自定义 SSR 入口与 `@vitejs/plugin-react`。
