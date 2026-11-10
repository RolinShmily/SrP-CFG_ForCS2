# 协作流程

面向提交者与评审者：分支怎么开、提交怎么写、CI 跑什么、版本号在哪、发布从哪进。构建与打包的细节见 [构建与发布](../architecture/BUILD_AND_RELEASE.md)，验证手段见 [TESTING.md](TESTING.md)。

## 1. 分支与提交

- 从 `main` 切出，命名 `<类型>/<短横线描述>`：`feat/nuke-spawn-preset`、`fix/vcfg-overwrite`、`docs/development-standards`。
- 一个逻辑一个提交；一个 PR 一个主题。格式化整文件、重排 import 这类无行为变更的改动单独成 PR，否则评审无法看清逻辑。
- 先讨论再动手的场景：运行时分层、`srp_core` 公共 API（`include/srp/core/*.h`）、配置包布局与 catalog schema、`.github/workflows/**`、`SRP_APP_VERSION` 规则。开 issue 拿到结论再写代码。
- PR 描述必须包含：改了什么、**为什么**、跑过哪些验证命令（贴命令，不必贴全量日志）、关联 issue。

## 2. Conventional Commits

```text
<type>(<scope>): <subject>
```

- `type`：`feat`、`fix`、`refactor`、`docs`、`chore`、`perf`、`release`。
- `scope`：`core`、`cli`、`gui`、`website`、`config`、`ci`、`deps`、`skill`、`docs`。
- subject 用祈使句、不加句号、≤ 72 字符。正文写动机与影响面，不复述 diff。
- 破坏性变更在 type 后加 `!` 并在正文写 `BREAKING CHANGE:` 段落（公共 API、catalog schema、CLI 参数/退出码都算）。

```text
feat(config): add nuke spawn preset for practice mode
fix(gui): keep the VCFG editor from overwriting the user layer
refactor(core): return i18n keys instead of formatted messages
```

## 3. 禁止的 Git 操作

以下操作一律禁止，评审与 CI 之外的人工核查都可能因此失效：

- `git push --force` / `--force-with-lease` 到共享分支；需要修正历史时开新分支并说明。
- `git reset --hard`、`git checkout .`、`git clean -fd`、`git stash`：会静默丢弃工作区里他人的改动。多个 agent/终端可能同时在同一个 clone 里工作。
- `git add .` / `git add -A`：只显式 `git add <file>`，避免把 `build*`、`.memory/`、`.pi/`、生成的 `website/public/packages*` 带进提交。
- `git commit --no-verify`：跳过钩子等于绕过检查。
- 直接改 `main` 或打 tag 而不经过版本号同步（见第 4 节）。
- 提交 `srp_gui_debug.log`、`*.log`、`node_modules/`、`build-*/`、`dist/`——它们已在 `.gitignore` 中，若出现在 `git status` 里说明是被强制添加的。

## 4. 版本号 `SRP_APP_VERSION`

唯一事实来源是根 `CMakeLists.txt`：

```cmake
set(SRP_APP_VERSION "3.4.9" CACHE STRING "Application version")
if(NOT SRP_APP_VERSION MATCHES "^(0|[1-9][0-9]*)[.](0|[1-9][0-9]*)[.](0|[1-9][0-9]*)$")
    message(FATAL_ERROR "SRP_APP_VERSION must be a stable major.minor.patch version")
endif()
```

规则：

- 只允许 `major.minor.patch` 三个非负整数，禁止 `-dev`/`-rc`/四位版本/前导零（`3.04.0` 会被拒）。
- 该值编译进 `srp_core`（`SRP_APP_VERSION="x.y.z"`），`srpcfg version` 原样输出，`scripts/test-portable.ps1` 用它断言包版本，`scripts/check_repository.py` 校验格式。
- 功能 PR 不动版本号。发布 PR 才把根 `CMakeLists.txt` 与三个配置包的 `config/{srp-cfg,video,annotations}/VERSION.txt` 一起调整，并核对这些包内容确实变了。
- 发布时 tag 必须与版本号一致：`release.yml` 从 tag 提取 `vX.Y.Z` 并通过 `-DSRP_APP_VERSION=X.Y.Z` 覆盖缓存；tag 与源码版本不一致会造成 `latest.json`、安装器文件名、`srpcfg version` 三处互相矛盾。
- 不要在任何 `.cpp/.h/.qml` 里另写版本字符串；读 `srp::core::applicationVersion()`。

## 5. CI 与必需检查

| 工作流 | 触发 | 内容 |
| --- | --- | --- |
| `ci.yml` | push / PR 到 `main`，仅当改动 `src/**`、`config/**`、`skills/**`、`CMakeLists.txt`、`CMakePresets.json`、`.gitmodules` 或本工作流；`workflow_dispatch` | 软件构建：`core`（Windows + Ubuntu：`SRP_BUILD_GUI=OFF`、`BUILD_TESTING=ON`、`cmake --build`、`ctest`，**含 `srpcfg_cli_skill`**）；`desktop`（Windows + Qt 6.8 `win64_msvc2022_64` + `qtshadertools`，`BUILD_TESTING=OFF` 只编译） |
| `deploy-worker.yml` | PR 与 push 到 `main`，且命中 `config/**`、`skills/**`、`website/**`、`wrangler.toml`、`scripts/{check_repository,package-website,test_website_packages}.py`、`website/scripts/collect-licenses.mjs`、`LICENSE`、`package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、本工作流文件；手动 | `check_repository.py` → `test_website_packages.py` → `package-website.py` → `pnpm --filter srp-cfg-website test/lint` → `licenses:collect` → `build`；PR 到此为止，push/手动再 `wrangler deploy`（`wrangler@4.147.0` 固定版本） |
| `ci-console.yml` | push / PR 到 `main`，命中 `website/data/console/**`、`website/scripts/console/**`、Console 组件/路由/类型/文案或相关 workflow；手动 | Console 数据单测、严格契约校验、索引生成 |
| `update-console-data.yml` | 每天 02:00 UTC、手动 | 同步 GameTracking-CS2 → Workers AI 增量翻译 → 数据校验 → 生成 Console 索引 → 有变化才提交 `website/data/console`。需要 `CLOUDFLARE_AI_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` |
| `release.yml` | tag `v[0-9]+.[0-9]+.[0-9]+`，`workflow_dispatch` | 校验 tag → 带子模块 checkout → Ninja 构建 → `ctest` → 打 CLI / GUI / Inno Setup 安装包 → `test-portable.ps1` → 生成含两个 SHA-256 的 `latest.json` → 发布 Release（**仅 tag 触发才真正发布**；`workflow_dispatch` 只跑构建与打包） |
| `valve-upstream-drift.yml` | 每周日 02:00 UTC、手动 | `scripts/check_valve_baseline_drift.py`，发现偏差时创建或更新 issue |

按改动范围必须通过：`ci.yml` 的 `core`（两个 OS）与 `desktop`（软件路径）、`deploy-worker.yml` 的 `Website build & deploy`（网站路径）、`ci-console.yml` 的 `console-data`（Console 路径）。`desktop` 失败通常意味着 Qt/子模块或 QML 模块登记问题，同样必须修好再合并。

Console 增量翻译的 GitHub Secrets：`CLOUDFLARE_AI_TOKEN`（Account → Workers AI → Read/Edit）与 `CLOUDFLARE_ACCOUNT_ID`；`GITHUB_TOKEN` 自动注入。部署继续使用 `CLOUDFLARE_API_TOKEN`（Workers Scripts Edit）+ `CLOUDFLARE_ACCOUNT_ID`，建议与 AI token 分开。

本地对齐 CI 的最小集（提交前）：

```bash
cmake --preset core && cmake --build --preset core && ctest --preset core
python3 scripts/check_repository.py
python3 scripts/test_website_packages.py
pnpm --filter srp-cfg-website test
pnpm --filter srp-cfg-website console:test
pnpm --filter srp-cfg-website lint
pnpm --filter srp-cfg-website build   # prebuild 会生成 Console 索引与 sitemap
actionlint -color        # 改动过 .github/workflows/** 时
```

- 动过 `src/gui` 还必须本地编译一次 GUI（CI 只证明「能编译」，不证明「界面对」）：`cmake --preset windows-msvc && cmake --build --preset release-msvc`，再按 [TESTING.md](TESTING.md) 第 5 节截图核对。
- 动过 `.github/workflows/**` 必须跑 `actionlint`（同时会对每个 `run:` 块跑 `shellcheck`）。缩进、未加引号的变量、`${{ }}` 注入在发布时才会爆炸。
- `deploy-worker.yml` 的 PR 触发只构建、不部署；push 到 `main`（或手动触发）且在路径过滤内才会部署。合并到 `main` 即等于发布生产站点，合入前确认 `pnpm --filter srp-cfg-website build` 与许可证清单都是最新的。

## 6. 文档同步要求

| 改动 | 必须同步的文档 |
| --- | --- |
| 分层、依赖方向、新增导出 API | [OVERVIEW.md](../architecture/OVERVIEW.md) |
| 控制器/QML 结构、路由、主题机制 | [GUI.md](../architecture/GUI.md) |
| 颜色令牌、字体、圆角 | [DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md) |
| 组件选型、`objectName`、`Accessible` | [COMPONENTS.md](../design/COMPONENTS.md) |
| 确认弹窗、快捷键、动效降级 | [UX_GUIDELINES.md](../design/UX_GUIDELINES.md) |
| CMake 目标、预设、打包步骤 | [BUILD_AND_RELEASE.md](../architecture/BUILD_AND_RELEASE.md) |
| CLI 命令、参数、退出码 | [CLI_REFERENCE.md](../reference/CLI_REFERENCE.md)、`skills/srpcfg-cli/references/commands.md` 与 `SKILL.md` |
| i18n 键改名/新增域 | [I18N.md](../reference/I18N.md) |
| 写入/备份/回滚行为 | [FILE_TRANSACTIONS.md](../reference/FILE_TRANSACTIONS.md) |
| `catalog.json` 字段、包布局 | [CONFIG_CATALOG.md](../reference/CONFIG_CATALOG.md)、[CONFIG_PACKAGES_AND_MEDIA.md](../reference/CONFIG_PACKAGES_AND_MEDIA.md) |
| 新增/变更测试 | [TESTING.md](TESTING.md)（尤其第 2 节的 test 名单与 8/9 节） |
| 评审规则、CI、版本与发布节拍 | 本文件与 [CODING_STANDARDS.md](CODING_STANDARDS.md) |
| 边界/失败路径 | [BOUNDARY_CONDITIONS.md](../reference/BOUNDARY_CONDITIONS.md) |

- 根目录仅 `README.md` / `README.zh-CN.md` 保持双语；`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、`SECURITY.md` 默认英文单语。README 只改一边视为未完成。
- `docs/**` 以中文为主，新增相对链接必须指向真实存在的文件；重命名文档时用 `git ls-files docs` 找出所有引用并一并更新。
- 不写「未来会支持」型文档：只描述当前仓库可验证的行为，未实现的计划放 issue。

## 7. 安全与依赖审计

- Node 依赖：只允许 `pnpm install --frozen-lockfile --ignore-scripts`；`pnpm-lock.yaml` 必须与 `package.json` 同步提交，不手工编辑锁文件。新增包需要说明用途、体积、许可证，并同步 `THIRD_PARTY_NOTICES.md` + `licenses/`（`pnpm --filter srp-cfg-website licenses:collect` 生成物随 PR 更新）。
- Python 脚本仅用标准库；不要为了脚本方便引入 `pip` 依赖或全局安装工具。
- 凭据：仓库不存放任何密钥。GitHub Secrets 只有 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`（`deploy-worker.yml` 部署用）与 `CLOUDFLARE_AI_TOKEN`（`update-console-data.yml` 翻译用），由 GitHub 注入；`GITHUB_TOKEN` 用于发布与 issue。本地 `.env*` 已被 `.gitignore` 忽略，不得提交；也不要把 token 写进 `wrangler.toml`、脚本默认值或日志。
- 网络面不得扩大：配置包与归档只从 `https://cfg.srprolin.com` 获取，HTTPS、禁止重定向、校验大小与 SHA-256（见 [BOUNDARY_CONDITIONS.md](../reference/BOUNDARY_CONDITIONS.md)）。新增任何外部主机（CDN、统计、字体 API）都需要单独评审。
- 处理子进程/路径时按不可信输入对待：参数以数组传递（`run_cli_checks.py` 的做法），不拼 shell 字符串；路径校验见 [CODING_STANDARDS.md](CODING_STANDARDS.md) 2.5。
- 安全漏洞走 [SECURITY.md](../../SECURITY.md) 的私密渠道，不要开公开 issue，也不要在 PR 里贴可利用细节。

## 8. 发布与打包入口

发布不是“合并后自动”，而是显式的 tag 流程：

1. 发布 PR：同步 `SRP_APP_VERSION` 与三个 `VERSION.txt`，更新 `docs/**` 中受影响的版本描述，跑完第 5 节最小集。
2. 打 tag 并推送：`git tag v3.4.9 && git push origin v3.4.9`（仅维护者；tag 形如 `vX.Y.Z`）。
3. `release.yml` 自动完成：Ninja Release 构建 → `ctest` → `dist/srp-cfg-vX.Y.Z-windows-x64-cli.zip`、`-gui.zip`、`-setup.exe` → `scripts/test-portable.ps1` 校验便携包 → `dist/latest.json`（含 `gui_zip_sha256`、`setup_exe_sha256`）→ GitHub Release。
4. 网站与配置包另行由 `deploy-worker.yml` 部署；客户端更新提示读 `latest.json`（机制见 [APP_DIALOGS_AND_UPDATES.md](../reference/APP_DIALOGS_AND_UPDATES.md)）。
5. 打包脚本、Inno Setup 安装器（`installer/installer.iss`）与本地试装细节见 [构建与发布](../architecture/BUILD_AND_RELEASE.md)。发布/签名操作仅限维护者，普通贡献者不需要也不应该推送 tag。

失败排查顺序：先看 tag 格式与 `SRP_APP_VERSION` 是否一致，再看子模块是否递归拉取（`src/gui/3rdparty/HuskarUI`），最后看 `windeployqt`/HuskarUI `qml/Basic|Impl` 是否被复制（`test-portable.ps1` 会直接指出缺哪个 `qmldir`）。
