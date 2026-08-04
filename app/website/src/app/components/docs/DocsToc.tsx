/**
 * DocsToc —— 本页目录（对应原 DocsToc.astro + DocLayout.astro 的滚动高亮 script，React 化）。
 * Velite s.toc() 输出树（h2 顶层 + items 内 h3），展平渲染，缩进按深度；
 * 滚动高亮用 IntersectionObserver（对齐旧脚本 rootMargin/-112px 逻辑）。
 */
import { useEffect, useMemo, useState } from "react";
import type { TocEntry } from "./docs-data";

interface FlatTocItem {
  id: string;
  text: string;
  depth: number;
}

function flattenToc(toc: TocEntry[]): FlatTocItem[] {
  const out: FlatTocItem[] = [];
  for (const entry of toc) {
    out.push({ id: entry.url.replace(/^#/, ""), text: entry.title, depth: 2 });
    for (const child of entry.items) {
      out.push({ id: child.url.replace(/^#/, ""), text: child.title, depth: 3 });
    }
  }
  return out;
}

export function DocsToc({ toc, roomy = false }: { toc: TocEntry[]; roomy?: boolean }) {
  const links = useMemo(() => flattenToc(toc), [toc]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (links.length === 0) return;
    const elements = links
      .map((link) => document.getElementById(link.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const update = () => {
      let active = elements[0];
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= 150) active = el;
        else break;
      }
      setActiveId(active.id);
    };

    const observer = new IntersectionObserver(update, {
      rootMargin: "-112px 0px -68% 0px",
      threshold: [0, 1],
    });
    elements.forEach((el) => observer.observe(el));
    requestAnimationFrame(update);
    return () => observer.disconnect();
  }, [links]);

  return (
    <nav aria-label="本页目录">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-text-faint">
          On this page
        </span>
        <span className="font-mono text-[10px] text-text-faint">
          {String(links.length).padStart(2, "0")}
        </span>
      </div>
      <ul className="border-l border-border">
        {links.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              data-toc-link
              data-toc-target={item.id}
              aria-current={activeId === item.id ? "location" : undefined}
              className={[
                "-ml-px block border-l pr-2 text-sm leading-5 text-text-muted no-underline transition-colors duration-200 hover:border-border-highlight hover:text-text",
                roomy ? "min-h-11 py-2.5" : "py-1.5",
                item.depth === 3 ? "pl-5" : "pl-3",
                activeId === item.id
                  ? "border-accent text-accent-light"
                  : "border-transparent",
              ].join(" ")}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
