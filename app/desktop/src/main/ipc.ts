import { ipcMain, shell, BrowserWindow, app } from "electron";
import * as fs from "fs";
import * as path from "path";
import { AppState } from "./state";
import * as detection from "./services/detection";
import * as staging from "./services/staging";
import * as installer from "./services/installer";
import * as userConfig from "./services/user-config";
import { inspectVcfgState, saveVcfgBaseline } from "./services/vcfg";
import {
  checkForUpdate,
  dismissVersion,
  fetchUpdateHistory,
  getLatestVersion,
} from "./services/updater";
import type { LogEntry, InstallMode } from "../renderer/types";

const state = new AppState();

function sendLog(entry: Omit<LogEntry, "timestamp">): void {
  const full: LogEntry = { ...entry, timestamp: Date.now() };
  const win = BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) {
    win.webContents.send("log:new", full);
  }
}

function currentGamePaths(): installer.GamePaths {
  return {
    gameCfgPath: state.cs2CfgPath,
    userCfgPath: state.userCfgPath,
    annotationsPath: state.annotationsPath,
  };
}

function getVcfgSnapshotRoot(): string {
  return path.join(app.getPath("appData"), "srp-cfg", "vcfg");
}

function capturePersistenceBaseline(): void {
  state.vcfgState = inspectVcfgState(state.userCfgPath);

  if (!state.userCfgPath || !state.currentUser || !state.vcfgState.available) {
    sendLog({
      category: "backup",
      level: "warning",
      message: "未创建 VCFG 状态快照",
      detail: "当前账号尚未生成可读取的 VCFG；安装器不会创建或覆盖游戏管理的 VCFG 文件。",
    });
    return;
  }

  const baseline = saveVcfgBaseline(
    state.userCfgPath,
    getVcfgSnapshotRoot(),
    state.currentUser.accountId,
  );
  sendLog({
    category: "backup",
    level: baseline.created ? "success" : "info",
    message: baseline.created ? "已保存 VCFG 原始状态快照" : "VCFG 原始状态快照已存在",
    detail: `${baseline.path}（仅用于审计与比较，不会自动回写 VCFG）`,
  });
}

function logPersistenceImpact(): void {
  const impact = staging.inspectStagedConfig();
  switch (impact.kind) {
    case "runtime-core":
      sendLog({
        category: "install",
        level: "info",
        message: "检测到 Runtime Core",
        detail: "启动时注册完整功能与 alias，再执行用户 custom.cfg；Runtime 本身不自动应用偏好。",
      });
      break;
    case "custom":
      capturePersistenceBaseline();
      sendLog({
        category: "install",
        level: "warning",
        message: "检测到无法识别的自定义 CFG",
        detail: `共 ${impact.cfgCount} 个 CFG；安装器无法证明其启动路径不会修改并持久化绑定或 ConVar。`,
      });
      break;
    case "empty":
      sendLog({
        category: "install",
        level: "info",
        message: "本次安装不包含 CFG 脚本",
      });
      break;
  }

}

// Pending append install (waiting for user confirmation)
let pendingAppend: {
  folderName: string;
  source: "upload" | "download";
  mode: InstallMode;
} | null = null;

export function registerIpcHandlers() {
  // ── Detection ──────────────────────────────────────────────

  ipcMain.handle("installer:detectAll", async () => {
    const result = await detection.detectAll(sendLog);

    state.steamPath = result.steamPath;
    state.cs2InstallState = result.cs2InstallState;
    state.cs2InstallDir = result.cs2InstallDir;
    state.cs2CfgPath = result.cs2CfgPath;
    state.annotationsPath = result.annotationsPath;
    state.userCfgPath = result.userCfgPath;
    state.vcfgState = result.vcfgState;
    state.steamUsers = result.steamUsers;
    state.currentUser = result.currentUser;
    state.hasAutoLoginUser = result.hasAutoLoginUser;

    // Update install.json paths
    installer.updateInstallPaths(currentGamePaths());

    sendLog({ category: "path-detection", level: "success", message: "环境检测完成" });

    return result;
  });

  ipcMain.handle("installer:setCurrentUser", async (_e, accountId: string) => {
    const user = state.steamUsers.find((u) => u.accountId === accountId);
    state.currentUser = user ?? null;

    if (state.steamPath) {
      state.userCfgPath = detection.detectUserCfgPath(state.steamPath, accountId, sendLog);
    } else {
      state.userCfgPath = null;
    }
    state.vcfgState = inspectVcfgState(state.userCfgPath);

    // Update install.json paths
    installer.updateInstallPaths(currentGamePaths());

    return { userCfgPath: state.userCfgPath, vcfgState: state.vcfgState };
  });

  // ── User-owned final override layer ─────────────────────────

  ipcMain.handle("userConfig:get", async () => {
    return userConfig.readUserConfig(currentGamePaths());
  });

  ipcMain.handle("userConfig:save", async (_e, content: string) => {
    const document = userConfig.saveUserConfig(currentGamePaths(), content);
    sendLog({
      category: "file-ops",
      level: "success",
      message: "个人配置已保存",
      detail: document.path ?? undefined,
    });
    return document;
  });

  ipcMain.handle("userConfig:openFolder", async () => {
    const folder = userConfig.getUserConfigFolder(currentGamePaths());
    if (!folder) throw new Error("尚未检测到可用的 CS2 CFG 目录");
    const result = await shell.openPath(folder);
    if (result) throw new Error(result);
  });

  // ── Upload / Staging ───────────────────────────────────────

  ipcMain.handle("installer:uploadFiles", async (_e, filePaths: string[]) => {
    return await staging.uploadFiles(filePaths, sendLog);
  });

  ipcMain.handle("installer:getUploadHistory", async () => {
    return staging.getUploadHistory();
  });

  ipcMain.handle("installer:getUploadedEntries", async () => {
    return staging.getUploadedEntries();
  });

  ipcMain.handle("installer:installFromUpload", async (_e, folderName: string, mode: InstallMode, usePersonalCfg?: boolean) => {
    try {
      const result = await staging.installFromUpload(folderName, mode, sendLog);
      if (!result) {
        sendLog({ category: "install", level: "error", message: "暂存处理失败，未产生可安装文件" });
        return { filesInstalled: 0, dirsInstalled: 0 };
      }

      if (result.cfgCount === 0 && result.annotationsCount === 0 && result.videoCount === 0) {
        sendLog({ category: "install", level: "warning", message: "未找到任何可安装的配置文件" });
        return { filesInstalled: 0, dirsInstalled: 0 };
      }

      logPersistenceImpact();

      const gamePaths = currentGamePaths();

      if (mode === "overlay") {
        const summary = installer.deployOverlay(
          { cfg: staging.getStagingPath("cfg"), annotations: staging.getStagingPath("annotations"), video: staging.getStagingPath("video") },
          gamePaths,
          usePersonalCfg ?? false,
          sendLog,
        );
        sendLog({ category: "install", level: "success", message: "上传包安装完成！" });
        return summary;
      } else {
        const conflictResult = installer.checkAppendConflicts(
          { cfg: staging.getStagingPath("cfg"), annotations: staging.getStagingPath("annotations"), video: staging.getStagingPath("video") },
          gamePaths,
          usePersonalCfg ?? false,
        );

        const conflictCount = conflictResult.conflicts.reduce((sum, item) => sum + item.names.length, 0);
        if (conflictCount > 3) {
          sendLog({ category: "install", level: "error", message: `冲突文件过多（${conflictCount} 个），追加安装已拒绝` });
          return { needsConfirm: false, conflicts: conflictResult.conflicts } as unknown as installer.AppendConflictResult;
        }

        if (conflictResult.needsConfirm) {
          // Store pending state and ask renderer for confirmation
          pendingAppend = { folderName, source: "upload", mode };
          return { needsConfirm: true, conflicts: conflictResult.conflicts };
        }

        const summary = installer.deployAppend(
          { cfg: staging.getStagingPath("cfg"), annotations: staging.getStagingPath("annotations"), video: staging.getStagingPath("video") },
          gamePaths,
          false,
          usePersonalCfg ?? false,
          sendLog,
        );
        sendLog({ category: "install", level: "success", message: "上传包追加安装完成！" });
        return summary;
      }
    } catch (e: unknown) {
      sendLog({ category: "install", level: "error", message: `安装异常：${e instanceof Error ? e.message : String(e)}` });
      return { filesInstalled: 0, dirsInstalled: 0 };
    }
  });

  ipcMain.handle("installer:deleteUploadEntry", async (_e, folderName: string) => {
    staging.deleteUploadEntry(folderName, sendLog);
  });

  ipcMain.handle("installer:openUploadsFolder", async () => {
    await shell.openPath(staging.getUploadPath());
  });

  // ── Append Conflict Confirmation ───────────────────────────

  ipcMain.handle("installer:confirmAppend", async (_e, folderName: string, source: "upload" | "download", proceed: boolean, usePersonalCfg?: boolean) => {
    if (!proceed || !pendingAppend) {
      pendingAppend = null;
      sendLog({ category: "install", level: "info", message: "追加安装已取消" });
      return null;
    }

    try {
      const gamePaths = currentGamePaths();

      // Ensure staging is populated
      if (source === "upload") {
        await staging.installFromUpload(folderName, pendingAppend.mode, sendLog);
      } else {
        await staging.installFromDownload(folderName, pendingAppend.mode, sendLog);
      }

      const summary = installer.deployAppend(
        { cfg: staging.getStagingPath("cfg"), annotations: staging.getStagingPath("annotations"), video: staging.getStagingPath("video") },
        gamePaths,
        true,
        usePersonalCfg ?? false,
        sendLog,
      );

      sendLog({ category: "install", level: "success", message: "追加安装完成！" });
      pendingAppend = null;
      return summary;
    } catch (e: unknown) {
      sendLog({ category: "install", level: "error", message: `追加安装异常：${e instanceof Error ? e.message : String(e)}` });
      pendingAppend = null;
      return null;
    }
  });

  // ── Installed Data (install.json) ──────────────────────────

  ipcMain.handle("installer:getInstalledData", async () => {
    return installer.getInstalledData();
  });

  ipcMain.handle("installer:deleteInstalledItem", async (_e, category: string, name: string) => {
    return installer.deleteInstalledItem(
      category as installer.CategoryKey,
      name,
      currentGamePaths(),
      sendLog,
    );
  });

  ipcMain.handle("installer:clearInstallCategory", async (_e, category: string) => {
    return installer.clearInstallCategory(
      category as installer.CategoryKey,
      currentGamePaths(),
      sendLog,
    );
  });

  // ── Conflict Recovery (res.json) ───────────────────────────

  ipcMain.handle("installer:getResData", async () => {
    return installer.getResData();
  });

  ipcMain.handle("installer:restoreFromRes", async (_e, category: string, name: string) => {
    return installer.restoreFromRes(
      category as installer.CategoryKey,
      name,
      currentGamePaths(),
      sendLog,
    );
  });

  ipcMain.handle("installer:deleteResItem", async (_e, category: string, name: string) => {
    return installer.deleteResItem(category as installer.CategoryKey, name, sendLog);
  });

  ipcMain.handle("installer:clearResCategory", async (_e, category: string) => {
    return installer.clearResCategory(category as installer.CategoryKey, sendLog);
  });

  ipcMain.handle("installer:restoreResCategory", async (_e, category: string) => {
    return installer.restoreResCategory(
      category as installer.CategoryKey,
      currentGamePaths(),
      sendLog,
    );
  });

  // ── Backup (save.json) ─────────────────────────────────────

  ipcMain.handle("installer:getSaveData", async () => {
    return installer.getSaveData();
  });

  ipcMain.handle("installer:restoreFromSave", async () => {
    return installer.restoreFromSave(
      currentGamePaths(),
      sendLog,
    );
  });

  ipcMain.handle("installer:deleteSaveItem", async (_e, category: string, name: string) => {
    return installer.deleteSaveItem(category as installer.CategoryKey, name, sendLog);
  });

  ipcMain.handle("installer:clearSaveCategory", async (_e, category: string) => {
    return installer.clearSaveCategory(category as installer.CategoryKey, sendLog);
  });

  ipcMain.handle("installer:restoreSaveCategory", async (_e, category: string) => {
    return installer.restoreSaveCategory(
      category as installer.CategoryKey,
      currentGamePaths(),
      sendLog,
    );
  });

  ipcMain.handle("installer:restoreSaveItem", async (_e, category: string, name: string) => {
    return installer.restoreSaveItem(
      category as installer.CategoryKey,
      name,
      currentGamePaths(),
      sendLog,
    );
  });

  ipcMain.handle("installer:openSaveFolder", async () => {
    await shell.openPath(staging.getSavePath());
  });

  ipcMain.handle("installer:openResFolder", async () => {
    await shell.openPath(staging.getResPath());
  });

  ipcMain.handle("installer:openVcfgSnapshotsFolder", async () => {
    const snapshotRoot = getVcfgSnapshotRoot();
    fs.mkdirSync(snapshotRoot, { recursive: true });
    await shell.openPath(snapshotRoot);
  });

  ipcMain.handle("installer:openItem", async (_e, storage: "install" | "save" | "res", category: string, name: string) => {
    return installer.openItem(
      storage,
      category as installer.CategoryKey,
      name,
      currentGamePaths(),
      sendLog,
    );
  });

  // ── Downloads ──────────────────────────────────────────────

  ipcMain.handle("installer:downloadFromUrl", async (_e, url: string, fileName: string) => {
    return await staging.downloadFromUrl(url, fileName, sendLog);
  });

  ipcMain.handle("installer:getDownloadEntries", async () => {
    return staging.getDownloadEntries();
  });

  ipcMain.handle("installer:deleteDownload", async (_e, folderName: string) => {
    staging.deleteDownload(folderName, sendLog);
  });
  ipcMain.handle("installer:installFromDownload", async (_e, folderName: string, mode: InstallMode, usePersonalCfg?: boolean) => {
    try {
      const result = await staging.installFromDownload(folderName, mode, sendLog);
      if (!result) {
        sendLog({ category: "install", level: "error", message: "配置包解压或暂存处理失败" });
        return { filesInstalled: 0, dirsInstalled: 0 };
      }

      if (result.cfgCount === 0 && result.annotationsCount === 0 && result.videoCount === 0) {
        sendLog({ category: "install", level: "warning", message: "配置包中未找到可安装的配置文件" });
        return { filesInstalled: 0, dirsInstalled: 0 };
      }
      logPersistenceImpact();
      const gamePaths = currentGamePaths();

      if (mode === "overlay") {
        const summary = installer.deployOverlay(
          { cfg: staging.getStagingPath("cfg"), annotations: staging.getStagingPath("annotations"), video: staging.getStagingPath("video") },
          gamePaths,
          usePersonalCfg ?? false,
          sendLog,
        );
        sendLog({ category: "install", level: "success", message: "配置包安装完成！" });
        return summary;
      } else {
        const conflictResult = installer.checkAppendConflicts(
          { cfg: staging.getStagingPath("cfg"), annotations: staging.getStagingPath("annotations"), video: staging.getStagingPath("video") },
          gamePaths,
          usePersonalCfg ?? false,
        );

        const conflictCount = conflictResult.conflicts.reduce((sum, item) => sum + item.names.length, 0);
        if (conflictCount > 3) {
          sendLog({ category: "install", level: "error", message: `冲突文件过多（${conflictCount} 个），追加安装已拒绝` });
          return { needsConfirm: false, conflicts: conflictResult.conflicts } as unknown as installer.AppendConflictResult;
        }

        if (conflictResult.needsConfirm) {
          pendingAppend = { folderName, source: "download", mode };
          return { needsConfirm: true, conflicts: conflictResult.conflicts };
        }

        const summary = installer.deployAppend(
          { cfg: staging.getStagingPath("cfg"), annotations: staging.getStagingPath("annotations"), video: staging.getStagingPath("video") },
          gamePaths,
          false,
          usePersonalCfg ?? false,
          sendLog,
        );
        sendLog({ category: "install", level: "success", message: "配置包追加安装完成！" });
        return summary;
      }
    } catch (e: unknown) {
      sendLog({ category: "install", level: "error", message: `安装异常：${e instanceof Error ? e.message : String(e)}` });
      return { filesInstalled: 0, dirsInstalled: 0 };
    }
  });

  ipcMain.handle("installer:openDownloadsFolder", async () => {
    const result = await shell.openPath(staging.getDownloadPath());
    if (result) {
      sendLog({ category: "file-ops", level: "error", message: `无法打开下载目录：${result}` });
    }
  });

  // ── App Info ────────────────────────────────────────────────

  ipcMain.handle("app:getVersion", () => app.getVersion());

  ipcMain.handle("app:getLatestVersion", () => getLatestVersion());

  // ── Updater ────────────────────────────────────────────────

  ipcMain.handle("updater:check", async (_e, force?: boolean) => {
    return checkForUpdate(force ?? true);
  });

  ipcMain.handle("updater:dismiss", async (_e, version: string) => {
    dismissVersion(version);
  });

  ipcMain.handle("updater:history", async () => {
    return fetchUpdateHistory();
  });
}
