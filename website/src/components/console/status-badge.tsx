import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";
import type { ConsoleTranslationStatus } from "@/lib/console/types";

export function StatusBadge({ status }: { status: ConsoleTranslationStatus }) {
  const { locale } = useI18n();
  const copy = consoleCopy[locale];
  return (
    <span className={`console-badge console-badge-${status}`}>
      {copy.status[status]}
    </span>
  );
}

export function TypeBadge({ type }: { type: "convar" | "command" }) {
  return (
    <span className="console-badge console-badge-type">
      {type === "convar" ? "ConVar" : "Command"}
    </span>
  );
}
