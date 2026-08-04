# 重构进度汇总 & 交接手册

> 更新时间：2026-08-04（L3 收尾完成；AGENT-START 已更新为 L2 续作提示词）
> 分支：`refactor/tauri-vite-react`（基于 main）
> 用途：供新开 agent 无缝继续执行（先读本文件 + `tasks/README.md` + 对应层 TASK.md）

---

## 一、总体目标

1. **Desktop**：Electron → **Tauri v2**（Rust 后端 + React 19 前端保留），体积 100MB→~15MB
2. **Website**：Astro → **Vite + React 19 + React Router 7（SSG 预渲染）**，AI worker（`worker.ts`）**零改动保留**
3. **组件库**：desktop-first 扩展 `@srp-cfg/ui`，Website 消费；Website 展示 Desktop 演示截图
4. **SEO**：文档中心 + **指令检索中心**均需静态化（指令中心已完成：首屏 HTML 含指令文本）

架构决策表（D1-D10）见 `tasks/README.md`，**新 agent 必须遵守**。

---

## 二、环境注意事项（新 agent 必读，都是踩过的坑）

| 事项 | 说明 |
| :--- | :--- |
| **npm 官方源不可用** | `CERT_HAS_EXPIRED`/`ECONNRESET` 频繁。**所有 pnpm install 必须加 `--registry=https://registry.npmmirror.com`** |
| **WSL 环境** | Ubuntu-on-Windows。desktop 的 Electron 打包无法在本环境验证（win32 目标），L2 的 Windows 部分需 Windows 实机 |
| **Rust 可用但无 webkit2gtk** | `cargo 1.97` 可用；但 tauri 壳编译需要 `webkit2gtk-4.1`（无 sudo 装不了）→ **纯逻辑必须放 `core/` crate**，测试用 `cargo test -p srp-cfg-core` |
| **Desktop Tailwind 不扫共享库** | `@tailwindcss/postcss` 以 CSS 文件目录为基准做文件扫描，不会跨到 `app/shared/ui`。**桌面端必须在 `src/renderer/styles/global.css` 顶部保留 `@source "../../../../shared/ui/src"`**（L2.7 已加；曾导致共享组件专属类缺失）；website 用 `@tailwindcss/vite`（模块图扫描）无此问题 |
| **GitHub API 限流** | 未认证 60 次/h/IP。版本注入（vite 插件构建时 fetch）瞬时失败会回落 `0.0.0`——**这是机制预期**（旧 Astro 同样回落），CI 配 `GITHUB_TOKEN` 后稳定 |
| **共享组件 lint 约束** | `grep -rn "window.api\|electron\|@tauri-apps\|astro:" app/shared/ui/src` 必须为空 |

## 三、当前进度（分支上 24 个提交，main..HEAD）

### ✅ L0 基线 — 完成
- 提交 `9b5342e`：tasks/ 五层任务文档 + 契约/清单 3 份
- website 基线构建验证通过（21 页 / 3.1MB / dist）

### ✅ L1 共享组件库 — 主体完成
- 提交 `57f0f21`：`@srp-cfg/ui` 新增 9 组件（Card/PageHeader/SectionHeader/LabeledValue/Badge/Modal/CopyButton/Skeleton/EmptyState）
- Desktop 已接入（`92310ca`）；两端 global.css token 同名不同值；图标一律内联 SVG；零依赖
- 验证：`tsc -p app/desktop/tsconfig.renderer.json` + `vite build` 均通过

### 🔄 L2 Desktop → Tauri — 进行中（core 纯逻辑全量完成，Windows 实机部分待实机）
- `a5a41b9` workspace + core crate（vcfg/version/conflicts）；`a40c1fa` IPC 适配层；`a08ac67` migrate.rs + tauri.conf.json
- **core crate 纯逻辑全量迁移完成（WSL 可测）**：`c436140` L2.7 组件替换；`3c0298f` staging/installer/updater 纯逻辑（归类/Runtime 包识别/overlay 规划/append 合并/清单规范化/release 解析）+ 版本同步脚本；`16f3325` detection 纯逻辑（loginusers.vdf 用户识别/ACF StateFlags/libraryfolders）；`22a76f6` 清理误提交的 src-tauri/target（467 文件/136MB）
- **cargo test 84 个全绿（31 → 84），clippy 0 警告**
- ⚠️ 剩余（需 Windows 实机）：Rust services 的 fs/winreg 壳层（detection 注册表、staging zip、installer 落盘）、commands 注册（#[tauri::command]）、2.6 检测实机验收、2.8 打包。详见 `tasks/layer-2-desktop-tauri/TASK.md`

### ✅ L3 Website → Vite+React — 完成（页面迁移 + SEO + Astro 结构删除 + 部署链路统一）
- `a65659b`/`d1194df`/`c21c7fb`：骨架 + 布局（vite/react-router config、root/layout、Nav/Footer、routes.ts）
- `3954011`：**首页** React 化（Hero/Features/Showcase/Steps/CTA/TerminalDemo/ButtonLink）
- `fe186a9`：**下载页** React 化 + **版本注入机制**（vite 插件 config hook fetch → define 注入 `__SRP_CFG_LATEST_VERSION__`，替代 Astro 顶层 await）
- `f8a0fe1`：**关于页** React 化
- `f6eecb3`：**文档中心** Velite 管线（16 篇 md → sitemap/详情预渲染/TOC/侧边导航）
- `677e21c`：**指令检索中心** SEO 化（commands.json 随包打包 + 首屏 50 卡预渲染 + AI 面板 Turnstile/SSE）
- `f60786e`：**3.7 SEO 收尾**（sitemap.xml 插件 + robots.txt + SoftwareApplication JSON-LD）
- `919302a`：L3 收尾① Velite 数据源迁出 `src/content` → `content/`（root 同步，产物不变）
- `589fa79`：L3 收尾② 删除 Astro 旧结构 + scripts/依赖/tsconfig 切到 Vite+React Router
- `62b4cc5`：L3 收尾③ 部署链路统一（wrangler assets → `./build/client`，`wrangler dev --local` 验证通过）
- `ccecc19`：docs——PROGRESS/README 勾选 L3 收尾完成
- `c91b676`：build——layout.tsx 注释清理后同步 build/client 产物
- `70aa5c9`/`954f113`：**L3 可选遗留完成**——`/commands/{name}` 指令详情静态页（2785 条全量 SSG 预渲染 + DefinedTerm JSON-LD）+ /commands FAQPage JSON-LD；sitemap 增至 2806 URL。`pnpm build:web`（17s）+ tsc 无新增错误

### 🔄 L4 CI/CD — 前半完成（WSL），剩余待 Windows
- `bed306a`：deploy-website.yml 构建步骤注入 GITHUB_TOKEN（版本注入插件防 0.0.0 回落）；release-desktop.yml build-app 加 Rust toolchain（dtolnay stable + msvc target）+ cargo 缓存（swatinem，src-tauri/target）+ `cargo test -p srp-cfg-core`；**Electron 打包链未动**
- `3c0298f`：**版本统一机制** `app/desktop/scripts/sync-tauri-version.mjs`（package.json 唯一来源 → tauri.conf.json + Cargo.toml[package]；`--check` 供 CI；根脚本 `pnpm sync:version`）
- 待 Windows：`tauri build` 切换（NSIS/MSI）、删 `msi/` 与 electron-forge、onlyBuiltDependencies 清理、根 README 发布说明更新

## 四、下一步任务（按优先级）

### 1. L2 Desktop → Tauri 剩余部分（**需 Windows 实机**，见 AGENT-START.md 新提示词）
- Rust services 迁移（detection/staging/installer/updater → `src-tauri/src/services/`）+ commands 注册 + 2.5/2.6 测试与检测验证 + 2.8 打包
- 2.7 组件替换已在 WSL 完成（c436140），实机只需视觉回归
- 详见 `tasks/layer-2-desktop-tauri/TASK.md`

### 2. L4 CI/CD（前半已做：website 构建 token + desktop Rust toolchain/cache + 版本同步脚本）
- 待 Windows：`tauri build` 切换（NSIS/MSI）、删 `msi/` 与 electron-forge、onlyBuiltDependencies 清理、根 README 发布说明更新

### 3. L3 可选遗留 — 已完成
- `/commands/{name}` 指令详情静态页（70aa5c9）+ JSON-LD 扩展（FAQ/DefinedTerm 指令数据集）均已完成，`pnpm build:web` + tsc 验证通过

## 五、关键技术参考

| 主题 | 位置 |
| :--- | :--- |
| 分层任务总览 + 决策表 | `tasks/README.md` |
| Desktop API 契约（适配层基准） | `tasks/layer-2-desktop-tauri/api-contract.md` |
| Website /api/chat + commands.json 契约 | `tasks/layer-3-website-react/api-contract.md` |
| 组件抽取归类 | `tasks/layer-1-shared-ui/component-inventory.md` |
| 共享库约定（token/边界/校验命令） | `app/shared/ui/README.md` |
| Rust 纯逻辑（可测部分） | `app/desktop/src-tauri/core/src/`（vcfg/version/conflicts/migrate） |
| Tauri IPC 适配层 | `app/desktop/src/renderer/lib/api.ts` |
| Website React 结构 | `app/website/src/app/`（root/layout/routes/components/commands/docs） |
| **Velite 内容管线** | `app/website/velite.config.ts`（root: **content**，L3 收尾迁出 src/content）+ `src/app/components/docs/docs-data.ts`（生成物 `.velite/docs.json` 已提交，`react-router build` 依赖它存在） |
| **版本注入机制** | `app/website/vite.config.ts`（srp-cfg-latest-version 插件）+ `src/data/version.ts` |
| **sitemap/JSON-LD** | `app/website/vite.config.ts`（srp-cfg-sitemap 插件）+ `src/app/routes/home.tsx` + `public/robots.txt` |
| 旧 Astro 结构（已删） | 已删除（919302a/589fa79）；对照历史看 `git show ba2ad47:app/website/src/pages` 等 |

## 六、遗留注意点（交接时别忘）

1. `api.ts` 的 `getFilePaths` 是 stub（返回 []）→ UploadZone 需改用 tauri 拖拽/对话框插件（L2）
2. ~~部署链路未统一~~ → **已统一（62b4cc5）**：`wrangler.json` assets → `./build/client`（react-router SSG 输出）；`wrangler dev --local` 已验证静态页 + `/api/chat` 走 worker 逻辑（无 Turnstile 时返回错误 JSON，无需真连 AI）
3. **版本注入回落**：GitHub 未认证限流时构建产物显示 `0.0.0`（旧 Astro 同样行为）；CI 配 GITHUB_TOKEN 后稳定
4. **Velite 0.4 坑**：`s.slug()` 只校验不派生路径（需 `s.path().transform()`）；生成 `index.js` 含 `with { type: 'json' }`（Vite 6 解析不稳定）→ 代码直接 import `docs.json`。数据源在 `app/website/content/`（L3 收尾迁出 `src/content`）
5. **commands.json 打包**：2785 条随路由 chunk 打包（gzip ~169KB），构建有 chunk 体积警告属预期
6. **tsc 遗留 1 个错误已解决（19093f7）**：`vite.config.ts` plugins 数组 `as PluginOption[]`（根/子 vite 6.4.2/6.4.3 hoisting 导致两份 @types/estree，类型身份不一致）。`tsc -b` 现零错误；未改依赖解析
7. 共享组件替换（Modal/CopyButton/Badge/Card）已全部接入 Desktop 页面（L2.7，c436140）；剩余视觉回归需 Windows 实机
8. 新 agent 首次跑 install 记得带 `--registry=https://registry.npmmirror.com`
9. **wrangler.json 的 `assets.directory` 已指向 `./build/client`**（62b4cc5 统一）——后续不要再改回 ./dist；bindings（AI/Vectorize）拓扑零改动
10. **build/client 按仓库惯例随提交同步**（L3 起每次构建产物会提交）；指令详情页使 sitemap 增至 2806 URL，属预期
11. **desktop Tailwind `@source`**：`app/desktop/src/renderer/styles/global.css` 顶部的 `@source "../../../../shared/ui/src"` 不可删除——移除会导致共享组件专属类（如 CopyButton 的 teal/accent 变体）静默缺失
