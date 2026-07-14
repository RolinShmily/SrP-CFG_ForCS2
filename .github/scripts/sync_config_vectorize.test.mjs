import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  analyzeConfigDirectory,
  buildKnowledgeRecords,
  parseExecutableLine,
  splitActions,
  splitInlineComment,
  syncKnowledgeIndex,
} from "./sync_config_vectorize.mjs";

const CONFIG_ROOT = path.resolve("config");

function buildFixture() {
  const analysis = analyzeConfigDirectory(CONFIG_ROOT);
  return { analysis, records: buildKnowledgeRecords(analysis) };
}

test("inline comments do not truncate URLs or quoted content", () => {
  assert.deepEqual(splitInlineComment("echo 官网：https://cfg.srprolin.top/"), {
    code: "echo 官网：https://cfg.srprolin.top/",
    comment: "",
  });
  assert.deepEqual(splitInlineComment('bind "j" "srp_knife" // 默认 Preset 键位'), {
    code: 'bind "j" "srp_knife"',
    comment: "默认 Preset 键位",
  });
});

test("alias and bind bodies retain every semicolon-delimited action", () => {
  const alias = parseExecutableLine(
    'alias "srp_practice_keys" "exec srp-cfg/modes/practice/with-keymap.cfg;echo ready"',
    12,
  );
  assert.equal(alias.kind, "alias");
  assert.equal(alias.symbol, "srp_practice_keys");
  assert.deepEqual(alias.actions.map((action) => action.command), ["exec", "echo"]);

  const bind = parseExecutableLine('bind "\\" "block" // 切换击杀信息显示。', 8);
  assert.equal(bind.kind, "bind");
  assert.equal(bind.key, "\\");
  assert.equal(bind.body, "block");
  assert.equal(bind.description, "切换击杀信息显示。");

  assert.deepEqual(splitActions('say "a;b";echo done'), ['say "a;b"', "echo done"]);
});

test("source analyzer derives startup, preset, and module activation paths", () => {
  const { analysis, records } = buildFixture();
  assert.ok(analysis.files.length > 50);

  const runtimeFile = records.find(
    (record) => record.metadata.kind === "file" && record.metadata.sourcePath === "config/srp-cfg/features/knife/runtime.cfg",
  );
  assert.match(runtimeFile.metadata.activation, /启动链 autoexec\.cfg -> srp-cfg\/runtime\/init\.cfg/);

  const defaultKnifeBind = records.find(
    (record) =>
      record.metadata.kind === "bind" &&
      record.metadata.sourcePath === "config/srp-cfg/presets/default/keymap.cfg" &&
      record.metadata.key === "j",
  );
  assert.equal(defaultKnifeBind.metadata.source, 'bind "j" "srp_knife"');
  assert.match(defaultKnifeBind.metadata.activation, /别名 srp_apply_default/);
  assert.match(defaultKnifeBind.metadata.scope, /Preset|物理键位/);

  const knifeEntry = records.find(
    (record) =>
      record.metadata.kind === "alias" &&
      record.metadata.sourcePath === "config/srp-cfg/runtime/commands.cfg" &&
      record.metadata.symbol === "srp_knife",
  );
  assert.match(knifeEntry.metadata.relation, /features\/knife\/settings\.cfg/);
});

test("every executable CFG line has an exact source record", () => {
  const { analysis, records } = buildFixture();
  const statementKeys = new Set(
    records
      .filter((record) => record.metadata.kind !== "file" && !record.metadata.kind.endsWith("_action"))
      .map((record) => `${record.metadata.sourcePath}:${record.metadata.line}:${record.metadata.source}`),
  );
  for (const file of analysis.files) {
    for (const statement of file.statements) {
      const key = `${file.sourcePath}:${statement.line}:${statement.source}`;
      assert.ok(statementKeys.has(key), `Missing source record for ${key}`);
    }
  }
});

test("knowledge records expose exact command context within Vectorize limits", () => {
  const { records } = buildFixture();
  assert.ok(records.length > 1000);

  const practiceCheats = records.find(
    (record) =>
      record.metadata.sourcePath === "config/srp-cfg/modes/practice/settings.cfg" &&
      record.metadata.line === 2 &&
      record.metadata.command === "sv_cheats",
  );
  assert.equal(practiceCheats.metadata.source, "sv_cheats                        1");
  assert.match(practiceCheats.metadata.description, /允许本地训练/);
  assert.match(practiceCheats.metadata.scope, /模块入口/);

  const uniqueIds = new Set(records.map((record) => record.id));
  assert.equal(uniqueIds.size, records.length);
  for (const record of records) {
    assert.ok(Buffer.byteLength(record.id, "utf8") <= 64, record.id);
    assert.ok(Buffer.byteLength(JSON.stringify(record.metadata), "utf8") <= 10 * 1024, record.id);
    assert.ok(record.metadata.sourcePath.startsWith("config/"));
    assert.equal(record.metadata.schema, "srp-config-v1");
  }
});

test("Vectorize synchronization uses the Workers AI token", async () => {
  const previousAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const previousAiToken = process.env.CLOUDFLARE_AI_TOKEN;
  const previousApiToken = process.env.CLOUDFLARE_API_TOKEN;
  const previousFetch = globalThis.fetch;
  const requests = [];

  process.env.CLOUDFLARE_ACCOUNT_ID = "test-account";
  process.env.CLOUDFLARE_AI_TOKEN = "vectorize-capable-token";
  process.env.CLOUDFLARE_API_TOKEN = "deployment-only-token";
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), authorization: options?.headers?.Authorization });
    return new Response(JSON.stringify({ success: true, result: { vectors: [], isTruncated: false } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await syncKnowledgeIndex([], { indexName: "test-index" });
    assert.deepEqual(result, { total: 0, upserted: 0, deleted: 0 });
    assert.equal(requests.length, 1);
    assert.match(requests[0].url, /\/vectorize\/v2\/indexes\/test-index\/list/);
    assert.equal(requests[0].authorization, "Bearer vectorize-capable-token");
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
