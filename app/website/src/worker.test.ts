import assert from "node:assert/strict";
import test from "node:test";

import { buildConfigReferenceContext, formatConfigContext, selectConfigKnowledge } from "./worker.ts";

function evidence(overrides: Record<string, unknown> = {}) {
  return {
    schema: "srp-config-v3",
    entityId: "binding:default:j",
    entityType: "binding",
    status: "reviewed",
    sourcePath: "config/srp-cfg/presets/default/keymap.cfg",
    sourceLine: 77,
    sourceRef: "config/srp-cfg/presets/default/keymap.cfg:77",
    source: 'bind "j" "srp_knife"',
    title: "Default Preset J binding",
    summary: "Default Preset 把 J 绑定到 srp_knife。",
    key: "j",
    body: "srp_knife",
    area: "preset",
    module: "default",
    ...overrides,
  };
}

test("formats curated evidence with stable entity ID and exact source citation", () => {
  const context = formatConfigContext(evidence());

  assert.match(context, /实体：binding:default:j \(binding; reviewed\)/);
  assert.match(context, /证据：config\/srp-cfg\/presets\/default\/keymap\.cfg:77/);
  assert.match(context, /按键："j"/);
  assert.match(context, /绑定或定义内容："srp_knife"/);
  assert.match(context, /源码：`bind "j" "srp_knife"`/);
});

test("ranks exact Default Preset J evidence above stronger unrelated semantic matches", () => {
  const selected = selectConfigKnowledge("What is the Default Preset J key?", [
    { score: 0.999, metadata: evidence({ entityId: "setting:jump", entityType: "setting", sourceRef: "config/jump.cfg:1", sourcePath: "config/jump.cfg", sourceLine: 1, source: "sv_jump_impulse 301", title: "Jump setting", key: undefined, module: "movement" }) },
    { score: 0.98, metadata: evidence({ entityId: "binding:demo:j", sourceRef: "config/srp-cfg/modes/demo-hlae/keymap.cfg:7", sourcePath: "config/srp-cfg/modes/demo-hlae/keymap.cfg", sourceLine: 7, source: 'bind "j" "dmsg"', body: "dmsg", module: "demo-hlae", title: "Demo J binding" }) },
    { score: 0.2, metadata: evidence() },
  ]);

  assert.equal(selected[0]?.entityId, "binding:default:j");
  assert.equal(selected[0]?.sourceRef, "config/srp-cfg/presets/default/keymap.cfg:77");
});

test("does not treat srp_practice as an exact match for srp_practice_keys", () => {
  const selected = selectConfigKnowledge("How does srp_practice work?", [
    { score: 0.99, metadata: evidence({ entityId: "alias:srp_practice_keys", entityType: "alias", name: "srp_practice_keys", sourceRef: "config/srp-cfg/runtime/commands.cfg:25", sourcePath: "config/srp-cfg/runtime/commands.cfg", sourceLine: 25, source: 'alias "srp_practice_keys" "exec srp-cfg/modes/practice/with-keymap.cfg"', key: undefined, body: "exec srp-cfg/modes/practice/with-keymap.cfg", module: "runtime" }) },
    { score: 0.1, metadata: evidence({ entityId: "alias:srp_practice", entityType: "alias", name: "srp_practice", sourceRef: "config/srp-cfg/runtime/commands.cfg:24", sourcePath: "config/srp-cfg/runtime/commands.cfg", sourceLine: 24, source: 'alias "srp_practice" "exec srp-cfg/modes/practice/settings.cfg"', key: undefined, body: "exec srp-cfg/modes/practice/settings.cfg", module: "runtime" }) },
  ]);

  assert.equal(selected[0]?.entityId, "alias:srp_practice");
  assert.equal(selected[1]?.entityId, "alias:srp_practice_keys");
});

test("prioritizes exact paths, curated aliases, and Cvars", () => {
  const pathRecord = evidence({
    entityId: "file:default-keymap",
    entityType: "file",
    title: "Default keymap",
    key: undefined,
  });
  const aliasRecord = evidence({
    entityId: "alias:knife-cycle",
    entityType: "alias",
    aliases: "knife_cycle cycle_knife",
    key: undefined,
    sourcePath: "config/srp-cfg/runtime/commands.cfg",
    sourceLine: 30,
    sourceRef: "config/srp-cfg/runtime/commands.cfg:30",
  });
  const cvarRecord = evidence({
    entityId: "setting:sv-cheats",
    entityType: "setting",
    cvar: "sv_cheats",
    sourcePath: "config/srp-cfg/modes/practice/settings.cfg",
    sourceLine: 1,
    sourceRef: "config/srp-cfg/modes/practice/settings.cfg:1",
  });
  const matches = [
    { score: 0.99, metadata: evidence({ entityId: "binding:semantic-only", key: undefined, module: "other" }) },
    { score: 0.2, metadata: pathRecord },
    { score: 0.2, metadata: aliasRecord },
    { score: 0.2, metadata: cvarRecord },
  ];

  assert.equal(selectConfigKnowledge("config/srp-cfg/presets/default/keymap.cfg", matches)[0]?.entityId, "file:default-keymap");
  assert.equal(selectConfigKnowledge("knife_cycle", matches)[0]?.entityId, "alias:knife-cycle");
  assert.equal(selectConfigKnowledge("sv_cheats", matches)[0]?.entityId, "setting:sv-cheats");
});

test("dedupes by entityId, prefers reviewed evidence, and caps each entity type", () => {
  const matches = [
    { score: 0.99, metadata: evidence({ status: "generated" }) },
    { score: 0.5, metadata: evidence({ sourceRef: "config/srp-cfg/presets/default/keymap.cfg:77" }) },
    ...Array.from({ length: 5 }, (_, index) => ({
      score: 0.4 - index / 100,
      metadata: evidence({
        entityId: `binding:other:${index}`,
        sourcePath: `config/other-${index}.cfg`,
        sourceLine: index + 1,
        sourceRef: `config/other-${index}.cfg:${index + 1}`,
        source: `bind "f${index}" "action_${index}"`,
        key: `f${index}`,
        module: "other",
      }),
    })),
  ];

  const selected = selectConfigKnowledge("Default Preset J key", matches);
  assert.equal(selected.filter((item) => item.entityId === "binding:default:j").length, 1);
  assert.equal(selected.find((item) => item.entityId === "binding:default:j")?.status, "reviewed");
  assert.equal(selected.filter((item) => item.entityType === "binding").length, 4);
});

test("formats only production source-backed evidence and reports no-evidence explicitly", () => {
  const context = buildConfigReferenceContext([
    evidence({ entityId: "binding:generated", status: "generated", sourceRef: "config/generated.cfg:2", sourcePath: "config/generated.cfg", sourceLine: 2 }),
    evidence({ entityId: "binding:draft", status: "ai_draft" }),
    evidence({ entityId: "binding:missing-source", sourceRef: undefined }),
  ]);

  assert.match(context, /实体：binding:generated/);
  assert.match(context, /证据：config\/generated\.cfg:2/);
  assert.doesNotMatch(context, /binding:draft|binding:missing-source/);
  assert.equal(buildConfigReferenceContext([]), "未检索到可引用的生产证据。");
  assert.equal(formatConfigContext(evidence({ sourceRef: "not-a-source-reference" })), "");
});
