import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { useI18n } from "@/context/i18n-context";
import { consoleCopy } from "@/locales/console";

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const { locale } = useI18n();
  const copy = consoleCopy[locale];
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  const text =
    status === "copied"
      ? copy.common.copied
      : status === "failed"
        ? copy.common.copyFailed
        : label ?? copy.common.copy;

  return (
    <button type="button" className="console-copy" onClick={copyValue}>
      {status === "copied" ? <Check size={12} /> : <Copy size={12} />}
      <span aria-live="polite">{text}</span>
    </button>
  );
}
