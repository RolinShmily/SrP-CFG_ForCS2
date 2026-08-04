# 新 Agent 启动提示词（可直接用于 `pi -p --no-session "..."`）

你是 SrP-CFG 重构项目的执行 agent，接手 **L2/L4 遗留收尾**。主链已全部完成：core crate 纯逻辑
（7 模块 / 84 测试）、L2 Desktop → Tauri（Rust 壳层 + 49 commands + 2.6 实机验收 + 2.8 打包
NSIS 2.5MB / MSI 3.6MB）、L4 后半（release-desktop 切 tauri build + electron-forge/WiX 清理）、
L0.6 黄金样本（Track B）。剩余为遗留项：getFilePaths 插件化、2.7 视觉回归 + tauri dev 全功能
验收、真实升级迁移验证、GitHub Actions 真实触发、正式图标替换。本机（Win11 26200 + WSL Arch）
即 Windows 实机。

## 第一步：读文件（必须按顺序读完再动手）

1. `tasks/PROGRESS.md` —— 交接手册（进度、环境坑、下一步任务、遗留注意点 1-18）
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
  `cargo test -p srp-cfg-core`（**84 全绿**，clippy 0 警告）
- **Windows 实机构建**（本机可用，Track A 用）：
  - Windows 侧 rustup 1.97.1（rsproxy 镜像）+ MSVC 14.51 BuildTools + node/pnpm 已就绪；
    cargo 源已配 rsproxy（`C:\Users\Rolin\.cargo\config.toml`）
  - **必须在本地盘工作区构建**：`C:\Users\Rolin\srp-cfg-build`（从 WSL 项目 rsync/cp 过去，
    排除 node_modules/target/dist/.vite/out）。`\\wsl$` 9p 上 cargo 增量锁失败、Windows node
    无法解析 Linux 平台二进制 → 不能直接在 WSL 路径跑 Windows 构建
  - Windows 侧命令模板：`cmd.exe /c 'pushd C:\Users\Rolin\srp-cfg-build\app\desktop && set PATH=C:\Users\Rolin\.cargo\bin;C:\Users\Rolin\AppData\Roaming\npm;%PATH% && pnpm tauri build'`
  - cargo（Windows 侧）跑测试：`CARGO_TARGET_DIR=C:\Users\Rolin\srp-cfg-target` + `CARGO_INCREMENTAL=0`
  - 源码改动后：`cp -r app/desktop/* $W/app/desktop/` 同步（注意排除 target）
- **绝对不要修改**：
  - `app/website/src/worker.ts`、`app/website/src/lib/ai-stream.ts`（AI 服务，L3 零改动保留）
  - `app/website/wrangler.json` 的 bindings（AI/Vectorize）与 assets 指向（`./build/client`，勿改回）
  - `window.api` 全部方法签名（对照 api-contract.md，renderer 零改动前提——getFilePaths 例外
    是换实现不改签名）
  - 已有测试：`core/` crate 84 测试、worker/ai-stream 12 测试、golden runner 117 断言
- 共享组件（@srp-cfg/ui）lint：`grep -rn "window.api\|electron\|@tauri-apps\|astro:" app/shared/ui/src` 必须为空
- **core crate 新代码约束**：只允许 serde/serde_json 依赖；不得出现 tauri/fs/std::fs/平台 API（否则 WSL 测不了）
- **保留参考实现（勿删）**：`app/desktop/src/main/services/*.ts`（L0.6 golden runner 依赖）+
  `app/desktop/src/preload/preload.ts`（API 契约基准）——electron-forge 已删但这两个保留，不参与构建

## 本次任务：遗留收尾（按优先级）

### 1. getFilePaths 插件化（L2 遗留）
- 现状：`src/renderer/lib/api.ts` 的 `getFilePaths` 返回 []；UploadZone 上传无真实文件路径
- 方案：改用 `@tauri-apps/plugin-dialog`（open 多选文件/目录）或拖拽事件解析路径；
  保持 `getFilePaths(files)` 签名不变，renderer 调用点零改动
- 涉及：desktop 加 `@tauri-apps/plugin-dialog` 依赖 + Rust 侧 `tauri-plugin-dialog` 注册 +
  api.ts 实现 + UploadZone 触发方式适配；capabilities 需加 `dialog:default` 权限
- 验证：Windows 实机 `tauri dev` 上传流程可用（或至少构建通过 + 单元层面验证）

### 2. 2.7 视觉回归 + tauri dev 全功能验收（L2 遗留）
- 本机 `pnpm tauri dev`（本地盘工作区）：全页面可用性、TitleBar 拖拽/最小化/最大化/关闭、
  `log:new` 实时日志推送、检测/上传/overlay/append/恢复全流程 GUI 目验
- 对照 `tasks/layer-0-baseline/golden-samples.md` 期望清单逐项勾选

### 3. 真实升级路径迁移验证（L4 验收 28）
- 制造/保留旧版数据 `%APPDATA%/srp-cfg` → 安装新版 `SrP-CFG Installer_3.1.6_x64-setup.exe`
  → 首启动后核对 `app_data_dir()`（%APPDATA%/top.srprolin.cfg）清单完整 + `.migrated` 标记

### 4. GitHub Actions 真实触发验证（L4 遗留）
- 推 `v*` tag 触发 release-desktop.yml（windows-latest：rust toolchain + pnpm install + tauri build +
  NSIS/MSI 上传）+ deploy-website.yml 全绿确认；注意 windows-latest 上是干净环境，验证
  `pnpm install` + `tauri build` 链路与本地一致

### 5. 可选：正式图标替换
- `src-tauri/icons/` 现为占位图标（脚本生成）；拿到品牌源图后 `pnpm tauri icon <src.png>` 重生成
  全套（32x32/128x128/128x128@2x/icon.ico/icon.png）

## 提交规范

- 一个 commit 只做一件事；message 以 `feat(desktop):` / `refactor(desktop):` / `feat(website):` /
  `chore(ci):` / `docs(tasks):` 开头，正文列出改动与验证结果
- 中途遇到阻塞先记录（更新 PROGRESS.md 遗留注意点）再继续，不要改其他层
- 完成后如 PROGRESS.md 需要更新（勾选任务），顺带提交一个 docs 更新 commit

## 完成后输出

- `git log --oneline -5` 确认提交
- 用 5 行以内总结：做了什么、验证结果（构建/测试/打包）、环境限制说明、遗留 TODO
- 如 PROGRESS.md 需要更新（勾选任务），顺带提交一个 docs 更新 commit
