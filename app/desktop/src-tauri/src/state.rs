//! 应用状态（对应原 Electron `AppState`，见 `src/main/state.ts`）。

use srp_cfg_core::{Cs2InstallState, SteamUser};

use crate::models::VcfgStateSummary;

#[derive(Debug, Clone, Default)]
pub struct AppState {
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

impl AppState {
    pub fn game_paths(&self) -> crate::services::installer::GamePaths {
        crate::services::installer::GamePaths {
            game_cfg_path: self.cs2_cfg_path.clone(),
            user_cfg_path: self.user_cfg_path.clone(),
            annotations_path: self.annotations_path.clone(),
        }
    }

    pub fn apply_detection(&mut self, r: &crate::models::DetectionResult) {
        self.steam_path = r.steam_path.clone();
        self.cs2_install_state = r.cs2_install_state;
        self.cs2_install_dir = r.cs2_install_dir.clone();
        self.cs2_cfg_path = r.cs2_cfg_path.clone();
        self.annotations_path = r.annotations_path.clone();
        self.user_cfg_path = r.user_cfg_path.clone();
        self.vcfg_state = r.vcfg_state.clone();
        self.steam_users = r.steam_users.clone();
        self.current_user = r.current_user.clone();
        self.has_auto_login_user = r.has_auto_login_user;
    }
}

/// pendingAppend 状态机（confirmAppend 校验用，对应原 ipc.ts 模块级变量）。
/// folder_name / source 仅用于与 TS 对齐的记录（校验只用存在性 + mode）。
#[derive(Debug, Clone, Default)]
#[allow(dead_code)]
pub struct PendingAppend {
    pub folder_name: String,
    pub source: crate::models::AppendSource,
    pub mode: crate::models::InstallMode,
}
