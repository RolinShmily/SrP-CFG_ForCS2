import { useState, useRef, useCallback } from "react";
import { Archive, Loader2 } from "lucide-react";
import SteamStatusBanner from "../components/SteamStatusBanner";
import DetectionCard from "../components/DetectionCard";
import UploadZone from "../components/UploadZone";
import UploadedList from "../components/UploadedList";
import DownloadsList from "../components/DownloadsList";
import InstallActions from "../components/InstallActions";
import type { DetectionResult } from "../types";

interface Props {
  detection: DetectionResult | null;
  refreshing: boolean;
  onRefresh: () => void;
  onUserChange: (accountId: string) => void;
}

export default function InstallPage({
  detection,
  refreshing,
  onRefresh,
  onUserChange,
}: Props) {
  const [selectedUpload, setSelectedUpload] = useState<string | null>(null);
  const [selectedDownload, setSelectedDownload] = useState<string | null>(null);
  const [backing, setBacking] = useState(false);
  const uploadedListRef = useRef<{ reload: () => void } | null>(null);

  const handleUploadComplete = useCallback(() => {
    setSelectedDownload(null);
    setSelectedUpload(null);
    uploadedListRef.current?.reload();
  }, []);

  const handleSelectUpload = useCallback((folderName: string | null) => {
    setSelectedUpload(folderName);
    if (folderName) setSelectedDownload(null);
  }, []);

  const handleSelectDownload = useCallback((folderName: string | null) => {
    setSelectedDownload(folderName);
    if (folderName) setSelectedUpload(null);
  }, []);

  const handleInstallComplete = () => {
    setSelectedUpload(null);
    setSelectedDownload(null);
    uploadedListRef.current?.reload();
  };

  const handleBackup = async () => {
    if (backing) return;
    setBacking(true);
    try {
      await window.api.backupAll();
      uploadedListRef.current?.reload();
      setSelectedUpload(null);
    } finally {
      setBacking(false);
    }
  };

  const hasSource = selectedUpload !== null || selectedDownload !== null;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">安装配置</h1>

      {/* Steam/CS2 Status Banners */}
      {detection && <SteamStatusBanner detection={detection} />}

      {/* Path Detection + User Selection */}
      <DetectionCard
        detection={detection}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onUserChange={onUserChange}
      />

      {/* Upload Zone */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-3">
        <h2 className="font-display text-sm font-semibold text-text-secondary">
          上传配置文件
        </h2>
        <UploadZone onUploadComplete={handleUploadComplete} disabled={refreshing} />
      </div>

      {/* Uploaded Config Files */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-text-secondary">
            已上传配置文件
          </h2>
          <button
            onClick={handleBackup}
            disabled={backing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted hover:text-accent hover:bg-accent-bg disabled:opacity-40 disabled:cursor-not-allowed rounded-[var(--radius-sm)] transition-colors cursor-pointer bg-transparent border-none"
            title="将所有上传记录转移到备份目录"
          >
            {backing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Archive size={13} />
            )}
            全部备份
          </button>
        </div>
        <UploadedList
          ref={uploadedListRef}
          selectedFolder={selectedUpload}
          onSelect={handleSelectUpload}
        />
      </div>

      {/* Downloaded Presets */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-3">
        <h2 className="font-display text-sm font-semibold text-text-secondary">
          已下载预设包
        </h2>
        <DownloadsList
          selectedFolder={selectedDownload}
          onSelect={handleSelectDownload}
        />
      </div>

      {/* Install Actions */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4 space-y-3">
        <h2 className="font-display text-sm font-semibold text-text-secondary">
          执行安装
        </h2>
        <InstallActions
          hasSource={hasSource}
          selectedDownload={selectedDownload}
          selectedUpload={selectedUpload}
          onInstallComplete={handleInstallComplete}
        />
      </div>
    </div>
  );
}
