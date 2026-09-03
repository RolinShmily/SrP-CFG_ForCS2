/**
 * DocsNavigation —— 文档侧边导航。
 * 纯静态渲染（active 态由 currentSlug 决定），移动端/桌面端复用。
 */
import { Link } from "react-router";
import { Search } from "lucide-react";
import type { NavGroup } from "./docs-data";

export function DocsNavigation({
  groups,
  currentSlug,
}: {
  groups: NavGroup[];
  currentSlug?: string;
}) {
  return (
    <nav aria-label="文档导航">
      <Link
        to="/commands"
        className="mb-5 flex min-h-10 items-center justify-between rounded-[var(--radius-sm)] border border-border bg-bg-card px-3 font-display text-xs font-semibold text-text-secondary no-underline transition-colors hover:border-accent/40 hover:text-accent"
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-accent" />
          CS2 指令中心
        </span>
        <span className="font-mono text-[10px] text-text-faint">SEARCH</span>
      </Link>

      <div className="space-y-5">
        {groups.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <div className="mb-1.5 flex items-center justify-between px-3">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-text-faint">
                {group.label}
              </span>
              <span className="font-mono text-[10px] text-text-faint">
                {String(group.docs.length).padStart(2, "0")}
              </span>
            </div>
            <ul className="space-y-0.5">
              {group.docs.map((doc) => {
                const active = doc.slug === currentSlug;
                return (
                  <li key={doc.slug}>
                    <Link
                      to={`/docs/${doc.slug}`}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "flex min-h-10 items-center rounded-[var(--radius-sm)] border-l-2 px-3 py-1.5 font-display text-xs font-semibold leading-5 no-underline transition-colors duration-200",
                        active
                          ? "border-accent bg-accent-bg text-accent"
                          : "border-transparent text-text-muted hover:bg-bg-hover hover:text-text",
                      ].join(" ")}
                    >
                      {doc.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}
