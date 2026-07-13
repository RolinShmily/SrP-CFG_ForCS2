export interface Env {
  VECTORIZE_INDEX: VectorizeIndex;
  AI: Ai;
  ASSETS: { fetch: typeof fetch };
  TURNSTILE_SECRET_KEY?: string;
}

const EMBEDDING_MODEL = "@cf/baai/bge-m3";
const LLM_MODEL = "@cf/meta/llama-3.2-3b-instruct";
const TOP_K = 8;
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

// Best-effort per-isolate limiter. Turnstile and AI Gateway remain the durable abuse controls.
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 10;
  const current = rateLimitMap.get(ip);

  if (!current || current.resetAt <= now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= maxRequests) return false;

  current.count += 1;
  return true;
}

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

async function handleChat(request: Request, env: Env): Promise<Response> {
  const requestUrl = new URL(request.url);
  const requestOrigin = request.headers.get("Origin");
  if (requestOrigin && requestOrigin !== requestUrl.origin) {
    return jsonError("不允许跨站请求。", 403);
  }

  const clientIp = request.headers.get("cf-connecting-ip") || "unknown";
  if (!checkRateLimit(clientIp)) {
    return jsonError("请求过于频繁，请稍候再试（限制 10 次/分钟）。", 429);
  }

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
    let queryEmbedResponse;
    try {
      queryEmbedResponse = await env.AI.run(
        EMBEDDING_MODEL,
        {
          text: [message],
        },
        {
          gateway: {
            id: "srp-cfg",
          },
        },
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Embedding model (${EMBEDDING_MODEL}) failed: ${message}`);
    }
    const queryVector = queryEmbedResponse.data[0] as number[];

    // 2. Semantic search in Vectorize
    const vectorMatches = await env.VECTORIZE_INDEX.query(queryVector, {
      topK: TOP_K,
      returnValues: false,
      returnMetadata: "all",
    });

    // 3. Build context from matched metadata
    const matchedCommands = (vectorMatches.matches ?? [])
      .map((match: { metadata?: unknown }) => match.metadata)
      .filter(Boolean) as Array<{
      n: string;
      cn: string;
      en: string;
      d: string;
      t: string;
    }>;

    const contextStr = matchedCommands
      .map(
        (command) =>
          `- \`${command.n}\` (${command.t}): ${command.cn || command.en || "无描述"} | 默认值: ${command.d || "无"}`,
      )
      .join("\n");

    // 4. Construct the prompt
    const systemPrompt = `你是一个专业的 CS2 游戏控制台指令助理。请根据下面提供的参考指令字典，解答玩家的提问。

参考指令字典（按相关度排序）：
${contextStr}

回答规范：
1. 只解答 CS2 游戏控制台指令相关问题，婉拒无关内容。
2. 涉及指令时，必须用 \`指令名\` 格式包裹，并说明该指令的作用、默认值及推荐设置。
3. 如果字典中没有直接匹配的指令，请如实告知玩家，不要编造字典中不存在的指令。
4. 保持回答简练、专业、有条理。请使用中文回答。`;

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
          max_tokens: 1_024,
          stream: true,
        },
        {
          gateway: {
            id: "srp-cfg",
          },
        },
      )) as ReadableStream;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`LLM model (${LLM_MODEL}) failed: ${message}`);
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
