//! 旧版 Electron 数据目录 → Tauri 数据目录一次性迁移执行（D2）。
//!
//! 决策逻辑在 core `migrate.rs`（plan_migration / should_migrate）；
//! 本模块负责扫描目录、执行 Move/Skip、写 `.migrated` 标记。

use std::fs;

use srp_cfg_core::{plan_migration, should_migrate, MigrationAction};

use crate::ctx;
use crate::log;

const MIGRATED_MARKER: &str = ".migrated";

/// 首启动迁移：`%APPDATA%/srp-cfg` → `app_data_dir()`（= %APPDATA%/top.srprolin.cfg）。
/// updater 缓存目录（update-cache）允许重建，不迁移（与 Electron 时代一致）。
pub fn run_migration() {
    let legacy = ctx::legacy_base_dir();
    let target = ctx::base_dir();

    if !legacy.exists() {
        return;
    }
    let marker = target.join(MIGRATED_MARKER);
    if marker.exists() {
        return;
    }

    let legacy_entries: Vec<String> = fs::read_dir(&legacy)
        .map(|rd| {
            rd.flatten()
                .filter(|e| e.file_name().to_string_lossy() != MIGRATED_MARKER)
                .map(|e| e.file_name().to_string_lossy().to_string())
                .collect()
        })
        .unwrap_or_default();

    let target_entries: Vec<String> = if target.exists() {
        fs::read_dir(&target)
            .map(|rd| {
                rd.flatten()
                    .map(|e| e.file_name().to_string_lossy().to_string())
                    .collect()
            })
            .unwrap_or_default()
    } else {
        Vec::new()
    };

    let actions = plan_migration(&legacy_entries, &target_entries);
    if !should_migrate(&actions) {
        return;
    }

    let _ = fs::create_dir_all(&target);
    let mut moved = 0usize;
    for action in &actions {
        if let MigrationAction::Move { name } = action {
            let src = legacy.join(name);
            let dst = target.join(name);
            if src.is_dir() {
                if crate::services::copy_dir_recursive(&src, &dst).is_ok() {
                    let _ = fs::remove_dir_all(&src);
                    moved += 1;
                }
            } else if fs::copy(&src, &dst).is_ok() {
                let _ = fs::remove_file(&src);
                moved += 1;
            }
        }
    }

    let _ = fs::write(&marker, "1");
    log::success(
        "file-ops",
        &format!("已迁移旧版数据目录（{moved} 项）：{legacy:?} → {target:?}"),
    );
}
