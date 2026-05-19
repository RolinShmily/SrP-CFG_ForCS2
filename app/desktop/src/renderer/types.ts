// ── Structured Logging ───────────────────────────────────────

export type LogCategory =
  | "path-detection"
  | "steam-status"
  | "file-ops"
  | "install"
  | "backup";

export type LogLevel = "info" | "success" | "warning" | "error" | "progress";

export interface LogEntry {
  category: LogCategory;
  level: LogLevel;
  message: string;
  detail?: string;
  timestamp: number;
}

// ── Detection ────────────────────────────────────────────────

export type Cs2InstallState = "installed" | "needs-update" | "not-installed";

export interface SteamUser {
  steamId64: string;
  accountId: string;
  personaName?: string;
}

export interface DetectionResult {
  steamPath: string | null;
  cs2InstallState: Cs2InstallState;
  cs2InstallDir: string | null;
  cs2CfgPath: string | null;
  annotationsPath: string | null;
  videoCfgPath: string | null;
  steamUsers: SteamUser[];
  currentUser: SteamUser | null;
  hasAutoLoginUser: boolean;
}

// ── Upload / Staging ─────────────────────────────────────────

export interface UploadEntry {
  folderName: string;
  timestamp: number;
  fileCount: number;
  files: UploadFileInfo[];
}

export interface UploadFileInfo {
  name: string;
  relativePath: string;
  type: "cfg" | "txt" | "unsupported";
  size: number;
}

export type InstallMode = "overlay" | "append";

// ── Downloads ────────────────────────────────────────────────

export interface DownloadEntry {
  folderName: string;
  fileName: string;
  timestamp: number;
  size: number;
}

// ── Uploaded Entries ─────────────────────────────────────────

export interface UploadedEntry {
  folderName: string;
  displayName: string;
  timestamp: number;
  size: number;
  fileCount: number;
  isZip: boolean;
}

// ── Install / Res / Save Data ────────────────────────────────

export interface CategoryData {
  files: string[];
  dirs: string[];
  path: string;
}

export interface InstalledData {
  cfg: CategoryData;
  annotations: CategoryData;
  video: CategoryData;
}

export interface ResData {
  cfg: CategoryData;
  annotations: CategoryData;
  video: CategoryData;
}

export interface SaveData {
  cfg: CategoryData;
  annotations: CategoryData;
  video: CategoryData;
}

// ── Install Result ───────────────────────────────────────────

export interface InstallResult {
  filesInstalled: number;
  dirsInstalled: number;
}

export interface AppendConflictResult {
  needsConfirm: boolean;
  conflicts: { category: string; names: string[] }[];
}

// ── Update Check ─────────────────────────────────────────────

export interface GitHubRelease {
  tagName: string;
  name: string;
  body: string;
  htmlUrl: string;
  publishedAt: string;
  hasDesktopAssets: boolean;
}

export interface UpdateCheckResult {
  currentVersion: string;
  hasUpdate: boolean;
  hasDesktopUpdate: boolean;
  hasPresetUpdate: boolean;
  releases: GitHubRelease[];
}

// ── Window API Type Declaration ──────────────────────────────

export interface ElectronAPI {
  // Window controls
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;

  // Detection
  detectAll: () => Promise<DetectionResult>;
  setCurrentUser: (accountId: string) => Promise<string | null>;

  // Upload / Staging
  uploadFiles: (filePaths: string[]) => Promise<UploadEntry>;
  getUploadHistory: () => Promise<UploadEntry[]>;

  // Uploaded entries (ZIP and non-ZIP)
  getUploadedEntries: () => Promise<UploadedEntry[]>;
  installFromUpload: (folderName: string, mode: InstallMode) => Promise<InstallResult | AppendConflictResult>;
  deleteUploadEntry: (folderName: string) => Promise<void>;
  openUploadsFolder: () => Promise<void>;

  // Applied Config (install.json)
  getInstalledData: () => Promise<InstalledData>;
  deleteInstalledItem: (category: string, name: string) => Promise<boolean>;

  // Conflict Recovery (res.json)
  getResData: () => Promise<ResData>;
  restoreFromRes: (category: string, name: string) => Promise<boolean>;

  // Backup (save.json)
  getSaveData: () => Promise<SaveData>;
  restoreFromSave: () => Promise<boolean>;
  openSaveFolder: () => Promise<void>;
  openResFolder: () => Promise<void>;

  // Append conflict confirmation
  confirmAppend: (folderName: string, source: "upload" | "download", proceed: boolean) => Promise<InstallResult | null>;

  // Downloads
  downloadFromUrl: (url: string, fileName: string) => Promise<DownloadEntry | null>;
  getDownloadEntries: () => Promise<DownloadEntry[]>;
  deleteDownload: (folderName: string) => Promise<void>;
  installFromDownload: (folderName: string, mode: InstallMode) => Promise<InstallResult | AppendConflictResult>;
  openDownloadsFolder: () => Promise<void>;

  // App Info
  getVersion: () => Promise<string>;

  // Updater
  checkForUpdate: (force?: boolean) => Promise<UpdateCheckResult>;
  dismissUpdate: (version: string) => Promise<void>;
  getUpdateHistory: () => Promise<GitHubRelease[]>;

  // Shell
  openExternal: (url: string) => Promise<void>;

  // Utils
  getFilePaths: (files: FileList | File[] | any) => string[];

  // Logs
  onLog: (callback: (entry: LogEntry) => void) => () => void;

  // Append conflict notification (main → renderer)
  onAppendConflicts: (callback: (conflicts: { category: string; names: string[] }[]) => void) => () => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
