# 开发规范 / Development

本目录是 SrP-CFG 的「怎么改代码」手册：编码规范、测试执行、提交与发布流程。它面向要动 `src/core`、`src/cli`、`src/gui`、`config/`、`scripts/`、`website/` 的人，以及评审这些改动的人。文档体系总索引见 [../README.md](../README.md)。

与其它文档的分工：

| 你想知道 | 去哪 |
| --- | --- |
| 系统分成哪几层、依赖方向 | [架构总览](../architecture/OVERVIEW.md) |
| GUI 的 QML / Controller / Core 分工 | [GUI 层](../architecture/GUI.md) |
| 构建目标、预设、打包步骤的全貌 | [构建与发布](../architecture/BUILD_AND_RELEASE.md) |
| 命名、包含顺序、错误返回、QML 与 CMake 规则 | [CODING_STANDARDS.md](CODING_STANDARDS.md) |
| 跑哪些测试、怎么加测试、哪些没覆盖 | [TESTING.md](TESTING.md) |
| 分支、提交、CI、版本号、发布入口 | [WORKFLOW.md](WORKFLOW.md) |
| 写入/备份/回滚的具体机制 | [文件事务](../reference/FILE_TRANSACTIONS.md) |
| 视觉令牌与组件选型 | [设计系统](../design/DESIGN_SYSTEM.md) · [组件规范](../design/COMPONENTS.md) |
| 确认弹窗、快捷键、焦点与无障碍 | [交互规范](../design/UX_GUIDELINES.md) |
| i18n 表结构与键命名 | [i18n](../reference/I18N.md) |
| CLI 命令与退出码 | [CLI 参考](../reference/CLI_REFERENCE.md) |

## 阅读顺序

1. **[CODING_STANDARDS.md](CODING_STANDARDS.md)** —— 先读第 1 节「四条硬性边界」。这四条决定了改动应该落在哪个目录；其余规范是它们的延伸。
2. **[TESTING.md](TESTING.md)** —— 读第 2 节命令块，把 `cmake --preset core && cmake --build --preset core && ctest --preset core` 跑通一次，确认本地环境与 CI 一致。
3. **[WORKFLOW.md](WORKFLOW.md)** —— 提交前读第 5 节「CI 与必需检查」和第 7 节「安全与依赖」。
4. 具体改动再回到对应技术文档：配置包 → [CONFIG_PACKAGES_AND_MEDIA.md](../reference/CONFIG_PACKAGES_AND_MEDIA.md)；装配 → [VALVE_ASSEMBLY.md](../reference/VALVE_ASSEMBLY.md)。

## 一页速查

```bash
# Core + CLI 构建与全部 CTest（含 CLI skill 场景测试）
cmake --preset core && cmake --build --preset core && ctest --preset core

# 仓库完整性（必需文档、包版本、catalog 文件、SRP_APP_VERSION）
python3 scripts/check_repository.py

# 配置包规则（三个包、HTTPS 来源、大小、SHA-256）
python3 scripts/test_website_packages.py

# 网站：单元测试、类型检查、静态构建
pnpm --filter srp-cfg-website test && pnpm --filter srp-cfg-website lint && pnpm --filter srp-cfg-website build
```

```bat
rem GUI 构建（需 Qt 6.8）与截图冒烟；PowerShell 会话里的正确写法见 TESTING.md 第 5 节
cmake --preset windows-msvc && cmake --build --preset release-msvc
run_gui.bat --store %TEMP%\srp-store --route overview --screenshot %TEMP%\shot.png --dark
```

改动归属速判：

| 改动内容 | 落点 | 不能碰 |
| --- | --- | --- |
| 解析、事务、备份、包校验、版本比较 | `src/core/src/*.cpp` + `include/srp/core/*.h` | Qt / QML 头文件 |
| 新命令、参数、退出码 | `src/cli/src/main.cpp` | 在 CLI 里实现业务逻辑 |
| 页面、动效、主题色 | `src/gui/qml/**` | 文件 IO、路径拼接 |
| Controller 的信号/属性 | `src/gui/src/*_controller.*` | Controller 之间互调业务函数 |
| 预设/功能/模式/地图指引内容 | `config/srp-cfg/**`、`config/annotations/**` | 生成的 `website/public/**` |
| 审计、打包、测试脚本 | `scripts/*.py`、`scripts/*.mjs`、`scripts/*.ps1` | 引入第三方 Python 依赖 |

## 文档维护约定

- 本目录文档描述**当前仓库的真实行为**，不是目标状态。写规则前先用命令验证，例如 `ctest --test-dir build-core -N` 才能确认测试名单。
- 规则要可执行、可检查。写「代码要整洁」没有价值；写「`include/srp/core/` 下不得出现 `#include <Q...>`，用 `grep -rn "#include <Q" src/core/include` 自检」才有价值。
- 命令与标识符保留英文原文（`writeConfigWithBackup`、`ctest --preset core`），解释用中文。
- 相对链接必须指向真实存在的文件。新增/重命名文档时同步更新本文索引、[../architecture/OVERVIEW.md](../architecture/OVERVIEW.md) 与根 `README.md` 的目录树。
- 行为改变 -> 对应文档同一 PR 内更新。检查清单见 [WORKFLOW.md](WORKFLOW.md) 第 6 节。

## 与本目录配套的根文件

- [CONTRIBUTING.md](../../CONTRIBUTING.md)：对外贡献闸门（环境、`config/` 规则、提交前检查、Conventional Commits）。本目录不重复它的环境安装步骤，只把「规则」写成可执行条目。
- [README.md](../../README.md) 的目录树与 [SECURITY.md](../../SECURITY.md)：仓库结构与漏洞上报渠道。
- `.github/workflows/*.yml`：CI 的事实来源。[WORKFLOW.md](WORKFLOW.md) 第 5 节的表格抄的是它的触发条件与步骤顺序，改了工作流就要同步回来。

## 术语

| 词 | 含义 |
| --- | --- |
| Core | `src/core` 静态库 `srp_core`，无 Qt |
| 事务 | `writeConfigWithBackup` / `removeConfigWithBackup` 的备份+原子替换流程 |
| 暂存库 | `packageStoreRoot()`，含包原始内容、工作副本与备份 |
| 层 1–4 | Valve 基线 / 功能包 / 模式入口 / `user/custom.cfg`，见 [架构总览](../architecture/OVERVIEW.md) |
| 冒烟 | 用 `--screenshot` 渲染一页并检查日志，不等同于交互测试 |

## 维护责任

改动者负责同步受影响的文档（清单见 [WORKFLOW.md](WORKFLOW.md) 第 6 节）；评审者负责核对「文档描述的行为在本 PR 之后仍然成立」。发现文档与代码不符时，以代码为准并当场修正文档，不要留 TODO 或“待更新”标记——那比缺失文档更误导。

## 常见误区

- **以为 GUI 测试会跑在 CI 上**：CI 的 `desktop` job 用 `-DBUILD_TESTING=OFF` 只编译，不跑任何 QML 测试（仓库里也没有）。GUI 验证靠人工截图冒烟，见 [TESTING.md](TESTING.md) 第 5 节。
- **以为 `docs/` 有自动检查**：`scripts/check_repository.py` 只校验 4 个根文档（`LICENSE`、`README.md`、`README.zh-CN.md`、`THIRD_PARTY_NOTICES.md`）。`docs/**` 的链接与准确性靠评审。
- **在 `src/core` 里用 `QString` 图方便**：`srp_core` 的唯一前置依赖是 C++17 标准库 + 平台 API；引入 Qt 会同时破坏 CLI 包体积、独立构建和 CI 的 `core` job。
- **直接 `ofstream` 写游戏目录**：所有用户可见写入必须经 `writeConfigWithBackup` / `removeConfigWithBackup`，否则备份、回滚与「无变化不写」三条保证全部失效。
