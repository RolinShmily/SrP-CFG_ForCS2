/**
 * CommandPicker —— 改键时的命令选单。
 *
 * 候选是 config/srp-cfg 里全部 srp_* alias（410 个唯一名），按来源分组、可搜。
 * 分组就是「这个 alias 属于哪块配置」，点进去能直接对上仓库文件，所以每组标题都带路径提示。
 *
 * 两个可选的辅助信息，都是为了让「绑之前心里有数」：
 * - usage：该 alias 在当前生效键位里已经绑在哪个键上（避免重复绑同一命令而不知情）
 * - autoComment：注释是脚本按 body 生成的摘要时不再重复显示 body 内容
 */
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ALIAS_GROUPS, keymaps, type AliasDef, type AliasGroup } from "./keymaps-data";

interface CommandPickerProps {
  /** 选中命令；传 null 表示把这个键清空（unbind） */
  onPick: (target: string | null) => void;
  /** alias 名 → 当前生效键位里绑它的键（用于「已被 X 占用」提示） */
  usage: Map<string, string>;
}

const GROUP_LABEL = new Map(ALIAS_GROUPS.map((g) => [g.id, g.label]));
const GROUP_HINT = new Map(ALIAS_GROUPS.map((g) => [g.id, g.hint]));
const GROUP_ORDER = ALIAS_GROUPS.map((g) => g.id);

export function CommandPicker({ onPick, usage }: CommandPickerProps) {
  const [query, setQuery] = useState("");
  const [hideMechanical, setHideMechanical] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return keymaps.aliasCatalog.filter((a) => {
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.comment.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q)
      );
    });
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<AliasGroup, AliasDef[]>();
    for (const a of filtered) {
      // 机械转发仅在显式勾选时才折叠；默认全都展示，它们同样是有信息量的命令
      if (hideMechanical && a.autoComment && !a.reachable) continue;
      const list = map.get(a.group);
      if (list) list.push(a);
      else map.set(a.group, [a]);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
      id: g,
      label: GROUP_LABEL.get(g) ?? g,
      hint: GROUP_HINT.get(g) ?? "",
      items: map.get(g) as AliasDef[],
    }));
  }, [filtered, hideMechanical]);

  const shown = grouped.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="rounded-[8px] border border-border bg-bg-raised">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索命令名、说明或内容"
            className="w-full rounded-[6px] border border-border bg-bg py-1.5 pl-8 pr-8 text-xs text-text outline-none focus:border-border-highlight"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-faint hover:text-text"
              aria-label="清空搜索"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onPick(null)}
          className="rounded-[6px] border border-border px-2.5 py-1.5 text-xs text-text-muted hover:border-border-highlight hover:text-text"
        >
          清空该键
        </button>
        <span className="font-mono text-[10px] text-text-faint">
          {shown} / {keymaps.aliasCatalog.length}
        </span>
      </div>

      <div className="max-h-[340px] overflow-y-auto p-2">
        {grouped.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-text-faint">没有匹配的命令。</p>
        )}

        {grouped.map((g) => (
          <div key={g.id} className="mb-1">
            <div className="sticky top-0 z-10 flex items-baseline gap-2 bg-bg-raised px-2 py-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">{g.label}</span>
              {g.hint && <span className="font-mono text-[10px] text-text-faint">{g.hint}</span>}
              <span className="font-mono text-[10px] text-text-faint">{g.items.length}</span>
            </div>
            <ul>
              {g.items.map((a) => {
                const usedOn = usage.get(a.name);
                return (
                  <li key={a.name}>
                    <button
                      type="button"
                      onClick={() => onPick(a.name)}
                      className="flex w-full items-baseline gap-2 rounded-[6px] px-2 py-1.5 text-left hover:bg-bg-hover"
                    >
                      <span className="shrink-0 font-mono text-[11px] text-accent">{a.name}</span>
                      {usedOn && (
                        <span className="shrink-0 rounded border border-border px-1 font-mono text-[9px] text-text-faint">
                          已绑 {usedOn}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-[11px] text-text-muted">
                        {a.autoComment ? a.body : a.comment || a.body}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <input
          id="hide-mechanical"
          type="checkbox"
          checked={hideMechanical}
          onChange={(e) => setHideMechanical(e.target.checked)}
          className="h-3 w-3 accent-[var(--color-accent)]"
        />
        <label htmlFor="hide-mechanical" className="text-[10px] text-text-faint">
          只看当前层会用到的与手写说明的（过滤掉未被引用、且说明是脚本按内容生成的条目）
        </label>
      </div>
    </div>
  );
}
