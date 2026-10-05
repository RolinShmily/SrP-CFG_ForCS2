"use client";
import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useReducedEffects } from "@/lib/use-reduced-effects";
import { ArrowDown, ArrowDownToLine, ArrowUpRight, Monitor } from "lucide-react";
import { useI18n } from "@/context/i18n-context";
import { assetPath } from "@/lib/downloads";

export function HeroSection() {
  const { locale, t } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedEffects();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 28 });
  const yMain = useTransform(progress, [0, 1], [0, -100]);
  const yBack = useTransform(progress, [0, 1], [0, -200]);
  const rotate = useTransform(progress, [0, 1], [-10, 3]);
  return <section id="overview" ref={ref} className="cs2-band cs2-band-header product-hero">
    <div className="cs2-linemap-layer" />
    <div className="hero-content content-width">
      <motion.div className="hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }} data-reveal>
        <div className="eyebrow"><span className="status-dot" />{t.hero.eyebrow}</div>
        <h1>{t.hero.title}<br /><span>{t.hero.highlight}</span></h1>
        <p>{t.hero.description}</p>
        <div className="button-row"><a className="button button-primary" href="#download"><ArrowDownToLine size={18} />{t.hero.download}</a><a className="button button-secondary" href="#showcase">{t.hero.explore}<ArrowUpRight size={18} /></a></div>
        <div className="hero-platform"><Monitor size={15} />{t.hero.platform}</div>
      </motion.div>
      <div className="hero-stage" aria-label={t.hero.floatingLabel}>
        <div className="stage-orbit orbit-one" aria-hidden="true" /><div className="stage-orbit orbit-two" aria-hidden="true" />
        <motion.div className="floating-window window-back" style={{ y: reduce ? 0 : yBack, rotateY: -17, rotateZ: -7 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath(`/app/assembly-${locale}.webp`)} alt={t.showcase.screens[2].title} width="1160" height="750" />
          <span className="window-caption">03 / {t.showcase.screens[2].short}</span>
        </motion.div>
        <motion.div className="floating-window window-main" style={{ y: reduce ? 0 : yMain, rotateY: reduce ? 0 : rotate }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath(`/app/overview-${locale}.webp`)} alt={t.showcase.screens[0].title} width="1160" height="750" fetchPriority="high" />
        </motion.div>
        <motion.div className="floating-window window-front" style={{ y: reduce ? 0 : yBack, rotateY: 12, rotateZ: 5 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath(`/app/video-${locale}.webp`)} alt={t.showcase.screens[3].title} width="1160" height="750" />
          <span className="window-caption">04 / {t.showcase.screens[3].short}</span>
        </motion.div>
        <div className="stage-label"><span className="status-dot" />{t.hero.floatingLabel}<span className="font-mono">Qt + HuskarUI</span></div>
      </div>
    </div>
    <a href="#showcase" className="hero-scroll"><ArrowDown size={16} />{t.hero.scroll}<span>01 — 04</span></a>
  </section>;
}
