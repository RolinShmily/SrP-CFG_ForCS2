const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Window controls
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),

  // Installer
  detectPaths: () => ipcRenderer.invoke("installer:detectPaths"),
  getSteamUsers: (steamRoot) => ipcRenderer.invoke("installer:getSteamUsers", steamRoot),
  setSteamUser: (userId) => ipcRenderer.invoke("installer:setSteamUser", userId),
  install: (opts) => ipcRenderer.invoke("installer:install", opts),
  openBackupFolder: () => ipcRenderer.invoke("installer:openBackupFolder"),

  // Backup & Restore
  backupConfig: () => ipcRenderer.invoke("installer:backupOnly"),
  restoreFromBackup: () => ipcRenderer.invoke("installer:restoreFromBackup"),

  // Log listener — main process pushes via webContents.send
  onLog: (callback) => {
    const handler = (_event, msg) => callback(msg);
    ipcRenderer.on("installer:log", handler);
    return () => ipcRenderer.removeListener("installer:log", handler);
  },

  // Updater
  checkForUpdate: () => ipcRenderer.invoke("updater:check"),

  // Shell
  openExternal: (url) => ipcRenderer.invoke("shell:openExternal", url),
});
