import * as fs from "fs";
import * as path from "path";
import type { LogEntry } from "../../renderer/types";

export type LogFn = (entry: Omit<LogEntry, "timestamp">) => void;

// ── Symlink Detection ────────────────────────────────────────

export function clearSymlinks(targetDir: string, log: LogFn): number {
  if (!fs.existsSync(targetDir)) return 0;

  let count = 0;
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry.name);
    try {
      const stat = fs.lstatSync(fullPath);
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(fullPath);
        count++;
      }
    } catch (e: any) {
      log({
        category: "symlink",
        level: "error",
        message: `无法移除符号链接：${entry.name}`,
        detail: e.message,
      });
    }
  }

  if (count > 0) {
    log({
      category: "symlink",
      level: "info",
      message: `已移除 ${count} 个旧符号链接`,
      detail: targetDir,
    });
  }

  return count;
}

// ── Symlink Creation ─────────────────────────────────────────

export function installSymlinks(
  stagingDir: string,
  targetDir: string,
  log: LogFn,
): { dirs: number; files: number } {
  if (!fs.existsSync(stagingDir)) {
    log({
      category: "symlink",
      level: "warning",
      message: `暂存目录不存在，跳过`,
      detail: stagingDir,
    });
    return { dirs: 0, files: 0 };
  }

  fs.mkdirSync(targetDir, { recursive: true });

  let dirs = 0;
  let files = 0;

  const entries = fs.readdirSync(stagingDir, { withFileTypes: true });

  for (const entry of entries) {
    const src = path.join(stagingDir, entry.name);
    const dst = path.join(targetDir, entry.name);

    try {
      // Remove existing entry if it's a symlink
      if (fs.existsSync(dst)) {
        const existingStat = fs.lstatSync(dst);
        if (existingStat.isSymbolicLink()) {
          fs.unlinkSync(dst);
        }
      }

      if (entry.isDirectory()) {
        fs.symlinkSync(src, dst, "junction");
        dirs++;
        log({
          category: "symlink",
          level: "success",
          message: `目录链接：${entry.name}`,
        });
      } else if (entry.name.endsWith(".cfg")) {
        fs.symlinkSync(src, dst, "file");
        files++;
        log({
          category: "symlink",
          level: "success",
          message: `文件链接：${entry.name}`,
        });
      }
    } catch (e: any) {
      if (e.code === "EPERM") {
        log({
          category: "symlink",
          level: "error",
          message: `创建符号链接失败（权限不足）：${entry.name}`,
          detail: "请以管理员身份运行或启用开发者模式",
        });
      } else {
        log({
          category: "symlink",
          level: "error",
          message: `创建符号链接失败：${entry.name}`,
          detail: e.message,
        });
      }
    }
  }

  return { dirs, files };
}

// ── Install Orchestrator ─────────────────────────────────────

export interface GamePaths {
  cfgPath: string | null;
  annotationsPath: string | null;
  videoPath: string | null;
}

export interface InstallSummary {
  dirsLinked: number;
  filesLinked: number;
}

export function installToGame(
  stagingPaths: { cfg: string; annotations: string; video: string },
  gamePaths: GamePaths,
  log: LogFn,
): InstallSummary {
  log({
    category: "symlink",
    level: "progress",
    message: "开始创建符号链接...",
  });

  let totalDirs = 0;
  let totalFiles = 0;

  // CFG → game cfg dir
  if (gamePaths.cfgPath) {
    clearSymlinks(gamePaths.cfgPath, log);
    const { dirs, files } = installSymlinks(
      stagingPaths.cfg,
      gamePaths.cfgPath,
      log,
    );
    totalDirs += dirs;
    totalFiles += files;
  }

  // Annotations → game annotations dir
  if (gamePaths.annotationsPath) {
    clearSymlinks(gamePaths.annotationsPath, log);
    const { dirs, files } = installSymlinks(
      stagingPaths.annotations,
      gamePaths.annotationsPath,
      log,
    );
    totalDirs += dirs;
    totalFiles += files;
  }

  // Video → user video cfg dir
  if (gamePaths.videoPath) {
    clearSymlinks(gamePaths.videoPath, log);
    const { dirs, files } = installSymlinks(
      stagingPaths.video,
      gamePaths.videoPath,
      log,
    );
    totalDirs += dirs;
    totalFiles += files;
  }

  log({
    category: "symlink",
    level: "success",
    message: `符号链接创建完成：${totalDirs} 个目录，${totalFiles} 个文件`,
  });

  return { dirsLinked: totalDirs, filesLinked: totalFiles };
}
