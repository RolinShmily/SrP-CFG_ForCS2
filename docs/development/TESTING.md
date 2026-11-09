# 测试与验证

本文只列出仓库中真实可执行的验证手段，以及每一项覆盖到哪里、不覆盖什么。测试与 CI 的对应关系见 [WORKFLOW.md](WORKFLOW.md) 第 5 节；构建目标背景见 [构建与发布](../architecture/BUILD_AND_RELEASE.md)。

## 1. 验证手段总览

| 层 | 手段 | 入口 | CI 是否执行 |
| --- | --- | --- | --- |
| Core / CLI 单元与集成 | CTest（6 个 test） | `ctest --preset core` | 是（`core` job，Windows + Ubuntu） |
| Core 独立构建 | 单独配置 `src/core` | `cmake -S src/core -B ...` | 否（靠 `core` job 的根构建间接保证） |
| CLI skill 契约 | Python 场景脚本 | `srpcfg_cli_skill` test | 是（同一 `core` job，需 Python 3） |
| 仓库完整性 | Python 脚本 | `python3 scripts/check_repository.py` | 是（`website` job） |
| 配置包规则 | Python 脚本 | `python3 scripts/test_website_packages.py` | 是（`website` job） |
| 网站逻辑 | `node --test` + `tsc` | `pnpm test` / `pnpm lint` | 是 |
| 静态站点产物 | vite 构建 + 预渲染 | `pnpm build` | 是 |
| GUI 编译 | CMake + Qt 6.8 | `cmake --build --preset release-msvc` | 是（`desktop` job，`BUILD_TESTING=OFF`） |
| GUI 运行时 | 截图冒烟 + 日志关键字 | `scripts/run-gui.ps1` | 否（仅发布前 `scripts/test-portable.ps1` 自动跑一次） |
| 便携包完整性 | PowerShell 断言 | `scripts/test-portable.ps1` | 仅在 `release.yml` |

## 2. Core / CLI 测试（6 个 CTest）

用 `ctest --test-dir build-core -N` 可确认当前名单。全部为自包含 C++ 可执行文件，注册在 `src/core/CMakeLists.txt`（前 5 个）与 `src/cli/CMakeLists.txt`（第 6 个）。

| # | CTest 名称 | 源文件 | 覆盖范围 |
| --- | --- | --- | --- |
| 1 | `config_operations` | `src/core/tests/config_operations_test.cpp` | 装配/卸载语义（`assembleValve`/`disassembleValve` 的选择性 flags、模式计划与按键冲突、预设加载与卸载）、用户层 `user/custom.cfg` 逐字节保留、BOM/CRLF 处理、备份的 `.bak` + 历史计数、「内容相同则 `changed=false` 且不新增备份」、`../../outside` 之类非法模块名被拒 |
| 2 | `media_packages` | `src/core/tests/media_packages_test.cpp` | 离线初始化暂存库、`cs2_video.txt` 解析与结构化改写、ZIP fixture 接受/拒绝、`../other` 路径穿越被拦截、保存后可再次读取的改动标记。接收 `config` 目录作为 `argv[1]` |
| 3 | `catalog_extension` | `src/core/tests/catalog_test.cpp` | 用 `config/` 现网内容生成扩展 fixture：新增 preset/feature/mode/map 能被发现并装配、缺失 `keymap.cfg`/`with-keymap.cfg` 被明确拒绝、旧安装提示重新部署、`catalog.json` 顺序驱动展示顺序 |
| 4 | `app_update` | `src/core/tests/app_update_test.cpp` | 版本比较（数字序、`v` 前缀、非法版本 `3.04.0`/`3.4.0-dev`/`9999999999.0.0`）、发布清单 JSON 解析（含 GitHub Actions 写出的 BOM UTF-8）、tag 与 version 不一致时拒绝、固定导航 URL |
| 5 | `text_document` | `src/core/tests/text_document_test.cpp` | `decodeDocument`/`encodeDocument` 的 BOM 与 CRLF 记录、孤立 `\r` 处理、往返字节稳定 |
| 6 | `srpcfg_cli_skill` | `skills/srpcfg-cli/evals/run_cli_checks.py` | 以真实 `srpcfg` 可执行文件跑 `evals.json` 中的命令场景，断言退出码与输出；每个场景在独立临时目录内，参数以数组传递（不拼 shell 字符串）。仅在找到 Python 3 解释器时注册 |

命令：

```bash
# 推荐：预设一次跑完全部
cmake --preset core && cmake --build --preset core && ctest --preset core

# 等价的手写形式（与 ci.yml 的 core job 一致）
cmake -S . -B build-core -DSRP_BUILD_GUI=OFF -DBUILD_TESTING=ON -DCMAKE_BUILD_TYPE=Release
cmake --build build-core --config Release --parallel 2
ctest --test-dir build-core -C Release --output-on-failure

# 单跑一个，带完整输出
ctest --test-dir build-core -C Release -R catalog_extension -V

# 只看名单
ctest --test-dir build-core -N
```

`srpcfg_cli_skill` 也可以脱离 CTest 单独跑，便于定位失败场景：

```bash
python3 skills/srpcfg-cli/evals/run_cli_checks.py \
  --exe build-core/src/cli/Release/srpcfg.exe --bundle config
```

（Ninja/MSVC 单配置构建的路径是 `build-core/src/cli/srpcfg.exe`；按实际产物调整。）

## 3. Core 独立构建验证

`src/core/CMakeLists.txt` 自带 `project(srp_core ...)` 与 `include(CTest)`，未传 `SRP_APP_VERSION` 时默认 `0.0.0`。这条路径用来证明「core 真的不依赖 Qt / 根工程」：

```bash
cmake -S src/core -B build-core-standalone -DBUILD_TESTING=ON
cmake --build build-core-standalone --config Release --parallel 2
ctest --test-dir build-core-standalone -C Release --output-on-failure
```

预期：5 个 test（无 `srpcfg_cli_skill`，因为独立配置不含 `src/cli`）。`media_packages` 通过 `PROJECT_SOURCE_DIR/../../config` 找到仓库 `config/`。

以下改动必须在提交前跑一遍这条验证：新增 `srp_core` 源文件、新增对 Qt 之外的第三方依赖、修改 `src/core/CMakeLists.txt` 的 include 目录或链接库。

## 4. CLI skill 测试

- 夹具：`skills/srpcfg-cli/evals/evals.json` 定义场景与断言；`run_cli_checks.py` 用 `tempfile.TemporaryDirectory` 建隔离目录，`cwd` 指向 bundle 的父目录，每条命令 30 秒超时。
- 它**不是** LLM 评测：不调用模型、不打分，只验证 CLI 的实际行为与退出码契约。别把它当作文档正确性的证明。
- 加场景：在 `evals.json` 增加 `prompt`/`expectations`，在 `run_cli_checks.py` 里加对应的 `run(...)` 调用与断言；涉及写入的场景必须使用临时目录，绝不能碰真实 Steam 目录。
- 改了 CLI 参数、退出码（尤其 `mode-bind` 的冲突退出码 2）必须同步 `skills/srpcfg-cli/references/commands.md` 与 [CLI 参考](../reference/CLI_REFERENCE.md)。

## 5. GUI 截图冒烟

没有 QML 自动化测试。替代手段是用 `srp_gui.exe` 的命令行开关把某个页面渲染成 PNG，再检查日志。先构建：

```bash
cmake --preset windows-msvc
cmake --build --preset release-msvc
```

两种调用方式，任选一种（都能把开关原样交给 `srp_gui.exe`）：

```bat
rem A. 从 cmd / 双击：run_gui.bat 用 %* 透传，参数不会被误绑定
run_gui.bat --store %TEMP%\srp-smoke-store --route overview --screenshot %TEMP%\overview.png --dark --width 1440 --height 900
```

```powershell
# B. 在 PowerShell 会话里必须用 -AppArgs 数组；直接写 `scripts/run-gui.ps1 --store ...`
#    会把 --store 误绑成 -BuildDir（已验证），开关全部丢失。
$repo = (Get-Location).Path
& "$repo/scripts/run-gui.ps1" -AppArgs '--store', (Join-Path $env:TEMP 'srp-smoke-store'),
    '--route', 'overview', '--screenshot', (Join-Path $env:TEMP 'overview.png'), '--dark',
    '--width', '1440', '--height', '900'

# 需要真实退出码时用 Start-Process -Wait（run-gui.ps1 自己的退出码不可信，见下）
$env:PATH = "$repo/build-gui/HuskarUI/bin/Release;$repo/build-gui/HuskarUI/bin;<Qt>/bin;" + $env:PATH
$p = Start-Process "$repo/build-gui/src/gui/Release/srp_gui.exe" -PassThru -ArgumentList @(
    '--store', 'C:/Temp/srp-smoke-store', '--route', 'settings',
    '--screenshot', 'C:/Temp/settings-min.png', '--light', '--en', '--width', '980', '--height', '640')
if (!$p.WaitForExit(30000)) { $p.Kill(); throw 'GUI smoke timeout' }
$p.ExitCode   # 期望 0
```

注意：`-File` 方式（`run_gui.bat`）与 `-AppArgs` 数组都会保留参数的原始形式；而 `Start-Process -ArgumentList` 是把数组用空格拼成命令行，路径带空格时必须自己加引号（如 `'"C:/My Tools/overview.png"'`），否则开关会被拆碎。临时目录路径建议统一用正斜杠。

脚本会自己把 Qt `bin`、`build/HuskarUI/bin`、可执行文件目录加进 `PATH`，并把工作目录切到仓库根，所以 `srp_gui_debug.log` 落在仓库根。

**已知脚本缺陷**：`scripts/run-gui.ps1` 末尾用 `$LASTEXITCODE` 判定成败，但 `srp_gui.exe` 是 `WIN32_EXECUTABLE`，PowerShell 不等待 GUI 进程，`$LASTEXITCODE` 为空，于是它会在 GUI 正常跑完之前抛出 `GUI exited with code `。因此不要把该脚本的退出码当判据：等进程真正退出（`Start-Process -Wait`，或轮询 PNG 出现且大小稳定），再按下面的日志/文件判据断言。

`--route` 的合法值即 `Main.qml` 里 `sidebar.activeRoute` 的取值：`overview`、`presets`、`assembly_baseline`、`assembly_features`、`assembly_modes`、`assembly_usercfg`、`video_settings`、`map_guides`、`about`、`settings`。传其它字符串会落到空白内容区——截图仍然“成功”，但没有任何页面，所以必须自己看图。

其它开关（`src/gui/src/main.cpp` 的解析结果）：`--store <dir>`、`--preset <id>`、`--file settings|keymap|custom`（仅 `assembly_*` 路由生效，`settings`/`keymap` 映射到 `valve/` 下同名文件）、`--screenshot <png>`、`--width`、`--height`、`--zoom 9..28`、`--dark`、`--light`、`--en`/`--english`、`--maximized`。

判定标准（四项全过才算通过）：

1. 进程自行退出（`--screenshot` 模式在窗口就绪后 1200 ms 抓图并 `app.quit()`）；用 `Start-Process -Wait` 时退出码应为 0。
2. PNG 存在且体量合理（`scripts/test-portable.ps1` 用 `> 1000` 字节作为「不是空白窗」下限；正常的 1440×900 深色总览约 300 KB）。
3. 仓库根 `srp_gui_debug.log` 中不得出现以下关键字（与 `test-portable.ps1` 一致）：

   ```powershell
   Select-String -Path srp_gui_debug.log -Pattern 'Failed to load|is not installed|TypeError|ReferenceError|Unable to assign'
   ```

4. 必须能看到 `[INFO] QML root object loaded successfully!` 与 `[SCREENSHOT] Grabbed and saved: ... success: true`。

清场：跑之前删旧日志（`Remove-Item srp_gui_debug.log`），否则上一次的失败行会被误判成这次的问题。日志由 `customLog` 以追加模式写入，不自动截断。

便携包整体验证（发布前必跑，需要已打包的目录）：

```powershell
scripts/test-portable.ps1 -PackageDir dist/srp-cfg-v3.4.7-windows-x64-gui -Version 3.4.7
```

它会断言 PE 子系统（GUI=2 无控制台、CLI=3 控制台）、必需文件、隔离 `PATH`/`LOCALAPPDATA` 下的 `srpcfg version` 输出、以及在临时目录里复制的副本仍能截图成功。

## 6. 仓库与网站测试

```bash
python3 scripts/check_repository.py          # 根文档、三个包 VERSION.txt、catalog 文件存在性、SRP_APP_VERSION、遗留目录
python3 scripts/test_website_packages.py     # 三个包的 manifest：HTTPS 来源、大小、SHA-256、ZIP 内 SKILL.md 一致性
python3 scripts/package-website.py           # 生成确定性 ZIP 与下载清单（写 website/public/packages*，属生成物，勿手改）

pnpm install --frozen-lockfile --ignore-scripts
pnpm test                                    # node --experimental-strip-types --test website/tests/*.test.mjs
pnpm lint                                    # tsc --noEmit
pnpm build                                   # vite build + SSR build + prerender
node scripts/collect-licenses.mjs            # 第三方许可证清单
```

网站断言集中在 `website/tests/downloads.test.mjs`：发布清单只接受本仓库的 release 资源、版本与 tag 必须一致、拒绝 CLI 资源与 pre-release、拒绝非 HTTPS / 非预期主机。

## 7. Fixture 与临时目录约定

- C++ 测试一律在 `fs::temp_directory_path()/("srp-<area>-test-"+高精度时钟计数)` 下建树，并用 RAII 清理结构体在 `main` 结束时 `fs::remove_all`（见 `catalog_test.cpp`、`media_packages_test.cpp`）。禁止写入仓库目录或真实游戏目录。
- `setPackageStoreRoot(<临时>/store)` 隔离暂存库；`setBundledConfigDir(...)` 指向仓库 `config/` 或由 catalog 生成的 fixture。
- CTest 统一 `WORKING_DIRECTORY "${CMAKE_SOURCE_DIR}"`、`TIMEOUT 120`（`srpcfg_cli_skill` 同样 120 秒）；新增 test 必须补这两项属性。
- Python/Node 侧用 `tempfile.TemporaryDirectory` / `mkdtemp`，同样只读 `config/`、只写临时目录。

## 8. 如何新增测试

1. 在 `src/core/tests/` 建 `<area>_test.cpp`，复用既有骨架：`void require(bool, const char* label)` + `try { ... } catch (const std::exception& e) { std::cerr << "FAIL: " << e.what(); return 1; }`。
2. 断言标签写成能被 README/PR 直接引用的英文短句（`"traversal blocked"`），`PASS:`/`FAIL:` 前缀保持不变，便于 grep 日志。
3. 在 `src/core/CMakeLists.txt` 的 `foreach(name IN ITEMS ...)` 与 `add_test(...)` 中登记，并加入 `set_tests_properties(...)` 名单。
4. 从 `src/core` 独立构建也能通过（第 3 节）——测试不得依赖 CLI/GUI 产物。
5. 网站逻辑改动加到 `website/tests/*.test.mjs`；配置包规则改动加到 `scripts/test_website_packages.py`。

## 9. 已知测试空白

- **没有 GUI 交互自动化**：仓库没有 Qt Quick Test 或任何 QML 断言；`ci.yml` 的 `desktop` job 用 `-DBUILD_TESTING=OFF` 只做编译。点击、快捷键、弹窗流程靠人工 + 截图冒烟。
- **没有覆盖率统计、没有 fuzzing**：`vcfg.cpp`、`catalog.cpp`、`app_update.cpp` 的手写 JSON/KV3/VDF 解析器只在固定用例上验证；新增解析分支时请补畸形输入用例。
- **网络路径不被测试覆盖**：`packages.cpp` 的 HTTPS 下载、大小与 SHA-256 校验依赖真实 `https://cfg.srprolin.com`，CI 只验证离线路径与清单规则。
- **`srpcfg_cli_skill` 可能被静默跳过**：`src/cli/CMakeLists.txt` 用 `find_package(Python3 ... QUIET)`，本机没有 Python 3 时该 test 不会注册。看 `ctest -N` 确认 6 个都在，别默认它跑过了。
- **安装器不参与测试**：`installer/installer.iss` 只在 `release.yml` 里编译，没有安装/卸载回归。
