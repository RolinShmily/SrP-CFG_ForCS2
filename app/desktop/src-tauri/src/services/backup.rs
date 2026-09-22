//! 备份中心服务：全量 ZIP 快照、元数据索引、FIFO 淘汰与一键恢复。

use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use chrono::Local;
use serde::{Deserialize, Serialize};
use srp_cfg_core::safe_archive_path;
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

/// 将快照 id 收敛为 `backups/` 内的具体文件路径。
///
/// `backup_id` 来自渲染层，属于不可信输入：若直接 `backups_dir().join(format!("{id}.zip"))`，
/// 传入 `../../../evil` 即可让应用去解压（或删除）磁盘上任意位置的 ZIP。
///
/// 快照 id 由本服务生成（`snapshot_YYYYmmdd_HHMMSS_auto|manual`），从不含分隔符，
/// 因此这里要求收敛后仍是**单一文件名**，从而保证结果恒为 `backups/` 的直接子项。
fn snapshot_zip_path(backup_id: &str) -> Result<PathBuf, String> {
    let name = if backup_id.to_lowercase().ends_with(".zip") {
        backup_id.to_string()
    } else {
        format!("{backup_id}.zip")
    };
    let safe = safe_archive_path(&name)
        .ok_or_else(|| format!("非法的快照标识: {backup_id}"))?;
    if safe.contains('/') {
        return Err(format!("非法的快照标识: {backup_id}"));
    }
    Ok(backups_dir().join(safe))
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
    let zip_path = snapshot_zip_path(backup_id)?;
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

    // 防止「安全地什么都不做」被当成成功：把无法落地的组件记下来，末尾显式报错。
    let mut restored = 0usize;
    let mut undetected: Vec<String> = Vec::new();

    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| format!("读取压缩项失败: {e}"))?;

        // 条目名由归档作者控制（`entry.name()` 是原始名，不做任何消毒），
        // 先收敛为 root 内的相对路径再拆分，否则 `cfg/../../x` 会写穿到游戏目录之外。
        let safe_name = safe_archive_path(entry.name())
            .ok_or_else(|| format!("快照包含不安全路径，已中止恢复: {}", entry.name()))?;
        if safe_name == "meta.json" {
            continue;
        }

        // 分割 prefix/relative_path
        let Some((comp, subpath)) = safe_name.split_once('/') else {
            continue;
        };
        if subpath.is_empty() {
            continue;
        }

        // 恢复目标根目录**只**取自本机实时探测结果。
        // 不得回退到 meta.json 中记录的路径：那是归档自述内容，等同攻击者指定写入根目录
        // （例如 csgo 未探测到时写入 C:\Windows），且对未知前缀更是完全可控的任意路径。
        let target_base_opt = match comp {
            "cfg" => current_game_paths.game_cfg_path.as_ref(),
            "annotations" => current_game_paths.annotations_path.as_ref(),
            "video" => current_game_paths.user_cfg_path.as_ref(),
            _ => None,
        };

        let Some(target_base_str) = target_base_opt else {
            if !undetected.iter().any(|c| c == comp) {
                undetected.push(comp.to_string());
            }
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
            restored += 1;
        }
    }

    if restored == 0 {
        return Err(if undetected.is_empty() {
            format!("快照 [{backup_id}] 中没有可恢复的文件")
        } else {
            format!(
                "未能恢复任何文件：未探测到组件 {:?} 对应的 CS2 目录。\
                 恢复只写入本机实时探测到的路径，不采用快照内记录的旧路径；\
                 请先在「组件安装」页完成环境自检。",
                undetected
            )
        });
    }

    log::success(
        "backup",
        &format!("已成功恢复快照 [{backup_id}] (还原 {} 个文件, 组件: {:?})", restored, meta.components),
    );

    Ok(())
}

/// 删除指定快照。
pub fn delete_backup(backup_id: &str) -> Result<(), String> {
    let zip_path = snapshot_zip_path(backup_id)?;
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

#[cfg(test)]
mod tests {
    use super::*;

    /// 快照 id 必须恒定落在 backups/ 之内。
    /// 回归自：`backups_dir().join(format!("{id}.zip"))` 曾让 `../../../evil` 逃出备份目录，
    /// 使应用去解压（或删除）磁盘上任意位置的 ZIP。
    #[test]
    fn snapshot_id_cannot_escape_the_backups_directory() {
        let backups = backups_dir();

        for evil in [
            "../../../evil",
            "..\\..\\evil",
            "a/../../evil",
            "/etc/passwd",
            "C:/Windows/evil",
            "sub/dir/snapshot",
            "",
            ".",
            "..",
        ] {
            let result = snapshot_zip_path(evil);
            // 要么直接拒绝，要么（对纯文件名）仍落在 backups/ 之内。
            if let Ok(path) = result {
                assert!(
                    path.parent() == Some(backups.as_path()),
                    "{evil:?} 逃出了备份目录: {}",
                    path.display()
                );
            }
        }

        assert!(snapshot_zip_path("../../../evil").is_err());
        assert!(snapshot_zip_path("..\\..\\evil").is_err());
        assert!(snapshot_zip_path("sub/dir/snapshot").is_err());
        assert!(snapshot_zip_path("/etc/passwd").is_err());
        assert!(snapshot_zip_path("C:/Windows/evil").is_err());
    }

    /// 正常 id（含省略 .zip 后缀的两种写法）仍必须解析到同一个文件。
    #[test]
    fn normal_snapshot_id_resolves_inside_backups() {
        let id = "snapshot_20260922_120000_auto";
        let from_bare = snapshot_zip_path(id).expect("bare id");
        let from_zip = snapshot_zip_path(&format!("{id}.zip")).expect("id with .zip");

        assert_eq!(from_bare, from_zip, "带与不带 .zip 后缀应指向同一快照");
        assert_eq!(from_bare.parent(), Some(backups_dir().as_path()));
        assert_eq!(
            from_bare.file_name().and_then(|n| n.to_str()),
            Some("snapshot_20260922_120000_auto.zip")
        );
    }
}
