import { contextBridge, ipcRenderer, webUtils } from "electron";

contextBridge.exposeInMainWorld("api", {
  // Window controls
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),

  // Detection
  detectAll: () => ipcRenderer.invoke("installer:detectAll"),
  setCurrentUser: (accountId: string) =>
    ipcRenderer.invoke("installer:setCurrentUser", accountId),

  // Upload / Staging
  uploadFiles: (filePaths: string[]) =>
    ipcRenderer.invoke("installer:uploadFiles", filePaths),
  getUploadHistory: () => ipcRenderer.invoke("installer:getUploadHistory"),

  // Uploaded entries
  getUploadedEntries: () => ipcRenderer.invoke("installer:getUploadedEntries"),
  installFromUpload: (folderName: string, mode: "overlay" | "append", usePersonalCfg?: boolean) =>
    ipcRenderer.invoke("installer:installFromUpload", folderName, mode, usePersonalCfg),
  deleteUploadEntry: (folderName: string) =>
    ipcRenderer.invoke("installer:deleteUploadEntry", folderName),
  openUploadsFolder: () => ipcRenderer.invoke("installer:openUploadsFolder"),

  // Installed data (install.json)
  getInstalledData: () => ipcRenderer.invoke("installer:getInstalledData"),
  deleteInstalledItem: (category: string, name: string) =>
    ipcRenderer.invoke("installer:deleteInstalledItem", category, name),
  clearInstallCategory: (category: string) =>
    ipcRenderer.invoke("installer:clearInstallCategory", category),

  // Open item
  openItem: (storage: "install" | "save" | "res", category: string, name: string) =>
    ipcRenderer.invoke("installer:openItem", storage, category, name),

  // Conflict recovery (res.json)
  getResData: () => ipcRenderer.invoke("installer:getResData"),
  restoreFromRes: (category: string, name: string) =>
    ipcRenderer.invoke("installer:restoreFromRes", category, name),
  deleteResItem: (category: string, name: string) =>
    ipcRenderer.invoke("installer:deleteResItem", category, name),
  clearResCategory: (category: string) =>
    ipcRenderer.invoke("installer:clearResCategory", category),
  restoreResCategory: (category: string) =>
    ipcRenderer.invoke("installer:restoreResCategory", category),

  // Backup (save.json)
  getSaveData: () => ipcRenderer.invoke("installer:getSaveData"),
  restoreFromSave: () => ipcRenderer.invoke("installer:restoreFromSave"),
  deleteSaveItem: (category: string, name: string) =>
    ipcRenderer.invoke("installer:deleteSaveItem", category, name),
  clearSaveCategory: (category: string) =>
    ipcRenderer.invoke("installer:clearSaveCategory", category),
  restoreSaveCategory: (category: string) =>
    ipcRenderer.invoke("installer:restoreSaveCategory", category),
  restoreSaveItem: (category: string, name: string) =>
    ipcRenderer.invoke("installer:restoreSaveItem", category, name),
  openSaveFolder: () => ipcRenderer.invoke("installer:openSaveFolder"),
  openResFolder: () => ipcRenderer.invoke("installer:openResFolder"),

  confirmAppend: (folderName: string, source: "upload" | "download", proceed: boolean, usePersonalCfg?: boolean) =>
    ipcRenderer.invoke("installer:confirmAppend", folderName, source, proceed, usePersonalCfg),
  // Downloads
  downloadFromUrl: (url: string, fileName: string) =>
    ipcRenderer.invoke("installer:downloadFromUrl", url, fileName),
  getDownloadEntries: () => ipcRenderer.invoke("installer:getDownloadEntries"),
  deleteDownload: (folderName: string) =>
    ipcRenderer.invoke("installer:deleteDownload", folderName),
  installFromDownload: (folderName: string, mode: "overlay" | "append", usePersonalCfg?: boolean) =>
    ipcRenderer.invoke("installer:installFromDownload", folderName, mode, usePersonalCfg),
  openDownloadsFolder: () => ipcRenderer.invoke("installer:openDownloadsFolder"),
  // App Info
  getVersion: () => ipcRenderer.invoke("app:getVersion"),
  getLatestVersion: () => ipcRenderer.invoke("app:getLatestVersion"),

  // Updater
  checkForUpdate: (force?: boolean) =>
    ipcRenderer.invoke("updater:check", force),
  dismissUpdate: (version: string) =>
    ipcRenderer.invoke("updater:dismiss", version),
  getUpdateHistory: () =>
    ipcRenderer.invoke("updater:history"),

  // Shell
  openExternal: (url: string) =>
    ipcRenderer.invoke("shell:openExternal", url),

  // Utils
  getFilePaths: (files: File[]): string[] => {
    const paths: string[] = [];
    for (const file of files) {
      try {
        const p = webUtils.getPathForFile(file);
        if (p) paths.push(p);
      } catch {
        // skip
      }
    }
    return paths;
  },

  // Logs (structured)
  onLog: (callback: (entry: any) => void) => {
    const handler = (_event: any, entry: any) => callback(entry);
    ipcRenderer.on("log:new", handler);
    return () => {
      ipcRenderer.removeListener("log:new", handler);
    };
  },
});
