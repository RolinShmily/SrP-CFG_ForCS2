import fs from "fs";
import path from "path";
import crypto from "crypto";

const EMBEDDING_MODEL = "@cf/baai/bge-m3";
const INDEX_NAME = "srp-config-index";
const BATCH_SIZE = 50;
const CACHE_PATH = ".github/scripts/vectorize_config_code_cache.json";
const CONFIG_DIR = "config";

function getCredentials() {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
  const token =
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CLOUDFLARE_AI_TOKEN ||
    process.env.CF_API_TOKEN ||
    process.env.GITHUB_TOKEN;
  return { account, token };
}

function computeHash(text) {
  return crypto.createHash("md5").update(text).digest("hex");
}

// Recursively find all .cfg files in a directory
function findCfgFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findCfgFiles(res, files);
    } else if (entry.isFile() && entry.name.endsWith(".cfg")) {
      files.push(res);
    }
  }
  return files;
}

// Detect module information from file path
function getModuleInfo(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  let type = "root";
  let moduleName = "root";

  if (normalized.includes("srp-cfg/features/")) {
    type = "feature";
    const parts = normalized.split("srp-cfg/features/");
    moduleName = parts[1].split("/")[0];
  } else if (normalized.includes("srp-cfg/modes/")) {
    type = "mode";
    const parts = normalized.split("srp-cfg/modes/");
    moduleName = parts[1].split("/")[0];
  } else if (normalized.includes("srp-cfg/presets/")) {
    type = "preset";
    const parts = normalized.split("srp-cfg/presets/");
    moduleName = parts[1].split("/")[0];
  } else if (normalized.includes("srp-cfg/runtime/")) {
    type = "runtime";
    moduleName = "runtime";
  }

  return { type, moduleName };
}

function parseCfgFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);
  const { type, moduleName } = getModuleInfo(filePath);
  const relativePath = path.relative(".", filePath).replace(/\\/g, "/");

  const chunks = [];
  let currentComments = [];
  let lineIndex = 0;

  // 1. Add file/architectural overview chunk
  const fileSummaryText = `文件路径: ${relativePath} | 所属模块/预设: ${moduleName} (${type}) | 作用: 该配置文件是 SrP-CFG 配置包中 ${moduleName} 模块的组成部分。`;
  chunks.push({
    id: `cfg:file:${computeHash(relativePath)}`,
    text: fileSummaryText,
    metadata: {
      n: `${moduleName} 配置文件`,
      cn: `[配置文件] 位于路径 ${relativePath}。定义了 ${moduleName} 模块的相关配置指令。`,
      en: `${moduleName} (${type}) config file`,
      d: relativePath,
      t: "cfg_file",
    },
  });

  for (const rawLine of lines) {
    lineIndex++;
    const line = rawLine.trim();
    if (!line) continue;

    // Check if it's a comment
    if (line.startsWith("//")) {
      const cleanComment = line.replace(/^\/\/+\s*/, "").trim();
      if (cleanComment) {
        currentComments.push(cleanComment);
      }
      continue;
    }

    const commentCtx = currentComments.join("，");
    currentComments = []; // Reset comments for the next command

    // Match bind command
    // e.g. bind "j" "srp_knife"
    const bindMatch = line.match(/^bind\s+["']?([^"\s]+)["']?\s+["']?([^"']+)["']?/i);
    if (bindMatch) {
      const key = bindMatch[1];
      const targetCmd = bindMatch[2];
      const chunkText = `按键绑定: bind "${key}" "${targetCmd}" | 物理按键: ${key} | 触发指令: ${targetCmd} | 文件路径: ${relativePath} | 所属模块: ${moduleName} | 说明: ${commentCtx || "无说明"}`;
      chunks.push({
        id: `cfg:bind:${computeHash(`${relativePath}:${lineIndex}:${line}`)}`,
        text: chunkText,
        metadata: {
          n: `按键绑定 [${key}]`,
          cn: `按下 [${key}] 键将触发指令/别名 \`${targetCmd}\`。定义于 \`${relativePath}\`。${commentCtx ? `说明: ${commentCtx}` : ""}`,
          en: `Bind key ${key} to ${targetCmd} in ${moduleName}`,
          d: relativePath,
          t: "cfg_bind",
        },
      });
      continue;
    }

    // Match alias command
    // e.g. alias "srp_knife" "exec features/knife/settings"
    const aliasMatch = line.match(/^alias\s+["']?([^"\s]+)["']?\s+["']?([^"']+)["']?/i);
    if (aliasMatch) {
      const aliasName = aliasMatch[1];
      const aliasAction = aliasMatch[2];
      const chunkText = `别名注册: alias "${aliasName}" "${aliasAction}" | 别名名称: ${aliasName} | 执行指令: ${aliasAction} | 文件路径: ${relativePath} | 所属模块: ${moduleName} | 说明: ${commentCtx || "无说明"}`;
      chunks.push({
        id: `cfg:alias:${computeHash(`${relativePath}:${lineIndex}:${line}`)}`,
        text: chunkText,
        metadata: {
          n: `别名注册 [${aliasName}]`,
          cn: `注册了别名指令 \`${aliasName}\`，执行动作为 \`${aliasAction}\`。定义于 \`${relativePath}\`。${commentCtx ? `说明: ${commentCtx}` : ""}`,
          en: `Alias ${aliasName} defined as ${aliasAction} in ${moduleName}`,
          d: relativePath,
          t: "cfg_alias",
        },
      });
      continue;
    }

    // Normal command line
    const chunkText = `配置指令: ${line} | 文件路径: ${relativePath} | 所属模块: ${moduleName} | 注释说明: ${commentCtx || "无说明"}`;
    chunks.push({
      id: `cfg:cmd:${computeHash(`${relativePath}:${lineIndex}:${line}`)}`,
      text: chunkText,
      metadata: {
        n: `${moduleName} 模块指令`,
        cn: `执行指令: \`${line}\`。定义于 \`${relativePath}\`。${commentCtx ? `注释说明: ${commentCtx}` : ""}`,
        en: `Command line in ${moduleName} module`,
        d: relativePath,
        t: "cfg_cmd",
      },
    });
  }

  return chunks;
}

async function cfRequest(url, token, payload, method = "POST", isJson = true) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  let body;
  if (isJson) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(payload);
  } else {
    headers["Content-Type"] = "application/x-ndjson";
    body = payload;
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status} from ${url}: ${errorText}`);
  }

  return await response.json();
}

async function getEmbeddings(account, token, texts) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${EMBEDDING_MODEL}`;
  const res = await cfRequest(url, token, { text: texts });
  if (!res.success) {
    throw new Error(`Embedding API error: ${JSON.stringify(res)}`);
  }
  return res.result.data;
}

async function upsertVectors(account, token, vectors) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/vectorize/v2/indexes/${INDEX_NAME}/upsert`;
  const ndjsonLines = vectors.map((v) => JSON.stringify(v)).join("\n") + "\n";
  const res = await cfRequest(url, token, ndjsonLines, "POST", false);
  if (!res.success) {
    throw new Error(`Vectorize upsert error: ${JSON.stringify(res)}`);
  }
  return res;
}

async function main() {
  const { account, token } = getCredentials();
  if (!account || !token) {
    console.log("Missing Cloudflare credentials. Skipping config code Vectorize sync.");
    return;
  }

  if (!fs.existsSync(CONFIG_DIR)) {
    console.log(`Config directory not found: ${CONFIG_DIR}`);
    return;
  }

  // 1. Find and parse all .cfg files
  const cfgFiles = findCfgFiles(CONFIG_DIR);
  console.log(`Found ${cfgFiles.length} config files under /config/`);
  
  const allChunks = [];
  for (const file of cfgFiles) {
    try {
      const chunks = parseCfgFile(file);
      allChunks.push(...chunks);
    } catch (e) {
      console.error(`Failed to parse ${file}:`, e);
    }
  }

  console.log(`Total config code chunks generated: ${allChunks.length}`);

  // 2. Load cache
  let cache = {};
  if (fs.existsSync(CACHE_PATH)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    } catch (e) {
      console.log("Failed to parse cache, starting fresh.");
    }
  }

  // 3. Identify stale chunks
  const staleChunks = [];
  for (const chunk of allChunks) {
    const hash = computeHash(chunk.text);
    if (cache[chunk.id] !== hash) {
      staleChunks.push({ chunk, hash });
    }
  }

  const staleCount = staleChunks.length;
  console.log(`Need sync: ${staleCount} | Cached: ${allChunks.length - staleCount}`);

  if (staleCount === 0) {
    console.log("All config code vectors are up to date. Nothing to sync.");
    return;
  }

  // 4. Batch embed and upsert
  console.log(`Syncing ${staleCount} chunks to Vectorize index '${INDEX_NAME}'...`);
  let successCount = 0;

  for (let i = 0; i < staleCount; i += BATCH_SIZE) {
    const batch = staleChunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((b) => b.chunk.text);

    try {
      const embeddings = await getEmbeddings(account, token, texts);
      
      const vectors = batch.map((b, idx) => ({
        id: b.chunk.id,
        values: embeddings[idx],
        metadata: b.chunk.metadata,
      }));

      await upsertVectors(account, token, vectors);

      // Update cache
      batch.forEach((b) => {
        cache[b.chunk.id] = b.hash;
      });

      successCount += batch.length;
      console.log(`  [${i + batch.length}/${staleCount}] Batch synced (${successCount} total)`);
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (e) {
      console.error(`  [${i}/${staleCount}] ERROR:`, e.message);
    }
  }

  // 5. Save cache
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  console.log(`Config code Vectorize sync complete. Cache saved to ${CACHE_PATH}`);
}

main().catch(console.error);
