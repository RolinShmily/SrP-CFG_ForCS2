#!/usr/bin/env node
/**
 * 从 config/srp-cfg 提取按键数据 → app/website/public/data/keymaps.json
 *
 * 唯一真源是 config/ 下的 cfg 本身：keymap 层（presets / features / modes）与 alias 定义
 * 都由本脚本解析，网站不手写任何按键映射，cfg 改了重新生成即可，不存在第二份会漂移的数据。
 *
 * 解析对象
 * - <kind>/<name>/keymap.cfg        —— 按键层本体（bind / unbind + 行尾中文注释）
 * - 全树 *.cfg 里的 alias 定义      —— 用于 tooltip 沿 alias 链解释「这个键到底做了什么」
 * - runtime/*.cfg 里的入口 alias    —— body 中 exec <kind>/<name>/with-keymap.cfg 的那条，
 *                                      即「按下哪个键会应用该模块的 keymap」，可推导、无需手写
 *
 * 只导出「从 keymap 目标可达」的 alias：全树 555 条 alias 里绝大多数是跑图出生点等
 * 与按键无关的定义，全量导出会让产物无谓膨胀。
 *
 * 用法：
 *   node scripts/extract-keymaps.mjs           生成
 *   node scripts/extract-keymaps.mjs --check   只校验产物是否与 cfg 一致（供 CI）
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CFG_ROOT = join(ROOT, "config/srp-cfg");
const OUT = join(ROOT, "app/website/public/data/keymaps.json");
const CHECK_ONLY = process.argv.includes("--check");

// ── 展示名（仅命名，非按键数据；按键本身全部来自 cfg）────────────────────
const LAYER_LABELS = {
  "presets/default": "RoL1n 默认",
  "presets/echo": "Echo",
  "presets/yszh": "YSZH",
  "presets/visionl": "VisionL",
  "presets/valve": "Valve 基线",
  "features/autoview": "自适应视角",
  "features/crosshair-view": "准星与视角",
  "features/knife": "匕首模型",
  "features/zeus": "电击枪",
  "modes/practice": "跑图训练",
  "modes/preview": "饰品预览",
  "modes/guidemake": "标点制作",
  "modes/demo-hlae": "Demo / HLAE",
  "modes/pwa-prac": "完美跑图",
};

/** Source 键名 → 画布展示名。只列与键名本身差异较大的，其余由画布自行决定。 */
const KEY_LABELS = {
  mouse1: "鼠标左键",
  mouse2: "鼠标右键",
  mouse3: "鼠标中键",
  mouse4: "鼠标侧键 4",
  mouse5: "鼠标侧键 5",
  mouse_x: "鼠标横向",
  mouse_y: "鼠标纵向",
  mwheelup: "滚轮上",
  mwheeldown: "滚轮下",
  "`": "~ 反引号",
  "'": "' 引号",
  "\\": "\\ 反斜杠",
  '"': '" 引号键',
  ",": ", 逗号",
  ".": ". 句点",
  "/": "/ 斜杠",
  "-": "- 减号",
  "=": "= 等号",
  "[": "[ 左方括号",
  "]": "] 右方括号",
  "0": "0",
  ctrl: "左 Ctrl",
  rshift: "右 Shift",
  alt: "左 Alt",
  ralt: "右 Alt",
  capslock: "Caps Lock",
  backspace: "Backspace",
  space: "空格",
  tab: "Tab",
  enter: "Enter",
  ins: "Insert",
  del: "Delete",
  end: "End",
  uparrow: "↑",
  downarrow: "↓",
  leftarrow: "←",
  rightarrow: "→",
};

// ── 解析 ────────────────────────────────────────────────────────────────
// Source 的引号可转义（如 bind "\" "say_team .hp"），故不能简单按引号切分。
const BIND_RE = /^bind\s+"((?:[^"\\]|\\.)*)"\s+"((?:[^"\\]|\\.)*)"/;
const UNBIND_RE = /^unbind\s+"((?:[^"\\]|\\.)*)"/;
const ALIAS_RE = /^alias\s+"((?:[^"\\]|\\.)*)"\s+"((?:[^"\\]|\\.)*)"/;
const TRAILING_COMMENT_RE = /\s*\/\/\s*(.*)$/;
/** 只认整行注释（行首 //）；行尾 // 由 TRAILING_COMMENT_RE 单独剥离。 */
const LEADING_COMMENT_RE = /^\/\//;

const unescape = (s) => s.replace(/\\(.)/g, "$1");

/** 逐行解析一个 cfg，返回 { binds, unbinds, aliases }。 */
function parseCfg(path) {
  const out = { binds: [], unbinds: [], aliases: [] };
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || LEADING_COMMENT_RE.test(line)) continue;

    const cm = line.match(TRAILING_COMMENT_RE);
    const comment = cm ? cm[1].trim() : "";
    const code = cm ? line.slice(0, cm.index).trim() : line;
    if (!code) continue;

    let m;
    if ((m = code.match(BIND_RE))) {
      out.binds.push({ op: "bind", key: unescape(m[1]).toLowerCase(), target: unescape(m[2]), comment });
    } else if ((m = code.match(UNBIND_RE))) {
      out.unbinds.push({ op: "unbind", key: unescape(m[1]).toLowerCase(), comment });
    } else if ((m = code.match(ALIAS_RE))) {
      out.aliases.push({ name: unescape(m[1]), body: unescape(m[2]), comment });
    }
  }
  return out;
}

const rel = (p) => relative(ROOT, p).replace(/\\/g, "/");

// ── 1. 全树 alias 定义 ──────────────────────────────────────────────────
const aliasDefs = new Map();
const cfgFiles = [];
(function walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".cfg")) cfgFiles.push(p);
  }
})(CFG_ROOT);

for (const f of cfgFiles) {
  for (const a of parseCfg(f).aliases) {
    if (!aliasDefs.has(a.name)) {
      aliasDefs.set(a.name, { body: a.body, comment: a.comment, definedIn: rel(f) });
    }
  }
}

// ── 2. keymap 层 ────────────────────────────────────────────────────────
const KINDS = ["presets", "features", "modes"];
const layers = [];

for (const kind of KINDS) {
  const base = join(CFG_ROOT, kind);
  for (const name of readdirSync(base).sort()) {
    if (!statSync(join(base, name)).isDirectory()) continue;
    const km = join(base, name, "keymap.cfg");
    if (!existsSync(km)) continue;

    const parsed = parseCfg(km);
    const id = `${kind}/${name}`;

    // 入口 alias：body 里 exec 了本模块 with-keymap.cfg 的那条（如 srp_practice_keys）
    const entry = [...aliasDefs].find(([, a]) =>
      a.body.includes(`exec srp-cfg/${kind}/${name}/with-keymap.cfg`),
    );

    layers.push({
      id,
      kind: kind.replace(/s$/, ""), // presets→preset / features→feature / modes→mode
      name,
      label: LAYER_LABELS[id] ?? name,
      file: rel(km),
      entryAlias: entry ? entry[0] : null,
      entries: [...parsed.binds, ...parsed.unbinds],
    });
  }
}

// ── 3. 只保留可达 alias（沿 alias 链递归）────────────────────────────────
/** 目标里可能含复合指令（slot1;view_0），逐个 token 找 alias。 */
const tokensOf = (target) =>
  target
    .split(";")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.split(/\s+/)[0]);

const reachable = new Set();
const queue = [];
for (const L of layers) {
  for (const e of L.entries) {
    if (e.op !== "bind") continue;
    for (const tok of tokensOf(e.target)) if (aliasDefs.has(tok)) queue.push(tok);
  }
}
while (queue.length) {
  const name = queue.pop();
  if (reachable.has(name)) continue;
  reachable.add(name);
  const def = aliasDefs.get(name);
  for (const tok of tokensOf(def.body)) if (aliasDefs.has(tok)) queue.push(tok);
}

const aliases = {};
for (const name of [...reachable].sort()) {
  const { body, comment, definedIn } = aliasDefs.get(name);
  aliases[name] = { body, comment, definedIn };
}

// ── 4. 产物 ─────────────────────────────────────────────────────────────
const keysUsed = [
  ...new Set(layers.flatMap((L) => L.entries.map((e) => e.key))),
].sort();

const payload = {
  $comment:
    "由 scripts/extract-keymaps.mjs 从 config/srp-cfg 生成，请勿手改；改 cfg 后重新运行该脚本。",
  layers,
  aliases,
  keyLabels: KEY_LABELS,
  keysUsed,
};

const json = JSON.stringify(payload, null, 2) + "\n";

// ── 5. 写出 / 校验 ──────────────────────────────────────────────────────
if (CHECK_ONLY) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : null;
  if (current !== json) {
    console.error("✘ keymaps.json 与 config/ 不一致，请运行 node scripts/extract-keymaps.mjs");
    process.exit(1);
  }
  console.log(`✓ keymaps.json 与 config/ 一致（${layers.length} 层 / ${keysUsed.length} 键 / ${Object.keys(aliases).length} alias）`);
} else {
  writeFileSync(OUT, json, "utf8");
  const binds = layers.reduce((n, L) => n + L.entries.filter((e) => e.op === "bind").length, 0);
  const unbinds = layers.reduce((n, L) => n + L.entries.filter((e) => e.op === "unbind").length, 0);
  console.log(
    `✓ 已生成 ${rel(OUT)}\n` +
      `  层 ${layers.length}（preset ${layers.filter((l) => l.kind === "preset").length} / ` +
      `feature ${layers.filter((l) => l.kind === "feature").length} / ` +
      `mode ${layers.filter((l) => l.kind === "mode").length}）\n` +
      `  bind ${binds} · unbind ${unbinds} · 按键 ${keysUsed.length} · 可达 alias ${Object.keys(aliases).length}`,
  );
}
