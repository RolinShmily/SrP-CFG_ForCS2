import { useState } from "react";
import TitleBar from "./components/TitleBar";
import Sidebar from "./components/Sidebar";
import InstallPage from "./pages/InstallPage";
import DownloadPage from "./pages/DownloadPage";
import QuickStartPage from "./pages/QuickStartPage";
import BackupRestorePage from "./pages/BackupRestorePage";
import AboutPage from "./pages/AboutPage";
import type { LogEntry } from "./types";

export type Page = "install" | "download" | "quickstart" | "backup" | "about";

export default function App() {
  const [page, setPage] = useState<Page>("quickstart");
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, { text: msg, time: Date.now() }]);
  };

  const pages: Record<Page, React.ReactNode> = {
    quickstart: <QuickStartPage />,
    download: <DownloadPage />,
    install: <InstallPage logs={logs} addLog={addLog} />,
    backup: <BackupRestorePage logs={logs} addLog={addLog} />,
    about: <AboutPage />,
  };

  return (
    <div className="flex flex-col h-screen bg-bg text-text overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar current={page} onNavigate={setPage} />
        <main className="flex-1 overflow-y-auto p-6">{pages[page]}</main>
      </div>
    </div>
  );
}
