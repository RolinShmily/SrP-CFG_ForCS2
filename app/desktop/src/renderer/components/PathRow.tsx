import { Folder } from "lucide-react";

interface Props {
  label: string;
  value: string | null;
}

export default function PathRow({ label, value }: Props) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Folder size={14} className="text-text-faint flex-shrink-0" />
      <span className="text-text-muted w-28 flex-shrink-0">{label}</span>
      <span className={`font-mono text-xs break-all ${value ? "text-text-secondary" : "text-text-faint"}`}>
        {value ?? "未检测到"}
      </span>
    </div>
  );
}
