//! 安装清单与部署规划（纯逻辑）。
//!
//! 对应原 `app/desktop/src/main/services/installer.ts` 的纯计算部分：
//! - 三清单（install.json / res.json / save.json）的容错解析与规范化
//! - 覆盖安装（overlay）的动作规划：上一版本 → save/，冲突 → res/，staging → 游戏目录
//! - 追加安装（append）的清单合并（Set 并集，保持顺序）
//! - 单项/整类删除、恢复、清除的状态迁移
//! - 路径回填（updateInstallPaths，含 video → userCfgPath 的历史行为）
//!
//! 文件系统操作（复制/移动/删除/扫描）由 tauri 壳层负责，本模块只计算"应该做什么"。

use crate::conflicts::CategoryKey;
use serde_json::Value;
use std::collections::HashSet;

// ─────────────────────────────────────────────
// 清单结构（对应 TS CategoryData / InstallState）
// ─────────────────────────────────────────────

#[derive(Debug, Clone, Default, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryState {
    pub files: Vec<String>,
    pub dirs: Vec<String>,
    pub path: String,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallState {
    pub game_cfg: CategoryState,
    pub user_cfg: CategoryState,
    pub annotations: CategoryState,
    pub video: CategoryState,
}

pub const CATEGORY_KEYS: [CategoryKey; 4] = [
    CategoryKey::GameCfg,
    CategoryKey::UserCfg,
    CategoryKey::Annotations,
    CategoryKey::Video,
];

pub fn category(state: &InstallState, key: CategoryKey) -> &CategoryState {
    match key {
        CategoryKey::GameCfg => &state.game_cfg,
        CategoryKey::UserCfg => &state.user_cfg,
        CategoryKey::Annotations => &state.annotations,
        CategoryKey::Video => &state.video,
    }
}

pub fn category_mut(state: &mut InstallState, key: CategoryKey) -> &mut CategoryState {
    match key {
        CategoryKey::GameCfg => &mut state.game_cfg,
        CategoryKey::UserCfg => &mut state.user_cfg,
        CategoryKey::Annotations => &mut state.annotations,
        CategoryKey::Video => &mut state.video,
    }
}

// ─────────────────────────────────────────────
// 容错规范化（对应 TS normalizeCategory / normalizeState）
// ─────────────────────────────────────────────

fn string_list(value: Option<&Value>) -> Vec<String> {
    match value {
        Some(Value::Array(items)) => items
            .iter()
            .filter_map(|item| item.as_str().map(|s| s.to_string()))
            .collect(),
        _ => Vec::new(),
    }
}

/// 从 JSON 值规范化为 CategoryState：files/dirs 只保留字符串项，path 只保留字符串。
pub fn normalize_category(value: Option<&Value>) -> CategoryState {
    let obj = match value {
        Some(Value::Object(map)) => map,
        _ => return CategoryState::default(),
    };
    CategoryState {
        files: string_list(obj.get("files")),
        dirs: string_list(obj.get("dirs")),
        path: obj
            .get("path")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
    }
}

/// 从整份清单 JSON（{ install | res | save: { gameCfg, userCfg, ... } }）规范化出状态。
pub fn normalize_state(value: Option<&Value>) -> InstallState {
    let obj = match value {
        Some(Value::Object(map)) => map,
        _ => return InstallState::default(),
    };
    InstallState {
        game_cfg: normalize_category(obj.get(CategoryKey::GameCfg.as_str())),
        user_cfg: normalize_category(obj.get(CategoryKey::UserCfg.as_str())),
        annotations: normalize_category(obj.get(CategoryKey::Annotations.as_str())),
        video: normalize_category(obj.get(CategoryKey::Video.as_str())),
    }
}

// ─────────────────────────────────────────────
// 顶层条目（对应 TS walkTopLevel）
// ─────────────────────────────────────────────

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct EntryList {
    pub files: Vec<String>,
    pub dirs: Vec<String>,
}

impl EntryList {
    pub fn is_empty(&self) -> bool {
        self.files.is_empty() && self.dirs.is_empty()
    }
    pub fn len(&self) -> usize {
        self.files.len() + self.dirs.len()
    }
    pub fn names(&self) -> impl Iterator<Item = &String> {
        self.files.iter().chain(self.dirs.iter())
    }
}

// ─────────────────────────────────────────────
// 覆盖安装规划（对应 TS deployOverlay 的决策部分）
// ─────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DeployAction {
    /// 上一版本受管项 → save/（游戏目录中仍存在的才移动）
    MoveToSave { name: String, is_dir: bool },
    /// 全新安装时的同名冲突项 → res/（staging 名在游戏目录中已存在）
    MoveToRes { name: String, is_dir: bool },
    /// staging 顶层条目 → 游戏目录
    CopyStaging { name: String, is_dir: bool },
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct OverlayPlan {
    pub actions: Vec<DeployAction>,
    pub files_installed: usize,
    pub dirs_installed: usize,
}

/// 单个分类的覆盖部署规划。
/// `fresh_install`：install.json 中该分类无历史记录（prev 为空）时才会发生"冲突 → res"。
pub fn plan_overlay_category(
    prev: &CategoryState,
    staging: &EntryList,
    game_entries: &EntryList,
    fresh_install: bool,
) -> OverlayPlan {
    let mut actions = Vec::new();
    let mut files_installed = 0;
    let mut dirs_installed = 0;

    // 1. 上一版本受管项 → save/（仅在游戏目录中仍存在时）
    for name in &prev.files {
        if game_entries.files.contains(name) {
            actions.push(DeployAction::MoveToSave { name: name.clone(), is_dir: false });
        }
    }
    for name in &prev.dirs {
        if game_entries.dirs.contains(name) {
            actions.push(DeployAction::MoveToSave { name: name.clone(), is_dir: true });
        }
    }

    // 2. 全新安装：staging 同名且游戏目录已存在的项 → res/
    if fresh_install {
        for name in &staging.files {
            if game_entries.files.contains(name) {
                actions.push(DeployAction::MoveToRes { name: name.clone(), is_dir: false });
            }
        }
        for name in &staging.dirs {
            if game_entries.dirs.contains(name) {
                actions.push(DeployAction::MoveToRes { name: name.clone(), is_dir: true });
            }
        }
    }

    // 3. staging → 游戏目录
    for name in &staging.files {
        actions.push(DeployAction::CopyStaging { name: name.clone(), is_dir: false });
        files_installed += 1;
    }
    for name in &staging.dirs {
        actions.push(DeployAction::CopyStaging { name: name.clone(), is_dir: true });
        dirs_installed += 1;
    }

    OverlayPlan { actions, files_installed, dirs_installed }
}

// ─────────────────────────────────────────────
// 追加安装清单合并（对应 TS deployAppend 的 merge 部分）
// ─────────────────────────────────────────────

/// 有序去重并集（对应 TS `new Set([...existing, ...staging])`）。
pub fn ordered_union(existing: &[String], added: &[String]) -> Vec<String> {
    let mut seen: HashSet<String> = HashSet::new();
    let mut out = Vec::new();
    for item in existing.iter().chain(added.iter()) {
        if seen.insert(item.clone()) {
            out.push(item.clone());
        }
    }
    out
}

/// 追加安装后写回 install.json 的分类状态。
pub fn merge_append(existing: &CategoryState, staging: &EntryList) -> CategoryState {
    CategoryState {
        files: ordered_union(&existing.files, &staging.files),
        dirs: ordered_union(&existing.dirs, &staging.dirs),
        path: existing.path.clone(),
    }
}

// ─────────────────────────────────────────────
// 单项/整类删除与恢复（纯状态迁移）
// ─────────────────────────────────────────────

/// 从分类状态移除一项；返回该项是否为目录（false 表示是文件）。不存在则返回 None。
pub fn remove_item(state: &mut CategoryState, name: &str) -> Option<bool> {
    if let Some(pos) = state.files.iter().position(|f| f == name) {
        state.files.remove(pos);
        return Some(false);
    }
    if let Some(pos) = state.dirs.iter().position(|d| d == name) {
        state.dirs.remove(pos);
        return Some(true);
    }
    None
}

/// 恢复 res/save 单项后：从 res/save 移除，并（save 场景）登记进 install。
pub fn restore_item(backup: &mut CategoryState, name: &str) -> Option<bool> {
    remove_item(backup, name)
}

/// 整类清除（对应 clearResCategory / clearSaveCategory / clearInstallCategory 的清单部分）。
pub fn clear_category(state: &mut CategoryState) {
    state.files.clear();
    state.dirs.clear();
}

/// 恢复整类后写回 install（对应 restoreSaveCategory / restoreResCategory 的清单部分）。
pub fn install_from_backup(install: &mut CategoryState, backup: &CategoryState) {
    install.files = backup.files.clone();
    install.dirs = backup.dirs.clone();
}

// ─────────────────────────────────────────────
// 路径回填（对应 TS updateInstallPaths）
// ─────────────────────────────────────────────

/// 用检测结果回填清单路径；video 沿用 userCfgPath（历史行为，与 TS 一致）。
pub fn update_paths(
    state: &mut InstallState,
    game_cfg_path: Option<&str>,
    user_cfg_path: Option<&str>,
    annotations_path: Option<&str>,
) {
    if let Some(p) = game_cfg_path {
        state.game_cfg.path = p.to_string();
    }
    if let Some(p) = user_cfg_path {
        state.user_cfg.path = p.to_string();
        state.video.path = p.to_string();
    }
    if let Some(p) = annotations_path {
        state.annotations.path = p.to_string();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // ── normalize ───────────────────────────
    #[test]
    fn normalize_handles_junk_and_missing() {
        assert_eq!(normalize_category(None), CategoryState::default());
        assert_eq!(
            normalize_category(Some(&json!({ "files": ["a.cfg", 42, null], "dirs": ["maps/"], "path": 7 }))),
            CategoryState {
                files: vec!["a.cfg".to_string()],
                dirs: vec!["maps/".to_string()],
                path: String::new(),
            }
        );
    }

    #[test]
    fn normalize_state_reads_all_categories() {
        let raw = json!({
            "install": {
                "gameCfg": { "files": ["autoexec.cfg"], "dirs": [], "path": "G:/csgo/cfg" },
                "userCfg": { "files": [], "dirs": [], "path": "U:/custom" },
                "video": { "files": ["cs2_video.txt"], "dirs": [], "path": "U:/custom" }
            }
        });
        let state = normalize_state(raw.get("install"));
        assert_eq!(state.game_cfg.files, vec!["autoexec.cfg".to_string()]);
        assert_eq!(state.game_cfg.path, "G:/csgo/cfg");
        assert_eq!(state.video.files, vec!["cs2_video.txt".to_string()]);
        assert_eq!(state.annotations, CategoryState::default());
        assert_eq!(normalize_state(None), InstallState::default());
    }

    // ── overlay plan ────────────────────────
    #[test]
    fn overlay_fresh_install_moves_conflicts_to_res() {
        let staging = EntryList {
            files: vec!["autoexec.cfg".to_string()],
            dirs: vec![],
        };
        let game = EntryList {
            files: vec!["autoexec.cfg".to_string(), "user.cfg".to_string()],
            dirs: vec![],
        };
        let plan = plan_overlay_category(&CategoryState::default(), &staging, &game, true);
        assert_eq!(plan.files_installed, 1);
        assert_eq!(
            plan.actions,
            vec![
                DeployAction::MoveToRes { name: "autoexec.cfg".to_string(), is_dir: false },
                DeployAction::CopyStaging { name: "autoexec.cfg".to_string(), is_dir: false },
            ]
        );
    }

    #[test]
    fn overlay_reinstall_moves_previous_to_save() {
        let prev = CategoryState {
            files: vec!["old.cfg".to_string()],
            dirs: vec!["mappack/".to_string()],
            path: String::new(),
        };
        let staging = EntryList {
            files: vec!["new.cfg".to_string()],
            dirs: vec![],
        };
        let game = EntryList {
            files: vec!["old.cfg".to_string(), "new.cfg".to_string()],
            dirs: vec!["mappack/".to_string()],
        };
        let plan = plan_overlay_category(&prev, &staging, &game, false);
        assert_eq!(
            plan.actions,
            vec![
                DeployAction::MoveToSave { name: "old.cfg".to_string(), is_dir: false },
                DeployAction::MoveToSave { name: "mappack/".to_string(), is_dir: true },
                DeployAction::CopyStaging { name: "new.cfg".to_string(), is_dir: false },
            ]
        );
        // 非全新安装：staging 冲突不进 res
        assert!(!plan.actions.iter().any(|a| matches!(a, DeployAction::MoveToRes { .. })));
    }

    #[test]
    fn overlay_skips_previous_items_no_longer_in_game() {
        let prev = CategoryState {
            files: vec!["gone.cfg".to_string()],
            dirs: vec![],
            path: String::new(),
        };
        let plan = plan_overlay_category(&prev, &EntryList::default(), &EntryList::default(), false);
        assert_eq!(plan.actions, Vec::<DeployAction>::new());
        assert_eq!(plan.files_installed, 0);
    }

    // ── append merge ────────────────────────
    #[test]
    fn append_merges_union_keeping_order() {
        let existing = CategoryState {
            files: vec!["a.cfg".to_string(), "b.cfg".to_string()],
            dirs: vec!["d1/".to_string()],
            path: "P".to_string(),
        };
        let staging = EntryList {
            files: vec!["b.cfg".to_string(), "c.cfg".to_string()],
            dirs: vec![],
        };
        let merged = merge_append(&existing, &staging);
        assert_eq!(merged.files, vec!["a.cfg".to_string(), "b.cfg".to_string(), "c.cfg".to_string()]);
        assert_eq!(merged.dirs, vec!["d1/".to_string()]);
        assert_eq!(merged.path, "P");
    }

    #[test]
    fn ordered_union_dedupes() {
        assert_eq!(
            ordered_union(&["x".to_string()], &["x".to_string(), "y".to_string()]),
            vec!["x".to_string(), "y".to_string()]
        );
    }

    // ── remove / restore / clear ────────────
    #[test]
    fn remove_item_updates_state() {
        let mut state = CategoryState {
            files: vec!["a.cfg".to_string()],
            dirs: vec!["d/".to_string()],
            path: String::new(),
        };
        assert_eq!(remove_item(&mut state, "a.cfg"), Some(false));
        assert_eq!(remove_item(&mut state, "d/"), Some(true));
        assert_eq!(remove_item(&mut state, "missing"), None);
        assert_eq!(state.files.len(), 0);
        assert_eq!(state.dirs.len(), 0);
    }

    #[test]
    fn restore_removes_from_backup_and_install_tracks_save() {
        let mut backup = CategoryState {
            files: vec!["orig.cfg".to_string()],
            dirs: vec![],
            path: String::new(),
        };
        assert_eq!(restore_item(&mut backup, "orig.cfg"), Some(false));
        assert!(backup.files.is_empty());

        // save → install 回填（restoreFromSave 后 install 与 save 一致）
        let save = CategoryState {
            files: vec!["v1.cfg".to_string()],
            dirs: vec!["maps/".to_string()],
            path: String::new(),
        };
        let mut install = CategoryState::default();
        install_from_backup(&mut install, &save);
        assert_eq!(install.files, save.files);
        assert_eq!(install.dirs, save.dirs);
    }

    #[test]
    fn clear_category_empties_state() {
        let mut state = CategoryState {
            files: vec!["a.cfg".to_string()],
            dirs: vec!["d/".to_string()],
            path: "P".to_string(),
        };
        clear_category(&mut state);
        assert!(state.files.is_empty() && state.dirs.is_empty());
        assert_eq!(state.path, "P"); // 路径保留（与 TS 一致）
    }

    // ── update_paths ────────────────────────
    #[test]
    fn paths_filled_and_video_uses_user_cfg() {
        let mut state = InstallState::default();
        update_paths(&mut state, Some("G:/cfg"), Some("U:/custom"), Some("G:/annotations"));
        assert_eq!(state.game_cfg.path, "G:/cfg");
        assert_eq!(state.user_cfg.path, "U:/custom");
        assert_eq!(state.video.path, "U:/custom"); // 历史行为
        assert_eq!(state.annotations.path, "G:/annotations");
    }

    #[test]
    fn null_paths_leave_unchanged() {
        let mut state = InstallState::default();
        state.game_cfg.path = "KEEP".to_string();
        update_paths(&mut state, None, None, None);
        assert_eq!(state.game_cfg.path, "KEEP");
    }

    // ── category accessors ──────────────────
    #[test]
    fn category_keys_map_to_state() {
        let mut state = InstallState::default();
        category_mut(&mut state, CategoryKey::Video).files.push("cs2_video.txt".to_string());
        assert_eq!(category(&state, CategoryKey::Video).files.len(), 1);
        assert!(CATEGORY_KEYS.contains(&CategoryKey::GameCfg));
    }
}
