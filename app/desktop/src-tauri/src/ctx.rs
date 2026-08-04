//! 全局应用上下文（AppHandle 单例）—— 供 services 访问 tauri 能力
//! （app_data_dir / user_data_dir / emit 事件）。

use std::sync::OnceLock;
use tauri::{AppHandle, Manager};

static HANDLE: OnceLock<AppHandle> = OnceLock::new();

pub fn init(app: &AppHandle) {
    let _ = HANDLE.set(app.clone());
}

pub fn handle() -> &'static AppHandle {
    HANDLE.get().expect("AppHandle not initialized (setup)")
}

/// 无 AppHandle 时返回 None（允许 services 在单元测试/示例 bin 中运行，日志降级为 stderr）。
pub fn try_handle() -> Option<&'static AppHandle> {
    HANDLE.get()
}

/// 数据根目录（Tauri app_data_dir，= %APPDATA%/top.srprolin.cfg）。
/// 对应原 Electron `path.join(app.getPath("appData"), "srp-cfg")`（D2 决策）。
/// 无 tauri 环境（单元测试/验收 bin）时回退到临时目录。
pub fn base_dir() -> std::path::PathBuf {
    if let Some(h) = try_handle() {
        h.path().app_data_dir().expect("app_data_dir unavailable")
    } else {
        std::env::temp_dir().join("srp-cfg-test")
    }
}

/// updater 缓存目录（原 Electron userData/update-cache，允许重建不迁移）。
pub fn user_data_dir() -> std::path::PathBuf {
    if let Some(h) = try_handle() {
        h.path().app_data_dir().expect("app_data_dir unavailable")
    } else {
        std::env::temp_dir().join("srp-cfg-test-userdata")
    }
}

/// 旧版 Electron 数据根目录 `%APPDATA%/srp-cfg`（首启动一次性迁移来源）。
pub fn legacy_base_dir() -> std::path::PathBuf {
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| {
        handle()
            .path()
            .app_data_dir()
            .expect("app_data_dir unavailable")
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default()
    });
    std::path::PathBuf::from(appdata).join("srp-cfg")
}
