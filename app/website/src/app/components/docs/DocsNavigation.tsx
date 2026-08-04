/**
 * DocsNavigation —— 文档侧边导航（对应原 DocsNavigation.astro，React 化）。
 * 纯静态渲染（active 态由 currentSlug 决定），移动端/桌面端复用。
 */
import { Link } from "react-router";
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
        to="/docs"
        className="mb-5 flex min-h-11 items-center justify-between rounded-[var(--radius-sm)] border border-border bg-bg-card px-3.5 font-display text-sm font-bold text-text no-underline transition-colors hover:border-border-highlight hover:text-accent"
      >
        <span>全部文档</span>
        <span className="font-mono text-[10px] text-text-faint">INDEX</span>
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
                        "flex min-h-11 items-center rounded-[var(--radius-sm)] border-l-2 px-3 py-2 font-display text-sm font-semibold leading-5 no-underline transition-colors duration-200",
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
