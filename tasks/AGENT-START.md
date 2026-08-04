# 新 Agent 启动提示词（可直接用于 `pi -p --no-session "..."`）

你是 SrP-CFG 重构项目的执行 agent，接手 **L2/L4 遗留收尾**。主链已全部完成：core crate 纯逻辑
（7 模块 / 84 测试）、L2 Desktop → Tauri（Rust 壳层 + 49 commands + 2.6 实机验收 + 2.8 打包
NSIS 2.5MB / MSI 3.6MB）、L4 后半（release-desktop 切 tauri build + electron-forge/WiX 清理）、
L0.6 黄金样本（Track B）。**遗留收尾已推进到最后一程（2026-08-05）**：
getFilePaths 插件化✅（443bb84）、tauri 全功能验收 4+1 个隐藏 bug 已修✅（27f8f9d/5b8eb94/418c2d4/556fc21）、
2.7 视觉回归 7 页目验 + 窗口控制 + updater 全通过、**L4 真实升级迁移验证完成并揪出修复 1 个隐藏 bug**
（迁移被 staging 预建目录跳过，f7f2fa6——修复后真实安装场景 283 文件字节级一致迁移）。
**剩余**：GitHub Actions 真实触发（推 tag 会发布真实 Release，**需用户确认**）、正式图标替换（可选）。
TitleBar 物理拖拽已**人工验证通过**（2026-08-05）；每页截图已存档（`tasks/layer-2-desktop-tauri/screenshots/`）。
GitHub Actions 真实触发、正式图标替换（可选）。本机（Win11 26200 + WSL Arch）即 Windows 实机。

## 第一步：读文件（必须按顺序读完再动手）

1. `tasks/PROGRESS.md` —— 交接手册（进度、环境坑、下一步任务、遗留注意点 1-30）
2. `tasks/README.md` —— 分层任务总览 + 架构决策表 D1-D10（必须遵守）
3. `tasks/layer-2-desktop-tauri/TASK.md` —— L2（遗留：getFilePaths / 2.7 视觉回归 / tauri dev 验收）
4. `tasks/layer-4-ci-release/TASK.md` —— L4（遗留：升级迁移验证 / GH Actions 真实触发）
5. 涉及 renderer 改动时加读：`tasks/layer-2-desktop-tauri/api-contract.md`（window.api 契约，
   **签名不可变**）+ `app/desktop/src/renderer/lib/api.ts`（适配层，命令名对应 `src-tauri/src/commands/`）
6. 涉及 UI 时加读：`tasks/layer-1-shared-ui/component-inventory.md` + `app/shared/ui/README.md`

## 环境铁律

- 分支：`refactor/tauri-vite-react`（先 `git checkout` 确认）
- **pnpm install 必须带 `--registry=https://registry.npmmirror.com`**（npm 官方源证书报错）
- **WSL（Arch Linux）**：无 sudo；tauri 壳缺 webkit2gtk 无法在 WSL 编译 → 纯逻辑测试只跑
  `cargo test -p srp-cfg-core`（**84 全绿**，clippy 1 个 doc 警告在 core/src/detection.rs 系遗留非本次引入）
- **Windows 实机构建**（本机可用，Track A 用）：
  - Windows 侧 rustup 1.97.1（rsproxy 镜像）+ MSVC 14.51 BuildTools + node/pnpm 已就绪；
    cargo 源已配 rsproxy（`C:\Users\Rolin\.cargo\config.toml`）
  - **必须在本地盘工作区构建**：`C:\Users\Rolin\srp-cfg-build`（从 WSL 项目 rsync/cp 过去，
    排除 node_modules/target/dist/.vite/out）。`\\wsl$` 9p 上 cargo 增量锁失败、Windows node
    无法解析 Linux 平台二进制 → 不能直接在 WSL 路径跑 Windows 构建
  - Windows 侧命令模板：`cmd.exe /c 'pushd C:\Users\Rolin\srp-cfg-build\app\desktop && set PATH=C:\Users\Rolin\.cargo\bin;C:\Users\Rolin\AppData\Roaming\npm;%PATH% && pnpm tauri build'`
  - **⚠️ 直接 `cargo build --release` 会得到不带前端产物的 exe**（Tauri 用 `custom-protocol`
    feature 决定内嵌 assets；cargo 直接构建默认不启用 → exe 加载 devUrl(localhost:5173) 报
    ERR_CONNECTION_REFUSED）。必须 `cargo build --release --features tauri/custom-protocol`
    或走 `pnpm tauri build`（CLI 自动加 feature）。**已修的坑，勿回退 Cargo.toml 加默认 feature**
    （会破坏 tauri dev 的 devUrl 行为）
  - cargo（Windows 侧）跑测试：`CARGO_TARGET_DIR=C:\Users\Rolin\srp-cfg-target` + `CARGO_INCREMENTAL=0`；
    注意该目录产物与 `src-tauri/target/` 是两套，构建后要把 exe 复制到 run-release.bat 指向的路径
  - 源码改动后：`cp app/desktop/... /mnt/c/Users/Rolin/srp-cfg-build/app/desktop/...` 同步（排除 target）
- **IPC 命令名铁律（已修 27f8f9d，勿回退）**：api.ts 的 invoke 字符串 = Rust `#[tauri::command]` 函数名
  （snake_case：`detect_all`/`updater_check`/`user_config_save`...），**不是** Electron 时代
  `"installer:detectAll"` 式通道名（全部 49 个调用运行时失败，tsc 验不出）；参数 key 按
  `rename_all = "camelCase"`（accountId/usePersonalCfg/file_name→fileName），枚举 camelCase
  （overlay/append/upload/download/install/save/res）。改动 Rust command 名必须同步 api.ts。
  **跨查命令名**：`grep -hoP 'fn \K[a-z_0-9]+(?=\()' src-tauri/src/commands/*.rs | sort -u` vs
  `grep -oP 'invoke(?:<[^>]+>)?\("\K[a-z_0-9]+' src/renderer/lib/api.ts | sort -u`（comm 应为空；
  多出的 5 个 Rust fn 是无 #[tauri::command] 的内部 helper）
- **ureq TLS 铁律（已修 27f8f9d，勿回退）**：ureq 3.3 默认 TLS provider 是 Rustls 且未编译该 feature
  → https 直接 panic；必须显式 `.tls_config(ureq::tls::TlsConfig::builder().provider(ureq::tls::TlsProvider::NativeTls).build())`
  （路径 `ureq::tls::`）。所有新 https 请求（updater/download）都要带
- **GitHub API 字段可为 null（已修 5b8eb94，勿回退）**：`body`/`name` 对无正文/无标题的 release
  返回 null（本仓库 v3.1.4 即 body:null）→ 反序列化必须 `Option<String>` + `#[serde(default)]`，
  否则整个 release 列表解析失败、updater 静默降级为 hasUpdate:false（无任何报错暴露，坑）
- **TitleBar 拖拽（ACL 已修 418c2d4，勿回退）**：Tauri v2 只认 `data-tauri-drag-region` 属性
  （drag.js：`e.button===0 && (e.detail===1||2) && isDragRegion(composedPath)` → invoke
  `plugin:window|start_dragging`）；`-webkit-app-region: drag` 是 Electron 机制无效。
  **capabilities/default.json 必须含 `core:window:allow-start-dragging`**（`core:window:default`
  不含它！缺了拖拽被 ACL 拒，实测 "not allowed by ACL"）。`="deep"` 表示子树可拖、按钮自动阻断。
  **注意**：CDP 合成 mousedown 需 `detail:1` 才会触发 drag.js（默认 0 不触发）；物理拖拽验证
  依赖真实鼠标会话
- **dev 进程树会被 WSL interop 静默回收**（无崩溃记录）：稳定 GUI 验收用 release exe + schtasks
  独立启动（`run-release.bat`：设 `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9223`
  + `WEBVIEW2_USER_DATA_FOLDER=C:\Users\Rolin\srp-cfg-build\webview2-cdp` 再启动 exe；
  `schtasks /create /tn srp-cfg-release /tr "C:\Users\Rolin\srp-cfg-build\run-release.bat" /sc once /st 23:59 /f && schtasks /run /tn srp-cfg-release`）
- **vite HMR 读 Windows 工作区文件**：WSL 改 renderer 后必须同步到 `C:\Users\Rolin\srp-cfg-build\
  app\desktop` 对应文件，否则 dev/release 里是旧代码（构建前务必全量同步）；renderer 产物在
  `app/desktop/dist`（vite root=src/renderer, outDir=../../dist），仓库惯例随提交同步
- **GUI 验收手段（CDP）**：`node /tmp/cdp.mjs "<expr>" [port]`（支持端口参数，默认 9222，本机用 9223）；
  Runtime.evaluate 驱动页面/断言 DOM。**窗口控制/鼠标模拟助手**：`C:\Users\Rolin\srp-cfg-build\
  winctl.ps1`（-Action rect/move/click/state：GetWindowRect/SetCursorPos/mouse_event/
  IsIconic/IsZoomed）+ `cursormove.ps1`（纯光标移动+Release，配合 OS 拖拽循环）
- **⚠️ 本机 GUI 环境限制（重要）**：当前登录会话有一个 **Flutter 终端窗口（class=FLUTTERVIEW）常驻
  全屏前台**（即运行 pi 的终端，rect≈60,9-2505,1335），会**盖住 srp-cfg 应用窗口并不断抢回前台** →
  物理鼠标点击/拖拽无法直接落到 app 窗口。已绕过的办法：窗口命令用 CDP 直调 `window.api.maximize()/
  minimize()/close()/isMaximized()` 验证（实测全通过）；物理拖拽 OS 循环验证需**先把终端最小化/
  移开**（用户配合）或换无遮挡会话。`SetWindowPos(HWND_TOPMOST)` 也压不住它
- **Windows curl.exe SChannel 吊销检查离线**：`curl.exe https://...` 报
  `CRYPT_E_REVOCATION_OFFLINE (0x80092013)`（curl 显式请求 CRL 检查）；PowerShell
  Invoke-WebRequest / .NET HttpClient 正常。App 内 ureq(native-tls/schannel) 不受影响（实测通）。
  WSL 侧 curl 正常 → 查 GitHub API 用 WSL curl
- **绝对不要修改**：
  - `app/website/src/worker.ts`、`app/website/src/lib/ai-stream.ts`（AI 服务，L3 零改动保留）
  - `app/website/wrangler.json` 的 bindings（AI/Vectorize）与 assets 指向（`./build/client`，勿改回）
  - `window.api` 全部方法签名（对照 api-contract.md，renderer 零改动前提——getFilePaths 例外
    是换实现不改签名）
  - 已有测试：`core/` crate 84 测试、worker/ai-stream 12 测试、golden runner 117 断言
  - `src-tauri/Cargo.toml` **不要**给 tauri 加 `custom-protocol` 默认 feature（会破坏 dev）
- 共享组件（@srp-cfg/ui）lint：`grep -rn "window.api\|electron\|@tauri-apps\|astro:" app/shared/ui/src` 必须为空
- **core crate 新代码约束**：只允许 serde/serde_json 依赖；不得出现 tauri/fs/std::fs/平台 API（否则 WSL 测不了）
- **保留参考实现（勿删）**：`app/desktop/src/main/services/*.ts`（L0.6 golden runner 依赖）+
  `app/desktop/src/preload/preload.ts`（API 契约基准）——electron-forge 已删但这两个保留，不参与构建

## 本次任务：遗留收尾（按优先级）

### 1. getFilePaths 插件化（L2 遗留）✅ 已完成（443bb84 + 6e8472f）
- 已实现：`@tauri-apps/plugin-dialog` 2.7.2（JS）+ `tauri-plugin-dialog`（Rust 注册）+ `dialog:default` capability；
  UploadZone 点击 → 原生对话框（.zip/.cfg/.txt 多选）、拖拽 → `onDragDropEvent`（tauri://drag-drop）真实路径（含文件夹）；
  api.ts `getFilePaths(files)` 换实现不改签名（路径字符串归一化/去重，File 对象返回 []）
- 验证：WSL tsc + vite build ✓、core 84 测试 ✓、Windows `tauri build` NSIS 2.6MB/MSI 3.7MB ✓

### 2. 2.7 视觉回归 + tauri dev 全功能验收（L2 遗留）✅ 基本完成（4+1 个 bug 已修并提交）
- **已修 5 个问题（全部已提交，勿回退）**：
  - `27f8f9d` IPC 命令名全断：api.ts 曾用 `"installer:detectAll"` 式通道名 → 49 个调用运行时失败；
    已改 api.ts invoke 字符串为真实命令名（detect_all/updater_check/...，参数 key camelCase）
  - `27f8f9d` ureq 3.3 TLS panic：显式 `ureq::tls::TlsConfig::builder().provider(ureq::tls::TlsProvider::NativeTls)`
    （updater.rs + staging.rs）
  - `27f8f9d` TitleBar 拖拽：改 `data-tauri-drag-region="deep"`（Tauri v2 不认 -webkit-app-region）
  - `5b8eb94` **updater GitHub null body**：v3.1.4 的 body:null 导致整个 release 列表 serde 解析失败 →
    静默降级 hasUpdate:false（真实环境实测发现；GitHubReleaseRaw 改 Option<String>+#[serde(default)]）
  - `418c2d4` **TitleBar 拖拽 ACL**：capabilities 缺 `core:window:allow-start-dragging` →
    invoke 被 ACL 拒；已加
- **已实测通过（CDP，release exe + schtasks）**：
  - detectAll（Steam=C:\Program Files (x86)\Steam、CS2 installed(D:)、3 账号、VCFG 79/2/92/338 与 golden 一致）
  - 全数据命令（version 3.1.6 / upload history / installed / res / save / userConfig）
  - `log:new` 实时日志（LogPanel 显示路径检测日志）
  - 全 7 页逐一渲染目验（快速开始/下载/安装/我的配置/恢复中心/当前安装/关于，无报错文案）
  - **窗口控制实测**：maximize→zoomed、再 maximize→restore（toggle）、minimize→iconic、
    close→进程退出（CDP 直调 window.api + PowerShell GetWindowRect/IsIconic/IsZoomed 断言）
  - **updater 修复后实测**：checkForUpdate(true)→hasUpdate:true（v3.1.9/3.1.8/3.1.7，
    hasConfigUpdate:true、hasDesktopUpdate:false 正确——新版为 config-only 无 DESKTOP_UPDATE_MARKER）、
    getLatestVersion→3.1.9、getUpdateHistory→10 条、cache.json 写入、UI 更新列表正常显示
  - UploadZone 原生对话框（点击弹出"打开"对话框，ESC 关闭后应用正常）
- **未完成/待办**：
  - ✅ **TitleBar 物理拖拽 OS 循环目验 — 已人工验证通过**（2026-08-05，用户手动实测符合目标结果：拖拽移动正常、按钮区不可拖、三按钮功能正常、无 ACL 报错）；agent 自动模拟一次未动（合成输入不入 WebView2 拖拽捕获）仅作记录；人工规范 `tasks/layer-2-desktop-tauri/manual-titlebar-drag-test.md` 保留供复盘
  - ⏳ 每页截图存档（可选，视觉回归记录）→ 已存档：`tasks/layer-2-desktop-tauri/screenshots/` 7 页（d3dbf29）
  - 注：dev 进程树会被 WSL interop 静默回收 → 稳定验收用 release exe + schtasks（见环境铁律）

### ✅ 3. 真实升级路径迁移验证（L4 验收 28）— 已完成（2026-08-05，揪出并修复 1 个隐藏 bug）
- **发现的 bug（f7f2fa6，勿回退）**：`initialize_staging_area()` 在 `run_migration()` 之前建同名 7 目录 → 迁移计划全判 Skip → **旧数据永不迁移、不写 .migrated**（静默数据不可见）。修复：lib.rs 顺序（先迁移）+ migrate.rs 忽略空目录
- **真实安装验收全通过**：备份 → 删 `top.srprolin.cfg` → `pnpm tauri build` → NSIS 静默装到 `%LOCALAPPDATA%\SrP-CFG Installer` → 首启动：283 文件/7 类字节级一致迁移（vs 备份 0 缺失 0 差）、legacy 清空、.migrated 写入；CDP 实测 detectAll + getUserConfig 均正常
- 注意：安装包若未重新打包仍是旧代码（无 4+1 个 bug 修复）——打包前先同步源码；机器上留有已安装的验收产物（见 PROGRESS.md 注意点 33）

### ✅ 4. GitHub Actions 真实触发验证（L4 遗留）— 已完成（2026-08-05，v3.1.10）
- 流程：推 `refactor/tauri-vite-react` 到 origin（新建远程分支，无 workflow 触发）→ 推 `v3.1.10` annotated tag（e79c3aa）→ **3 工作流全绿**：
  - release-desktop.yml（#50）：windows-latest 干净环境 pnpm install + rust toolchain + cargo test core + tauri build（CLI 自动带 custom-protocol）→ Release v3.1.10：NSIS 2.5MB + MSI 2.5MB + DESKTOP_UPDATE_MARKER
  - release-config.yml（#31）：Runtime_Core.zip 配置包
  - deploy-website.yml（#93）：网站部署
- **端到端**：安装版 3.1.6 updater → hasUpdate:true、hasDesktopUpdate:true（含变更日志）；cache.json 更新
- 用户后续将 refactor 合并 main（注意远程 main 领先 1 个自动提交 c73de80）

### ✅ 5. 正式图标替换 — 已完成（2026-08-05，0e09eb6）
- 源：`app/desktop/resources/icon.ico`（= 用户指定 `C:\Users\Rolin\Downloads\icon.ico`，字节一致；重构前 Electron 软件图标）→ `tauri icon` 重生成全套
- 验证：icon.ico vs 官方 0% 差、安装版 exe 1.0% 差（缩样）；重装后功能正常
- ⚠️ 改图标后必须删 `target/release/build/srp-cfg-desktop-*` 再构建（resource.lib 缓存坑）

## 提交规范

- 一个 commit 只做一件事；message 以 `feat(desktop):` / `refactor(desktop):` / `feat(website):` /
  `chore(ci):` / `docs(tasks):` 开头，正文列出改动与验证结果
- 中途遇到阻塞先记录（更新 PROGRESS.md 遗留注意点）再继续，不要改其他层
- renderer 产物 `app/desktop/dist` 随代码提交同步刷新（仓库惯例，勿漏——上次就漏了导致仓库 dist 带旧命令名）

## 完成后输出

- `git log --oneline -5` 确认提交
- 用 5 行以内总结：做了什么、验证结果（构建/测试/打包）、环境限制说明、遗留 TODO
- 如 PROGRESS.md 需要更新（勾选任务），顺带提交一个 docs 更新 commit
