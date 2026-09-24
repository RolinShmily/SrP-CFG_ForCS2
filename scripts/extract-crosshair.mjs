/**
 * 从 config/srp-cfg 提取准星库与视角库，生成 app/website/src/data/generated/crosshair.json。
 *
 * 与 scripts/extract-keymaps.mjs 同一套做法：config/ 是唯一真源，产物随 bundle 打包，
 * 改 cfg 后重新运行本脚本（CI 用 --check 校验是否漂移）。
 *
 * 图片走目录约定：app/website/public/images/crosshair/<预设 id>.<png|jpg|jpeg|webp|avif>。
 * 构建时扫描该目录，扫到就填进 image 字段，没扫到就是 null（页面显示占位框）。
 * 于是加图只需丢文件，不用改任何代码或配置。
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CFG = join(ROOT, "config/srp-cfg/features/crosshair-view");
const RUNTIME = join(CFG, "runtime.cfg");
const LIB_DIR = join(CFG, "library");
const IMG_DIR = join(ROOT, "app/website/public/images/crosshair");
const OUT = join(ROOT, "app/website/src/data/generated/crosshair.json");
const CHECK_ONLY = process.argv.includes("--check");

const rel = (p) => relative(ROOT, p).replace(/\\/g, "/");
const read = (p) => readFileSync(p, "utf8");

// ── 1. 命令库（只用来算「哪些 convar 已被 Valve 删除」）─────────────────────
// 这个结论目前不在页面上展示（用户选择「全部展示，不提交效」），但数据留着，
// 以后要翻开关时不必重新推一遍。
const COMMANDS = join(ROOT, "app/website/src/data/generated/commands.json");
const known = new Set();
if (existsSync(COMMANDS)) {
  for (const c of JSON.parse(read(COMMANDS))) known.add(c.n.toLowerCase());
}

// ── 2. 准星库 c00-c07 ───────────────────────────────────────────────────
/** 取一行的 `convar value`；值可能带引号。 */
const CONVAR_RE = /^(cl_[a-z0-9_]+)\s+"?([^"\s]+)"?/;

const crosshairs = readdirSync(LIB_DIR)
  .filter((f) => f.endsWith(".cfg"))
  .sort()
  .map((f) => {
    const index = f.replace(/\.cfg$/, "");
    const id = `c${index}`;
    const convars = [];
    const removed = [];
    for (const raw of read(join(LIB_DIR, f)).split(/\r?\n/)) {
      const m = raw.match(CONVAR_RE);
      if (!m) continue;
      const entry = { name: m[1], value: m[2] };
      convars.push(entry);
      if (known.size > 0 && !known.has(m[1].toLowerCase())) removed.push(m[1]);
    }
    return {
      id,
      index,
      label: id,
      file: rel(join(LIB_DIR, f)),
      /** 在控制台输入它即可应用本轮换到这个预设 */
      alias: id,
      convars,
      removedConvars: removed,
      image: null,
    };
  });

// ── 3. 视角库 v00-v07（定义在 runtime.cfg 里，不是独立文件）──────────────
const runtime = read(RUNTIME);

const viewmodels = [...runtime.matchAll(/^alias "(v0\d)" "([^"]+)"/gm)].map(([, id, body]) => {
  const params = body
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("viewmodel_"))
    .map((s) => {
      const [name, ...rest] = s.split(/\s+/);
      return { name, value: rest.join(" ") };
    });
  return {
    id,
    index: id.slice(1),
    label: id,
    file: rel(RUNTIME),
    alias: id,
    convars: params,
    removedConvars: params.filter((p) => known.size > 0 && !known.has(p.name.toLowerCase())).map((p) => p.name),
    image: null,
  };
});

// ── 4. 颜色别名（12 个）────────────────────────────────────────────────
const COLORS = [
  "red", "orange", "yellow", "green", "cyan", "blue",
  "purple", "black", "white", "pink", "brown", "gray",
];
const hex = (n) => n.toString(16).padStart(2, "0");
const colors = [];
for (const name of COLORS) {
  const m = runtime.match(new RegExp(`^alias "${name}" "([^"]+)"`, "m"));
  if (!m) continue;
  const rgb = m[1].match(/cl_crosshaircolor_r (\d+);cl_crosshaircolor_g (\d+);cl_crosshaircolor_b (\d+)/);
  if (!rgb) continue;
  const [r, g, b] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  colors.push({ alias: name, r, g, b, hex: `#${hex(r)}${hex(g)}${hex(b)}` });
}

// ── 5. 其它准星相关命令 ────────────────────────────────────────────────
const EXTRAS = ["switchthrow", "keep", "srp_crosshair_dot"];
const EXTRA_NOTES = {
  switchthrow: "在开启 / 关闭投掷物准星之间切换。",
  keep: "投掷时保持自定义准星，不被投掷物准星覆盖。",
};
const extras = EXTRAS.map((name) => {
  const m = runtime.match(new RegExp(`^alias "${name}" "([^"]+)"([^\\n]*)`, "m"));
  if (!m) return null;
  const comment = (m[2] || "").replace(/^\s*\/\/\s*/, "").trim();
  // cfg 里这几个命令的注释是脚本按 body 生成的（“注册 alias…”），对读者没信息量，
  // 所以展示时优先用下面这份编辑文案；数据本体仍取自 cfg。
  return { alias: name, body: m[1], comment: EXTRA_NOTES[name] ?? comment };
}).filter(Boolean);

// ── 6. 图片目录约定 ────────────────────────────────────────────────────
const IMG_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);
const imageByPreset = new Map();
if (existsSync(IMG_DIR)) {
  for (const f of readdirSync(IMG_DIR).sort()) {
    const ext = extname(f).toLowerCase();
    if (!IMG_EXT.has(ext)) continue;
    const id = f.slice(0, -ext.length);
    if (!imageByPreset.has(id)) imageByPreset.set(id, `/images/crosshair/${f}`);
  }
}
for (const p of [...crosshairs, ...viewmodels]) {
  p.image = imageByPreset.get(p.id) ?? null;
}

// ── 7. 入口键（keyc / keyv）────────────────────────────────────────────
const cycles = {
  crosshair: runtime.match(/^alias "(keyc)" /m)?.[1] ?? null,
  viewmodel: runtime.match(/^alias "(keyv)" /m)?.[1] ?? null,
};

// ── 8. 产物 ────────────────────────────────────────────────────────────
const withImage = [...crosshairs, ...viewmodels].filter((p) => p.image).length;
const payload = {
  $comment: "由 scripts/extract-crosshair.mjs 从 config/srp-cfg 生成，请勿手改；改 cfg 后重新运行该脚本。",
  $images: "图片取自 app/website/public/images/crosshair/<预设 id>.<png|jpg|jpeg|webp|avif>，文件名即预设 id。",
  $removed: "removedConvars 记录了改版后已被 Valve 删除的 convar；当前页面不展示该结论，数据保留备用。",
  cycles,
  crosshairs,
  viewmodels,
  colors,
  extras,
};

const json = JSON.stringify(payload, null, 2) + "\n";

// ── 9. 写出 / 校验 ─────────────────────────────────────────────────────
if (CHECK_ONLY) {
  const current = existsSync(OUT) ? read(OUT) : null;
  if (current !== json) {
    console.error("✘ crosshair.json 与 config/ 不一致，请运行 node scripts/extract-crosshair.mjs");
    process.exit(1);
  }
  console.log(
    `✓ crosshair.json 与 config/ 一致（准星 ${crosshairs.length} / 视角 ${viewmodels.length} / ` +
      `颜色 ${colors.length} / 图片 ${withImage}）`,
  );
} else {
  writeFileSync(OUT, json, "utf8");
  const removedTotal = [...crosshairs, ...viewmodels].reduce((n, p) => n + p.removedConvars.length, 0);
  console.log(
    `✓ 已生成 ${rel(OUT)}\n` +
      `  准星 ${crosshairs.length}（c00-c07）· 视角 ${viewmodels.length}（v00-v07）· 颜色 ${colors.length} · 其它命令 ${extras.length}\n` +
      `  图片已就位 ${withImage} 个 · 已删除 convar 合计 ${removedTotal} 处（不展示，仅记录）`,
  );
}
