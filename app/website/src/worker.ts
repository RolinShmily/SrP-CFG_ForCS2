import configKnowledgeManifest from "./data/config-knowledge/manifest.json" with { type: "json" };

interface VectorizeMatch {
  id?: string;
  score?: number;
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
const COMMAND_TOP_K = 8;
const CONFIG_TOP_K = 50;
const CONFIG_CONTEXT_LIMIT = 12;
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
  schema?: string;
  entityId?: string;
  entityType?: string;
  status?: string;
  sourcePath?: string;
  sourceLine?: number;
  sourceRef?: string;
  source?: string;
  title?: string;
  summary?: string;
  tags?: string;
  keywords?: string;
  name?: string;
  aliases?: string;
  key?: string;
  cvar?: string;
  target?: string;
  body?: string;
  area?: string;
  module?: string;
  role?: string;
  entryId?: string;
  fileId?: string;
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

const PRODUCTION_CONFIG_STATUSES = new Set(configKnowledgeManifest.productionStatuses);
const SOURCE_REF_PATTERN = /config\/[A-Za-z0-9_./-]+\.cfg:\d+/g;
const IDENTIFIER_PATTERN = /[A-Za-z_+][A-Za-z0-9_+.-]*/g;
const QUERY_STOP_WORDS: Record<string, true> = {
  a: true,
  an: true,
  and: true,
  cfg: true,
  config: true,
  for: true,
  in: true,
  key: true,
  keys: true,
  of: true,
  preset: true,
  the: true,
  to: true,
  what: true,
};
const PRESET_NAMES: Record<string, true> = { default: true, echo: true, valve: true, visionl: true, yszh: true };
const CONFIG_TYPE_LIMITS: Record<string, number> = {
  binding: 4,
  alias: 4,
  setting: 3,
  entry: 3,
  concept: 2,
  file: 2,
};

interface ConfigQuerySignals {
  identifiers: Set<string>;
  keys: Set<string>;
  paths: Set<string>;
  presets: Set<string>;
}

interface RankedConfigMatch {
  item: KnowledgeMetadata;
  exactScore: number;
  vectorScore: number;
}

function normalizeExact(value: string): string {
  return value.trim().toLowerCase();
}

function identifierTokens(value: string | undefined): Set<string> {
  return new Set((value?.match(IDENTIFIER_PATTERN) ?? []).map(normalizeExact));
}

function extractSourceRefs(value: string | undefined): string[] {
  return [...new Set(value?.match(SOURCE_REF_PATTERN) ?? [])];
}

function isProductionConfigEvidence(item: KnowledgeMetadata): boolean {
  if (
    item.schema !== "srp-config-v3" ||
    !item.entityId ||
    !item.entityType ||
    !item.status ||
    !PRODUCTION_CONFIG_STATUSES.has(item.status) ||
    !item.source ||
    !item.sourcePath ||
    typeof item.sourceLine !== "number"
  ) {
    return false;
  }
  return extractSourceRefs(item.sourceRef).includes(`${item.sourcePath}:${item.sourceLine}`);
}

function buildConfigQuerySignals(message: string): ConfigQuerySignals {
  const normalizedMessage = normalizeExact(message);
  const identifiers = identifierTokens(normalizedMessage);
  for (const stopWord of Object.keys(QUERY_STOP_WORDS)) identifiers.delete(stopWord);

  const paths = new Set<string>();
  for (const match of normalizedMessage.matchAll(/(?:config\/)?[a-z0-9_./-]+\.cfg/g)) {
    paths.add(match[0].startsWith("config/") ? match[0] : `config/${match[0]}`);
  }

  const keys = new Set<string>();
  const keyPatterns = [
    /(?:key|按键|键位|绑定)\s*[`"'“”]?([a-z0-9+_.-]+)[`"'“”]?/g,
    /[`"'“”]?([a-z0-9+_.-]+)[`"'“”]?\s*(?:key|按键|键位)/g,
  ];
  for (const pattern of keyPatterns) {
    for (const match of normalizedMessage.matchAll(pattern)) keys.add(match[1]);
  }

  const presets = new Set([...identifiers].filter((identifier) => PRESET_NAMES[identifier]));
  return { identifiers, keys, paths, presets };
}

function hasToken(value: string | undefined, expected: Set<string>): boolean {
  if (!value || expected.size === 0) return false;
  const tokens = identifierTokens(value);
  return [...expected].some((candidate) => tokens.has(candidate));
}

function exactScore(item: KnowledgeMetadata, signals: ConfigQuerySignals): number {
  const exact = (value: string | undefined, candidates: Set<string>) =>
    Boolean(value && candidates.has(normalizeExact(value)));
  let score = 0;
  if (exact(item.key, signals.keys)) score += 1_400;
  if (exact(item.name, signals.identifiers) || exact(item.cvar, signals.identifiers)) score += 1_300;
  if (exact(item.sourcePath, signals.paths)) score += 1_200;
  if (hasToken(item.aliases, signals.identifiers)) score += 1_100;
  if (exact(item.module, signals.presets)) score += 900;
  if (hasToken(item.target, signals.identifiers) || hasToken(item.body, signals.identifiers)) score += 700;
  if (hasToken(item.source, signals.identifiers)) score += 500;
  if (hasToken(item.title, signals.identifiers)) score += 300;
  if (hasToken(item.tags, signals.identifiers) || hasToken(item.keywords, signals.identifiers)) score += 150;
  if (score > 0 && item.status === "reviewed") score += 100;
  return score;
}

export function selectConfigKnowledge(
  message: string,
  matches: VectorizeMatch[],
  signals = buildConfigQuerySignals(message),
): KnowledgeMetadata[] {
  const ranked: RankedConfigMatch[] = matches
    .filter((match): match is VectorizeMatch & { metadata: KnowledgeMetadata } => isKnowledgeMetadata(match.metadata))
    .map((match) => ({
      item: match.metadata,
      exactScore: exactScore(match.metadata, signals),
      vectorScore: typeof match.score === "number" ? match.score : 0,
    }))
    .filter(({ item }) => isProductionConfigEvidence(item))
    .sort((left, right) =>
      right.exactScore - left.exactScore ||
      Number(right.item.status === "reviewed") - Number(left.item.status === "reviewed") ||
      right.vectorScore - left.vectorScore ||
      left.item.entityId!.localeCompare(right.item.entityId!),
    );

  const selected: KnowledgeMetadata[] = [];
  const seenEntityIds = new Set<string>();
  const typeCounts = new Map<string, number>();
  for (const { item } of ranked) {
    const entityId = item.entityId!;
    const entityType = item.entityType!;
    if (seenEntityIds.has(entityId)) continue;
    const typeCount = typeCounts.get(entityType) ?? 0;
    const typeLimit = CONFIG_TYPE_LIMITS[entityType] ?? 2;
    if (typeCount >= typeLimit) continue;
    seenEntityIds.add(entityId);
    typeCounts.set(entityType, typeCount + 1);
    selected.push(item);
    if (selected.length >= CONFIG_CONTEXT_LIMIT) break;
  }
  return selected;
}

export function formatConfigContext(item: KnowledgeMetadata): string {
  if (!isProductionConfigEvidence(item)) return "";
  const sourceRefs = extractSourceRefs(item.sourceRef);
  return [
    `- 实体：${item.entityId} (${item.entityType}; ${item.status})`,
    `证据：${sourceRefs.join("、")}`,
    item.title ? `标题：${item.title}` : "",
    item.summary ? `摘要：${item.summary}` : "",
    item.source ? `源码：\`${item.source}\`` : "",
    item.name ? `名称：${item.name}` : "",
    item.key ? `按键：${JSON.stringify(item.key)}` : "",
    item.cvar ? `Cvar：${item.cvar}` : "",
    item.aliases ? `别名：${item.aliases}` : "",
    item.body ? `绑定或定义内容：${JSON.stringify(item.body)}` : "",
    item.target ? `目标：${item.target}` : "",
    item.module ? `模块：${item.area ? `${item.area}/` : ""}${item.module}` : "",
    item.role ? `职责：${item.role}` : "",
    item.tags ? `标签：${item.tags}` : "",
    item.keywords ? `关键词：${item.keywords}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

export function buildConfigReferenceContext(items: KnowledgeMetadata[]): string {
  const context = items.map(formatConfigContext).filter(Boolean).join("\n");
  return context || "未检索到可引用的生产证据。";
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

    // Recognize exact identifiers before retrieval; Vectorize has no metadata listing API,
    // so the broad query is reranked deterministically from returned v3 metadata.
    const configQuerySignals = buildConfigQuerySignals(message);

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
      topK: database === "srpcfg" ? CONFIG_TOP_K : COMMAND_TOP_K,
      returnValues: false,
      returnMetadata: "all",
    });

    // 3. Keep only source-backed production config entities, rerank exact metadata,
    // dedupe by stable entity ID, and enforce per-entity-type context limits.
    let referenceContext: string;
    if (database === "srpcfg") {
      const matchedKnowledge = selectConfigKnowledge(message, vectorMatches.matches ?? [], configQuerySignals);
      referenceContext = buildConfigReferenceContext(matchedKnowledge);
    } else {
      referenceContext = (vectorMatches.matches ?? [])
        .map((match) => match.metadata)
        .filter(isKnowledgeMetadata)
        .map(formatCommandContext)
        .join("\n") || "未检索到匹配记录。";
    }

    // 4. Construct the prompt based on selected database.
    let systemPrompt: string;
    if (database === "srpcfg") {
      systemPrompt = `你是 SrP-CFG 配置包的证据检索助手。下方资料来自 v3 curated knowledge，每条可用记录都有稳定实体 ID、生产状态和 config/ 源码引用。

参考资料（已按精确字段优先、语义相关度其次排序；仅这些资料可作为事实依据）：
${referenceContext}

回答规范：
1. 先核对“实体”“名称”“按键”“Cvar”“别名”“目标”“模块”等精确字段，再读摘要、标签和关键词。完整名称必须完整匹配；例如不得把 srp_practice 与 srp_practice_keys 当作同一实体。
2. 只使用状态为 generated 或 reviewed 且带“证据”的记录。相同实体 ID 的内容属于同一实体，不得跨实体拼接事实；精确匹配的 reviewed 记录优先。
3. 每个关于按键、命令、默认值、加载文件或作用范围的事实，必须在同一句中引用资料给出的 \`config/路径.cfg:行号\`。没有可引用证据时只回答“当前检索证据不足”，不得补全可能答案。
4. “源码”和证据引用优先于 curated 摘要；标题、摘要、标签和关键词只用于定位与解释，不能覆盖源码。用户指出错误时必须重新核对同一实体的证据。
5. 必须区分 Runtime 注册、settings 状态、keymap 物理键位、with-keymap 组合入口、Preset 应用和 user/custom.cfg 最终覆盖层。
6. 只解答 SrP-CFG 及其使用到的 CS2 指令。回答简练、使用中文，并以完整句子结束。`;
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
