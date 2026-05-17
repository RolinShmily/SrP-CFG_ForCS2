import { ipcMain, shell, BrowserWindow } from "electron";
import { AppState } from "./state";
import * as detection from "./services/detection";
import * as staging from "./services/staging";
import * as symlinker from "./services/symlinker";
import { checkForUpdate, dismissVersion } from "./services/updater";
import type { LogEntry, InstallMode } from "../renderer/types";

const state = new AppState();

function sendLog(entry: Omit<LogEntry, "timestamp">): void {
  const full: LogEntry = { ...entry, timestamp: Date.now() };
  const win = BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) {
    win.webContents.send("log:new", full);
  }
}

export function registerIpcHandlers() {
  // ── Detection ──────────────────────────────────────────────

  ipcMain.handle("installer:detectAll", async () => {
    const result = await detection.detectAll(sendLog);

    // Update module state
    state.steamPath = result.steamPath;
    state.cs2InstallState = result.cs2InstallState;
    state.cs2InstallDir = result.cs2InstallDir;
    state.cs2CfgPath = result.cs2CfgPath;
    state.annotationsPath = result.annotationsPath;
    state.videoCfgPath = result.videoCfgPath;
    state.steamUsers = result.steamUsers;
    state.currentUser = result.currentUser;
    state.hasAutoLoginUser = result.hasAutoLoginUser;

    sendLog({
      category: "path-detection",
      level: "success",
      message: "环境检测完成",
    });

    return result;
  });

  ipcMain.handle(
    "installer:setCurrentUser",
    async (_e, accountId: string) => {
      const user = state.steamUsers.find((u) => u.accountId === accountId);
      state.currentUser = user ?? null;

      if (state.steamPath) {
        state.videoCfgPath = detection.detectVideoCfgPath(
          state.steamPath,
          accountId,
          sendLog,
        );
      } else {
        state.videoCfgPath = null;
      }

      return state.videoCfgPath;
    },
  );

  // ── Upload / Staging ───────────────────────────────────────

  ipcMain.handle(
    "installer:uploadFiles",
    async (_e, filePaths: string[]) => {
      return await staging.uploadFiles(filePaths, sendLog);
    },
  );

  ipcMain.handle("installer:getUploadHistory", async () => {
    return staging.getUploadHistory();
  });

  // ── Uploaded Entries ────────────────────────────────────────

  ipcMain.handle("installer:getUploadedEntries", async () => {
    return staging.getUploadedEntries();
  });

  ipcMain.handle(
    "installer:installFromUpload",
    async (_e, folderName: string, mode: InstallMode) => {
      const result = await staging.installFromUpload(folderName, mode, sendLog);
      if (!result) return { dirsLinked: 0, filesLinked: 0 };

      // Auto-backup: move from tmp to saves
      staging.moveToSaves(folderName, sendLog);

      const summary = symlinker.installToGame(
        {
          cfg: staging.getStagingPath("cfg"),
          annotations: staging.getStagingPath("annotations"),
          video: staging.getStagingPath("video"),
        },
        {
          cfgPath: state.cs2CfgPath,
          annotationsPath: state.annotationsPath,
          videoPath: state.videoCfgPath,
        },
        sendLog,
      );

      sendLog({
        category: "install",
        level: "success",
        message: "上传包安装完成！",
      });

      return summary;
    },
  );

  ipcMain.handle(
    "installer:deleteUploadEntry",
    async (_e, folderName: string) => {
      staging.deleteUploadEntry(folderName, sendLog);
    },
  );

  ipcMain.handle("installer:openUploadsFolder", async () => {
    await shell.openPath(staging.getTmpPath());
  });

  // ── Applied Config ─────────────────────────────────────────

  ipcMain.handle("installer:listStagingFiles", async () => {
    return staging.listStagingFiles();
  });

  ipcMain.handle(
    "installer:openStagingDir",
    async (_e, key: string) => {
      await shell.openPath(staging.getStagingPath(key as any));
    },
  );

  // ── Backup / Restore ───────────────────────────────────────

  ipcMain.handle("installer:backupAll", async () => {
    return staging.backupAllUploads(sendLog);
  });

  ipcMain.handle("installer:getBackupEntries", async () => {
    return staging.getBackupEntries(sendLog);
  });

  ipcMain.handle(
    "installer:deleteBackup",
    async (_e, folderName: string) => {
      staging.deleteBackup(folderName, sendLog);
    },
  );

  ipcMain.handle(
    "installer:restoreFromSave",
    async (_e, folderName: string) => {
      const restored = staging.restoreFromSaves(folderName, sendLog);
      if (restored) {
        // Reinstall symlinks after restore
        symlinker.installToGame(
          {
            cfg: staging.getStagingPath("cfg"),
            annotations: staging.getStagingPath("annotations"),
            video: staging.getStagingPath("video"),
          },
          {
            cfgPath: state.cs2CfgPath,
            annotationsPath: state.annotationsPath,
            videoPath: state.videoCfgPath,
          },
          sendLog,
        );
      }
    },
  );

  ipcMain.handle("installer:openBackupFolder", async () => {
    const savesPath = staging.getSavesPath();
    await shell.openPath(savesPath);
  });

  // ── Downloads ──────────────────────────────────────────────

  ipcMain.handle(
    "installer:downloadFromUrl",
    async (_e, url: string, fileName: string) => {
      return await staging.downloadFromUrl(url, fileName, sendLog);
    },
  );

  ipcMain.handle("installer:getDownloadEntries", async () => {
    return staging.getDownloadEntries();
  });

  ipcMain.handle(
    "installer:deleteDownload",
    async (_e, folderName: string) => {
      staging.deleteDownload(folderName, sendLog);
    },
  );

  ipcMain.handle(
    "installer:installFromDownload",
    async (_e, folderName: string, mode: InstallMode) => {
      const result = await staging.installFromDownload(folderName, mode, sendLog);
      if (!result) return { dirsLinked: 0, filesLinked: 0 };

      // Create symlinks from staging to game dirs
      const summary = symlinker.installToGame(
        {
          cfg: staging.getStagingPath("cfg"),
          annotations: staging.getStagingPath("annotations"),
          video: staging.getStagingPath("video"),
        },
        {
          cfgPath: state.cs2CfgPath,
          annotationsPath: state.annotationsPath,
          videoPath: state.videoCfgPath,
        },
        sendLog,
      );

      sendLog({
        category: "install",
        level: "success",
        message: `预设包安装完成！`,
      });

      return summary;
    },
  );

  ipcMain.handle("installer:openDownloadsFolder", async () => {
    await shell.openPath(staging.getDownloadsPath());
  });

  // ── Updater ────────────────────────────────────────────────

  ipcMain.handle("updater:check", async (_e, force?: boolean) => {
    return checkForUpdate(force ?? true);
  });

  ipcMain.handle("updater:dismiss", async (_e, version: string) => {
    dismissVersion(version);
  });
}
