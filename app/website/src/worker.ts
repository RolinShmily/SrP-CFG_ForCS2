export interface Env {
  VECTORIZE_INDEX: VectorizeIndex;
  AI: Ai;
  ASSETS: { fetch: typeof fetch };
}

const EMBEDDING_MODEL = "@cf/baai/bge-large-zh-v1.5";
const LLM_MODEL = "@cf/meta/llama-3.1-8b-instruct";
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

    // Fallback to static assets (Astro SSG output)
    return env.ASSETS.fetch(request);
  },
};

async function handleChat(request: Request, env: Env): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const { message, history } = (await request.json()) as {
      message: string;
      history?: { role: string; content: string }[];
    };

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 1. Embed the user query
    const queryEmbedResponse = await env.AI.run(EMBEDDING_MODEL, {
      text: [message],
    });
    const queryVector = queryEmbedResponse.data[0] as number[];

    // 2. Semantic search in Vectorize
    const vectorMatches = await env.VECTORIZE_INDEX.query(queryVector, {
      topK: TOP_K,
      returnValues: false,
      returnMetadata: true,
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
    const stream = (await env.AI.run(LLM_MODEL, {
      messages,
      stream: true,
    })) as ReadableStream;

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        ...corsHeaders,
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
}
