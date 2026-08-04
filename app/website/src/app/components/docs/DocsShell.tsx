/**
 * DocsShell —— 文档详情页外壳（对应原 DocLayout.astro 的布局 + script，React 化）。
 * - 移动端：sticky 双按钮（文档菜单/本页目录）+ 底部弹出面板（Escape/关闭按钮/断点自动收起）
 * - 桌面：三栏 grid（220px 导航 | 文章 | 220px TOC），导航/TOC sticky
 * Nav/Footer 由全局 layout.tsx 提供。
 */
import { useEffect, useState, type ReactNode } from "react";
import { Menu, TableOfContents, X } from "lucide-react";
import { navGroups, type TocEntry } from "./docs-data";
import { DocsNavigation } from "./DocsNavigation";
import { DocsToc } from "./DocsToc";
type Panel = "menu" | "toc" | null;

export function DocsShell({
  currentSlug,
  toc,
  children,
}: {
  currentSlug: string;
  toc: TocEntry[];
  children: ReactNode;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const close = () => setPanel(null);
  const toggle = (name: Exclude<Panel, null>) =>
    setPanel((prev) => (prev === name ? null : name));

  // Escape 关闭 / body 滚动锁定 / 断点 ≥1024px 自动收起
  useEffect(() => {
    if (!panel) return;
    document.body.classList.add("doc-panel-open");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const media = window.matchMedia("(min-width: 1024px)");
    const onMedia = (event: MediaQueryListEvent) => {
      if (event.matches) close();
    };
    document.addEventListener("keydown", onKey);
    media.addEventListener("change", onMedia);
    return () => {
      document.body.classList.remove("doc-panel-open");
      document.removeEventListener("keydown", onKey);
      media.removeEventListener("change", onMedia);
    };
  }, [panel]);

  const mobileBarBtn =
    "flex min-h-12 items-center justify-center gap-2 text-sm font-semibold text-text-muted transition-colors hover:bg-bg-hover hover:text-text";

  return (
    <div data-doc-layout>
      <div className="sticky top-16 z-[70] mt-16 border-b border-border bg-bg-card lg:hidden">
        <div className="grid grid-cols-2">
          <button
            type="button"
            onClick={() => toggle("menu")}
            aria-label="打开文档菜单"
            aria-controls="mobile-doc-menu"
            aria-expanded={panel === "menu"}
            className={`${mobileBarBtn} border-r border-border`}
          >
            <Menu className="h-4 w-4" />
            文档菜单
          </button>
          <button
            type="button"
            onClick={() => toggle("toc")}
            disabled={toc.length === 0}
            aria-label="打开本页目录"
            aria-controls="mobile-toc-panel"
            aria-expanded={panel === "toc"}
            className={`${mobileBarBtn} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <TableOfContents className="h-4 w-4" />
            本页目录
          </button>
        </div>
      </div>

      {panel === "menu" && (
        <div
          id="mobile-doc-menu"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-doc-menu-title"
          tabIndex={-1}
          className="fixed inset-x-0 bottom-0 top-28 z-[60] overflow-y-auto bg-bg px-5 py-5 lg:hidden"
        >
          <div className="mx-auto max-w-[720px]">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <p id="mobile-doc-menu-title" className="font-display text-lg font-bold">
                浏览文档
              </p>
              <button
                type="button"
                onClick={close}
                className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-border text-text-muted"
                aria-label="关闭文档菜单"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DocsNavigation groups={navGroups} currentSlug={currentSlug} />
          </div>
        </div>
      )}

      {panel === "toc" && (
        <div
          id="mobile-toc-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-toc-title"
          tabIndex={-1}
          className="fixed inset-x-0 bottom-0 top-28 z-[60] overflow-y-auto bg-bg px-5 py-5 lg:hidden"
        >
          <div className="mx-auto max-w-[720px]">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <p id="mobile-toc-title" className="font-display text-lg font-bold">
                本页目录
              </p>
              <button
                type="button"
                onClick={close}
                className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-border text-text-muted"
                aria-label="关闭本页目录"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DocsToc toc={toc} roomy />
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-5 py-10 sm:px-7 lg:grid-cols-[220px_minmax(0,760px)] lg:justify-center lg:gap-10 lg:pb-20 lg:pt-28 xl:grid-cols-[220px_minmax(0,760px)_220px] xl:gap-12">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <DocsNavigation groups={navGroups} currentSlug={currentSlug} />
          </div>
        </aside>

        <article className="min-w-0 pb-8">{children}</article>

        <aside className="hidden xl:block">
          {toc.length > 0 && (
            <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-8 pr-1">
              <DocsToc toc={toc} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
