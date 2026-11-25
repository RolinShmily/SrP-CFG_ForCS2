# 开发指南

## 1. 环境搭建

- **C++17 编译器**（Windows MSVC 2022，或 Linux GCC / Clang）与 **CMake ≥ 3.21**
- **Qt 6.5+**（CI 使用 `6.8.0` + `qtshadertools`，仅编译 `src/gui` 需要）
- **Python 3.12+**（仅使用标准库，用于校验与打包脚本）
- **Node.js ≥ 22** 与 **pnpm 11.3**（仅 `website/` 需要）

```bash
# 仅构建核心库并运行全部 C++ 测试（无需 Qt 与子模块）
cmake --preset core
cmake --build --preset core
ctest --preset core

# 构建 Windows 桌面端（需拉取 HuskarUI 子模块）
git submodule update --init --recursive
cmake --preset windows-msvc
cmake --build --preset release-msvc
scripts\run-gui.bat

# 官网与 /console 本地开发
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter srp-cfg-website dev
```

## 2. 验证门禁

提交改动前按涉及范围运行对应检查：

```bash
# 1. 仓库完整性、CHANGELOG 结构、内容包与 Worker 路由测试
python3 scripts/check_repository.py
python3 scripts/extract_changelog.py --check
python3 tests/content/test_content_packages.py
node --experimental-strip-types --test tests/worker/*.test.mjs

# 2. Core 单元测试（含独立构建验证）
cmake --preset core && cmake --build --preset core && ctest --preset core
cmake -S src/core -B build-core-standalone -DBUILD_TESTING=ON && cmake --build build-core-standalone && ctest --test-dir build-core-standalone --output-on-failure

# 3. Website 与 /console
pnpm --filter srp-cfg-website test
pnpm --filter srp-cfg-website console:test
pnpm --filter srp-cfg-website lint
pnpm --filter srp-cfg-website build
```

修改 `src/gui` 后，本地可用 `scripts\run-gui.bat --store %TEMP%\srp-store --route overview --screenshot %TEMP%\shot.png` 做渲染冒烟，检查 `srp_gui_debug.log` 无 QML 报错；便携包整体验证见 [tests/gui/test-portable.ps1](../tests/gui/test-portable.ps1)。

## 3. 扩展 `content/` 内容包

- 新增预设、特性、模式或地图指南时，将文件放到 `content/srp-cfg/` 或 `content/annotations/` 对应目录，在 `catalog.json` 登记元数据并在 `runtime/commands.cfg` 注册入口（如适用）。
- 所有 `.cfg` 内 `exec` 必须使用相对 `game/csgo/cfg/` 的路径，单条命令占一行，注释统一使用 `//`。
- 禁止在 `src/core` 引入 Qt，禁止绕过 `writeConfigWithBackup` / `removeConfigWithBackup` 直接写用户目录。

## 4. 许可证与第三方声明

- 本项目自有代码、内容包与文档采用 MIT 许可（[LICENSE](../LICENSE)）。
- 第三方组件（Qt 6 LGPL-3.0/GPL-3.0、HuskarUI、QWindowKit、StdCoreLib、QR Code Generator、Lucide、Inno Setup 简体中文翻译、Inter / JetBrains Mono 字体及 Valve 商标说明）统一汇总在根目录 [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES)。
- 新增运行时依赖必须同步更新 `THIRD_PARTY_NOTICES`；前端依赖通过 `pnpm --filter srp-cfg-website licenses:collect` 生成 `website/public/third-party-licenses.txt`。

## 5. CI、版本管理与发布

- **唯一软件版本源**：根 [CMakeLists.txt](../CMakeLists.txt) 中的 `SRP_APP_VERSION`（严格 `major.minor.patch`），变更日志维护在根 [CHANGELOG.md](../CHANGELOG.md)。
- **工作流分工**：
  - `test.yml`：改动 `src/`、`content/`、`worker/`、`tests/`、`scripts/` 时运行仓库/内容/Worker 校验与双平台 Core CTest；
  - `build.yml`：构建 Windows 便携 GUI ZIP（内置最新 `content/`）、Inno Setup 安装器与 `latest.json`，并跑 `tests/gui/test-portable.ps1`；支持手动触发与 `release.yml` 复用；
  - `release.yml`：推送 `vX.Y.Z` tag 时先校验 tag 与 `CHANGELOG.md`，调用 `build.yml`，仅将软件制品（`gui.zip`、`setup.exe`、`latest.json`）发布至 GitHub Releases；
  - `deploy-worker.yml`：推送到 `main` 且改动 `content/`、`worker/` 或 `website/` 时，调用 `scripts/package_content.py --output website/public` 生成内容包并随 Worker 部署至 `cfg.srprolin.com`；
  - `ci-console.yml` / `update-console-data.yml` / `valve-upstream-drift.yml`：分别负责 `/console` 数据校验、上游同步翻译与 Valve 基线漂移巡检。
