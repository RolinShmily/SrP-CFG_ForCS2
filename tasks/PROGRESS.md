# 重构进度汇总 & 交接手册

> 更新时间：2026-08-04（L2 遗留收尾进行中：getFilePaths 插件化已完成并提交；tauri dev 全功能验收中**实测揪出 3 个隐藏 bug**——IPC 命令名全断 / ureq TLS panic / TitleBar 拖拽失效，均已修复待提交）
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
| **WSL 环境** | **Arch Linux** on Windows（`wslpath -w /` → `\\wsl.localhost\archlinux\`）。tauri 壳缺 webkit2gtk 无法在 WSL 编译；L2/L4 Windows 部分在本机 Windows 实机完成（见下） |
| **Rust 可用但无 webkit2gtk** | `cargo 1.97` 可用；但 tauri 壳编译需要 `webkit2gtk-4.1`（无 sudo 装不了）→ **纯逻辑必须放 `core/` crate**，测试用 `cargo test -p srp-cfg-core` |
| **Desktop Tailwind 不扫共享库** | `@tailwindcss/postcss` 以 CSS 文件目录为基准做文件扫描，不会跨到 `app/shared/ui`。**桌面端必须在 `src/renderer/styles/global.css` 顶部保留 `@source "../../../../shared/ui/src"`**（L2.7 已加；曾导致共享组件专属类缺失）；website 用 `@tailwindcss/vite`（模块图扫描）无此问题 |
| **GitHub API 限流** | 未认证 60 次/h/IP。版本注入（vite 插件构建时 fetch）瞬时失败会回落 `0.0.0`——**这是机制预期**（旧 Astro 同样回落），CI 配 `GITHUB_TOKEN` 后稳定 |
| **共享组件 lint 约束** | `grep -rn "window.api\|electron\|@tauri-apps\|astro:" app/shared/ui/src` 必须为空 |
| **Windows 实机构建** | 本机（Win11 26200）可用：Windows 侧 rustup 1.97.1（rsproxy 镜像）+ MSVC 14.51 BuildTools + node/pnpm 10.32。构建必须在**本地盘工作区**（`C:\Users\Rolin\srp-cfg-build`）：`\\wsl$` 9p 上 cargo 增量锁失败、Windows node 无法解析 Linux 平台二进制（esbuild 等）；`CARGO_TARGET_DIR` 指本地盘。cargo 源已配 rsproxy（`C:\Users\Rolin\.cargo\config.toml`） |

## 三、当前进度（分支上 41 个提交，main..HEAD）

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
- **遗留收尾（本次，2026-08-04）**：
  - ✅ **getFilePaths 插件化已完成并提交**（`443bb84` + `6e8472f`）：`@tauri-apps/plugin-dialog` 2.7.2 + Rust `tauri-plugin-dialog` 注册 + `dialog:default` capability；UploadZone 点击 → 原生对话框（.zip/.cfg/.txt 多选）、拖拽 → `onDragDropEvent` 真实路径（含文件夹）；api.ts getFilePaths 换实现不改签名（路径字符串归一化/去重）
  - ⚠️ **tauri dev 全功能验收实测揪出 3 个隐藏 bug（均已修复、待提交）**：
    1. **IPC 命令名全断（致命）**：api.ts 用 Electron 时代 `"installer:detectAll"` 式通道名，但 Rust `#[tauri::command]` 注册的是 snake_case 函数名（`detect_all` 等）→ 49 个 window.api 调用运行时全部失败（此前只做过 tsc 静态验证没跑真机）。已修：api.ts 全部 invoke 字符串改为真实命令名（44 个 invoke + 4 个窗口命令）
    2. **ureq 3.3 TLS panic（致命）**：updater/download 用 ureq 3.3，默认 TLS provider 是 Rustls 但未编译该 feature（`default-features=false` + `native-tls`）→ `checkForUpdate`/`downloadFromUrl` 一执行就 panic 崩溃（被 bug 1 掩盖）。已修：updater.rs + staging.rs 显式 `ureq::tls::TlsConfig::builder().provider(ureq::tls::TlsProvider::NativeTls)`
    3. **TitleBar 拖拽失效**：原用 `.drag-region { -webkit-app-region: drag }`（Electron 机制），Tauri v2 只认 `data-tauri-drag-region` 属性（drag.js）→ 窗口不可拖拽。已修：TitleBar 容器加 `data-tauri-drag-region="deep"`（按钮自动阻断拖拽）并删除 CSS
  - ✅ **修复后 CDP 实测通过**：detectAll（Steam=C:\Program Files (x86)\Steam、CS2 installed(D:)、3 账号、VCFG 79 bindings 与 golden 一致）、全数据命令（version 3.1.6 / upload history / downloads / installed / save / res / userConfig）、`log:new` 实时日志（LogPanel 显示路径检测日志）、isMaximized/maximize 切换、UploadZone 点击弹出原生"打开"对话框（ESC 关闭后应用正常）、checkForUpdate 不再 panic（返回 hasUpdate:false，疑似 GitHub 未认证限流 graceful 回落，待核对）
  - ⏳ 未完成：TitleBar 拖拽/最小化/关闭实测（鼠标模拟未跑）、全 7 页逐一目验、updater hasUpdate:false 与远端 v3.1.7-9 存在需核对

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

## 四、下一步任务（L2/L4 主链已完成，剩余为遗留收尾，按优先级）

### ✅ 1. L2 遗留：文件路径获取插件化（getFilePaths）— 已完成（443bb84）
- `@tauri-apps/plugin-dialog` + Rust `tauri-plugin-dialog` + `dialog:default`；UploadZone 点击 → 原生对话框、拖拽 → `onDragDropEvent` 真实路径；api.ts getFilePaths 换实现不改签名
- 验证：WSL tsc + vite build ✓、core 84 测试 ✓、Windows `tauri build` NSIS 2.6MB/MSI 3.7MB ✓

### ⏳ 2. L2 遗留：2.7 视觉回归 + `tauri dev` 全功能手动验收 — 进行中
- **已实测（CDP 驱动）**：IPC 全链路（命令名已修）、detectAll 与 golden 一致、全数据命令、`log:new` 实时日志、maximize 切换、UploadZone 原生对话框、checkForUpdate 不再 panic
- **已修 3 个隐藏 bug（待提交）**：IPC 命令名全断（api.ts invoke 字符串）、ureq 3.3 TLS panic（显式 NativeTls provider）、TitleBar 拖拽（data-tauri-drag-region）
- **未完成**：TitleBar 拖拽/最小化/关闭实测（需鼠标模拟，注意 dev 进程树会被 WSL interop 回收，建议用 release exe + schtasks 独立启动）、全 7 页逐一目验、updater hasUpdate:false 核对（远端有 v3.1.7-9，疑似 GitHub 未认证限流）
- 注意：dev 会拉起 renderer dev server（vite 5173）+ 窗口；首次 tauri dev 在本地盘工作区跑

### 3. L4 遗留：真实升级路径迁移验证（L4 验收 28）
- 安装旧版 Electron 数据（`%APPDATA%/srp-cfg`）→ 安装新版 Tauri 安装包 → 首启动迁移到 `app_data_dir()`（%APPDATA%/top.srprolin.cfg），核对 install/save/res/uploads 清单完整、`.migrated` 标记生成

### 4. L4 遗留：GitHub Actions 真实触发验证
- 推 `v*` tag → release-desktop.yml 全绿（windows-latest 上 Rust toolchain + pnpm install + tauri build + 上传 NSIS/MSI）；deploy-website.yml 正常
- 本机无法执行，需在真实 repo 触发

### 5. 可选：正式图标替换
- `src-tauri/icons/` 当前为脚本生成的占位图标（深蓝底十字）；可用品牌图源 `tauri icon` 重新生成全套

### ✅ 已完成（不再执行）
- L0.6 黄金样本（Track B）、L2 收尾（壳层 + 49 commands + 2.6 实机验收 + 2.8 打包）、L4 后半（CI 切换 + 清理）、L3 全部（含可选遗留）、L2 遗留① getFilePaths 插件化

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
18. **L4 遗留**：真实升级路径迁移验证（L2.3 在真实安装场景）、GitHub Actions 真实触发（需推 tag）；L2 遗留：getFilePaths 插件化✅（443bb84）、2.7 视觉回归 GUI 目验进行中
19. **IPC 命令名（已修，待提交）**：api.ts 的 invoke 字符串必须用 Rust `#[tauri::command]` 函数名（snake_case，如 `detect_all`/`updater_check`），**不是** Electron 时代 `"installer:detectAll"` 式通道名——旧的 49 个调用运行时全断（此坑只有真机 tauri dev 才暴露，tsc 验不出）。参数 key 按 Rust 参数名 camelCase（accountId/usePersonalCfg/file_name→fileName）；枚举值 camelCase（overlay/append/upload/download/install/save/res）。校验方法：`node /tmp/cdp.mjs "window.__TAURI_INTERNALS__.invoke('xxx')"`
20. **ureq 3.3 TLS（已修，待提交）**：`default-features=false` + `native-tls` 时默认 TLS provider 仍是 Rustls 且未编译 → https 请求直接 panic（`uri scheme is https, provider is Rustls...`）。必须显式 `.tls_config(ureq::tls::TlsConfig::builder().provider(ureq::tls::TlsProvider::NativeTls).build())`（注意路径是 `ureq::tls::` 不是 `ureq::`）
21. **TitleBar 拖拽（已修，待提交）**：Tauri v2 只认 `data-tauri-drag-region` 属性（源码 drag.js），`-webkit-app-region: drag`（Electron 机制）无效；`="deep"` 表示子树可拖、按钮等可点击元素自动阻断
22. **tauri dev 进程树会被 WSL interop 静默回收**：dev（bat→pnpm→tauri CLI→vite+cargo→exe）运行数分钟后整体消失，无崩溃记录/无 WER。稳定 GUI 验收建议：`pnpm tauri build` 后用 schtasks 独立启动 release exe（`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9223`），避免 dev 树被回收
23. **vite HMR 读的是 Windows 工作区文件**：WSL 改 renderer 代码后必须同步到 `C:\Users\Rolin\srp-cfg-build\app\desktop`（cp 对应文件），否则 dev 里是旧代码
24. **GUI 验收手段：WebView2 CDP**：启动时设 `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222`，`curl http://127.0.0.1:9222/json` 拿 webSocketDebuggerUrl，用 node（v24 内置 WebSocket）做 Runtime.evaluate 驱动页面/断言 DOM（`/tmp/cdp.mjs` 助手）；原生对话框用 PowerShell EnumWindows/GetWindowText 验证、SendKeys ESC 关闭；窗口拖拽用 SetCursorPos + mouse_event 模拟
25. **updater 待核对**：远端 GitHub 有 v3.1.7-9（带 MSI/Portable 资产），但本机 checkForUpdate 返回 hasUpdate:false —— 网络失败时 graceful 回落到空结果（无错误暴露），疑似 GitHub 未认证限流（60 次/h/IP，本机 curl+app 已消耗），需 GITHUB_TOKEN 或配额恢复后复核
