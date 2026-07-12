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
  userCfgPath: string | null;
  vcfgState: VcfgStateSummary;
  steamUsers: SteamUser[];
  currentUser: SteamUser | null;
  hasAutoLoginUser: boolean;
}

export interface VcfgStateSummary {
  available: boolean;
  bindings: number;
  analogBindings: number;
  cloudConvars: number;
  machineConvars: number;
  hasCloudMirror: boolean;
  hasVideoConfig: boolean;
}


export interface VcfgSnapshot {
  schemaVersion: 1;
  capturedAt: number;
  userCfgPath: string;
  bindings: Record<string, string>;
  analogBindings: Record<string, string>;
  userConvars: Record<string, string>;
  machineConvars: Record<string, string>;
}

export interface UserConfigSelection {
  userCfgPath: string | null;
  vcfgState: VcfgStateSummary;
}

export interface UserConfigDocument {
  path: string | null;
  target: "game" | "account" | null;
  exists: boolean;
  runtimeInstalled: boolean;
  content: string;
  modifiedAt: number | null;
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
  gameCfg: CategoryData;
  userCfg: CategoryData;
  annotations: CategoryData;
  video: CategoryData;
}
export interface ResData {
  gameCfg: CategoryData;
  userCfg: CategoryData;
  annotations: CategoryData;
  video: CategoryData;
}
export interface SaveData {
  gameCfg: CategoryData;
  userCfg: CategoryData;
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
  hasConfigAssets: boolean;
}

export interface UpdateCheckResult {
  currentVersion: string;
  hasUpdate: boolean;
  hasDesktopUpdate: boolean;
  hasConfigUpdate: boolean;
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
  setCurrentUser: (accountId: string) => Promise<UserConfigSelection>;

  // User-owned final override layer
  getUserConfig: () => Promise<UserConfigDocument>;
  saveUserConfig: (content: string) => Promise<UserConfigDocument>;
  openUserConfigFolder: () => Promise<void>;

  // VCFG snapshot (current game state)
  captureVcfgSnapshot: () => Promise<VcfgSnapshot | null>;
  generateCfgFromSnapshot: (options: {
    bindings: boolean;
    analogBindings: boolean;
    userConvars: boolean;
    machineConvars: boolean;
  }) => Promise<string | null>;

  // Upload / Staging
  uploadFiles: (filePaths: string[]) => Promise<UploadEntry>;
  getUploadHistory: () => Promise<UploadEntry[]>;

  // Uploaded entries (ZIP and non-ZIP)
  getUploadedEntries: () => Promise<UploadedEntry[]>;
  installFromUpload: (folderName: string, mode: InstallMode, usePersonalCfg?: boolean) => Promise<InstallResult | AppendConflictResult>;
  deleteUploadEntry: (folderName: string) => Promise<void>;
  openUploadsFolder: () => Promise<void>;

  // Applied Config (install.json)
  getInstalledData: () => Promise<InstalledData>;
  deleteInstalledItem: (category: string, name: string) => Promise<boolean>;
  clearInstallCategory: (category: string) => Promise<number>;

  // Open item (file in notepad / dir in explorer)
  openItem: (storage: "install" | "save" | "res", category: string, name: string) => Promise<boolean>;

  // Conflict Recovery (res.json)
  getResData: () => Promise<ResData>;
  restoreFromRes: (category: string, name: string) => Promise<boolean>;
  deleteResItem: (category: string, name: string) => Promise<boolean>;
  clearResCategory: (category: string) => Promise<void>;
  restoreResCategory: (category: string) => Promise<number>;

  // Backup (save.json)
  getSaveData: () => Promise<SaveData>;
  restoreFromSave: () => Promise<boolean>;
  deleteSaveItem: (category: string, name: string) => Promise<boolean>;
  clearSaveCategory: (category: string) => Promise<void>;
  restoreSaveCategory: (category: string) => Promise<number>;
  restoreSaveItem: (category: string, name: string) => Promise<boolean>;
  openSaveFolder: () => Promise<void>;
  openResFolder: () => Promise<void>;
  openVcfgSnapshotsFolder: () => Promise<void>;

  // Append conflict confirmation
  confirmAppend: (folderName: string, source: "upload" | "download", proceed: boolean, usePersonalCfg?: boolean) => Promise<InstallResult | null>;

  // Downloads
  downloadFromUrl: (url: string, fileName: string) => Promise<DownloadEntry | null>;
  getDownloadEntries: () => Promise<DownloadEntry[]>;
  deleteDownload: (folderName: string) => Promise<void>;
  installFromDownload: (folderName: string, mode: InstallMode, usePersonalCfg?: boolean) => Promise<InstallResult | AppendConflictResult>;
  openDownloadsFolder: () => Promise<void>;

  // App Info
  getVersion: () => Promise<string>;
  getLatestVersion: () => Promise<string>;

  // Updater
  checkForUpdate: (force?: boolean) => Promise<UpdateCheckResult>;
  dismissUpdate: (version: string) => Promise<void>;
  getUpdateHistory: () => Promise<GitHubRelease[] | null>;

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
