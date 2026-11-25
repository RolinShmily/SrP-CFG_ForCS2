import { Link } from "react-router";

import { useI18n } from "@/context/i18n-context";

export default function NotFoundRoute() {
  const { t } = useI18n();

  return (
    <main className="site-ambient-bg flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs font-semibold tracking-widest text-cs-orange">
          {t.notFound.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">{t.notFound.title}</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-dim">{t.notFound.desc}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-xl bg-cs-orange px-4 text-sm font-semibold text-black transition hover:bg-amber-400"
          >
            {t.notFound.home}
          </Link>
          <Link
            to="/console"
            className="inline-flex h-10 items-center rounded-xl border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition hover:bg-card"
          >
            {t.notFound.console}
          </Link>
        </div>
      </div>
    </main>
  );
}
