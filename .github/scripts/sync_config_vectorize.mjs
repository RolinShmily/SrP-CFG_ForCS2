import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const EMBEDDING_MODEL = "@cf/baai/bge-m3";
const DEFAULT_INDEX_NAME = "srp-config-index";
const CONFIG_ROOT = "config";
const EMBEDDING_BATCH_SIZE = 50;
const DELETE_BATCH_SIZE = 1000;
const VECTOR_SCHEMA = "srp-config-v1";
const CURRENT_ID_PREFIX = "srpcfg:";
const LEGACY_ID_PREFIX = "cfg:";
const MAX_METADATA_BYTES = 10 * 1024;
const MAX_VECTOR_ID_BYTES = 64;

const FILE_ROLE_LABELS = {
  bootstrap: "启动入口",
  runtime: "运行时注册",
  settings: "功能设置",
  keymap: "物理键位",
  composition: "设置与键位组合入口",
  presetApply: "Preset 应用入口",
  help: "控制台帮助",
  user: "用户覆盖层",
  library: "预设库",
  auxiliary: "模块辅助文件",
  source: "配置源码",
};

function toPosix(value) {
  return value.replaceAll("\\", "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function compactText(value, limit = 3000) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1)}…`;
}

export function splitInlineComment(rawLine) {
  let quote = "";
  for (let index = 0; index < rawLine.length - 1; index += 1) {
    const char = rawLine[index];
    if ((char === '"' || char === "'") && !quote) {
      quote = char;
      continue;
    }
    if (char === quote) {
      quote = "";
      continue;
    }
    if (
      !quote &&
      char === "/" &&
      rawLine[index + 1] === "/" &&
      (index === 0 || /\s/.test(rawLine[index - 1]))
    ) {
      return {
        code: rawLine.slice(0, index).trimEnd(),
        comment: rawLine.slice(index + 2).trim(),
      };
    }
  }
  return { code: rawLine.trimEnd(), comment: "" };
}

function readArgument(input, startIndex = 0) {
  let index = startIndex;
  while (index < input.length && /\s/.test(input[index])) index += 1;
  if (index >= input.length) return { value: "", nextIndex: index };

  const quote = input[index] === '"' || input[index] === "'" ? input[index] : "";
  if (!quote) {
    const start = index;
    while (index < input.length && !/\s/.test(input[index])) index += 1;
    return { value: input.slice(start, index), nextIndex: index };
  }

  index += 1;
  const start = index;
  while (index < input.length && input[index] !== quote) index += 1;
  const value = input.slice(start, index);
  if (index < input.length) index += 1;
  return { value, nextIndex: index };
}

export function splitActions(body) {
  const actions = [];
  let quote = "";
  let start = 0;
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if ((char === '"' || char === "'") && !quote) {
      quote = char;
    } else if (char === quote) {
      quote = "";
    } else if (char === ";" && !quote) {
      const action = body.slice(start, index).trim();
      if (action) actions.push(action);
      start = index + 1;
    }
  }
  const tail = body.slice(start).trim();
  if (tail) actions.push(tail);
  return actions;
}

function parseAction(source) {
  const trimmed = source.trim();
  const match = /^([^\s]+)(?:\s+([\s\S]*))?$/.exec(trimmed);
  return {
    source: trimmed,
    command: match?.[1] ?? "",
    arguments: match?.[2]?.trim() ?? "",
  };
}

export function parseExecutableLine(rawLine, lineNumber, precedingComments = []) {
  const { code, comment } = splitInlineComment(rawLine);
  const source = code.trim();
  if (!source) return null;

  const commandMatch = /^([^\s]+)(?:\s+([\s\S]*))?$/.exec(source);
  if (!commandMatch) return null;

  const command = commandMatch[1];
  const normalizedCommand = command.toLowerCase();
  const remainder = commandMatch[2] ?? "";
  const description = compactText(comment || precedingComments.join(" "));

  if (normalizedCommand === "alias" || normalizedCommand === "bind") {
    const first = readArgument(remainder);
    const second = readArgument(remainder, first.nextIndex);
    const actions = splitActions(second.value).map(parseAction);
    return {
      kind: normalizedCommand,
      line: lineNumber,
      source,
      command: normalizedCommand,
      symbol: normalizedCommand === "alias" ? first.value : "",
      key: normalizedCommand === "bind" ? first.value : "",
      body: second.value,
      actions,
      description,
    };
  }

  if (normalizedCommand === "exec" || normalizedCommand === "execifexists") {
    const target = readArgument(remainder).value;
    return {
      kind: "exec",
      line: lineNumber,
      source,
      command: normalizedCommand,
      target,
      optional: normalizedCommand === "execifexists",
      actions: [parseAction(source)],
      description,
    };
  }

  if (normalizedCommand === "unbind" || normalizedCommand === "binddefaults") {
    return {
      kind: normalizedCommand,
      line: lineNumber,
      source,
      command: normalizedCommand,
      key: normalizedCommand === "unbind" ? readArgument(remainder).value : "",
      actions: [parseAction(source)],
      description,
    };
  }

  return {
    kind: "command",
    line: lineNumber,
    source,
    command,
    arguments: remainder.trim(),
    actions: splitActions(source).map(parseAction),
    description,
  };
}

function normalizeExecTarget(target) {
  if (!target) return "";
  let normalized = toPosix(target.trim().replace(/^\/+/, ""));
  if (normalized.startsWith("config/")) normalized = normalized.slice("config/".length);
  if (!normalized.toLowerCase().endsWith(".cfg")) normalized += ".cfg";
  return normalized;
}

function classifyFile(relativePath) {
  const parts = relativePath.split("/");
  const filename = parts.at(-1) ?? "";
  const basename = filename.replace(/\.cfg$/i, "");

  if (relativePath === "autoexec.cfg") {
    return { family: "root", module: "bootstrap", role: "bootstrap" };
  }
  if (parts[0] !== "srp-cfg") {
    return { family: "root", module: basename, role: "source" };
  }
  if (parts[1] === "runtime") {
    return {
      family: "runtime",
      module: "runtime",
      role: filename === "init.cfg" ? "bootstrap" : "runtime",
    };
  }
  if (parts[1] === "user") {
    return { family: "user", module: "user", role: "user" };
  }
  if (parts[1] === "helps") {
    return { family: "help", module: "help", role: "help" };
  }

  const family = parts[1] ?? "root";
  const module = parts[2] ?? basename;
  const nested = parts.slice(3, -1);
  if (filename === "runtime.cfg") return { family, module, role: "runtime" };
  if (filename === "settings.cfg") return { family, module, role: "settings" };
  if (filename === "keymap.cfg") return { family, module, role: "keymap" };
  if (filename === "with-keymap.cfg") return { family, module, role: "composition" };
  if (filename === "apply.cfg") return { family, module, role: "presetApply" };
  if (filename === "help.cfg") return { family, module, role: "help" };
  if (nested.includes("library")) return { family, module, role: "library" };
  return { family, module, role: "auxiliary" };
}

function scopeForFile(file) {
  const role = file.role;
  if (role === "bootstrap") {
    return "启动时执行；负责连接 Runtime 注册层与最后加载的用户覆盖层。";
  }
  if (role === "runtime") {
    return "Runtime 初始化时注册命令或 alias；按架构约定不主动应用个人偏好或物理键位。";
  }
  if (role === "settings") {
    return "仅在对应模块入口被调用时应用功能或模式状态；按架构约定不安装物理键位。";
  }
  if (role === "keymap") {
    return "仅在带 _keys 的入口、with-keymap 组合入口或 Preset 应用时执行；会修改物理键位。";
  }
  if (role === "composition") {
    return "组合入口；先执行 settings.cfg，再执行 keymap.cfg，同时应用状态与物理键位。";
  }
  if (role === "presetApply") {
    return "仅在选择对应 Preset 起点时执行；之后 user/custom.cfg 仍可覆盖同名设置和键位。";
  }
  if (role === "user") {
    return "用户拥有的最终覆盖层；启动时最后执行，并覆盖此前 Runtime 或 Preset 的同名设置。";
  }
  if (role === "help") {
    return "仅输出控制台帮助文本，不应改变配置状态或物理键位。";
  }
  if (role === "library") {
    return "由所属功能的 Runtime alias 按需加载的预设库文件。";
  }
  if (role === "auxiliary") {
    return "由所属模块通过 exec 或 alias 按需加载的辅助配置。";
  }
  return "SrP-CFG 配置源码；具体生效范围由其加载链决定。";
}

function collectCfgFiles(rootDir) {
  const output = [];
  const visit = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".cfg")) output.push(fullPath);
    }
  };
  visit(rootDir);
  return output;
}

function parseConfigFile(rootDir, fullPath) {
  const relativePath = toPosix(path.relative(rootDir, fullPath));
  const classification = classifyFile(relativePath);
  const rawText = fs.readFileSync(fullPath, "utf8").replace(/^\uFEFF/, "");
  const lines = rawText.split(/\r?\n/);
  const statements = [];
  let comments = [];

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (trimmed.startsWith("//")) {
      const comment = trimmed.slice(2).trim();
      if (comment) comments.push(comment);
      continue;
    }
    if (!trimmed) continue;
    const statement = parseExecutableLine(lines[index], index + 1, comments.slice(-3));
    comments = [];
    if (statement) statements.push(statement);
  }

  return {
    relativePath,
    sourcePath: `config/${relativePath}`,
    lineCount: lines.length,
    ...classification,
    scope: "",
    statements,
  };
}

function buildGraph(files) {
  const filesByPath = new Map(files.map((file) => [file.relativePath.toLowerCase(), file]));
  const aliasDefinitions = new Map();
  const bindingsByAlias = new Map();
  const fileEdges = new Map(files.map((file) => [file.relativePath, new Set()]));
  const aliasTargets = new Map();

  for (const file of files) {
    for (const statement of file.statements) {
      if (statement.kind === "alias" && statement.symbol) {
        const key = statement.symbol.toLowerCase();
        const definitions = aliasDefinitions.get(key) ?? [];
        definitions.push({ file, statement });
        aliasDefinitions.set(key, definitions);
      }
      if (statement.kind === "exec") {
        const target = normalizeExecTarget(statement.target);
        if (filesByPath.has(target.toLowerCase())) fileEdges.get(file.relativePath)?.add(target);
      }
    }
  }

  for (const definitions of aliasDefinitions.values()) {
    for (const definition of definitions) {
      const targets = new Set();
      for (const action of definition.statement.actions) {
        const command = action.command.toLowerCase();
        if (command === "exec" || command === "execifexists") {
          const target = normalizeExecTarget(readArgument(action.arguments).value);
          if (filesByPath.has(target.toLowerCase())) targets.add(target);
        }
      }
      if (targets.size) aliasTargets.set(definition.statement.symbol.toLowerCase(), targets);
    }
  }

  for (const file of files) {
    for (const statement of file.statements) {
      if (statement.kind !== "bind") continue;
      for (const action of statement.actions) {
        const aliasName = action.command.toLowerCase();
        if (!aliasDefinitions.has(aliasName)) continue;
        const bindings = bindingsByAlias.get(aliasName) ?? [];
        bindings.push({ key: statement.key, file, line: statement.line });
        bindingsByAlias.set(aliasName, bindings);
      }
    }
  }

  return { filesByPath, aliasDefinitions, bindingsByAlias, fileEdges, aliasTargets };
}

function findFilePaths(startPath, fileEdges) {
  const found = new Map([[startPath, [startPath]]]);
  const queue = [startPath];
  while (queue.length) {
    const current = queue.shift();
    const currentPath = found.get(current) ?? [current];
    for (const target of fileEdges.get(current) ?? []) {
      if (found.has(target)) continue;
      found.set(target, [...currentPath, target]);
      queue.push(target);
    }
  }
  return found;
}

function buildActivationMap(files, graph) {
  const activations = new Map(files.map((file) => [file.relativePath, new Set()]));
  const startupPaths = graph.filesByPath.has("autoexec.cfg")
    ? findFilePaths("autoexec.cfg", graph.fileEdges)
    : new Map();

  for (const [target, route] of startupPaths) {
    activations.get(target)?.add(`启动链 ${route.join(" -> ")}`);
  }

  for (const [aliasName, targets] of graph.aliasTargets) {
    const bindings = graph.bindingsByAlias.get(aliasName) ?? [];
    const bindingText = bindings.length
      ? `；按键入口 ${bindings.map((binding) => `${binding.key}@${binding.file.relativePath}:${binding.line}`).join("、")}`
      : "";
    for (const target of targets) {
      const routes = findFilePaths(target, graph.fileEdges);
      for (const [reachable, route] of routes) {
        activations.get(reachable)?.add(`别名 ${aliasName} -> ${route.join(" -> ")}${bindingText}`);
      }
    }
  }

  return new Map(
    files.map((file) => {
      const values = [...(activations.get(file.relativePath) ?? [])].sort();
      return [
        file.relativePath,
        values.length ? values.slice(0, 8).join("；") : "未发现直接启动或公共 alias 加载路径；请结合调用该文件的模块上下文判断。",
      ];
    }),
  );
}

function resolveActionRelation(action, graph) {
  const command = action.command.toLowerCase();
  const parts = [];
  if (command === "exec" || command === "execifexists") {
    const target = normalizeExecTarget(readArgument(action.arguments).value);
    if (target) parts.push(`加载文件 ${target}`);
  }
  const definitions = graph.aliasDefinitions.get(command) ?? [];
  for (const definition of definitions.slice(0, 3)) {
    parts.push(`调用 alias ${definition.statement.symbol}，定义于 ${definition.file.relativePath}:${definition.statement.line}，内容 ${definition.statement.body}`);
  }
  return parts.join("；");
}

function createRecord(fields) {
  const metadata = Object.fromEntries(
    Object.entries({ schema: VECTOR_SCHEMA, ...fields.metadata })
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [
        key,
        typeof value === "number" || typeof value === "boolean"
          ? value
          : key === "source"
            ? String(value).trim()
            : compactText(value),
      ]),
  );
  const metadataBytes = Buffer.byteLength(JSON.stringify(metadata), "utf8");
  if (metadataBytes > MAX_METADATA_BYTES) {
    throw new Error(`Vector metadata exceeds ${MAX_METADATA_BYTES} bytes for ${fields.identity}`);
  }

  const canonical = JSON.stringify({ schema: VECTOR_SCHEMA, identity: fields.identity, embeddingText: fields.embeddingText, metadata });
  const id = `${CURRENT_ID_PREFIX}${sha256(canonical).slice(0, 48)}`;
  if (Buffer.byteLength(id, "utf8") > MAX_VECTOR_ID_BYTES) {
    throw new Error(`Vector id exceeds ${MAX_VECTOR_ID_BYTES} bytes: ${id}`);
  }
  return { id, embeddingText: fields.embeddingText, metadata };
}

export function analyzeConfigDirectory(rootDir = path.resolve(CONFIG_ROOT)) {
  if (!fs.existsSync(rootDir)) throw new Error(`Config directory not found: ${rootDir}`);
  const files = collectCfgFiles(rootDir).map((fullPath) => parseConfigFile(rootDir, fullPath));
  const graph = buildGraph(files);
  const activationMap = buildActivationMap(files, graph);
  for (const file of files) file.scope = scopeForFile(file);
  return { rootDir, files, graph, activationMap };
}

export function buildKnowledgeRecords(analysis) {
  const records = [];
  const { files, graph, activationMap } = analysis;

  for (const file of files) {
    const activation = activationMap.get(file.relativePath) ?? "";
    const aliases = file.statements.filter((statement) => statement.kind === "alias").map((statement) => statement.symbol);
    const binds = file.statements.filter((statement) => statement.kind === "bind").map((statement) => `${statement.key} -> ${statement.body}`);
    const directExecs = file.statements.filter((statement) => statement.kind === "exec").map((statement) => normalizeExecTarget(statement.target));
    const commands = [...new Set(file.statements.flatMap((statement) => statement.actions.map((action) => action.command)).filter(Boolean))];
    const roleLabel = FILE_ROLE_LABELS[file.role] ?? FILE_ROLE_LABELS.source;
    const overview = [
      `SrP-CFG 文件：${file.sourcePath}`,
      `所属层级：${file.family}/${file.module}`,
      `文件职责：${roleLabel}`,
      `生效范围：${file.scope}`,
      `加载路径：${activation}`,
      directExecs.length ? `直接加载：${directExecs.join("、")}` : "",
      aliases.length ? `定义 alias：${aliases.slice(0, 30).join("、")}` : "",
      binds.length ? `定义键位：${binds.slice(0, 30).join("、")}` : "",
      commands.length ? `涉及命令：${commands.slice(0, 60).join("、")}` : "",
    ].filter(Boolean).join("\n");

    records.push(createRecord({
      identity: `file:${file.relativePath}`,
      embeddingText: overview,
      metadata: {
        kind: "file",
        sourcePath: file.sourcePath,
        line: 1,
        module: file.module,
        family: file.family,
        role: file.role,
        source: `${file.sourcePath}（${file.lineCount} 行）`,
        description: `${roleLabel}；${commands.length} 类命令，${aliases.length} 个 alias，${binds.length} 个 bind。`,
        scope: file.scope,
        activation,
      },
    }));

    for (const statement of file.statements) {
      const relationParts = [];
      if (statement.kind === "exec") {
        relationParts.push(`${statement.optional ? "可选" : "直接"}加载 ${normalizeExecTarget(statement.target)}`);
      }
      if (statement.kind === "alias") {
        relationParts.push(...statement.actions.map((action) => resolveActionRelation(action, graph)).filter(Boolean));
      }
      if (statement.kind === "bind") {
        relationParts.push(...statement.actions.map((action) => resolveActionRelation(action, graph)).filter(Boolean));
      }
      const subject = statement.symbol || statement.key || statement.command;
      const statementText = [
        `SrP-CFG 源码记录：${statement.kind}`,
        `位置：${file.sourcePath}:${statement.line}`,
        `所属层级：${file.family}/${file.module}`,
        `文件职责：${roleLabel}`,
        `源码：${statement.source}`,
        statement.description ? `源码说明：${statement.description}` : "",
        `生效范围：${file.scope}`,
        `加载路径：${activation}`,
        relationParts.length ? `关联关系：${relationParts.join("；")}` : "",
      ].filter(Boolean).join("\n");

      records.push(createRecord({
        identity: `statement:${file.relativePath}:${statement.line}:${statement.source}`,
        embeddingText: statementText,
        metadata: {
          kind: statement.kind,
          sourcePath: file.sourcePath,
          line: statement.line,
          module: file.module,
          family: file.family,
          role: file.role,
          command: statement.command,
          symbol: statement.symbol,
          key: statement.key,
          source: statement.source,
          description: statement.description,
          scope: file.scope,
          activation,
          relation: relationParts.join("；"),
          subject,
        },
      }));

      if (statement.kind !== "alias" && statement.kind !== "bind" && statement.actions.length <= 1) continue;
      for (let actionIndex = 0; actionIndex < statement.actions.length; actionIndex += 1) {
        const action = statement.actions[actionIndex];
        const relation = resolveActionRelation(action, graph);
        const owner = statement.kind === "alias" ? `alias ${statement.symbol}` : statement.kind === "bind" ? `按键 ${statement.key}` : statement.source;
        const actionText = [
          `SrP-CFG 内部动作：${action.command}`,
          `所属定义：${owner}`,
          `位置：${file.sourcePath}:${statement.line}`,
          `动作源码：${action.source}`,
          statement.description ? `源码说明：${statement.description}` : "",
          `生效范围：${file.scope}`,
          `加载路径：${activation}`,
          relation ? `关联关系：${relation}` : "",
        ].filter(Boolean).join("\n");

        records.push(createRecord({
          identity: `action:${file.relativePath}:${statement.line}:${actionIndex}:${action.source}`,
          embeddingText: actionText,
          metadata: {
            kind: `${statement.kind}_action`,
            sourcePath: file.sourcePath,
            line: statement.line,
            module: file.module,
            family: file.family,
            role: file.role,
            command: action.command,
            symbol: statement.symbol,
            key: statement.key,
            source: action.source,
            description: statement.description,
            scope: file.scope,
            activation,
            relation,
            subject: owner,
          },
        }));
      }
    }
  }

  const ids = new Set();
  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`Duplicate vector id generated: ${record.id}`);
    ids.add(record.id);
  }
  return records;
}

function getCredentials() {
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || "",
    token: process.env.CLOUDFLARE_AI_TOKEN || process.env.CF_API_TOKEN || "",
  };
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function cloudflareRequest(url, apiToken, options = {}) {
  const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          ...(options.contentType ? { "Content-Type": options.contentType } : {}),
        },
        body: options.body,
      });
      const responseText = await response.text();
      if (!response.ok) {
        if (retryableStatuses.has(response.status) && attempt < 2) {
          await sleep(500 * 2 ** attempt);
          continue;
        }
        throw new Error(`Cloudflare API HTTP ${response.status}: ${responseText}`);
      }
      const payload = responseText ? JSON.parse(responseText) : {};
      if (payload.success === false) throw new Error(`Cloudflare API error: ${responseText}`);
      return payload;
    } catch (error) {
      if (attempt >= 2) throw error;
      await sleep(500 * 2 ** attempt);
    }
  }
  throw new Error("Cloudflare request failed after retries");
}

async function listVectorIds(accountId, apiToken, indexName) {
  const ids = [];
  let cursor = "";
  do {
    const url = new URL(`https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${indexName}/list`);
    url.searchParams.set("count", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);
    const payload = await cloudflareRequest(url, apiToken);
    ids.push(...(payload.result?.vectors ?? []).map((vector) => vector.id));
    cursor = payload.result?.isTruncated ? payload.result?.nextCursor ?? "" : "";
  } while (cursor);
  return ids;
}

async function createEmbeddings(accountId, apiToken, texts) {
  const payload = await cloudflareRequest(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${EMBEDDING_MODEL}`,
    apiToken,
    {
      method: "POST",
      contentType: "application/json",
      body: JSON.stringify({ text: texts }),
    },
  );
  const embeddings = payload.result?.data;
  if (!Array.isArray(embeddings) || embeddings.length !== texts.length) {
    throw new Error(`Embedding response count mismatch: expected ${texts.length}, received ${embeddings?.length ?? 0}`);
  }
  return embeddings;
}

async function upsertVectors(accountId, apiToken, indexName, vectors) {
  const body = `${vectors.map((vector) => JSON.stringify(vector)).join("\n")}\n`;
  await cloudflareRequest(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${indexName}/upsert?unparsable-behavior=error`,
    apiToken,
    { method: "POST", contentType: "application/x-ndjson", body },
  );
}

async function deleteVectors(accountId, apiToken, indexName, ids) {
  await cloudflareRequest(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${indexName}/delete_by_ids`,
    apiToken,
    { method: "POST", contentType: "application/json", body: JSON.stringify({ ids }) },
  );
}

export async function syncKnowledgeIndex(records, options = {}) {
  const { accountId, token } = getCredentials();
  const indexName = options.indexName || process.env.SRP_CONFIG_INDEX_NAME || DEFAULT_INDEX_NAME;
  if (!accountId || !token) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_AI_TOKEN are required for synchronization");
  }

  const existingIds = new Set(await listVectorIds(accountId, token, indexName));
  const currentIds = new Set(records.map((record) => record.id));
  const missing = records.filter((record) => !existingIds.has(record.id));
  const stale = [...existingIds].filter(
    (id) => (id.startsWith(CURRENT_ID_PREFIX) || id.startsWith(LEGACY_ID_PREFIX)) && !currentIds.has(id),
  );

  console.log(`Index '${indexName}': ${records.length} current, ${missing.length} new/changed, ${stale.length} stale.`);

  for (let start = 0; start < missing.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = missing.slice(start, start + EMBEDDING_BATCH_SIZE);
    const embeddings = await createEmbeddings(accountId, token, batch.map((record) => record.embeddingText));
    await upsertVectors(
      accountId,
      token,
      indexName,
      batch.map((record, index) => ({ id: record.id, values: embeddings[index], metadata: record.metadata })),
    );
    console.log(`Upserted ${Math.min(start + batch.length, missing.length)}/${missing.length} records.`);
  }

  for (let start = 0; start < stale.length; start += DELETE_BATCH_SIZE) {
    const batch = stale.slice(start, start + DELETE_BATCH_SIZE);
    await deleteVectors(accountId, token, indexName, batch);
    console.log(`Deleted ${Math.min(start + batch.length, stale.length)}/${stale.length} stale records.`);
  }

  return { total: records.length, upserted: missing.length, deleted: stale.length };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const analysis = analyzeConfigDirectory(path.resolve(CONFIG_ROOT));
  const records = buildKnowledgeRecords(analysis);
  const countsByKind = Object.fromEntries(
    [...new Set(records.map((record) => record.metadata.kind))]
      .sort()
      .map((kind) => [kind, records.filter((record) => record.metadata.kind === kind).length]),
  );

  console.log(`Analyzed ${analysis.files.length} CFG files and generated ${records.length} knowledge records.`);
  console.log(JSON.stringify(countsByKind, null, 2));
  if (dryRun) return;
  await syncKnowledgeIndex(records);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
