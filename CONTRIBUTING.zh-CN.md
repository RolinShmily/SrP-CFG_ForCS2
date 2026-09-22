<div align="center">

[English](CONTRIBUTING.md) | [简体中文](CONTRIBUTING.zh-CN.md)

</div>

# 为 SrP-CFG 贡献

感谢你愿意改进 SrP-CFG。本文只讲实务：如何搭建仓库、提交 Pull Request 前要跑什么、
以及本项目已经形成的约定。

参与即表示你同意遵守[行为准则](CODE_OF_CONDUCT.zh-CN.md)。

---

## 贡献方式

| 类型 | 位置 |
| :--- | :--- |
| 缺陷反馈 | [提交 Issue](https://github.com/RolinShmily/SrP-CFG_ForCS2/issues/new?template=bug_report.yml) |
| 功能建议 | [提交 Issue](https://github.com/RolinShmily/SrP-CFG_ForCS2/issues/new?template=feature_request.yml) |
| 按键 / ConVar 调校 | `config/srp-cfg/**` |
| 新模式或特性模块 | `config/srp-cfg/modes/**`、`config/srp-cfg/features/**` |
| 文档与使用指南 | `app/website/content/docs/**` |
| 官网 / 桌面端界面 | `app/website/**`、`app/desktop/**` |
| 翻译 | 任意带 `.zh-CN.md`（或英文）镜像的 `*.md` |

## 环境搭建

**环境要求** —— Node.js 22+、pnpm 10+、Rust stable（MSVC 工具链，仅桌面端构建需要）、
Python 3.12 及 `PyYAML`（仅配置校验需要）。

```bash
git clone https://github.com/RolinShmily/SrP-CFG_ForCS2.git
cd SrP-CFG_ForCS2
pnpm install

pnpm dev:web        # 官网与文档开发预览
pnpm dev:desktop    # 桌面端调试（Tauri）
```

发布打包与桌面端完整构建不在常规贡献范围内，详见 [`README.zh-CN.md`](README.zh-CN.md)。

## `config/` 贡献铁律

绝大多数贡献落在这一层，也最需要保证正确性。

- **禁止 `exec` 绝对路径或用户私有路径。** 所有 include 均以
  `game/csgo/cfg/` 为基准相对引用，以保证套件可任意迁移。
- **不得改动 `config/srp-cfg/user/custom.cfg` 的归属模型。** Layer C 归用户独有，
  Runtime 代码任何时候都不得写入。
- **守住四层边界。** Alias 与注册属于 `runtime/`；会话态行为属于 `modes/`；
  持久化个人状态属于用户层。
- **每个 feature / mode 目录保持结构自洽**：
  `settings.cfg`（取值）、`keymap.cfg`（绑定）、`runtime.cfg`（逻辑）、
  `help.cfg`（控制台帮助）、`with-keymap.cfg`（可选按键入口）。
- **注释一律使用 `//`**，可独立成行，也可置于指令之后 —— 不使用 `/* */`。
  本项目惯例为：定义行**英文在前、中文紧跟 `//` 行内注释**，以兼顾中英读者：
  ```cfg
  // Persistent autoview command vocabulary.
  alias "view_0" "v06" // 将 alias view_0 转发到 v06。
  ```
- **一条指令必须写在单行内。** CS2 逐行解析，因此禁止缩进指令、禁止跨行拆分指令。
- **PR 中不要包含生成物。** `config/**` 才是唯一真源；
  `.github/data/config-knowledge/*.json` 由合并后的
  [Sync SrP-CFG Knowledge Index](.github/workflows/sync-config-index.yml) workflow 重新生成。
  同理，请勿手工编辑 `app/website/public/data/commands.json`、
  `app/website/public/fonts/**`、`app/website/src/styles/fonts/**`。

## 推送前自检

请在本地执行与 CI 完全一致的检查项，每项几乎无依赖且秒级完成：

```bash
# 1. CFG 架构、分层与打包规则校验
python3 .github/scripts/validate_cfg.py

# 2. 知识索引：单元测试 + 无漂移的 dry-run 重建
node --test .github/scripts/sync_config_vectorize.test.mjs
node .github/scripts/sync_config_vectorize.mjs --dry-run

# 3. 官网 AI 流式接口 / Worker 单元测试
node --experimental-strip-types --test app/website/src/lib/ai-stream.test.ts app/website/src/worker.test.ts

# 4. 两端 TypeScript 类型检查（需先 pnpm install）
pnpm check:types

# 5. 纯逻辑 Rust Core —— 任意平台均可运行
cargo test -p srp-cfg-core --manifest-path app/desktop/src-tauri/Cargo.toml
```

若改动了 `app/desktop`，还需编译并测试 Tauri 壳层。壳层依赖 `tauri`，
在 Linux 上需要 `webkit2gtk-4.1` 才能编译，因此**请在 Windows 上执行**：

```bash
cargo check --workspace --manifest-path app/desktop/src-tauri/Cargo.toml
cargo test -p srp-cfg-desktop --manifest-path app/desktop/src-tauri/Cargo.toml
```

另有两项需要联网，因此只在 CI 中执行，不列在本清单里：`pnpm check:licenses`
（依赖清单，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)）与 CFG 打包构建。

## 提交信息规范

仓库历史遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```text
<type>(<scope>): <subject>
```

常用 type：`feat`、`fix`、`refactor`、`docs`、`chore`、`perf`、`release`。
常用 scope：`config`、`website`、`desktop`、`ci`、`deps`。

```text
feat(config): 为练习模式新增 Nuke 出生点预设
fix(desktop): 阻止 VCFG 编辑器覆写用户层配置
docs(website): 补全四层架构模型说明
```

标题使用祈使语气并控制在约 72 字符内，正文重点说明*为什么*而非*做了什么*。

## 分支与 Pull Request

1. Fork 仓库，并从 `main` 切出特性分支
   （如 `feat/nuke-spawn-preset`、`fix/vcfg-overwrite`）。
2. 保持提交聚焦 —— 一个提交只做一件逻辑上完整的事。
3. 完整填写 PR 模板，并关联要关闭的 Issue。
4. 确认 CI 全绿后请求评审。

小而自洽的 PR 评审与合并最快。若涉及 Runtime 分层或解耦打包结构的架构性改动，
请先开 Issue 讨论设计，再动手写代码。

再次感谢你的贡献。
