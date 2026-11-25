import { ArrowUpRight, Scale } from "lucide-react";
import { Link } from "react-router";

import { useI18n } from "@/context/i18n-context";
import { assetPath, RELEASES, REPOSITORY } from "@/lib/downloads";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-line bg-surface/60">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <div className="max-w-sm space-y-2.5">
            <Link to="/" prefetch="intent" className="inline-flex items-center gap-2.5 text-sm font-semibold text-ink">
              <img src={assetPath("/app/icon.webp")} alt="" width="24" height="24" className="rounded-md" />
              <span>
                SrP-CFG<span className="text-cs-orange">.</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-dim">{t.footer.description}</p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-6 text-xs">
            <div className="space-y-2">
              <div className="font-semibold uppercase tracking-wider text-muted">{t.footer.siteHeading}</div>
              <ul className="space-y-1.5 text-dim">
                <li><Link prefetch="intent" to="/" className="transition hover:text-ink">{t.nav.home}</Link></li>
                <li><Link prefetch="intent" to="/console" className="transition hover:text-ink">{t.nav.console}</Link></li>
                <li><Link prefetch="intent" to="/download" className="transition hover:text-ink">{t.nav.download}</Link></li>
                <li><Link prefetch="intent" to="/console/changes" className="transition hover:text-ink">{t.footer.changes}</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold uppercase tracking-wider text-muted">{t.footer.projectHeading}</div>
              <ul className="space-y-1.5 text-dim">
                <li>
                  <a href={REPOSITORY} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition hover:text-ink">
                    {t.footer.project} <ArrowUpRight size={12} />
                  </a>
                </li>
                <li>
                  <a href={RELEASES} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition hover:text-ink">
                    {t.footer.releases} <ArrowUpRight size={12} />
                  </a>
                </li>
                <li>
                  <a href={`${REPOSITORY}/tree/main/docs`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition hover:text-ink">
                    {t.footer.docs} <ArrowUpRight size={12} />
                  </a>
                </li>
                <li>
                  <a href="https://blog.srprolin.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition hover:text-ink">
                    {t.footer.blog} <ArrowUpRight size={12} />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center">
          <span>© 2025–2026 RoL1n_SrP · {t.footer.disclaimer}</span>
          <div className="flex items-center gap-4">
            <a
              href={`${REPOSITORY}/blob/main/LICENSE`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-dim transition hover:text-ink"
            >
              <Scale size={13} aria-hidden="true" />
              {t.footer.license}
            </a>
            <a
              href={assetPath("/third-party-licenses.txt")}
              target="_blank"
              rel="noreferrer"
              className="text-dim transition hover:text-ink"
            >
              {t.footer.thirdParty}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
