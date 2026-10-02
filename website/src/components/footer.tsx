"use client";

import React from "react";
import { useI18n } from "@/context/i18n-context";
import { Scale, ArrowUpRight } from "lucide-react";
import { GithubIcon, BilibiliIcon, SteamIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-[#161b26] border-t border-white/[0.08] py-16 sm:py-20 text-white/70">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 space-y-14">
        <Reveal amount={0.15} className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand Info */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#ff9e00] text-black flex items-center justify-center font-mono font-black text-xs">
                S
              </div>
              <span className="font-extrabold text-base tracking-tight text-white uppercase">
                SrP-CFG // CS2 RUNTIME
              </span>
            </div>

            <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-md">
              {t.footer.description}
            </p>
          </div>

          {/* Nav */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-white">
              {t.footer.navigation}
            </div>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a href="#overview" className="hover:text-[#ff9e00] transition-colors">
                  Overview
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-[#ff9e00] transition-colors">
                  {t.footer.features}
                </a>
              </li>
              <li>
                <a href="#pipeline" className="hover:text-[#ff9e00] transition-colors">
                  {t.nav.workflow}
                </a>
              </li>
              <li>
                <a href="#keypad" className="hover:text-[#ff9e00] transition-colors">
                  {t.nav.keybinds}
                </a>
              </li>
            </ul>
          </div>

          {/* External Links */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-white">
              {t.footer.community}
            </div>
            <div className="flex flex-col space-y-2.5 text-xs font-mono">
              <a
                href="https://space.bilibili.com/422744280"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-[#ff9e00] transition-colors"
              >
                <BilibiliIcon className="w-4 h-4 text-sky-400" />
                <span>Bilibili</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
              </a>

              <a
                href="https://steamcommunity.com/profiles/76561199516828933/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-[#ff9e00] transition-colors"
              >
                <SteamIcon className="w-4 h-4 text-blue-400" />
                <span>Steam Community</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
              </a>

              <a
                href="https://github.com/RolinShmily/SrP-CFG_ForCS2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-[#ff9e00] transition-colors"
              >
                <GithubIcon className="w-4 h-4" />
                <span>GitHub Source</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
              </a>

              <a
                href="https://blog.srprolin.top"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-[#ff9e00] transition-colors"
              >
                <span>SrP-BloG</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
              </a>
            </div>
          </div>
        </Reveal>

        {/* Bottom Bar: Copyright, License, ICP Beian */}
        <Reveal delay={0.1} amount={0.4} className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-white/50">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>© 2024–2026 SrP-CFG</span>
            <span>•</span>
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <Scale className="w-3 h-3" />
              <span>CC BY-NC-SA 4.0</span>
            </a>
            <span>•</span>
            <a
              href="https://github.com/RolinShmily/SrP-CFG_ForCS2/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              MIT License
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              {t.footer.icp1}
            </a>
            <a
              href="https://icp.gov.moe/?keyword=20259601"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              {t.footer.icp2}
            </a>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
