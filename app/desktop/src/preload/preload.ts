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
  getUploadedEntries: () =>
    ipcRenderer.invoke("installer:getUploadedEntries"),
  installFromUpload: (folderName: string, mode: "overlay" | "append") =>
    ipcRenderer.invoke("installer:installFromUpload", folderName, mode),
  deleteUploadEntry: (folderName: string) =>
    ipcRenderer.invoke("installer:deleteUploadEntry", folderName),
  openUploadsFolder: () =>
    ipcRenderer.invoke("installer:openUploadsFolder"),

  // Applied Config
  listStagingFiles: () => ipcRenderer.invoke("installer:listStagingFiles"),
  openStagingDir: (key: string) =>
    ipcRenderer.invoke("installer:openStagingDir", key),

  // Backup / Restore
  backupAll: () => ipcRenderer.invoke("installer:backupAll"),
  getBackupEntries: () => ipcRenderer.invoke("installer:getBackupEntries"),
  restoreFromSave: (folderName: string) =>
    ipcRenderer.invoke("installer:restoreFromSave", folderName),
  deleteBackup: (folderName: string) =>
    ipcRenderer.invoke("installer:deleteBackup", folderName),
  openBackupFolder: () => ipcRenderer.invoke("installer:openBackupFolder"),

  // Downloads
  downloadFromUrl: (url: string, fileName: string) =>
    ipcRenderer.invoke("installer:downloadFromUrl", url, fileName),
  getDownloadEntries: () =>
    ipcRenderer.invoke("installer:getDownloadEntries"),
  deleteDownload: (folderName: string) =>
    ipcRenderer.invoke("installer:deleteDownload", folderName),
  installFromDownload: (folderName: string, mode: "overlay" | "append") =>
    ipcRenderer.invoke("installer:installFromDownload", folderName, mode),
  openDownloadsFolder: () =>
    ipcRenderer.invoke("installer:openDownloadsFolder"),

  // Updater
  checkForUpdate: (force?: boolean) =>
    ipcRenderer.invoke("updater:check", force),
  dismissUpdate: (version: string) =>
    ipcRenderer.invoke("updater:dismiss", version),

  // Shell
  openExternal: (url: string) =>
    ipcRenderer.invoke("shell:openExternal", url),

  // Utils — extract real file paths from File objects (contextIsolation safe)
  // NOTE: FileList (DOM collection) becomes a non-iterable Proxy through contextBridge.
  // The renderer MUST convert FileList to a plain Array before calling this.
  getFilePaths: (files: File[]): string[] => {
    const paths: string[] = [];
    for (const file of files) {
      try {
        const p = webUtils.getPathForFile(file);
        if (p) paths.push(p);
      } catch {
        // skip files without paths
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
