# 重构进度汇总 & 交接手册

> 更新时间：2026-08-04
> 分支：`refactor/tauri-vite-react`（基于 main）
> 用途：供新开 agent 无缝继续执行（先读本文件 + `tasks/README.md` + 对应层 TASK.md）

---

## 一、总体目标

1. **Desktop**：Electron → **Tauri v2**（Rust 后端 + React 19 前端保留），体积 100MB→~15MB
2. **Website**：Astro → **Vite + React 19 + React Router 7（SSG 预渲染）**，AI worker（`worker.ts`）**零改动保留**
3. **组件库**：desktop-first 扩展 `@srp-cfg/ui`，Website 消费；Website 展示 Desktop 演示截图
4. **SEO**：文档中心 + 指令检索中心均需静态化（当前指令中心是客户端 fetch `commands.json`，爬虫不可见）

架构决策表（D1-D10）见 `tasks/README.md`，**新 agent 必须遵守**。

---

## 二、环境注意事项（新 agent 必读，都是踩过的坑）

| 事项 | 说明 |
| :--- | :--- |
| **npm 官方源不可用** | `CERT_HAS_EXPIRED`/`ECONNRESET` 频繁。**所有 pnpm install 必须加 `--registry=https://registry.npmmirror.com`** |
| **WSL 环境** | Ubuntu-on-Windows。desktop 的 Electron 打包无法在本环境验证（win32 目标），L2 的 Windows 部分需 Windows 实机 |
| **Rust 可用但无 webkit2gtk** | `cargo 1.97` 可用；但 tauri 壳编译需要 `webkit2gtk-4.1`（无 sudo 装不了）→ **纯逻辑必须放 `core/` crate**，测试用 `cargo test -p srp-cfg-core` |
| **pi -p 后台并行** | `pi -p --no-session "<提示词>"` 可派生独立子任务（已验证成功 1 次：L3 骨架）。子任务只写文件、不装依赖时最安全 |
| **共享组件 lint 约束** | `grep -rn "window.api\|electron\|@tauri-apps\|astro:" app/shared/ui/src` 必须为空 |

---

## 三、当前进度（分支上 10 个提交）

### ✅ L0 基线 — 完成
- 提交 `9b5342e`：tasks/ 五层任务文档 + 契约/清单 3 份：
  - `tasks/layer-2-desktop-tauri/api-contract.md`（window.api 40+ 方法签名，L2 适配层基准）
  - `tasks/layer-3-website-react/api-contract.md`（/api/chat 契约 + commands.json 结构 + Turnstile 流程）
  - `tasks/layer-1-shared-ui/component-inventory.md`（组件 A/B/C 三档归类）
- website 基线构建验证通过（21 页 / 3.1MB / dist）

### ✅ L1 共享组件库 — 主体完成
- 提交 `57f0f21`：`@srp-cfg/ui` 新增 9 组件（Card/PageHeader/SectionHeader/LabeledValue/Badge/Modal/CopyButton/Skeleton/EmptyState）
- **Desktop 已接入**：6 页用共享 PageHeader、DetectionCard 用 LabeledValue、UpdateModal 用共享 Modal（`92310ca`）；本地 PageHeader/PathRow 已删
- 关键设计：**两端 global.css token 同名不同值**（bg #0b0d14 vs #090b10 等），组件只用 token 类名双端自适应；图标一律内联 SVG（不引 lucide）；零依赖（仅 react + clsx）
- 验证：`tsc -p app/desktop/tsconfig.renderer.json` + `vite build` 均通过

### 🔄 L2 Desktop → Tauri — 进行中（core 完成，Windows 部分待实机）
- 提交 `a5a41b9`：`app/desktop/src-tauri/` workspace（`core/` 纯逻辑 crate + tauri 壳 stub）
  - `core/src/vcfg.rs`：VDF tokenizer/parser、CFG convar 解析、snapshot→cfg（**15 测试**）
  - `core/src/version.rs`：compare_versions（**5 测试**，校准了 TS `pa[i]||0` 语义：`3.1.6-beta < 3.1.6`、只 strip 一个 `v`）
  - `core/src/conflicts.rs`：追加安装冲突决策（**7 测试**，>3 拒绝）
- 提交 `a40c1fa`：IPC 适配层 `app/desktop/src/renderer/lib/api.ts`（createApi() 实现 ElectronAPI，invoke 命令名一一对应），main.tsx 注入 window.api
- 提交 `a08ac67`：`core/src/migrate.rs` 数据迁移规划（**4 测试**）+ `tauri.conf.json`（窗口对齐 Electron：1707x960/min 896x504/decorations:false/#0b0d14；NSIS+MSI；zh-CN）
- **cargo test 总计 31 个全绿**
- ⚠️ 剩余（需 Windows 实机）：Rust services（detection 注册表/staging/installer/updater）、检测功能验证、打包验证。详见 `tasks/layer-2-desktop-tauri/TASK.md` 平台依赖表

### 🔄 L3 Website → Vite+React — 进行中（骨架 + 布局完成）
- 提交 `a65659b`（pi -p 子任务）+ `d1194df`（主会话修 API）+ `c21c7fb`（布局）：
  - `vite.config.ts`：react + tailwindcss + reactRouter() 插件
  - `react-router.config.ts`：appDirectory/src/app、ssr:true、prerender 5 路由
  - `src/app/root.tsx`：对齐 BaseLayout（meta/fonts/skip-link）
  - `src/app/layout.tsx` + `components/Nav.tsx`（NavLink active/移动端菜单）+ `components/Footer.tsx`
  - `src/app/routes.ts`：layout 包裹 5 个占位页
- **构建验证通过**：`npx react-router build` → `build/client/*.html` 预渲染含 Nav/Footer
- ⚠️ 版本坑已踩平（新 agent 别重复）：@react-router/dev 7.18 的 API——config 用**默认导出对象** `satisfies Config`（非 defineConfig）；插件入口 `@react-router/dev/vite`；`appDirectory` 在 react-router.config.ts；需要 `@react-router/node`

### ⬜ L4 CI/CD — 未开始（D4：等 L2/L3 测试完成）

---

## 四、下一步任务（按优先级）

### 1. L3 页面迁移（本环境可完整验证，推荐优先）
按 `tasks/layer-3-website-react/TASK.md` 3.2 节，把 Astro 页面/组件 React 化到 `src/app/routes/` 和 `src/app/components/`：
- [ ] **首页**：Hero/Features/Showcase/Steps/CTA/TerminalDemo（Astro → React，lucide-astro → lucide-react）
- [ ] **下载页**：`src/pages/download.astro`；`data/version.ts` 的顶层 await 需改为 SSG 加载（Vite 不支持模块顶层 await 的构建时执行——用 loader 或构建脚本）
- [ ] **关于页**：`src/pages/about.astro`
- [ ] **文档中心**（3.3 Velite）：18 篇 md 迁移到 Velite，DocsToc/DocsNavigation React 化，rehype-slug 锚点
- [ ] **指令检索中心**（3.4，SEO 重点）：commands.json 构建期预渲染（首屏 HTML 含指令文本）+ AI 面板 React 化（Turnstile + /api/chat SSE，逻辑在现 commands.astro script 里）
- [ ] 共享组件消费：SectionHeader/Card/Badge/CopyButton 等在页面中使用
- **每完成一块就 `npx react-router build` 验证 + commit**

### 2. L2 Windows 实机部分
- Rust services 迁移（detection/staging/installer/updater → `src-tauri/src/services/`）+ commands 注册 + 检测功能验证 + tauri dev 手动验收
- 详见 `tasks/layer-2-desktop-tauri/TASK.md`

### 3. L4 CI/CD（最后）
- website CI 换 vite build；desktop CI 加 Rust toolchain + cargo 缓存；删 msi/ 与 electron-forge

---

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
| Website 新结构 | `app/website/src/app/`（root/layout/routes/components） |
| 旧 Astro 结构（迁移来源，**先别删**） | `app/website/src/pages/` `components/` `layouts/` `content/` |

## 六、遗留注意点（交接时别忘）

1. `api.ts` 的 `getFilePaths` 是 stub（返回 []）→ UploadZone 需改用 tauri 拖拽/对话框插件
2. React Router build 输出到 `build/`，但 `wrangler.json` assets 指向 `./dist` → L3.5/L4 需统一（配置输出目录或改 wrangler）
3. Astro 结构（astro.config.ts / src/pages / src/layouts / src/content）**保留到迁移全部完成后**再删
4. 共享组件剩余替换（Modal/CopyButton/Badge 在 Desktop 其他页面的应用）在 L2.7
5. 新 agent 首次跑 install 记得带 `--registry=https://registry.npmmirror.com`
