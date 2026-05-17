import { useState, useEffect, useCallback } from "react";
import { FolderOpen, FileText, Map, Monitor, Loader2, ChevronDown } from "lucide-react";
import type { StagingSection } from "../types";

const sectionIcons: Record<string, React.ReactNode> = {
  cfg: <FileText size={18} className="text-accent" />,
  annotations: <Map size={18} className="text-accent" />,
  video: <Monitor size={18} className="text-accent" />,
};

export default function AppliedConfigPage() {
  const [sections, setSections] = useState<StagingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const loadSections = useCallback(async () => {
    setLoading(true);
    try {
      const list = await window.api.listStagingFiles();
      setSections(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <div className="space-y-5">
        <h1 className="font-display text-2xl font-bold">已应用配置</h1>
        <div className="flex items-center justify-center py-12 text-text-muted">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">已应用配置</h1>

      {sections.map((section) => {
        const isOpen = expanded[section.key] ?? false;
        return (
          <div
            key={section.key}
            className="bg-bg-card border border-border rounded-[var(--radius)]"
          >
            {/* Header — clickable to toggle */}
            <div
              onClick={() => toggle(section.key)}
              className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                {sectionIcons[section.key]}
                <h2 className="font-display text-sm font-semibold text-text-secondary">
                  {section.label}
                </h2>
                <span className="text-xs text-text-faint">
                  {section.files.length > 0 ? `${section.files.length} 个文件` : "空"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.api.openStagingDir(section.key);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-muted hover:text-accent hover:bg-accent-bg rounded-[var(--radius-sm)] transition-colors cursor-pointer bg-transparent border border-border"
                >
                  <FolderOpen size={13} />
                  打开目录
                </button>
                <ChevronDown
                  size={16}
                  className={`text-text-faint transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
            </div>

            {/* Body — collapsible */}
            {isOpen && (
              <div className="px-4 pb-4 pt-0">
                {section.files.length > 0 ? (
                  <div className="space-y-1">
                    {section.files.map((file) => (
                      <div
                        key={file}
                        className="flex items-center gap-2 px-3 py-1.5 bg-bg-raised border border-border rounded-[var(--radius-sm)] text-xs font-mono text-text"
                      >
                        <FileText size={12} className="text-text-faint shrink-0" />
                        <span className="truncate">{file}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-text-faint py-3 text-center">
                    暂无文件
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
