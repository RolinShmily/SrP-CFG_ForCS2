interface DetectedPaths {
  steamPath: string | null;
  cs2CfgPath: string | null;
  annotationsPath: string | null;
  videoCfgPath: string | null;
}

export interface ElectronAPI {
  // Window controls
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;

  // Installer
  detectPaths: () => Promise<DetectedPaths>;
  getSteamUsers: (steamRoot: string) => Promise<string[]>;
  setSteamUser: (userId: string) => Promise<string | null>;
  install: (opts: {
    sourcePath: string;
    isZip: boolean;
    installCfg: boolean;
    installVideo: boolean;
    installAnnotations: boolean;
  }) => Promise<void>;
  openBackupFolder: () => Promise<void>;
  onLog: (callback: (msg: string) => void) => () => void;

  // Backup & Restore
  backupConfig: () => Promise<void>;
  restoreFromBackup: () => Promise<void>;

  // Updater
  checkForUpdate: () => Promise<{
    latestVersion: string;
    currentVersion: string;
    htmlUrl: string;
  } | null>;

  // Shell
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
