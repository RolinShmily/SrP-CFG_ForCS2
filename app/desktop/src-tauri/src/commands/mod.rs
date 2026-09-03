//! Tauri IPC commands（对应原 `src/main/ipc.ts` 40+ handler）。
//! 命令名与参数签名对齐 `tasks/layer-2-desktop-tauri/api-contract.md` 与
//! `src/renderer/lib/api.ts`（renderer 零改动前提）。

pub mod window;

use std::sync::Mutex;

use srp_cfg_core::{CategoryKey, SnapshotToCfgOptions, UpdateCheckResult};
use tauri::State;

use crate::log;
use crate::models::*;
use crate::services;
use crate::state::{AppState, PendingAppend};

pub type AppStateMutex = Mutex<AppState>;

pub type PendingAppendState = Mutex<Option<PendingAppend>>;

fn game_paths(state: &State<AppStateMutex>) -> services::user_config::GamePaths {
    state.inner().lock().unwrap().game_paths()
}

fn staging_paths() -> services::installer::StagingPaths {
    services::installer::StagingPaths {
        cfg: services::staging::get_staging_path("cfg"),
        annotations: services::staging::get_staging_path("annotations"),
        video: services::staging::get_staging_path("video"),
    }
}

fn parse_category(s: &str) -> Result<CategoryKey, String> {
    serde_json::from_value(serde_json::Value::String(s.to_string()))
        .map_err(|_| format!("未知分类：{s}"))
}

// ── Detection ──────────────────────────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn detect_all(state: State<AppStateMutex>) -> DetectionResult {
    let result = services::detection::detect_all();
    {
        let mut st = state.inner().lock().unwrap();
        st.apply_detection(&result);
    }
    result
}

#[tauri::command(rename_all = "camelCase")]
pub fn set_current_user(state: State<AppStateMutex>, account_id: String) -> UserConfigSelection {
    let mut st = state.inner().lock().unwrap();
    st.current_user = st
        .steam_users
        .iter()
        .find(|u| u.account_id == account_id)
        .cloned();
    st.user_cfg_path = if let Some(steam_path) = &st.steam_path {
        services::detection::detect_user_cfg_path(steam_path, &account_id)
    } else {
        None
    };
    st.vcfg_state = services::vcfg::inspect_vcfg_state(st.user_cfg_path.as_deref());
    let selection = UserConfigSelection {
        user_cfg_path: st.user_cfg_path.clone(),
        vcfg_state: st.vcfg_state.clone(),
    };
    services::installer::update_install_paths(&st.game_paths());
    selection
}

// ── User Config ────────────────────────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn user_config_get(state: State<AppStateMutex>) -> UserConfigDocument {
    services::user_config::read_user_config(&game_paths(&state))
}

#[tauri::command(rename_all = "camelCase")]
pub fn user_config_save(state: State<AppStateMutex>, content: String) -> Result<UserConfigDocument, String> {
    services::user_config::save_user_config(&game_paths(&state), &content)
}

#[tauri::command(rename_all = "camelCase")]
pub fn user_config_open_folder(state: State<AppStateMutex>) -> Result<(), String> {
    let folder = services::user_config::get_user_config_folder(&game_paths(&state))
        .ok_or_else(|| "尚未检测到可用的 CS2 CFG 目录".to_string())?;
    tauri_plugin_opener::open_path(folder, None::<&str>).map_err(|e| e.to_string())
}

// ── VCFG ───────────────────────────────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn vcfg_capture_snapshot(state: State<AppStateMutex>) -> Option<VcfgSnapshot> {
    let user_cfg_path = state.inner().lock().unwrap().user_cfg_path.clone()?;
    Some(services::vcfg::capture_vcfg_snapshot(&user_cfg_path))
}

#[tauri::command(rename_all = "camelCase")]
pub fn vcfg_generate_cfg(
    state: State<AppStateMutex>,
    options: SnapshotToCfgOptionsArg,
) -> Option<String> {
    let st = state.inner().lock().unwrap();
    let user_cfg_path = st.user_cfg_path.clone()?;
    let snapshot = services::vcfg::capture_vcfg_snapshot(&user_cfg_path);
    let baseline_path = st
        .cs2_cfg_path
        .as_ref()
        .map(|p| std::path::Path::new(p).join("srp-cfg").join("presets").join("valve").join("settings.cfg"));
    let baseline = baseline_path
        .as_ref()
        .map(|p| services::vcfg::parse_cfg_convars_file(p))
        .unwrap_or_default();
    Some(services::vcfg::snapshot_to_cfg_text(
        &snapshot,
        &SnapshotToCfgOptions {
            bindings: options.bindings,
            analog_bindings: options.analog_bindings,
            user_convars: options.user_convars,
            machine_convars: options.machine_convars,
        },
        &baseline,
    ))
}

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotToCfgOptionsArg {
    pub bindings: bool,
    pub analog_bindings: bool,
    pub user_convars: bool,
    pub machine_convars: bool,
}

// ── Upload / Staging ───────────────────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn upload_files(file_paths: Vec<String>) -> UploadEntry {
    services::staging::upload_files(&file_paths)
}

#[tauri::command(rename_all = "camelCase")]
pub fn get_upload_history() -> Vec<UploadEntry> {
    services::staging::get_upload_history()
}

#[tauri::command(rename_all = "camelCase")]
pub fn get_uploaded_entries() -> Vec<UploadedEntry> {
    services::staging::get_uploaded_entries()
}

#[tauri::command(rename_all = "camelCase")]
pub fn install_from_upload(
    state: State<AppStateMutex>,
    pending: State<PendingAppendState>,
    folder_name: String,
    mode: InstallMode,
    use_personal_cfg: Option<bool>,
) -> InstallOutcome {
    let game_paths = game_paths(&state);
    let staging = staging_paths();
    let use_personal_cfg = use_personal_cfg.unwrap_or(false);

    let result = match services::staging::install_from_upload(&folder_name, mode) {
        Some(r) => r,
        None => {
            log::error("install", "暂存处理失败，未产生可安装文件");
            return InstallOutcome::Install(InstallResult {
                files_installed: 0,
                dirs_installed: 0,
            });
        }
    };
    if result.cfg == 0 && result.annotations == 0 && result.video == 0 {
        log::warning("install", "未找到任何可安装的配置文件");
        return InstallOutcome::Install(InstallResult {
            files_installed: 0,
            dirs_installed: 0,
        });
    }
    log_persistence_impact(&state);

    match mode {
        InstallMode::Overlay => {
            let summary = services::installer::deploy_overlay(&staging, &game_paths, use_personal_cfg);
            log::success("install", "上传包安装完成！");
            InstallOutcome::Install(summary)
        }
        InstallMode::Append => {
            let conflict_result =
                services::installer::check_append_conflicts(&staging, &game_paths, use_personal_cfg);
            let conflict_count: usize = conflict_result
                .conflicts
                .iter()
                .map(|c| c.names.len())
                .sum();
            if conflict_count > 3 {
                log::error(
                    "install",
                    &format!("冲突文件过多（{conflict_count} 个），追加安装已拒绝"),
                );
                return InstallOutcome::Conflicts(conflict_result);
            }
            if conflict_result.needs_confirm {
                *pending.inner().lock().unwrap() = Some(PendingAppend {
                    folder_name: folder_name.clone(),
                    source: AppendSource::Upload,
                    mode,
                });
                return InstallOutcome::Conflicts(conflict_result);
            }
            let summary = services::installer::deploy_append(
                &staging,
                &game_paths,
                false,
                use_personal_cfg,
            );
            log::success("install", "上传包追加安装完成！");
            InstallOutcome::Install(summary)
        }
    }
}

#[tauri::command(rename_all = "camelCase")]
pub fn delete_upload_entry(folder_name: String) {
    services::staging::delete_upload_entry(&folder_name);
}

#[tauri::command(rename_all = "camelCase")]
pub fn open_uploads_folder() -> Result<(), String> {
    tauri_plugin_opener::open_path(
        services::staging::get_upload_path().to_string_lossy().to_string(),
        None::<&str>,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "camelCase")]
pub fn get_staging_status() -> services::staging::StagingStatus {
    services::staging::get_staging_status()
}

// ── Append Confirmation ────────────────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn confirm_append(
    state: State<AppStateMutex>,
    pending: State<PendingAppendState>,
    folder_name: String,
    source: AppendSource,
    proceed: bool,
    use_personal_cfg: Option<bool>,
) -> Option<InstallResult> {
    if !proceed || pending.inner().lock().unwrap().is_none() {
        *pending.inner().lock().unwrap() = None;
        log::info("install", "追加安装已取消");
        return None;
    }
    let game_paths = game_paths(&state);
    let staging = staging_paths();
    let mode = pending
        .inner()
        .lock()
        .unwrap()
        .as_ref()
        .map(|p| p.mode)
        .unwrap_or(InstallMode::Append);

    let staged = match source {
        AppendSource::Upload => services::staging::install_from_upload(&folder_name, mode),
        AppendSource::Download => services::staging::install_from_download(&folder_name, mode),
    };
    if staged.is_none() {
        *pending.inner().lock().unwrap() = None;
        log::error("install", "追加安装异常：暂存失败");
        return None;
    }
    let summary = services::installer::deploy_append(
        &staging,
        &game_paths,
        true,
        use_personal_cfg.unwrap_or(false),
    );
    log::success("install", "追加安装完成！");
    *pending.inner().lock().unwrap() = None;
    Some(summary)
}

// ── Installed Data ─────────────────────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn get_installed_data() -> srp_cfg_core::InstallState {
    services::installer::get_installed_data()
}

#[tauri::command(rename_all = "camelCase")]
pub fn delete_installed_item(state: State<AppStateMutex>, category: String, name: String) -> bool {
    let Ok(key) = parse_category(&category) else {
        log::error("file-ops", &format!("未知分类：{category}"));
        return false;
    };
    services::installer::delete_installed_item(key, &name, &game_paths(&state))
}

#[tauri::command(rename_all = "camelCase")]
pub fn clear_install_category(state: State<AppStateMutex>, category: String) -> usize {
    match parse_category(&category) {
        Ok(key) => services::installer::clear_install_category(key, &game_paths(&state)),
        Err(e) => {
            log::error("file-ops", &e);
            0
        }
    }
}

// ── Open item ──────────────────────────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn open_item(state: State<AppStateMutex>, storage: StorageKind, category: String, name: String) -> bool {
    let Ok(key) = parse_category(&category) else {
        log::error("file-ops", &format!("未知分类：{category}"));
        return false;
    };
    services::installer::open_item(storage, key, &name, &game_paths(&state))
}

// ── Conflict Recovery (res.json) ───────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn get_res_data() -> srp_cfg_core::InstallState {
    services::installer::get_res_data()
}

#[tauri::command(rename_all = "camelCase")]
pub fn restore_from_res(state: State<AppStateMutex>, category: String, name: String) -> bool {
    match parse_category(&category) {
        Ok(key) => services::installer::restore_from_res(key, &name, &game_paths(&state)),
        Err(_) => false,
    }
}

#[tauri::command(rename_all = "camelCase")]
pub fn delete_res_item(category: String, name: String) -> bool {
    match parse_category(&category) {
        Ok(key) => services::installer::delete_res_item(key, &name),
        Err(_) => false,
    }
}

#[tauri::command(rename_all = "camelCase")]
pub fn clear_res_category(category: String) {
    if let Ok(key) = parse_category(&category) {
        services::installer::clear_res_category(key);
    }
}

#[tauri::command(rename_all = "camelCase")]
pub fn restore_res_category(state: State<AppStateMutex>, category: String) -> usize {
    match parse_category(&category) {
        Ok(key) => services::installer::restore_res_category(key, &game_paths(&state)),
        Err(_) => 0,
    }
}

// ── Backup (save.json) ─────────────────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn get_save_data() -> srp_cfg_core::InstallState {
    services::installer::get_save_data()
}

#[tauri::command(rename_all = "camelCase")]
pub fn restore_from_save(state: State<AppStateMutex>) -> bool {
    services::installer::restore_from_save(&game_paths(&state))
}

#[tauri::command(rename_all = "camelCase")]
pub fn delete_save_item(category: String, name: String) -> bool {
    match parse_category(&category) {
        Ok(key) => services::installer::delete_save_item(key, &name),
        Err(_) => false,
    }
}

#[tauri::command(rename_all = "camelCase")]
pub fn clear_save_category(category: String) {
    if let Ok(key) = parse_category(&category) {
        services::installer::clear_save_category(key);
    }
}

#[tauri::command(rename_all = "camelCase")]
pub fn restore_save_category(state: State<AppStateMutex>, category: String) -> usize {
    match parse_category(&category) {
        Ok(key) => services::installer::restore_save_category(key, &game_paths(&state)),
        Err(_) => 0,
    }
}

#[tauri::command(rename_all = "camelCase")]
pub fn restore_save_item(state: State<AppStateMutex>, category: String, name: String) -> bool {
    match parse_category(&category) {
        Ok(key) => services::installer::restore_save_item(key, &name, &game_paths(&state)),
        Err(_) => false,
    }
}

#[tauri::command(rename_all = "camelCase")]
pub fn open_save_folder() -> Result<(), String> {
    tauri_plugin_opener::open_path(
        services::staging::get_save_path().to_string_lossy().to_string(),
        None::<&str>,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "camelCase")]
pub fn open_res_folder() -> Result<(), String> {
    tauri_plugin_opener::open_path(
        services::staging::get_res_path().to_string_lossy().to_string(),
        None::<&str>,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command(rename_all = "camelCase")]
pub fn open_vcfg_snapshots_folder() -> Result<(), String> {
    let snapshot_root = crate::ctx::base_dir().join("vcfg");
    let _ = std::fs::create_dir_all(&snapshot_root);
    tauri_plugin_opener::open_path(snapshot_root.to_string_lossy().to_string(), None::<&str>)
        .map_err(|e| e.to_string())
}

// ── Downloads ──────────────────────────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn download_from_url(url: String, file_name: String) -> Option<DownloadEntry> {
    let entry = services::staging::download_from_url(&url, &file_name).ok()?;
    // 下载完成后自动解压并按组件归类到暂存区，使「组件安装」流水线能够直接就绪并完成部署
    let _ = services::staging::install_from_download(&entry.folder_name, InstallMode::Append);
    Some(entry)
}

#[tauri::command(rename_all = "camelCase")]
pub fn get_download_entries() -> Vec<DownloadEntry> {
    services::staging::get_download_entries()
}

#[tauri::command(rename_all = "camelCase")]
pub fn delete_download(folder_name: String) {
    services::staging::delete_download(&folder_name);
}

#[tauri::command(rename_all = "camelCase")]
pub fn install_from_download(
    state: State<AppStateMutex>,
    pending: State<PendingAppendState>,
    folder_name: String,
    mode: InstallMode,
    use_personal_cfg: Option<bool>,
) -> InstallOutcome {
    let game_paths = game_paths(&state);
    let staging = staging_paths();
    let use_personal_cfg = use_personal_cfg.unwrap_or(false);

    let result = match services::staging::install_from_download(&folder_name, mode) {
        Some(r) => r,
        None => {
            log::error("install", "配置包解压或暂存处理失败");
            return InstallOutcome::Install(InstallResult {
                files_installed: 0,
                dirs_installed: 0,
            });
        }
    };
    if result.cfg == 0 && result.annotations == 0 && result.video == 0 {
        log::warning("install", "配置包中未找到可安装的配置文件");
        return InstallOutcome::Install(InstallResult {
            files_installed: 0,
            dirs_installed: 0,
        });
    }
    log_persistence_impact(&state);

    match mode {
        InstallMode::Overlay => {
            let summary = services::installer::deploy_overlay(&staging, &game_paths, use_personal_cfg);
            log::success("install", "配置包安装完成！");
            InstallOutcome::Install(summary)
        }
        InstallMode::Append => {
            let conflict_result =
                services::installer::check_append_conflicts(&staging, &game_paths, use_personal_cfg);
            let conflict_count: usize = conflict_result
                .conflicts
                .iter()
                .map(|c| c.names.len())
                .sum();
            if conflict_count > 3 {
                log::error(
                    "install",
                    &format!("冲突文件过多（{conflict_count} 个），追加安装已拒绝"),
                );
                return InstallOutcome::Conflicts(conflict_result);
            }
            if conflict_result.needs_confirm {
                *pending.inner().lock().unwrap() = Some(PendingAppend {
                    folder_name: folder_name.clone(),
                    source: AppendSource::Download,
                    mode,
                });
                return InstallOutcome::Conflicts(conflict_result);
            }
            let summary = services::installer::deploy_append(
                &staging,
                &game_paths,
                false,
                use_personal_cfg,
            );
            log::success("install", "配置包追加安装完成！");
            InstallOutcome::Install(summary)
        }
    }
}

#[tauri::command(rename_all = "camelCase")]
pub fn open_downloads_folder() -> Result<(), String> {
    tauri_plugin_opener::open_path(
        services::staging::get_download_path().to_string_lossy().to_string(),
        None::<&str>,
    )
    .map_err(|e| e.to_string())
}

// ── App Info / Updater ─────────────────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn app_get_version() -> String {
    crate::ctx::handle().package_info().version.to_string()
}

#[tauri::command(rename_all = "camelCase")]
pub fn app_get_latest_version() -> String {
    services::updater::get_latest_version()
}

#[tauri::command(rename_all = "camelCase")]
pub fn updater_check(force: Option<bool>) -> UpdateCheckResult {
    services::updater::check_for_update(force.unwrap_or(true))
}

#[tauri::command(rename_all = "camelCase")]
pub fn updater_dismiss(version: String) {
    services::updater::dismiss_version(&version);
}

#[tauri::command(rename_all = "camelCase")]
pub fn updater_history() -> Option<Vec<srp_cfg_core::Release>> {
    services::updater::fetch_update_history()
}

#[tauri::command(rename_all = "camelCase")]
pub fn shell_open_external(url: String) -> Result<(), String> {
    tauri_plugin_opener::open_url(url, None::<&str>).map_err(|e| e.to_string())
}

// ── 内部工具 ───────────────────────────────────────────────────

fn log_persistence_impact(state: &State<AppStateMutex>) {
    let (kind, cfg_count) = services::staging::inspect_staged_config();
    match kind.as_str() {
        "runtime-core" => {
            log::info(
                "install",
                "检测到 Runtime Core（启动时注册功能与 alias，不自动应用偏好）",
            );
        }
        "custom" => {
            capture_persistence_baseline(state);
            log::warning(
                "install",
                &format!("检测到无法识别的自定义 CFG（{cfg_count} 个）"),
            );
        }
        _ => {
            log::info("install", "本次安装不包含 CFG 脚本");
        }
    }
}

fn capture_persistence_baseline(state: &State<AppStateMutex>) {
    let st = state.inner().lock().unwrap();
    let Some(user_cfg_path) = st.user_cfg_path.clone() else {
        log::warning("backup", "未创建 VCFG 状态快照");
        return;
    };
    let Some(current_user) = st.current_user.clone() else {
        log::warning("backup", "未创建 VCFG 状态快照");
        return;
    };
    if !st.vcfg_state.available {
        log::warning("backup", "未创建 VCFG 状态快照");
        return;
    }
    let snapshot_root = crate::ctx::base_dir().join("vcfg");
    let (_, created) = services::vcfg::save_vcfg_baseline(
        &user_cfg_path,
        &snapshot_root.to_string_lossy(),
        &current_user.account_id,
    );
    if created {
        log::success("backup", "已保存 VCFG 原始状态快照");
    } else {
        log::info("backup", "VCFG 原始状态快照已存在");
    }
}

// ── 进程检测 ───────────────────────────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn check_cs2_running() -> bool {
    services::detection::is_cs2_running()
}

// ── 物理文件树与浏览 ───────────────────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn fs_scan_installed_roots(state: State<AppStateMutex>) -> Vec<services::fs_explorer::FsTreeRoot> {
    services::fs_explorer::scan_installed_roots(&game_paths(&state))
}

#[tauri::command(rename_all = "camelCase")]
pub fn fs_read_file(path: String) -> Result<String, String> {
    services::fs_explorer::read_file_text(&path)
}

#[tauri::command(rename_all = "camelCase")]
pub fn fs_write_file(path: String, content: String) -> Result<(), String> {
    services::fs_explorer::write_file_text(&path, &content)
}

#[tauri::command(rename_all = "camelCase")]
pub fn fs_delete_item(path: String) -> Result<(), String> {
    services::fs_explorer::delete_fs_item(&path)
}

#[tauri::command(rename_all = "camelCase")]
pub fn fs_open_in_explorer(path: String) -> Result<(), String> {
    services::fs_explorer::open_path_in_explorer(&path)
}

// ── 备份与恢复服务 ─────────────────────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn backup_list() -> Vec<services::backup::BackupMeta> {
    services::backup::list_backups()
}

#[tauri::command(rename_all = "camelCase")]
pub fn backup_create_snapshot(
    state: State<AppStateMutex>,
    components: Vec<String>,
    note: Option<String>,
    is_auto: Option<bool>,
) -> Result<services::backup::BackupMeta, String> {
    let gp = game_paths(&state);
    let note_str = note.unwrap_or_else(|| "手动创建快照".to_string());
    services::backup::create_snapshot(&components, &note_str, is_auto.unwrap_or(false), &gp)
}

#[tauri::command(rename_all = "camelCase")]
pub fn backup_restore_snapshot(state: State<AppStateMutex>, backup_id: String) -> Result<(), String> {
    let gp = game_paths(&state);
    services::backup::restore_snapshot(&backup_id, &gp)
}

#[tauri::command(rename_all = "camelCase")]
pub fn backup_delete(backup_id: String) -> Result<(), String> {
    services::backup::delete_backup(&backup_id)
}

#[tauri::command(rename_all = "camelCase")]
pub fn backup_clean_auto(max_keep: Option<usize>) -> usize {
    services::backup::clean_auto_backups(max_keep.unwrap_or(10))
}

#[tauri::command(rename_all = "camelCase")]
pub fn backup_open_folder() -> Result<(), String> {
    services::backup::open_backups_folder()
}

// ── 多组件安全安装流水线 ────────────────────────────────────────

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineResult {
    pub success: bool,
    pub cs2_running: bool,
    pub backup_id: Option<String>,
    pub files_installed: usize,
    pub dirs_installed: usize,
    pub message: String,
}

#[tauri::command(rename_all = "camelCase")]
pub fn install_components_pipeline(
    state: State<AppStateMutex>,
    components: Vec<String>,
    override_paths: Option<std::collections::HashMap<String, String>>,
    use_personal_cfg: Option<bool>,
) -> Result<PipelineResult, String> {
    let cs2_running = services::detection::is_cs2_running();
    if cs2_running {
        log::warning("install", "检测到 CS2 正在运行中，部分文件可能被游戏锁定，请留意安装结果");
    }

    let mut gp = game_paths(&state);
    if let Some(map) = &override_paths {
        if let Some(p) = map.get("cfg") {
            gp.game_cfg_path = Some(p.clone());
        }
        if let Some(p) = map.get("annotations") {
            gp.annotations_path = Some(p.clone());
        }
        if let Some(p) = map.get("video") {
            gp.user_cfg_path = Some(p.clone());
        }
    }

    // 1. 创建安装前自动快照
    let backup_meta = services::backup::create_snapshot(
        &components,
        "组件安装前自动快照",
        true,
        &gp,
    ).ok();
    let backup_id = backup_meta.map(|m| m.id);

    // 2. FIFO 淘汰旧自动备份（默认保留最新 10 份）
    let _ = services::backup::clean_auto_backups(10);

    // 3. 执行部署
    let staging = staging_paths();
    let use_personal = use_personal_cfg.unwrap_or(false);
    let summary = services::installer::deploy_overlay(&staging, &gp, use_personal);

    log::success(
        "install",
        &format!("已成功安装所选组件（{} 个文件，{} 个目录）", summary.files_installed, summary.dirs_installed),
    );

    Ok(PipelineResult {
        success: true,
        cs2_running,
        backup_id,
        files_installed: summary.files_installed,
        dirs_installed: summary.dirs_installed,
        message: "组件安装完成".to_string(),
    })
}

