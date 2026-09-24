/**
 * 功能页的数据一致性断言。
 *
 * 目的：CI 目前只有 typecheck + build，抓不到「数据对得上但渲染/语义错了」这类问题。
 * 典型例子是画布上右侧 Ctrl 的 id 被写成 ctrl（与左侧 Ctrl 重复），
 * 于是右 Ctrl 显示了左 Ctrl 的绑定，图例说 83 条、画布上却渲染出 84 个高亮键。
 *
 * 断言挑选标准（重要）：
 * 1. 与 config 的具体内容无关——这样用户正常改 cfg 不会让测试变红。
 *    例如「默认预设必须正好 66 条绑定」这种金标准是**故意不写**的，它一改就假警报。
 * 2. 非自证——不把实现逻辑重抄一遍当作断言，而是断言对使用者的实际语义。
 *
 * 运行：node --experimental-strip-types --test <本文件>
 * 只 import .ts 模块（node 的 strip-types 不处理 .tsx 里的 JSX）。
 */
import assert from "node:assert/strict";
import test from "node:test";
import { MAIN_ROWS, NAV_ROWS, ON_CANVAS } from "./keyboard-layout.ts";
import { MOUSE_KEY_IDS } from "./mouse-layout.ts";
import { aliasByName, applyRebinds, keymaps, resolveKeymap, USER_LAYER } from "./keymaps-data.ts";
import { generateRebindCfg } from "./rebind-export.ts";
import { crosshair } from "./crosshair-data.ts";

/** cfg 里的复合指令（slot1;view_0）逐个 token 拆开，取首段当命令名。 */
const firstTokens = (cmd: string) =>
  cmd
    .split(";")
    .map((s) => s.trim().split(/\s+/)[0])
    .filter(Boolean);

// ────────────────────────────────────────────────────────────────────────
// 画布布局
// ────────────────────────────────────────────────────────────────────────

test("画布键位 id 无重复（左右修饰键必须是不同的 Source 名）", () => {
  const ids = [...MAIN_ROWS.flat(), ...NAV_ROWS.flat()]
    .map((k) => k.id)
    .filter((id): id is string => Boolean(id));

  const count = new Map<string, number>();
  for (const id of ids) count.set(id, (count.get(id) ?? 0) + 1);
  const dupes = [...count].filter(([, n]) => n > 1).map(([id, n]) => `${id} ×${n}`);

  assert.deepEqual(dupes, [], `键位 id 重复会让同一个绑定被渲染多次：${dupes.join(", ")}`);

  const overlap = ids.filter((id) => MOUSE_KEY_IDS.includes(id));
  assert.deepEqual(overlap, [], `键盘与鼠标键位 id 交叉：${overlap.join(", ")}`);
});

test("布局覆盖一把真实键盘该有的键", () => {
  const required = [
    ..."abcdefghijklmnopqrstuvwxyz",
    ..."0123456789",
    "escape", "tab", "capslock", "space", "enter", "backspace",
    "shift", "rshift", "ctrl", "rctrl", "alt", "ralt",
    "uparrow", "downarrow", "leftarrow", "rightarrow",
    "f1", "f12", "del", "ins", "home", "end", "pgup", "pgdn",
    "mouse1", "mouse2", "mouse3", "mouse4", "mouse5",
    "mwheelup", "mwheeldown", "mouse_x", "mouse_y",
  ];
  const missing = required.filter((k) => !ON_CANVAS.has(k));
  assert.deepEqual(missing, [], `画布缺少这些键：${missing.join(", ")}`);
});

// ────────────────────────────────────────────────────────────────────────
// 数据引用完整性
// ────────────────────────────────────────────────────────────────────────

test("每个模块层都有已定义的入口 alias", () => {
  const broken: string[] = [];
  for (const layer of keymaps.layers) {
    if (layer.kind === "preset") continue;
    if (!layer.entryAlias) broken.push(`${layer.id} 无入口 alias`);
    else if (!aliasByName.has(layer.entryAlias)) broken.push(`${layer.id} 的 ${layer.entryAlias} 未定义`);
  }
  assert.deepEqual(broken, [], `模块入口 alias 缺失：${broken.join("; ")}`);
});

test("cfg 里引用的 srp_ 开头的 alias 都已定义（防拼写错误）", () => {
  const offenders: string[] = [];
  const check = (where: string, cmd: string) => {
    for (const tok of firstTokens(cmd)) {
      if (tok.startsWith("srp_") && !aliasByName.has(tok)) offenders.push(`${where} → ${tok}`);
    }
  };
  for (const a of keymaps.aliasCatalog) check(`alias ${a.name}`, a.body);
  for (const layer of keymaps.layers) {
    for (const e of layer.entries) {
      if (e.op === "bind" && e.target) check(`${layer.id} bind ${e.key}`, e.target);
    }
  }
  assert.deepEqual(offenders, [], `引用了未定义的 srp_ alias：${offenders.slice(0, 5).join("; ")}`);
});

// ────────────────────────────────────────────────────────────────────────
// 层叠加语义
// ────────────────────────────────────────────────────────────────────────

test("上层 unbind 必须真的清掉下层的绑定", () => {
  const presets = keymaps.layers.filter((l) => l.kind === "preset");
  const modules = keymaps.layers.filter((l) => l.kind !== "preset");
  let checked = 0;

  for (const preset of presets) {
    for (const mod of modules) {
      const eff = resolveKeymap(preset.id, [mod.id]);
      for (const e of mod.entries) {
        if (e.op !== "unbind") continue;
        const below = preset.entries.find((p) => p.op === "bind" && p.key === e.key);
        if (!below) continue;
        checked++;
        const got = eff.get(e.key);
        assert.equal(
          got?.active?.entry.op,
          "unbind",
          `${mod.id} 解绑了 ${preset.id} 绑定的 ${e.key}，但生效结果还是 bind`,
        );
      }
    }
  }
  assert.ok(checked > 0, "数据里找不到「模块解绑预设绑定」的样例，该断言没被真正执行");
});

// ────────────────────────────────────────────────────────────────────────
// 个人改键
// ────────────────────────────────────────────────────────────────────────

test("applyRebinds：改键压过配置层、清空真的清空、且不改动入参", () => {
  const base = resolveKeymap("presets/default", []);
  const snapshot = JSON.stringify(
    [...base].map(([k, v]) => [k, v.active?.entry.op ?? null, v.active?.entry.target ?? null]),
  );

  const boundKey = [...base].find(([, v]) => v.active?.entry.op === "bind")?.[0];
  assert.ok(boundKey, "默认预设里没有任何绑定，断言无法执行");

  const rebound = applyRebinds(base, { [boundKey]: "srp_probe" });
  assert.equal(rebound.get(boundKey)?.active?.layer.id, USER_LAYER.id);
  assert.equal(rebound.get(boundKey)?.active?.entry.target, "srp_probe");

  const cleared = applyRebinds(base, { [boundKey]: null });
  assert.equal(cleared.get(boundKey)?.active?.entry.op, "unbind", "传 null 必须真的把这个键清空");

  assert.equal(
    JSON.stringify([...base].map(([k, v]) => [k, v.active?.entry.op ?? null, v.active?.entry.target ?? null])),
    snapshot,
    "applyRebinds 不得改动传入的 Map",
  );
});

// ────────────────────────────────────────────────────────────────────────
// 导出片段（用户要粘进游戏的产物）
// ────────────────────────────────────────────────────────────────────────

test("预设上下文的导出：写顶层 bind，不产生 alias", () => {
  const r = generateRebindCfg([{ presetId: "presets/default", moduleIds: [], rebinds: { k: "srp_knife" } }]);
  assert.equal(r.count, 1);
  assert.equal(r.skipped.length, 0);
  assert.match(r.text, /^bind "k" "srp_knife"$/m);
  assert.ok(!r.text.startsWith("alias "), "预设上下文不该出现 alias 行");
  assert.ok(!/^alias /m.test(r.text), "预设上下文不该出现 alias 行");
});

test("模块上下文的导出：必须复刻入口 alias 原本的 body，并把改键接在它之后", () => {
  const entry = "srp_practice_keys";
  const realBody = aliasByName.get(entry)?.body;
  assert.ok(realBody, `找不到 ${entry}，断言无法执行`);

  const r = generateRebindCfg([
    { presetId: "presets/default", moduleIds: ["modes/practice"], rebinds: { k: "srp_reload" } },
  ]);

  const aliasLines = r.text.split("\n").filter((l) => l.startsWith("alias "));
  assert.equal(aliasLines.length, 3, "模块上下文应当只产生三条 alias 行");

  // 关键：base 必须逐字复刻入口 alias 原本的 body，否则用户整个模块的键盘映射都会坏
  assert.ok(
    r.text.includes(`"${realBody}"`),
    "base alias 必须原样复刻入口 alias 的 body",
  );
  // 入口 alias 必须被重新定义成 base + 自定义段
  assert.ok(
    new RegExp(`^alias "${entry}" "\\w+;\\w+"$`, "m").test(r.text),
    `入口 alias ${entry} 必须被重新定义成「base + 自定义段」`,
  );

  // 自定义段里的 bind 不得带引号：仓库里现存 0 条 alias 体使用嵌套转义引号，
  // 无法确认游戏端对 \" 的处理，所以设计上一律用不带引号的 token 形式避开转义。
  const customLine = aliasLines.find((l) => l.includes("bind k srp_reload"));
  assert.ok(customLine, "自定义段里应有不带引号的 bind k srp_reload");
  // 行的引号切分：[前缀, 名字, 中间空白, body, 末尾空串]，body 恒为倒数第二段
  const parts = customLine.split('"');
  const body = parts[parts.length - 2];
  assert.equal(body, "bind k srp_reload");
  assert.ok(!body.includes('"'), `alias 体内不得出现引号：${body}`);
  // 整行只应有四个引号（包住名字与 body），多于四个就说明体内混进了引号
  assert.equal(parts.length - 1, 4, `alias 行的引号数异常：${customLine}`);
});

test("导出：含引号或空格的键被跳过并单独报出", () => {
  const r = generateRebindCfg([
    { presetId: "presets/default", moduleIds: [], rebinds: { "kp 1": "srp_a", k: "srp_b" } },
  ]);
  assert.equal(r.skipped.length, 1);
  assert.equal(r.skipped[0].key, "kp 1");
  // 不能出现在任何可执行的 bind/unbind/alias 行里（只在末尾的「请手工处理」注释里列出）
  const executable = r.text.split("\n").filter((l) => /^(bind|unbind|alias) /.test(l));
  assert.deepEqual(
    executable.filter((l) => l.includes("kp 1")),
    [],
    "无法安全写出的条目不得出现在可执行行里",
  );
  assert.ok(r.text.includes("kp 1"), "但应在片段末尾单独报出，提醒用户手工处理");
  assert.match(r.text, /^bind "k" "srp_b"$/m);
});

test("导出：没有改键时不产生任何内容", () => {
  const r = generateRebindCfg([{ presetId: "presets/default", moduleIds: [], rebinds: {} }]);
  assert.equal(r.count, 0);
  assert.equal(r.text, "");
});

// ────────────────────────────────────────────────────────────────────────
// 准星 / 视角库
// ────────────────────────────────────────────────────────────────────────

test("准星 / 视角预设的 id、索引与参数自洽", () => {
  const all = [...crosshair.crosshairs, ...crosshair.viewmodels];
  assert.ok(all.length >= 16, `预设数量异常：${all.length}`);

  const ids = new Set<string>();
  for (const p of all) {
    assert.match(p.id, /^[cv]\d{2}$/, `预设 id 形态不对：${p.id}`);
    assert.equal(p.id, `${p.id[0]}${p.index}`, `${p.id} 的 index 字段与 id 不自洽`);
    assert.equal(p.alias, p.id, `${p.id} 的应用入口应与其 id 相同`);
    assert.ok(p.convars.length > 0, `${p.id} 没有任何参数`);
    assert.ok(!ids.has(p.id), `预设 id 重复：${p.id}`);
    ids.add(p.id);
  }
});

test("颜色别名的 hex 与 rgb 一致", () => {
  assert.ok(crosshair.colors.length > 0);
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  for (const c of crosshair.colors) {
    assert.equal(c.hex, `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`, `${c.alias} 的 hex 与 rgb 不一致`);
    assert.ok([c.r, c.g, c.b].every((n) => n >= 0 && n <= 255), `${c.alias} 的通道值越界`);
  }
});

test("库里的循环入口 alias 确实存在", () => {
  for (const [kind, name] of Object.entries(crosshair.cycles)) {
    assert.ok(name, `${kind} 循环入口为空`);
    assert.ok(aliasByName.has(name as string), `${kind} 循环入口 ${name} 在 alias 目录里不存在`);
  }
});
