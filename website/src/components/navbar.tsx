"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useI18n } from "@/context/i18n-context";
import { Download, Globe } from "lucide-react";
import { GithubIcon } from "@/components/icons";

export function Navbar() {
  const { locale, toggleLocale, t } = useI18n();
  const [scrolled, setScrolled] = useState(false);

  // One scroll subscription for the whole navbar: the reading-progress rail is a
  // motion value (never React state) and the condensed-header flag is a discrete
  // boolean flipped only when the threshold is actually crossed.
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 240,
    damping: 40,
    restDelta: 0.001,
  });

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 40);
  });

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#161b26]/92 backdrop-blur-md border-b border-white/[0.08] py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff9e00] to-[#e67e00] text-black font-black text-sm flex items-center justify-center font-mono ">
            S
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white uppercase font-sans">
              SrP-CFG
            </span>
            <span className="text-[11px] font-mono text-[#ff9e00] font-bold tracking-wider">
              CS2 RUNTIME
            </span>
          </div>
        </Link>

        {/* Anchor Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold tracking-wider uppercase text-white/70">
          <a href="#overview" className="hover:text-[#ff9e00] transition-colors">
            Overview
          </a>
          <a href="#architecture" className="hover:text-[#ff9e00] transition-colors">
            Architecture
          </a>
          <a href="#pipeline" className="hover:text-[#ff9e00] transition-colors">
            Pipeline
          </a>
          <a href="#keypad" className="hover:text-[#ff9e00] transition-colors">
            Keypad
          </a>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Language */}
          <button
            type="button"
            onClick={toggleLocale}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] hover:bg-white/10 text-xs font-mono font-semibold text-white/90 transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-[#ff9e00]" />
            <span>{locale === "zh" ? "EN" : "中"}</span>
          </button>

          {/* GitHub */}
          <a
            href="https://github.com/RolinShmily/SrP-CFG_ForCS2"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full border border-white/[0.1] bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all"
            title="GitHub"
          >
            <GithubIcon className="w-3.5 h-3.5" />
          </a>

          {/* Action CTA */}
          <a
            href="#download"
            className="cs2-action-btn whitespace-nowrap h-9 px-5 rounded-full text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GET DESKTOP</span>
          </a>
        </div>
      </div>

      {/* Scroll progress rail (橙金装填线，标示长卷阅读进度) */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="absolute bottom-0 left-0 right-0 h-[2px] origin-left bg-[#ff9e00] "
      />
    </header>
  );
}
