"use client";

import React, { useState } from "react";
import { useI18n } from "@/context/i18n-context";
import { Copy, Check, Terminal, Crosshair, Zap } from "lucide-react";
import { SpotlightCard } from "@/components/spotlight-card";
import { Reveal } from "@/components/reveal";
import { TiltCard } from "@/components/motion-fx";

export function KeybindsSection() {
  const { t } = useI18n();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [simulatedLog, setSimulatedLog] = useState<string | null>(null);

  const items = t.keybinds.items;
  const currentItem = items[selectedIdx] || items[0];

  const handleCopy = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleKeyClick = (idx: number, keyName: string) => {
    setSelectedIdx(idx);
    setSimulatedLog(`[ENGINE] Key '${keyName}' executed -> Sub-tick synchronized.`);
    setTimeout(() => setSimulatedLog(null), 2500);
  };

  return (
    <section id="keypad" className="cs2-band cs2-band-orange border-b border-white/[0.08] overflow-hidden">
      {/* Linemap overlay */}
      <div className="cs2-linemap-layer opacity-25" />

      {/* Atmospheric Orange Glow */}
      <div className="absolute top-1/2 right-1/4 w-[650px] h-[350px] bg-[#ff9e00]/15 blur-[140px] pointer-events-none rounded-full" />

      <div className="cs2-layer">
        <div className="cs2-board p-6 sm:p-10 lg:p-14">
        {/* Band Header */}
        <Reveal className="max-w-3xl space-y-4 pb-10 border-b border-white/[0.09]">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#ff9e00] uppercase bg-[#ff9e00]/[0.09] px-3.5 py-1 rounded-full border border-[#ff9e00]/40 backdrop-blur-md ">
            <Crosshair className="w-3.5 h-3.5" />
            <span>TACTICAL COMMAND MATRIX // ZERO MISS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.04em] text-white leading-tight">
            {t.keybinds.title}
          </h2>

          <p className="text-base sm:text-lg text-white/80 max-w-2xl font-normal leading-relaxed">
            {t.keybinds.subtitle}
          </p>
        </Reveal>

        {/* Master Keypad Console Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-10">
          {/* Left Column: Physical Tactical Keypads */}
          <Reveal direction="right" className="lg:col-span-6">
          <TiltCard className="h-full" intensity={6}>
          <SpotlightCard glowColor="orange" className="p-8 h-full flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] text-xs font-mono text-white/50">
                <span className="text-white font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff9e00] animate-pulse" />
                  KEYPAD MATRIX // SELECT KEYCAP
                </span>
                <span className="text-emerald-400 font-bold">SUB-TICK ENGINE</span>
              </div>

              {/* Grid of Keycaps with Backlit Mechanical Feel */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6">
                {items.map((item, idx) => {
                  const isSelected = idx === selectedIdx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleKeyClick(idx, item.key)}
                      className={`h-24 p-4 rounded-2xl flex flex-col justify-between text-left transition-all duration-300 relative group/key overflow-hidden ${
                        isSelected
                          ? "bg-[#ff9e00] text-black font-black scale-[1.03] translate-y-0.5"
                          : "cs2-card hover:border-[#ff9e00]/50 hover:-translate-y-1 text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`font-mono text-xs font-black uppercase tracking-wider ${isSelected ? "text-black" : "text-[#ff9e00]"}`}>
                          {item.key}
                        </span>
                        {isSelected ? (
                          <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                        ) : (
                          <span className="cs2-hover-index text-[11px] font-mono font-bold text-white/40">
                            0{idx + 1}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs truncate font-bold ${isSelected ? "text-black" : "text-white/80 group-hover/key:text-white"}`}>
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hint Strip */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-white/50">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>SUB-TICK 128 SYNCHRONIZED</span>
              </span>
              <span>DELAY: 0.00ms</span>
            </div>
          </SpotlightCard>
          </TiltCard>
          </Reveal>

          {/* Right Column: Key Details & Dynamic Tactical Preview Box */}
          <Reveal direction="left" delay={0.12} className="lg:col-span-6">
          <TiltCard className="h-full" intensity={6}>
          <SpotlightCard glowColor="orange" className="p-8 h-full flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Category & Status Bar */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="px-3 py-1 rounded-full bg-[#ff9e00] text-black font-black uppercase ">
                  ACTIVE: {currentItem.key}
                </span>
                <span className="text-white/50 uppercase tracking-widest text-[11px]">
                  CATEGORY // {currentItem.category}
                </span>
              </div>

              {/* Title & Tactical Utility */}
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                  {currentItem.name}
                </h3>
                <p className="text-sm text-white/75 leading-relaxed">
                  {currentItem.desc}
                </p>
              </div>

              {/* Visual Tactical Simulation Reticle Box with Radar Scanline */}
              <div className="cs2-inner-well p-4 relative overflow-hidden ">
                {/* Micro Radar Scanline inside preview */}
                <div className="radar-scanline" />

                <div className="flex items-center justify-between text-[11px] font-mono text-white/50 mb-3 pb-2 border-b border-white/[0.08]">
                  <span className="flex items-center gap-1.5 text-white font-bold">
                    <Crosshair className="w-3.5 h-3.5 text-[#ff9e00]" />
                    <span>TACTICAL SIMULATION RADAR</span>
                  </span>
                  <span className="text-emerald-400 font-bold">SYNC: ACTIVE</span>
                </div>

                {/* Mock Visual Graphic according to category */}
                <div className="h-28 rounded-2xl bg-white/[0.04] border border-white/[0.08] relative flex items-center justify-center overflow-hidden">
                  {currentItem.category === "crosshair" && (
                    <div className="relative flex items-center justify-center">
                      <div className="w-56 h-[2px] bg-emerald-400 absolute" />
                      <div className="h-56 w-[2px] bg-emerald-400 absolute" />
                      <div className="w-5 h-5 rounded-full border-2 border-emerald-400 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <span className="absolute bottom-1 right-2 text-[10px] font-mono text-emerald-400 font-bold">
                        LINEUP CROSSHAIR: 1000px
                      </span>
                    </div>
                  )}

                  {currentItem.category === "movement" && (
                    <div className="flex items-center gap-6 text-xs font-mono">
                      <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center ">
                        <span className="block text-[#ff9e00] font-black text-xl">0.00ms</span>
                        <span className="text-[10px] text-white/50 uppercase">Release Delta</span>
                      </div>
                      <div className="text-center">
                        <span className="text-emerald-400 text-sm font-black uppercase">100% Consistent</span>
                        <span className="block text-[10px] text-white/50 uppercase">Sub-tick Tickmargin</span>
                      </div>
                    </div>
                  )}

                  {currentItem.category === "practice" && (
                    <div className="flex flex-col items-center gap-1 text-center font-mono">
                      <span className="text-xs font-black text-[#ff9e00] uppercase">GRENADE TRAJECTORY CAMERA: PIP ON</span>
                      <span className="text-[11px] text-white/60">mp_restartgame 1 // sv_infinite_ammo 1</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Raw Source & Copy Action */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
                  <span>CFG SOURCE COMMAND:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentItem.command)}
                    className="inline-flex items-center gap-1 text-white hover:text-[#ff9e00] font-bold transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "COPIED" : "COPY CODE"}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-black border border-white/[0.08] font-mono text-xs text-white/90 overflow-x-auto ">
                  <code>{currentItem.command}</code>
                </div>
              </div>
            </div>

            {/* Live Simulation Feedback Terminal Strip */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
              <span className="text-white/60 flex items-center gap-1.5 truncate mr-2">
                <Terminal className="w-3.5 h-3.5 text-[#ff9e00] shrink-0" />
                <span className="truncate">{simulatedLog || "Ready to execute alias in game engine"}</span>
              </span>
              <button
                type="button"
                onClick={() => handleKeyClick(selectedIdx, currentItem.key)}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-[#ff9e00] hover:text-black text-white text-xs font-bold uppercase transition-all shrink-0 hover:scale-105 active:scale-95 "
              >
                Test Bind
              </button>
            </div>
          </SpotlightCard>
          </TiltCard>
          </Reveal>
        </div>
        </div>
      </div>
    </section>
  );
}
