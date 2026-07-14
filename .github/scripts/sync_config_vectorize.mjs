import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

const EMBEDDING_MODEL = "@cf/baai/bge-m3";
const DEFAULT_INDEX_NAME = "srp-config-index";
const CONFIG_ROOT = "config";
const KNOWLEDGE_ROOT = "app/website/src/data/config-knowledge";
const EMBEDDING_BATCH_SIZE = 50;
const DELETE_BATCH_SIZE = 100;
const VECTOR_SCHEMA = "srp-config-v3";
const CURRENT_ID_PREFIX = "srpcfg:v3:";
const LEGACY_ID_PREFIXES = ["srpcfg:", "cfg:"];
const MAX_METADATA_BYTES = 10 * 1024;
const MAX_VECTOR_ID_BYTES = 64;
const GENERATED_COLLECTIONS = ["files", "entries", "aliases", "bindings", "settings"];
const COLLECTION_TYPES = {
  files: "file",
  entries: "entry",
  aliases: "alias",
  bindings: "binding",
  settings: "setting",
};

const FILE_ROLE_LABELS = {
  bootstrap: "启动入口",
  runtime: "运行时注册",
  settings: "功能设置",
  keymap: "物理键位",
  composition: "设置与键位组合入口",
  preset_apply: "Preset 应用入口",
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

  const family = { features: "feature", modes: "mode", presets: "preset" }[parts[1]] ?? parts[1] ?? "root";
  const module = parts[2] ?? basename;
  const nested = parts.slice(3, -1);
  if (filename === "runtime.cfg") return { family, module, role: "runtime" };
  if (filename === "settings.cfg") return { family, module, role: "settings" };
  if (filename === "keymap.cfg") return { family, module, role: "keymap" };
  if (filename === "with-keymap.cfg") return { family, module, role: "composition" };
  if (filename === "apply.cfg") return { family, module, role: "preset_apply" };
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
  if (role === "preset_apply") {
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
  const rawText = fs.readFileSync(fullPath, "utf8").replace(/^\uFEFF/, "").replaceAll("\r\n", "\n");
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
    contentHash: sha256(rawText),
    firstLine: lines[0] ?? "",
    lines,
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

function structuredRecord(record) {
  return {
    id: record.id,
    embeddingText: record.embeddingText,
    metadata: record.metadata,
  };
}

function generatedCuration() {
  return { status: "generated", source: "generator" };
}

function fileEntityId(sourcePath) {
  return `file:${sourcePath}`;
}

function statementIdentity(statement) {
  if (statement.kind === "alias") return statement.symbol;
  if (statement.kind === "bind" || statement.kind === "unbind") return statement.key;
  if (statement.kind === "exec") return normalizeExecTarget(statement.target);
  return statement.command;
}

function entityLocator(sourcePath, statement, ordinal, includeKind = true) {
  const kind = includeKind ? `${statement.kind}:` : "";
  const subject = encodeURIComponent(statementIdentity(statement).toLowerCase() || "entry");
  const suffix = ordinal > 1 ? `:${ordinal}` : "";
  return `${sourcePath}#${kind}${subject}${suffix}`;
}

function entryEntityId(sourcePath, statement, ordinal) {
  return `entry:${entityLocator(sourcePath, statement, ordinal)}`;
}

function sourceRef(sourcePath, line) {
  return `${sourcePath}:${line}`;
}

function cleanSourceObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined));
}

function actionsForSource(statement) {
  return statement.actions.map((action) => ({
    command: action.command,
    arguments: action.arguments,
    source: action.source,
  }));
}

function relationForStatement(statement, graph) {
  const relations = [];
  if (statement.kind === "exec") {
    relations.push(`${statement.optional ? "可选" : "直接"}加载 ${normalizeExecTarget(statement.target)}`);
  }
  if (statement.kind === "alias" || statement.kind === "bind") {
    relations.push(...statement.actions.map((action) => resolveActionRelation(action, graph)).filter(Boolean));
  }
  return relations.join("；");
}

function statementSource(file, statement, ordinal) {
  return cleanSourceObject({
    ref: sourceRef(file.sourcePath, statement.line),
    path: file.sourcePath,
    line: statement.line,
    text: statement.source,
    fileId: fileEntityId(file.sourcePath),
    kind: statement.kind,
    command: statement.command,
    symbol: statement.symbol ?? "",
    key: statement.key ?? "",
    body: statement.body ?? "",
    target: statement.target ? normalizeExecTarget(statement.target) : "",
    arguments: statement.arguments ?? "",
    optional: statement.optional ?? false,
    ordinal,
    description: statement.description ?? "",
    actions: actionsForSource(statement),
    area: file.family,
    module: file.module,
    role: file.role,
  });
}

function semanticForStatement(file, statement, relation) {
  const subject = statement.symbol || statement.key || statement.command;
  return {
    title: `${subject} · ${statement.kind}`,
    summary: statement.description || `${statement.source}，定义于 ${file.sourcePath}:${statement.line}。`,
    tags: [...new Set([statement.kind, file.family, file.module, file.role])],
    keywords: [...new Set([statement.symbol, statement.key, statement.command].filter(Boolean))],
    scope: file.scope,
    activation: file.activation,
    relation,
  };
}

export function analyzeConfigDirectory(rootDir = path.resolve(CONFIG_ROOT)) {
  if (!fs.existsSync(rootDir)) throw new Error(`Config directory not found: ${rootDir}`);
  const files = collectCfgFiles(rootDir).map((fullPath) => parseConfigFile(rootDir, fullPath));
  const graph = buildGraph(files);
  const activationMap = buildActivationMap(files, graph);
  for (const file of files) {
    file.scope = scopeForFile(file);
    file.activation = activationMap.get(file.relativePath) ?? "";
  }
  return { rootDir, files, graph, activationMap };
}

export function generateCuratedCollections(analysis) {
  const collections = Object.fromEntries(GENERATED_COLLECTIONS.map((name) => [name, []]));

  for (const file of analysis.files) {
    const aliases = file.statements.filter((statement) => statement.kind === "alias").map((statement) => statement.symbol);
    const bindings = file.statements.filter((statement) => statement.kind === "bind").map((statement) => `${statement.key} -> ${statement.body}`);
    const commands = [...new Set(file.statements.flatMap((statement) => statement.actions.map((action) => action.command)).filter(Boolean))];
    const roleLabel = FILE_ROLE_LABELS[file.role] ?? FILE_ROLE_LABELS.source;
    const fileId = fileEntityId(file.sourcePath);
    collections.files.push({
      id: fileId,
      type: "file",
      source: {
        ref: sourceRef(file.sourcePath, 1),
        path: file.sourcePath,
        line: 1,
        text: file.firstLine,
        lineCount: file.lineCount,
        sha256: file.contentHash,
        area: file.family,
        module: file.module,
        role: file.role,
      },
      semantic: {
        title: file.sourcePath,
        summary: `${roleLabel}；${commands.length} 类命令，${aliases.length} 个 alias，${bindings.length} 个 bind。`,
        tags: [...new Set([file.family, file.module, file.role])],
        keywords: [...new Set([...commands, ...aliases].slice(0, 80))],
        scope: file.scope,
        activation: file.activation,
      },
      curation: generatedCuration(),
    });

    const statementOrdinals = new Map();
    for (const statement of file.statements) {
      const ordinalKey = `${statement.kind}:${statementIdentity(statement).toLowerCase()}`;
      const ordinal = (statementOrdinals.get(ordinalKey) ?? 0) + 1;
      statementOrdinals.set(ordinalKey, ordinal);
      const entryId = entryEntityId(file.sourcePath, statement, ordinal);
      const relation = relationForStatement(statement, analysis.graph);
      const source = statementSource(file, statement, ordinal);
      collections.entries.push({
        id: entryId,
        type: "entry",
        source,
        semantic: semanticForStatement(file, statement, relation),
        curation: generatedCuration(),
      });

      if (statement.kind === "alias") {
        collections.aliases.push({
          id: `alias:${entityLocator(file.sourcePath, statement, ordinal, false)}`,
          type: "alias",
          source: {
            ...source,
            entryId,
            name: statement.symbol,
          },
          semantic: {
            ...semanticForStatement(file, statement, relation),
            title: `alias ${statement.symbol}`,
          },
          curation: generatedCuration(),
        });
      }

      if (statement.kind === "bind") {
        collections.bindings.push({
          id: `binding:${entityLocator(file.sourcePath, statement, ordinal, false)}`,
          type: "binding",
          source: {
            ...source,
            entryId,
            name: statement.key,
          },
          semantic: {
            ...semanticForStatement(file, statement, relation),
            title: `${statement.key} -> ${statement.body}`,
          },
          curation: generatedCuration(),
        });
      }

      if (statement.kind === "command") {
        collections.settings.push({
          id: `setting:${entityLocator(file.sourcePath, statement, ordinal, false)}`,
          type: "setting",
          source: {
            ...source,
            entryId,
            name: statement.command,
            value: statement.arguments,
          },
          semantic: {
            ...semanticForStatement(file, statement, relation),
            title: `${statement.command} ${statement.arguments}`.trim(),
          },
          curation: generatedCuration(),
        });
      }
    }
  }

  for (const name of GENERATED_COLLECTIONS) {
    collections[name].sort((left, right) => left.id.localeCompare(right.id));
  }
  return collections;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read JSON ${filePath}: ${error instanceof Error ? error.message : error}`);
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function loadCuratedKnowledge(knowledgeDir = path.resolve(KNOWLEDGE_ROOT)) {
  const manifest = readJson(path.join(knowledgeDir, "manifest.json"));
  const concepts = readJson(path.join(knowledgeDir, "concepts.json"));
  const collections = Object.fromEntries(
    GENERATED_COLLECTIONS.map((name) => [name, readJson(path.join(knowledgeDir, `${name}.json`))]),
  );
  return {
    knowledgeDir,
    manifest,
    concepts,
    collections,
    entities: [...GENERATED_COLLECTIONS.flatMap((name) => collections[name]), ...concepts],
  };
}

function mergeGeneratedEntity(generated, existing) {
  if (!existing) return generated;
  const preserved = Object.fromEntries(
    Object.entries(existing).filter(([key]) => !["id", "type", "source"].includes(key)),
  );
  return {
    ...generated,
    ...preserved,
    id: generated.id,
    type: generated.type,
    source: generated.source,
  };
}

export function updateCuratedKnowledge(analysis, knowledgeDir = path.resolve(KNOWLEDGE_ROOT)) {
  const generated = generateCuratedCollections(analysis);
  for (const name of GENERATED_COLLECTIONS) {
    const filePath = path.join(knowledgeDir, `${name}.json`);
    const existing = fs.existsSync(filePath) ? readJson(filePath) : [];
    if (!Array.isArray(existing)) throw new Error(`${filePath} must contain a JSON array`);
    const existingById = new Map(existing.map((entity) => [entity.id, entity]));
    const merged = generated[name].map((entity) => mergeGeneratedEntity(entity, existingById.get(entity.id)));
    writeJson(filePath, merged);
  }
  return loadCuratedKnowledge(knowledgeDir);
}

function parseEvidenceRef(ref) {
  const match = /^(config\/.+\.cfg):(\d+)$/.exec(ref);
  if (!match) return null;
  return { path: match[1], line: Number(match[2]) };
}

function assertArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be a JSON array`);
}

export function validateCuratedKnowledge(analysis, knowledge = loadCuratedKnowledge()) {
  const errors = [];
  const { manifest, collections, concepts } = knowledge;
  if (manifest.schema !== "srp-config-knowledge-v3") {
    errors.push(`manifest.schema must be srp-config-knowledge-v3, received ${manifest.schema}`);
  }
  const entityTypes = new Set(manifest.entityTypes ?? []);
  const areas = new Set(manifest.areas ?? []);
  const fileRoles = new Set(manifest.fileRoles ?? []);
  const statuses = new Set(manifest.curationStatuses ?? []);
  const productionStatuses = new Set(manifest.productionStatuses ?? []);
  if (![...productionStatuses].every((status) => statuses.has(status))) {
    errors.push("manifest.productionStatuses must be a subset of curationStatuses");
  }

  const expected = generateCuratedCollections(analysis);
  const allEntities = [];
  const ids = new Set();
  for (const name of GENERATED_COLLECTIONS) {
    try {
      assertArray(collections[name], `${name}.json`);
    } catch (error) {
      errors.push(error.message);
      continue;
    }
    const expectedById = new Map(expected[name].map((entity) => [entity.id, entity]));
    const actualById = new Map(collections[name].map((entity) => [entity.id, entity]));
    for (const id of expectedById.keys()) {
      if (!actualById.has(id)) errors.push(`${name}.json is missing ${id}`);
    }
    for (const id of actualById.keys()) {
      if (!expectedById.has(id)) errors.push(`${name}.json contains stale entity ${id}`);
    }
    for (const entity of collections[name]) {
      allEntities.push(entity);
      if (!entity || typeof entity !== "object") {
        errors.push(`${name}.json contains a non-object entity`);
        continue;
      }
      if (ids.has(entity.id)) errors.push(`Duplicate entity id ${entity.id}`);
      ids.add(entity.id);
      if (entity.type !== COLLECTION_TYPES[name]) errors.push(`${entity.id} must have type ${COLLECTION_TYPES[name]}`);
      if (!entityTypes.has(entity.type)) errors.push(`${entity.id} uses unknown entity type ${entity.type}`);
      if (!statuses.has(entity.curation?.status)) errors.push(`${entity.id} uses unknown curation status ${entity.curation?.status}`);
      const expectedEntity = expectedById.get(entity.id);
      if (expectedEntity && !isDeepStrictEqual(entity.source, expectedEntity.source)) {
        errors.push(`${entity.id} has source-owned fields that differ from ${entity.source?.ref ?? "config source"}`);
      }
    }
  }

  const filesById = new Map((collections.files ?? []).map((entity) => [entity.id, entity]));
  const entriesById = new Map((collections.entries ?? []).map((entity) => [entity.id, entity]));
  for (const file of collections.files ?? []) {
    if (!areas.has(file.source?.area)) errors.push(`${file.id} uses unknown area ${file.source?.area}`);
    if (!fileRoles.has(file.source?.role)) errors.push(`${file.id} uses unknown file role ${file.source?.role}`);
  }
  for (const entry of collections.entries ?? []) {
    if (!filesById.has(entry.source?.fileId)) errors.push(`${entry.id} references missing file ${entry.source?.fileId}`);
  }
  for (const name of ["aliases", "bindings", "settings"]) {
    for (const entity of collections[name] ?? []) {
      if (!filesById.has(entity.source?.fileId)) errors.push(`${entity.id} references missing file ${entity.source?.fileId}`);
      if (!entriesById.has(entity.source?.entryId)) errors.push(`${entity.id} references missing entry ${entity.source?.entryId}`);
    }
  }

  assertArray(concepts, "concepts.json");
  const sourceFiles = new Map(analysis.files.map((file) => [file.sourcePath, file]));
  for (const concept of concepts) {
    allEntities.push(concept);
    if (ids.has(concept.id)) errors.push(`Duplicate entity id ${concept.id}`);
    ids.add(concept.id);
    if (concept.type !== "concept" || !entityTypes.has(concept.type)) errors.push(`${concept.id} must have type concept`);
    if (!statuses.has(concept.curation?.status)) errors.push(`${concept.id} uses unknown curation status ${concept.curation?.status}`);
    if (!Array.isArray(concept.claims) || !concept.claims.length) errors.push(`${concept.id} must contain claims`);
    for (const claim of concept.claims ?? []) {
      for (const ref of claim.evidence ?? []) {
        const parsed = parseEvidenceRef(ref);
        const file = parsed ? sourceFiles.get(parsed.path) : null;
        if (!parsed || !file || parsed.line < 1 || parsed.line > file.lineCount) {
          errors.push(`${concept.id} has invalid evidence reference ${ref}`);
        }
      }
    }
  }

  if (errors.length) {
    const preview = errors.slice(0, 20).map((error) => `- ${error}`).join("\n");
    const remainder = errors.length > 20 ? `\n- ...and ${errors.length - 20} more` : "";
    throw new Error(`Curated knowledge validation failed:\n${preview}${remainder}\nRun: node .github/scripts/sync_config_vectorize.mjs --update`);
  }
  return { ...knowledge, entities: allEntities };
}

function semanticFields(entity) {
  return entity.semantic ?? entity;
}

function evidenceForEntity(entity, analysis) {
  if (entity.type !== "concept") {
    return {
      refs: [entity.source.ref],
      paths: [entity.source.path],
      lines: [entity.source.line],
      texts: [entity.source.text],
    };
  }
  const refs = [...new Set(entity.claims.flatMap((claim) => claim.evidence ?? []))];
  const filesByPath = new Map(analysis.files.map((file) => [file.sourcePath, file]));
  const resolved = refs.map((ref) => {
    const parsed = parseEvidenceRef(ref);
    const file = parsed ? filesByPath.get(parsed.path) : null;
    return { ref, path: parsed?.path ?? "", line: parsed?.line ?? 0, text: file?.lines[(parsed?.line ?? 1) - 1]?.trim() ?? "" };
  });
  return {
    refs,
    paths: resolved.map((item) => item.path),
    lines: resolved.map((item) => item.line),
    texts: resolved.map((item) => item.text),
  };
}

export function buildKnowledgeRecords(knowledge, analysis) {
  const productionStatuses = new Set(knowledge.manifest.productionStatuses);
  const records = [];
  for (const entity of knowledge.entities) {
    const status = entity.curation.status;
    if (!productionStatuses.has(status)) continue;
    const semantic = semanticFields(entity);
    const evidence = evidenceForEntity(entity, analysis);
    const source = entity.source ?? {};
    const title = semantic.title ?? entity.id;
    const summary = semantic.summary ?? "";
    const tags = Array.isArray(semantic.tags) ? semantic.tags : [];
    const keywords = Array.isArray(semantic.keywords) ? semantic.keywords : [];
    const aliases = Array.isArray(semantic.aliases) ? semantic.aliases : [];
    const claims = entity.type === "concept" ? entity.claims.map((claim) => claim.text).join("；") : "";
    const embeddingText = [
      title,
      summary,
      claims,
      tags.length ? `标签：${tags.join("、")}` : "",
      keywords.length ? `关键词：${keywords.join("、")}` : "",
      `实体：${entity.id} (${entity.type})`,
      `来源：${evidence.refs.join("；")}`,
      `源码：${evidence.texts.join("；")}`,
      semantic.scope ? `范围：${semantic.scope}` : "",
      semantic.activation ? `加载：${semantic.activation}` : "",
      semantic.relation ? `关联：${semantic.relation}` : "",
    ].filter(Boolean).join("\n");
    records.push(createRecord({
      identity: entity.id,
      embeddingText,
      metadata: {
        entityId: entity.id,
        entityType: entity.type,
        status,
        sourcePath: evidence.paths[0],
        sourceLine: evidence.lines[0],
        sourceRef: evidence.refs.join(" | "),
        source: evidence.texts.join(" | "),
        title,
        summary,
        tags: tags.join(" "),
        keywords: keywords.join(" "),
        name: source.name || source.symbol || source.command,
        aliases: aliases.join(" "),
        key: source.key,
        cvar: entity.type === "setting" ? source.name : "",
        target: source.target,
        body: source.body || source.value,
        area: source.area,
        module: source.module,
        role: source.role,
        entryId: source.entryId,
        fileId: source.fileId,
      },
    }));
  }

  const ids = new Set();
  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`Duplicate vector id generated: ${record.id}`);
    ids.add(record.id);
  }
  return records;
}

export function buildKnowledgeDataset(analysis, records) {
  const countsByType = Object.fromEntries(
    [...new Set(records.map((record) => record.metadata.entityType))]
      .sort()
      .map((type) => [type, records.filter((record) => record.metadata.entityType === type).length]),
  );
  const canonicalRecords = records.map(structuredRecord).sort((left, right) => left.id.localeCompare(right.id));
  return {
    schema: VECTOR_SCHEMA,
    knowledgeSchema: "srp-config-knowledge-v3",
    sourceRoot: "config",
    embeddingModel: EMBEDDING_MODEL,
    sourceFiles: analysis.files.length,
    recordCount: canonicalRecords.length,
    countsByType,
    records: canonicalRecords,
  };
}

export function writeKnowledgeDataset(outputPath, dataset) {
  const resolved = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
  return resolved;
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
    (id) => LEGACY_ID_PREFIXES.some((prefix) => id.startsWith(prefix)) && !currentIds.has(id),
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
  const update = process.argv.includes("--update");
  const validateOnly = process.argv.includes("--validate");
  const buildOnly = process.argv.includes("--build") || process.argv.includes("--dry-run");
  const outputIndex = process.argv.indexOf("--output");
  const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : "";
  if (outputIndex >= 0 && !outputPath) throw new Error("--output requires a JSON path");
  const analysis = analyzeConfigDirectory(path.resolve(CONFIG_ROOT));
  if (update) {
    updateCuratedKnowledge(analysis, path.resolve(KNOWLEDGE_ROOT));
    console.log(`Updated curated source entities from ${analysis.files.length} CFG files.`);
  }
  const knowledge = validateCuratedKnowledge(analysis, loadCuratedKnowledge(path.resolve(KNOWLEDGE_ROOT)));
  console.log(`Validated ${knowledge.entities.length} local knowledge entities.`);
  if (validateOnly && !buildOnly && !outputPath) return;

  const records = buildKnowledgeRecords(knowledge, analysis);
  const dataset = buildKnowledgeDataset(analysis, records);
  console.log(`Built ${records.length} production ${VECTOR_SCHEMA} vector records.`);
  console.log(JSON.stringify(dataset.countsByType, null, 2));
  if (outputPath) console.log(`Wrote structured knowledge dataset to ${writeKnowledgeDataset(outputPath, dataset)}`);
  if (update || buildOnly) return;
  await syncKnowledgeIndex(records);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
