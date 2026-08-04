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
 * `app/desktop/src/preload/preload.ts` 契约基准），renderer 的 `window.api.*`
 * 调用点零改动。实现内部走 Tauri `invoke()` / `listen()`。
 *
 * 命令名 = Rust 侧 `#[tauri::command]` 函数名（snake_case，见
 * `src-tauri/src/commands/`）；参数 key 按 `rename_all = "camelCase"`
 * 转换（如 accountId / usePersonalCfg / file_name → fileName）。
 * （2026-08 L2 遗留收尾：实测发现旧实现误用 Electron 时代
 *  "installer:detectAll" 式通道名，全部命令名已修正为真实注册名。）
 */
export function createApi(): ElectronAPI {
  return {
    // ── Window controls ──
    minimize: () => invoke("minimize"),
    maximize: () => invoke("maximize"),
    close: () => invoke("close"),
    isMaximized: () => invoke("is_maximized"),

    // ── Detection ──
    detectAll: () => invoke<DetectionResult>("detect_all"),
    setCurrentUser: (accountId) =>
      invoke<UserConfigSelection>("set_current_user", { accountId }),

    // ── User-owned final override layer ──
    getUserConfig: () => invoke<UserConfigDocument>("user_config_get"),
    saveUserConfig: (content) =>
      invoke<UserConfigDocument>("user_config_save", { content }),
    openUserConfigFolder: () => invoke("user_config_open_folder"),

    // ── VCFG snapshot ──
    captureVcfgSnapshot: () =>
      invoke<VcfgSnapshot | null>("vcfg_capture_snapshot"),
    generateCfgFromSnapshot: (options) =>
      invoke<string | null>("vcfg_generate_cfg", { options }),

    // ── Upload / Staging ──
    uploadFiles: (filePaths) =>
      invoke<UploadEntry>("upload_files", { filePaths }),
    getUploadHistory: () => invoke<UploadEntry[]>("get_upload_history"),

    // ── Uploaded entries ──
    getUploadedEntries: () => invoke<UploadedEntry[]>("get_uploaded_entries"),
    installFromUpload: (folderName, mode, usePersonalCfg) =>
      invoke<InstallResult | AppendConflictResult>("install_from_upload", {
        folderName,
        mode,
        usePersonalCfg,
      }),
    deleteUploadEntry: (folderName) =>
      invoke("delete_upload_entry", { folderName }),
    openUploadsFolder: () => invoke("open_uploads_folder"),

    // ── Applied Config (install.json) ──
    getInstalledData: () => invoke<InstalledData>("get_installed_data"),
    deleteInstalledItem: (category, name) =>
      invoke<boolean>("delete_installed_item", { category, name }),
    clearInstallCategory: (category) =>
      invoke<number>("clear_install_category", { category }),

    // ── Open item ──
    openItem: (storage, category, name) =>
      invoke<boolean>("open_item", { storage, category, name }),

    // ── Conflict Recovery (res.json) ──
    getResData: () => invoke<ResData>("get_res_data"),
    restoreFromRes: (category, name) =>
      invoke<boolean>("restore_from_res", { category, name }),
    deleteResItem: (category, name) =>
      invoke<boolean>("delete_res_item", { category, name }),
    clearResCategory: (category) =>
      invoke<void>("clear_res_category", { category }),
    restoreResCategory: (category) =>
      invoke<number>("restore_res_category", { category }),

    // ── Backup (save.json) ──
    getSaveData: () => invoke<SaveData>("get_save_data"),
    restoreFromSave: () => invoke<boolean>("restore_from_save"),
    deleteSaveItem: (category, name) =>
      invoke<boolean>("delete_save_item", { category, name }),
    clearSaveCategory: (category) =>
      invoke<void>("clear_save_category", { category }),
    restoreSaveCategory: (category) =>
      invoke<number>("restore_save_category", { category }),
    restoreSaveItem: (category, name) =>
      invoke<boolean>("restore_save_item", { category, name }),
    openSaveFolder: () => invoke("open_save_folder"),
    openResFolder: () => invoke("open_res_folder"),
    openVcfgSnapshotsFolder: () => invoke("open_vcfg_snapshots_folder"),

    // ── Append conflict confirmation ──
    confirmAppend: (folderName, source, proceed, usePersonalCfg) =>
      invoke<InstallResult | null>("confirm_append", {
        folderName,
        source,
        proceed,
        usePersonalCfg,
      }),

    // ── Downloads ──
    downloadFromUrl: (url, fileName) =>
      invoke<DownloadEntry | null>("download_from_url", { url, fileName }),
    getDownloadEntries: () => invoke<DownloadEntry[]>("get_download_entries"),
    deleteDownload: (folderName) =>
      invoke("delete_download", { folderName }),
    installFromDownload: (folderName, mode, usePersonalCfg) =>
      invoke<InstallResult | AppendConflictResult>("install_from_download", {
        folderName,
        mode,
        usePersonalCfg,
      }),
    openDownloadsFolder: () => invoke("open_downloads_folder"),

    // ── App Info ──
    getVersion: () => invoke<string>("app_get_version"),
    getLatestVersion: () => invoke<string>("app_get_latest_version"),

    // ── Updater ──
    checkForUpdate: (force) =>
      invoke<UpdateCheckResult>("updater_check", { force }),
    dismissUpdate: (version) => invoke("updater_dismiss", { version }),
    getUpdateHistory: () => invoke<GitHubRelease[] | null>("updater_history"),

    // ── Shell ──
    openExternal: (url) => invoke("shell_open_external", { url }),

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
