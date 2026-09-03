//! SrP-CFG 纯业务逻辑核心。
//!
//! 设计约束：**不依赖 tauri / 文件系统 / 平台 API**。
//! - 输入输出均为纯数据结构或字符串，便于跨平台单元测试（`cargo test -p srp-cfg-core`）。
//! - 文件读取、注册表、网络等 I/O 由 tauri 壳层（`../src/services`）负责，本 crate 只做纯计算。
//!
//! 对应原 Electron 版 `app/desktop/src/main/services/*.ts` 中的纯逻辑部分。

pub mod conflicts;
pub mod detection;
pub mod installer;
pub mod migrate;
pub mod staging;
pub mod updater;
pub mod vcfg;
pub mod version;

pub use conflicts::{
    decide_append_conflicts, AppendConflict, AppendConflictDecision, CategoryInput, CategoryKey,
};
pub use detection::{
    cs2_game_dir, cs2_manifest_state, parse_acf_value, parse_library_paths, parse_login_users,
    steam_id64_to_account_id, Cs2InstallState, LoginUsers, SteamUser, DEFAULT_CS2_FOLDER,
    STEAM_ID_OFFSET,
};
pub use installer::{
    category, category_mut, clear_category, install_from_backup, merge_append, normalize_category,
    normalize_state, ordered_union, plan_overlay_category, remove_item, restore_item, update_paths,
    CategoryState, DeployAction, EntryList, InstallState, OverlayPlan,
};
pub use migrate::{plan_migration, should_migrate, MigrationAction};
pub use staging::{
    classify_file, classify_file_with_content, executable_line, exec_target, folders_to_remove,
    inspect_cfg_files, is_runtime_registration_only, is_timestamp_folder, next_timestamp_folder,
    plan_staging, staging_destination, staging_destination_with_content, ConfigImpact,
    StagedCategory, StagedConfigKind, StagingPlan, UploadFileType, upload_file_type,
};
pub use updater::{
    build_result, filter_at_least, filter_newer, has_config_assets, has_desktop_assets, is_cache_fresh,
    is_dismissed, map_release, sort_newest_first, Release, UpdateCheckResult,
};
pub use vcfg::{
    child, count_entries, normalize_cfg_value, parse_cfg_convars, parse_vdf, snapshot_to_cfg,
    string_entries, SnapshotToCfgOptions, VdfNode, VdfValue,
};
pub use version::compare_versions;
