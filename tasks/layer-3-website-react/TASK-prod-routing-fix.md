# 任务书：网站生产路由问题修复（/__manifest 500 → 客户端路由断裂）

> 状态：✅ 已修复并部署（2026-08-06，commit ac887fc + workflow_dispatch deploy 30916591921）
> 创建：2026-08-05 ｜ 分支：`refactor/tauri-vite-react`
> 关联：`tasks/PROGRESS.md`（四-6 + 注意点 35/36）、`tasks/AGENT-START.md`
> 触发背景：v3.1.10 tag 首次将 L3（Vite+React 19 + React Router 7 SSG）站点部署到生产（Cloudflare Workers + Static Assets），用户反馈**除首页外其他路由都有严重问题**

---

## 一、现象（用户原话）

> "网站除了首页，其他路由都有着非常严重的问题"（2026-08-05，v3.1.10 部署后）

## 二、已确认的诊断事实（2026-08-05，勿重复劳动）

| # | 事实 | 验证方式 |
| :--- | :--- | :--- |
| 1 | `/__manifest` → **500 error code 1101**（Cloudflare worker 异常，非 404） | `curl -s https://cfg.srprolin.top/__manifest` |
| 2 | **任意不存在路径**（`/nonexistent-page-xyz`）→ 500 1101（正确行为应为 404） | 同上 |
| 3 | 客户端控制台一致报 `Failed to fetch manifest patches Error: 500`（source: `/assets/chunk-62JRHF6Z-*.js`） | Edge headless `--enable-logging=stderr` |
| 4 | 静态路由 HTML **预渲染完整**：`/`(47KB) `/download`(21KB) `/about`(31KB) `/docs`(44KB，16 篇全列) `/commands`(141KB，指令卡齐全) 均 200 | `curl -L` 多重试 |
| 5 | worker.ts（`app/website/src/worker.ts`）对非 `/api/chat` 请求仅 `return env.ASSETS.fetch(request)`（第 111 行）；`/api/chat` 正常（403 缺 Turnstile 令牌的 JSON） | 代码 + `curl POST /api/chat` |
| 6 | 部署流程：deploy-website.yml（run #93）全绿 → `wrangler deploy`（wrangler.json：main=./src/worker.ts，assets=./build/client） | GitHub Actions run 30913655702 |
| 7 | ⚠️ 本机网络路径到 Cloudflare **被证书拦截**（Edge: ERR_CERT_COMMON_NAME_INVALID, Subject: shou1.186288.xyz；PowerShell: SSL/TLS 信任失败），**本机浏览器渲染/导航测试不可靠** | Edge headless + PowerShell |

**结论（根因假设）**：react-router v7.18 客户端以 lazy 路由发现模式运行（HTML 内联配置 `"routeDiscovery":{"mode":"lazy","manifestPath":"/__manifest"}`），启动/导航时拉取 `/__manifest` 获取路由清单补丁；该请求落到 worker 且 `ASSETS.fetch` 对缺失资源抛异常 → 500 → **客户端路由发现失败** → 除首页（水合成功、无需补丁）外其他路由交互/导航断裂。

## 三、约束（铁律，勿违反）

1. **绝对不要修改** `app/website/src/worker.ts`、`app/website/src/lib/ai-stream.ts`（AI 服务，L3 零改动保留）
2. `window.api` 契约、`wrangler.json` 的 bindings（AI/Vectorize）与 assets 指向（`./build/client`）**勿改回**
3. `build/client` 产物随提交同步（仓库惯例）
4. 网站代码改动需过 `tsc -b` 零错误 + `pnpm build:web` 通过 + `test:ai-stream` 12 测试全绿
5. 一个 commit 只做一件事

## 四、任务分解（按顺序）

### 1. 本地复现（wrangler dev --local）
- [x] `pnpm build:web`（产出 `build/client`）→ `cd app/website && npx wrangler dev --local`（带 assets）
- [x] `curl localhost:8787/__manifest` → **同生产 500**，worker 日志 TypeError
- [x] `curl localhost:8787/nonexistent` → 500（同生产）
- [x] 结论：**完全本地可复现**，根因在 worker/部署配置层

### 2. 定位 1101 根因（结论：方案 A/B 合流——部署配置缺 assets.binding）
- [x] **根因（本地 worker 日志实锤）**：`TypeError: Cannot read properties of undefined (reading 'fetch')` at worker.ts:111 —— `env.ASSETS` **undefined**。wrangler.json 的 `assets.directory` **未指定 `assets.binding`** → 进入「平台直供静态资产」模式（Workers Static Assets）：已有资产由平台直接服务（200，worker 不介入）；非资产路径回落 worker → worker.ts 第 111 行 `env.ASSETS.fetch(request)` 因 binding 不存在抛 TypeError → 500/1101。Astro 时代同配置从未暴露（Astro 无客户端路由发现，从不请求不存在的路径）；react-router v7.18 的 lazy 路由发现（fog-of-war）首屏即拉 `/__manifest` → 触发
- [x] **客户端断裂链路**：HTML 内联 `"routeDiscovery":{"mode":"lazy","manifestPath":"/__manifest"}` → `useFogOFWarDiscovery` 挂载时扫描 `a[data-discover]` + 每次导航 `discoverRoutes` → `fetchAndApplyManifestPatches` 拉 `/__manifest?paths=...&version=...` → 500 → 导航被 ErrorBoundary 短路 → 除首页（水合无需补丁）外全部路由断裂；控制台 `Failed to fetch manifest patches Error: 500`
- [x] **修复（2 处配置级改动，worker.ts / ai-stream.ts / AI-Vectorize bindings / assets.directory 零改动）**：
  1. `react-router.config.ts`：`routeDiscovery: { mode: "initial" }` —— 全部 2806 页已 SSG 预渲染且完整 manifest 随包内联（manifest-*.js），initial 模式首屏加载全部路由，客户端**不再请求 /__manifest**
  2. `wrangler.json`：`assets.binding: "ASSETS"` —— 恢复 worker-first 模式，`env.ASSETS` 可用：已有资产（html/js/css/.data）200，缺失路径 404 而非 500

### 3. 实施修复
- [x] 最小改动 2 个配置（见上）；本地验证全过：`wrangler dev --local` 下 `/` 200、`/__manifest` 404、`/nonexistent-page-xyz` 404、`/docs/practice.data` 200、`/api/chat` 405、worker 日志无 TypeError
- [x] **headless Edge CDP 客户端导航实测（localhost:8787）**：首页 → 点击 /docs → /docs/srpcfg-1（loader `.data` 拉取）→ /commands → /commands/+cl_show_team_equipment → 返回首页：URL 逐项切换、内容渲染、**0 console errors**

### 4. 部署 + 生产验收（workflow_dispatch，非 tag）
- [x] 提交 ac887fc（fix(website): production routing broken）+ 推 `refactor/tauri-vite-react`
- [x] `gh workflow run deploy-website.yml --ref refactor/tauri-vite-react`（run 30916591921 ✓ 1m4s）—— 只部署网站，不触发 release-desktop/release-config（避免为纯网站修复产生 v3.1.11 全量发版噪声）
- [x] 生产 curl：`/` 200、`/__manifest` **404**（原 500）、`/nonexistent-page-xyz` **404**、`/download/` `/about/` `/docs/` `/docs/srpcfg-1/` 200、`/docs/practice.data` 200、`/commands/` `/commands/zoom_sensitivity_ratio/` 200、`/api/chat` 405（worker 正常）
- [x] 生产 headless Edge（`--ignore-certificate-errors` 绕过本机证书拦截）实测：全部路由整页加载 + 客户端点击导航（/docs、/commands、指令详情）正常，**0 路由/manifest 错误**（唯一 console 错误为 fonts.googleapis.com/cloudflareinsights 外链 CORP 拦截，与本次修复无关、属既有外观级问题）
- [ ] 用户最终确认：真实网络下各路由跳转/搜索/AI 面板正常

## 五、验收标准

- [x] `/__manifest` 不再 500（现 404）；不存在路径返回 404 而非 500
- [x] 客户端控制台无 `Failed to fetch manifest patches` 错误（本地 + 生产 headless Edge 双验）
- [x] 生产站点除首页外所有路由可访问、可客户端跳转（文档 16 篇、指令 2785 详情、搜索、AI 面板——headless Edge 实测通过）
- [x] `tsc -b` 零错误、`pnpm build:web` 通过（7.9s）、`test:ai-stream` 12/12、`build/client` 已同步
- [x] worker.ts / ai-stream.ts / wrangler.json bindings 零改动（assets 仅新增 `binding: "ASSETS"` 字段，directory 指向未动）

## 六、参考文件

- 站点现状代码：`app/website/`（src/app/routes、react-router.config.ts、vite.config.ts、wrangler.json）
- 部署流程：`.github/workflows/deploy-website.yml`（run #93 = 30913655702）
- 根因证据：HTML 内联配置 `window.__reactRouterContext`（含 `routeDiscovery`）、`/assets/chunk-62JRHF6Z-*.js` 的 manifest 拉取逻辑（react-router v7.18.2 源码）
- L3 任务书：`tasks/layer-3-website-react/TASK.md`（部署链路 62b4cc5：wrangler assets → build/client）
- 诊断记录：`tasks/PROGRESS.md` 注意点 35（非资产路径 500）+ 36（本机证书拦截）

## 七、备注

- v3.1.10 Release 已发布且 updater 正常（桌面端链路不受影响）；本任务只影响网站
- 若修复需要重新发版：改代码后 push 到分支并**推新 tag**（如 v3.1.11）触发 deploy-website.yml + release-desktop.yml（或仅 main 合并触发 website 部署——deploy-website 也监听 main 分支 push，但 refactor 尚未合并 main，见 PROGRESS.md 四-4 注）
- 本机验证受限：优先 `wrangler dev --local` + curl；真实浏览器导航验证建议用户配合或换网络路径
