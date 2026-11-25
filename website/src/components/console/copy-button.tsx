import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";

export function CopyButton({
  value,
  label,
  compact = false,
}: {
  value: string;
  label?: string;
  compact?: boolean;
}) {
  const { locale } = useI18n();
  const copy = consoleCopy[locale];
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  const text =
    state === "copied"
      ? copy.common.copied
      : state === "failed"
        ? copy.common.copyFailed
        : label || copy.common.copy;

  if (compact) {
    return (
      <button
        type="button"
        onClick={onCopy}
        title={text}
        aria-label={`${text}: ${value}`}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-muted transition hover:border-line hover:bg-canvas hover:text-ink"
      >
        {state === "copied" ? <Check size={13} className="text-cs-emerald" /> : <Copy size={13} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-cs-orange/50 hover:text-cs-orange"
    >
      {state === "copied" ? <Check size={13} className="text-cs-emerald" /> : <Copy size={13} />}
      <span>{text}</span>
    </button>
  );
}
