# 任务书：网站生产路由问题修复（/__manifest 500 → 客户端路由断裂）

> 状态：⏳ 诊断已到根因假设，待复现与修复
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
- [ ] `pnpm build:web`（产出 `build/client`）→ `cd app/website && npx wrangler dev --local`（带 assets）
- [ ] `curl localhost:8787/__manifest` → 是否同样 500/异常？与生产行为对比
- [ ] `curl localhost:8787/nonexistent` → 404 还是 500？
- [ ] 若本地也是 500 → 根因可完全本地复现；若本地 404 → 问题在部署/平台侧

### 2. 定位 1101 根因
候选方向（按优先级）：
- [ ] **A. `env.ASSETS.fetch` 行为**：查 Cloudflare 文档/社区——`assets` 绑定对缺失路径应返回 404；1101 说明 worker 抛异常。可能：部署的 worker 版本与 assets 绑定不匹配、wrangler 版本差异、或 `assets` 配置方式（`directory` + `binding`）问题。查 CI 部署日志（wrangler deploy 输出、版本号）
- [ ] **B. 部署产物**：CI 里 `pnpm build:web` 后的 `build/client` 是否完整上传（wrangler deploy 日志的 assets 上传大小）；对比本地 build/client（2806 页）
- [ ] **C. react-router 侧规避**：`app/website/react-router.config.ts` 的 prerender/路由配置——routeDiscovery lazy 是否可关闭（如 `ssr:false` 不适用；查 v7.18 是否有 `future`/`routeDiscovery` 选项让客户端只用内联 manifest，不再拉 `/__manifest`）
- [ ] **D. wrangler.json 层兜底**（不改 worker.ts 前提下）：`assets` 规则/`not_found_handling`/自定义 `routes` 让 `/__manifest` 返回合适响应（但注意：react-router 期望的 manifest 响应格式是 JSON manifest——纯兜底 404 可能不够，需确认客户端在 manifest 拉取失败时的回退行为）

### 3. 实施修复
- [ ] 在任务 2 结论上实施最小改动（首选不动 worker.ts 的方案；若必须动配置，评估对 AI 服务的影响）
- [ ] 本地验证：`wrangler dev --local` 下 `/__manifest` 正确、客户端控制台无 manifest 错误、导航正常（用 headless Edge CDP 指向本地 wrangler 端口，或本机可用浏览器路径）

### 4. 部署 + 生产验收
- [ ] 提交 + 推分支 → 触发 deploy-website.yml（main 或 tag）
- [ ] 生产验证：`curl /__manifest` 返回预期（200+JSON 或 404 且客户端不再报错）；`curl` 各路由 200；**客户端导航测试需在可靠网络路径**（本机被证书拦截，见约束 7）
- [ ] 用户确认：除首页外其他路由恢复正常（路由跳转、文档详情、指令详情、搜索、AI 面板）

## 五、验收标准

- [ ] `/__manifest`（或等价路由发现请求）不再 500；不存在路径返回 404 而非 500
- [ ] 客户端控制台无 `Failed to fetch manifest patches` 错误
- [ ] 生产站点除首页外所有路由可访问、可客户端跳转（文档 16 篇、指令 2785 详情、搜索、AI 面板）
- [ ] `tsc -b` 零错误、`pnpm build:web` 通过、`test:ai-stream` 12/12、`build/client` 已同步
- [ ] worker.ts / ai-stream.ts / wrangler.json bindings 零改动（若方案 A/B 需动，先更新本任务书决策并说明）

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
