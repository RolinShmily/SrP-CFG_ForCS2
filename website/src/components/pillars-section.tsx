"use client";

import React from "react";
import { useI18n } from "@/context/i18n-context";
import { ShieldCheck, Cloud, History, ArrowRight, ArrowUpRight, Zap, CheckCircle2 } from "lucide-react";
import { SpotlightCard } from "@/components/spotlight-card";
import { Reveal, RevealItem, RevealStagger } from "@/components/reveal";

export function PillarsSection() {
  const { t } = useI18n();

  return (
    <section id="architecture" className="cs2-band cs2-band-blue border-b border-white/[0.08] overflow-hidden">
      {/* Linemap overlay */}
      <div className="cs2-linemap-layer opacity-30" />

      {/* Atmospheric CT Blue Glow */}
      <div className="absolute top-1/2 left-1/3 w-[600px] h-[350px] bg-[#3b82f6]/15 blur-[130px] pointer-events-none rounded-full" />

      <div className="cs2-layer">
        {/* One opaque board per section */}
        <div className="cs2-board p-6 sm:p-10 lg:p-14">
        {/* Band Header */}
        <Reveal className="max-w-3xl space-y-4 pb-10 border-b border-white/[0.09]">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#4c93f7] uppercase bg-[#3b82f6]/[0.09] px-3.5 py-1 rounded-full border border-[#3b82f6]/40 backdrop-blur-md ">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CT TACTICAL SECURITY // CORE PROTOCOL</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.04em] text-white leading-tight">
            {t.pillars.title}
          </h2>

          <p className="text-base sm:text-lg text-white/75 max-w-2xl font-normal leading-relaxed">
            {t.pillars.subtitle}
          </p>
        </Reveal>

        {/* Master Comparison Stage (带聚光灯动感的大展台) */}
        <Reveal className="pt-10">
        <SpotlightCard glowColor="blue" className="p-8 sm:p-12 space-y-10 border-white/[0.12] cs2-inner">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-mono font-bold tracking-wider text-[#4c93f7] uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30 inline-block">
                {t.pillars.card1.badge}
              </span>
              <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
                {t.pillars.card1.title}
              </h3>
              <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                {t.pillars.card1.desc}
              </p>
            </div>

            {/* Architecture Comparison Table */}
            <div className="lg:col-span-7 rounded-2xl border border-white/[0.08] cs2-inner-well overflow-hidden font-mono text-xs sm:text-sm shadow-inner">
              <div className="grid grid-cols-2 border-b border-white/[0.08] bg-white/[0.04] p-4 font-bold text-white/60">
                <span>EXTERNAL HOOKS</span>
                <span className="text-[#4c93f7] font-bold">SRP-CFG NATIVE PROTOCOL</span>
              </div>
              <div className="divide-y divide-white/[0.08]">
                <div className="grid grid-cols-2 p-4 gap-4 items-center">
                  <span className="text-white/60">✕ DLL Injections & Memory Patches</span>
                  <span className="text-white font-bold flex items-center gap-1.5 text-emerald-400">
                    ✓ Pure Valve +exec Pipeline
                  </span>
                </div>
                <div className="grid grid-cols-2 p-4 gap-4 items-center">
                  <span className="text-white/60">✕ Permanent VAC Ban Risk</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit border border-emerald-500/30">
                    ✓ 100% VAC-Immune Native Safe
                  </span>
                </div>
                <div className="grid grid-cols-2 p-4 gap-4 items-center">
                  <span className="text-white/60">✕ Breaks with CS2 Updates</span>
                  <span className="text-white font-bold text-emerald-400">
                    ✓ Forward-Compatible Engine Spec
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-panels with Dynamic Hover Lift & Bold Card Elements */}
          <RevealStagger className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/[0.08]">
            {/* Tile Left: Steam Cloud */}
            <RevealItem>
              <div className="cs2-card p-7 space-y-5 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="cs2-icon-ring w-12 h-12">
                      <Cloud className="w-5 h-5 text-[#4c93f7]" />
                    </span>
                    <span className="relative">
                      <span className="cs2-hover-index font-mono text-2xl font-black text-white leading-none">
                        VCFG
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="cs2-hover-arrow absolute -top-0.5 -right-4 w-4 h-4 text-[#4c93f7]"
                      />
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-[0.18em] text-[#4c93f7] uppercase block mb-1">
                      {t.pillars.card2.badge}
                    </span>
                    <h4 className="text-xl font-bold text-white uppercase tracking-tight">
                      <span className="cs2-underline">{t.pillars.card2.title}</span>
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    {t.pillars.card2.desc}
                  </p>
                </div>

                <div className="p-3.5 cs2-inner-well border border-white/[0.08] text-xs font-mono text-white/80 flex items-center justify-between">
                  <span>cs2_user_keys.vcfg</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#4c93f7] group-hover:translate-x-1 transition-transform" />
                  <span>custom.cfg</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#4c93f7] group-hover:translate-x-1 transition-transform" />
                  <span className="text-[#4c93f7] font-bold">CS2 Native</span>
                </div>
              </div>
            </RevealItem>

            {/* Tile Right: Snapshots */}
            <RevealItem>
              <div className="cs2-card p-7 space-y-5 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="cs2-icon-ring w-12 h-12">
                      <History className="w-5 h-5 text-[#ff9e00]" />
                    </span>
                    <span className="relative">
                      <span className="cs2-hover-index font-mono text-2xl font-black text-white leading-none">
                        DIFF
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="cs2-hover-arrow absolute -top-0.5 -right-4 w-4 h-4 text-[#ff9e00]"
                      />
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-[0.18em] text-[#ff9e00] uppercase block mb-1">
                      {t.pillars.card3.badge}
                    </span>
                    <h4 className="text-xl font-bold text-white uppercase tracking-tight">
                      <span className="cs2-underline">{t.pillars.card3.title}</span>
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    {t.pillars.card3.desc}
                  </p>
                </div>

                <div className="p-3.5 cs2-inner-well border border-white/[0.08] text-xs font-mono text-emerald-400 font-bold flex items-center justify-between">
                  <span>snapshot_2026-09-27.zip</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px]">1-Click Restore</span>
                </div>
              </div>
            </RevealItem>
          </RevealStagger>
        </SpotlightCard>
        </Reveal>
        </div>
      </div>
    </section>
  );
}
