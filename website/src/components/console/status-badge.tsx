import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import type { ConsoleRecordType, ConsoleTranslationStatus } from "@/lib/console/types";

const STATUS_STYLES: Record<ConsoleTranslationStatus, string> = {
  translated: "bg-cs-emerald/15 text-cs-emerald ring-cs-emerald/25",
  "human-edited": "bg-cs-blue/15 text-cs-blue ring-cs-blue/25",
  inferred: "bg-cs-orange/15 text-amber-300 ring-cs-orange/25",
  stale: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  missing: "bg-rose-500/15 text-rose-300 ring-rose-500/25",
};

export function StatusBadge({ status }: { status: ConsoleTranslationStatus }) {
  const { locale } = useI18n();
  const copy = consoleCopy[locale];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {copy.status[status]}
    </span>
  );
}

export function TypeBadge({ type }: { type: ConsoleRecordType }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
        type === "convar"
          ? "bg-cs-emerald/10 text-cs-emerald ring-cs-emerald/25"
          : "bg-cs-blue/10 text-cs-blue ring-cs-blue/25"
      }`}
    >
      {type === "convar" ? "ConVar" : "Command"}
    </span>
  );
}
