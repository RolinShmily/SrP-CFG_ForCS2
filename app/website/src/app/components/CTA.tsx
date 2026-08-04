/**
 * CTA —— 底部行动号召（对应原 CTA.astro，React 化）。
 */
import { BookOpen, Download } from "lucide-react";
import { ButtonLink } from "./ButtonLink";

export function CTA() {
  return (
    <section className="home-section py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-7">
        <div className="relative overflow-hidden rounded-[18px] border border-accent/25 bg-bg-card px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div
            className="tech-grid pointer-events-none absolute inset-0 opacity-40"
            aria-hidden="true"
          ></div>
          <div className="absolute inset-y-0 right-0 w-1 bg-accent" aria-hidden="true"></div>
          <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                Ready when you are
              </p>
              <h2 className="mt-4 max-w-[780px] font-display text-[clamp(2.2rem,5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.025em]">
                先拥有能力，
                <br />
                再决定偏好。
              </h2>
              <p className="mt-5 max-w-[650px] text-base leading-8 text-text-secondary">
                下载一个 Runtime Core。只使用功能，或在同一个 custom.cfg 中建立属于你的确定性配置。
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:max-w-[220px] lg:flex-col">
              <ButtonLink to="/download" size="lg">
                <Download className="h-5 w-5" />
                前往下载
              </ButtonLink>
              <ButtonLink to="/docs/srpcfg-3" variant="ghost" size="lg">
                <BookOpen className="h-5 w-5" />
                使用指南
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
