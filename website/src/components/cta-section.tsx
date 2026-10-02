"use client";

import React from "react";
import { useI18n } from "@/context/i18n-context";
import { Download, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { GithubIcon } from "@/components/icons";
import { SpotlightCard } from "@/components/spotlight-card";
import { Reveal } from "@/components/reveal";

export function CtaSection() {
  const { t } = useI18n();

  return (
    <section id="download" className="cs2-band cs2-band-orange border-b border-white/[0.08] relative overflow-hidden">
      {/* Linemap overlay */}
      <div className="cs2-linemap-layer opacity-30" />

      {/* Atmospheric Orange Flare */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#ff9e00]/20 blur-[150px] pointer-events-none rounded-full" />

      <div className="cs2-layer">
        <Reveal>
        <SpotlightCard glowColor="orange" className="p-10 sm:p-16 lg:p-20 border-white/[0.16] cs2-board ">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-8 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ff9e00]/20 border border-[#ff9e00]/50 text-xs font-mono font-bold text-[#ff9e00] uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                <span>{t.cta.badge}</span>
              </div>

              <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-[-0.04em] text-white leading-[0.98]">
                {t.cta.title} <br />
                <span className="text-[#ff9e00] drop-">
                  {t.cta.titleHighlight}
                </span>
              </h2>

              <p className="text-base sm:text-xl text-white/80 leading-relaxed max-w-2xl font-normal">
                {t.cta.subtitle}
              </p>

              {/* Guarantees with Icons */}
              <div className="pt-2 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs sm:text-sm font-mono text-white/70">
                <span className="flex items-center gap-2 text-white font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {t.cta.trust1}
                </span>
                <span>•</span>
                <span>{t.cta.trust2}</span>
                <span>•</span>
                <span>{t.cta.trust3}</span>
              </div>
            </div>

            {/* Right Buttons */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <a
                href="https://github.com/RolinShmily/SrP-CFG_ForCS2/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="cs2-action-btn whitespace-nowrap h-14 px-8 rounded-full text-sm flex items-center justify-center gap-2 "
              >
                <Download className="w-5 h-5" />
                <span>{t.cta.downloadBtn}</span>
              </a>

              <a
                href="#keypad"
                className="whitespace-nowrap h-14 px-8 rounded-full border border-white/[0.16] hover:border-[#ff9e00] bg-white/[0.04] hover:bg-white/10 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <span>{t.cta.viewDocsBtn}</span>
                <ArrowRight className="w-4 h-4 text-[#ff9e00]" />
              </a>

              <a
                href="https://github.com/RolinShmily/SrP-CFG_ForCS2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 text-xs font-mono text-white/50 hover:text-white transition-colors"
              >
                <GithubIcon className="w-4 h-4" />
                <span>{t.cta.githubBtn}</span>
              </a>
            </div>
          </div>
        </SpotlightCard>
        </Reveal>
      </div>
    </section>
  );
}
