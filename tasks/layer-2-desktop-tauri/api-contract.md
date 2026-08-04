# Desktop API 契约（L0.4）

> 来源：`app/desktop/src/preload/preload.ts`（124 行）。**L2 Tauri IPC 适配层必须保持这些签名不变**，renderer 的 66 处 `window.api.*` 调用点零改动。

## window.api 完整签名

### 窗口控制
```ts
minimize(): void                       // ipcMain.on("window:minimize")
maximize(): void                       // ipcMain.on("window:maximize")
close(): void                          // ipcMain.on("window:close")
isMaximized(): Promise<boolean>
```

### 环境检测
```ts
detectAll(): Promise<DetectionResult>  // installer:detectAll
setCurrentUser(accountId: string): Promise<{ userCfgPath: string | null; vcfgState: VcfgStateSummary }>
```

### 用户配置层
```ts
getUserConfig(): Promise<...>          // userConfig:get
saveUserConfig(content: string): Promise<...>
openUserConfigFolder(): Promise<void>  // 失败 throw
```

### VCFG 快照
```ts
captureVcfgSnapshot(): Promise<...>    // vcfg:captureSnapshot
generateCfgFromSnapshot(options: { bindings: boolean; analogBindings: boolean; userConvars: boolean; machineConvars: boolean }): Promise<...>
```

### 上传 / Staging
```ts
uploadFiles(filePaths: string[]): Promise<...>
getUploadHistory(): Promise<...>
getUploadedEntries(): Promise<...>
installFromUpload(folderName: string, mode: "overlay" | "append", usePersonalCfg?: boolean): Promise<...>
deleteUploadEntry(folderName: string): Promise<void>
openUploadsFolder(): Promise<void>
```

### 已安装数据（install.json）
```ts
getInstalledData(): Promise<...>
deleteInstalledItem(category: string, name: string): Promise<...>
clearInstallCategory(category: string): Promise<...>
openItem(storage: "install" | "save" | "res", category: string, name: string): Promise<...>
```

### 冲突恢复（res.json）
```ts
getResData(): Promise<...>
restoreFromRes(category: string, name: string): Promise<...>
deleteResItem(category: string, name: string): Promise<...>
clearResCategory(category: string): Promise<...>
restoreResCategory(category: string): Promise<...>
```

### 备份（save.json）
```ts
getSaveData(): Promise<...>
restoreFromSave(): Promise<...>
deleteSaveItem(category: string, name: string): Promise<...>
clearSaveCategory(category: string): Promise<...>
restoreSaveCategory(category: string): Promise<...>
restoreSaveItem(category: string, name: string): Promise<...>
openSaveFolder(): Promise<void>
openResFolder(): Promise<void>
openVcfgSnapshotsFolder(): Promise<void>
```

### 追加安装确认（pending 状态机）
```ts
confirmAppend(folderName: string, source: "upload" | "download", proceed: boolean, usePersonalCfg?: boolean): Promise<...>
// 注意：server 端有 pendingAppend 状态，confirm 时校验
```

### 下载
```ts
downloadFromUrl(url: string, fileName: string): Promise<...>
getDownloadEntries(): Promise<...>
deleteDownload(folderName: string): Promise<void>
installFromDownload(folderName: string, mode: "overlay" | "append", usePersonalCfg?: boolean): Promise<...>
openDownloadsFolder(): Promise<void>
```

### 应用信息 / 更新
```ts
getVersion(): Promise<string>
getLatestVersion(): Promise<...>
checkForUpdate(force?: boolean): Promise<...>
dismissUpdate(version: string): Promise<void>
getUpdateHistory(): Promise<...>
```

### Shell / 工具
```ts
openExternal(url: string): Promise<void>
getFilePaths(files: File[]): string[]     // 基于 webUtils.getPathForFile，Tauri 需替换
onLog(callback: (entry: LogEntry) => void): () => void   // log:new 事件订阅，返回取消函数
```

## 共享类型基准（`src/renderer/types.ts`）

- `LogEntry { category, level, message, detail?, timestamp }`
- `InstallMode = "overlay" | "append"`
- `Cs2InstallState`
- `SteamUser { accountId, ... }`
- `VcfgStateSummary { available, bindings, analogBindings, cloudConvars, machineConvars, hasCloudMirror, hasVideoConfig }`
- `DetectionResult`（含 steamPath / cs2InstallState / cs2InstallDir / cs2CfgPath / annotationsPath / userCfgPath / vcfgState / steamUsers / currentUser / hasAutoLoginUser）

## Tauri 迁移注意

| 原 Electron 机制 | Tauri 等价 |
| :--- | :--- |
| `ipcRenderer.invoke / ipcMain.handle` | `#[tauri::command]` + `invoke()` |
| `ipcRenderer.on("log:new")` 推送 | `app.emit("log:new")` / `listen()` |
| `webUtils.getPathForFile` | 拖拽插件 / `@tauri-apps/plugin-dialog` |
| `shell.openExternal / openPath` | `tauri-plugin-opener` |
| `app.getVersion()` | `app.getVersion()`（tauri 全局） |
| preload 层 | 不需要（Tauri 无 preload 概念） |
