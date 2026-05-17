import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import { registerIpcHandlers } from "./ipc";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 896,
    minHeight: 504,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0b0d14",
    icon: path.join(__dirname, "../renderer/favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}`),
    );
  }
}

app.whenReady().then(async () => {
  // Lazy import to ensure app.getPath() works (app must be ready first)
  const { initializeStagingArea } = await import("./services/staging");
  initializeStagingArea((entry) => {
    console.log(`[${entry.category}] ${entry.message}`);
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Window Controls
ipcMain.on("window:minimize", () => mainWindow?.minimize());
ipcMain.on("window:maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow?.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on("window:close", () => mainWindow?.close());
ipcMain.handle("window:isMaximized", () => mainWindow?.isMaximized() ?? false);
ipcMain.handle("shell:openExternal", (_e, url: string) =>
  shell.openExternal(url),
);

// Business logic IPC handlers
registerIpcHandlers();
