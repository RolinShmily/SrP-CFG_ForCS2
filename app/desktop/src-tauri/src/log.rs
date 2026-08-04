//! 结构化日志 → renderer 事件推送（对应原 Electron `webContents.send("log:new")`）。

use serde::Serialize;
use tauri::Emitter;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub category: String,
    pub level: String,
    pub message: String,
    pub detail: Option<String>,
    pub timestamp: u64,
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

pub fn send(category: &str, level: &str, message: &str, detail: Option<String>) {
    let entry = LogEntry {
        category: category.to_string(),
        level: level.to_string(),
        message: message.to_string(),
        detail,
        timestamp: now_ms(),
    };
    if let Some(app) = crate::ctx::try_handle() {
        let _ = app.emit("log:new", entry);
    } else {
        // 无 tauri 环境（单元测试 / 验收 bin）：降级为 stderr
        eprintln!("[{}] {}", entry.category, entry.message);
    }
}

// 便捷封装（对齐原 services 的 log 调用风格）
pub fn info(category: &str, message: &str) {
    send(category, "info", message, None);
}
pub fn success(category: &str, message: &str) {
    send(category, "success", message, None);
}
pub fn warning(category: &str, message: &str) {
    send(category, "warning", message, None);
}
pub fn error(category: &str, message: &str) {
    send(category, "error", message, None);
}
pub fn progress(category: &str, message: &str) {
    send(category, "progress", message, None);
}
