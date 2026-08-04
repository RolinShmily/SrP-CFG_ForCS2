/**
 * 主导航（对应原 Nav.astro，React 化）。
 * 使用 react-router 的 NavLink 提供 active 状态；移动端菜单为纯 CSS 折叠交互。
 */
import { useState } from "react";
import { NavLink } from "react-router";
import { Github, Menu, X } from "lucide-react";
import { navLinks, REPO_URL } from "../../data/navigation";

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-[100] border-b border-border bg-bg/95" aria-label="主导航">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-5 sm:px-7">
        <NavLink
          to="/"
          className="group flex min-h-11 items-center gap-3 no-underline"
          aria-label="SrP-CFG 首页"
        >
          <img src="/favicon.ico" alt="" width="32" height="32" className="h-8 w-8 rounded-[7px]" />
          <span className="leading-none">
            <span className="block font-display text-lg font-bold tracking-[0.08em] text-text group-hover:text-accent">
              SrP-CFG
            </span>
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint">
              v3 Runtime
            </span>
          </span>
        </NavLink>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.href === "/"}
              className={({ isActive }) =>
                `inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-4 font-display text-sm font-semibold no-underline transition-colors duration-200 ${
                  isActive
                    ? "bg-accent-bg text-accent"
                    : "text-text-muted hover:bg-bg-hover hover:text-text"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 font-display text-sm font-semibold text-text-muted no-underline transition-colors duration-200 hover:bg-bg-hover hover:text-text"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-bg-card text-text-secondary transition-colors hover:border-border-highlight hover:text-text md:hidden"
          aria-label={mobileOpen ? "关闭主导航" : "打开主导航"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-border bg-bg md:hidden">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-1 px-5 py-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                end={link.href === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-4 font-display text-sm font-semibold no-underline transition-colors duration-200 ${
                    isActive
                      ? "bg-accent-bg text-accent"
                      : "text-text-muted hover:bg-bg-hover hover:text-text"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
