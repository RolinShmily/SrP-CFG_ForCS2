import { Link } from "react-router";

import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import { categoryPath, detailPath } from "@/lib/console/paths";
import type { ConsoleCategory, ConsoleIndexRecord } from "@/lib/console/types";
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
    return <div className="console-empty">{empty}</div>;
  }

  function categoryLabel(slug: string) {
    const category = categories?.find((item) => item.slug === slug);
    if (!category) return slug;
    return locale === "zh" ? category.zh : category.en;
  }

  return (
    <div className="console-table-wrap">
      <table className="console-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>{copy.common.category}</th>
            <th>{copy.common.flags}</th>
            <th>{copy.common.description}</th>
            <th>{copy.common.status}</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.key}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                  <Link prefetch="intent" className="console-name" to={detailPath(record.type, record.name)}>
                    {record.name}
                  </Link>
                  {showType && <TypeBadge type={record.type} />}
                </div>
              </td>
              <td>
                <Link prefetch="intent" className="console-muted" to={categoryPath(record.category)}>
                  {categoryLabel(record.category)}
                </Link>
              </td>
              <td>
                <FlagList flags={record.flags.slice(0, 4)} />
              </td>
              <td>
                <span className="console-summary">{record.summary || "—"}</span>
              </td>
              <td>
                <StatusBadge status={record.translationStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
