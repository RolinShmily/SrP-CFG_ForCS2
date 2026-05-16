import { useState, useEffect } from "react";

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    window.api.isMaximized().then(setMaximized);
  }, []);

  return (
    <div className="flex items-center justify-between h-9 bg-bg-card border-b border-border px-3 drag-region">
      <div className="flex items-center gap-2">
        <span className="font-display text-sm font-bold text-accent tracking-wider">
          SrP-CFG
        </span>
        <span className="text-xs text-text-faint">Installer</span>
      </div>
      <div className="flex no-drag">
        <button
          onClick={() => window.api.minimize()}
          className="w-10 h-8 flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
        >
          <svg width="12" height="1" viewBox="0 0 12 1"><rect width="12" height="1" fill="currentColor" /></svg>
        </button>
        <button
          onClick={() => { window.api.maximize(); setMaximized(!maximized); }}
          className="w-10 h-8 flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
        >
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2">
              <rect x="2" y="0" width="8" height="8" rx="1" />
              <rect x="0" y="2" width="8" height="8" rx="1" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2">
              <rect x="0.5" y="0.5" width="9" height="9" rx="1" />
            </svg>
          )}
        </button>
        <button
          onClick={() => window.api.close()}
          className="w-10 h-8 flex items-center justify-center text-text-muted hover:text-red hover:bg-red/10 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.4">
            <line x1="0" y1="0" x2="10" y2="10" /><line x1="10" y1="0" x2="0" y2="10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
