"use client";
import { useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useReducedEffects } from "@/lib/use-reduced-effects";
import { Layers3, SlidersHorizontal, Crosshair, UserRound, ArrowRight } from "lucide-react";
import { useI18n } from "@/context/i18n-context";
import { Reveal } from "./reveal";

const codes = ["exec srp-cfg/valve/settings.cfg", "srp_autoview", "bind \"p\" \"srp_practice_keys\"", "sensitivity 1.20"];
const paths = ["valve/settings.cfg", "features/autoview", "modes/practice", "user/custom.cfg"];
const icons = [SlidersHorizontal, Crosshair, Layers3, UserRound];

export function WorkflowSection() {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const [selected, setSelected] = useState(3);
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedEffects();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });
  const pitch = useTransform(smooth, [0,.5,1], [5,-2,-5]);
  const yaw = useTransform(smooth, [0,.5,1], [-7,-4,3]);
  return <section id="assembly" ref={ref} className="cs2-band cs2-band-blue assembly-section">
    <div className="cs2-linemap-layer" />
    <div className="content-width section-space">
      <div className="assembly-grid">
        <Reveal className="assembly-copy"><div className="eyebrow">{t.assembly.eyebrow}</div><h2>{t.assembly.title}<br /><span>{t.assembly.highlight}</span></h2><p>{t.assembly.description}</p>
          <div className="layer-selector" aria-label={t.nav.assembly}>{t.assembly.layers.map((layer,index) => <button key={layer.title} aria-pressed={selected === index} onClick={() => setSelected(index)}><span className="font-mono">0{index+1}</span>{layer.title}<ArrowRight size={16} /></button>)}</div>
          <p className="layer-explanation" aria-live="polite">{t.assembly.layers[selected].description}</p>
          <button className="button button-secondary" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}><Layers3 size={18} />{expanded ? t.assembly.collapse : t.assembly.expand}</button>
        </Reveal>
        <div className="assembly-visual" role="group" aria-label={t.assembly.diagram}>
          <div className="assembly-floor" aria-hidden="true" />
          <div className="layer-stack" data-expanded={expanded || reduce}>
            {t.assembly.layers.map((layer,index) => {
              const Icon = icons[index];
              return <button key={paths[index]} className={`config-plane plane-${index} ${selected === index ? "plane-active" : ""}`} style={{ top: index * (reduce ? 88 : expanded ? 145 : 16), left: expanded && !reduce ? index * 12 : 0, zIndex: expanded || reduce ? index : selected === index ? 10 : index }} aria-label={layer.title} aria-pressed={selected === index} tabIndex={expanded || reduce || selected === index ? 0 : -1} onClick={() => setSelected(index)}>
                {/* Only the decorative surface tilts; text stays at native CSS resolution. */}
                <motion.span className="plane-surface" aria-hidden="true" style={{ rotateX: reduce ? 0 : pitch, rotateY: reduce ? 0 : yaw, rotateZ: reduce ? 0 : (index-1.5)*.7, transformPerspective: 1100 }} />
                <span className="plane-heading"><Icon size={19} aria-hidden="true" /><strong>{layer.title}</strong><span className="font-mono">0{index+1}</span></span>
                <span className="plane-file font-mono">{paths[index]}</span>
                <span className="plane-code font-mono">{codes[index]}</span>
                {index===2 && <span className="plane-hint">{t.assembly.modeHint}</span>}
              </button>;
            })}
          </div>
          <div className="layer-terminal"><div><span className="status-dot" />{t.assembly.codeLabel}<span className="font-mono">custom.cfg</span></div><pre><code>{codes.join("\n")}</code></pre></div>
          <p className="diagram-note">{t.assembly.note}</p>
        </div>
      </div>
      <div className="workflow-strip"><h3>{t.workflow.title}</h3><div>{t.workflow.steps.map((step,index)=><article key={step.title}><span className="font-mono">0{index+1}</span><h4>{step.title}</h4><p>{step.description}</p></article>)}</div></div>
    </div>
  </section>;
}
