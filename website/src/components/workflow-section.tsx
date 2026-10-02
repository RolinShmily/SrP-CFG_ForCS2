"use client";

import React from "react";
import { useI18n } from "@/context/i18n-context";
import {
  Workflow,
  DownloadCloud,
  GitCompareArrows,
  Wand2,
  History,
  ArrowUpRight,
} from "lucide-react";
import { SpotlightCard } from "@/components/spotlight-card";
import { Reveal, RevealItem, RevealStagger } from "@/components/reveal";

/** One icon + accent per stage, so the row reads as four distinct instruments. */
const STAGE_META = [
  { icon: DownloadCloud, accent: "#ff9e00" },
  { icon: GitCompareArrows, accent: "#4c93f7" },
  { icon: Wand2, accent: "#10b981" },
  { icon: History, accent: "#ff9e00" },
];

export function WorkflowSection() {
  const { t } = useI18n();

  return (
    <section id="pipeline" className="cs2-band cs2-band-gray border-b border-white/[0.08] overflow-hidden">
      {/* Linemap overlay */}
      <div className="cs2-linemap-layer opacity-25" />

      <div className="cs2-layer">
        <div className="cs2-board p-6 sm:p-10 lg:p-14">
        {/* Band Header */}
        <Reveal className="max-w-3xl space-y-4 pb-10 border-b border-white/[0.09]">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#ff9e00] uppercase bg-[#ff9e00]/[0.09] px-3.5 py-1 rounded-full border border-[#ff9e00]/40 backdrop-blur-md ">
            <Workflow className="w-3.5 h-3.5" />
            <span>DETERMINISTIC PIPELINE // ZERO GUESSWORK</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.04em] text-white leading-tight">
            {t.workflow.title}
          </h2>

          <p className="text-base sm:text-lg text-white/75 max-w-2xl font-normal leading-relaxed">
            {t.workflow.subtitle}
          </p>
        </Reveal>

        {/* Industrial Pipeline Steps */}
        <RevealStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-10">
          {t.workflow.stages.map((stage, idx) => {
            const meta = STAGE_META[idx] ?? STAGE_META[0];
            const Icon = meta.icon;
            const kicker = stage.badge.replace(/^STAGE \d+ · /, "");

            return (
              <RevealItem key={idx}>
              <SpotlightCard
                glowColor="orange"
                tone="base"
                className="cs2-card p-6 sm:p-7 h-full flex flex-col justify-between gap-7"
              >
                {/* Instrument header: icon ring, decorative index, hover arrow */}
                <div className="space-y-5">
                  <div className="flex items-start justify-between">
                    <span className="cs2-icon-ring w-12 h-12">
                      <Icon className="w-5 h-5" style={{ color: meta.accent }} />
                    </span>

                    <span className="relative">
                      <span className="cs2-hover-index font-mono text-3xl font-black text-white leading-none">
                        0{idx + 1}
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="cs2-hover-arrow absolute -top-0.5 -right-4 w-4 h-4"
                        style={{ color: meta.accent }}
                      />
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span
                      className="block text-[10px] font-mono font-bold uppercase tracking-[0.18em]"
                      style={{ color: meta.accent }}
                    >
                      {kicker}
                    </span>

                    <h3 className="text-[17px] font-bold text-white tracking-tight uppercase leading-snug">
                      <span className="cs2-underline">{stage.title}</span>
                    </h3>
                  </div>

                  <p className="text-[13px] text-white/65 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>

                {/* Capability list */}
                <ul className="pt-5 border-t border-white/[0.09] space-y-2.5">
                  {stage.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-[12px] text-white/75 leading-snug">
                      <span
                        className="mt-[3px] shrink-0 font-mono text-[10px] font-bold"
                        style={{ color: meta.accent }}
                      >
                        ▸
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
              </RevealItem>
            );
          })}
        </RevealStagger>
        </div>
      </div>
    </section>
  );
}
