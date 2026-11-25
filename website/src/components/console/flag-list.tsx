import { Link } from "react-router";

import { flagPath } from "@/lib/console/paths";

const HIGHLIGHT_FLAGS = new Set(["cheat", "archive", "replicated", "developmentonly", "defensive"]);

export function FlagList({ flags }: { flags: string[] }) {
  if (!flags.length) {
    return <span className="font-mono text-xs text-muted">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {flags.map((flag) => {
        const highlight = HIGHLIGHT_FLAGS.has(flag);
        return (
          <Link
            key={flag}
            prefetch="intent"
            to={flagPath(flag)}
            className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] transition ${
              flag === "cheat"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:border-rose-400/60"
                : flag === "archive"
                  ? "border-cs-emerald/30 bg-cs-emerald/10 text-cs-emerald hover:border-cs-emerald/60"
                  : highlight
                    ? "border-cs-orange/30 bg-cs-orange/10 text-amber-300 hover:border-cs-orange/60"
                    : "border-line bg-canvas/80 text-dim hover:border-line-strong hover:text-ink"
            }`}
          >
            {flag}
          </Link>
        );
      })}
    </div>
  );
}
