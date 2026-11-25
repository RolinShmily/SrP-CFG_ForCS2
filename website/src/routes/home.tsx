import { ArrowDownToLine, ArrowRight, Boxes, FolderTree, Layers, Package, Search, ShieldCheck, SquareTerminal, Terminal } from "lucide-react";
import { useState } from "react";
import type { MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";

import { openCommandPalette } from "@/components/command-palette";
import { useI18n } from "@/context/i18n-context";
import { getCategories, getIndex } from "@/lib/console/catalog.server";
import { categoryPath } from "@/lib/console/paths";
import { pageMeta, websiteJsonLd } from "@/lib/console/seo";
import { assetPath } from "@/lib/downloads";

export async function loader() {
  const index = getIndex();
  return {
    counts: index.counts,
    categories: getCategories().slice(0, 8),
    upstreamDate: index.upstream.fetchedAt.slice(0, 10),
  };
}

const TITLE = "SrP-CFG — CS2 模块化配置套件与控制台指令中心";
const DESCRIPTION =
  "Windows CS2 模块化配置工作台与 5,500+ 条 CS2 控制台指令参考中心。安全装配预设、功能模块、视频模板与地图标注，随时检索 ConVars 与 Commands。";

export const meta: MetaFunction = () => [
  ...pageMeta({
    title: TITLE,
    description: DESCRIPTION,
    path: "/",
    jsonLd: websiteJsonLd(),
  }),
  {
    name: "keywords",
    content: "CS2,Counter-Strike 2,CFG,autoexec,CS2 console commands,ConVar,practice cfg,CS2 config,Qt,SrP-CFG",
  },
];

export default function HomeRoute() {
  const data = useLoaderData<typeof loader>();
  const { locale, t } = useI18n();
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = t.home.slides;
  const activeSlide = slides[slideIndex] ?? slides[0];
  const serviceIcons = {
    desktop: ShieldCheck,
    packages: Package,
    console: SquareTerminal,
  } as const;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
      {/* 1. Hero: Clear identity + primary Download CTA + secondary Console CTA + instant search */}
      <section className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cs-orange/25 bg-cs-orange/10 px-3.5 py-1 text-xs font-medium text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-cs-orange" aria-hidden="true" />
          {t.home.eyebrow}
        </div>

        <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight text-ink sm:text-5xl sm:leading-[1.12]">
          {t.home.title}
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-dim sm:text-lg">
          {t.home.subtitle}
        </p>

        {/* Primary / Secondary CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/download"
            prefetch="intent"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-cs-orange px-5 text-sm font-semibold text-black shadow-lg shadow-amber-500/15 transition hover:bg-amber-400"
          >
            <ArrowDownToLine size={16} aria-hidden="true" />
            {t.home.primaryCta}
          </Link>

          <Link
            to="/console"
            prefetch="intent"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-5 text-sm font-semibold text-ink transition hover:border-white/25 hover:bg-card"
          >
            <SquareTerminal size={16} className="text-cs-orange" aria-hidden="true" />
            {t.home.secondaryCta}
            <ArrowRight size={15} className="text-muted" aria-hidden="true" />
          </Link>
        </div>

        {/* Direct Pagefind quick-search bar */}
        <div className="mx-auto mt-6 max-w-xl">
          <button
            type="button"
            onClick={() => openCommandPalette()}
            className="group flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface/90 px-4 py-3 text-left text-sm text-dim transition hover:border-cs-orange/40 hover:bg-card"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <Search size={16} className="shrink-0 text-muted transition group-hover:text-cs-orange" aria-hidden="true" />
              <span className="truncate">{t.home.searchCta}</span>
            </span>
            <kbd className="shrink-0 rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] text-muted">
              Ctrl K
            </kbd>
          </button>
        </div>
      </section>

      {/* 2. Clean Desktop Workbench Preview Frame */}
      <section className="mt-12 sm:mt-16" aria-label={t.home.showcaseCaption}>
        <div className="overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-2xl shadow-black/60">
          {/* Window toolbar + clean view switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas/80 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-dim">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="ml-2 font-mono text-[11px] text-muted">{t.home.showcaseCaption}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1" role="tablist">
              {slides.map((slide, idx) => {
                const active = idx === slideIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSlideIndex(idx)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      active
                        ? "bg-cs-orange/15 text-cs-orange ring-1 ring-inset ring-cs-orange/30"
                        : "text-dim hover:bg-white/[0.05] hover:text-ink"
                    }`}
                  >
                    {slide.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-canvas p-2 sm:p-3">
            <img
              src={assetPath(activeSlide.image)}
              alt={activeSlide.label}
              width="1160"
              height="751"
              className="mx-auto block w-full rounded-xl border border-line object-cover"
            />
          </div>

          <div className="flex flex-col items-start justify-between gap-2 border-t border-line bg-surface px-4 py-3 text-xs text-dim sm:flex-row sm:items-center">
            <span>{activeSlide.summary}</span>
            <Link
              to="/download"
              prefetch="intent"
              className="inline-flex shrink-0 items-center gap-1 font-medium text-cs-orange transition hover:text-amber-300"
            >
              {t.home.primaryCta}
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Three Core Services: Clearly explains what the site offers */}
      <section className="mt-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{t.home.servicesTitle}</h2>
          <p className="mt-2.5 text-sm leading-relaxed text-dim sm:text-base">{t.home.servicesSubtitle}</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {t.home.services.map((item) => {
            const Icon = serviceIcons[item.id as keyof typeof serviceIcons] ?? Layers;
            return (
              <Link
                key={item.id}
                to={item.to}
                prefetch="intent"
                className="group flex flex-col justify-between rounded-2xl border border-line bg-surface p-6 transition hover:border-line-strong hover:bg-card"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-canvas text-cs-orange">
                      <Icon size={19} aria-hidden="true" />
                    </div>
                    <span className="font-mono text-[10px] font-semibold tracking-wider text-muted">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-dim">{item.description}</p>
                </div>

                <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-cs-orange transition group-hover:translate-x-0.5">
                  {item.action}
                  <ArrowRight size={14} aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Console Reference Spotlight: Live stats + direct category jumps */}
      <section className="mt-20 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 font-mono text-xs font-medium text-cs-emerald">
              <Terminal size={14} aria-hidden="true" />
              /console · {t.home.consoleUpstream} ({data.upstreamDate})
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink">{t.home.consoleTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-dim">{t.home.consoleSubtitle}</p>
          </div>

          <Link
            to="/console"
            prefetch="intent"
            className="inline-flex h-10 shrink-0 self-start items-center gap-2 whitespace-nowrap rounded-xl border border-cs-orange/35 bg-cs-orange/10 px-4 text-sm font-medium text-cs-orange transition hover:bg-cs-orange/20 lg:self-end"
          >
            {t.home.consoleAction}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        {/* Live counts */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Link
            to="/console/convars"
            prefetch="intent"
            className="rounded-xl border border-line bg-canvas/70 p-4 transition hover:border-line-strong"
          >
            <div className="flex items-center gap-2 text-xs text-muted">
              <Boxes size={14} className="text-cs-emerald" aria-hidden="true" />
              {t.home.consoleConvars}
            </div>
            <div className="mt-1.5 font-mono text-xl font-bold text-ink sm:text-2xl">
              {data.counts.convars.toLocaleString()}
            </div>
          </Link>

          <Link
            to="/console/commands"
            prefetch="intent"
            className="rounded-xl border border-line bg-canvas/70 p-4 transition hover:border-line-strong"
          >
            <div className="flex items-center gap-2 text-xs text-muted">
              <Terminal size={14} className="text-cs-blue" aria-hidden="true" />
              {t.home.consoleCommands}
            </div>
            <div className="mt-1.5 font-mono text-xl font-bold text-ink sm:text-2xl">
              {data.counts.commands.toLocaleString()}
            </div>
          </Link>

          <Link
            to="/console/categories"
            prefetch="intent"
            className="rounded-xl border border-line bg-canvas/70 p-4 transition hover:border-line-strong"
          >
            <div className="flex items-center gap-2 text-xs text-muted">
              <FolderTree size={14} className="text-cs-orange" aria-hidden="true" />
              {t.home.consoleCategories}
            </div>
            <div className="mt-1.5 font-mono text-xl font-bold text-ink sm:text-2xl">
              {data.categories.length}+
            </div>
          </Link>
        </div>

        {/* Category quick pills */}
        <div className="mt-5 flex flex-wrap gap-2">
          {data.categories.map((cat) => (
            <Link
              key={cat.slug}
              to={categoryPath(cat.slug)}
              prefetch="intent"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-xs text-dim transition hover:border-cs-orange/40 hover:text-ink"
            >
              <span>{locale === "zh" ? cat.zh : cat.en}</span>
              <span className="font-mono text-[11px] text-muted">{cat.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Compact Bottom CTA */}
      <section className="mt-16 flex flex-col items-start justify-between gap-5 rounded-2xl border border-cs-orange/25 bg-gradient-to-r from-cs-orange/10 via-surface to-surface p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">{t.home.bannerTitle}</h2>
          <p className="mt-1 text-sm text-dim">{t.home.bannerDesc}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/download"
            prefetch="intent"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-cs-orange px-4 text-sm font-semibold text-black transition hover:bg-amber-400"
          >
            <ArrowDownToLine size={15} />
            {t.home.primaryCta}
          </Link>
          <Link
            to="/console"
            prefetch="intent"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-canvas px-4 text-sm font-medium text-ink transition hover:border-white/25"
          >
            {t.home.secondaryCta}
          </Link>
        </div>
      </section>
    </div>
  );
}
