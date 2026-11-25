import { Link, Outlet, useLocation } from "react-router";

import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";

export default function ConsoleSubLayout() {
  const { locale } = useI18n();
  const location = useLocation();
  const copy = consoleCopy[locale];

  const tabs = [
    { to: "/console", label: copy.nav.overview, end: true },
    { to: "/console/convars", label: copy.nav.convars, end: false },
    { to: "/console/commands", label: copy.nav.commands, end: false },
    { to: "/console/categories", label: copy.nav.categories, end: false },
    { to: "/console/flags", label: copy.nav.flags, end: false },
    { to: "/console/changes", label: copy.nav.changes, end: false },
  ];

  return (
    <div className="flex flex-col">
      <div className="sticky top-16 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
        <nav
          aria-label="Console navigation"
          className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6"
        >
          {tabs.map((tab) => {
            const active = tab.end
              ? location.pathname === tab.to || location.pathname === `${tab.to}/`
              : location.pathname === tab.to || location.pathname.startsWith(`${tab.to}/`);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                prefetch="intent"
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-cs-orange/15 text-cs-orange ring-1 ring-inset ring-cs-orange/30"
                    : "text-dim hover:bg-white/[0.04] hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </div>
    </div>
  );
}
