"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { useI18n } from "@/context/i18n-context";
import { Download, ArrowRight, Maximize2, X, Activity } from "lucide-react";
import { SpotlightCard } from "@/components/spotlight-card";
import { ScrollTilt } from "@/components/motion-fx";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Above-the-fold entrance. The stage uses a deeper travel plus a camera pitch
 * so the console appears to rise up to face the viewer rather than simply fade.
 */
const enter = (delay: number, opts: { y?: number; pitch?: number; scale?: number } = {}) => ({
  initial: {
    opacity: 0,
    y: opts.y ?? 36,
    rotateX: opts.pitch ?? 0,
    scale: opts.scale ?? 1,
  },
  animate: { opacity: 1, y: 0, rotateX: 0, scale: 1 },
  transition: { duration: 1.05, delay, ease: EASE },
});

export function HeroSection() {
  const { t } = useI18n();
  const [activeStage, setActiveStage] = useState(3);
  const [modalOpen, setModalOpen] = useState(false);

  const steps = t.walkthrough.steps;
  const currentStep = steps[activeStage] || steps[0];

  return (
    <section id="overview" className="cs2-band cs2-band-header flex flex-col justify-between border-b border-white/[0.08] overflow-hidden">
      {/* Linemap texture overlay */}
      <div className="cs2-linemap-layer opacity-35" />

      {/* Atmospheric Orange Glow behind Master Stage */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#ff9e00]/15 blur-[140px] pointer-events-none rounded-full" />

      <div className="cs2-layer cs2-layer-hero w-full space-y-10">
        {/* Massive Typographic Header */}
        <motion.div data-reveal="" className="space-y-4 max-w-5xl" {...enter(0.05)}>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#ff9e00] uppercase bg-[#ff9e00]/[0.09] px-3.5 py-1 rounded-full border border-[#ff9e00]/40 backdrop-blur-md ">
            <span className="w-2 h-2 rounded-full bg-[#ff9e00] animate-ping" />
            <span>COUNTER-STRIKE 2 // RUNTIME SUITE</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-0.04em] uppercase text-white leading-[1.02]">
            {t.hero.titleLine1}{" "}
            <span className="text-[#ff9e00] drop-">
              {t.hero.titleHighlight}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/75 max-w-2xl font-normal leading-relaxed">
            {t.hero.subtitle}
          </p>

          {/* CTA Cluster */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <a
              href="#download"
              className="cs2-action-btn whitespace-nowrap h-12 px-8 rounded-full text-sm flex items-center justify-center gap-2 "
            >
              <Download className="w-4 h-4" />
              <span>{t.hero.downloadBtn}</span>
            </a>

            <a
              href="#keypad"
              className="whitespace-nowrap h-12 px-7 rounded-full border border-white/[0.16] hover:border-[#ff9e00] cs2-inner backdrop-blur-md text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{t.hero.keybindsBtn}</span>
              <ArrowRight className="w-4 h-4 text-[#ff9e00]" />
            </a>
          </div>
        </motion.div>

        {/* Master Dynamic Spotlight Stage (带聚光灯与动态雷达扫描线的大视窗) */}
        {/* Camera: mounts pitched back, then settles; keeps dollying on scroll. */}
        <ScrollTilt maxPitch={9} minScale={0.965} drift={26}>
        <motion.div data-reveal="" className="cs2-3d" {...enter(0.22, { y: 70, pitch: 12, scale: 0.955 })}>
        <SpotlightCard glowColor="orange" className="border-white/[0.12] cs2-board ">
          {/* Top Bar with Stage Selector */}
          <div className="px-5 py-3 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-1">
              {steps.map((step, idx) => {
                const isActive = idx === activeStage;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStage(idx)}
                    className={`px-2.5 py-1.5 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-[#ff9e00] text-black"
                        : "text-white/55 hover:text-white hover:bg-white/[0.07]"
                    }`}
                  >
                    <span className="opacity-70">{step.num}</span>{" "}
                    <span>{step.tabTitle}</span>
                  </button>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>SUB-TICK ENGINE: ACTIVE</span>
              </span>
              <span className="text-white/50">•</span>
              <span className="text-[#ff9e00] font-semibold">1080P GUI</span>
            </div>
          </div>

          {/* Large Screen Image Display with Dynamic Radar Scanline */}
          <div className="relative aspect-[16/9] sm:aspect-[16/10] w-full bg-black overflow-hidden group">
            {/* Dynamic Radar Scanline (动态雷达扫描光带，赋予视窗生命感) */}
            <div className="radar-scanline" />

            <Image
              src={currentStep.image}
              alt={currentStep.title}
              width={1920}
              height={1080}
              priority
              className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.015]"
            />

            {/* Inspect Button with dynamic hover */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="absolute bottom-5 right-5 flex items-center gap-2 px-4 py-2 rounded-full cs2-inner-raised text-white text-xs font-mono border border-white/[0.12] hover:border-[#ff9e00] hover:text-[#ff9e00] backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
            >
              <Maximize2 className="w-4 h-4" />
              <span>EXPAND FULLSCREEN</span>
            </button>
          </div>

          {/* Stage Info Footer */}
          <div className="p-6 border-t border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#ff9e00] font-bold">
                <span>STAGE 0{activeStage + 1}</span>
                <span>/</span>
                <span className="text-white font-bold text-sm tracking-tight">{currentStep.title}</span>
              </div>
              <p className="text-xs sm:text-sm text-white/70 max-w-3xl mt-1 leading-relaxed">
                {currentStep.desc}
              </p>
            </div>

            <div className="text-xs font-mono text-white/80 shrink-0">
              <span className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-emerald-400 font-bold ">
                ✓ {currentStep.bullet1}
              </span>
            </div>
          </div>
        </SpotlightCard>
        </motion.div>
        </ScrollTilt>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="relative max-w-7xl w-full max-h-[95vh] rounded-[28px] overflow-hidden border border-white/[0.12] bg-black ">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-white/[0.04]">
              <span className="font-mono text-xs text-white">
                [{currentStep.num}] {currentStep.title}
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={currentStep.image}
                alt={currentStep.title}
                width={1920}
                height={1080}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
