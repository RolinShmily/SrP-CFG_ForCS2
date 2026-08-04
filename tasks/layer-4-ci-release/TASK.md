# Layer 4 — CI/CD 与发布（D4：软件测试完成后才启动）

> 目标：重构后的持续集成与打包发布链路。**本层严格依赖 L2/L3 测试验收通过后再执行**（D4）。
> 清理 Electron 时代的打包链（Squirrel / WiX / msi 目录），切换为 Tauri（NSIS/MSI）。

## 任务

### 4.1 Website CI 更新
- [x] `.github/workflows/deploy-website.yml`：已切换 vite 构建 + GITHUB_TOKEN 注入（提交 bed306a）。
- [x] 确认 `test:ai-stream` 与 worker 测试保持绿色（L3 零改动）。
- [x] 验证 Turnstile 密钥注入流程不变（PUBLIC_TURNSTILE_SITE_KEY 构建注入）。

### 4.2 Desktop CI（Tauri 构建）
- [x] Release 工作流加 Rust toolchain（`dtolnay/rust-toolchain` stable + Windows target，bed306a）。
- [x] **cargo 缓存**：`swatinem/rust-cache` workspaces src-tauri -> target（bed306a）。
- [x] `tauri build` 产出 NSIS exe + MSI；release-desktop.yml 已切 tauri build，上传 SrP-CFG_Installer.msi + SrP-CFG_Setup_x64.exe。
- [x] 版本号来源统一：`pnpm sync:version`（package.json 唯一来源 → tauri.conf.json + Cargo.toml），CI 注入 version 后执行；`--check` 供校验。

### 4.3 打包链清理
- [x] 删除 `msi/` 目录（WiX 工程 + harvest.js）与根 `package.json` 的 `build:msi` 脚本。
- [x] 移除 `electron-forge` 相关配置与依赖（forge.config.ts、vite.main/preload.config.ts、vite.renderer.config.ts、@electron-forge/*、electron、electron-winstaller、archiver、winreg）。注：`src/main/services/*.ts` 与 `src/preload/preload.ts` 保留为 L0.6 黄金样本参考实现（不参与构建）。
- [x] `pnpm.onlyBuiltDependencies` 清理：仅保留 esbuild/sharp。
- [x] 更新根 README 的构建/发布说明（Tauri v2 / NSIS+MSI 产物 / Rust+MSVC 开发环境）。

### 4.4 端到端验收
- [x] 全新环境跑通完整发布流程：Windows 本地盘工作区从零 `pnpm install` + `tauri build`（NSIS + MSI）成功，耗时 ≈ 全量 release 编译一次。
- [x] 安装包体积确认 ≤ 20MB：NSIS 2.5MB / MSI 3.6MB。
- [x] ⚠️ 旧版 → 新版升级路径验证：数据迁移（L2.3）在真实安装场景跑通（✅ 2026-08-05 完成：真实安装 + 首启动迁移 283 文件字节级一致 + .migrated；期间揪出并修复隐藏 bug f7f2fa6）

## 验收标准

- [x] ⚠️ GitHub Actions 全绿（website deploy + desktop release）（✅ 2026-08-05：v3.1.10 tag 触发 3 工作流全绿，Release 发布 MSI/NSIS/Runtime_Core.zip + DESKTOP_UPDATE_MARKER，updater 端到端验证通过）
- [x] 发布产物：NSIS exe + MSI，体积达标（2.5MB / 3.6MB；zip 便携包由 NSIS 承担）
- [x] 旧打包链文件全部清除，仓库无 electron-forge / WiX 残留（src/main/services + preload 为黄金样本参考保留）

## 参考文件

- `.github/workflows/deploy-website.yml`（现状）
- `.github/workflows/` 其余 release 工作流
- `msi/`（待清理）
- 根 `package.json` scripts
