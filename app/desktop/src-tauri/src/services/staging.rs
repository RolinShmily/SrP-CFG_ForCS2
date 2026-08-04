//! 上传/下载 staging 壳层。
//!
//! 对应原 `app/desktop/src/main/services/staging.ts`：
//! - zip 解压（`zip` crate）与目录扫描/复制
//! - 上传 → 时间戳目录（core `next_timestamp_folder`）+ 数量上限（core `folders_to_remove`）
//! - 归类执行：按 core `classify_file` / `staging_destination` 复制到 cfg/annotations/video 暂存区
//! - 暂存区研判（core `inspect_cfg_files` / `is_runtime_registration_only`）
//! - 下载（ureq）

use std::fs;
use std::path::{Path, PathBuf};

use srp_cfg_core::{
    classify_file, folders_to_remove, inspect_cfg_files, is_timestamp_folder, next_timestamp_folder,
    staging_destination, upload_file_type, StagedCategory, UploadFileType,
};

use crate::ctx;
use crate::log;
use crate::models::{
    DownloadEntry, InstallMode, UploadEntry, UploadFileInfo, UploadedEntry,
};

const MAX_UPLOADS: usize = 5;
const MAX_DOWNLOADS: usize = 5;

const DIRS: [&str; 7] = ["cfg", "annotations", "video", "upload", "download", "save", "res"];

fn base() -> PathBuf {
    ctx::base_dir()
}

pub fn dir_path(name: &str) -> PathBuf {
    base().join(name)
}

pub fn get_staging_path(name: &str) -> PathBuf {
    dir_path(name)
}

pub fn get_upload_path() -> PathBuf {
    dir_path("upload")
}

pub fn get_download_path() -> PathBuf {
    dir_path("download")
}

pub fn get_save_path() -> PathBuf {
    dir_path("save")
}

pub fn get_res_path() -> PathBuf {
    dir_path("res")
}

/// 对应 TS `initializeStagingArea`。
pub fn initialize_staging_area() {
    for dir in DIRS {
        let _ = fs::create_dir_all(base().join(dir));
    }
    log::info("file-ops", "目录结构已初始化");
}

// ── fs 工具 ───────────────────────────────────────────────────

fn clear_directory(dir: &Path) {
    if !dir.exists() {
        return;
    }
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let full = dir.join(entry.file_name());
            let _ = fs::remove_dir_all(&full);
            let _ = fs::remove_file(&full);
        }
    }
}

fn walk_sync_abs(dir: &Path) -> Vec<PathBuf> {
    crate::services::walk_sync(dir)
        .iter()
        .map(PathBuf::from)
        .collect()
}

fn generate_timestamp_folder_name(scan_dir: &Path) -> String {
    let date = crate::services::today_date();
    let existing: Vec<String> = if scan_dir.exists() {
        fs::read_dir(scan_dir)
            .map(|rd| {
                rd.flatten()
                    .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
                    .map(|e| e.file_name().to_string_lossy().to_string())
                    .collect()
            })
            .unwrap_or_default()
    } else {
        Vec::new()
    };
    next_timestamp_folder(&existing, &date)
}

fn enforce_limit(dir: &Path, max: usize) {
    if !dir.exists() {
        return;
    }
    let existing: Vec<String> = fs::read_dir(dir)
        .map(|rd| {
            rd.flatten()
                .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
                .map(|e| e.file_name().to_string_lossy().to_string())
                .collect()
        })
        .unwrap_or_default();
    for name in folders_to_remove(&existing, max) {
        let _ = fs::remove_dir_all(dir.join(name));
    }
}

fn get_file_info(file_path: &Path, base_dir: &Path) -> UploadFileInfo {
    let name = file_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    let kind = match upload_file_type(&name) {
        UploadFileType::Cfg => "cfg",
        UploadFileType::Txt => "txt",
        UploadFileType::Unsupported => "unsupported",
    };
    let relative_path = file_path
        .strip_prefix(base_dir)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| name.clone());
    let size = file_path.metadata().map(|m| m.len()).unwrap_or(0);
    UploadFileInfo {
        name,
        relative_path,
        kind: kind.to_string(),
        size,
    }
}

// ── zip 解压（zip crate，mangled_name 自带路径穿越防护）──────

fn extract_zip(zip_path: &Path, dest_dir: &Path) -> Result<(), String> {
    let file = fs::File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        let outpath = dest_dir.join(entry.mangled_name());
        if entry.is_dir() {
            let _ = fs::create_dir_all(&outpath);
            continue;
        }
        if let Some(parent) = outpath.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let mut out = fs::File::create(&outpath).map_err(|e| e.to_string())?;
        std::io::copy(&mut entry, &mut out).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ── Upload ────────────────────────────────────────────────────

/// 对应 TS `uploadFiles`：全 zip → 逐包时间戳目录；否则收集 .cfg/.txt（目录/zip 递归）。
pub fn upload_files(file_paths: &[String]) -> UploadEntry {
    let upload_dir = get_upload_path();
    let _ = fs::create_dir_all(&upload_dir);

    let all_zip = !file_paths.is_empty()
        && file_paths.iter().all(|fp| {
            Path::new(fp).is_file()
                && Path::new(fp)
                    .extension()
                    .map(|e| e.to_string_lossy().to_lowercase() == "zip")
                    .unwrap_or(false)
        });

    if all_zip {
        let mut first_entry: Option<UploadEntry> = None;
        for zip_path in file_paths {
            enforce_limit(&upload_dir, MAX_UPLOADS);
            let folder_name = generate_timestamp_folder_name(&upload_dir);
            let dest = upload_dir.join(&folder_name);
            let _ = fs::create_dir_all(&dest);

            let file_name = Path::new(zip_path)
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();
            let _ = fs::copy(zip_path, dest.join(&file_name));
            let size = fs::metadata(zip_path).map(|m| m.len()).unwrap_or(0);
            log::success(
                "file-ops",
                &format!("ZIP 已上传：{file_name}（{:.1} MB）", size as f64 / 1024.0 / 1024.0),
            );

            if first_entry.is_none() {
                first_entry = Some(UploadEntry {
                    folder_name: folder_name.clone(),
                    timestamp: now_ms(),
                    file_count: 1,
                    files: vec![UploadFileInfo {
                        name: file_name.clone(),
                        relative_path: file_name,
                        kind: "txt".to_string(), // 与 TS 一致：zip 入口 files 类型固定 txt
                        size,
                    }],
                });
            }
        }
        return first_entry.unwrap_or_else(|| UploadEntry {
            folder_name: String::new(),
            timestamp: 0,
            file_count: 0,
            files: Vec::new(),
        });
    }

    // 非 zip / 混合上传
    enforce_limit(&upload_dir, MAX_UPLOADS);
    let folder_name = generate_timestamp_folder_name(&upload_dir);
    let upload_sub_dir = upload_dir.join(&folder_name);
    let _ = fs::create_dir_all(&upload_sub_dir);

    let mut all_files: Vec<PathBuf> = Vec::new();
    let mut unsupported_skipped: Vec<String> = Vec::new();
    let mut has_unsupported = false;

    for fp in file_paths {
        let p = Path::new(fp);
        if !p.exists() {
            log::warning("file-ops", &format!("文件不存在：{fp}"));
            continue;
        }
        if p.is_dir() {
            for f in walk_sync_abs(p) {
                let ext = f
                    .extension()
                    .map(|e| e.to_string_lossy().to_lowercase())
                    .unwrap_or_default();
                if ext == "cfg" || ext == "txt" {
                    all_files.push(f);
                } else {
                    unsupported_skipped.push(
                        f.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default(),
                    );
                    has_unsupported = true;
                }
            }
        } else {
            let ext = p
                .extension()
                .map(|e| e.to_string_lossy().to_lowercase())
                .unwrap_or_default();
            if ext == "zip" {
                let temp_extract_dir = upload_sub_dir.join(format!("_extract_{}", now_ms()));
                let _ = fs::create_dir_all(&temp_extract_dir);
                if extract_zip(p, &temp_extract_dir).is_ok() {
                    for f in walk_sync_abs(&temp_extract_dir) {
                        let f_ext = f
                            .extension()
                            .map(|e| e.to_string_lossy().to_lowercase())
                            .unwrap_or_default();
                        if f_ext == "cfg" || f_ext == "txt" {
                            all_files.push(f);
                        } else {
                            unsupported_skipped.push(
                                f.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default(),
                            );
                            has_unsupported = true;
                        }
                    }
                }
                let _ = fs::remove_dir_all(&temp_extract_dir);
            } else if ext == "cfg" || ext == "txt" {
                all_files.push(p.to_path_buf());
            } else {
                unsupported_skipped.push(
                    p.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default(),
                );
                has_unsupported = true;
            }
        }
    }

    if has_unsupported {
        log::warning(
            "file-ops",
            &format!("已过滤 {} 个不支持的文件：{}", unsupported_skipped.len(), unsupported_skipped[..unsupported_skipped.len().min(10)].join(", ")),
        );
    }

    if all_files.is_empty() {
        let _ = fs::remove_dir_all(&upload_sub_dir);
        log::error("file-ops", "未找到任何 .cfg 或 .txt 文件");
        return UploadEntry {
            folder_name,
            timestamp: now_ms(),
            file_count: 0,
            files: Vec::new(),
        };
    }

    for src in &all_files {
        let rel_path = if src.starts_with(&upload_sub_dir) {
            src.strip_prefix(&upload_sub_dir)
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default()
        } else {
            src.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default()
        };
        let dst = upload_sub_dir.join(&rel_path);
        if let Some(parent) = dst.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let _ = fs::copy(src, &dst);
    }

    let final_files = walk_sync_abs(&upload_sub_dir);
    let files: Vec<UploadFileInfo> = final_files
        .iter()
        .map(|f| get_file_info(f, &upload_sub_dir))
        .collect();
    log::success("file-ops", &format!("上传完成：{} 个文件（{folder_name}）", files.len()));

    UploadEntry {
        folder_name,
        timestamp: now_ms(),
        file_count: files.len(),
        files,
    }
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

// ── Upload History ────────────────────────────────────────────

pub fn get_upload_history() -> Vec<UploadEntry> {
    let upload_dir = get_upload_path();
    if !upload_dir.exists() {
        return Vec::new();
    }
    let mut out = Vec::new();
    for e in fs::read_dir(&upload_dir).into_iter().flatten().flatten() {
        let name = e.file_name().to_string_lossy().to_string();
        if !e.file_type().map(|t| t.is_dir()).unwrap_or(false) || !is_timestamp_folder(&name) {
            continue;
        }
        let dir = upload_dir.join(&name);
        let files: Vec<UploadFileInfo> = walk_sync_abs(&dir)
            .iter()
            .map(|f| get_file_info(f, &dir))
            .collect();
        out.push(UploadEntry {
            folder_name: name,
            timestamp: now_ms(),
            file_count: files.len(),
            files,
        });
    }
    out.sort_by(|a, b| b.folder_name.cmp(&a.folder_name));
    out
}

// ── Staging 归类执行 ──────────────────────────────────────────

/// 对应 TS `processUploadToStaging`：按 core 归类把上传包复制到暂存区。
pub fn process_upload_to_staging(upload_folder: &Path, mode: InstallMode) -> StagingCounts {
    if mode == InstallMode::Overlay {
        clear_directory(&get_staging_path("cfg"));
        clear_directory(&get_staging_path("annotations"));
        clear_directory(&get_staging_path("video"));
    }
    let cfg_dir = get_staging_path("cfg");
    let annotations_dir = get_staging_path("annotations");
    let video_dir = get_staging_path("video");

    let mut counts = StagingCounts::default();
    for file in walk_sync_abs(upload_folder) {
        let rel = file
            .strip_prefix(upload_folder)
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();
        let Some((category, dest)) = staging_destination(&rel) else {
            match classify_file(&rel) {
                StagedCategory::Vcfg => counts.blocked_vcfg += 1,
                _ => counts.unsupported += 1,
            }
            continue;
        };
        match category {
            StagedCategory::Cfg => {
                let dst = cfg_dir.join(&dest);
                if let Some(parent) = dst.parent() {
                    let _ = fs::create_dir_all(parent);
                }
                if fs::copy(&file, &dst).is_ok() {
                    counts.cfg += 1;
                }
            }
            StagedCategory::Annotations => {
                let dst = annotations_dir.join(&dest);
                if let Some(parent) = dst.parent() {
                    let _ = fs::create_dir_all(parent);
                }
                if fs::copy(&file, &dst).is_ok() {
                    counts.annotations += 1;
                }
            }
            StagedCategory::Video => {
                let _ = fs::create_dir_all(&video_dir);
                if fs::copy(&file, video_dir.join("cs2_video.txt")).is_ok() {
                    counts.video += 1;
                }
            }
            _ => {}
        }
    }

    if counts.cfg > 0 {
        log::success("install", &format!("CFG 文件：{} 个", counts.cfg));
    }
    if counts.annotations > 0 {
        log::success("install", &format!("地图指南文件：{} 个", counts.annotations));
    }
    if counts.video > 0 {
        log::success("install", &format!("视频预设文件：{} 个", counts.video));
    }
    if counts.unsupported > 0 {
        log::warning("file-ops", &format!("跳过 {} 个不支持的文件", counts.unsupported));
    }
    if counts.blocked_vcfg > 0 {
        log::warning(
            "file-ops",
            &format!("已阻止 {} 个 VCFG 文件", counts.blocked_vcfg),
        );
    }
    counts
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct StagingCounts {
    pub cfg: usize,
    pub annotations: usize,
    pub video: usize,
    pub unsupported: usize,
    pub blocked_vcfg: usize,
}

// ── 暂存区研判 ────────────────────────────────────────────────

/// 对应 TS `inspectConfigDirectory`：读 cfg 区文件内容 → core 研判。
pub fn inspect_config_directory(cfg_dir: &Path) -> (String, usize) {
    let mut files: std::collections::HashMap<String, String> = std::collections::HashMap::new();
    if cfg_dir.exists() {
        for f in walk_sync_abs(cfg_dir) {
            let rel = f
                .strip_prefix(cfg_dir)
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();
            if rel.to_lowercase().ends_with(".cfg") {
                if let Ok(content) = fs::read_to_string(&f) {
                    files.insert(rel, content);
                }
            }
        }
    }
    let impact = inspect_cfg_files(&files);
    (
        match impact.kind {
            srp_cfg_core::StagedConfigKind::Empty => "empty".to_string(),
            srp_cfg_core::StagedConfigKind::RuntimeCore => "runtime-core".to_string(),
            srp_cfg_core::StagedConfigKind::Custom => "custom".to_string(),
        },
        impact.cfg_count,
    )
}

pub fn inspect_staged_config() -> (String, usize) {
    inspect_config_directory(&get_staging_path("cfg"))
}

// ── Install From Upload ───────────────────────────────────────

pub fn install_from_upload(folder_name: &str, mode: InstallMode) -> Option<StagingCounts> {
    let dir = get_upload_path().join(folder_name);
    if !dir.exists() {
        log::error("install", &format!("上传记录不存在：{folder_name}"));
        return None;
    }
    let zip_files: Vec<String> = fs::read_dir(&dir)
        .into_iter()
        .flatten()
        .flatten()
        .filter(|e| e.file_name().to_string_lossy().ends_with(".zip"))
        .map(|e| e.file_name().to_string_lossy().to_string())
        .collect();

    if let Some(zip_name) = zip_files.first() {
        let zip_path = dir.join(zip_name);
        let temp_extract_dir = dir.join(format!("_extract_{}", now_ms()));
        log::progress("install", &format!("解压上传包：{zip_name}"));
        let result = match extract_zip(&zip_path, &temp_extract_dir) {
            Ok(()) => Some(process_upload_to_staging(&temp_extract_dir, mode)),
            Err(e) => {
                log::error("install", &format!("解压失败：{e}"));
                None
            }
        };
        let _ = fs::remove_dir_all(&temp_extract_dir);
        return result;
    }
    Some(process_upload_to_staging(&dir, mode))
}

// ── Upload CRUD ───────────────────────────────────────────────

pub fn get_uploaded_entries() -> Vec<UploadedEntry> {
    let upload_dir = get_upload_path();
    if !upload_dir.exists() {
        return Vec::new();
    }
    let mut out = Vec::new();
    for e in fs::read_dir(&upload_dir).into_iter().flatten().flatten() {
        if !e.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            continue;
        }
        let name = e.file_name().to_string_lossy().to_string();
        if !is_timestamp_folder(&name) {
            continue;
        }
        let dir = upload_dir.join(&name);
        let all_files = walk_sync_abs(&dir);
        let zip_files: Vec<_> = all_files.iter().filter(|f| f.extension().map(|x| x == "zip").unwrap_or(false)).collect();
        if !zip_files.is_empty() {
            let stat = fs::metadata(zip_files[0]).ok();
            out.push(UploadedEntry {
                folder_name: name,
                display_name: zip_files[0].file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default(),
                timestamp: stat.as_ref().and_then(|m| m.modified().ok()).and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d| d.as_millis() as u64).unwrap_or(0),
                size: stat.map(|m| m.len()).unwrap_or(0),
                file_count: 1,
                is_zip: true,
            });
        } else {
            let cfg_txt: Vec<_> = all_files
                .iter()
                .filter(|f| {
                    let ext = f.extension().map(|x| x.to_string_lossy().to_lowercase()).unwrap_or_default();
                    ext == "cfg" || ext == "txt"
                })
                .collect();
            if cfg_txt.is_empty() {
                continue;
            }
            let total_size: u64 = cfg_txt.iter().filter_map(|f| fs::metadata(f).ok()).map(|m| m.len()).sum();
            let mtime = fs::metadata(&dir).and_then(|m| m.modified()).ok().and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d| d.as_millis() as u64).unwrap_or(0);
            out.push(UploadedEntry {
                folder_name: name,
                display_name: format!("{} 个文件", cfg_txt.len()),
                timestamp: mtime,
                size: total_size,
                file_count: cfg_txt.len(),
                is_zip: false,
            });
        }
    }
    out.sort_by(|a, b| b.folder_name.cmp(&a.folder_name));
    out
}

pub fn delete_upload_entry(folder_name: &str) {
    let dir = get_upload_path().join(folder_name);
    if dir.exists() {
        let _ = fs::remove_dir_all(&dir);
        log::info("file-ops", &format!("已删除上传：{folder_name}"));
    }
}

// ── Downloads ─────────────────────────────────────────────────

/// 对应 TS `downloadFromUrl`：ureq 下载到时间戳目录。
pub fn download_from_url(url: &str, file_name: &str) -> Result<DownloadEntry, String> {
    let dl_base = get_download_path();
    let _ = fs::create_dir_all(&dl_base);
    enforce_limit(&dl_base, MAX_DOWNLOADS);

    let folder_name = generate_timestamp_folder_name(&dl_base);
    let dl_dir = dl_base.join(&folder_name);
    let _ = fs::create_dir_all(&dl_dir);
    let file_path = dl_dir.join(file_name);

    log::progress("file-ops", &format!("正在下载：{file_name}"));
    let result = (|| -> Result<u64, String> {
        let agent = ureq::Agent::config_builder()
            .timeout_global(Some(std::time::Duration::from_secs(60)))
            .build()
            .new_agent();
        let resp = agent
            .get(url)
            .header("User-Agent", "SrP-CFG-Installer")
            .call()
            .map_err(|e| format!("HTTP 错误：{e}"))?;
        let mut body = resp.into_body().into_reader();
        let mut out = fs::File::create(&file_path).map_err(|e| e.to_string())?;
        let n = std::io::copy(&mut body, &mut out).map_err(|e| e.to_string())?;
        Ok(n)
    })();

    match result {
        Ok(size) => {
            log::success("file-ops", &format!("下载完成：{file_name}（{:.1} MB）", size as f64 / 1024.0 / 1024.0));
            Ok(DownloadEntry {
                folder_name,
                file_name: file_name.to_string(),
                timestamp: now_ms(),
                size,
            })
        }
        Err(e) => {
            let _ = fs::remove_dir_all(&dl_dir);
            log::error("file-ops", &format!("下载失败：{file_name}，{e}"));
            Err(e)
        }
    }
}

pub fn get_download_entries() -> Vec<DownloadEntry> {
    let dl_dir = get_download_path();
    if !dl_dir.exists() {
        return Vec::new();
    }
    let mut out = Vec::new();
    for e in fs::read_dir(&dl_dir).into_iter().flatten().flatten() {
        if !e.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            continue;
        }
        let dir = dl_dir.join(e.file_name());
        let files: Vec<String> = fs::read_dir(&dir)
            .into_iter()
            .flatten()
            .flatten()
            .filter(|f| f.file_name().to_string_lossy().ends_with(".zip"))
            .map(|f| f.file_name().to_string_lossy().to_string())
            .collect();
        let Some(file_name) = files.first() else {
            continue;
        };
        let stat = fs::metadata(dir.join(file_name)).ok();
        out.push(DownloadEntry {
            folder_name: e.file_name().to_string_lossy().to_string(),
            file_name: file_name.clone(),
            timestamp: stat.as_ref().and_then(|m| m.modified().ok()).and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d| d.as_millis() as u64).unwrap_or(0),
            size: stat.map(|m| m.len()).unwrap_or(0),
        });
    }
    out.sort_by(|a, b| b.folder_name.cmp(&a.folder_name));
    out
}

pub fn delete_download(folder_name: &str) {
    let dir = get_download_path().join(folder_name);
    if dir.exists() {
        let _ = fs::remove_dir_all(&dir);
        log::info("file-ops", &format!("已删除下载：{folder_name}"));
    }
}

pub fn install_from_download(folder_name: &str, mode: InstallMode) -> Option<StagingCounts> {
    let dir = get_download_path().join(folder_name);
    if !dir.exists() {
        log::error("install", &format!("下载记录不存在：{folder_name}"));
        return None;
    }
    let zip_files: Vec<String> = fs::read_dir(&dir)
        .into_iter()
        .flatten()
        .flatten()
        .filter(|e| e.file_name().to_string_lossy().ends_with(".zip"))
        .map(|e| e.file_name().to_string_lossy().to_string())
        .collect();
    let Some(zip_name) = zip_files.first() else {
        log::error("install", &format!("未找到 ZIP 文件：{folder_name}"));
        return None;
    };
    let zip_path = dir.join(zip_name);
    let temp_extract_dir = dir.join(format!("_extract_{}", now_ms()));
    log::progress("install", &format!("解压配置包：{zip_name}"));
    let result = match extract_zip(&zip_path, &temp_extract_dir) {
        Ok(()) => Some(process_upload_to_staging(&temp_extract_dir, mode)),
        Err(e) => {
            log::error("install", &format!("解压失败：{e}"));
            None
        }
    };
    let _ = fs::remove_dir_all(&temp_extract_dir);
    result
}
