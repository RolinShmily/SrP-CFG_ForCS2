import { Link } from "react-router";

import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import { categoryPath, detailPath } from "@/lib/console/paths";
import type { ConsoleCategory, ConsoleIndexRecord } from "@/lib/console/types";
import { CopyButton } from "./copy-button";
import { FlagList } from "./flag-list";
import { StatusBadge, TypeBadge } from "./status-badge";

export function RecordTable({
  records,
  empty,
  showType = false,
  categories,
}: {
  records: ConsoleIndexRecord[];
  empty: string;
  showType?: boolean;
  categories?: ConsoleCategory[];
}) {
  const { locale } = useI18n();
  const copy = consoleCopy[locale];

  if (!records.length) {
    return (
      <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center text-sm text-dim">
        {empty}
      </div>
    );
  }

  function categoryLabel(slug: string) {
    const category = categories?.find((item) => item.slug === slug);
    if (!category) return slug;
    return locale === "zh" ? category.zh : category.en;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas/70 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">{copy.common.description}</th>
              <th className="hidden px-4 py-3 md:table-cell">{copy.common.category}</th>
              <th className="hidden px-4 py-3 lg:table-cell">{copy.common.flags}</th>
              <th className="hidden px-4 py-3 xl:table-cell">{copy.common.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {records.map((record) => (
              <tr key={record.key} className="group transition hover:bg-white/[0.025]">
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <div className="flex items-center gap-1.5">
                    <Link
                      prefetch="intent"
                      to={detailPath(record.type, record.name)}
                      className="font-mono text-[13px] font-semibold text-ink transition hover:text-cs-orange"
                    >
                      {record.name}
                    </Link>
                    <CopyButton value={record.name} compact />
                  </div>
                  {showType && (
                    <div className="mt-1">
                      <TypeBadge type={record.type} />
                    </div>
                  )}
                </td>
                <td className="max-w-md px-4 py-3 align-top">
                  <p className="line-clamp-2 text-xs leading-relaxed text-dim">
                    {record.summary || "—"}
                  </p>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 align-top md:table-cell">
                  <Link
                    prefetch="intent"
                    to={categoryPath(record.category)}
                    className="text-xs text-dim transition hover:text-ink"
                  >
                    {categoryLabel(record.category)}
                  </Link>
                </td>
                <td className="hidden px-4 py-3 align-top lg:table-cell">
                  <FlagList flags={record.flags.slice(0, 3)} />
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 align-top xl:table-cell">
                  <StatusBadge status={record.translationStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
