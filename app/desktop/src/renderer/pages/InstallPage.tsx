import { useState, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import SteamStatusBanner from "../components/SteamStatusBanner";
import DetectionCard from "../components/DetectionCard";
import UploadZone from "../components/UploadZone";
import UploadedList from "../components/UploadedList";
import DownloadsList from "../components/DownloadsList";
import InstallActions from "../components/InstallActions";
import type { DetectionResult, AppendConflictResult, InstallResult } from "../types";

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

      {/* Upload Config Files — zone + list side by side */}
      <div className="bg-bg-card border border-border rounded-[var(--radius)] p-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="font-display text-sm font-semibold text-text-secondary">
              上传配置文件
            </h2>
            <UploadZone onUploadComplete={handleUploadComplete} disabled={refreshing} />
          </div>
          <div className="space-y-3 min-w-0">
            <h2 className="font-display text-sm font-semibold text-text-secondary">
              已上传配置文件
            </h2>
            <UploadedList
              ref={uploadedListRef}
              selectedFolder={selectedUpload}
              onSelect={handleSelectUpload}
            />
          </div>
        </div>
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
