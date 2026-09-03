//! 数据目录迁移执行（D2）：跨版本目录迁移 + 旧布局 → 新布局升级。
//!
//! 决策逻辑在 core `migrate.rs`（plan_migration / should_migrate）；
//! 本模块负责扫描目录、执行 Move/Skip、写 `.migrated` 标记。

use std::fs;
use std::path::Path;

use srp_cfg_core::{plan_migration, should_migrate, MigrationAction};

use crate::ctx;
use crate::log;

const MIGRATED_MARKER: &str = ".migrated";

/// 首启动迁移：`%APPDATA%/top.srprolin.cfg`（上一代 Tauri） → `app_data_dir()`（= %APPDATA%/srp-cfg）。
/// 说明：新目录名与 Electron 时代同名，Electron 老用户无需迁移；
/// 仅上一代 Tauri（identifier = top.srprolin.cfg）的存量数据需要迁回。
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

    // 目标目录中仅统计"真实数据"条目：空目录视为不存在。
    // 原因：lib.rs setup 中 staging::initialize_staging_area() 会先创建同名骨架目录
    // （cfg/annotations/video/upload/download/save/res），若把空目录算作"已有"，
    // plan_migration 会对旧数据全部 Skip → 真实数据永远不会被迁移（且不写 .migrated）。
    let target_entries: Vec<String> = if target.exists() {
        fs::read_dir(&target)
            .map(|rd| {
                rd.flatten()
                    .filter(|e| match e.file_type() {
                        Ok(ft) if ft.is_dir() => {
                            // 目录：仅当非空才算已有数据
                            fs::read_dir(e.path())
                                .map(|mut rd| rd.next().is_some())
                                .unwrap_or(false)
                        }
                        _ => true,
                    })
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

/// 旧目录布局 → 新目录布局一次性升级（幂等，每次启动可安全执行）。
///
/// 旧布局（Electron 与早期 Tauri）：根目录平铺 `cfg|annotations|video|upload|download|save|res|update-cache` + 根目录 *.json
/// 新布局：`staging/*`、`library/*`、`archive/*`、`state/*.json`、`cache/update`。
/// 必须早于 initialize_staging_area()（否则骨架目录会让 move_entries 误判目标已存在而跳过）。
/// 额外做防御性兼容：若历史清单中数据位于字面 "name" key（异常格式），迁移时修正为正确的清单 key。
pub fn upgrade_layout() {
    let base = ctx::base_dir();

    // 目录映射（旧 → 新）
    let dir_mappings: [(&str, &str); 8] = [
        ("cfg", "staging/cfg"),
        ("annotations", "staging/annotations"),
        ("video", "staging/video"),
        ("upload", "library/upload"),
        ("download", "library/download"),
        ("save", "archive/overlay"),
        ("res", "archive/conflicts"),
        ("update-cache", "cache/update"),
    ];
    for (old, new) in dir_mappings {
        let src = base.join(old);
        if !src.exists() {
            continue;
        }
        let dst = base.join(new);
        let _ = fs::create_dir_all(&dst);
        let moved = move_entries(&src, &dst);
        if moved > 0 {
            log::info(
                "file-ops",
                &format!("目录结构升级：{old}/ → {new}/（{moved} 项）"),
            );
        }
        // 源已空（或全部迁移）则移除，避免残留空目录
        let _ = fs::remove_dir(&src);
    }

    // JSON 清单映射（旧 → 新文件名）+ 兼容坏 key
    let json_mappings: [(&str, &str, &str); 3] = [
        ("install.json", "state/install.json", "install"),
        ("save.json", "state/overlay.json", "save"),
        ("res.json", "state/conflicts.json", "res"),
    ];
    for (old, new, key) in json_mappings {
        let src = base.join(old);
        if !src.exists() {
            continue;
        }
        let dst = base.join(new);
        if dst.exists() {
            let _ = fs::remove_file(&src);
            continue;
        }
        if let Some(mut value) = read_json(&src) {
            if let Some(data) = value.get("name").cloned() {
                if let Some(obj) = value.as_object_mut() {
                    obj.insert(key.to_string(), data);
                    obj.remove("name");
                }
            }
            if let Some(parent) = dst.parent() {
                let _ = fs::create_dir_all(parent);
            }
            let _ = fs::write(
                &dst,
                serde_json::to_string_pretty(&value).unwrap_or_default(),
            );
        }
        let _ = fs::remove_file(&src);
    }
}

/// 将 src 顶层条目移动到 dst（同名保留目标、不覆盖），返回移动计数。
fn move_entries(src: &Path, dst: &Path) -> usize {
    let Ok(rd) = fs::read_dir(src) else {
        return 0;
    };
    let mut moved = 0usize;
    for entry in rd.flatten() {
        let name = entry.file_name();
        let from = src.join(&name);
        let to = dst.join(&name);
        if to.exists() {
            continue;
        }
        let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
        let ok = if is_dir {
            crate::services::copy_dir_recursive(&from, &to).is_ok()
        } else {
            fs::copy(&from, &to).is_ok()
        };
        if ok {
            if is_dir {
                let _ = fs::remove_dir_all(&from);
            } else {
                let _ = fs::remove_file(&from);
            }
            moved += 1;
        }
    }
    moved
}

fn read_json(path: &Path) -> Option<serde_json::Value> {
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
}
