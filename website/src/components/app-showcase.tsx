"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedEffects } from "@/lib/use-reduced-effects";
import { ArrowLeft, ArrowRight, Check, LayoutDashboard, SlidersHorizontal, Layers3, Monitor, Map, Image } from "lucide-react";
import { useI18n } from "@/context/i18n-context";
import { assetPath } from "@/lib/downloads";
import { Reveal } from "./reveal";

const screenIcons = [LayoutDashboard, SlidersHorizontal, Layers3, Monitor, Map];

export function AppShowcase() {
  const { locale, t } = useI18n();
  const [active, setActive] = useState(0);
  const reduce = useReducedEffects();
  const screens = t.showcase.screens;
  const screen = screens[active];
  function select(index: number) { setActive((index + screens.length) % screens.length); }
  return <section id="showcase" className="cs2-band cs2-band-gray showcase-section">
    <div className="content-width section-space">
      <Reveal className="section-heading"><div className="eyebrow">{t.showcase.eyebrow}</div><h2>{t.showcase.title}</h2><p>{t.showcase.description}</p></Reveal>
      <div className="app-showcase">
        <div className="showcase-toolbar">
          <div className="showcase-tabs" role="tablist" aria-label={t.nav.showcase}>{screens.map((item,index) => {
            const Icon = screenIcons[index];
            return <button key={item.id} id={`tab-${item.id}`} role="tab" aria-selected={active === index} aria-controls="app-panel" tabIndex={active === index ? 0 : -1} onClick={() => select(index)} onKeyDown={event => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") return;
              event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? screens.length-1 : (index+(event.key === "ArrowRight" ? 1 : -1)+screens.length)%screens.length;
              select(next); document.getElementById(`tab-${screens[next].id}`)?.focus();
            }}><Icon size={16} aria-hidden="true" />{item.short}</button>;
          })}</div>
        </div>
        <div className="showcase-body" id="app-panel" role="tabpanel" aria-labelledby={`tab-${screen.id}`}>
          <div className="showcase-display">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={`${screen.id}-${locale}`} initial={{ opacity: 0, x: reduce ? 0 : 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -18 }} transition={{ duration: .25 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetPath(`/app/${screen.id}-${locale}.webp`)} alt={screen.title} width="1160" height="750" loading="lazy" />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="showcase-copy" aria-live="polite">
            <span className="showcase-index font-mono">0{active+1} / 0{screens.length}</span><h3>{screen.title}</h3><p>{screen.description}</p>
            <ul>{screen.points.map(point => <li key={point}><Check size={15} aria-hidden="true" /><span>{point}</span></li>)}</ul>
            <div className="showcase-arrows"><button className="icon-button" onClick={() => select(active-1)} aria-label={t.showcase.previous}><ArrowLeft size={18} /></button><button className="icon-button" onClick={() => select(active+1)} aria-label={t.showcase.next}><ArrowRight size={18} /></button></div>
          </div>
        </div>
        <div className="showcase-note"><Image size={15} aria-hidden="true" />{t.showcase.actual}<span className="font-mono">C++ / Qt / QML</span></div>
      </div>
    </div>
  </section>;
}
