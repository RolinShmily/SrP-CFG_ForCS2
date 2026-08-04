# Website 接口契约（L0.5）

> 来源：`app/website/src/worker.ts`（507 行）+ `app/website/src/lib/ai-stream.ts` + `app/website/public/data/commands.json`。
> **L3 重构时 worker.ts / wrangler.json / ai-stream.ts 零改动（D6）**；本文件用于 React 侧等价实现前端调用。

## 部署拓扑（现状，保持不变）

```
Cloudflare Worker（srp-cfg）
├── POST /api/chat   → AI 逻辑（Vectorize 检索 + Workers AI LLM + Turnstile 校验）
└── 其他所有路径      → env.ASSETS.fetch()（静态资源，来自 ./dist）
```

`wrangler.json` 绑定：`AI`（Workers AI）、`COMMANDS_INDEX` / `CONFIG_INDEX`（Vectorize）、`TURNSTILE_SECRET_KEY`（secret）、`ASSETS`（静态目录）。

## /api/chat 契约

### 请求（POST，Content-Type: application/json）
```jsonc
{
  "message": "string",                 // 最大 500 字符
  "db": "srpcfg" | "commands",         // 检索数据库
  "history": [                          // 最近 6 条，每条 content ≤ 4000 字符
    { "role": "user" | "assistant", "content": "string" }
  ],
  "turnstileToken": "string"           // Turnstile 验证 token
}
```

### 响应
- **成功**：`text/event-stream`，SSE 行格式为 JSON 行（`data: {json}`），结束标记 `[DONE]`。payload 字段：`response` / `delta` / `choices[0].delta.content`（三选一），`finish_reason`。
- **失败**：JSON `{ "error": "string" }` + 非 2xx 状态（405 / 429 / 400 / 500 等）。
- **前端解析器**：`readAiEventStream(body, onUpdate)` — 保留不动，抛出 `IncompleteAiStreamError` / `TruncatedAiResponseError`。

### Turnstile 流程（前端）
1. 外部脚本 `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`（commands.astro 内联加载）。
2. Site Key 由构建环境变量 `PUBLIC_TURNSTILE_SITE_KEY` 注入（公开值，Secret 只在 Worker）。
3. 渲染 widget：`execution:"execute"`、`appearance:"interaction-only"`、`theme:"dark"`、`language:"zh-CN"`、`size:"flexible"`；发消息前 `execute()` 拿 token。
4. 错误码映射（110200 域名未加白名单、110100/110110/400020/400070 site key 无效、200500 组件加载失败、300/600 安全检查失败、120s 超时）。

## commands.json 数据契约（指令检索中心数据源）

- 位置：`app/website/public/data/commands.json`（当前 984KB / 2785 条，构建时原样拷贝）。
- 结构（数组）：
```ts
interface CommandRecord {
  n: string;                    // 指令名，如 "+cl_show_team_equipment"
  d?: string | number;          // 默认值（var）
  f?: string[];                 // flags: clientdll/gamedll/release/cheat/archive
  en?: string;                  // 英文描述
  t: "cmd" | "var";             // 类型
  cn?: string;                  // 中文释义
  c: string;                    // 分类: system/gameplay/graphics/practice/audio/cheats/network/mouse
  // 以下为运行时计算的检索字段（客户端增强）：
  n_lower?: string; cn_lower?: string; en_lower?: string;
  value_lower?: string; pinyin?: string[];
}
```
- 分类统计：system 710 / gameplay 634 / graphics 451 / practice 444 / audio 233 / cheats 178 / network 116 / mouse 19；var 2096 / cmd 689。
- **SEO 现状（问题）**：数据完全由客户端 fetch 渲染，首屏 HTML 无任何指令内容 → L3.4 需构建期预渲染（SSG）。

## 构建期数据

- `src/data/version.ts`：构建时顶层 `await fetchLatestVersion()`（GitHub API，失败回落 `0.0.0`）→ L3 需改为 SSG loader 或构建期注入（Astro 的顶层 await 在 Vite 下不可直接沿用）。
- `src/data/navigation.ts`：navLinks 5 项 + 下载镜像配置 `DL_MIRROR_PREFIX`。
- `src/data/config-knowledge/*.json`：7.7MB，AI 知识库（Vectorize 索引源，构建同步脚本维护，前端不直接使用）。

## L3 保留清单（diff 应为空）

- [ ] `app/website/src/worker.ts`
- [ ] `app/website/src/worker.test.ts`
- [ ] `app/website/src/lib/ai-stream.ts`（+ 测试）
- [ ] `app/website/wrangler.json`
