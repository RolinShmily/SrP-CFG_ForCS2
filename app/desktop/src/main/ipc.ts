import { ipcMain, shell, dialog, BrowserWindow } from "electron";
import {
  detectAllPaths,
  getSteamUsers,
  detectVideoCfgPath,
  performInstall,
  getBackupDir,
  setLogFn,
  backupCurrentConfigs,
  restoreFromBackupZip,
} from "./services/installer";
import { checkForUpdate } from "./services/updater";

// ── State ───────────────────────────────────────────────────

let detectedSteamPath: string | null = null;
let detectedCs2CfgPath: string | null = null;
let detectedVideoCfgPath: string | null = null;
let detectedAnnotationsPath: string | null = null;
let selectedUserId: string | null = null;

// ── Setup ───────────────────────────────────────────────────

export function registerIpcHandlers() {
  // Route installer logs to the renderer
  setLogFn((msg: string) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win && !win.isDestroyed()) {
      win.webContents.send("installer:log", msg);
    }
  });

  // ── Installer ─────────────────────────────────────────────

  ipcMain.handle("installer:detectPaths", async () => {
    const paths = await detectAllPaths();
    detectedSteamPath = paths.steamPath;
    detectedCs2CfgPath = paths.cs2CfgPath;
    detectedAnnotationsPath = paths.annotationsPath;

    // If a user was previously selected, re-detect video path
    if (selectedUserId && detectedSteamPath) {
      detectedVideoCfgPath = await detectVideoCfgPath(detectedSteamPath, selectedUserId);
    } else {
      detectedVideoCfgPath = null;
    }

    return {
      steamPath: paths.steamPath,
      cs2CfgPath: paths.cs2CfgPath,
      videoCfgPath: detectedVideoCfgPath,
      annotationsPath: paths.annotationsPath,
    };
  });

  ipcMain.handle("installer:getSteamUsers", (_e, steamRoot: string) => {
    return getSteamUsers(steamRoot);
  });

  ipcMain.handle("installer:setSteamUser", async (_e, userId: string) => {
    selectedUserId = userId;
    if (detectedSteamPath) {
      detectedVideoCfgPath = await detectVideoCfgPath(detectedSteamPath, userId);
      return detectedVideoCfgPath;
    }
    return null;
  });

  ipcMain.handle(
    "installer:install",
    async (
      _e,
      opts: {
        sourcePath: string;
        isZip: boolean;
        installCfg: boolean;
        installVideo: boolean;
        installAnnotations: boolean;
      },
    ) => {
      await performInstall(
        opts,
        detectedCs2CfgPath,
        detectedVideoCfgPath,
        detectedAnnotationsPath,
      );
    },
  );

  ipcMain.handle("installer:openBackupFolder", async () => {
    // Open the most relevant backup directory
    const dir =
      getBackupDir(detectedCs2CfgPath) ||
      getBackupDir(detectedVideoCfgPath) ||
      getBackupDir(detectedAnnotationsPath);
    if (dir) await shell.openPath(dir);
  });

  // ── Backup & Restore ─────────────────────────────────────

  ipcMain.handle("installer:backupOnly", async () => {
    await backupCurrentConfigs(
      detectedCs2CfgPath,
      detectedVideoCfgPath,
      detectedAnnotationsPath,
    );
  });

  ipcMain.handle("installer:restoreFromBackup", async () => {
    const result = await dialog.showOpenDialog({
      title: "选择备份文件",
      filters: [{ name: "ZIP 备份", extensions: ["zip"] }],
      properties: ["openFile"],
    });
    if (result.canceled || result.filePaths.length === 0) return;
    await restoreFromBackupZip(
      result.filePaths[0],
      detectedCs2CfgPath,
      detectedVideoCfgPath,
      detectedAnnotationsPath,
    );
  });

  // ── Updater ───────────────────────────────────────────────

  ipcMain.handle("updater:check", async () => {
    return checkForUpdate();
  });
}
