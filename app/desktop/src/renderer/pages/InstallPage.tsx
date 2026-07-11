import { useState, useRef, useCallback } from "react";
import SteamStatusBanner from "../components/SteamStatusBanner";
import DetectionCard from "../components/DetectionCard";
import UploadZone from "../components/UploadZone";
import UploadedList from "../components/UploadedList";
import DownloadsList from "../components/DownloadsList";
import InstallActions from "../components/InstallActions";
import PageHeader from "../components/PageHeader";
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
    <div className="space-y-6">
      <PageHeader
        title="安装配置"
        description="确认环境与账号，选择一个配置来源，再决定目标目录和部署方式。"
      />

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
      <section className="bg-bg-card border border-border rounded-[var(--radius)] p-5">
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          <div className="space-y-3">
            <h2 className="ui-section-title">上传配置文件</h2>
            <UploadZone onUploadComplete={handleUploadComplete} disabled={refreshing} />
          </div>
          <div className="space-y-3 min-w-0">
            <h2 className="ui-section-title">已上传配置文件</h2>
            <UploadedList
              ref={uploadedListRef}
              selectedFolder={selectedUpload}
              onSelect={handleSelectUpload}
            />
          </div>
        </div>
      </section>
      {/* Downloaded configuration package */}
      <section className="bg-bg-card border border-border rounded-[var(--radius)] p-5 space-y-3">
        <h2 className="ui-section-title">已下载配置包</h2>
        <DownloadsList
          selectedFolder={selectedDownload}
          onSelect={handleSelectDownload}
        />
      </section>

      {/* Install Actions */}
      <section className="bg-bg-card border border-border rounded-[var(--radius)] p-5 space-y-3">
        <h2 className="ui-section-title">执行安装</h2>
        <InstallActions
          hasSource={hasSource}
          selectedDownload={selectedDownload}
          selectedUpload={selectedUpload}
          onInstallComplete={handleInstallComplete}
        />
      </section>
    </div>
  );
}
