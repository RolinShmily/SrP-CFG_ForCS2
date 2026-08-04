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

## 任务

### 2.1 Tauri 骨架
- [ ] 初始化 `src-tauri/`（tauri.conf.json、Cargo.toml、main.rs、build.rs、icons）。
- [ ] `package.json` scripts：`start` → `tauri dev`，`build` → `tauri build`；移除 electron-forge 依赖与 `forge.config.ts`。
- [ ] 窗口配置对齐现有行为：`width 1707 / height 960 / minWidth 896 / minHeight 504 / decorations:false / backgroundColor #0b0d14`。
- [ ] `pnpm.onlyBuiltDependencies` 移除 electron/electron-winstaller（D5 环境下也不打包 WebView2 引导）。

### 2.2 IPC 适配层（renderer 零改动前提）
- [ ] 前端：新建 `src/renderer/lib/api.ts` 或等价层，**保持 `window.api` 全部方法签名不变**（对照 L0.4 的 api-contract.md），内部改调 `@tauri-apps/api/core.invoke()`。
- [ ] 事件推送：`log:new` → Tauri `emit`/`listen`，改造 `hooks/useLogs.ts`。
- [ ] 文件路径获取：`getFilePaths`（原 webUtils）→ 拖拽/对话框插件，改造 `UploadZone.tsx`。
- [ ] 标题栏：`TitleBar.tsx` 加 `data-tauri-drag-region`。
- [ ] grep 验证：renderer 内不再出现 `electron` 相关类型引用。

### 2.3 数据目录原生适配 + 一次性迁移（D2）
- [ ] Rust 侧统一使用 `app_data_dir()`（= `%APPDATA%/{identifier}`）。
- [ ] 首启动迁移：检测旧目录 `%APPDATA%/srp-cfg`（Electron 时代数据：install.json / save.json / res.json / vcfg 快照 / uploads / downloads）→ 复制到 `app_data_dir()` 对应位置，成功后标记完成（写 `.migrated` 标记）。
- [ ] updater 缓存目录（原 userData/update-cache）允许重建，不迁移。

### 2.4 Rust 后端迁移（核心工作量）
- [ ] `state.rs`：对应 AppState（steamPath、cs2InstallState、steamUsers、currentUser 等）。
- [ ] `detection.rs`：Steam 注册表读取（`HKCU\Software\Valve\Steam`）、Steam 用户目录扫描、CS2 安装路径/状态检测、userdata 账号识别、VCFG 状态检查。**迁移后必须对照黄金样本验证（见 2.6）**。
- [ ] `vcfg.rs`：VCFG 解析（parseCfgConvars）、快照捕获、snapshotToCfg 生成、baseline 对比。
- [ ] `user_config.rs`：用户 custom.cfg 读写。
- [ ] `staging.rs`：上传/下载 staging（zip 解压用 `zip` crate）、目录归类（cfg/annotations/video）、上传历史 JSON。
- [ ] `installer.rs`：overlay/append 两种安装模式、冲突检测、install.json/res.json/save.json 三个清单管理、删除/恢复/清理。
- [ ] `updater.rs`：GitHub Releases API 检测（复用现有 `RELEASES_API`）、缓存、忽略版本。
- [ ] `commands/`：把原 `ipc.ts` 的 40+ handler 逐个映射为 `#[tauri::command]`，签名与 `window.api` 一致（参数序列化用 serde）。

### 2.5 后端测试样例（D3 — 用户强调项）
- [ ] 引入 `cargo-nextest` + 断言依赖。
- [ ] **纯逻辑单元测试**：
  - `vcfg.rs`：CFG 解析（注释/引号/多值）、快照→CFG 生成、baseline 比较
  - `installer.rs`：冲突检测判定、overlay vs append 合并规则、恢复逻辑
  - `staging.rs`：zip 解压归类、上传历史读写
  - `updater.rs`：版本比较、忽略版本逻辑（构造 mock release 数据）
- [ ] **集成测试**：用 `tests/fixtures/` 构造假目录树（伪 Steam 目录、伪 CFG 文件），跑 detection/staging/installer 全流程，断言落盘文件清单与 JSON 内容。
- [ ] 测试数据与黄金样本（L0.6）对照：同一输入 → Node 版与 Rust 版输出一致（关键路径至少 80% 覆盖）。

### 2.6 检测功能验证（用户强调项）
- [ ] **Steam 路径检测**：单测覆盖注册表读取成功/失败/Steam 未安装三分支（mock 注册表）。
- [ ] **CS2 安装状态检测**：覆盖 未安装 / 已安装 / 已安装但 CFG 缺失 等状态。
- [ ] **Steam 用户识别**：userdata 下多账号、当前用户（loginusers.vdf）、auto-login 用户识别。
- [ ] **VCFG 状态检查**：available/bindings/convar 计数正确。
- [ ] 手动验收：在真实 Windows 环境跑 `tauri dev`，`installer:detectAll` 返回与 Electron 版一致的结果。

### 2.7 前端接入共享组件（复用 Layer 1）
- [ ] Desktop 组件替换为 `@srp-cfg/ui`（PageHeader、Card、Modal、CopyButton 等）。
- [ ] 替换后全页面视觉回归确认。

### 2.8 打包配置（骨架先行，CI 留到 L4）
- [ ] `tauri.conf.json` 配置 bundle：NSIS + MSI，产品名 `SrP-CFG Installer`，`minimumSystemVersion` = Win10 21H2+。
- [ ] 图标、许可证（License.rtf 内容迁移）就位。
- [ ] 本地 `pnpm build:desktop` 可产出安装包；`msi/` 目录与 `build:msi` 脚本**暂不删除**（L4 再清理）。

## 验收标准

- [ ] `tauri dev` 可启动，全页面功能可用（对照黄金清单手动验收）
- [ ] `window.api` 签名与 Electron 版完全一致（diff api-contract.md）
- [ ] 旧用户 `%APPDATA%/srp-cfg` 数据在首启动后出现在 `app_data_dir()`，清单完整
- [ ] `cargo test`（含 nextest）全部通过；检测功能 4 项验证（2.6）通过
- [ ] 关键业务路径与黄金样本对照一致（L0.6 checklist 勾选率 ≥ 80%）
- [ ] 打包产物体积 ≤ 20MB（安装包）

## 参考文件

- `tasks/layer-0-baseline/TASK.md`（0.4 API 契约、0.6 黄金样本）
- `app/desktop/src/main/`（迁移来源：main.ts / ipc.ts / state.ts / services/*）
- `app/desktop/src/preload/preload.ts`（API 签名基准）
- `app/desktop/src/renderer/types.ts`（共享类型基准）
