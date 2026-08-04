# 重构进度汇总 & 交接手册

> 更新时间：2026-08-05（**全部遗留收尾完成**：迁移验证+修复 f7f2fa6、物理拖拽人工验证、正式图标 0e09eb6、**GH Actions 真实触发验证通过**——v3.1.10 tag 发布真实 Release，3 工作流全绿，updater 端到端验证 hasDesktopUpdate:true）
> 分支：`refactor/tauri-vite-react`（基于 main）
> 用途：供新开 agent 无缝继续执行（先读本文件 + `tasks/README.md` + 对应层 TASK.md + `tasks/AGENT-START.md`）

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
  - ✅ **tauri 全功能验收实测揪出并修复 4+1 个隐藏 bug（全部提交，勿回退）**：
    1. `27f8f9d` **IPC 命令名全断（致命）**：api.ts 用 Electron 时代 `"installer:detectAll"` 式通道名，但 Rust `#[tauri::command]` 注册的是 snake_case 函数名 → 49 个 window.api 调用运行时全部失败。已修：api.ts 全部 invoke 字符串改为真实命令名（44 个 invoke + 4 个窗口命令，参数 key camelCase）
    2. `27f8f9d` **ureq 3.3 TLS panic（致命）**：默认 TLS provider 是 Rustls 但未编译（default-features=false + native-tls）→ https 直接 panic。已修：updater.rs + staging.rs 显式 `ureq::tls::TlsConfig::builder().provider(ureq::tls::TlsProvider::NativeTls)`
    3. `27f8f9d` **TitleBar 拖拽机制**：`-webkit-app-region` 仅 Electron 有效；Tauri v2 需 `data-tauri-drag-region="deep"`。已改
    4. `5b8eb94` **updater GitHub null body（真实环境才发现）**：v3.1.4 的 `body:null` 使整个 release 列表 serde 解析失败 → 静默降级 hasUpdate:false（远端明明有 v3.1.7-9）。已修：GitHubReleaseRaw 的 name/body 改 `Option<String>` + `#[serde(default)]`
    5. `418c2d4` **TitleBar 拖拽 ACL**：capabilities/default.json 只有 core:default/opener:default/dialog:default，但 `core:window:default` 不含 `allow-start-dragging` → drag.js invoke 被 ACL 拒。已加 `core:window:allow-start-dragging`
    6. `556fc21` renderer dist 刷新：仓库内 `app/desktop/dist` 曾含旧命令名（443bb84 时未重建），已重新 vite build 同步
  - ✅ **修复后 CDP 实测全部通过（release exe + schtasks 独立启动）**：detectAll（Steam=C:\Program Files (x86)\Steam、CS2 installed(D:)、3 账号、VCFG 79 bindings 与 golden 一致）、全数据命令（version 3.1.6 / upload history / installed / res / save / userConfig）、`log:new` 实时日志、**窗口控制（maximize→zoomed / toggle→restore / minimize→iconic / close→进程退出）**、UploadZone 原生对话框（ESC 关闭后应用正常）、**updater（checkForUpdate→hasUpdate:true 含 3.1.9/3.1.8/3.1.7，hasConfigUpdate:true 且 hasDesktopUpdate:false 正确——新版为 config-only；getLatestVersion→3.1.9；getUpdateHistory→10 条；cache.json 写入；UI 更新列表正常）**、全 7 页逐一渲染目验（无报错文案）
  - ✅ **TitleBar 物理拖拽 OS 循环目验已人工验证通过**（2026-08-05，用户手动实测符合目标结果；agent 自动模拟一次未动仅作记录）、每页截图已存档（`tasks/layer-2-desktop-tauri/screenshots/`，d3dbf29）

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

### ✅ 2. L2 遗留：2.7 视觉回归 + `tauri dev` 全功能手动验收 — 已完成（4+1 bug 已修提交；物理拖拽已人工验证通过）
- **已实测（CDP + release exe）**：IPC 全链路、detectAll 与 golden 一致、全数据命令、`log:new` 实时日志、**窗口控制四连测**（maximize/restore/minimize/close）、UploadZone 原生对话框、**updater 修复后 hasUpdate:true（3.1.9）**、全 7 页渲染目验
- **已修 5 个问题并提交（27f8f9d/5b8eb94/418c2d4/556fc21）**：IPC 命令名、ureq TLS、TitleBar drag-region 属性、**updater GitHub null body（v3.1.4 body:null 导致 serde 解析失败）**、**拖拽 ACL（core:window:allow-start-dragging）**
- **未完成**：TitleBar 物理拖拽 OS 循环目验 → **已人工验证通过**（2026-08-05，用户手动实测符合目标结果：拖拽移动正常、按钮区不可拖、三按钮功能正常、无 ACL 报错）；agent 自动模拟一次未动（合成输入不入 WebView2 拖拽捕获，不作失败依据）仅作记录；每页截图存档（可选）
- 注意：dev 进程树会被 WSL interop 回收 → 稳定验收用 release exe + schtasks；**直接 cargo build 必须带 --features tauri/custom-protocol**（否则 exe 无前端产物加载 devUrl）

### ✅ 3. L4 遗留：真实升级路径迁移验证（L4 验收 28）— 已完成（2026-08-05，揪出并修复 1 个隐藏 bug）
- **发现的 bug（f7f2fa6，勿回退）**：`initialize_staging_area()` 在 `run_migration()` 之前创建同名 7 个目录（cfg/annotations/video/upload/download/save/res）→ `plan_migration` 把旧数据全判为 Skip → `should_migrate=false` → **旧 `%APPDATA%/srp-cfg` 数据永不迁移、不写 .migrated**（静默数据不可见）。修复：lib.rs 调整顺序（先迁移后建目录）+ migrate.rs 忽略空目录（骨架目录不算真实数据）
- **验收流程（真实安装场景）**：备份两目录 → 删 `top.srprolin.cfg` → 重新 `pnpm tauri build`（含全部修复）→ NSIS 静默安装（`/S` → `%LOCALAPPDATA%\SrP-CFG Installer`）→ 首启动核对：**283 文件/7 类字节级一致迁移（vs 备份 0 缺失 0 大小差）、legacy 目录清空、.migrated 写入**；CDP 实测 detectAll（Steam+CS2 installed+3 账号）、getUserConfig 读到迁移后 custom.cfg、UI 正常
- **附带发现（构建环境）**：Windows 工作区 pnpm-lock.yaml 是旧的（vite 6.4.3，仓库已 6.4.2）→ 构建产物 JS 与仓库不一致；已同步 lockfile + `pnpm install` 对齐（vite 6.4.2，JS 字节一致）；CSS 多 19 个死工具类源于工作区非 git 仓库（Tailwind v4 无 .gitignore 扫描了 node_modules），CI 上 git checkout 不存在此问题，仓库 dist 为基准
- 注：机器上现留有**已安装的 SrP-CFG Installer 3.1.6**（真实安装验收产物，含全部修复），不需要可卸载

### ✅ 4. L4 遗留：GitHub Actions 真实触发验证 — 已完成（2026-08-05，v3.1.10）
- 流程：推 `refactor/tauri-vite-react` 分支到 origin（新建远程分支，不触发任何 workflow）→ 推 `v3.1.10` annotated tag（指向 e79c3aa，含全部修复）→ 3 个工作流全部触发且全绿：
  - **release-desktop.yml**（run #50）：validate-tag → detect-changes → build-app（windows-latest：pnpm install + Rust toolchain + cargo test core + tauri build）→ release-desktop → **发布 GitHub Release v3.1.10**：`SrP-CFG_Setup_x64.exe`（NSIS 2.5MB）+ `SrP-CFG_Installer.msi`（2.5MB）+ `DESKTOP_UPDATE_MARKER`
  - **release-config.yml**（run #31）：v3 配置包 → `SrP-CFG_Runtime_Core.zip` 上传到同一 Release
  - **deploy-website.yml**（run #93）：网站部署（tag 触发）
- **端到端 updater 验证**：安装版应用（3.1.6）checkForUpdate(true) → hasUpdate:true、**hasDesktopUpdate:true**（v3.1.10 含 DESKTOP_UPDATE_MARKER）、hasConfigUpdate:true、releases 列表含 v3.1.10 完整变更日志；cache.json 已更新（104KB）
- 注：远程 main（c73de80）比本地 main 多 1 个自动提交（c73de80 每日命令库更新）；refactor 领先 origin/main 58、落后 1——**用户计划将 refactor 合并到 main**（需带上 c73de80）
- 体积：CI 构建 MSI 2.5MB / NSIS 2.5MB（≤20MB ✓，本地构建为 MSI 3.7MB——CI 产物略小）

### ✅ 5. 正式图标替换 — 已完成（2026-08-05，0e09eb6）
- 源：`app/desktop/resources/icon.ico`（与 `C:\Users\Rolin\Downloads\icon.ico` 字节一致 md5=6ef8adac；即重构前 Electron 软件图标，forge.config `icon: ./resources/icon`）→ `tauri icon` 重生成全套（32x32/128x128/128x128@2x/icon.ico/icon.png + 1024 源图 icon-source.png）
- 验证：生成 icon.ico vs 官方 0% 差；安装版 exe 内嵌图标 1.0% 差（32px 缩样）；重装后应用正常
- ⚠️ 坑：改图标后需删 `src-tauri/target/release/build/srp-cfg-desktop-*` 再构建（tauri-build 的 resource.lib 是缓存的，不删会链接旧图标）

### ✅ 已完成（不再执行）
- L0.6 黄金样本（Track B）、L2 收尾（壳层 + 49 commands + 2.6 实机验收 + 2.8 打包）、L4 后半（CI 切换 + 清理）、L3 全部（含可选遗留）、L2 遗留① getFilePaths 插件化、**tauri 全功能验收 4+1 个隐藏 bug 修复**（IPC 命令名/ureq TLS/拖拽机制/updater null body/拖拽 ACL，27f8f9d/5b8eb94/418c2d4/556fc21）

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
19. **IPC 命令名（已修并提交 27f8f9d，勿回退）**：api.ts 的 invoke 字符串必须用 Rust `#[tauri::command]` 函数名（snake_case，如 `detect_all`/`updater_check`），**不是** Electron 时代 `"installer:detectAll"` 式通道名——旧的 49 个调用运行时全断（此坑只有真机 tauri dev 才暴露，tsc 验不出）。参数 key 按 Rust 参数名 camelCase（accountId/usePersonalCfg/file_name→fileName）；枚举值 camelCase（overlay/append/upload/download/install/save/res）。校验方法：`node /tmp/cdp.mjs "window.__TAURI_INTERNALS__.invoke('xxx')"`；跨查命令名用 grep（见 AGENT-START）
20. **ureq 3.3 TLS（已修并提交 27f8f9d，勿回退）**：`default-features=false` + `native-tls` 时默认 TLS provider 仍是 Rustls 且未编译 → https 请求直接 panic（`uri scheme is https, provider is Rustls...`）。必须显式 `.tls_config(ureq::tls::TlsConfig::builder().provider(ureq::tls::TlsProvider::NativeTls).build())`（注意路径是 `ureq::tls::` 不是 `ureq::`）
21. **TitleBar 拖拽（已修并提交 27f8f9d + 418c2d4，勿回退）**：Tauri v2 只认 `data-tauri-drag-region` 属性（drag.js：`e.button===0 && (e.detail===1||2) && isDragRegion(composedPath)` → invoke `plugin:window|start_dragging`），`-webkit-app-region: drag`（Electron 机制）无效；`="deep"` 表示子树可拖、按钮等可点击元素自动阻断。**必须同时配 ACL**：capabilities/default.json 加 `core:window:allow-start-dragging`（`core:window:default` 不含它，缺了 invoke 被拒 "not allowed by ACL"）。CDP 合成 mousedown 需 `detail:1` 才触发
22. **tauri dev 进程树会被 WSL interop 静默回收**：dev（bat→pnpm→tauri CLI→vite+cargo→exe）运行数分钟后整体消失，无崩溃记录/无 WER。稳定 GUI 验收建议：`pnpm tauri build` 后用 schtasks 独立启动 release exe（`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9223`），避免 dev 树被回收
23. **vite HMR 读的是 Windows 工作区文件**：WSL 改 renderer 代码后必须同步到 `C:\Users\Rolin\srp-cfg-build\app\desktop`（cp 对应文件），否则 dev 里是旧代码
24. **GUI 验收手段：WebView2 CDP**：启动时设 `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222`，`curl http://127.0.0.1:9222/json` 拿 webSocketDebuggerUrl，用 node（v24 内置 WebSocket）做 Runtime.evaluate 驱动页面/断言 DOM（`/tmp/cdp.mjs` 助手）；原生对话框用 PowerShell EnumWindows/GetWindowText 验证、SendKeys ESC 关闭；窗口拖拽用 SetCursorPos + mouse_event 模拟
25. **updater GitHub null body（已修并提交 5b8eb94，勿回退）**：远端 GitHub 有 v3.1.7-9，但 checkForUpdate 返回 hasUpdate:false——根因不是限流：GitHub Releases API 对无正文 release（本仓库 v3.1.4）返回 `body:null`，GitHubReleaseRaw 的 body:String 严格反序列化使**整个 10 条列表解析失败**，Err 分支静默降级为空结果（无任何报错暴露）。已修：name/body 改 `Option<String>` + `#[serde(default)]`，map_raw 用 `as_deref().unwrap_or("")`。修复后实测 hasUpdate:true（3.1.9），hasDesktopUpdate:false 正确（新版无 DESKTOP_UPDATE_MARKER 是 config-only）
26. **直接 cargo build 必须带 `--features tauri/custom-protocol`（2026-08-04 实测，勿回退）**：Tauri 用 `custom-protocol` feature 决定内嵌前端 assets（`dev: cfg!(not(feature = "custom-protocol"))`）；`tauri build` CLI 自动加该 feature，但**直接 `cargo build --release` 不会** → exe 无内嵌产物、加载 devUrl(localhost:5173) 报 ERR_CONNECTION_REFUSED。构建 exe 用 `cargo build --release --features tauri/custom-protocol`（或走 pnpm tauri build）。**不要**在 Cargo.toml 给 tauri 加默认 custom-protocol（会破坏 tauri dev 的 devUrl/HMR 行为）
27. **Windows curl.exe SChannel CRL 吊销检查离线**：本机 `curl.exe https://...` 报 `CRYPT_E_REVOCATION_OFFLINE (0x80092013)`（curl 显式请求 CRL 校验，机器连不上 CRL 服务器）；PowerShell Invoke-WebRequest/.NET HttpClient 正常；App 内 ureq(native-tls/schannel) 不受影响（独立测试通过）。查 GitHub API 建议用 WSL curl 或 PowerShell
28. **capabilities ACL 与拖拽（已修 418c2d4）**：`core:window:default` 权限集**不含** `allow-start-dragging`；新增 capabilities 权限后需重新 `cargo build`（ACL 编译进二进制）
29. **Windows 构建产物路径双轨**：`CARGO_TARGET_DIR=C:\Users\Rolin\srp-cfg-target`（测试/临时构建）与 `src-tauri/target/`（tauri build 默认）是两套目录；run-release.bat 指向 `src-tauri/target/release/`，用 srp-cfg-target 构建后需手动 cp exe 过去再启动
30. **本机全屏窗口遮挡（GUI 验收环境限制，2026-08-05 更新）**：此前记载的"FLUTTERVIEW 终端遮挡"实为 **QuarkCloudDrive（夸克网盘）播放器窗口**（class=FLUTTER_RUNNER_WIN32_WINDOW，pid=quark_cloud_drive，常驻 52,35-2513,1370 全屏并抢前台）；开发终端是 Windows Terminal（class=CASCADIA_HOSTING_WINDOW_CLASS）。两者都全屏盖住 app → 物理鼠标点击/拖拽前需先把它们最小化/移开。窗口控制/鼠标模拟助手：`winctl.ps1`（rect/move/click/state）+ `cursormove.ps1`；窗口最小化/还原/置前助手 `winman.ps1 -Action minimize|restore|front -Hwnd 0x...`（2026-08-05 新增，保存 hwnd 可还原）；CDP 助手 `/tmp/cdp.mjs "<expr>" [port]`（本机 9223）
31. **迁移被 staging 预建目录跳过（已修 f7f2fa6，勿回退）**：`initialize_staging_area()` 会先建 cfg/annotations/video/upload/download/save/res 七个目录到 `app_data_dir()`；若在 `run_migration()` 之前执行，`plan_migration` 会把旧数据全判 Skip → 迁移静默不执行（不写 .migrated）。已修：顺序调整（先迁移）+ migrate.rs 对空目录不算"已有"。改迁移相关代码时保持这两点
32. **Windows 工作区 pnpm-lock.yaml 需随仓库同步（2026-08-05 实测）**：工作区 lockfile 可能比仓库旧（如 vite 6.4.3 vs 仓库 6.4.2）→ `pnpm tauri build` 的 renderer 产物与仓库 dist 不一致（JS 哈希不同）。同步 lockfile 后 `pnpm install --registry=https://registry.npmmirror.com` 对齐。另外**工作区非 git 仓库**（无 .gitignore）→ Tailwind v4 自动扫描会把 node_modules 也扫进去，CSS 多 19 个死工具类（container/z-3/w-6 等，~3.6KB）；CI 上 git checkout 无此问题，仓库 dist 为基准。工作区构建产物与仓库 dist 不一致时先查这两点
33. **真实安装验收产物留存在本机**：`%LOCALAPPDATA%\SrP-CFG Installer`（NSIS 静默安装产物，含全部修复 + 迁移 fix + 正式图标）；`%APPDATA%/top.srprolin.cfg` 为真实迁移后数据（.migrated=1，legacy 目录已清空）；备份在 `C:\Users\Rolin\srp-cfg-build\backup\migration-20260804-204128\`
34. **改图标后 exe 图标不更新（2026-08-05 实测，0e09eb6）**：tauri-build 的 `target/release/build/srp-cfg-desktop-*/out/resource.lib`（windres 产物）是缓存的——`tauri icon` 重生成 icons/ 后直接 `pnpm tauri build`，exe 内嵌的还是旧图标（ExtractAssociatedIcon 直方图可验证）。**必须删 `target/release/build/srp-cfg-desktop-*` 再构建**。验证方法：PowerShell `[System.Drawing.Icon]::ExtractAssociatedIcon(<exe>).ToBitmap().Save(...)` 后用 ImageMagick 与源图对比
