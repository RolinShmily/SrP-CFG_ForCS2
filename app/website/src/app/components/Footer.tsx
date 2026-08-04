/**
 * 页脚（对应原 Footer.astro，React 化）。
 */
import { Link } from "react-router";
import { BookOpen, Download, Github } from "lucide-react";
import { REPO_URL } from "../../data/navigation";

const footerLinks = [
  { to: "/docs", label: "项目文档", icon: BookOpen, external: false },
  { to: "/download", label: "前往下载", icon: Download, external: false },
  { to: REPO_URL, label: "GitHub", icon: Github, external: true },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-9 sm:py-12">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 px-5 sm:px-7 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <img src="/favicon.ico" alt="" width="28" height="28" className="h-7 w-7 rounded-md" />
          <div>
            <span className="block font-display text-sm font-bold tracking-[0.08em] text-text-secondary">
              SrP-CFG
            </span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
              CS2 configuration runtime
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {footerLinks.map((link) => {
            const Icon = link.icon;
            const cls =
              "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 font-display text-sm font-semibold text-text-muted no-underline transition-colors duration-200 hover:bg-bg-hover hover:text-accent";
            return link.external ? (
              <a
                key={link.label}
                href={link.to}
                target="_blank"
                rel="noopener"
                className={cls}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </a>
            ) : (
              <Link key={link.label} to={link.to} className={cls}>
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
