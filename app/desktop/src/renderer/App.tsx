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
import AboutPage from "./pages/AboutPage";
import { useLogs } from "./hooks/useLogs";
import type { DetectionResult, UpdateCheckResult } from "./types";

export type Page = "install" | "download" | "quickstart" | "backup" | "applied" | "about";

export default function App() {
  const [page, setPage] = useState<Page>("quickstart");
  const [logPanelOpen, setLogPanelOpen] = useState(true);
  const { logs, clearLogs } = useLogs();

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

  const handleUserChange = useCallback(
    async (accountId: string) => {
      if (!detection) return;
      const videoPath = await window.api.setCurrentUser(accountId);
      const user = detection.steamUsers.find(
        (u) => u.accountId === accountId,
      );
      setDetection({
        ...detection,
        currentUser: user ?? null,
        videoCfgPath: videoPath,
      });
    },
    [detection],
  );

  // ── Update check ───────────────────────────────────────────
  const [updateResult, setUpdateResult] =
    useState<UpdateCheckResult | null>(null);
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  // Auto-check on startup (uses cache throttle)
  useEffect(() => {
    window.api
      .checkForUpdate(false)
      .then((result) => {
        if (result.hasUpdate) {
          setUpdateResult(result);
          setUpdateModalOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  // Manual check from sidebar
  const handleCheckUpdate = useCallback(async () => {
    setUpdateChecking(true);
    setUpdateResult(null);
    setUpdateModalOpen(true);
    try {
      const result = await window.api.checkForUpdate(true);
      setUpdateResult(result);
    } catch {
      setUpdateResult({
        currentVersion: "unknown",
        hasUpdate: false,
        releases: [],
      });
    } finally {
      setUpdateChecking(false);
    }
  }, []);

  const handleCloseUpdateModal = useCallback(() => {
    setUpdateModalOpen(false);
    if (updateResult?.hasUpdate && updateResult.releases[0]) {
      window.api.dismissUpdate(updateResult.releases[0].tagName);
    }
  }, [updateResult]);

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
    backup: <BackupRestorePage />,
    applied: <AppliedConfigPage />,
    about: <AboutPage />,
  };

  return (
    <div className="flex flex-col h-screen bg-bg text-text overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar current={page} onNavigate={setPage} onCheckUpdate={handleCheckUpdate} />
        <main className="flex-1 overflow-y-auto p-6">{pages[page]}</main>
        <LogPanel
          logs={logs}
          onClear={clearLogs}
          isOpen={logPanelOpen}
          onToggle={() => setLogPanelOpen(!logPanelOpen)}
        />
      </div>

      <UpdateModal
        result={updateResult}
        open={updateModalOpen}
        checking={updateChecking}
        onClose={handleCloseUpdateModal}
      />
    </div>
  );
}
