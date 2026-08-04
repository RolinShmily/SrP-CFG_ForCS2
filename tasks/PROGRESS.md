# 重构进度汇总 & 交接手册

> 更新时间：2026-08-04（L2 收尾完成：Rust 壳层 + commands 49 个 + 2.6 实机验收 + 2.8 打包 NSIS 2.5MB/MSI 3.6MB；L4 后半完成；L0.6 黄金样本已落地）
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

## 三、当前进度（分支上 35 个提交，main..HEAD）

### ✅ L0 基线 — 全部完成（含 0.6 黄金样本，2026-08-04 Track B 落地）
- 提交 `9b5342e`：tasks/ 五层任务文档 + 契约/清单 3 份
- website 基线构建验证通过（21 页 / 3.1MB / dist）
- ✅ **0.6 黄金样本**：`tasks/layer-0-baseline/` 下 fixtures（30 文件）+ `scripts/golden-node.mjs`（Node 版执行器，117 断言全 PASS）+ `golden-outputs/*.json` + `golden-samples.md`（5+2 业务路径 × 输入→期望输出，Rust core 84 测试逐条对照，勾选率 100% ≥80%）；复现：`bash tasks/layer-0-baseline/scripts/run-golden.sh` + `cargo test -p srp-cfg-core`；注册表读取为 Windows 实机验收项（L2.6）

### ✅ L1 共享组件库 — 主体完成
- 提交 `57f0f21`：`@srp-cfg/ui` 新增 9 组件（Card/PageHeader/SectionHeader/LabeledValue/Badge/Modal/CopyButton/Skeleton/EmptyState）
- Desktop 已接入（`92310ca`）；两端 global.css token 同名不同值；图标一律内联 SVG；零依赖
- 验证：`tsc -p app/desktop/tsconfig.renderer.json` + `vite build` 均通过

### ✅ L2 Desktop → Tauri — 完成（Windows 实机收尾 2026-08-04）
- `a5a41b9` workspace + core crate（vcfg/version/conflicts）；`a40c1fa` IPC 适配层；`a08ac67` migrate.rs + tauri.conf.json
- **core crate 纯逻辑全量**：`c436140` L2.7 组件替换；`3c0298f` staging/installer/updater 纯逻辑 + 版本同步脚本；`16f3325` detection 纯逻辑；`22a76f6` 清理误提交 target；**84 测试全绿，clippy 0 警告**
- **Windows 实机收尾（本次）**：
  - 壳层 `src-tauri/src/services/`：detection（winreg 注册表 + fs 扫描 → core）、staging（zip 解压 + 归类）、installer（三清单 + 部署/恢复）、updater（GitHub 网络 + 缓存）、vcfg/user_config/migrate；全部调用 core 纯逻辑只做 I/O
  - commands 注册 49 个 `#[tauri::command]`（对应 api.ts 命令名，window.api 签名零改动）；`log:new` → emit/listen
  - **2.6 实机验收通过**：`cargo test -- --ignored detect_all` 本机实测 Steam=C:\Program Files (x86)\Steam、CS2 installed(D:)、3 账号、当前用户 RoL1n_SrP、VCFG 79/2/92/338
  - **2.8 打包成功**：`tauri build` NSIS 2.5MB + MSI 3.6MB（≤20MB ✓，原 Electron 100MB → 降幅 97%）；build.rs/icons 补齐、license 接入根 LICENSE
  - 遗留：`getFilePaths` stub（UploadZone 待插件化）、2.7 视觉回归 GUI 目验、tauri dev 全功能手动验收

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

### ✅ L4 CI/CD — 完成（后半 Windows 实机 2026-08-04）
- `bed306a`：deploy-website GITHUB_TOKEN + release-desktop Rust toolchain/cargo 缓存 + core 测试
- `3c0298f`：版本统一机制 `pnpm sync:version`（`--check` 供 CI）
- **后半完成（本次）**：release-desktop.yml 切 `tauri build`（NSIS+MSI 上传，删 Portable.zip）；删 `msi/`、electron-forge 配置/依赖（forge.config.ts、vite.main/preload/renderer.config.ts、@electron-forge/*、electron、electron-winstaller、archiver、winreg）、onlyBuiltDependencies 清理；根 README 发布说明更新（Tauri v2/NSIS+MSI/Rust+MSVC）；`src/main/services/*.ts` + `src/preload/preload.ts` 保留为 L0.6 黄金样本参考（不参与构建）
- 遗留：L4 验收 28（真实升级路径迁移验证）、GitHub Actions 真实触发验证（需推 tag）

## 四、下一步任务（按优先级）

### ✅ 1. L0.6 黄金样本记录 — 已完成（2026-08-04，Track B）
- fixtures（伪 Steam 目录 / 上传包 zip+目录 / 游戏 CFG 冲突场景）+ Node 版执行器（stub electron/winreg，117 断言全 PASS）+ `golden-samples.md`（输入→期望输出 + Rust 84 测试对照，100% ≥80%）
- Windows 实机验收 L2 时直接引用 `golden-samples.md` §1（注册表三分支）与 §7 遗留项

### ✅ 2. L2 Desktop → Tauri 收尾 — 已完成（2026-08-04 Windows 实机）
- 壳层 services + 49 commands + 2.6 实机验收 + 2.8 打包（NSIS 2.5MB / MSI 3.6MB）；详见上方 L2 进度段
- 遗留：getFilePaths 插件化、2.7 视觉回归 GUI、tauri dev 全功能手动验收
- **core 纯逻辑已完成**（7 模块 / 84 测试，lib.rs 导出全部 API）。剩余 = fs/winreg 壳层接线：
  `src-tauri/src/services/`（detection 注册表 + staging zip + installer 落盘 + updater 网络）→ 全部调用 core 纯逻辑
- commands 注册（原 ipc.ts 40+ handler → `#[tauri::command]`，签名对齐 api-contract.md）+ 2.6 检测实机验收 + 2.8 打包（NSIS/MSI ≤20MB）
- 2.7 组件替换已在 WSL 完成（c436140），实机只需视觉回归
- 详见 `tasks/layer-2-desktop-tauri/TASK.md`

### ✅ 3. L4 CI/CD — 已完成（release-desktop 切 tauri build、electron-forge/WiX 清理、README 更新）
- 遗留：真实升级路径迁移验证（L4 验收 28）、推 tag 触发真实 CI 验证

### 4. L3 可选遗留 — 已完成
- `/commands/{name}` 指令详情静态页（70aa5c9）+ JSON-LD 扩展（FAQ/DefinedTerm 指令数据集）均已完成，`pnpm build:web` + tsc 验证通过

## 五、关键技术参考

| 主题 | 位置 |
| :--- | :--- |
| 分层任务总览 + 决策表 | `tasks/README.md` |
| Desktop API 契约（适配层基准） | `tasks/layer-2-desktop-tauri/api-contract.md` |
| Website /api/chat + commands.json 契约 | `tasks/layer-3-website-react/api-contract.md` |
| 组件抽取归类 | `tasks/layer-1-shared-ui/component-inventory.md` |
| 共享库约定（token/边界/校验命令） | `app/shared/ui/README.md` |
| Rust 纯逻辑（可测部分） | `app/desktop/src-tauri/core/src/`（vcfg/version/conflicts/migrate/staging/installer/updater/detection，**84 测试**，lib.rs 导出全部 API） |
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
12. **版本统一脚本**：`pnpm sync:version`（`app/desktop/scripts/sync-tauri-version.mjs`）——发版前跑，或 CI 用 `--check`；core/ 子 crate 版本（0.1.0）不参与同步
13. **core 新增纯逻辑约束**：必须保持「无 tauri/fs/平台依赖」（只允许 serde/serde_json），否则 WSL 无法测试；壳层（I/O）按 core lib.rs 导出的 API 接线
14. **L0.6 黄金样本**（Track B 已交付）：`tasks/layer-0-baseline/` 下 fixtures + `scripts/golden-node.mjs`（117 断言）+ `golden-outputs/` + `golden-samples.md`；复现 `bash tasks/layer-0-baseline/scripts/run-golden.sh`；`.sandbox/` 与 `scripts/golden-node.cjs`（esbuild 产物）已 gitignore
15. **L2/L4 Windows 实机收尾已完成**（2026-08-04）：壳层 + 49 commands + 2.6 实机验收 + 2.8 打包（NSIS 2.5MB/MSI 3.6MB）+ release-desktop 切 tauri build + electron-forge/WiX 清理
16. **Windows 侧构建环境**（本机实测可用）：Windows 侧 rustup 1.97.1（rsproxy 镜像）+ MSVC 14.51 BuildTools + cargo 镜像（C:\Users\Rolin\.cargo\config.toml → rsproxy）+ 构建用本地盘工作区（C:\Users\Rolin\srp-cfg-build，因 \\wsl$ 9p 上无法增量编译/重装 node_modules）；`CARGO_TARGET_DIR` 指本地盘
17. **electron-forge 已删但保留**：`src/main/services/*.ts`（golden runner 依赖）+ `src/preload/preload.ts`（API 契约基准）为参考实现保留，不参与构建；tsconfig.json 主进程配置保留供参考
18. **L4 遗留**：真实升级路径迁移验证（L2.3 在真实安装场景）、GitHub Actions 真实触发（需推 tag）；L2 遗留：getFilePaths 插件化、2.7 视觉回归 GUI 目验
