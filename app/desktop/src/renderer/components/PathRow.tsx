import { Folder } from "lucide-react";

interface Props {
  label: string;
  value: string | null;
}

export default function PathRow({ label, value }: Props) {
  return (
    <div className="flex items-start gap-3">
      <Folder size={14} className="text-text-faint flex-shrink-0" />
      <span className="ui-caption w-32 flex-shrink-0">{label}</span>
      <span className={`font-mono text-xs break-all ${value ? "text-text-secondary" : "text-text-faint"}`}>
        {value ?? "未检测到"}
      </span>
    </div>
  );
}
