export interface Env {
  VECTORIZE_INDEX: VectorizeIndex;
  AI: Ai;
  ASSETS: { fetch: typeof fetch };
  TURNSTILE_SECRET_KEY?: string;
}

const EMBEDDING_MODEL = "@cf/baai/bge-m3";
const LLM_MODEL = "@cf/meta/llama-3.2-3b-instruct";
const TOP_K = 8;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env);
    }
    
    // Diagnostic endpoint
    if (url.pathname === "/api/health") {
      return new Response(
        JSON.stringify({
          aiBinding: !!env.AI,
          vectorizeBinding: !!env.VECTORIZE_INDEX,
          envKeys: Object.keys(env)
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Fallback to static assets (Astro SSG output)
    return env.ASSETS.fetch(request);
  },
};

// Simple in-memory rate limiter per edge node
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10; // Max 10 requests per minute per IP

  let requests = rateLimitMap.get(ip) || [];
  requests = requests.filter((time) => now - time < windowMs);

  if (requests.length >= maxRequests) {
    rateLimitMap.set(ip, requests);
    return false;
  }

  requests.push(now);
  rateLimitMap.set(ip, requests);
  return true;
}

async function handleChat(request: Request, env: Env): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  const clientIp = request.headers.get("cf-connecting-ip") || "unknown";
  if (clientIp !== "unknown" && !checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: "请求过于频繁，请稍候再试（限制 10次/分钟）。" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { message, history, turnstileToken } = (await request.json()) as {
      message: string;
      history?: { role: string; content: string }[];
      turnstileToken?: string;
    };

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Turnstile verification (optional — only if SECRET is configured)
    if (env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return new Response(JSON.stringify({ error: "缺少人机验证令牌，请刷新页面后重试。" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
      const verifyBody = new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: clientIp === "unknown" ? "" : clientIp,
      });
      const verifyRes = await fetch(verifyUrl, {
        method: "POST",
        body: verifyBody,
      });
      const verifyData = (await verifyRes.json()) as { success: boolean; [key: string]: unknown };
      if (!verifyData.success) {
        return new Response(JSON.stringify({ error: "人机验证失败，请刷新页面后重试。" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // 1. Embed the user query
    let queryEmbedResponse;
    try {
      queryEmbedResponse = await env.AI.run(EMBEDDING_MODEL, {
        text: [message],
      });
    } catch (e: unknown) {
      const err = e as Error;
      throw new Error(`Embedding model (${EMBEDDING_MODEL}) failed: ${err.message}`);
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
      .map((m) => m.metadata)
      .filter(Boolean) as Array<{
      n: string;
      cn: string;
      en: string;
      d: string;
      t: string;
    }>;

    const contextStr = matchedCommands
      .map(
        (cmd) =>
          `- \`${cmd.n}\` (${cmd.t}): ${cmd.cn || cmd.en || "无描述"} | 默认值: ${cmd.d || "无"}`,
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
      ...(history ?? []).slice(-6).map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    // 5. Stream the LLM response
    let stream;
    try {
      stream = (await env.AI.run(LLM_MODEL, {
        messages,
        max_tokens: 2048,
        stream: true,
      })) as ReadableStream;
    } catch (e: unknown) {
      const err = e as Error;
      throw new Error(`LLM model (${LLM_MODEL}) failed: ${err.message}`);
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        ...corsHeaders,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    
    // Detect missing bindings
    const bindingsState = {
      hasAI: !!env.AI,
      hasVectorize: !!env.VECTORIZE_INDEX,
    };

    console.error("Chat API error:", errorMsg, stack);
    return new Response(
      JSON.stringify({ 
        error: errorMsg,
        details: stack,
        bindings: bindingsState
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
}
