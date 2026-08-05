//! 安装器壳层：三清单（install/res/save.json）读写 + 文件部署执行。
//!
//! 对应原 `app/desktop/src/main/services/installer.ts`：
//! - 清单读写（容错 JSON → core `normalize_state` 规范化）
//! - overlay：core `plan_overlay_category` 动作序（prev→save / 冲突→res / staging→游戏）
//! - append：core `decide_append_conflicts` 决策 + `merge_append` 并集
//! - 删除/恢复/清除：core `remove_item` / `restore_item` / `clear_category` / `install_from_backup`
//! - 用户偏好层保护（with_user_custom_preserved）

use std::fs;
use std::path::{Path, PathBuf};

use srp_cfg_core::{
    category, category_mut, clear_category, decide_append_conflicts, merge_append, normalize_state,
    plan_overlay_category, update_paths, CategoryInput, CategoryKey, DeployAction, EntryList,
    InstallState,
};

use crate::ctx;
use crate::log;
use crate::models::{AppendConflictPayload, AppendConflictResult, InstallResult, StorageKind};

pub use crate::services::user_config::GamePaths;

const USER_CUSTOM_RELATIVE: &str = "srp-cfg/user/custom.cfg";

fn base() -> PathBuf {
    ctx::base_dir()
}

fn json_path(name: &str) -> PathBuf {
    let file = match name {
        "install" => "install.json",
        "save" => "overlay.json",
        "res" => "conflicts.json",
        _ => return base().join(format!("{name}.json")),
    };
    base().join("state").join(file)
}

// ── 清单读写 ───────────────────────────────────────────────────

fn read_json(path: &Path) -> Option<serde_json::Value> {
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
}

fn write_json(path: &Path, data: &serde_json::Value) {
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let _ = fs::write(path, serde_json::to_string_pretty(data).unwrap_or_default());
}

fn load_state(name: &str) -> InstallState {
    let json = read_json(&json_path(name));
    // 防御性兼容：正常清单以清单名（install/save/res）为顶层 key；
    // 若历史数据异常地以字面 "name" 为 key，回退读取以避免恢复中心显示为空。
    let inner = json
        .as_ref()
        .and_then(|v| v.get(name))
        .or_else(|| json.as_ref().and_then(|v| v.get("name")))
        .cloned();
    normalize_state(inner.as_ref())
}

fn save_state(name: &str, state: &InstallState) {
    // 用动态 key 构造顶层包装（避免 json! 宏的裸标识符歧义），
    // 保证写出 key 为 install/save/res，与 load_state 的 v.get(name) 对应。
    let mut map = serde_json::Map::new();
    map.insert("schemaVersion".to_string(), serde_json::json!(3));
    map.insert(
        name.to_string(),
        serde_json::to_value(state).unwrap_or_default(),
    );
    write_json(&json_path(name), &serde_json::Value::Object(map));
}

pub fn load_install_data() -> InstallState {
    load_state("install")
}
fn load_res_data() -> InstallState {
    load_state("res")
}
fn load_save_data() -> InstallState {
    load_state("save")
}
fn write_install(data: &InstallState) {
    save_state("install", data);
}
fn write_res(data: &InstallState) {
    save_state("res", data);
}
fn write_save(data: &InstallState) {
    save_state("save", data);
}

// ── 路径回填（对应 TS `updateInstallPaths`）────────────────────

pub fn update_install_paths(game_paths: &GamePaths) {
    let mut data = load_install_data();
    update_paths(
        &mut data,
        game_paths.game_cfg_path.as_deref(),
        game_paths.user_cfg_path.as_deref(),
        game_paths.annotations_path.as_deref(),
    );
    write_install(&data);
}

// ── fs 工具 ────────────────────────────────────────────────────

fn remove_entry(base_dir: &Path, name: &str, is_dir: bool) {
    let full = base_dir.join(name);
    if !full.exists() {
        return;
    }
    if is_dir {
        let _ = fs::remove_dir_all(&full);
    } else {
        let _ = fs::remove_file(&full);
    }
}

/// 复制 staging 顶层 → 游戏目录（返回 (files, dirs) 计数）。
fn copy_staging_to_game(staging_dir: &Path, game_dir: &Path) -> (usize, usize) {
    if !staging_dir.exists() {
        return (0, 0);
    }
    let _ = fs::create_dir_all(game_dir);
    let mut files = 0usize;
    let mut dirs = 0usize;
    let Ok(entries) = fs::read_dir(staging_dir) else {
        return (0, 0);
    };
    let mut names: Vec<_> = entries.filter_map(|e| e.ok()).collect();
    names.sort_by_key(|e| e.file_name());
    for e in names {
        let src = staging_dir.join(e.file_name());
        let dst = game_dir.join(e.file_name());
        if e.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            let _ = crate::services::copy_dir_recursive(&src, &dst);
            dirs += 1;
        } else {
            let _ = fs::copy(&src, &dst);
            files += 1;
        }
    }
    (files, dirs)
}

/// moveToTarget：游戏目录中的项 → <targetBase>/<category>/<name>。
fn move_to_target(
    target_base: &Path,
    category: CategoryKey,
    game_file_path: &Path,
    name: &str,
    is_dir: bool,
    label: &str,
) {
    let dst = target_base.join(category.as_str()).join(name);
    if is_dir {
        let _ = fs::create_dir_all(&dst);
        let _ = crate::services::copy_dir_recursive(game_file_path, &dst);
        let _ = fs::remove_dir_all(game_file_path);
    } else {
        if let Some(parent) = dst.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let _ = fs::copy(game_file_path, &dst);
        let _ = fs::remove_file(game_file_path);
    }
    log::info(
        "install",
        &format!("{label}已转移：{name}，可在「恢复中心」中恢复"),
    );
}

// ── 用户偏好层保护 ─────────────────────────────────────────────

fn is_cfg_category(category: CategoryKey) -> bool {
    matches!(category, CategoryKey::GameCfg | CategoryKey::UserCfg)
}

fn capture_user_custom(game_dir: &Path, category: CategoryKey) -> Option<Vec<u8>> {
    if !is_cfg_category(category) {
        return None;
    }
    let custom_path = game_dir.join(USER_CUSTOM_RELATIVE);
    if custom_path.is_file() {
        fs::read(&custom_path).ok()
    } else {
        None
    }
}

fn restore_user_custom(game_dir: &Path, category: CategoryKey, content: Option<Vec<u8>>) {
    let Some(content) = content else {
        return;
    };
    if !is_cfg_category(category) {
        return;
    }
    let custom_path = game_dir.join(USER_CUSTOM_RELATIVE);
    if let Some(parent) = custom_path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let _ = fs::write(&custom_path, content);
    log::success("file-ops", "已保留用户偏好文件");
}

fn with_user_custom_preserved<T>(
    game_dir: &Path,
    category: CategoryKey,
    action: impl FnOnce() -> T,
) -> T {
    let content = capture_user_custom(game_dir, category);
    let result = action();
    restore_user_custom(game_dir, category, content);
    result
}

// ── 分类装配（对应 TS `getCategories`）─────────────────────────

#[derive(Debug, Clone)]
pub struct StagingPaths {
    pub cfg: PathBuf,
    pub annotations: PathBuf,
    pub video: PathBuf,
}

struct CatEntry {
    key: CategoryKey,
    staging: PathBuf,
    game: Option<PathBuf>,
    label: &'static str,
}

fn get_categories(staging_paths: &StagingPaths, game_paths: &GamePaths) -> Vec<CatEntry> {
    vec![
        CatEntry {
            key: CategoryKey::GameCfg,
            staging: staging_paths.cfg.clone(),
            game: game_paths.game_cfg_path.as_ref().map(PathBuf::from),
            label: "游戏 CFG",
        },
        CatEntry {
            key: CategoryKey::UserCfg,
            staging: staging_paths.cfg.clone(),
            game: game_paths.user_cfg_path.as_ref().map(PathBuf::from),
            label: "账号 CFG（实验性）",
        },
        CatEntry {
            key: CategoryKey::Annotations,
            staging: staging_paths.annotations.clone(),
            game: game_paths.annotations_path.as_ref().map(PathBuf::from),
            label: "地图指南",
        },
        CatEntry {
            key: CategoryKey::Video,
            staging: staging_paths.video.clone(),
            game: game_paths.user_cfg_path.as_ref().map(PathBuf::from),
            label: "视频预设",
        },
    ]
}

fn has_entries(cat: &CatEntry) -> bool {
    let Some(_game) = &cat.game else {
        return false;
    };
    if !cat.staging.exists() {
        return false;
    }
    if cat.key == CategoryKey::Video {
        if let Ok(rd) = fs::read_dir(&cat.staging) {
            if rd.count() == 0 {
                return false;
            }
        } else {
            return false;
        }
    }
    let (files, dirs) = crate::services::walk_top_level(&cat.staging);
    !files.is_empty() || !dirs.is_empty()
}

fn game_dir_for(cat_key: CategoryKey, game_paths: &GamePaths) -> Option<PathBuf> {
    match cat_key {
        CategoryKey::GameCfg => game_paths.game_cfg_path.as_ref().map(PathBuf::from),
        CategoryKey::UserCfg | CategoryKey::Video => {
            game_paths.user_cfg_path.as_ref().map(PathBuf::from)
        }
        CategoryKey::Annotations => game_paths.annotations_path.as_ref().map(PathBuf::from),
    }
}

// ── Overlay Install（对应 TS `deployOverlay`）──────────────────

pub fn deploy_overlay(
    staging_paths: &StagingPaths,
    game_paths: &GamePaths,
    use_personal_cfg: bool,
) -> InstallResult {
    log::progress("install", "覆盖部署到游戏目录...");

    let mut install_data = load_install_data();
    let mut save_data = load_save_data();
    let mut res_data = load_res_data();
    let save_base = ctx::base_dir().join("archive").join("overlay");
    let res_base = ctx::base_dir().join("archive").join("conflicts");

    let mut total_files = 0usize;
    let mut total_dirs = 0usize;

    for cat in get_categories(staging_paths, game_paths) {
        if cat.key == CategoryKey::GameCfg && use_personal_cfg {
            continue;
        }
        if cat.key == CategoryKey::UserCfg && !use_personal_cfg {
            continue;
        }
        if !has_entries(&cat) {
            continue;
        }
        let game_dir = cat.game.expect("has_entries ensures game");
        let (staging_files, staging_dirs) = crate::services::walk_top_level(&cat.staging);
        let staging_entries = EntryList {
            files: staging_files.clone(),
            dirs: staging_dirs.clone(),
        };
        let (game_files, game_dirs) = crate::services::walk_top_level(&game_dir);
        let game_entries = EntryList {
            files: game_files,
            dirs: game_dirs,
        };
        let _ = fs::create_dir_all(&game_dir);

        let prev = category(&install_data, cat.key).clone();
        let fresh_install = prev.files.is_empty() && prev.dirs.is_empty();
        let plan = plan_overlay_category(&prev, &staging_entries, &game_entries, fresh_install);

        let (files_n, dirs_n) = with_user_custom_preserved(&game_dir, cat.key, || {
            // 1. prev → save（清单登记 + 落盘移动）
            {
                let save_cat = category_mut(&mut save_data, cat.key);
                save_cat.files = prev.files.clone();
                save_cat.dirs = prev.dirs.clone();
            }
            for action in &plan.actions {
                match action {
                    DeployAction::MoveToSave { name, is_dir } => {
                        move_to_target(
                            &save_base,
                            cat.key,
                            &game_dir.join(name),
                            name,
                            *is_dir,
                            "已安装备份",
                        );
                    }
                    DeployAction::MoveToRes { name, is_dir } => {
                        move_to_target(
                            &res_base,
                            cat.key,
                            &game_dir.join(name),
                            name,
                            *is_dir,
                            "冲突文件",
                        );
                        let res_cat = category_mut(&mut res_data, cat.key);
                        if *is_dir {
                            if !res_cat.dirs.contains(name) {
                                res_cat.dirs.push(name.clone());
                            }
                        } else if !res_cat.files.contains(name) {
                            res_cat.files.push(name.clone());
                        }
                    }
                    DeployAction::CopyStaging { .. } => {}
                }
            }
            // 2. staging → game
            copy_staging_to_game(&cat.staging, &game_dir)
        });
        total_files += files_n;
        total_dirs += dirs_n;

        {
            let cat_data = category_mut(&mut install_data, cat.key);
            cat_data.files = staging_entries.files.clone();
            cat_data.dirs = staging_entries.dirs.clone();
        }
        log::success(
            "install",
            &format!("{}：{files_n} 个文件，{dirs_n} 个目录已部署", cat.label),
        );
    }

    // 路径回填（TS 行为：video 沿用 userCfgPath）
    let mut s = save_data.clone();
    let mut r = res_data.clone();
    update_paths(
        &mut s,
        game_paths.game_cfg_path.as_deref(),
        game_paths.user_cfg_path.as_deref(),
        game_paths.annotations_path.as_deref(),
    );
    update_paths(
        &mut r,
        game_paths.game_cfg_path.as_deref(),
        game_paths.user_cfg_path.as_deref(),
        game_paths.annotations_path.as_deref(),
    );
    save_data = s;
    res_data = r;

    write_save(&save_data);
    write_res(&res_data);
    write_install(&install_data);

    log::success(
        "install",
        &format!("部署完成：{total_files} 个文件，{total_dirs} 个目录"),
    );
    InstallResult {
        files_installed: total_files,
        dirs_installed: total_dirs,
    }
}

// ── Append 冲突检测（对应 TS `checkAppendConflicts`）────────────

pub fn check_append_conflicts(
    staging_paths: &StagingPaths,
    game_paths: &GamePaths,
    use_personal_cfg: bool,
) -> AppendConflictResult {
    let mut inputs: Vec<CategoryInput> = Vec::new();
    for cat in get_categories(staging_paths, game_paths) {
        if cat.key == CategoryKey::GameCfg && use_personal_cfg {
            continue;
        }
        if cat.key == CategoryKey::UserCfg && !use_personal_cfg {
            continue;
        }
        if !has_entries(&cat) {
            continue;
        }
        let (mut staging_names, _) = crate::services::walk_top_level(&cat.staging);
        staging_names.sort();
        let target_names: Vec<String> = match &cat.game {
            Some(game) => {
                let (f, d) = crate::services::walk_top_level(game);
                f.into_iter().chain(d).collect()
            }
            None => Vec::new(),
        };
        inputs.push(CategoryInput {
            key: cat.key,
            staging_names,
            target_names,
        });
    }

    match decide_append_conflicts(&inputs, use_personal_cfg) {
        srp_cfg_core::AppendConflictDecision::Reject => AppendConflictResult {
            needs_confirm: false,
            conflicts: conflicts_payload(&inputs, use_personal_cfg),
        },
        srp_cfg_core::AppendConflictDecision::Confirm(conflicts) => AppendConflictResult {
            needs_confirm: true,
            conflicts: conflicts
                .iter()
                .map(|c| AppendConflictPayload {
                    category: c.category.as_str().to_string(),
                    names: c.names.clone(),
                })
                .collect(),
        },
        srp_cfg_core::AppendConflictDecision::Proceed => AppendConflictResult {
            needs_confirm: false,
            conflicts: Vec::new(),
        },
    }
}

fn conflicts_payload(
    inputs: &[CategoryInput],
    use_personal_cfg: bool,
) -> Vec<AppendConflictPayload> {
    let mut out = Vec::new();
    for cat in inputs {
        if cat.key == CategoryKey::GameCfg && use_personal_cfg {
            continue;
        }
        if cat.key == CategoryKey::UserCfg && !use_personal_cfg {
            continue;
        }
        let names: Vec<String> = cat
            .staging_names
            .iter()
            .filter(|n| cat.target_names.contains(n))
            .cloned()
            .collect();
        if !names.is_empty() {
            out.push(AppendConflictPayload {
                category: cat.key.as_str().to_string(),
                names,
            });
        }
    }
    out
}

// ── Append 部署（对应 TS `deployAppend`）───────────────────────

pub fn deploy_append(
    staging_paths: &StagingPaths,
    game_paths: &GamePaths,
    overwrite_conflicts: bool,
    use_personal_cfg: bool,
) -> InstallResult {
    log::progress("install", "追加部署到游戏目录...");

    let mut install_data = load_install_data();
    let mut total_files = 0usize;
    let mut total_dirs = 0usize;

    for cat in get_categories(staging_paths, game_paths) {
        if cat.key == CategoryKey::GameCfg && use_personal_cfg {
            continue;
        }
        if cat.key == CategoryKey::UserCfg && !use_personal_cfg {
            continue;
        }
        if !has_entries(&cat) {
            continue;
        }
        let game_dir = cat.game.expect("has_entries ensures game");
        let (staging_files, staging_dirs) = crate::services::walk_top_level(&cat.staging);
        let staging_entries = EntryList {
            files: staging_files.clone(),
            dirs: staging_dirs.clone(),
        };
        let _ = fs::create_dir_all(&game_dir);

        let (files_n, dirs_n) = with_user_custom_preserved(&game_dir, cat.key, || {
            if overwrite_conflicts {
                for name in staging_entries.names() {
                    let game_path = game_dir.join(name);
                    if game_path.exists() {
                        let is_dir = game_path.is_dir();
                        remove_entry(&game_dir, name, is_dir);
                        log::info("install", &format!("已覆盖：{name}"));
                    }
                }
            }
            copy_staging_to_game(&cat.staging, &game_dir)
        });
        total_files += files_n;
        total_dirs += dirs_n;

        let existing = category(&install_data, cat.key).clone();
        let merged = merge_append(&existing, &staging_entries);
        {
            let cat_data = category_mut(&mut install_data, cat.key);
            cat_data.files = merged.files;
            cat_data.dirs = merged.dirs;
        }
        log::success(
            "install",
            &format!("{}：{files_n} 个文件，{dirs_n} 个目录已部署", cat.label),
        );
    }

    write_install(&install_data);
    log::success(
        "install",
        &format!("追加部署完成：{total_files} 个文件，{total_dirs} 个目录"),
    );
    InstallResult {
        files_installed: total_files,
        dirs_installed: total_dirs,
    }
}

// ── 删除 / 恢复 / 清除 ─────────────────────────────────────────

pub fn delete_installed_item(cat_key: CategoryKey, name: &str, game_paths: &GamePaths) -> bool {
    let mut install_data = load_install_data();
    let is_file = category(&install_data, cat_key)
        .files
        .contains(&name.to_string());
    let is_dir = category(&install_data, cat_key)
        .dirs
        .contains(&name.to_string());
    if !is_file && !is_dir {
        log::error("file-ops", &format!("未找到已安装项：{name}"));
        return false;
    }
    if let Some(game_dir) = game_dir_for(cat_key, game_paths) {
        with_user_custom_preserved(&game_dir, cat_key, || {
            remove_entry(&game_dir, name, is_dir);
        });
    }
    {
        let cat = category_mut(&mut install_data, cat_key);
        if is_file {
            cat.files.retain(|f| f != name);
        } else {
            cat.dirs.retain(|d| d != name);
        }
    }
    write_install(&install_data);
    log::success("file-ops", &format!("已删除：{name}"));
    true
}

pub fn clear_install_category(cat_key: CategoryKey, game_paths: &GamePaths) -> usize {
    let mut install_data = load_install_data();
    let (files, dirs) = {
        let cat = category(&install_data, cat_key);
        (cat.files.clone(), cat.dirs.clone())
    };
    if files.is_empty() && dirs.is_empty() {
        return 0;
    }
    let Some(game_dir) = game_dir_for(cat_key, game_paths) else {
        log::error("file-ops", "未检测到游戏目录，无法卸载");
        return 0;
    };
    let removed = with_user_custom_preserved(&game_dir, cat_key, || {
        let mut n = 0usize;
        for name in files.iter().chain(dirs.iter()) {
            let is_dir = dirs.contains(name);
            remove_entry(&game_dir, name, is_dir);
            n += 1;
        }
        n
    });
    clear_category(category_mut(&mut install_data, cat_key));
    write_install(&install_data);
    log::success(
        "file-ops",
        &format!("已卸载 {cat_key:?} 配置，共 {removed} 项"),
    );
    removed
}

pub fn restore_from_res(cat_key: CategoryKey, name: &str, game_paths: &GamePaths) -> bool {
    let res_dir = ctx::base_dir().join("archive").join("conflicts");
    let src_path = res_dir.join(cat_key.as_str()).join(name);
    if !src_path.exists() {
        log::error("file-ops", &format!("恢复源不存在：{name}"));
        return false;
    }
    let Some(game_dir) = game_dir_for(cat_key, game_paths) else {
        log::error(
            "file-ops",
            &format!("未检测到游戏目录，无法恢复：{cat_key:?}"),
        );
        return false;
    };
    let dst_path = game_dir.join(name);
    let is_dir = src_path.is_dir();

    let ok = with_user_custom_preserved(&game_dir, cat_key, || -> bool {
        if dst_path.exists() {
            if dst_path.is_dir() {
                let _ = fs::remove_dir_all(&dst_path);
            } else {
                let _ = fs::remove_file(&dst_path);
            }
        }
        let r = if is_dir {
            crate::services::copy_dir_recursive(&src_path, &dst_path).is_ok()
        } else {
            if let Some(parent) = dst_path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            fs::copy(&src_path, &dst_path).is_ok()
        };
        if r {
            let _ = if is_dir {
                fs::remove_dir_all(&src_path)
            } else {
                fs::remove_file(&src_path)
            };
        }
        r
    });
    if !ok {
        log::error("file-ops", &format!("恢复失败：{name}"));
        return false;
    }

    let mut res_data = load_res_data();
    {
        let cat = category_mut(&mut res_data, cat_key);
        cat.files.retain(|f| f != name);
        cat.dirs.retain(|d| d != name);
    }
    write_res(&res_data);

    let mut install_data = load_install_data();
    {
        let cat = category_mut(&mut install_data, cat_key);
        cat.files.retain(|f| f != name);
        cat.dirs.retain(|d| d != name);
    }
    write_install(&install_data);

    log::success("file-ops", &format!("已恢复冲突项：{name}"));
    true
}

pub fn delete_res_item(cat_key: CategoryKey, name: &str) -> bool {
    let mut res_data = load_res_data();
    let (is_file, is_dir) = {
        let cat = category(&res_data, cat_key);
        (
            cat.files.contains(&name.to_string()),
            cat.dirs.contains(&name.to_string()),
        )
    };
    if !is_file && !is_dir {
        log::error("file-ops", &format!("未找到冲突恢复项：{name}"));
        return false;
    }
    remove_entry(
        &ctx::base_dir()
            .join("archive")
            .join("conflicts")
            .join(cat_key.as_str()),
        name,
        is_dir,
    );
    {
        let cat = category_mut(&mut res_data, cat_key);
        if is_file {
            cat.files.retain(|f| f != name);
        } else {
            cat.dirs.retain(|d| d != name);
        }
    }
    write_res(&res_data);
    log::success("file-ops", &format!("已删除冲突恢复项：{name}"));
    true
}

pub fn clear_res_category(cat_key: CategoryKey) {
    let cat_dir = ctx::base_dir()
        .join("archive")
        .join("conflicts")
        .join(cat_key.as_str());
    if cat_dir.exists() {
        let _ = fs::remove_dir_all(&cat_dir);
        let _ = fs::create_dir_all(&cat_dir);
    }
    let mut res_data = load_res_data();
    clear_category(category_mut(&mut res_data, cat_key));
    write_res(&res_data);
    log::success("file-ops", &format!("已清除 {cat_key:?} 冲突恢复文件"));
}

pub fn restore_res_category(cat_key: CategoryKey, game_paths: &GamePaths) -> usize {
    let mut res_data = load_res_data();
    let (files, dirs) = {
        let cat = category(&res_data, cat_key);
        (cat.files.clone(), cat.dirs.clone())
    };
    if files.is_empty() && dirs.is_empty() {
        return 0;
    }
    let Some(game_dir) = game_dir_for(cat_key, game_paths) else {
        log::error(
            "file-ops",
            &format!("未检测到游戏目录，无法恢复：{cat_key:?}"),
        );
        return 0;
    };
    let res_dir = ctx::base_dir()
        .join("archive")
        .join("conflicts")
        .join(cat_key.as_str());
    let mut restored = 0usize;

    with_user_custom_preserved(&game_dir, cat_key, || {
        for name in dirs.iter().chain(files.iter()) {
            let src = res_dir.join(name);
            if !src.exists() {
                continue;
            }
            let dst = game_dir.join(name);
            if dst.exists() {
                if dst.is_dir() {
                    let _ = fs::remove_dir_all(&dst);
                } else {
                    let _ = fs::remove_file(&dst);
                }
            }
            let ok = if src.is_dir() {
                crate::services::copy_dir_recursive(&src, &dst).is_ok()
            } else {
                if let Some(parent) = dst.parent() {
                    let _ = fs::create_dir_all(parent);
                }
                fs::copy(&src, &dst).is_ok()
            };
            if ok {
                restored += 1;
            }
        }
    });

    let _ = fs::remove_dir_all(&res_dir);
    let _ = fs::create_dir_all(&res_dir);
    clear_category(category_mut(&mut res_data, cat_key));
    write_res(&res_data);
    log::success(
        "file-ops",
        &format!("已恢复 {cat_key:?} 冲突文件，共 {restored} 项"),
    );
    restored
}

pub fn restore_from_save(game_paths: &GamePaths) -> bool {
    let save_data = load_save_data();
    let save_dir = ctx::base_dir().join("archive").join("overlay");
    if !save_dir.exists() {
        log::error("backup", "备份目录不存在");
        return false;
    }
    log::progress("backup", "正在从备份恢复...");

    let categories: Vec<(CategoryKey, Option<PathBuf>)> = vec![
        (
            CategoryKey::GameCfg,
            game_paths.game_cfg_path.as_ref().map(PathBuf::from),
        ),
        (
            CategoryKey::UserCfg,
            game_paths.user_cfg_path.as_ref().map(PathBuf::from),
        ),
        (
            CategoryKey::Annotations,
            game_paths.annotations_path.as_ref().map(PathBuf::from),
        ),
        (
            CategoryKey::Video,
            game_paths.user_cfg_path.as_ref().map(PathBuf::from),
        ),
    ];

    let mut restored = 0usize;
    for (key, game) in &categories {
        let Some(game_dir) = game else {
            continue;
        };
        let cat_save_dir = save_dir.join(key.as_str());
        if !cat_save_dir.exists() {
            continue;
        }
        with_user_custom_preserved(&game_dir, *key, || {
            if let Ok(entries) = fs::read_dir(&cat_save_dir) {
                for entry in entries.flatten() {
                    let src = cat_save_dir.join(entry.file_name());
                    let dst = game_dir.join(entry.file_name());
                    if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                        if crate::services::copy_dir_recursive(&src, &dst).is_ok() {
                            restored += 1;
                        }
                    } else {
                        if let Some(parent) = dst.parent() {
                            let _ = fs::create_dir_all(parent);
                        }
                        if fs::copy(&src, &dst).is_ok() {
                            restored += 1;
                        }
                    }
                }
            }
        });
    }

    // install = save 清单（保留当前 paths）
    let mut install_data = load_install_data();
    for (key, _) in &categories {
        let cat = category_mut(&mut install_data, *key);
        cat.files = category(&save_data, *key).files.clone();
        cat.dirs = category(&save_data, *key).dirs.clone();
    }
    write_install(&install_data);

    log::success("backup", &format!("备份恢复完成，共 {restored} 项"));
    true
}

pub fn delete_save_item(cat_key: CategoryKey, name: &str) -> bool {
    let mut save_data = load_save_data();
    let (is_file, is_dir) = {
        let cat = category(&save_data, cat_key);
        (
            cat.files.contains(&name.to_string()),
            cat.dirs.contains(&name.to_string()),
        )
    };
    if !is_file && !is_dir {
        log::error("file-ops", &format!("未找到配置备份项：{name}"));
        return false;
    }
    remove_entry(
        &ctx::base_dir()
            .join("archive")
            .join("overlay")
            .join(cat_key.as_str()),
        name,
        is_dir,
    );
    {
        let cat = category_mut(&mut save_data, cat_key);
        if is_file {
            cat.files.retain(|f| f != name);
        } else {
            cat.dirs.retain(|d| d != name);
        }
    }
    write_save(&save_data);
    log::success("file-ops", &format!("已删除配置备份项：{name}"));
    true
}

pub fn clear_save_category(cat_key: CategoryKey) {
    let cat_dir = ctx::base_dir()
        .join("archive")
        .join("overlay")
        .join(cat_key.as_str());
    if cat_dir.exists() {
        let _ = fs::remove_dir_all(&cat_dir);
        let _ = fs::create_dir_all(&cat_dir);
    }
    let mut save_data = load_save_data();
    clear_category(category_mut(&mut save_data, cat_key));
    write_save(&save_data);
    log::success("file-ops", &format!("已清除 {cat_key:?} 配置备份"));
}

pub fn restore_save_category(cat_key: CategoryKey, game_paths: &GamePaths) -> usize {
    let mut save_data = load_save_data();
    let (files, dirs) = {
        let cat = category(&save_data, cat_key);
        (cat.files.clone(), cat.dirs.clone())
    };
    if files.is_empty() && dirs.is_empty() {
        return 0;
    }
    let Some(game_dir) = game_dir_for(cat_key, game_paths) else {
        log::error(
            "file-ops",
            &format!("未检测到游戏目录，无法恢复：{cat_key:?}"),
        );
        return 0;
    };
    let save_dir = ctx::base_dir()
        .join("archive")
        .join("overlay")
        .join(cat_key.as_str());
    let mut restored = 0usize;

    with_user_custom_preserved(&game_dir, cat_key, || {
        for name in dirs.iter().chain(files.iter()) {
            let src = save_dir.join(name);
            if !src.exists() {
                continue;
            }
            let dst = game_dir.join(name);
            let ok = if src.is_dir() {
                crate::services::copy_dir_recursive(&src, &dst).is_ok()
            } else {
                if let Some(parent) = dst.parent() {
                    let _ = fs::create_dir_all(parent);
                }
                fs::copy(&src, &dst).is_ok()
            };
            if ok {
                restored += 1;
            }
        }
    });

    let mut install_data = load_install_data();
    {
        let cat = category_mut(&mut install_data, cat_key);
        cat.files = files.clone();
        cat.dirs = dirs.clone();
    }
    write_install(&install_data);

    let _ = fs::remove_dir_all(&save_dir);
    let _ = fs::create_dir_all(&save_dir);
    clear_category(category_mut(&mut save_data, cat_key));
    write_save(&save_data);

    log::success(
        "backup",
        &format!("已恢复 {cat_key:?} 配置备份，共 {restored} 项"),
    );
    restored
}

pub fn restore_save_item(cat_key: CategoryKey, name: &str, game_paths: &GamePaths) -> bool {
    let mut save_data = load_save_data();
    let (is_file, is_dir) = {
        let cat = category(&save_data, cat_key);
        (
            cat.files.contains(&name.to_string()),
            cat.dirs.contains(&name.to_string()),
        )
    };
    if !is_file && !is_dir {
        log::error("file-ops", &format!("未找到配置备份项：{name}"));
        return false;
    }
    let Some(game_dir) = game_dir_for(cat_key, game_paths) else {
        log::error(
            "file-ops",
            &format!("未检测到游戏目录，无法恢复：{cat_key:?}"),
        );
        return false;
    };
    let src = ctx::base_dir()
        .join("archive")
        .join("overlay")
        .join(cat_key.as_str())
        .join(name);
    if !src.exists() {
        log::error("file-ops", &format!("恢复源不存在：{name}"));
        return false;
    }
    let dst = game_dir.join(name);

    let ok = with_user_custom_preserved(&game_dir, cat_key, || -> bool {
        if dst.exists() {
            if dst.is_dir() {
                let _ = fs::remove_dir_all(&dst);
            } else {
                let _ = fs::remove_file(&dst);
            }
        }
        let r = if is_dir {
            crate::services::copy_dir_recursive(&src, &dst).is_ok()
        } else {
            if let Some(parent) = dst.parent() {
                let _ = fs::create_dir_all(parent);
            }
            fs::copy(&src, &dst).is_ok()
        };
        if r {
            let _ = fs::remove_dir_all(&src);
        }
        r
    });
    if !ok {
        log::error("file-ops", &format!("恢复失败：{name}"));
        return false;
    }

    {
        let cat = category_mut(&mut save_data, cat_key);
        if is_file {
            cat.files.retain(|f| f != name);
        } else {
            cat.dirs.retain(|d| d != name);
        }
    }
    write_save(&save_data);

    let mut install_data = load_install_data();
    {
        let cat = category_mut(&mut install_data, cat_key);
        if is_file && !cat.files.contains(&name.to_string()) {
            cat.files.push(name.to_string());
        }
        if is_dir && !cat.dirs.contains(&name.to_string()) {
            cat.dirs.push(name.to_string());
        }
    }
    write_install(&install_data);

    log::success("file-ops", &format!("已恢复配置备份项：{name}"));
    true
}

// ── 打开项 / 获取数据 ──────────────────────────────────────────

pub fn open_item(
    storage: StorageKind,
    category: CategoryKey,
    name: &str,
    game_paths: &GamePaths,
) -> bool {
    let file_path: PathBuf = match storage {
        StorageKind::Install => {
            let Some(game_dir) = game_dir_for(category, game_paths) else {
                log::error("file-ops", "未检测到游戏目录");
                return false;
            };
            game_dir.join(name)
        }
        StorageKind::Save => ctx::base_dir()
            .join("archive")
            .join("overlay")
            .join(category.as_str())
            .join(name),
        StorageKind::Res => ctx::base_dir()
            .join("archive")
            .join("conflicts")
            .join(category.as_str())
            .join(name),
    };
    if !file_path.exists() {
        log::error("file-ops", &format!("文件不存在：{name}"));
        return false;
    }
    match tauri_plugin_opener::open_path(file_path.to_string_lossy().to_string(), None::<&str>) {
        Ok(_) => true,
        Err(e) => {
            log::error("file-ops", &format!("打开失败：{e}"));
            false
        }
    }
}

pub fn get_installed_data() -> InstallState {
    load_install_data()
}
pub fn get_res_data() -> InstallState {
    load_res_data()
}
pub fn get_save_data() -> InstallState {
    load_save_data()
}
