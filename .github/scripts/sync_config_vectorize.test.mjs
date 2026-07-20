import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  analyzeConfigDirectory,
  buildKnowledgeDataset,
  buildKnowledgeRecords,
  generateCuratedCollections,
  loadCuratedKnowledge,
  parseExecutableLine,
  splitActions,
  splitInlineComment,
  syncKnowledgeIndex,
  updateCuratedKnowledge,
  validateCuratedKnowledge,
} from "./sync_config_vectorize.mjs";

const CONFIG_ROOT = path.resolve("config");
const KNOWLEDGE_ROOT = path.resolve("app/website/src/data/config-knowledge");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "srp-config-knowledge-"));
  const configRoot = path.join(root, "config");
  const knowledgeRoot = path.join(root, "knowledge");
  fs.mkdirSync(path.join(configRoot, "srp-cfg", "runtime"), { recursive: true });
  fs.mkdirSync(path.join(configRoot, "srp-cfg", "features", "knife"), { recursive: true });
  fs.writeFileSync(
    path.join(configRoot, "autoexec.cfg"),
    "exec srp-cfg/runtime/commands.cfg // load commands\n",
    "utf8",
  );
  fs.writeFileSync(
    path.join(configRoot, "srp-cfg", "runtime", "commands.cfg"),
    [
      'alias "srp_knife" "exec srp-cfg/features/knife/settings.cfg" // knife entry',
      'bind "j" "srp_knife" // knife key',
      "sv_cheats 1 // practice setting",
      "",
    ].join("\n"),
    "utf8",
  );
  fs.writeFileSync(
    path.join(configRoot, "srp-cfg", "features", "knife", "settings.cfg"),
    "echo knife ready\n",
    "utf8",
  );
  writeJson(path.join(knowledgeRoot, "manifest.json"), JSON.parse(fs.readFileSync(path.join(KNOWLEDGE_ROOT, "manifest.json"), "utf8")));
  writeJson(path.join(knowledgeRoot, "concepts.json"), []);
  return { root, configRoot, knowledgeRoot };
}

function withFixture(callback) {
  const fixture = createFixture();
  try {
    return callback(fixture);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
}

test("inline comments and semicolon-delimited actions are parsed exactly", () => {
  assert.deepEqual(splitInlineComment("echo 官网：https://cfg.srprolin.top/"), {
    code: "echo 官网：https://cfg.srprolin.top/",
    comment: "",
  });
  assert.deepEqual(splitInlineComment('bind "j" "srp_knife" // 默认 Preset 键位'), {
    code: 'bind "j" "srp_knife"',
    comment: "默认 Preset 键位",
  });
  const alias = parseExecutableLine(
    'alias "srp_practice_keys" "exec srp-cfg/modes/practice/with-keymap.cfg;echo ready"',
    12,
  );
  assert.equal(alias.kind, "alias");
  assert.deepEqual(alias.actions.map((action) => action.command), ["exec", "echo"]);
  assert.deepEqual(splitActions('say "a;b";echo done'), ['say "a;b"', "echo done"]);
});

test("generated entities have stable human-readable IDs and exact source coverage", () => {
  const analysis = analyzeConfigDirectory(CONFIG_ROOT);
  const first = generateCuratedCollections(analysis);
  const second = generateCuratedCollections(analysis);
  for (const name of Object.keys(first)) {
    assert.deepEqual(first[name].map((entity) => entity.id), second[name].map((entity) => entity.id));
    for (const entity of first[name]) {
      assert.match(entity.id, /^(file|entry|alias|binding|setting):config\/.+/);
      assert.doesNotMatch(entity.id, /[a-f0-9]{32,}/);
    }
  }

  const entriesByEvidence = new Map(
    first.entries.map((entity) => [`${entity.source.ref}:${entity.source.text}`, entity]),
  );
  for (const file of analysis.files) {
    for (const statement of file.statements) {
      const evidence = `${file.sourcePath}:${statement.line}:${statement.source}`;
      assert.ok(entriesByEvidence.has(evidence), `Missing exact source entity for ${evidence}`);
    }
  }
});

test("repo-local knowledge validates enums, references, and current source without drift", () => {
  const analysis = analyzeConfigDirectory(CONFIG_ROOT);
  const knowledge = validateCuratedKnowledge(analysis, loadCuratedKnowledge(KNOWLEDGE_ROOT));
  assert.ok(knowledge.entities.length > 3000, "Should generate a baseline number of entities");

  const invalidReference = structuredClone(knowledge);
  invalidReference.collections.aliases[0].source.entryId = "entry:config/missing.cfg:1";
  assert.throws(
    () => validateCuratedKnowledge(analysis, invalidReference),
    /references missing entry entry:config\/missing\.cfg:1/,
  );

  const invalidEnum = structuredClone(knowledge);
  invalidEnum.manifest.fileRoles = invalidEnum.manifest.fileRoles.filter(
    (role) => role !== invalidEnum.collections.files[0].source.role,
  );
  assert.throws(() => validateCuratedKnowledge(analysis, invalidEnum), /uses unknown file role/);
});

test("changing a source-owned field is rejected with the regeneration command", () => {
  withFixture(({ configRoot, knowledgeRoot }) => {
    const analysis = analyzeConfigDirectory(configRoot);
    updateCuratedKnowledge(analysis, knowledgeRoot);
    const entriesPath = path.join(knowledgeRoot, "entries.json");
    const entries = JSON.parse(fs.readFileSync(entriesPath, "utf8"));
    entries[0].source.text = "tampered source";
    writeJson(entriesPath, entries);

    assert.throws(
      () => validateCuratedKnowledge(analysis, loadCuratedKnowledge(knowledgeRoot)),
      /source-owned fields[\s\S]*--update/,
    );
  });
});

test("regeneration preserves manual semantic fields while refreshing source facts and stable IDs", () => {
  withFixture(({ configRoot, knowledgeRoot }) => {
    let analysis = analyzeConfigDirectory(configRoot);
    updateCuratedKnowledge(analysis, knowledgeRoot);
    const aliasesPath = path.join(knowledgeRoot, "aliases.json");
    const aliases = JSON.parse(fs.readFileSync(aliasesPath, "utf8"));
    aliases[0].semantic.summary = "Manual knife explanation";
    aliases[0].semantic.aliases = ["knife", "换刀"];
    aliases[0].curation = { status: "reviewed", source: "manual" };
    aliases[0].notes = "keep this note";
    const stableId = aliases[0].id;
    writeJson(aliasesPath, aliases);

    const commandsPath = path.join(configRoot, "srp-cfg", "runtime", "commands.cfg");
    fs.writeFileSync(
      commandsPath,
      `// inserted before curated entity\n${fs.readFileSync(commandsPath, "utf8").replace(
        "exec srp-cfg/features/knife/settings.cfg",
        "exec srp-cfg/features/knife/settings.cfg;echo refreshed",
      )}`,
      "utf8",
    );
    analysis = analyzeConfigDirectory(configRoot);
    const updated = updateCuratedKnowledge(analysis, knowledgeRoot);
    const alias = updated.collections.aliases[0];
    assert.equal(alias.id, stableId);
    assert.match(alias.source.body, /echo refreshed/);
    assert.equal(alias.semantic.summary, "Manual knife explanation");
    assert.deepEqual(alias.semantic.aliases, ["knife", "换刀"]);
    assert.deepEqual(alias.curation, { status: "reviewed", source: "manual" });
    assert.equal(alias.notes, "keep this note");
  });
});

test("keymap presets generate structurally valid binding entities without enforcing exact data", () => {
  const analysis = analyzeConfigDirectory(CONFIG_ROOT);
  const knowledge = validateCuratedKnowledge(analysis, loadCuratedKnowledge(KNOWLEDGE_ROOT));
  
  const defaultKeymapBindings = knowledge.collections.bindings.filter(
    (entity) => entity.source.path === "config/srp-cfg/presets/default/keymap.cfg"
  );
  
  assert.ok(defaultKeymapBindings.length > 0, "Should parse bindings from default keymap");
  
  for (const binding of defaultKeymapBindings.slice(0, 5)) {
    assert.equal(typeof binding.source.key, "string");
    assert.equal(typeof binding.source.body, "string");
    assert.ok(binding.source.text.startsWith("bind "));
    assert.ok(binding.id.startsWith("binding:"));
  }
});

test("v3 dataset is built only from validated production local entities", () => {
  const analysis = analyzeConfigDirectory(CONFIG_ROOT);
  const knowledge = validateCuratedKnowledge(analysis, loadCuratedKnowledge(KNOWLEDGE_ROOT));
  const excludedId = knowledge.collections.aliases[0].id;
  knowledge.collections.aliases[0].curation.status = "needs_review";
  knowledge.entities = [
    ...knowledge.collections.files,
    ...knowledge.collections.entries,
    ...knowledge.collections.aliases,
    ...knowledge.collections.bindings,
    ...knowledge.collections.settings,
    ...knowledge.concepts,
  ];
  const records = buildKnowledgeRecords(knowledge, analysis);
  const dataset = buildKnowledgeDataset(analysis, records);

  assert.equal(dataset.schema, "srp-config-v3");
  assert.equal(dataset.knowledgeSchema, "srp-config-knowledge-v3");
  assert.ok(dataset.recordCount > 3000, "Should contain a baseline number of production records");
  assert.ok(!records.some((record) => record.metadata.entityId === excludedId));
  for (const record of records) {
    assert.equal(record.metadata.schema, "srp-config-v3");
    assert.ok(record.metadata.entityId);
    assert.ok(record.metadata.entityType);
    assert.ok(record.metadata.status);
    assert.ok(record.metadata.sourceRef);
    assert.ok(record.metadata.sourcePath);
    assert.ok(record.metadata.sourceLine > 0);
    assert.ok(record.metadata.source);
    assert.ok(record.metadata.title);
    assert.ok(Buffer.byteLength(record.id, "utf8") <= 64);
    assert.ok(Buffer.byteLength(JSON.stringify(record.metadata), "utf8") <= 10 * 1024);
  }
});

test("Vectorize synchronization uses the Workers AI token and batches stale deletions", async () => {
  const previousAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const previousAiToken = process.env.CLOUDFLARE_AI_TOKEN;
  const previousApiToken = process.env.CLOUDFLARE_API_TOKEN;
  const previousFetch = globalThis.fetch;
  const staleIds = Array.from({ length: 150 }, (_, index) => `srpcfg:v2:stale-${index}`);
  const requests = [];

  process.env.CLOUDFLARE_ACCOUNT_ID = "test-account";
  process.env.CLOUDFLARE_AI_TOKEN = "vectorize-capable-token";
  process.env.CLOUDFLARE_API_TOKEN = "deployment-only-token";
  globalThis.fetch = async (url, options) => {
    const request = {
      url: String(url),
      authorization: options?.headers?.Authorization,
      body: options?.body,
    };
    requests.push(request);
    const result = request.url.endsWith("/list?count=1000")
      ? { vectors: staleIds.map((id) => ({ id })), isTruncated: false }
      : {};
    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await syncKnowledgeIndex([], { indexName: "test-index" });
    assert.deepEqual(result, { total: 0, upserted: 0, deleted: 150 });
    assert.equal(requests.length, 3);
    assert.deepEqual(requests.slice(1).map((request) => JSON.parse(request.body).ids.length), [100, 50]);
    for (const request of requests) {
      assert.equal(request.authorization, "Bearer vectorize-capable-token");
    }
  } finally {
    globalThis.fetch = previousFetch;
    if (previousAccountId === undefined) delete process.env.CLOUDFLARE_ACCOUNT_ID;
    else process.env.CLOUDFLARE_ACCOUNT_ID = previousAccountId;
    if (previousAiToken === undefined) delete process.env.CLOUDFLARE_AI_TOKEN;
    else process.env.CLOUDFLARE_AI_TOKEN = previousAiToken;
    if (previousApiToken === undefined) delete process.env.CLOUDFLARE_API_TOKEN;
    else process.env.CLOUDFLARE_API_TOKEN = previousApiToken;
  }
});
