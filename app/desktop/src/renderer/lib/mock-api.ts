import type {
  BackupMeta,
  CategoryData,
  DetectionResult,
  DownloadEntry,
  ElectronAPI,
  FsTreeRoot,
  GitHubRelease,
  InstallResult,
  InstalledData,
  PipelineResult,
  ResData,
  SaveData,
  StagingStatus,
  UpdateCheckResult,
  UploadEntry,
  UploadedEntry,
  UserConfigDocument,
  UserConfigSelection,
  VcfgSnapshot,
} from "../types";

let mockUserConfig = `// [SrP-CFG] 用户自定义配置 (Web Dev 预览模式)
// 在此编写你的个人按键绑定与参数覆盖

bind "MOUSE4" "+voicerecord"
bind "MWHEELDOWN" "+jump"
sensitivity "1.2"
zoom_sensitivity_ratio "0.9"

echo "[SrP-CFG] custom.cfg loaded successfully."
`;

let mockBackups: BackupMeta[] = [
  {
    id: "backup_20260903_140000",
    timestamp: Date.now() - 3600 * 1000,
    dateStr: "2026-09-03 14:00:00",
    note: "组件安装前自动快照",
    isAuto: true,
    components: ["cfg", "annotations"],
    totalSize: 625800,
    filePath: "C:\\AppData\\srp-cfg\\backups\\backup_20260903_140000.zip",
    paths: {
      cfg: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg",
      annotations: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\annotations",
    },
  },
  {
    id: "backup_20260902_183000",
    timestamp: Date.now() - 86400 * 1000,
    dateStr: "2026-09-02 18:30:00",
    note: "大版本更新前手动备份",
    isAuto: false,
    components: ["cfg", "annotations", "video"],
    totalSize: 712300,
    filePath: "C:\\AppData\\srp-cfg\\backups\\backup_20260902_183000.zip",
    paths: {
      cfg: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg",
      annotations: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\annotations",
      video: "D:\\SteamLibrary\\userdata\\12345678\\730\\local\\cfg",
    },
  },
];

const mockFileContents: Record<string, string> = {
  "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\autoexec.cfg":
    `// SrP-CFG 启动引导入口\nexec "srp-cfg/init.cfg"\necho "[SrP-CFG] autoexec.cfg executed."\n`,
  "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\srp-cfg\\init.cfg":
    `// SrP-CFG Core Runtime 初始化\nexec "srp-cfg/core/alias.cfg"\nexec "srp-cfg/user/custom.cfg"\n`,
  "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\gamemode_demolition.cfg":
    `bot_autodifficulty_threshold_high 0.0\nbot_autodifficulty_threshold_low -2.0\nbot_chatter normal\nbot_quota 10\n`,
  "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\annotations\\de_dust2.txt":
    `"annotations"\n{\n  "name" "Dust 2 Lineups"\n  "version" "1.0"\n}\n`,
  "D:\\SteamLibrary\\userdata\\12345678\\730\\local\\cfg\\cs2_video.txt":
    `"VideoConfig"\n{\n  "setting.csm_quality_level" "3"\n  "setting.mat_vsync" "0"\n}\n`,
};

const emptyCategory: CategoryData = {
  files: [],
  dirs: [],
  path: "",
};

export function createMockApi(): ElectronAPI {
  console.info("[SrP-CFG] 正在运行 Web Dev 预览模式（已启用完整的 Mock API 适配层）。");

  return {
    minimize: async () => console.log("[Mock] minimize"),
    maximize: async () => console.log("[Mock] maximize"),
    close: async () => console.log("[Mock] close"),
    isMaximized: async () => false,

    detectAll: async (): Promise<DetectionResult> => ({
      steamPath: "C:\\Program Files (x86)\\Steam",
      cs2InstallState: "installed",
      cs2InstallDir: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive",
      cs2CfgPath: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg",
      annotationsPath: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\annotations",
      steamUsers: [
        {
          steamId64: "76561198000000001",
          accountId: "12345678",
          personaName: "CS2 Pro Player",
        },
        {
          steamId64: "76561198000000002",
          accountId: "87654321",
          personaName: "Secondary Account",
        },
      ],
      currentUser: {
        steamId64: "76561198000000001",
        accountId: "12345678",
        personaName: "CS2 Pro Player",
      },
      hasAutoLoginUser: true,
      userCfgPath: "D:\\SteamLibrary\\userdata\\12345678\\730\\local\\cfg",
      vcfgState: {
        available: true,
        bindings: 42,
        analogBindings: 4,
        cloudConvars: 28,
        machineConvars: 16,
        hasCloudMirror: true,
        hasVideoConfig: true,
      },
    }),

    setCurrentUser: async (accountId: string): Promise<UserConfigSelection> => ({
      userCfgPath: `D:\\SteamLibrary\\userdata\\${accountId}\\730\\local\\cfg`,
      vcfgState: {
        available: true,
        bindings: 42,
        analogBindings: 4,
        cloudConvars: 28,
        machineConvars: 16,
        hasCloudMirror: true,
        hasVideoConfig: true,
      },
    }),

    getUserConfig: async (): Promise<UserConfigDocument> => ({
      path: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\srp-cfg\\user\\custom.cfg",
      target: "game",
      exists: true,
      runtimeInstalled: true,
      content: mockUserConfig,
      modifiedAt: Date.now(),
    }),

    saveUserConfig: async (content: string): Promise<UserConfigDocument> => {
      mockUserConfig = content;
      return {
        path: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\srp-cfg\\user\\custom.cfg",
        target: "game",
        exists: true,
        runtimeInstalled: true,
        content,
        modifiedAt: Date.now(),
      };
    },

    openUserConfigFolder: async () => {
      alert("[Mock] 已请求打开用户配置目录");
    },

    captureVcfgSnapshot: async (): Promise<VcfgSnapshot> => ({
      schemaVersion: 1,
      capturedAt: Date.now(),
      userCfgPath: "D:\\SteamLibrary\\userdata\\12345678\\730\\local\\cfg",
      bindings: { SPACE: "+jump", MWHEELDOWN: "+jump", MOUSE4: "+voicerecord" },
      analogBindings: {},
      userConvars: { sensitivity: "1.25", zoom_sensitivity_ratio: "0.9" },
      machineConvars: { viewmodel_fov: "68" },
    }),

    generateCfgFromSnapshot: async (): Promise<string> =>
      `// [Mock VCFG 提取结果]\nbind "SPACE" "+jump"\nbind "MWHEELDOWN" "+jump"\nsensitivity "1.25"\nviewmodel_fov "68"\n`,

    uploadFiles: async (): Promise<UploadEntry> => ({
      folderName: "uploaded_mock_bundle",
      fileCount: 3,
      timestamp: Date.now(),
      files: [],
    }),

    getUploadHistory: async (): Promise<UploadEntry[]> => [],
    getUploadedEntries: async (): Promise<UploadedEntry[]> => [],
    installFromUpload: async (): Promise<InstallResult> => ({
      filesInstalled: 12,
      dirsInstalled: 2,
    }),
    deleteUploadEntry: async () => {},
    openUploadsFolder: async () => alert("[Mock] 打开上传目录"),

    getInstalledData: async (): Promise<InstalledData> => ({
      gameCfg: emptyCategory,
      userCfg: emptyCategory,
      annotations: emptyCategory,
      video: emptyCategory,
    }),
    deleteInstalledItem: async () => true,
    clearInstallCategory: async () => 0,
    openItem: async () => true,

    getResData: async (): Promise<ResData> => ({
      gameCfg: emptyCategory,
      userCfg: emptyCategory,
      annotations: emptyCategory,
      video: emptyCategory,
    }),
    restoreFromRes: async () => true,
    deleteResItem: async () => true,
    clearResCategory: async () => {},
    restoreResCategory: async () => 0,

    getSaveData: async (): Promise<SaveData> => ({
      gameCfg: emptyCategory,
      userCfg: emptyCategory,
      annotations: emptyCategory,
      video: emptyCategory,
    }),
    restoreFromSave: async () => true,
    deleteSaveItem: async () => true,
    clearSaveCategory: async () => {},
    restoreSaveCategory: async () => 0,
    restoreSaveItem: async () => true,
    openSaveFolder: async () => {},
    openResFolder: async () => {},
    openVcfgSnapshotsFolder: async () => {},

    confirmAppend: async (): Promise<InstallResult> => ({
      filesInstalled: 10,
      dirsInstalled: 1,
    }),

    downloadFromUrl: async (url: string, fileName: string): Promise<DownloadEntry> => ({
      folderName: fileName.replace(/\.zip$/i, ""),
      fileName,
      size: 1024 * 180,
      timestamp: Date.now(),
    }),
    getDownloadEntries: async (): Promise<DownloadEntry[]> => [],
    deleteDownload: async () => {},
    installFromDownload: async (): Promise<InstallResult> => ({
      filesInstalled: 15,
      dirsInstalled: 3,
    }),
    openDownloadsFolder: async () => alert("[Mock] 打开下载目录"),

    getVersion: async () => "3.2.4",
    getLatestVersion: async () => "3.2.4",
    checkForUpdate: async (): Promise<UpdateCheckResult> => ({
      hasUpdate: false,
      hasDesktopUpdate: false,
      hasConfigUpdate: false,
      currentVersion: "3.2.4",
      releases: [],
    }),
    dismissUpdate: async () => {},
    getUpdateHistory: async (): Promise<GitHubRelease[]> => [
      {
        tagName: "3.2.4",
        name: "SrP-CFG v3.2.4",
        body: "### 更新亮点\n- 组件模型解耦（Runtime Core、地图指南、视频设置）\n- 新增 CS2 CFG 语法高亮\n- 全量物理文件树扫描与快照中心",
        htmlUrl: "https://github.com/rol1n/SrP-CFG_ForCS2/releases/tag/v3.2.4",
        publishedAt: new Date().toISOString(),
        hasDesktopAssets: true,
        hasConfigAssets: true,
      },
      {
        tagName: "3.2.0",
        name: "SrP-CFG v3.2.0",
        body: "### 架构重构\n- 引入 Tauri v2 跨平台架构\n- 模块化 alias 系统",
        htmlUrl: "https://github.com/rol1n/SrP-CFG_ForCS2/releases/tag/v3.2.0",
        publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        hasDesktopAssets: true,
        hasConfigAssets: true,
      },
    ],
    openExternal: async (url: string) => {
      window.open(url, "_blank");
    },
    getFilePaths: (files) => (Array.isArray(files) ? files : []),
    onLog: () => () => {},
    onAppendConflicts: () => () => {},

    checkCs2Running: async () => false,

    getStagingStatus: async (): Promise<StagingStatus> => ({
      cfg: {
        componentId: "cfg",
        fileCount: 28,
        totalSize: 116802,
        lastModified: Date.now() - 3600000,
        isReady: true,
        sampleFiles: ["autoexec.cfg", "aliases.cfg", "jumpthrow.cfg", "crosshair.cfg"],
      },
      annotations: {
        componentId: "annotations",
        fileCount: 0,
        totalSize: 0,
        lastModified: null,
        isReady: false,
        sampleFiles: [],
      },
      video: {
        componentId: "video",
        fileCount: 0,
        totalSize: 0,
        lastModified: null,
        isReady: false,
        sampleFiles: [],
      },
    }),

    installComponentsPipeline: async (components): Promise<PipelineResult> => {
      const newBackupId = `backup_${Date.now()}`;
      mockBackups.unshift({
        id: newBackupId,
        timestamp: Date.now(),
        dateStr: new Date().toLocaleString(),
        components,
        note: "组件安装前自动快照",
        isAuto: true,
        totalSize: components.length * 120000,
        filePath: `C:\\AppData\\srp-cfg\\backups\\${newBackupId}.zip`,
        paths: {},
      });
      return {
        success: true,
        cs2Running: false,
        backupId: newBackupId,
        filesInstalled: components.length * 18,
        dirsInstalled: components.length * 2,
        message: `成功部署 ${components.join(", ")} 组件`,
      };
    },

    fsScanInstalledRoots: async (): Promise<FsTreeRoot[]> => [
      {
        componentId: "cfg",
        label: "CS2 CFG 运行时 (game/csgo/cfg)",
        targetPath: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg",
        exists: true,
        fileCount: 4,
        totalSize: 4560,
        tree: {
          name: "cfg",
          path: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg",
          relativePath: "cfg",
          isDir: true,
          size: 4560,
          modifiedAt: Date.now(),
          children: [
            {
              name: "autoexec.cfg",
              path: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\autoexec.cfg",
              relativePath: "autoexec.cfg",
              isDir: false,
              size: 120,
              modifiedAt: Date.now(),
            },
            {
              name: "gamemode_demolition.cfg",
              path: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\gamemode_demolition.cfg",
              relativePath: "gamemode_demolition.cfg",
              isDir: false,
              size: 3700,
              modifiedAt: Date.now(),
            },
            {
              name: "srp-cfg",
              path: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\srp-cfg",
              relativePath: "srp-cfg",
              isDir: true,
              size: 280,
              modifiedAt: Date.now(),
              children: [
                {
                  name: "init.cfg",
                  path: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\srp-cfg\\init.cfg",
                  relativePath: "srp-cfg/init.cfg",
                  isDir: false,
                  size: 280,
                  modifiedAt: Date.now(),
                },
              ],
            },
          ],
        },
      },
      {
        componentId: "annotations",
        label: "地图跑图与指南 (annotations)",
        targetPath: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\annotations",
        exists: true,
        fileCount: 1,
        totalSize: 520,
        tree: {
          name: "annotations",
          path: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\annotations",
          relativePath: "annotations",
          isDir: true,
          size: 520,
          modifiedAt: Date.now(),
          children: [
            {
              name: "de_dust2.txt",
              path: "D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\annotations\\de_dust2.txt",
              relativePath: "de_dust2.txt",
              isDir: false,
              size: 520,
              modifiedAt: Date.now(),
            },
          ],
        },
      },
      {
        componentId: "video",
        label: "用户/视频配置 (userdata/.../cfg)",
        targetPath: "D:\\SteamLibrary\\userdata\\12345678\\730\\local\\cfg",
        exists: true,
        fileCount: 1,
        totalSize: 420,
        tree: {
          name: "cfg",
          path: "D:\\SteamLibrary\\userdata\\12345678\\730\\local\\cfg",
          relativePath: "cfg",
          isDir: true,
          size: 420,
          modifiedAt: Date.now(),
          children: [
            {
              name: "cs2_video.txt",
              path: "D:\\SteamLibrary\\userdata\\12345678\\730\\local\\cfg\\cs2_video.txt",
              relativePath: "cs2_video.txt",
              isDir: false,
              size: 420,
              modifiedAt: Date.now(),
            },
          ],
        },
      },
    ],

    fsReadFile: async (path: string): Promise<string> =>
      mockFileContents[path] || `// [Mock 文件内容] ${path}\n// 这是一个处于 Web Dev 模式下的测试文件\n`,

    fsWriteFile: async (path: string, content: string): Promise<void> => {
      mockFileContents[path] = content;
      console.log(`[Mock] 成功写入文件 ${path}`);
    },

    fsDeleteItem: async (path: string): Promise<void> => {
      delete mockFileContents[path];
      console.log(`[Mock] 成功删除文件 ${path}`);
    },

    fsOpenInExplorer: async (path: string): Promise<void> => {
      alert(`[Mock] 已请求在资源管理器中打开: ${path}`);
    },

    backupList: async (): Promise<BackupMeta[]> => [...mockBackups],

    backupCreateSnapshot: async (components, note, isAuto): Promise<BackupMeta> => {
      const id = `backup_${Date.now()}`;
      const newMeta: BackupMeta = {
        id,
        timestamp: Date.now(),
        dateStr: new Date().toLocaleString(),
        components,
        note: note || "手动快照",
        isAuto: isAuto || false,
        totalSize: 650000,
        filePath: `C:\\AppData\\srp-cfg\\backups\\${id}.zip`,
        paths: {},
      };
      mockBackups.unshift(newMeta);
      return newMeta;
    },

    backupRestoreSnapshot: async (backupId: string): Promise<void> => {
      alert(`[Mock] 成功恢复快照 ${backupId}`);
    },

    backupDelete: async (backupId: string): Promise<void> => {
      mockBackups = mockBackups.filter((b) => b.id !== backupId);
    },

    backupCleanAuto: async (maxKeep?: number): Promise<number> => {
      const limit = maxKeep ?? 10;
      if (limit === 0) return 0;
      const autos = mockBackups.filter((b) => b.isAuto);
      if (autos.length > limit) {
        const removeCount = autos.length - limit;
        const toRemove = autos.slice(limit);
        mockBackups = mockBackups.filter((b) => !toRemove.includes(b));
        return removeCount;
      }
      return 0;
    },

    backupOpenFolder: async (): Promise<void> => {
      alert("[Mock] 打开备份存储目录");
    },
  };
}
