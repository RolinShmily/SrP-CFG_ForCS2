import { useState, useEffect, useCallback, useRef } from "react";
import TitleBar from "./components/TitleBar";
import Sidebar from "./components/Sidebar";
import LogPanel from "./components/LogPanel";
import UpdateModal from "./components/UpdateModal";
import InstallPage from "./pages/InstallPage";
import DownloadPage from "./pages/DownloadPage";
import QuickStartPage from "./pages/QuickStartPage";
import BackupRestorePage from "./pages/BackupRestorePage";
import AppliedConfigPage from "./pages/AppliedConfigPage";
import PersonalizePage from "./pages/PersonalizePage";
import AboutPage from "./pages/AboutPage";
import { useLogs } from "./hooks/useLogs";
import type { DetectionResult } from "./types";

export type Page = "install" | "download" | "quickstart" | "personalize" | "backup" | "applied" | "about";

export default function App() {
  const [page, setPage] = useState<Page>("quickstart");
  const [personalizeDirty, setPersonalizeDirty] = useState(false);
  const [logPanelOpen, setLogPanelOpen] = useState(false);
  const { logs, clearLogs } = useLogs();
  const mainRef = useRef<HTMLElement>(null);

  // Detection runs once on startup, shared across pages
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const detectedRef = useRef(false);

  const detect = useCallback(async (force = false) => {
    if (detectedRef.current && !force) return;
    detectedRef.current = true;
    setRefreshing(true);
    try {
      const result = await window.api.detectAll();
      setDetection(result);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    detect();
  }, [detect]);

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, [page]);

  const handleUserChange = useCallback(
    async (accountId: string) => {
      if (!detection) return;
      const userConfig = await window.api.setCurrentUser(accountId);
      const user = detection.steamUsers.find(
        (u) => u.accountId === accountId,
      );
      setDetection({
        ...detection,
        currentUser: user ?? null,
        userCfgPath: userConfig.userCfgPath,
        vcfgState: userConfig.vcfgState,
      });
    },
    [detection],
  );

  // ── Update modal ───────────────────────────────────────────
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  // Auto-check on startup (uses cache throttle)
  useEffect(() => {
    window.api
      .checkForUpdate(false)
      .then((result) => {
        if (result.hasUpdate) {
          setUpdateModalOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  // Manual check from sidebar
  const handleCheckUpdate = useCallback(() => {
    setUpdateChecking(true);
    setUpdateModalOpen(true);
    setTimeout(() => setUpdateChecking(false), 500);
  }, []);

  const pages: Record<Page, React.ReactNode> = {
    quickstart: <QuickStartPage />,
    download: <DownloadPage />,
    install: (
      <InstallPage
        detection={detection}
        refreshing={refreshing}
        onRefresh={() => detect(true)}
        onUserChange={handleUserChange}
      />
    ),
    personalize: <PersonalizePage detection={detection} onDirtyChange={setPersonalizeDirty} />,
    backup: <BackupRestorePage />,
    applied: <AppliedConfigPage />,
    about: <AboutPage />,
  };

  return (
    <div className="flex flex-col h-screen bg-bg text-text overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          current={page}
          onNavigate={(nextPage) => {
            if (
              page === "personalize" &&
              nextPage !== "personalize" &&
              personalizeDirty &&
              !window.confirm("个人配置尚未保存，离开此页面会丢失修改。继续吗？")
            ) {
              return;
            }
            setPage(nextPage);
          }}
          onCheckUpdate={handleCheckUpdate}
        />
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-6 outline-none"
        >
          <div key={page} className="page-enter min-h-full">{pages[page]}</div>
        </main>
        <LogPanel
          logs={logs}
          onClear={clearLogs}
          isOpen={logPanelOpen}
          onToggle={() => setLogPanelOpen(!logPanelOpen)}
        />
      </div>

      <UpdateModal
        open={updateModalOpen}
        checking={updateChecking}
        onClose={() => setUpdateModalOpen(false)}
      />
    </div>
  );
}
