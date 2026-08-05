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

/// 数据根目录（Tauri app_data_dir，= %APPDATA%/srp-cfg）。
/// 目录名与最初 Electron 时代的 `srp-cfg` 同名：Electron 老用户升级后直接命中
/// 同一目录，天然无需迁移；仅上一代 Tauri（identifier = top.srprolin.cfg）用户
/// 需要由 legacy_base_dir() 一次性迁移（见 services/migrate.rs）。
/// 无 tauri 环境（单元测试/验收 bin）时回退到临时目录。
pub fn base_dir() -> std::path::PathBuf {
    if let Some(h) = try_handle() {
        h.path().app_data_dir().expect("app_data_dir unavailable")
    } else {
        std::env::temp_dir().join("srp-cfg-test")
    }
}

/// 上一代 Tauri 数据根目录 `%APPDATA%/top.srprolin.cfg`（一次性迁移来源）。
/// 上一代版本使用 identifier = top.srprolin.cfg，改名回 srp-cfg 后需把存量数据
/// 迁回新目录；Electron 老用户的 `%APPDATA%/srp-cfg` 与新目录同名，无需迁移。
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
    std::path::PathBuf::from(appdata).join("top.srprolin.cfg")
}
