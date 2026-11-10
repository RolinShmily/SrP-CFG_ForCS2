# 构建、测试与发布

本文只描述仓库中真实存在的构建目标、预设、CI 工作流与打包脚本。架构分层见 [OVERVIEW.md](OVERVIEW.md)，测试策略细节见 [软件测试](../development/TESTING.md)。

## 1. CMake 工程结构

```text
CMakeLists.txt                 根工程：版本、C++17、SRP_BUILD_GUI、CTest、Qt 自动探测
CMakePresets.json              3 个 configure preset + build/test preset
src/CMakeLists.txt             add_subdirectory(core) → cli → gui(可选)
src/core/CMakeLists.txt        静态库 srp_core（可独立配置）
src/cli/CMakeLists.txt         可执行 srp_cli（输出名 srpcfg）
src/gui/CMakeLists.txt         qt_add_executable + qt_add_qml_module(srp_gui)
```

根 `CMakeLists.txt`：`cmake_minimum_required(VERSION 3.21)`；`SRP_APP_VERSION` 为 CACHE 变量且必须匹配 `major.minor.patch`（不匹配直接 `FATAL_ERROR`），同时作为 `project(srp_root VERSION ...)` 版本；`CMAKE_CXX_STANDARD 17` + `CXX_EXTENSIONS OFF`；`option(SRP_BUILD_GUI ... ON)`；`include(CTest)`；MSVC 加 `/utf-8`。Windows 下启用 GUI 时，若既未提供 `CMAKE_PREFIX_PATH` / `Qt6_ROOT` / 也未设置同名环境变量，会按自然序倒序挑选 `C:/Qt/6.*/msvc2022_64` 或 `D:/Qt/6.*/msvc2022_64` 中最新者作为前缀。

`src/CMakeLists.txt` 固定顺序：`core` → `cli` → `gui`（仅 `SRP_BUILD_GUI`）。

## 2. 三个构建目标

| 目标 | 类型 | 输出 | 依赖 |
| --- | --- | --- | --- |
| `srp_core` | `STATIC` 库 | `srp_core.lib` / `libsrp_core.a` | `Threads::Threads`；Windows 额外 `advapi32 shell32 winhttp bcrypt`。**无 Qt** |
| `srp_cli` | 可执行 | `srpcfg.exe`（`set_target_properties(... OUTPUT_NAME srpcfg)`） | `srp_core` |
| `srp_gui` | `qt_add_executable` | `srp_gui.exe`，`WIN32_EXECUTABLE TRUE`（不分配控制台） | `srp_core`、`HuskarUIBasic`、`HuskarUIImpl`、`Qt6::{Core,Gui,Quick,QuickControls2,Concurrent}` |

- `srp_core` 以 `target_compile_definitions(... SRP_APP_VERSION="x.y.z")` 注入版本，`include/` 为 `PUBLIC` 头文件目录。源文件清单是显式的（12 个 `.cpp`），不使用 glob。
- `srp_gui` 通过 `qt_add_qml_module(URI SrPGui ... RESOURCE_PREFIX "/")` 打包 `qml/`、图标、字体与图片资源；`qml/MetaTheme.qml` 与 `qml/components/AppFeedback.qml` 标记为 `QT_QML_SINGLETON_TYPE`。
- `HUSKARUI_IMPORT_PATH` 编译定义指向构建树 `HuskarUI/qml`；运行期优先使用可执行文件旁的 `qml/HuskarUI/Basic`（便携包布局），否则回退到构建树路径。

### Core 独立构建

`src/core/CMakeLists.txt` 自带 `cmake_minimum_required(VERSION 3.20)`、`project(srp_core ...)`、`include(CTest)`、`find_package(Threads REQUIRED)`。未传入 `SRP_APP_VERSION` 时默认 `0.0.0` 并打印说明，因此可以脱离根工程配置：

```bash
cmake -S src/core -B build-core-standalone -DBUILD_TESTING=ON
cmake --build build-core-standalone --config Release --parallel 2
```

这也是“core 不依赖 Qt/GUI/CLI”这条规则的**可执行证明**：该配置不会读取根 `CMakeLists.txt`，也不会进入 `src/gui`。

## 3. Qt 与 HuskarUI 依赖

- Qt：`find_package(Qt6 6.5 COMPONENTS Core Gui Quick QuickControls2 Concurrent REQUIRED)` + `qt_standard_project_setup(REQUIRES 6.5)`；若存在 `QT_KNOWN_POLICY_QTP0004` 则设为 `NEW`。
- HuskarUI：git submodule（`.gitmodules` → `https://github.com/mengps/HuskarUI.git`），位于 `src/gui/3rdparty/HuskarUI`，内部再嵌套 `qwindowkit` 与 `qmsetup`。GUI 在 `NOT TARGET HuskarUIBasic` 时以强制缓存变量方式引入并关闭无关产物：`BUILD_HUSKARUI_GALLERY=OFF`、`BUILD_HUSKARUI_ON_DESKTOP_PLATFORM=ON`、`INSTALL_HUSKARUI_IN_DEFAULT_LOCATION=OFF`。
- 因此克隆仓库必须带子模块（CI 使用 `submodules: recursive`），否则 GUI 配置失败；Core/CLI 无需子模块。

## 4. CMakePresets

| preset | 生成器 | 二进制目录 | 用途 |
| --- | --- | --- | --- |
| `windows-msvc` | Visual Studio 17 2022 / x64 | `build-gui` | GUI 全部配置，`debug`/`release` 由 build preset 选择 |
| `windows-ninja` | Ninja Multi-Config | `build-ninja` | 需要 `Developer PowerShell` 的快速构建 |
| `core` | 默认 | `build-core` | `SRP_BUILD_GUI=OFF`、`BUILD_TESTING=ON`，仅 Core + CLI |

build preset：`release-msvc`、`release-ninja`、`core`；test preset 同名并开启 `outputOnFailure`。

```bash
cmake --preset windows-msvc
cmake --build --preset release-msvc
ctest --preset release-msvc

cmake --preset core
cmake --build --preset core
ctest --preset core
```

## 5. 测试

`BUILD_TESTING=ON` 时：

- `srp_core` 生成 5 个测试可执行文件并注册为 `config_operations`、`media_packages`、`catalog_extension`、`app_update`、`text_document`；`media_packages` 传入仓库 `config` 目录，全部测试的 `WORKING_DIRECTORY` 为源码根、`TIMEOUT 120`。
- `srp_cli` 在找到 `Python3::Interpreter` 时注册 `srpcfg_cli_skill`，运行 `skills/srpcfg-cli/evals/run_cli_checks.py --exe <srp_cli> --bundle config`，对 CLI 子命令做端到端校验。
- GUI 侧不注册 CTest 用例；GUI 行为由脚本化截图/便携包验证覆盖（见第 7 节）。

## 6. CI 工作流

| 工作流 | 触发 | 职责 |
| --- | --- | --- |
| `ci.yml` | push/PR 到 `main`、手动 | 四个 job：`core`（windows + ubuntu 矩阵，`SRP_BUILD_GUI=OFF` 配置 → 构建 → `ctest`）、`desktop`（windows，Qt 6.8.0 + `qtshadertools` 子模块递归，构建 `srp_gui`，`BUILD_TESTING=OFF`，不跑测试）、`website`（Node 22 + pnpm 11.3.0，`pnpm install --frozen-lockfile --ignore-scripts` → 仓库检查/包校验/站点打包 → `pnpm --filter srp-cfg-website test`、`lint` → 收集许可 → `build`）、`console-data`（Python 单测 + 数据契约 + 索引生成） |
| `deploy-worker.yml` | 推送到 `main` 且改动 `config/**`、`skills/**`、`website/**`、`wrangler.toml`、相关脚本或工作流；手动 | 重新生成配置包与 `packages.json`，校验站点，收集第三方许可，构建 React Router 静态站，用 `wrangler@4.147.0` 部署到 Cloudflare Worker（`wrangler.toml` 的 `[assets] directory = "./website/build/client"`） |
| `update-console-data.yml` | 每天 02:00 UTC、手动 | 同步 GameTracking-CS2 上游事实，Workers AI 增量翻译，校验数据并生成 Console 索引；数据有变化时提交 `website/data/console` |
| `release.yml` | tag `v[0-9]+.[0-9]+.[0-9]+`、手动 | 见第 7 节 |
| `valve-upstream-drift.yml` | 每周日 02:00 UTC、手动 | 运行 `scripts/check_valve_baseline_drift.py`，检测 Valve 基线 convar 漂移，必要时创建/更新 issue |

注意 CI 的 `desktop` job 只验证“能编译”，回归测试在 `core` job 与 `release.yml` 中执行。

## 7. 发布产物与脚本

`release.yml` 在 `windows-latest` 上安装 MSVC、Ninja 1.11.1、Inno Setup 6 与 Qt 6.8.0（`win64_msvc2022_64` + `qtshadertools`），用 Ninja 配置并把 tag 版本写入 `-DSRP_APP_VERSION=`，构建后先跑 `ctest`，再产出三类产物：

1. `srp-cfg-<tag>-windows-x64-cli.zip`：`srpcfg.exe` + `config/` + `skills/srpcfg-cli` + MSVC 运行库 + 许可与 README。
2. `srp-cfg-<tag>-windows-x64-gui.zip`：`SrP-CFG.exe`（由 `srp_gui.exe` 改名）+ `srpcfg.exe` + `config/` + `skills/srpcfg-cli` + HuskarUI 的 DLL 与 `qml/HuskarUI/{Basic,Impl}`；`windeployqt --no-opengl-sw --qmldir src/gui/qml --qmlimport build/HuskarUI/qml` 补齐 Qt 运行时，随后删除冗余的 `vc_redist.x64.exe` 与 `opengl32sw.dll`（本地 VC 运行库与 D3D11 后端已覆盖），再由 `scripts/test-portable.ps1` 在剥离 Qt/构建树路径的环境变量下验证 PE 子系统（GUI=2、CLI=3）、必需文件与可运行性。
3. `srp-cfg-<tag>-windows-x64-setup.exe`：`installer/installer.iss`（Inno Setup）。脚本接受 `/DMyAppVersion`、`/DSourceDir`、`/DOutputDir`，`PrivilegesRequired=lowest` 并允许对话框提权，提供中英双语向导、桌面图标任务、安装后启动，以及默认勾选的“将 CLI 加入当前用户 PATH”任务（写 `HKCU\Environment\Path`，卸载时只移除 `{app}` 这一条）；安装内容即第 2 项 GUI 目录的整树复制。

最后生成 `dist/latest.json`（`version`、`tag`、`published_at`、`gui_zip_url`、`gui_zip_sha256`、`setup_exe_url`、`setup_exe_sha256`、`notes_zh`、`notes_en`），与三个产物一起由 `softprops/action-gh-release` 发布（仅 tag 触发时）。

## 8. 辅助脚本

| 脚本 | 作用 |
| --- | --- |
| `scripts/run-gui.ps1` | 从 `CMakeCache.txt` 反查 Qt 根，拼好 `PATH`（Qt bin、`HuskarUI/bin`）后启动 `srp_gui.exe`，可透传参数 |
| `scripts/test-portable.ps1` | 便携包验收：PE 子系统、必需文件、清空 `QML2_IMPORT_PATH`/`QT_PLUGIN_PATH`/`LOCALAPPDATA` 后运行 |
| `scripts/check_repository.py` | 仓库完整性/发布就绪检查：版本一致性、`catalog.json`、声明文件、许可声明 |
| `scripts/package-website.py` | 生成确定性配置 ZIP（`srp-cfg`、`video`、`annotations`、`srpcfg-cli`）与 `packages.json`，输出目录默认 `website/public` |
| `scripts/test_website_packages.py` | 校验生成的包与清单（哈希、版本、路径） |
| `website/scripts/collect-licenses.mjs` | 汇总前端依赖许可到站点 `third-party-licenses.txt` |
| `scripts/check_valve_baseline_drift.py` | 抓取上游 Valve 基线并与仓库基线比对 |

## 9. website 与主程序的关系

`website/` 是独立的 pnpm workspace 包（`srp-cfg-website`，React 19 + React Router 8.5.1 Framework Mode + Vite 8 + Tailwind），使用 `ssr: false` + 构建期预渲染，输出纯静态资源并由 Cloudflare Worker 托管在 `cfg.srprolin.com`。路由、Console、SEO 与数据流水线详见 [WEBSITE.md](WEBSITE.md)。它与 C++ 程序**没有编译期依赖**，只有两条运行期契约：

- `https://cfg.srprolin.com/packages.json` → `srp::core::packageManifestUrl()`，供 GUI/CLI 检查并下载配置包 ZIP。
- `https://github.com/<repo>/releases/latest/download/latest.json` → `srp::core::appReleaseManifestUrl()`，供“关于”页检查新版本。

因此站点发布（`deploy-worker.yml`）与客户端发布（`release.yml`）是两条独立管线：配置包更新不要求重发客户端，客户端更新不阻塞站点。

## 10. 第三方依赖隔离

- C++ 侧：HuskarUI 及其嵌套的 qwindowkit/qmsetup 仅通过 submodule 存在于 `src/gui/3rdparty/` 下，只用 CMake `add_subdirectory` 引入，不打进 `srp_core`，也不影响 CLI。
- 许可：`licenses/` 保存逐项许可文本（HuskarUI-MIT、QWindowKit-Apache-2.0、Qt-LGPL-3.0、Inter/JetBrainsMono-OFL、QRCodeGenerator-MIT 等），`THIRD_PARTY_NOTICES.md` 为汇总，发布包内同时复制两者。
- 前端侧：依赖与脚本只出现在 `website/package.json`（pnpm workspace 仅含 `website`）；根 `package.json` 只保留 workspace 元数据，不承载 npm 脚本。CI 使用 `--frozen-lockfile --ignore-scripts`，不在安装阶段执行第三方生命周期脚本。

## 11. 常用命令速查

```bash
# Core + CLI（无 Qt，含测试）
cmake -S . -B build-core -DSRP_BUILD_GUI=OFF -DBUILD_TESTING=ON
cmake --build build-core --config Release --parallel 2
ctest --test-dir build-core -C Release --output-on-failure

# GUI（需 Qt 6.5+ 与子模块）
cmake -S . -B build-gui -A x64 -DCMAKE_PREFIX_PATH="<Qt6>/msvc2022_64" -DBUILD_TESTING=OFF
cmake --build build-gui --config Release --parallel 2
pwsh scripts/run-gui.ps1
```

## 12. 暂缓 / 未实现

- 无 Linux/macOS 桌面构建产物：`release.yml` 仅 Windows；`srp_core` 与 `srp_cli` 在 CI 的 ubuntu 上可构建并通过测试（`packages.cpp` 中网络下载在非 Windows 平台返回 `pkg.unsupported`）。
- 无自动更新安装器（客户端只检查版本并展示发布链接，下载/替换由用户完成）。
- 无 GUI 自动化测试框架接入（仅脚本化便携包验证与截图参数 `--screenshot`）。
