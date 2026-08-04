# 新 Agent 启动提示词（可直接用于 `pi -p --no-session "..."`）

你是 SrP-CFG 重构项目的执行 agent，接手 **网站生产路由问题修复**。主链 + 全部遗留收尾已完成：
core crate（7 模块 / 84 测试）、L2 Desktop → Tauri（49 commands + 2.6 实机验收 + 2.8 打包 NSIS/MSI）、
L3 网站 Vite+React（SSG 2806 页）、L4 CI/CD、迁移修复 f7f2fa6、物理拖拽人工验证、正式图标 0e09eb6、
**v3.1.10 已发布且 3 工作流全绿**（2026-08-05）。
**⚠️ 新问题（本次任务）**：v3.1.10 首次生产部署 Vite+React 站点后，用户反馈**除首页外其他路由都有严重问题**——
已定位：react-router 客户端拉取 `/__manifest`（路由发现）→ worker 对非资产路径抛 1101 异常 → 500 → 客户端路由断裂。
**任务书**：`tasks/layer-3-website-react/TASK-prod-routing-fix.md`（诊断事实、修复方向、验收标准已备好）。
本机（Win11 26200 + WSL Arch）即 Windows 实机。

## 第一步：读文件（必须按顺序读完再动手）

1. `tasks/PROGRESS.md` —— 交接手册（进度、环境坑、下一步任务、遗留注意点 1-36）
2. `tasks/layer-3-website-react/TASK-prod-routing-fix.md` —— **本次任务书（网站路由修复）**
3. `tasks/README.md` —— 分层任务总览 + 架构决策表 D1-D10（必须遵守）
4. `tasks/layer-3-website-react/TASK.md` —— L3（网站结构/部署链路/D6/D9）
5. 涉及部署链路时加读：`app/website/wrangler.json` + `.github/workflows/deploy-website.yml`
   （main=worker.ts + assets=build/client；**bindings 与 assets 指向勿改**）
6. 涉及页面/组件时加读：`tasks/layer-1-shared-ui/component-inventory.md` + `app/shared/ui/README.md`

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
- **⚠️ 本机到 Cloudflare 的 HTTPS 被证书拦截（2026-08-05 实测，PROGRESS 注意点 36）**：访问 `cfg.srprolin.top` 间歇 SSL 失败/证书错误（Edge ERR_CERT_COMMON_NAME_INVALID Subject=shou1.186288.xyz；PowerShell SSL/TLS 信任失败）；curl 多重试可得 200（服务端响应可信）。**本机浏览器渲染/导航测试不可靠**——生产验收需用户配合或换网络路径；开发期用 `wrangler dev --local` + curl 复现
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

## 本次任务：网站生产路由问题修复（见任务书 TASK-prod-routing-fix.md）

### ⚠️ 1. 复现 + 定位根因（wrangler dev --local）
- `pnpm build:web` → `cd app/website && npx wrangler dev --local`（assets 生效）→ curl `localhost:8787/__manifest` 与任意不存在路径：本地是否同样 500/1101？
- 若本地正常（404）→ 问题在部署/平台侧（对比 CI 部署产物与本地 build/client）；若本地同 500 → 完全本地可复现

### 2. 修复（铁律：worker.ts / ai-stream.ts / wrangler.json bindings 绝对不可改）
候选方向（详见任务书四-2）：
- ASSETS.fetch 1101 根因（绑定/部署配置/平台行为）
- react-router routeDiscovery lazy → 能否只依赖内联 manifest 不拉 /__manifest
- wrangler.json 层兑底（assets 规则/not_found_handling，需确认客户端回退行为）
- 最小改动 + 本地验证（wrangler dev --local 下 /__manifest 正确、无 manifest 错误、导航正常）

### 3. 部署 + 生产验收
- 提交（feat(website): / fix(website):）+ 同步 build/client → 推分支（deploy-website 监听 main 与 v* tag；
  当前 refactor 未合并 main，可推 v3.1.11 tag 或经用户同意合并/直推 main）
- 生产验证：curl /__manifest 不再 500、各路由 200；客户端导航测试需可靠网络路径（本机被证书拦截）
- 用户确认：除首页外全部路由恢复正常

### 4. 状态（已完成，勿重复）
- 遗留收尾全部完成：getFilePaths（443bb84）/ 2.7 验收（4+1 bug）/ 物理拖拽人工验证 / 截图存档（d3dbf29）/ 迁移验证+修复（f7f2fa6）/ GH Actions 真实触发（v3.1.10 三工作流全绿）/ 正式图标（0e09eb6）
- 机器上留有已安装的 SrP-CFG 3.1.6（验收产物，含全部修复 + 正式图标）

## 提交规范

- 一个 commit 只做一件事；message 以 `feat(desktop):` / `refactor(desktop):` / `feat(website):` /
  `chore(ci):` / `docs(tasks):` 开头，正文列出改动与验证结果
- 中途遇到阻塞先记录（更新 PROGRESS.md 遗留注意点）再继续，不要改其他层
- renderer 产物 `app/desktop/dist` 随代码提交同步刷新（仓库惯例，勿漏——上次就漏了导致仓库 dist 带旧命令名）

## 完成后输出

- `git log --oneline -5` 确认提交
- 用 5 行以内总结：做了什么、验证结果（构建/测试/打包）、环境限制说明、遗留 TODO
- 如 PROGRESS.md 需要更新（勾选任务），顺带提交一个 docs 更新 commit
