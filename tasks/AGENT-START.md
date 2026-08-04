# 新 Agent 启动提示词（可直接用于 `pi -p --no-session "..."`）

你是 SrP-CFG 重构项目的执行 agent，接手 **L2 Desktop → Tauri 剩余部分**（Rust services / commands / 打包，
需 Windows 实机；若环境是 WSL/Linux 则执行本环境可完成的替代任务，见下）。

## 第一步：读文件（必须按顺序读完再动手）

1. `tasks/PROGRESS.md` —— 交接手册（进度、环境坑、下一步任务、遗留注意点）
2. `tasks/README.md` —— 分层任务总览 + 架构决策表 D1-D10（必须遵守）
3. `tasks/layer-2-desktop-tauri/TASK.md` —— L2 总体任务（2.4-2.8 是本次主线）
4. `tasks/layer-2-desktop-tauri/api-contract.md` —— window.api 契约（适配层基准）
5. 若做 L2.7 组件替换：`tasks/layer-1-shared-ui/component-inventory.md` + `app/shared/ui/README.md`

## 环境铁律

- 分支：`refactor/tauri-vite-react`（先 `git checkout` 确认）
- **pnpm install 必须带 `--registry=https://registry.npmmirror.com`**（npm 官方源证书报错）
- WSL/Linux：无 sudo；tauri 壳（app/desktop/src-tauri）缺 webkit2gtk 无法编译 → **纯逻辑必须在
  `core/` crate，测试只跑 `cargo test -p srp-cfg-core`**；Electron 打包（win32）无法在本环境验证
- **绝对不要修改**：
  - `app/website/src/worker.ts`、`app/website/src/lib/ai-stream.ts`（AI 服务，L3 零改动保留）
  - `app/website/wrangler.json` 的 bindings（AI/Vectorize）与 assets 指向（已统一为 `./build/client`，勿改回）
  - `window.api` 全部方法签名（对照 api-contract.md，renderer 零改动前提）
  - 已有测试：`core/` crate 26+4 测试、worker/ai-stream 12 测试
- 共享组件（@srp-cfg/ui）lint：`grep -rn "window.api\|electron\|@tauri-apps\|astro:" app/shared/ui/src` 必须为空

## 本次任务：环境分支

先探测环境：`uname -a`（或 `cmd.exe /c ver`）。**Windows 实机 → Track A；WSL/Linux → Track B**。

### Track A（Windows 实机）：L2 主线 2.4-2.8
背景：core crate（vcfg/version/conflicts/migrate，31 测试）+ IPC 适配层（`src/renderer/lib/api.ts`）
+ tauri 骨架已就位（提交 a5a41b9/a40c1fa/a08ac67）。剩余全部是 Windows 平台相关：

1. **Rust services**（`src-tauri/src/services/`）：detection.rs（winreg 读 Steam）、staging.rs（zip）、
   installer.rs（install/res/save 三清单）、updater.rs（GitHub Releases）；vcfg/user_config 纯逻辑
   若能在 core 实现则优先（可测）
2. **commands 注册**：原 `ipc.ts` 40+ handler → `#[tauri::command]`，签名与 window.api 逐一对齐
3. **2.5/2.6 测试**：cargo-nextest + fixtures 假目录树；检测功能 4 项验证（注册表成功/失败/未安装等）
4. **2.7 组件替换**：Desktop 页面换 `@srp-cfg/ui`（PageHeader/Card/Modal/CopyButton/Badge）
5. **2.8 打包**：tauri.conf bundle（NSIS+MSI，Win10 21H2+）；`msi/` 与 `build:msi` 暂不删（L4 清）
   验收：`tauri dev` 全功能可用、cargo test 全绿、黄金样本对照 ≥80%、安装包 ≤20MB

### Track B（WSL/Linux）：本环境可完成的替代任务（按序，能者多劳）
1. **L2.7 前端组件替换**（本环境可构建验证）：Desktop 各页面替换 `@srp-cfg/ui` 组件
   （当前只接了 PageHeader×6/LabeledValue；剩 Modal/CopyButton/Badge 等），
   验证 `tsc -p app/desktop/tsconfig.renderer.json` + vite build
2. **L4 前半**：website CI 换 vite build（含 velite）+ deploy 流程对齐；desktop CI 加 Rust toolchain +
   cargo 缓存（改 `.github/workflows/`，勿动打包链）
3. **L3 可选遗留**：`/commands/{name}` 指令详情静态页（3.4 可选）、JSON-LD 扩展（FAQ/指令数据集）
   ——L3 验收全过，此两项为可选增量，改完跑 `pnpm build:web` + tsc 无新增错误

## 提交规范

- 一个 commit 只做一件事；message 以 `feat(desktop):` / `refactor(desktop):` / `feat(website):` /
  `chore(ci):` 开头，正文列出改动与验证结果
- 中途遇到阻塞先记录（更新 PROGRESS.md 遗留注意点）再继续，不要改其他层
- 完成后如 PROGRESS.md 需要更新（勾选任务），顺带提交一个 docs 更新 commit

## 完成后输出

- `git log --oneline -5` 确认提交
- 用 5 行以内总结：做了什么、验证结果（构建/测试/打包）、环境限制说明、遗留 TODO
- 如 PROGRESS.md 需要更新（勾选任务），顺带提交一个 docs 更新 commit
