import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  AppendConflictResult,
  DetectionResult,
  DownloadEntry,
  ElectronAPI,
  GitHubRelease,
  InstallMode,
  InstallResult,
  InstalledData,
  LogEntry,
  ResData,
  SaveData,
  UpdateCheckResult,
  UploadEntry,
  UploadedEntry,
  UserConfigDocument,
  UserConfigSelection,
  VcfgSnapshot,
} from "../types";

/**
 * Tauri IPC 适配层（L2.2）。
 *
 * 保持 `ElectronAPI` 签名与 Electron 版 preload 完全一致（见
 * tasks/layer-2-desktop-tauri/api-contract.md），renderer 的 `window.api.*`
 * 调用点零改动。实现内部走 Tauri `invoke()` / `listen()`。
 *
 * Rust 侧 command 名与这里传入的字符串一一对应（`src-tauri/src/commands/`）。
 */
export function createApi(): ElectronAPI {
  return {
    // ── Window controls ──
    minimize: () => invoke("window:minimize"),
    maximize: () => invoke("window:maximize"),
    close: () => invoke("window:close"),
    isMaximized: () => invoke("window:isMaximized"),

    // ── Detection ──
    detectAll: () => invoke<DetectionResult>("installer:detectAll"),
    setCurrentUser: (accountId) =>
      invoke<UserConfigSelection>("installer:setCurrentUser", { accountId }),

    // ── User-owned final override layer ──
    getUserConfig: () => invoke<UserConfigDocument>("userConfig:get"),
    saveUserConfig: (content) =>
      invoke<UserConfigDocument>("userConfig:save", { content }),
    openUserConfigFolder: () => invoke("userConfig:openFolder"),

    // ── VCFG snapshot ──
    captureVcfgSnapshot: () =>
      invoke<VcfgSnapshot | null>("vcfg:captureSnapshot"),
    generateCfgFromSnapshot: (options) =>
      invoke<string | null>("vcfg:generateCfg", { options }),

    // ── Upload / Staging ──
    uploadFiles: (filePaths) =>
      invoke<UploadEntry>("installer:uploadFiles", { filePaths }),
    getUploadHistory: () => invoke<UploadEntry[]>("installer:getUploadHistory"),

    // ── Uploaded entries ──
    getUploadedEntries: () => invoke<UploadedEntry[]>("installer:getUploadedEntries"),
    installFromUpload: (folderName, mode, usePersonalCfg) =>
      invoke<InstallResult | AppendConflictResult>("installer:installFromUpload", {
        folderName,
        mode,
        usePersonalCfg,
      }),
    deleteUploadEntry: (folderName) =>
      invoke("installer:deleteUploadEntry", { folderName }),
    openUploadsFolder: () => invoke("installer:openUploadsFolder"),

    // ── Applied Config (install.json) ──
    getInstalledData: () => invoke<InstalledData>("installer:getInstalledData"),
    deleteInstalledItem: (category, name) =>
      invoke<boolean>("installer:deleteInstalledItem", { category, name }),
    clearInstallCategory: (category) =>
      invoke<number>("installer:clearInstallCategory", { category }),

    // ── Open item ──
    openItem: (storage, category, name) =>
      invoke<boolean>("installer:openItem", { storage, category, name }),

    // ── Conflict Recovery (res.json) ──
    getResData: () => invoke<ResData>("installer:getResData"),
    restoreFromRes: (category, name) =>
      invoke<boolean>("installer:restoreFromRes", { category, name }),
    deleteResItem: (category, name) =>
      invoke<boolean>("installer:deleteResItem", { category, name }),
    clearResCategory: (category) =>
      invoke<void>("installer:clearResCategory", { category }),
    restoreResCategory: (category) =>
      invoke<number>("installer:restoreResCategory", { category }),

    // ── Backup (save.json) ──
    getSaveData: () => invoke<SaveData>("installer:getSaveData"),
    restoreFromSave: () => invoke<boolean>("installer:restoreFromSave"),
    deleteSaveItem: (category, name) =>
      invoke<boolean>("installer:deleteSaveItem", { category, name }),
    clearSaveCategory: (category) =>
      invoke<void>("installer:clearSaveCategory", { category }),
    restoreSaveCategory: (category) =>
      invoke<number>("installer:restoreSaveCategory", { category }),
    restoreSaveItem: (category, name) =>
      invoke<boolean>("installer:restoreSaveItem", { category, name }),
    openSaveFolder: () => invoke("installer:openSaveFolder"),
    openResFolder: () => invoke("installer:openResFolder"),
    openVcfgSnapshotsFolder: () => invoke("installer:openVcfgSnapshotsFolder"),

    // ── Append conflict confirmation ──
    confirmAppend: (folderName, source, proceed, usePersonalCfg) =>
      invoke<InstallResult | null>("installer:confirmAppend", {
        folderName,
        source,
        proceed,
        usePersonalCfg,
      }),

    // ── Downloads ──
    downloadFromUrl: (url, fileName) =>
      invoke<DownloadEntry | null>("installer:downloadFromUrl", { url, fileName }),
    getDownloadEntries: () => invoke<DownloadEntry[]>("installer:getDownloadEntries"),
    deleteDownload: (folderName) =>
      invoke("installer:deleteDownload", { folderName }),
    installFromDownload: (folderName, mode, usePersonalCfg) =>
      invoke<InstallResult | AppendConflictResult>("installer:installFromDownload", {
        folderName,
        mode,
        usePersonalCfg,
      }),
    openDownloadsFolder: () => invoke("installer:openDownloadsFolder"),

    // ── App Info ──
    getVersion: () => invoke<string>("app:getVersion"),
    getLatestVersion: () => invoke<string>("app:getLatestVersion"),

    // ── Updater ──
    checkForUpdate: (force) =>
      invoke<UpdateCheckResult>("updater:check", { force }),
    dismissUpdate: (version) => invoke("updater:dismiss", { version }),
    getUpdateHistory: () => invoke<GitHubRelease[] | null>("updater:history"),

    // ── Shell ──
    openExternal: (url) => invoke("shell:openExternal", { url }),

    // ── Utils ──
    getFilePaths: (files) => {
      // L2.2 遗留收尾（换实现不改签名）：Tauri v2 无 Electron webUtils.getPathForFile
      // 等价物——拖拽路径经 tauri://drag-drop（onDragDropEvent）事件获取、对话框路径由
      // @tauri-apps/plugin-dialog 的 open() 直接返回字符串数组。本方法对传入的路径字符串
      // 做归一化/去重；File 对象无法取真实路径（Tauri 限制）时返回 []。
      const list = files
        ? Array.isArray(files)
          ? files
          : Array.from(files as ArrayLike<unknown>)
        : [];
      const paths: string[] = [];
      for (const item of list) {
        if (typeof item === "string") {
          const p = item.trim();
          if (p && !paths.includes(p)) paths.push(p);
        }
      }
      return paths;
    },

    // ── Logs ──
    onLog: (callback) => {
      const unlistenPromise: Promise<UnlistenFn> = listen<LogEntry>("log:new", (event) => {
        callback(event.payload);
      });
      return () => {
        unlistenPromise.then((fn) => fn()).catch(() => {});
      };
    },

    // ── Append conflict notification ──
    onAppendConflicts: (callback) => {
      const unlistenPromise: Promise<UnlistenFn> = listen<{ category: string; names: string[] }[]>(
        "append-conflicts",
        (event) => callback(event.payload),
      );
      return () => {
        unlistenPromise.then((fn) => fn()).catch(() => {});
      };
    },
  };
}
