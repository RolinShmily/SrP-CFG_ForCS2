import { useEffect, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import {
  ArrowDownToLine,
  Globe2,
  Menu,
  SquareTerminal,
  Terminal,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router";

import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import { assetPath, REPOSITORY } from "@/lib/downloads";
import { GithubIcon } from "./icons";

export function Navbar() {
  const { locale, toggleLocale, t } = useI18n();
  const location = useLocation();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (value) => setCompact(value > 90));

  const isConsole = location.pathname.startsWith("/console");
  const isHome = location.pathname === "/";
  const consoleCopyText = consoleCopy[locale];

  const links = [
    { to: "/#showcase", label: t.nav.showcase, hash: "#showcase" },
    { to: "/#assembly", label: t.nav.assembly, hash: "#assembly" },
    { to: "/#download", label: t.nav.download, hash: "#download" },
  ];

  const consoleLinks = [
    { to: "/console", label: consoleCopyText.nav.overview, end: true },
    { to: "/console/convars", label: consoleCopyText.nav.convars, end: false },
    { to: "/console/commands", label: consoleCopyText.nav.commands, end: false },
    { to: "/console/categories", label: consoleCopyText.nav.categories, end: false },
    { to: "/console/flags", label: consoleCopyText.nav.flags, end: false },
    { to: "/console/changes", label: consoleCopyText.nav.changes, end: false },
  ];

  return (
    <header className={`site-header ${compact ? "is-compact" : ""}`}>
      <a className="skip-link" href="#main-content">{t.nav.skip}</a>

      <div className={`nav-bar ${isConsole ? "nav-bar-console" : ""}`}>
        <div className="nav-bar-main">
          <Link to="/#overview" className="nav-brand" prefetch="intent" aria-label="SrP-CFG">
            <img src={assetPath("/app/icon.webp")} alt="" width="30" height="30" />
            <span>SrP-CFG</span><span className="brand-dot" aria-hidden="true" />
          </Link>

          <nav className="nav-links" aria-label={t.nav.product}>
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                prefetch="intent"
                className={isHome && location.hash === link.hash ? "active" : undefined}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/console"
              prefetch="intent"
              className={`nav-console-link ${isConsole ? "active" : ""}`}
              aria-current={isConsole ? "page" : undefined}
            >
              <SquareTerminal size={15} aria-hidden="true" />
              {t.nav.console}
            </Link>
          </nav>

          <div className="nav-actions">
            <button
              type="button"
              onClick={toggleLocale}
              aria-label={t.nav.language}
              title={t.nav.language}
            >
              <Globe2 size={16} />
              <span>{locale === "zh" ? "EN" : "中"}</span>
            </button>
            <a
              className="github-link"
              href={REPOSITORY}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
            >
              <GithubIcon />
            </a>
            <Link
              className="nav-skill"
              to="/#srpcfg-cli"
              prefetch="intent"
              aria-label={t.nav.skill}
              title={t.nav.skill}
            >
              <Terminal size={16} aria-hidden="true" />
              <span>Skill</span>
            </Link>
            <Link
              className="nav-download"
              to="/#download"
              prefetch="intent"
              aria-label={t.nav.download}
            >
              <ArrowDownToLine size={15} aria-hidden="true" />
              <span>{t.nav.download}</span>
            </Link>
            <button
              className="nav-menu"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? t.nav.close : t.nav.menu}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {isConsole && (
          <nav className="console-subnav" aria-label="Console">
            {consoleLinks.map((link) => {
              const active = link.end
                ? location.pathname === link.to || location.pathname === `${link.to}/`
                : location.pathname === link.to || location.pathname.startsWith(`${link.to}/`);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  prefetch="intent"
                  className={active ? "active" : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {open && (
          <nav id="mobile-nav" className="mobile-nav" aria-label={t.nav.product}>
            {links.map((link) => (
              <Link
                to={link.to}
                key={link.to}
                prefetch="intent"
                className={isHome && location.hash === link.hash ? "active" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/console"
              prefetch="intent"
              className={isConsole ? "active" : undefined}
              onClick={() => setOpen(false)}
            >
              {t.nav.console}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
