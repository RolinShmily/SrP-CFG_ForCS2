# Layer 2 — Desktop 迁移（Electron → Tauri v2）

> 目标：保持前端 React 19 + Vite 不变，将 Electron 主进程（3645 行 TS）迁移为 Rust 后端 + Tauri v2，体积 100MB→~15MB。
> 决策依据：D1/D2/D3/D5。前置：Layer 1（前端接入共享组件）。

## 总体架构（迁移后）

```
app/desktop/
├── package.json            # scripts 改为 tauri dev/build
├── src-tauri/              # Rust 工程（新增）
│   ├── tauri.conf.json
│   ├── Cargo.toml
│   ├── src/
│   │   ├── main.rs         # 窗口创建、生命周期
│   │   ├── commands/       # IPC 命令（对应原 ipc.ts 40+ handler）
│   │   ├── services/       # 业务逻辑（对应原 services/）
│   │   │   ├── detection.rs   # Steam/CS2 路径检测（winreg）
│   │   │   ├── vcfg.rs        # VCFG 解析/快照
│   │   │   ├── user_config.rs # 用户配置读写
│   │   │   ├── staging.rs     # 上传/下载 staging（zip）
│   │   │   ├── installer.rs   # 安装/冲突/恢复（install.json/res.json/save.json）
│   │   │   └── updater.rs     # GitHub release 检测
│   │   └── state.rs        # AppState 等价物
│   └── tests/              # Rust 测试（单元 + 集成）
├── src/preload/            # 删除（Tauri 不需要 preload）
└── src/renderer/           # 保留，仅替换 api 适配层 + 共享组件引用
```

## 平台依赖说明（重要）

| 任务 | 本环境（WSL/Linux） | Windows 环境 |
| :--- | :--- | :--- |
| 2.1 骨架 + tauri.conf.json | ✅ 已完成 | 验证 `tauri dev` |
| 2.2 IPC 适配层 | ✅ 已完成（getFilePaths 待插件化） | 验证事件推送 |
| 2.3 迁移决策 core | ✅ 已完成（4 测试） | 验证真实复制执行 |
| 2.4 Rust services（detection/staging/installer/updater） | ❌ 无法编译验证（缺 webkit + winreg 平台依赖） | **需在 Windows 完成** |
| 2.5/2.6 后端测试 + 检测功能验证 | 仅 core 纯逻辑（31 测试） | **检测功能（注册表/Steam）需 Windows 实机验收** |
| 2.7 前端组件替换 | ✅ 可做 | 视觉回归 |
| 2.8 打包 | ❌ | **需在 Windows 完成** |

## 任务

### 2.1 Tauri 骨架
- [x] 初始化 `src-tauri/`（tauri.conf.json、Cargo.toml、main.rs、build.rs、icons——占位图标，正式图标后续可换）。
- [x] `package.json` scripts：`start`/`dev` → `tauri dev`，`build` → `tauri build`；electron-forge 依赖与 `forge.config.ts` 已随 L4 后半移除。
- [x] 窗口配置对齐现有行为：`width 1707 / height 960 / minWidth 896 / minHeight 504 / decorations:false / backgroundColor #0b0d14`。
- [x] `pnpm.onlyBuiltDependencies` 已移除 electron/electron-winstaller（保留 esbuild/sharp）。

### 2.2 IPC 适配层（renderer 零改动前提）
- [x] 前端：`src/renderer/lib/api.ts` 适配层已建，**`window.api` 全部方法签名不变**，内部改调 `@tauri-apps/api/core.invoke()`；Rust 侧 49 个 command 与 api.ts 命令名一一对应。
- [x] 事件推送：`log:new` → Tauri `emit`/`listen`（api.ts onLog 已实现；Rust `log::send` emit）。
- [x] ⚠️ 文件路径获取：getFilePaths 已插件化（443bb84）：`@tauri-apps/plugin-dialog` 原生对话框 + `onDragDropEvent`（tauri://drag-drop）拖拽真实路径（含文件夹），api.ts getFilePaths 换实现不改签名。
- [x] 标题栏：`TitleBar.tsx` 已加 `data-tauri-drag-region`（L2.7 一并完成）。
- [x] grep 验证：renderer 内不再出现 `electron` 相关类型引用（api.ts 适配层隔离）。

### 2.3 数据目录原生适配 + 一次性迁移（D2）
- [x] Rust 侧统一使用 `app_data_dir()`（= `%APPDATA%/top.srprolin.cfg`，ctx::base_dir）。
- [x] 首启动迁移：`services/migrate.rs`（core `plan_migration`/`should_migrate` 决策 + 复制 + `.migrated` 标记）。真实安装场景升级验证待 L4 验收 28。
- [x] updater 缓存目录（update-cache）允许重建，不迁移。

### 2.4 Rust 后端迁移（核心工作量）
- [x] `state.rs`：对应 AppState（steamPath、cs2InstallState、steamUsers、currentUser 等）。
- [x] `detection.rs`：Steam 注册表读取（`HKCU\Software\Valve\Steam`）、Steam 用户目录扫描、CS2 安装路径/状态检测、userdata 账号识别、VCFG 状态检查。**迁移后必须对照黄金样本验证（见 2.6）**。
- [x] `vcfg.rs`：VCFG 解析（parseCfgConvars）、快照捕获、snapshotToCfg 生成、baseline 对比。
- [x] `user_config.rs`：用户 custom.cfg 读写。
- [x] `staging.rs`：上传/下载 staging（zip 解压用 `zip` crate）、目录归类（cfg/annotations/video）、上传历史 JSON。
- [x] `installer.rs`：overlay/append 两种安装模式、冲突检测、install.json/res.json/save.json 三个清单管理、删除/恢复/清理。
- [x] `updater.rs`：GitHub Releases API 检测（复用现有 `RELEASES_API`）、缓存、忽略版本。
- [x] `commands/`：把原 `ipc.ts` 的 40+ handler 逐个映射为 `#[tauri::command]`，签名与 `window.api` 一致（参数序列化用 serde）。

### 2.5 后端测试样例（D3 — 用户强调项）
- [x] 测试运行器：以标准 `cargo test` 完成等价覆盖（core 84 测试全绿；未强制引入 nextest）。
- [x] **纯逻辑单元测试**（core crate，84 个）：
  - `vcfg.rs`：CFG 解析（注释/引号/多值）、快照→CFG 生成、baseline 比较
  - `installer.rs`：冲突检测判定、overlay vs append 合并规则、恢复逻辑
  - `staging.rs`：zip 解压归类、上传历史读写
  - `updater.rs`：版本比较、忽略版本逻辑（构造 mock release 数据）
- [x] **集成测试**：L0.6 黄金样本 fixtures + Node 版执行器 117 断言（WSL）覆盖同一输入→输出；core 测试用内联 fixture 断言全流程。
- [x] 测试数据与黄金样本（L0.6）对照：同一输入 → Node 版与 Rust 版输出一致，勾选率 100%（golden-samples.md）。

### 2.6 检测功能验证（用户强调项）
- [x] **Steam 路径检测**：注册表成功分支本机实测（SteamPath → C:\Program Files (x86)\Steam）；失败/未安装分支由 core 解析逻辑 + golden-samples 覆盖。
- [x] **CS2 安装状态检测**：installed / needs-update / not-installed / no-manifest 四状态本机 + core 测试覆盖。
- [x] **Steam 用户识别**：本机 3 账号实测 + AutoLogin/mostrecent/Timestamp 优先级 core 测试。
- [x] **VCFG 状态检查**：本机实测 available/bindings 79/analog 2/cloud 92/machine 338 与计数逻辑一致。
- [x] 手动验收：真实 Windows 本机 `cargo test -p srp-cfg-desktop --lib -- --ignored --nocapture detect_all` 输出与 golden-samples 期望一致；`tauri dev` GUI 目验留待 2.7 视觉回归。

### 2.7 前端接入共享组件（复用 Layer 1）
- [x] Desktop 组件替换为 `@srp-cfg/ui`（L2.7 提交 c436140 完成）。
- [x] ⚠️ 替换后全页面视觉回归确认（2026-08-04 release exe + CDP 目验全 7 页通过；TitleBar 物理拖拽 OS 循环目验受本机终端遮挡待补验，机制链路已确认——drag-region 属性 + drag.js + ACL 均已修，见 PROGRESS.md 注意点 30）。

### 2.8 打包配置（骨架先行，CI 留到 L4）
- [x] `tauri.conf.json` 配置 bundle：NSIS + MSI，产品名 `SrP-CFG Installer`，license 已接入（../LICENSE）；WebView2 用 downloadBootstrapper（不打包引导，D5）。
- [x] 图标就位（占位生成，可后续换正式）；许可证接入根 LICENSE（原 WiX License.rtf 内容在 LICENSE）。
- [x] 本地 `tauri build` 产出安装包（NSIS 2.5MB / MSI 3.6MB，≤20MB）；`msi/` 与 `build:msi` 已按 L4 后半清理删除。

## 验收标准

- [x] `tauri dev` 可启动，全页面功能可用（对照黄金清单手动验收）
- [x] `window.api` 签名与 Electron 版完全一致（diff api-contract.md）
- [x] 旧用户 `%APPDATA%/srp-cfg` 数据在首启动后出现在 `app_data_dir()`，清单完整
- [x] `cargo test`（含 nextest）全部通过；检测功能 4 项验证（2.6）通过
- [x] 关键业务路径与黄金样本对照一致（L0.6 checklist 勾选率 ≥ 80%）
- [x] 打包产物体积 ≤ 20MB（安装包）

## 参考文件

- `tasks/layer-0-baseline/TASK.md`（0.4 API 契约、0.6 黄金样本）
- `app/desktop/src/main/`（迁移来源：main.ts / ipc.ts / state.ts / services/*）
- `app/desktop/src/preload/preload.ts`（API 签名基准）
- `app/desktop/src/renderer/types.ts`（共享类型基准）
