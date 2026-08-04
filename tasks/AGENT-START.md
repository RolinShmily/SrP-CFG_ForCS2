# 新 Agent 启动提示词（可直接用于 `pi -p --no-session "..."`）

你是 SrP-CFG 重构项目的执行 agent，接手 **L2 Desktop → Tauri 收尾**。core crate 纯逻辑已全量完成
（7 模块 / 84 测试，lib.rs 导出全部 API），剩余是 Windows 实机部分（fs/winreg 壳层 + commands 注册 +
2.6 实机验收 + 2.8 打包 + L4 后半）；若环境是 WSL/Linux，则执行 **L0.6 黄金样本记录**（双版输出对照，见 Track B）。

## 第一步：读文件（必须按顺序读完再动手）

1. `tasks/PROGRESS.md` —— 交接手册（进度、环境坑、下一步任务、遗留注意点）
2. `tasks/README.md` —— 分层任务总览 + 架构决策表 D1-D10（必须遵守）
3. `tasks/layer-2-desktop-tauri/TASK.md` —— L2 总体任务（收尾：壳层/commands/2.6/2.8）
4. `tasks/layer-2-desktop-tauri/api-contract.md` —— window.api 契约（适配层基准）
5. 做黄金样本时加读：`tasks/layer-0-baseline/TASK.md`（0.6 节）+ `app/desktop/src/main/services/*.ts`
   （Node 参照）+ `app/desktop/src-tauri/core/src/`（Rust 对照，模块都有「对应原 TS」注释）

## 环境铁律

- 分支：`refactor/tauri-vite-react`（先 `git checkout` 确认）
- **pnpm install 必须带 `--registry=https://registry.npmmirror.com`**（npm 官方源证书报错）
- WSL/Linux：无 sudo；tauri 壳（app/desktop/src-tauri）缺 webkit2gtk 无法编译 → 纯逻辑必须在
  `core/` crate，测试只跑 `cargo test -p srp-cfg-core`（当前 **84 全绿**，clippy 0 警告）；Electron 打包（win32）无法在本环境验证
- **绝对不要修改**：
  - `app/website/src/worker.ts`、`app/website/src/lib/ai-stream.ts`（AI 服务，L3 零改动保留）
  - `app/website/wrangler.json` 的 bindings（AI/Vectorize）与 assets 指向（已统一为 `./build/client`，勿改回）
  - `window.api` 全部方法签名（对照 api-contract.md，renderer 零改动前提）
  - 已有测试：`core/` crate 84 测试、worker/ai-stream 12 测试
- 共享组件（@srp-cfg/ui）lint：`grep -rn "window.api\|electron\|@tauri-apps\|astro:" app/shared/ui/src` 必须为空
- **core crate 新代码约束**：只允许 serde/serde_json 依赖；不得出现 tauri/fs/std::fs/平台 API（否则 WSL 测不了）

## 本次任务：环境分支

先探测环境：`uname -a`（或 `cmd.exe /c ver`）。**Windows 实机 → Track A；WSL/Linux → Track B**。

### Track A（Windows 实机）：L2 收尾（壳层 + commands + 2.6 + 2.8）+ L4 后半
背景：core 纯逻辑全量就位（vcfg/version/conflicts/migrate/staging/installer/updater/detection），
IPC 适配层（`src/renderer/lib/api.ts`）、tauri.conf.json（NSIS+MSI 已配置）、版本同步脚本已就位。

1. **fs/winreg 壳层**（`src-tauri/src/services/`，全部调用 core 纯逻辑只做 I/O）：
   - detection.rs：winreg 读 Steam 注册表（HKCU\Software\Valve\Steam）+ fs 扫描 → 喂给 core 的
     `parse_login_users` / `cs2_manifest_state` / `parse_library_paths` 等
   - staging.rs：zip 解压（`zip` crate）+ 目录扫描/复制 → core 的 `plan_staging` / `inspect_cfg_files` /
     `next_timestamp_folder` / `folders_to_remove` 等
   - installer.rs：文件复制/移动/删除 + install/res/save 三清单读写 → core 的 `plan_overlay_category` /
     `merge_append` / `remove_item` / `normalize_state` 等
   - updater.rs：GitHub Releases 网络请求 + 缓存文件 → core 的 `map_release` / `filter_newer` /
     `is_dismissed` / `is_cache_fresh` 等
2. **commands 注册**：原 `ipc.ts` 40+ handler → `#[tauri::command]`，签名与 window.api 逐一对齐
   （对照 api-contract.md）；事件推送 `log:new` → tauri `emit`/`listen`
3. **2.5/2.6 测试**：cargo-nextest + fixtures 假目录树（复用 0.6 黄金样本的 fixtures）；检测功能 4 项
   实机验证（注册表成功/失败/未安装三分支、CS2 状态、用户识别、VCFG 状态）
4. **2.8 打包**：跑 `tauri build`（NSIS + MSI，Win10 21H2+），安装包 ≤20MB；`msi/` 与 `build:msi` 暂不删
5. **L4 后半**：release-desktop.yml 从 electron-forge 切 `tauri build`；删 `msi/` 与 electron-forge
   配置/依赖、onlyBuiltDependencies 清理；版本号发版前跑 `pnpm sync:version`；根 README 发布说明更新
   验收：`tauri dev` 全功能可用、cargo test 全绿、黄金样本对照 ≥80%、安装包 ≤20MB

### Track B（WSL/Linux）：L0.6 黄金样本记录（0.6 一直未勾选，L2 验收标准依赖它）
交付：把 0.6 验收清单落地成 fixtures + Node/Rust 双版输出对照，供 Windows 实机最终验收直接引用。

1. **建 fixtures**（建议 `tasks/layer-0-baseline/fixtures/`）：
   - 伪 Steam 目录：libraryfolders.vdf / appmanifest_730.acf（多 StateFlags）/ loginusers.vdf（多账号）/
     userdata/<accountId>/730/local/cfg（含 cs2_user_keys_0_slot0.vcfg 等）
   - 伪上传包：zip（含 .cfg/.txt/.vcfg/annotations/ 子目录/video）与目录形态各一
   - 伪游戏 CFG 目录：overlay/append 冲突场景（同名文件/目录）
2. **双版输出对照**（关键路径 ≥80%）：
   - Rust 版：core crate 84 测试已断言同款输入→输出（staging/installer/updater/detection/vcfg），
     直接作为 Rust 侧结果引用
   - Node 版：`app/desktop/src/main/services/*.ts` 纯函数在 WSL 跑（stub electron 的 app/net/shell），
     对同一 fixtures 输入记录输出
   - 逐条对照；不一致处先确认 TS 行为为准（生产参照），必要时修 core 并补测试
3. **产出 `tasks/layer-0-baseline/golden-samples.md`**：5 条业务路径（Steam 检测 / VCFG / staging /
   overlay+append / 冲突恢复）× 输入→期望输出清单 + 对照结论
4. 顺带可做（非阻塞）：根 README 发布说明现状核对——打包链未切换前只记录，不删 electron 相关描述

## 提交规范

- 一个 commit 只做一件事；message 以 `feat(desktop):` / `refactor(desktop):` / `feat(website):` /
  `chore(ci):` / `docs(tasks):` 开头，正文列出改动与验证结果
- 中途遇到阻塞先记录（更新 PROGRESS.md 遗留注意点）再继续，不要改其他层
- 完成后如 PROGRESS.md 需要更新（勾选任务），顺带提交一个 docs 更新 commit

## 完成后输出

- `git log --oneline -5` 确认提交
- 用 5 行以内总结：做了什么、验证结果（构建/测试/打包）、环境限制说明、遗留 TODO
- 如 PROGRESS.md 需要更新（勾选任务），顺带提交一个 docs 更新 commit
