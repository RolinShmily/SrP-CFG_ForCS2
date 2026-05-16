import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  // Window controls
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),

  // Installer
  detectPaths: () => ipcRenderer.invoke("installer:detectPaths"),
  getSteamUsers: (steamRoot: string) =>
    ipcRenderer.invoke("installer:getSteamUsers", steamRoot),
  setSteamUser: (userId: string) =>
    ipcRenderer.invoke("installer:setSteamUser", userId),
  install: (opts: Record<string, unknown>) =>
    ipcRenderer.invoke("installer:install", opts),
  openBackupFolder: () => ipcRenderer.invoke("installer:openBackupFolder"),

  // Backup & Restore
  backupConfig: () => ipcRenderer.invoke("installer:backupOnly"),
  restoreFromBackup: () => ipcRenderer.invoke("installer:restoreFromBackup"),

  // Updater
  checkForUpdate: () => ipcRenderer.invoke("updater:check"),

  // Shell
  openExternal: (url: string) =>
    ipcRenderer.invoke("shell:openExternal", url),
});
