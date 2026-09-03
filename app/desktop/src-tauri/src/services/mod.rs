//! 平台 I/O 壳层：注册表 / 文件系统 → core 纯逻辑。
//! 每个 services 模块只做 I/O，决策交给 `srp-cfg-core`。

pub mod backup;
pub mod detection;
pub mod fs_explorer;
pub mod installer;
pub mod migrate;
pub mod staging;
pub mod updater;
pub mod user_config;
pub mod vcfg;

use std::path::Path;

/// 通用文件工具：递归列出相对路径（排序，保证确定性）。
pub fn walk_sync(dir: &Path) -> Vec<String> {
    let mut out = Vec::new();
    fn walk(d: &Path, out: &mut Vec<String>) {
        let Ok(entries) = std::fs::read_dir(d) else {
            return;
        };
        let mut names: Vec<_> = entries.filter_map(|e| e.ok()).collect();
        names.sort_by_key(|e| e.file_name());
        for e in names {
            let full = d.join(e.file_name());
            if e.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                walk(&full, out);
            } else {
                out.push(full.to_string_lossy().to_string());
            }
        }
    }
    walk(dir, &mut out);
    out
}

/// 递归复制目录（目标不存在则创建）。
pub fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    let mut names: Vec<_> = std::fs::read_dir(src)?
        .filter_map(|e| e.ok())
        .collect();
    names.sort_by_key(|e| e.file_name());
    for e in names {
        let s = src.join(e.file_name());
        let d = dst.join(e.file_name());
        if e.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            copy_dir_recursive(&s, &d)?;
        } else {
            std::fs::copy(&s, &d)?;
        }
    }
    Ok(())
}

/// 顶层条目（文件/目录名，排序），对应原 `installer.ts walkTopLevel`。
pub fn walk_top_level(dir: &Path) -> (Vec<String>, Vec<String>) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return (Vec::new(), Vec::new());
    };
    let mut files = Vec::new();
    let mut dirs = Vec::new();
    for e in entries.filter_map(|e| e.ok()) {
        let name = e.file_name().to_string_lossy().to_string();
        if e.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            dirs.push(name);
        } else {
            files.push(name);
        }
    }
    files.sort();
    dirs.sort();
    (files, dirs)
}

/// 当前本地日期 `YYYY-MM-DD`（对应 TS `generateTimestampFolderName` 的 date 部分）。
pub fn today_date() -> String {
    use chrono::Local;
    Local::now().format("%Y-%m-%d").to_string()
}
