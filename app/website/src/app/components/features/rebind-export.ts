/**
 * 把个人改键渲染成可直接粘进 custom.cfg 的片段。
 *
 * ── 为什么得分两节 ─────────────────────────────────────────────
 * 配置里两类东西的执行时机不同，导出方式必须跟着变：
 *
 * 1. 预设（srp_apply_xxx）在 custom.cfg 里被调用，而 custom.cfg 是 autoexec 的最后一步。
 *    所以预设的个人覆盖就是普通的 bind 行，写在 preset 行之后即可 —— 这正是
 *    custom.cfg 模板里已经写好的用法。
 *
 * 2. 模块（srp_practice_keys 等）= exec with-keymap.cfg，是**按键时才执行**的。
 *    如果在 custom.cfg 里直接 bind，等你按下入口键应用该模块的键盘映射时，
 *    刚写下的自定义会被它覆盖掉。所以必须重新定义入口 alias，让它在原体之后再套一层：
 *
 *      alias "srp_practice_keys_base" "<入口 alias 原本的 body>"
 *      alias "srp_custom_after_practice" "bind a srp_x;unbind b"
 *      alias "srp_practice_keys" "srp_practice_keys_base;srp_custom_after_practice"
 *
 *    因为 custom.cfg 每次 reload 都在 runtime/commands.cfg 之后执行，
 *    这层包裹会被重新套上，所以 srp_reload 之后依然有效。
 *
 * ── 为什么 alias 体内不带引号 ───────────────────────────────────
 * 仓库里现存 0 条 alias 体使用嵌套转义引号，无法确认游戏端对 \" 的处理，
 * 因此 alias 体内部统一写成 `bind a srp_x` 这种不带引号的 token 形式（控制台同样接受），
 * 从根上避开转义问题。键名或目标含引号 / 空格的条目会被跳过并单独报出。
 */

import { aliasByName, keymaps, type RebindMap } from "./keymaps-data";

/** 一个「预设 + 已开模块」上下文，连同它名下的个人改键。 */
export interface ExportContext {
  presetId: string;
  /** 按开启顺序，最后一个是最后应用的 */
  moduleIds: string[];
  rebinds: RebindMap;
}

export interface ExportResult {
  text: string;
  /** 生效的改键条数 */
  count: number;
  /** 无法安全写出的条目（键名或目标含引号/空格） */
  skipped: { key: string; target: string }[];
}

/** 能直接以不带引号形式写进 cfg 的 token。 */
const SAFE_TOKEN = /^[A-Za-z0-9_+\-.:*]+$/;

const layerById = (id: string) => keymaps.layers.find((l) => l.id === id);

const quotes = (s: string) => `"${s}"`;

/**
 * 生成改键片段。
 * @param contexts 所有上下文；没有改键的上下文会被忽略
 */
export function generateRebindCfg(contexts: ExportContext[]): ExportResult {
  const active = contexts.filter((c) => Object.keys(c.rebinds).length > 0);
  const skipped: { key: string; target: string }[] = [];

  const total = active.reduce((n, c) => n + Object.keys(c.rebinds).length, 0);
  if (total === 0) return { text: "", count: 0, skipped };

  const out: string[] = [
    "// ============================================================",
    "// SrP-CFG 个人改键",
    `// 由 cfg.srprolin.top/features 生成，共 ${total} 处`,
    "//",
    "// 用法：把这段内容并入 srp-cfg/user/custom.cfg，放在 srp_apply_xxx 那一行之后。",
    "// 如果你是直接下载了 custom.cfg，请先与已有文件合并再替换，",
    "// 不要整体覆盖——那会丢掉你自己的预设选择与其他个人设置。",
    "// 模块部分重新定义了入口 alias，所以按下入口键应用键盘映射时你的改键依然生效，",
    "// srp_reload 之后也不会丢。同一按键出现在多段里时，后面的段覆盖前面的。",
    "// ============================================================",
    "",
  ];

  let emitted = 0;

  /** 把一批改键写成 bind / unbind 行（带引号，cfg 顶层写法）。 */
  const writeTopLevel = (rebinds: RebindMap) => {
    for (const key of Object.keys(rebinds).sort()) {
      const target = rebinds[key];
      if (!SAFE_TOKEN.test(key) || (target !== null && !SAFE_TOKEN.test(target))) {
        skipped.push({ key, target: target ?? "(unbind)" });
        continue;
      }
      out.push(target === null ? `unbind ${quotes(key)}` : `bind ${quotes(key)} ${quotes(target)}`);
      emitted++;
    }
  };

  /** 把一批改键写成 alias 体内的形式（不带引号，避开转义）。 */
  const writeAliasBody = (rebinds: RebindMap) =>
    Object.keys(rebinds)
      .sort()
      .flatMap((key) => {
        const target = rebinds[key];
        if (!SAFE_TOKEN.test(key) || (target !== null && !SAFE_TOKEN.test(target))) {
          skipped.push({ key, target: target ?? "(unbind)" });
          return [];
        }
        emitted++;
        return [target === null ? `unbind ${key}` : `bind ${key} ${target}`];
      });

  for (const ctx of active) {
    const preset = layerById(ctx.presetId);
    const modules = ctx.moduleIds.map(layerById).filter((l): l is NonNullable<typeof l> => Boolean(l));
    const last = modules[modules.length - 1];

    if (!last) {
      // ── 只有预设：直接 bind 即可 ──
      out.push(`// ── 预设个人覆盖：${preset?.label ?? ctx.presetId}（${ctx.presetId}）──`);
      out.push(`// custom.cfg 在 srp_apply_xxx 之后执行，直接 bind 就压得住。`);
      writeTopLevel(ctx.rebinds);
      out.push("");
      continue;
    }

    // ── 有模块：包住最后应用的那个模块的入口 alias ──
    const entry = last.entryAlias;
    const entryBody = entry ? aliasByName.get(entry)?.body : undefined;
    if (!entry || !entryBody) {
      // 入口 alias 取不到（配置改名等）→ 退化成顶层 bind 并说明风险
      out.push(`// ── 上下文：${preset?.label ?? ctx.presetId} + ${modules.map((m) => m.label).join(" / ")} ──`);
      out.push(`// ⚠ 取不到模块 ${last.id} 的入口 alias，只能写成顶层 bind；`);
      out.push(`//   按下该模块的入口键后这些绑定会被它的键盘映射覆盖。`);
      writeTopLevel(ctx.rebinds);
      out.push("");
      continue;
    }

    const suffix = last.name.replace(/[^A-Za-z0-9]/g, "_");
    const baseAlias = `srp_${suffix}_keys_base`;
    const customAlias = `srp_custom_after_${suffix}`;
    const body = writeAliasBody(ctx.rebinds);

    out.push(`// ── 上下文：${preset?.label ?? ctx.presetId} + ${modules.map((m) => m.label).join(" / ")} ──`);
    out.push(`// ${last.id} 是按键时才应用键盘映射的，必须包住它的入口 alias ${entry}。`);
    out.push(`alias ${quotes(baseAlias)} ${quotes(entryBody)}`);
    out.push(`alias ${quotes(customAlias)} ${quotes(body.join(";"))}`);
    out.push(`alias ${quotes(entry)} ${quotes(`${baseAlias};${customAlias}`)}`);
    out.push("");
  }

  if (skipped.length > 0) {
    out.push("// ⚠ 以下条目含引号或空格，无法安全写出，请手工处理：");
    for (const s of skipped) out.push(`//   ${s.key} → ${s.target}`);
    out.push("");
  }

  return { text: out.join("\n"), count: emitted, skipped };
}
