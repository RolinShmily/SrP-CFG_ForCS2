// ── Structured Logging ───────────────────────────────────────

export type LogCategory =
  | "path-detection"
  | "steam-status"
  | "file-ops"
  | "install"
  | "backup"
  | "symlink";

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

// ── Backup ───────────────────────────────────────────────────

export interface BackupEntry {
  folderName: string;
  timestamp: number;
  fileCount: number;
}

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

// ── Staging Sections ─────────────────────────────────────────

export interface StagingSection {
  key: string;
  label: string;
  path: string;
  files: string[];
}

// ── Install Result ───────────────────────────────────────────

export interface InstallResult {
  dirsLinked: number;
  filesLinked: number;
}

// ── Update Check ─────────────────────────────────────────────

export interface GitHubRelease {
  tagName: string;
  name: string;
  body: string;
  htmlUrl: string;
  publishedAt: string;
}

export interface UpdateCheckResult {
  currentVersion: string;
  hasUpdate: boolean;
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
  installFromUpload: (folderName: string, mode: InstallMode) => Promise<InstallResult>;
  deleteUploadEntry: (folderName: string) => Promise<void>;
  openUploadsFolder: () => Promise<void>;

  // Applied Config
  listStagingFiles: () => Promise<StagingSection[]>;
  openStagingDir: (key: string) => Promise<void>;

  // Backup / Restore
  backupAll: () => Promise<number>;
  getBackupEntries: () => Promise<BackupEntry[]>;
  restoreFromSave: (folderName: string) => Promise<void>;
  deleteBackup: (folderName: string) => Promise<void>;
  openBackupFolder: () => Promise<void>;

  // Downloads
  downloadFromUrl: (url: string, fileName: string) => Promise<DownloadEntry | null>;
  getDownloadEntries: () => Promise<DownloadEntry[]>;
  deleteDownload: (folderName: string) => Promise<void>;
  installFromDownload: (folderName: string, mode: InstallMode) => Promise<InstallResult>;
  openDownloadsFolder: () => Promise<void>;

  // Updater
  checkForUpdate: (force?: boolean) => Promise<UpdateCheckResult>;
  dismissUpdate: (version: string) => Promise<void>;

  // Shell
  openExternal: (url: string) => Promise<void>;

  // Utils
  getFilePaths: (files: FileList | File[] | any) => string[];

  // Logs
  onLog: (callback: (entry: LogEntry) => void) => () => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
