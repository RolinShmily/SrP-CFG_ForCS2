# Console 数据流水线

`/console` 的数据底座。所有新代码和数据都收敛在 `website/`，根目录不新增 npm 依赖或数据脚本；只有 GitHub Actions 工作流按平台要求放在 `.github/workflows/`。

## 数据来源

- 仓库：`SteamTracking/GameTracking-CS2`（GitHub 会把旧的 `SteamDatabase` 路径重定向到这里）。
- 文件：`DumpSource2/convars.txt`、`DumpSource2/commands.txt`。
- 每次同步先解析 `convars.txt` / `commands.txt` 各自的最新 commit，取两者较新者，再按该 commit 取 raw 文件，避免 API 与 raw 内容不同步，也避免只改 schema 的提交产生空数据更新。
- 上游事实与翻译严格分离。AI 不决定类型、默认值、`min/max` 或 flags。
- Console 页面应展示上游仓库与 commit；`metadata.json` 保留仓库、文件、commit 和 SHA256，生成的索引保留仓库与 commit。

## 目录

```text
website/
├─ data/console/
│  ├─ convars.json        # 上游 ConVar 事实
│  ├─ commands.json       # 上游 Command 事实
│  ├─ translations.json   # AI 译文缓存，按 type:name 索引
│  ├─ overrides.json      # 人工修订/分类，永远优先
│  ├─ categories.json     # 固定分类词表
│  └─ metadata.json       # 上游 commit、文件 SHA256、计数
├─ scripts/console/
│  ├─ parse_upstream.py   # 严格解析器
│  ├─ update.py           # 抓取 + 写入上游事实
│  ├─ translate.py        # 本地 seed / Workers AI 增量翻译
│  ├─ validate.py         # 数据契约校验
│  ├─ build_index.py      # 生成 public/data/console-index.json
│  └─ test_*.py
├─ src/lib/console/types.ts  # 索引的 TypeScript 契约
└─ public/data/console-index.json  # 构建时生成，不提交；供 /console 搜索按需加载
```

`console-index.json` 是纯构建产物：`pnpm build` 的 `prebuild` 会先校验数据、再生成索引，然后 Vite 把它复制到部署目录。它不进入 git，避免每天提交一个 2MB 的生成文件。

## 三层数据

### 1. 上游事实

`convars.json` / `commands.json` 只保存从 Valve dump 解析出的内容：

```json
{
  "type": "convar",
  "name": "fps_max",
  "default": "400",
  "min": null,
  "max": null,
  "flags": ["clientdll", "archive"],
  "description": "Frame rate limit"
}
```

- `default/min/max` 一律字符串；`min/max` 从 flags 中拆出，不再作为 flag。
- `flags` 保留上游原名和顺序。
- Command 没有 `default/min/max`。
- 每条记录的来源（仓库、文件、commit、SHA256）统一记录在 `metadata.json`，不在 5,585 条记录里重复。

### 2. 翻译缓存

`translations.json` 的键是 `convar:<name>` 或 `command:<name>`：

```json
{
  "zh": "帧率上限。",
  "basis": "english",
  "sourceHash": "sha256:...",
  "producer": "agent-seed",
  "model": "remote-magpie/opencode-go/deepseek-v4.1-flash[1m]",
  "promptVersion": "console-zh-v1",
  "translatedAt": "2026-11-10T08:47:22Z"
}
```

- `basis: "english"`：有英文原文，`sourceHash` 必须匹配当前英文；英文变化会自动失效并重译。
- `basis: "name-flags"`：上游没有英文说明，中文是根据名称、类型、默认值和 flags 推断的简述。`sourceHash` 为 `null`，UI 必须标注“AI 推断”，默认不进入搜索索引。
- `producer: "agent-seed"`：初始全量本地译本。
- `producer: "workers-ai"`：CI 中由 Cloudflare Workers AI（Llama 3.3 70B）维护的新增/变更记录。
- 修改 `SYSTEM_PROMPT` 时必须同步 bump `PROMPT_VERSION`；否则 `build_work_items` 会认为旧译文仍然新鲜，不会自动重译。

### 3. 人工修订

`overrides.json` 优先级最高：

```json
{
  "convar:fps_max": {
    "zh": "人工修订后的说明。",
    "category": "graphics",
    "note": "reviewed 2026-11-10"
  }
}
```

- `zh` 一旦存在，翻译流水线不会再碰这条记录。
- 人工覆盖不会因英文原文变化而自动失效；`overrides.json` 不存 `sourceHash`，英文变化后需要人工复核。
- `category` 用于覆盖启发式分类；必须是 `categories.json` 中的 slug。
- 人工修订可以针对没有被 AI 翻译的记录。

## 状态派生

状态不落盘到上游事实，而是在 `build_index.py` 中派生：

| 状态 | 条件 | 可索引 |
| --- | --- | --- |
| `human-edited` | `overrides.json` 有 `zh` | 是 |
| `translated` | 英文翻译且 `sourceHash` 匹配 | 是 |
| `inferred` | 无英文，`basis=name-flags` | 否 |
| `stale` | 英文已变化，译文未刷新 | 否 |
| `missing` | 没有译文 | 否 |

`developmentonly` / `defensive` 记录保留在数据中，但默认不进入索引；后续 UI 可以按 flags 过滤。

## 常用命令

在 `website/` 下：

```bash
pnpm console:update          # 抓取最新上游并写入事实层
pnpm console:validate        # 校验全部数据
pnpm console:index           # 生成 public/data/console-index.json
pnpm console:test            # Python 单元测试
pnpm console:translate --backend workers-ai --preflight
```

本地一次性 seed（只在需要重建初始译本时使用）：

```bash
python3 scripts/console/translate.py --backend local
```

增量翻译（CI 使用）：

```bash
python3 scripts/console/translate.py --backend workers-ai
```

`translate.py` 会跳过 source hash 未变化的条目，并在每个批次后原子保存，可安全中断后重跑。`--limit 20` 用于小样本验证，`--force` 用于强制重译，`--no-inferred` 用于只翻译有英文原文的记录。换翻译模型不会自动触发重译；需要全量重译时显式使用 `--force`。

## 校验规则

`validate.py` 无网络运行，CI 和 scheduled workflow 都会执行：

- 解析器遇到未知 header、重复名称、孤立说明行直接报错。
- `(type, name)` 唯一；flags 不能包含 `min:` / `max:`。
- ConVar 的 `default/min/max` 必须是字符串，`min/max` 必须是数值格式。
- Command 不允许出现 `default/min/max`。
- 翻译键必须对应上游记录；`sourceHash` 必须匹配当前英文。
- 英文为空的记录不能有 `basis=english` 的译文；有英文的记录不能用 `basis=name-flags` 冒充。
- 人工覆盖的 key 必须存在，分类必须合法。
- `metadata.json` 的计数必须与实际记录一致。
- 单次同步记录数下降超过 20% 时 `update.py` 默认拒绝写入，需 `--allow-large-changes` 人工确认。

`build_index.py --check` 是可选的严格模式：如果以后决定把索引提交进仓库，可以用它确认生成物与源数据一致。当前索引不提交，由 `prebuild` 生成。

## CI

`.github/workflows/update-console-data.yml` 每天 02:00 UTC 运行，也支持手动触发：

1. Python 单元测试
2. `update.py`（先更新上游事实）
3. Workers AI 预检（`continue-on-error`）
4. `translate.py --backend workers-ai`（`continue-on-error`）
5. `validate.py --allow-stale`
6. `build_index.py`
7. 显式 `git add website/data/console`，有变化才提交

翻译失败不会阻断上游事实更新：成功批次写入，失败条目保持缺失，下次运行重试。

需要配置的 GitHub Secrets：

- `CLOUDFLARE_ACCOUNT_ID`：Cloudflare 账户 ID
- `CLOUDFLARE_AI_TOKEN`：Account → Workers AI → Read/Edit
- `GITHUB_TOKEN`：自动注入，用于读取上游 commit 和 push，无需手动创建

`deploy-worker.yml` 继续使用 `CLOUDFLARE_API_TOKEN`（Workers Scripts Edit）+ `CLOUDFLARE_ACCOUNT_ID`；建议 AI token 与部署 token 分开。本地预检：

```bash
cd website
CLOUDFLARE_AI_TOKEN="..." \
CLOUDFLARE_ACCOUNT_ID="..." \
python3 scripts/console/translate.py --backend workers-ai --preflight
```

注意：`GITHUB_TOKEN` 推送的 commit 不会触发另一个监听 `push` 的 workflow。数据实际变化后，需要用 `workflow_dispatch` 显式触发部署，或改用 PAT / `workflow_run` 串联。

## 现状与边界

- 数据流水线已接入 React Router 8 的 `/console` 路由；初始全量由本地会话模型生成，后续新增/变更由 Workers AI 增量维护。
- 官网 `/` 与 `/console` 共用统一导航条和 Footer；Console 页面、详情预渲染、SEO 与 sitemap 已存在，详见 [`docs/architecture/WEBSITE.md`](../../../docs/architecture/WEBSITE.md)。
- 根目录不新增 npm 依赖或数据脚本；前端脚本在 `website/package.json`。
- 不把上游事实和翻译合并成一个文件；不要手改 `convars.json` / `commands.json` / `translations.json` / `metadata.json`，它们由脚本生成。
- 修改 `SYSTEM_PROMPT` 时必须 bump `PROMPT_VERSION`；全量重译需显式 `--force`。
- 上游删除的记录：`update.py` 会清理对应翻译，历史仍可从 git 恢复。后续需要“已删除记录”页面时，再单独引入 `history.json`。
- 如果上游删除了带人工覆盖的记录，`validate.py` 会报 orphan override 并阻止提交；这是故意的 fail-closed，需要人工确认后删除或迁移覆盖。
