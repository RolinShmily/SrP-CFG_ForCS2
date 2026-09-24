/**
 * 页脚（对应原 Footer.astro，React 化）。
 */
import { Link } from "react-router";
import { BookOpen, Download } from "lucide-react";
import { GithubIcon } from "./GithubIcon";
import { REPO_URL, ICP_BEIAN } from "../../data/navigation";

const footerLinks = [
  { to: "/features", label: "功能与按键", icon: BookOpen, external: false },
  { to: "/download", label: "前往下载", icon: Download, external: false },
  { to: REPO_URL, label: "GitHub", icon: GithubIcon, external: true },
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
      <div className="mx-auto mt-7 flex max-w-[1280px] flex-col items-center gap-2 border-t border-border/60 px-5 pt-6 sm:px-7">
        <a
          href={ICP_BEIAN.href}
          target="_blank"
          rel="noopener noreferrer"
          title="工业和信息化部政务服务平台 · ICP/IP地址/域名信息备案管理系统"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-mono text-[11px] tracking-wide text-text-faint no-underline transition-colors duration-200 hover:border-accent/40 hover:bg-accent-bg hover:text-accent-light"
        >
          <img
            src="/images/foot-icp.png"
            alt="ICP 备案图标"
            width="16"
            height="15"
            className="h-[15px] w-4 shrink-0 opacity-85"
          />
          <span>{ICP_BEIAN.number}</span>
        </a>
      </div>
    </footer>
  );
}
