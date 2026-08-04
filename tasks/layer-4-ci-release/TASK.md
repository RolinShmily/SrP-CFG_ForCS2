# Layer 4 — CI/CD 与发布（D4：软件测试完成后才启动）

> 目标：重构后的持续集成与打包发布链路。**本层严格依赖 L2/L3 测试验收通过后再执行**（D4）。
> 清理 Electron 时代的打包链（Squirrel / WiX / msi 目录），切换为 Tauri（NSIS/MSI）。

## 任务

### 4.1 Website CI 更新
- [ ] `.github/workflows/deploy-website.yml`：`astro build` → `vite build`（或 `pnpm build:web` 内部已切换，仅确认）。
- [ ] 确认 `test:ai-stream` 与 worker 测试保持绿色。
- [ ] 验证 Turnstile 密钥注入流程不变（PUBLIC_TURNSTILE_SITE_KEY 构建注入）。

### 4.2 Desktop CI（Tauri 构建）
- [ ] Release 工作流加 Rust toolchain（`dtolnay/rust-toolchain` stable + Windows target）。
- [ ] **cargo 缓存**：`~/.cargo` 与 `app/desktop/src-tauri/target` 缓存（首次 5-10 分钟 → 后续 ~1 分钟）。
- [ ] `tauri build` 产出 NSIS exe + MSI；上传 GitHub Release assets。
- [ ] 版本号来源统一：`src-tauri/tauri.conf.json` version（当前 3.1.6，需同步机制：可由 package.json 注入）。

### 4.3 打包链清理
- [ ] 删除 `msi/` 目录（WiX 工程 + harvest.js）与根 `package.json` 的 `build:msi` 脚本。
- [ ] 移除 `electron-forge` 相关配置与依赖（forge.config.ts、vite.main/preload/renderer.config.ts、@electron-forge/*）。
- [ ] `pnpm.onlyBuiltDependencies` 清理 electron 相关。
- [ ] 更新根 README 的构建/发布说明。

### 4.4 端到端验收
- [ ] 全新环境（无 node_modules、无 cargo cache）跑通完整发布流程。
- [ ] 安装包体积确认 ≤ 20MB。
- [ ] 旧版 → 新版升级路径验证：数据迁移（L2.3）在真实安装场景跑通。

## 验收标准

- [ ] GitHub Actions 全绿（website deploy + desktop release）
- [ ] 发布产物：NSIS exe + MSI + zip，体积达标
- [ ] 旧打包链文件全部清除，仓库无 electron-forge / WiX 残留

## 参考文件

- `.github/workflows/deploy-website.yml`（现状）
- `.github/workflows/` 其余 release 工作流
- `msi/`（待清理）
- 根 `package.json` scripts
