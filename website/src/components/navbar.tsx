"use client";
import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useReducedEffects } from "@/lib/use-reduced-effects";
import { ArrowDownToLine, Globe2, Menu, Terminal, X } from "lucide-react";
import { useI18n } from "@/context/i18n-context";
import { assetPath, REPOSITORY } from "@/lib/downloads";
import { GithubIcon } from "./icons";

export function Navbar() {
  const { locale, toggleLocale, t } = useI18n();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if(!open)return;
    const close = (event: KeyboardEvent) => { if(event.key === "Escape")setOpen(false); };
    document.addEventListener("keydown",close);
    return()=>document.removeEventListener("keydown",close);
  },[open]);
  const reduce = useReducedEffects();
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", value => setCompact(value > 90));
  const links = [["#showcase", t.nav.showcase], ["#assembly", t.nav.assembly], ["#download", t.nav.download]];
  return <header className={`site-header ${compact ? "is-compact" : ""}`} data-compact={compact}>
    <a className="skip-link" href="#main-content">{t.nav.skip}</a>
    <motion.div className="nav-islands" layout transition={{ type: "spring", stiffness: 160, damping: 26, duration: reduce ? 0 : undefined }}>
      <a href="#overview" className="nav-brand" aria-label="SrP-CFG">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath("/app/icon.webp")} alt="" width="30" height="30" />
        <span>SrP-CFG</span><span className="brand-dot" aria-hidden="true" />
      </a>
      <nav className="nav-links" aria-label={t.nav.product}>
        {links.map(([href, label]) => <a href={href} key={href}>{label}</a>)}
      </nav>
      <div className="nav-actions">
        <button onClick={toggleLocale} aria-label={t.nav.language} title={t.nav.language}><Globe2 size={16} /><span>{locale === "zh" ? "EN" : "中"}</span></button>
        <a className="github-link" href={REPOSITORY} target="_blank" rel="noreferrer" aria-label="GitHub"><GithubIcon /></a>
        <a className="nav-skill" href="#srpcfg-cli" aria-label={t.nav.skill} title={t.nav.skill} onClick={() => setOpen(false)}><Terminal size={16} aria-hidden="true" /><span>Skill</span></a>
        <a className="nav-download" href="#download" aria-label={t.nav.download}><ArrowDownToLine size={15} /><span>{t.nav.download}</span></a>
        <button className="nav-menu" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? t.nav.close : t.nav.menu} onClick={() => setOpen(!open)}>{open ? <X size={19} /> : <Menu size={19} />}</button>
      </div>
    </motion.div>
    {open && <nav id="mobile-nav" className="mobile-nav" aria-label={t.nav.product}>{links.map(([href, label]) => <a href={href} key={href} onClick={() => setOpen(false)}>{label}</a>)}</nav>}
  </header>;
}
