interface VectorizeMatch {
  metadata?: unknown;
}

interface VectorizeResult {
  matches?: VectorizeMatch[];
}

interface VectorizeBinding {
  query(
    vector: number[],
    options: { topK: number; returnValues: boolean; returnMetadata: "all" },
  ): Promise<VectorizeResult>;
}

interface AiBinding {
  run(model: string, inputs: Record<string, unknown>, options?: Record<string, unknown>): Promise<unknown>;
}

export interface Env {
  COMMANDS_INDEX: VectorizeBinding;
  CONFIG_INDEX: VectorizeBinding;
  AI: AiBinding;
  ASSETS: { fetch: typeof fetch };
  TURNSTILE_SECRET_KEY?: string;
}

const EMBEDDING_MODEL = "@cf/baai/bge-m3";
const LLM_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";
const TOP_K = 8;
const MAX_OUTPUT_TOKENS = 2_048;
const TURNSTILE_ACTION = "chat";
const MAX_REQUEST_BODY_LENGTH = 32_768;
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_ITEMS = 6;
const MAX_HISTORY_CONTENT_LENGTH = 4_000;

type ChatRole = "user" | "assistant";

interface ChatHistoryItem {
  role: ChatRole;
  content: string;
}

type ChatDatabase = "srpcfg" | "commands";

interface KnowledgeMetadata {
  kind?: string;
  sourcePath?: string;
  line?: number;
  module?: string;
  family?: string;
  role?: string;
  command?: string;
  symbol?: string;
  key?: string;
  source?: string;
  body?: string;
  target?: string;
  arguments?: string;
  actionIndex?: number;
  description?: string;
  scope?: string;
  activation?: string;
  relation?: string;
  subject?: string;
  n?: string;
  cn?: string;
  en?: string;
  d?: string;
  t?: string;
  value_cn?: string;
  range?: string;
  options?: string;
}

interface TurnstileVerification {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: { Allow: "POST, OPTIONS" },
        });
      }
      if (request.method !== "POST") {
        return jsonError("Method not allowed", 405, { Allow: "POST, OPTIONS" });
      }
      return handleChat(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};


function jsonError(message: string, status: number, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isKnowledgeMetadata(value: unknown): value is KnowledgeMetadata {
  return isRecord(value);
}

export function formatConfigContext(item: KnowledgeMetadata): string {
  const location = item.sourcePath
    ? `${item.sourcePath}${typeof item.line === "number" ? `:${item.line}` : ""}`
    : "未知位置";
  return [
    `- 类型：${item.kind || "config"}`,
    `位置：${location}`,
    item.module ? `模块：${item.family ? `${item.family}/` : ""}${item.module}` : "",
    item.source ? `源码：\`${item.source}\`` : "",
    item.key ? `按键：${JSON.stringify(item.key)}` : "",
    item.symbol ? `Alias：${item.symbol}` : "",
    item.body ? `绑定或定义内容：${JSON.stringify(item.body)}` : "",
    item.target ? `目标文件：${item.target}` : "",
    item.arguments ? `参数：${item.arguments}` : "",
    item.description ? `注释说明：${item.description}` : "",
    item.scope ? `生效范围：${item.scope}` : "",
    item.activation ? `加载路径：${item.activation}` : "",
    item.relation ? `关联关系：${item.relation}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function formatCommandContext(item: KnowledgeMetadata): string {
  return [
    `- \`${item.n || "未知指令"}\` (${item.t || "unknown"}): ${item.cn || item.en || "无描述"}`,
    `默认值: ${item.d ?? "无"}`,
    item.value_cn ? `数值说明: ${item.value_cn}` : "",
    item.range ? `范围: ${item.range}` : "",
    item.options ? `离散取值: ${item.options}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

async function handleChat(request: Request, env: Env): Promise<Response> {
  const requestUrl = new URL(request.url);
  const requestOrigin = request.headers.get("Origin");
  if (requestOrigin && requestOrigin !== requestUrl.origin) {
    return jsonError("不允许跨站请求。", 403);
  }

  const clientIp = request.headers.get("cf-connecting-ip") || "unknown";

  try {
    const contentType = request.headers.get("Content-Type")?.split(";", 1)[0].trim();
    if (contentType !== "application/json") {
      return jsonError("请求格式必须为 JSON。", 415);
    }

    const declaredLength = Number(request.headers.get("Content-Length") || "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BODY_LENGTH) {
      return jsonError("请求内容过长。", 413);
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_REQUEST_BODY_LENGTH) {
      return jsonError("请求内容过长。", 413);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return jsonError("请求 JSON 无效。", 400);
    }
    if (!isRecord(payload)) {
      return jsonError("请求内容无效。", 400);
    }

    if (typeof payload.message !== "string") {
      return jsonError("请输入问题。", 400);
    }
    const message = payload.message.trim();
    if (!message) return jsonError("请输入问题。", 400);
    if (message.length > MAX_MESSAGE_LENGTH) {
      return jsonError(`问题不能超过 ${MAX_MESSAGE_LENGTH} 个字符。`, 400);
    }

    const history: ChatHistoryItem[] = [];
    if (payload.history !== undefined) {
      if (!Array.isArray(payload.history) || payload.history.length > MAX_HISTORY_ITEMS) {
        return jsonError("对话历史格式无效。", 400);
      }
      for (const item of payload.history) {
        if (
          !isRecord(item) ||
          (item.role !== "user" && item.role !== "assistant") ||
          typeof item.content !== "string" ||
          item.content.length > MAX_HISTORY_CONTENT_LENGTH
        ) {
          return jsonError("对话历史格式无效。", 400);
        }
        history.push({ role: item.role, content: item.content });
      }
    }

    let database: ChatDatabase = "srpcfg";
    if (payload.db !== undefined) {
      if (payload.db !== "srpcfg" && payload.db !== "commands") {
        return jsonError("未知的知识库。", 400);
      }
      database = payload.db;
    }

    if (!env.TURNSTILE_SECRET_KEY) {
      console.error("TURNSTILE_SECRET_KEY is not configured");
      return jsonError("AI 助手安全验证未配置，暂时不可用。", 503);
    }
    if (typeof payload.turnstileToken !== "string" || !payload.turnstileToken) {
      return jsonError("缺少人机验证令牌，请刷新页面后重试。", 403);
    }
    if (payload.turnstileToken.length > 2_048) {
      return jsonError("人机验证令牌无效。", 403);
    }

    const verifyBody = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: payload.turnstileToken,
    });
    if (clientIp !== "unknown") verifyBody.set("remoteip", clientIp);

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: verifyBody,
    });
    if (!verifyRes.ok) {
      console.error("Turnstile Siteverify request failed", verifyRes.status);
      return jsonError("人机验证服务暂时不可用，请稍后重试。", 503);
    }

    const verifyData = (await verifyRes.json()) as TurnstileVerification;
    const validTurnstile =
      verifyData.success &&
      verifyData.action === TURNSTILE_ACTION &&
      verifyData.hostname === requestUrl.hostname;
    if (!validTurnstile) {
      console.warn("Turnstile validation rejected", {
        hostname: verifyData.hostname,
        action: verifyData.action,
        errorCodes: verifyData["error-codes"],
      });
      return jsonError("人机验证失败，请刷新页面后重试。", 403);
    }

    // 1. Embed the user query
    let queryVector: number[];
    try {
      const queryEmbedResponse = (await env.AI.run(
        EMBEDDING_MODEL,
        {
          text: [message],
        },
        {
          gateway: {
            id: "srp-cfg",
          },
        },
      )) as { data?: number[][] };
      queryVector = queryEmbedResponse.data?.[0] ?? [];
      if (queryVector.length === 0) throw new Error("Embedding response did not contain a vector");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Embedding model (${EMBEDDING_MODEL}) failed: ${errorMessage}`);
    }

    // 2. Query only the explicitly selected physical index.
    const indexToQuery = database === "srpcfg" ? env.CONFIG_INDEX : env.COMMANDS_INDEX;
    if (!indexToQuery) {
      return jsonError("所选知识库暂时不可用。", 503);
    }

    const vectorMatches = await indexToQuery.query(queryVector, {
      topK: TOP_K,
      returnValues: false,
      returnMetadata: "all",
    });

    // 3. Build context from matched metadata.
    const matchedKnowledge = (vectorMatches.matches ?? [])
      .map((match) => match.metadata)
      .filter(isKnowledgeMetadata);

    const contextStr = matchedKnowledge
      .map(database === "srpcfg" ? formatConfigContext : formatCommandContext)
      .join("\n");
    const referenceContext = contextStr || "未检索到匹配记录。";

    // 4. Construct the prompt based on selected database.
    let systemPrompt: string;
    if (database === "srpcfg") {
      systemPrompt = `你是 SrP-CFG 配置包的证据检索助手。下方资料是从 config/ 源码确定性解析出的结构化记录，每条记录都包含可引用的文件、行号和原始源码。

参考资料（按相关度排序；仅这些资料可作为事实依据）：
${referenceContext}

回答规范：
1. 先定位与问题完全匹配的结构化字段。按键问题只允许读取“按键”和“绑定或定义内容”；alias 问题只允许读取“Alias”“绑定或定义内容”和“关联关系”；不得根据名称、常见用法或对话中的暗示猜测。
2. 每个关于按键、命令、默认值、加载文件或作用范围的事实，必须在同一句中引用 \`config/路径:行号\`。没有匹配源码时只回答“当前检索证据不足”，不得补全可能答案。
3. “源码”字段优先级最高；注释只解释源码，不能覆盖源码。用户指出错误时必须重新核对同一条源码，不能为了迎合而改成另一个无证据答案。
4. 必须区分 Runtime 注册、settings 状态、keymap 物理键位、with-keymap 组合入口、Preset 应用和 user/custom.cfg 最终覆盖层。
5. 只解答 SrP-CFG 及其使用到的 CS2 指令。回答简练、使用中文，并以完整句子结束。`;
    } else {
      systemPrompt = `你是 CS2 官方控制台指令与变量助手。下方参考资料来自独立的官方指令向量库。

参考指令字典（按相关度排序）：
${referenceContext}

回答规范：
1. 只解答 CS2 官方控制台指令与变量（Cvar）相关问题，婉拒无关内容。
2. 涉及指令或变量时，使用反引号包裹名称，并说明作用、默认值、引擎 Min/Max 约束、描述范围和离散取值（资料提供时）；不得把“说明范围”说成引擎强制限制。
3. 如果字典中没有直接匹配的指令或未提供具体范围，请如实告知，不要编造不存在的指令、默认值、单位或边界。
4. 回答必须以完整句子结束。资料过多时应压缩每项文字或明确分批回答，不得在默认值、范围、离散取值或命令名称中途停止。
5. 保持简练、专业、有条理，使用中文回答。`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    // 5. Stream the LLM response
    let stream;
    try {
      stream = (await env.AI.run(
        LLM_MODEL,
        {
          messages,
          max_tokens: MAX_OUTPUT_TOKENS,
          temperature: 0.2,
          stream: true,
        },
        {
          gateway: {
            id: "srp-cfg",
            metadata: { knowledgeBase: database },
          },
        },
      )) as ReadableStream;
      if (!(stream instanceof ReadableStream)) throw new Error("Model did not return a response stream");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`LLM model (${LLM_MODEL}) failed: ${errorMessage}`);
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("Chat API error:", message, stack);
    if (message.includes("2016") || message.includes("2017") || message.includes("security configurations")) {
      return jsonError("提问或回复包含不当及敏感内容，已被安全策略拦截。", 400);
    }
    return jsonError("AI 服务暂时不可用，请稍后重试。", 500);
  }
}
