//! IPC DTO（序列化形状对齐 `app/desktop/src/renderer/types.ts`，一律 camelCase）。

use serde::{Deserialize, Serialize};
use srp_cfg_core::{Cs2InstallState, SteamUser};
use std::collections::HashMap;

// ── Detection ─────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VcfgStateSummary {
    pub available: bool,
    pub bindings: usize,
    pub analog_bindings: usize,
    pub cloud_convars: usize,
    pub machine_convars: usize,
    pub has_cloud_mirror: bool,
    pub has_video_config: bool,
}

impl Default for VcfgStateSummary {
    fn default() -> Self {
        Self {
            available: false,
            bindings: 0,
            analog_bindings: 0,
            cloud_convars: 0,
            machine_convars: 0,
            has_cloud_mirror: false,
            has_video_config: false,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VcfgSnapshot {
    pub schema_version: u32,
    pub captured_at: u64,
    pub user_cfg_path: String,
    pub bindings: HashMap<String, String>,
    pub analog_bindings: HashMap<String, String>,
    pub user_convars: HashMap<String, String>,
    pub machine_convars: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectionResult {
    pub steam_path: Option<String>,
    pub cs2_install_state: Cs2InstallState,
    pub cs2_install_dir: Option<String>,
    pub cs2_cfg_path: Option<String>,
    pub annotations_path: Option<String>,
    pub user_cfg_path: Option<String>,
    pub vcfg_state: VcfgStateSummary,
    pub steam_users: Vec<SteamUser>,
    pub current_user: Option<SteamUser>,
    pub has_auto_login_user: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserConfigSelection {
    pub user_cfg_path: Option<String>,
    pub vcfg_state: VcfgStateSummary,
}

// ── 用户配置层 ───────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserConfigDocument {
    pub path: Option<String>,
    pub target: Option<String>, // "game" | "account"
    pub exists: bool,
    pub runtime_installed: bool,
    pub content: String,
    pub modified_at: Option<u64>,
}

// ── Staging（上传/下载）──────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadFileInfo {
    pub name: String,
    pub relative_path: String,
    #[serde(rename = "type")]
    pub kind: String, // "cfg" | "txt" | "unsupported"
    pub size: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadEntry {
    pub folder_name: String,
    pub timestamp: u64,
    pub file_count: usize,
    pub files: Vec<UploadFileInfo>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadedEntry {
    pub folder_name: String,
    pub display_name: String,
    pub timestamp: u64,
    pub size: u64,
    pub file_count: usize,
    pub is_zip: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadEntry {
    pub folder_name: String,
    pub file_name: String,
    pub timestamp: u64,
    pub size: u64,
}

// ── 安装结果 / 冲突 ──────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallResult {
    pub files_installed: usize,
    pub dirs_installed: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppendConflictPayload {
    pub category: String,
    pub names: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppendConflictResult {
    pub needs_confirm: bool,
    pub conflicts: Vec<AppendConflictPayload>,
}

/// `installFromUpload/installFromDownload` 返回：InstallResult | AppendConflictResult。
#[derive(Debug, Clone, Serialize)]
#[serde(untagged)]
pub enum InstallOutcome {
    Install(InstallResult),
    Conflicts(AppendConflictResult),
}

// ── 安装模式 ─────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub enum InstallMode {
    #[default]
    Overlay,
    Append,
}

/// confirmAppend 的 source。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub enum AppendSource {
    #[default]
    Upload,
    Download,
}

/// openItem 的 storage。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum StorageKind {
    Install,
    Save,
    Res,
}
