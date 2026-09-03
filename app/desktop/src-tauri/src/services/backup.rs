//! 备份中心服务：全量 ZIP 快照、元数据索引、FIFO 淘汰与一键恢复。

use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use chrono::Local;
use serde::{Deserialize, Serialize};
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

use crate::ctx;
use crate::log;
use crate::services::user_config::GamePaths;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupMeta {
    pub id: String,
    pub timestamp: u64,
    pub date_str: String,
    pub note: String,
    pub is_auto: bool,
    pub components: Vec<String>,
    pub total_size: u64,
    pub file_path: String,
    pub paths: HashMap<String, String>,
}

fn backups_dir() -> PathBuf {
    let dir = ctx::base_dir().join("backups");
    let _ = fs::create_dir_all(&dir);
    dir
}

/// 列出所有备份快照（按时间降序）。
pub fn list_backups() -> Vec<BackupMeta> {
    let dir = backups_dir();
    let Ok(entries) = fs::read_dir(dir) else {
        return Vec::new();
    };

    let mut list = Vec::new();
    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.extension().and_then(|ext| ext.to_str()) != Some("zip") {
            continue;
        }

        if let Ok(meta) = read_backup_meta(&path) {
            list.push(meta);
        }
    }

    list.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    list
}

/// 从 ZIP 内部或同名 .json 读取元数据。
fn read_backup_meta(zip_path: &Path) -> Result<BackupMeta, String> {
    let file = File::open(zip_path).map_err(|e| format!("打开快照失败: {e}"))?;
    let total_size = file.metadata().map(|m| m.len()).unwrap_or(0);
    let mut archive = ZipArchive::new(file).map_err(|e| format!("解析快照失败: {e}"))?;

    let mut meta_file = archive
        .by_name("meta.json")
        .map_err(|_| "快照中未找到 meta.json".to_string())?;

    let mut json_str = String::new();
    meta_file
        .read_to_string(&mut json_str)
        .map_err(|e| format!("读取 meta.json 失败: {e}"))?;

    let mut meta: BackupMeta =
        serde_json::from_str(&json_str).map_err(|e| format!("解析 meta.json 失败: {e}"))?;

    meta.file_path = zip_path.to_string_lossy().to_string();
    meta.total_size = total_size;
    Ok(meta)
}

/// 创建全量 ZIP 快照。
pub fn create_snapshot(
    components: &[String],
    note: &str,
    is_auto: bool,
    game_paths: &GamePaths,
) -> Result<BackupMeta, String> {
    let dir = backups_dir();
    let now = Local::now();
    let timestamp = now.timestamp_millis() as u64;
    let date_str = now.format("%Y-%m-%d %H:%M:%S").to_string();
    let suffix = if is_auto { "auto" } else { "manual" };
    let id = format!("snapshot_{}_{}", now.format("%Y%m%d_%H%M%S"), suffix);
    let zip_filename = format!("{id}.zip");
    let zip_path = dir.join(&zip_filename);

    let mut paths_map = HashMap::new();
    if let Some(p) = &game_paths.game_cfg_path {
        paths_map.insert("cfg".to_string(), p.clone());
    }
    if let Some(p) = &game_paths.annotations_path {
        paths_map.insert("annotations".to_string(), p.clone());
    }
    if let Some(p) = &game_paths.user_cfg_path {
        paths_map.insert("video".to_string(), p.clone());
    }

    let file = File::create(&zip_path).map_err(|e| format!("无法创建快照文件: {e}"))?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    // 写入各组件对应目录下的实际物理文件
    for comp in components {
        let Some(target_dir_str) = paths_map.get(comp) else {
            continue;
        };
        let target_dir = Path::new(target_dir_str);
        if !target_dir.exists() {
            continue;
        }

        if target_dir.is_file() {
            if let Ok(mut f) = File::open(target_dir) {
                let file_name = target_dir
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_else(|| "file".to_string());
                let entry_path = format!("{comp}/{file_name}");
                let _ = zip.start_file(&entry_path, options);
                let mut buf = Vec::new();
                if f.read_to_end(&mut buf).is_ok() {
                    let _ = zip.write_all(&buf);
                }
            }
        } else {
            add_dir_to_zip(&mut zip, target_dir, comp, options);
        }
    }

    let meta = BackupMeta {
        id: id.clone(),
        timestamp,
        date_str: date_str.clone(),
        note: note.to_string(),
        is_auto,
        components: components.to_vec(),
        total_size: 0,
        file_path: zip_path.to_string_lossy().to_string(),
        paths: paths_map,
    };

    // 写入 meta.json
    let meta_json = serde_json::to_string_pretty(&meta).unwrap_or_default();
    zip.start_file("meta.json", options)
        .map_err(|e| format!("写入 meta.json 失败: {e}"))?;
    zip.write_all(meta_json.as_bytes())
        .map_err(|e| format!("写入 meta.json 内容失败: {e}"))?;

    let final_file = zip
        .finish()
        .map_err(|e| format!("完成 ZIP 快照压缩失败: {e}"))?;
    let total_size = final_file.metadata().map(|m| m.len()).unwrap_or(0);

    let mut result_meta = meta;
    result_meta.total_size = total_size;

    log::info(
        "backup",
        &format!(
            "已创建快照 [{id}] ({}) | 组件: {:?}, 体积: {} KB",
            result_meta.date_str,
            result_meta.components,
            total_size / 1024
        ),
    );

    Ok(result_meta)
}

fn add_dir_to_zip<W: Write + std::io::Seek>(
    zip: &mut ZipWriter<W>,
    base_dir: &Path,
    prefix: &str,
    options: SimpleFileOptions,
) {
    fn walk_add<W: Write + std::io::Seek>(
        zip: &mut ZipWriter<W>,
        current: &Path,
        base_dir: &Path,
        prefix: &str,
        options: SimpleFileOptions,
    ) {
        let Ok(entries) = fs::read_dir(current) else {
            return;
        };
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            let relative = match path.strip_prefix(base_dir) {
                Ok(r) => r.to_string_lossy().replace('\\', "/"),
                Err(_) => continue,
            };
            let zip_entry_name = if prefix.is_empty() {
                relative
            } else {
                format!("{prefix}/{relative}")
            };

            if path.is_dir() {
                let dir_entry_name = if zip_entry_name.ends_with('/') {
                    zip_entry_name
                } else {
                    format!("{zip_entry_name}/")
                };
                let _ = zip.add_directory(&dir_entry_name, options);
                walk_add(zip, &path, base_dir, prefix, options);
            } else if path.is_file() {
                if let Ok(mut f) = File::open(&path) {
                    let _ = zip.start_file(&zip_entry_name, options);
                    let mut buf = Vec::new();
                    if f.read_to_end(&mut buf).is_ok() {
                        let _ = zip.write_all(&buf);
                    }
                }
            }
        }
    }
    walk_add(zip, base_dir, base_dir, prefix, options);
}

/// 清理超出上限的最旧自动快照 (FIFO)。若 max_keep == 0 则不清理（保留全部）。
pub fn clean_auto_backups(max_keep: usize) -> usize {
    if max_keep == 0 {
        return 0;
    }
    let all = list_backups();
    let mut auto_backups: Vec<_> = all.iter().filter(|m| m.is_auto).collect();
    // 降序排序，最新在前
    auto_backups.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    if auto_backups.len() <= max_keep {
        return 0;
    }

    let to_remove = &auto_backups[max_keep..];
    let mut removed_count = 0;
    for b in to_remove {
        if let Ok(_) = fs::remove_file(&b.file_path) {
            removed_count += 1;
            log::info(
                "backup",
                &format!("已清理旧自动快照 [{}] ({})", b.id, b.file_path),
            );
        }
    }
    removed_count
}

/// 恢复指定快照。
pub fn restore_snapshot(backup_id: &str, current_game_paths: &GamePaths) -> Result<(), String> {
    let zip_filename = if backup_id.ends_with(".zip") {
        backup_id.to_string()
    } else {
        format!("{backup_id}.zip")
    };
    let zip_path = backups_dir().join(&zip_filename);
    if !zip_path.exists() {
        return Err(format!("快照文件不存在: {}", zip_path.display()));
    }

    let meta = read_backup_meta(&zip_path)?;

    // 1. 恢复前先自动创建一次保护性快照
    let _ = create_snapshot(
        &meta.components,
        &format!("恢复快照 [{backup_id}] 前的安全备份"),
        true,
        current_game_paths,
    );

    let file = File::open(&zip_path).map_err(|e| format!("打开快照文件失败: {e}"))?;
    let mut archive = ZipArchive::new(file).map_err(|e| format!("解压快照失败: {e}"))?;

    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| format!("读取压缩项失败: {e}"))?;
        let name = entry.name().to_string();
        if name == "meta.json" {
            continue;
        }

        // 分割 prefix/relative_path
        let parts: Vec<&str> = name.splitn(2, '/').collect();
        if parts.len() < 2 {
            continue;
        }
        let comp = parts[0];
        let subpath = parts[1];
        if subpath.is_empty() {
            continue;
        }

        // 确定恢复目标根目录：优先使用当前探测到的路径，其次使用 meta.json 中记录的历史路径
        let target_base_opt = match comp {
            "cfg" => current_game_paths
                .game_cfg_path
                .as_ref()
                .or_else(|| meta.paths.get("cfg")),
            "annotations" => current_game_paths
                .annotations_path
                .as_ref()
                .or_else(|| meta.paths.get("annotations")),
            "video" => current_game_paths
                .user_cfg_path
                .as_ref()
                .or_else(|| meta.paths.get("video")),
            _ => meta.paths.get(comp),
        };

        let Some(target_base_str) = target_base_opt else {
            continue;
        };

        let target_base = Path::new(target_base_str);
        let out_path = if target_base.is_file() {
            target_base.to_path_buf()
        } else {
            target_base.join(subpath)
        };

        if entry.is_dir() {
            let _ = fs::create_dir_all(&out_path);
        } else {
            if let Some(parent) = out_path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            let mut outfile = File::create(&out_path)
                .map_err(|e| format!("无法写入恢复文件 {}: {e}", out_path.display()))?;
            std::io::copy(&mut entry, &mut outfile)
                .map_err(|e| format!("恢复文件数据失败 {}: {e}", out_path.display()))?;
        }
    }

    log::success(
        "backup",
        &format!("已成功恢复快照 [{backup_id}] (还原组件: {:?})", meta.components),
    );

    Ok(())
}

/// 删除指定快照。
pub fn delete_backup(backup_id: &str) -> Result<(), String> {
    let zip_filename = if backup_id.ends_with(".zip") {
        backup_id.to_string()
    } else {
        format!("{backup_id}.zip")
    };
    let zip_path = backups_dir().join(&zip_filename);
    if zip_path.exists() {
        fs::remove_file(&zip_path).map_err(|e| format!("删除快照文件失败: {e}"))?;
        log::info("backup", &format!("已删除快照 [{backup_id}]"));
    }
    Ok(())
}

/// 打开备份目录。
pub fn open_backups_folder() -> Result<(), String> {
    let dir = backups_dir();
    tauri_plugin_opener::open_path(dir.to_string_lossy().as_ref(), None::<&str>)
        .map_err(|e| e.to_string())
}
