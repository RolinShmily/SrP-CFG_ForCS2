# 任务书：网站/桌面内容更新（关于页、下载页便携版、Runtime Core 卡片 bug、技术栈说明）

> 状态：✅ 已完成并部署（2026-08-06，commit 718f48b + workflow_dispatch deploy 30918405839）
> 分支：`refactor/tauri-vite-react`
> 关联：`tasks/PROGRESS.md`、`tasks/AGENT-START.md`
> 触发背景：L2/L3 重构（Electron→Tauri v2、Astro→Vite+React Router 7 SSG）后，用户反馈若干页面内容与技术栈说明仍停留在旧栈，需要对齐

---

## 一、任务清单（用户原话拆解）

| # | 项 | 说明 |
| :--- | :--- | :--- |
| 1 | 关于页相关说明更新（website + desktop） | 技术栈卡仍写 Astro/Electron；desktop 简介仍是旧文案 |
| 2 | 下载页「便携版 (Portable)」 | 软件打包只发布 exe + msi（L4 已删 Portable.zip），下载卡是死链 |
| 3 | 下载页「Runtime Core」元件显示 bug | featured 卡双重边框（外层 accent 边框 + 内层 Card 自带 border） |
| 4 | README + 文档中心技术栈说明更新 | 站点技术栈描述对齐新栈 |

## 二、改动明细（commit 718f48b）

### 1. 关于页技术栈（对齐重构后实际栈）
- `app/website/src/app/routes/about.tsx`：`Astro/Electron/React(组件库)` → `Vite / React Router 7（SSG 2800+ 页）/ React 19 / Tauri v2（Rust 后端）/ TypeScript / TailwindCSS / Velite / Cloudflare Workers`（8 项，grid-cols-2）
- `app/desktop/src/renderer/pages/AboutPage.tsx`：`Electron/React/Node.js` → `Tauri v2 / Rust（core crate）/ React 19 / Vite / TypeScript / TailwindCSS`（6 项）；页头简介与 website 对齐（"面向 CS2 的模块化 CFG Runtime、Preset 案例与用户配置系统"）

### 2. 下载页便携版 → Setup EXE
- `app/website/src/data/downloads.ts`：删除 `便携版 (Portable) → SrP-CFG_Portable.zip`（Release 无此资产），新增 `Setup 安装程序 (EXE) → SrP-CFG_Setup_x64.exe`（NSIS 自包含安装向导）
- `README.md` 快速开始第 1 条：`MSI / Portable` → `MSI / Setup (EXE) 安装包`

### 3. Runtime Core 卡片双重边框 bug
- `app/website/src/app/routes/download.tsx`：原结构外层 div（`border-accent/20` + p-6）+ 内层 `Card`（自带 `border-border`）→ 双层边框视觉 bug。改为两种形态都用**单个原生 div**（featured 用 accent 边框，普通用 border-border + bg-bg-card，均含悬停特效），消除嵌套

### 4. README + 文档中心技术栈
- `README.md`：新增「## 技术栈」表（桌面 Tauri v2+React 19 / 官网 Vite+RR7 SSG+Velite / 指令检索 SSG+客户端检索 / AI Workers+Vectorize+Workers AI / 样式 @srp-cfg/ui）；「项目结构」注释精确化（website = Vite + React Router 7 SSG 2800+ 页 + Velite；desktop = Tauri v2 + React 19 + Rust core）
- `app/website/content/docs/srpcfg-1.md`：末尾新增「项目工具链」小节（组件 × 技术表），随 Velite 管线重新生成 `.velite/docs.json` + `build/client/docs/srpcfg-1/index.html`

## 三、验证（全部通过）

- `pnpm build:web`（7.9s，2806 页 + 16 .data 不变）
- `npx tsc -b`（website）零错误；`npx tsc -p tsconfig.renderer.json --noEmit`（desktop）零错误
- `pnpm --filter @srp-cfg/website test:ai-stream` 12/12（worker 零改动）
- 本地 wrangler dev + headless Edge CDP 实测：
  - 下载页链接 = MSI + **Setup 安装程序 (EXE)**（无 Portable）；Runtime Core 卡 = 单层 1px accent 边框、4 个子节点（DIV/H3/P/SPAN）、无嵌套 Card
  - 关于页技术栈 8 项正确渲染（无 Astro/Electron）
  - 文档 srpcfg-1 含「项目工具链」表
- 桌面 renderer dist 已重建同步（`app/desktop/dist`，仓库惯例）

## 四、部署 + 生产验收（2026-08-06）

- 提交 `718f48b` + 推 `refactor/tauri-vite-react`
- `gh workflow run deploy-website.yml --ref refactor/tauri-vite-react`（run 30918405839 ✓ 56s，纯网站部署不触发 release 流程）
- 生产 curl：`/download/` `/about/` `/docs/srpcfg-1/` 均 200；下载页 HTML 含 `SrP-CFG_Setup_x64.exe`、**0 处 Portable/便携**；关于页 HTML 0 Astro / 0 Electron，含 Tauri v2 + React Router 7
- **（追加）覆盖 v3.1.10 tag 重新发布**（用户指示，2026-08-06）：`git tag -f -a v3.1.10 HEAD` + force push → 3 工作流全绿（deploy-website 30919141455 / release-desktop 30919141042 / release-config 30919140884）。前提改动：两个 release 工作流 softprops 加 `overwrite: true`（be0a39ef，否则同名资产重传失败）。Release v3.1.10 资产全部刷新：MSI 4.03MB / NSIS 2.79MB / config zip / DESKTOP_UPDATE_MARKER；**桌面包含新的 About 文案**（build-app 从含 718f48b 的 tag 重建）；生产站点经 tag 触发的 deploy 再次验证全过（/__manifest 404 保持）

## 五、验收标准

- [x] 关于页（website + desktop）技术栈 = 实际栈（Tauri v2 / Vite+RR7 SSG / Rust / React 19 / Velite / Cloudflare Workers）
- [x] 下载页无 Portable 死链，安装器卡 = MSI + Setup EXE（与 Release 资产一致）
- [x] Runtime Core 卡无双重边框
- [x] README + 文档中心技术栈说明对齐新栈
- [x] 构建/tsc/测试全过；build/client + app/desktop/dist 同步；worker.ts 零改动

## 六、备注 / 遗留

- 桌面端内容（AboutPage）仅改渲染层；如需用户可见，需重新 `pnpm tauri build` 发版（本次未发版，桌面 About 页改动随下次 Desktop release 生效；当前机器上安装的 3.1.6 仍是旧文案）
  → **已解决**：2026-08-06 覆盖 v3.1.10 tag（be0a39ef）重新发布，release-desktop 从含 718f48b 的 tag 重建，MSI/NSIS 已含新 About 文案；已安装 3.1.6 用户会收到 v3.1.10 更新提示（hasDesktopUpdate:true）
- 下载镜像前缀 `DL_MIRROR_PREFIX = "https://gh.269601.xyz/"`（navigation.ts）不变
- 若后续 Release 流程恢复 Portable 打包，需同步下载页 installers 数组

## 附：数据目录对照（用户问“原来那些 json 和文件临时目录改到哪里去了”）

原 Electron 逻辑与新 Tauri 实现**机制完全保留**，仅数据根目录迁移（D2 决策 + f7f2fa6 一次性迁移）：

| 内容 | Electron 旧路径 | Tauri 新路径 | 说明 |
| :--- | :--- | :--- | :--- |
| 数据根 | `%APPDATA%\srp-cfg` | `%APPDATA%\top.srprolin.cfg`（app_data_dir） | 首启动一次性迁移旧数据 |
| 下载包 | `download\<日期-序号>\*.zip` | 同上子目录 | 目录扫描列出，无 JSON |
| 上传 | `upload\<日期-序号>\` | 同上 | 目录扫描 |
| 三清单 JSON | `install.json` / `res.json` / `save.json` | 同文件名（installer.rs json_path） | 受管文件/恢复原文件/保存配置 |
| 解压临时目录 | `_extract_<时间戳>` | 同（staging.rs 三处） | 用完即删 |
| 更新缓存 | userData/update-cache | `update-cache` | 允许重建不迁移 |

下载包实际路径示例：`%APPDATA%\top.srprolin.cfg\download\2026-08-04-0001\SrP-CFG_Runtime_Core.zip`
