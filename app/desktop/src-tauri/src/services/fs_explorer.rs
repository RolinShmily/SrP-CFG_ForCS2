//! 物理文件树扫描与文件管理服务（用于“当前安装/文件浏览”）。

use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::Path;
use std::time::UNIX_EPOCH;

use serde::{Deserialize, Serialize};

use crate::log;
use crate::services::user_config::GamePaths;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FsTreeNode {
    pub name: String,
    pub path: String,
    pub relative_path: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified_at: u64,
    pub children: Option<Vec<FsTreeNode>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FsTreeRoot {
    pub component_id: String,
    pub label: String,
    pub target_path: String,
    pub exists: bool,
    pub file_count: usize,
    pub total_size: u64,
    pub tree: Option<FsTreeNode>,
}

/// 扫描所有已安装组件对应的物理目录。
pub fn scan_installed_roots(game_paths: &GamePaths) -> Vec<FsTreeRoot> {
    let mut roots = Vec::new();

    // 1. Runtime Core (CFG)
    if let Some(cfg_path_str) = &game_paths.game_cfg_path {
        let p = Path::new(cfg_path_str);
        roots.push(build_root("cfg", "Runtime Core (CFG)", p));
    } else {
        roots.push(build_empty_root("cfg", "Runtime Core (CFG)"));
    }

    // 2. 地图指南 (Annotations)
    if let Some(ann_path_str) = &game_paths.annotations_path {
        let p = Path::new(ann_path_str);
        roots.push(build_root("annotations", "地图指南 (Annotations)", p));
    } else {
        roots.push(build_empty_root("annotations", "地图指南 (Annotations)"));
    }

    // 3. 视频配置 (Video)
    if let Some(user_cfg_str) = &game_paths.user_cfg_path {
        let p = Path::new(user_cfg_str);
        roots.push(build_root("video", "视频与用户配置 (Video/VCFG)", p));
    } else {
        roots.push(build_empty_root("video", "视频与用户配置 (Video/VCFG)"));
    }

    roots
}

fn build_empty_root(component_id: &str, label: &str) -> FsTreeRoot {
    FsTreeRoot {
        component_id: component_id.to_string(),
        label: label.to_string(),
        target_path: String::new(),
        exists: false,
        file_count: 0,
        total_size: 0,
        tree: None,
    }
}

fn build_root(component_id: &str, label: &str, path: &Path) -> FsTreeRoot {
    let path_str = path.to_string_lossy().to_string();
    if !path.exists() {
        return FsTreeRoot {
            component_id: component_id.to_string(),
            label: label.to_string(),
            target_path: path_str,
            exists: false,
            file_count: 0,
            total_size: 0,
            tree: None,
        };
    }

    let tree = scan_node(path, path, 0);
    let (file_count, total_size) = match &tree {
        Some(node) => count_tree(node),
        None => (0, 0),
    };

    FsTreeRoot {
        component_id: component_id.to_string(),
        label: label.to_string(),
        target_path: path_str,
        exists: true,
        file_count,
        total_size,
        tree,
    }
}

fn count_tree(node: &FsTreeNode) -> (usize, u64) {
    if !node.is_dir {
        return (1, node.size);
    }
    let mut count = 0;
    let mut total_size = 0;
    if let Some(children) = &node.children {
        for child in children {
            let (c, s) = count_tree(child);
            count += c;
            total_size += s;
        }
    }
    (count, total_size)
}

fn scan_node(root: &Path, current: &Path, depth: usize) -> Option<FsTreeNode> {
    if depth > 10 {
        return None;
    }

    let metadata = fs::metadata(current).ok()?;
    let is_dir = metadata.is_dir();
    let size = if is_dir { 0 } else { metadata.len() };
    let modified_at = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    let name = current
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| current.to_string_lossy().to_string());

    let relative_path = current
        .strip_prefix(root)
        .map(|p| p.to_string_lossy().replace('\\', "/"))
        .unwrap_or_default();

    let children = if is_dir {
        let Ok(entries) = fs::read_dir(current) else {
            return None;
        };

        let mut child_nodes = Vec::new();
        let mut items: Vec<_> = entries.filter_map(|e| e.ok()).collect();
        // 文件夹优先，同类按字典序排序
        items.sort_by(|a, b| {
            let a_is_dir = a.file_type().map(|t| t.is_dir()).unwrap_or(false);
            let b_is_dir = b.file_type().map(|t| t.is_dir()).unwrap_or(false);
            if a_is_dir != b_is_dir {
                b_is_dir.cmp(&a_is_dir)
            } else {
                a.file_name().cmp(&b.file_name())
            }
        });

        for item in items {
            let p = item.path();
            if let Some(child_node) = scan_node(root, &p, depth + 1) {
                child_nodes.push(child_node);
            }
        }
        Some(child_nodes)
    } else {
        None
    };

    Some(FsTreeNode {
        name,
        path: current.to_string_lossy().to_string(),
        relative_path,
        is_dir,
        size,
        modified_at,
        children,
    })
}

/// 读取指定文本文件内容。
pub fn read_file_text(path_str: &str) -> Result<String, String> {
    let p = Path::new(path_str);
    if !p.exists() {
        return Err(format!("文件不存在: {path_str}"));
    }
    if !p.is_file() {
        return Err(format!("目标不是文件: {path_str}"));
    }

    let mut file = File::open(p).map_err(|e| format!("打开文件失败: {e}"))?;
    let mut content = String::new();
    file.read_to_string(&mut content)
        .map_err(|e| format!("读取文本内容失败（非 UTF-8 文本或权限不足）: {e}"))?;

    Ok(content)
}

/// 保存修改后的文本文件内容。
pub fn write_file_text(path_str: &str, content: &str) -> Result<(), String> {
    let p = Path::new(path_str);
    if let Some(parent) = p.parent() {
        let _ = fs::create_dir_all(parent);
    }

    let mut file = File::create(p).map_err(|e| format!("创建文件失败: {e}"))?;
    file.write_all(content.as_bytes())
        .map_err(|e| format!("写入文件失败: {e}"))?;

    log::info("file-ops", &format!("已保存文件: {path_str}"));
    Ok(())
}

/// 删除指定文件或目录。
pub fn delete_fs_item(path_str: &str) -> Result<(), String> {
    let p = Path::new(path_str);
    if !p.exists() {
        return Ok(());
    }

    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| format!("删除目录失败: {e}"))?;
    } else {
        fs::remove_file(p).map_err(|e| format!("删除文件失败: {e}"))?;
    }

    log::info("file-ops", &format!("已删除: {path_str}"));
    Ok(())
}

/// 在文件资源管理器中打开指定目录或选中文件。
pub fn open_path_in_explorer(path_str: &str) -> Result<(), String> {
    let p = Path::new(path_str);
    let target = if p.is_file() {
        p.parent().unwrap_or(p)
    } else {
        p
    };
    tauri_plugin_opener::open_path(target.to_string_lossy().as_ref(), None::<&str>)
        .map_err(|e| e.to_string())
}
