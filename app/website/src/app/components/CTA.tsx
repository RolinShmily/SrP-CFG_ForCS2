/**
 * CTA —— 底部行动号召 (Meta Design Language + 黄橙黑配色取向)。
 * 采用 Meta card-promo-strip 模式：
 * - 32px 大圆角深曜黑旗舰卡片
 * - 黄橙黑 Dual-CTA 胶囊药丸按钮 (Primary Amber-Orange Pill + Outlined Secondary Pill)
 * - 纯粹自信的排版与安全信任背书
 */
import { Download, Sparkles, BookOpen, ShieldCheck, Github } from "lucide-react";
import { Link } from "react-router";
import { LATEST_VERSION } from "../../data/version";
import { REPO_URL } from "../../data/navigation";

export function CTA() {
  const versionDisplay = LATEST_VERSION !== "0.0.0" ? `v${LATEST_VERSION}` : "v3.2.4";

  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-800 bg-gradient-to-b from-[#10141d] via-[#0c1017] to-black p-8 sm:p-12 lg:p-16 shadow-2xl">
          {/* 背景黄橙柔和光晕 */}
          <div
            className="pointer-events-none absolute -bottom-32 -right-32 h-[450px] w-[450px] rounded-full bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent blur-[130px]"
            aria-hidden="true"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>READY WHEN YOU ARE</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1]">
                先拥有能力，
                <br />
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                  再决定偏好。
                </span>
              </h2>

              <p className="mt-5 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
                获取轻量纯正的 Runtime Core。无论是畅享一键练枪、准星对齐与小刀检视，还是在受绝对保护的 custom.cfg 中定制你的终极配置。
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  100% Valve Cloud Safe
                </span>
                <span>·</span>
                <span>MIT Licensed</span>
                <span>·</span>
                <span>Tauri v2 + Rust</span>
              </div>
            </div>

            {/* Meta Dual-CTA 药丸按钮组 */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3.5 shrink-0">
              <Link
                to="/download"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-bold text-slate-950 shadow-lg shadow-white/5 transition-all hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="h-4 w-4 text-slate-950" />
                <span>下载 Desktop ({versionDisplay})</span>
              </Link>

              <Link
                to="/docs"
                className="inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-slate-700 bg-slate-900/60 px-8 py-3.5 text-sm font-bold text-white transition-all hover:border-amber-400 hover:bg-slate-800 active:scale-[0.98]"
              >
                <BookOpen className="h-4 w-4 text-slate-300" />
                <span>查阅架构与指南</span>
              </Link>

              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-800 bg-slate-900/40 px-6 py-2.5 text-xs font-semibold text-slate-400 transition hover:border-amber-500/40 hover:text-white"
              >
                <Github className="h-3.5 w-3.5" />
                <span>GitHub 源码仓库</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
