"use client";
import { ArrowUp, ArrowUpRight, BookOpen, GitFork, PackageOpen, Rss, Scale } from "lucide-react";
import { useI18n } from "@/context/i18n-context";
import { assetPath, REPOSITORY, RELEASES } from "@/lib/downloads";

export function Footer() {
  const { t } = useI18n();
  const links = [
    { label: t.footer.project, url: REPOSITORY, icon: GitFork },
    { label: t.footer.docs, url: `${REPOSITORY}#readme`, icon: BookOpen },
    { label: t.footer.releases, url: RELEASES, icon: PackageOpen },
    { label: t.footer.blog, url: "https://blog.srprolin.com", icon: Rss },
  ];
  return (
    <footer className="site-footer">
      <div className="content-width">
        <div className="footer-main">
          <div className="footer-identity">
            <a href="#overview" className="footer-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetPath("/app/icon.webp")} width="40" height="40" alt="" />
              <span>SrP-CFG<span className="text-cs-orange">.</span></span>
            </a>
            <p>{t.footer.description}</p>
          </div>
          <nav className="footer-links" aria-label={t.nav.product}>
            {links.map(({ label, url, icon: Icon }) => (
              <a href={url} key={url} target="_blank" rel="noreferrer">
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© 2024–2026 RoL1n_SrP</span>
          <a className="footer-license" href={`${REPOSITORY}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
            <Scale size={16} aria-hidden="true" />{t.footer.license}<ArrowUpRight size={13} aria-hidden="true" />
          </a>
          <a href="#overview" className="footer-top">
            {t.footer.top}<ArrowUp size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
