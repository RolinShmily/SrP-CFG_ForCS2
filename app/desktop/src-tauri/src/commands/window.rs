//! 窗口控制 commands（对应原 `main.ts` 的 window:minimize/maximize/close/isMaximized）。

use tauri::Window;

#[tauri::command(rename_all = "camelCase")]
pub fn minimize(window: Window) {
    let _ = window.minimize();
}

/// maximize 为切换（与 Electron 版一致：isMaximized ? unmaximize : maximize）。
#[tauri::command(rename_all = "camelCase")]
pub fn maximize(window: Window) {
    if window.is_maximized().unwrap_or(false) {
        let _ = window.unmaximize();
    } else {
        let _ = window.maximize();
    }
}

#[tauri::command(rename_all = "camelCase")]
pub fn close(window: Window) {
    let _ = window.close();
}

#[tauri::command(rename_all = "camelCase")]
pub fn is_maximized(window: Window) -> bool {
    window.is_maximized().unwrap_or(false)
}
