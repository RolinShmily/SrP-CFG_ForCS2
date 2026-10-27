<div align="center">

[English](CONTRIBUTING.md) | [简体中文](CONTRIBUTING.zh-CN.md)

</div>

# 为 SrP-CFG 贡献

感谢你愿意改进 SrP-CFG。本文只讲实务：如何搭建仓库、提交 Pull Request 前要跑什么、
以及本项目已经形成的约定。

参与即表示你同意遵守[行为准则](CODE_OF_CONDUCT.zh-CN.md)。遇到安全问题请按
[安全政策](SECURITY.zh-CN.md) 私下报告，不要提交公开 Issue。

---

## 贡献方式

| 类型 | 位置 |
| :--- | :--- |
| 缺陷反馈 / 功能建议 | [提交 Issue](https://github.com/RolinShmily/SrP-CFG_ForCS2/issues/new) |
| 按键 / ConVar 调校、预设 | `config/srp-cfg/**` |
| 新特性或模式模块 | `config/srp-cfg/features/**`、`config/srp-cfg/modes/**` |
| 画面模板 | `config/video/**` |
| 地图指南（KV3 标注） | `config/annotations/**` |
| 核心逻辑、解析器、事务 | `app/core/**` |
| `srpcfg` 命令行工具 | `app/cli/**` |
| 桌面端界面（Qt 6 / QML） | `app/gui/**` |
| 官网与文档 | `website/**`、`docs/**` |
| 审计与打包脚本 | `scripts/**` |
| 翻译 | 任意带 `.zh-CN.md`（或英文）镜像的 `*.md` |

新增预设、特性、模式或地图指南通常**不需要改 C++ 或 QML** —— 每个包都携带
`catalog.json`，程序据此生成 CLI 列表、GUI 卡片与编辑器文件选项。
参见 [`docs/CONFIG_CATALOG.md`](docs/CONFIG_CATALOG.md)。

## 环境搭建

**环境要求**

- CMake 3.21+ 与 C++17 编译器（Windows 用 MSVC 2022，其他平台 GCC / Clang）。
- Qt 6.8 及 `qtshadertools` —— 仅构建 `app/gui` 需要；自动化构建在 Windows 上使用
  `win64_msvc2022_64`。
- Node.js 22+ 与 pnpm 11.3 —— 仅 `website/` 与发布脚本需要。
- Python 3.12 —— 仅审计 / 打包脚本需要，且只依赖标准库。

```bash
git clone --recurse-submodules https://github.com/RolinShmily/SrP-CFG_ForCS2.git
cd SrP-CFG_ForCS2

# 仅核心与 CLI（无需 Qt 工具链）
cmake --preset core
cmake --build --preset core
ctest --preset core

# 官网：类型检查、单元测试、静态构建
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm lint
pnpm build
```

桌面端通过预设构建。若 Qt 未能在 `C:/Qt/6.*/msvc2022_64` 下自动探测到，
请追加 `-DCMAKE_PREFIX_PATH=<Qt 套件路径>`：

```bash
cmake --preset release-msvc
cmake --build --preset release-msvc
```

`app/gui/3rdparty/HuskarUI` 是 submodule —— 请以 `--recurse-submodules` 克隆，
或先执行 `git submodule update --init --recursive` 再配置 GUI。

发布打包（`installer/`、便携 ZIP）不在常规贡献范围内，详见
[`README.zh-CN.md`](README.zh-CN.md) 与 [`website/README.md`](website/README.md)。

## `config/` 贡献铁律

绝大多数贡献落在这一层，也最需要保证正确性。

- **禁止 `exec` 绝对路径或用户私有路径。** 所有 include 均以
  `game/csgo/cfg/` 为基准相对引用，以保证套件可任意迁移。
- **守住四层边界。** Layer 1 为 Valve 基线 / 预设模板，Layer 2 为独立加载的特性，
  Layer 3 为绑定按键的模式入口，Layer 4 为 `user/custom.cfg` —— 归用户独有，
  Runtime 代码任何时候都不得写入。
- **每个 feature / mode 目录保持结构自洽**：`settings.cfg`（取值）、
  `keymap.cfg`（绑定）、`runtime.cfg`（逻辑）、`with-keymap.cfg`（可选按键入口）；
  预设目录使用 `settings.cfg`、`keymap.cfg`、`apply.cfg`。
- **新增条目必须登记到 `catalog.json`** —— 稳定的 `id`、中英双语
  `description_zh` / `description_en`、标签，以及与目录完全一致的 `files` 列表。
  该清单是 GUI 卡片、CLI 列表与打包的唯一真源。
- **注释一律使用 `//`**，可独立成行，也可置于指令之后 —— 不使用 `/* */`。
  本项目惯例为：定义行**英文在前、中文紧跟 `//` 行内注释**，以兼顾中英读者：
  ```cfg
  // Load the autoview feature runtime.
  exec srp-cfg/features/autoview/runtime.cfg // 加载武器自适应视角的 Runtime 命令。
  ```
- **一条指令必须写在单行内。** CS2 逐行解析，因此禁止缩进指令、禁止跨行拆分指令。
- **PR 中不要包含生成物。** `config/**` 才是唯一真源，它会被
  `scripts/package-website.py` 与发布工作流原样打包。请勿手工编辑
  `website/public/third-party-licenses.txt`
  （由 `node scripts/collect-licenses.mjs` 生成）。

## 代码贡献铁律

- **严守职责边界。** `app/core` 为不依赖 Qt 的 C++17 纯逻辑层；`app/cli` 只是它的
  薄前端；`app/gui` 只负责 Qt / HuskarUI 呈现。界面层不得引入文件系统或解析逻辑，
  核心层不得依赖 QML。
- **所有配置写入必须走备份事务。** 禁止直接写入游戏目录：先落暂存区、展示差异、
  再提交；失败时恢复工作副本。
- **不得扩大联网面。** 配置清单与压缩包只从 `https://cfg.srprolin.com` 获取，
  仅走 HTTPS、不跟随重定向，并校验大小与 SHA-256。参见
  [`docs/CONFIG_PACKAGES_AND_MEDIA.md`](docs/CONFIG_PACKAGES_AND_MEDIA.md) 与
  [`docs/BOUNDARY_CONDITIONS.md`](docs/BOUNDARY_CONDITIONS.md)。
- **改行为就要带测试。** 核心逻辑放在 `app/core/tests/`（CTest），
  官网逻辑放在 `website/tests/*.test.mjs`，包规则放在
  `scripts/test_website_packages.py`。

## 推送前自检

请在本地执行与 CI 完全一致的检查项，每项几乎无依赖且秒级完成：

```bash
# 1. 核心与 CLI 构建 + 隔离夹具测试
cmake --preset core && cmake --build --preset core && ctest --preset core

# 2. 仓库完整性：版本、清单、声明文件、文档齐备性
python3 scripts/check_repository.py

# 3. 配置包清单规则（三个包、HTTPS 来源、大小、哈希）
python3 scripts/test_website_packages.py

# 4. 官网：单元测试、类型检查、生产构建
pnpm test
pnpm lint
pnpm build
```

若改动涉及官网静态产物或包结构，还需执行 CI 中的打包步骤：

```bash
python3 scripts/package-website.py
node scripts/collect-licenses.mjs
```

若改动了 `app/gui`，请用 Qt 6.8 构建桌面端目标（见上）；CI 在 Windows + MSVC 2022
上构建该目标，但不运行 QML 测试。

若改动了 `.github/workflows/` 下的任何文件，请用
[actionlint](https://github.com/rhysd/actionlint) 跑一遍。它是单文件二进制
（无需包管理器），并会对每个 `run:` 块运行 `shellcheck`，能拦下那些平时只会在发版时
才暴露的引号与变量引用问题：

```bash
actionlint -color            # 默认检查 .github/workflows/**
```

## 提交信息规范

仓库历史遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```text
<type>(<scope>): <subject>
```

常用 type：`feat`、`fix`、`refactor`、`docs`、`chore`、`perf`、`release`。
常用 scope：`core`、`cli`、`gui`、`website`、`config`、`ci`、`deps`、`skill`。

```text
feat(config): 为练习模式新增 Nuke 出生点预设
fix(gui): 阻止 VCFG 编辑器覆写用户层配置
docs(website): 补全四层架构模型说明
```

标题使用祈使语气并控制在约 72 字符内，正文重点说明*为什么*而非*做了什么*。

## 分支与 Pull Request

1. Fork 仓库，并从 `main` 切出特性分支
   （如 `feat/nuke-spawn-preset`、`fix/vcfg-overwrite`）。
2. 保持提交聚焦 —— 一个提交只做一件逻辑上完整的事。
3. 说明改动内容、你执行过的验证，并关联要关闭的 Issue。
4. 确认 CI 全绿后请求评审。

小而自洽的 PR 评审与合并最快。若涉及 Runtime 分层、核心 API 或包结构的架构性改动，
请先开 Issue 讨论设计，再动手写代码。

再次感谢你的贡献。
