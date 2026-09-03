//! Tauri 壳层入口库（Windows 目标构建）。
//!
//! 纯业务逻辑在 `srp-cfg-core`（本 workspace 的 core/），本 crate 只负责：
//! 窗口创建、IPC command 注册（对应原 `src/main/ipc.ts` 40+ handler）、
//! 文件系统/注册表/网络等平台 I/O（`services/`）、旧数据迁移（D2）。
//!
//! 注意：本 crate 依赖 tauri，Linux 需要 webkit2gtk-4.1 才能编译；
//! 开发/测试纯逻辑请使用 `cargo test -p srp-cfg-core`。

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod ctx;
mod log;
mod models;
mod services;
mod state;

use std::sync::Mutex;

/// 应用启动入口（Windows 上由 tauri 调用）。
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(Mutex::new(state::AppState::default()))
        .manage(Mutex::new(None::<state::PendingAppend>))
        .setup(|app| {
            ctx::init(app.handle());
            // 旧版 Electron 数据目录一次性迁移（D2）必须先于暂存目录初始化：
            // staging 初始化会创建 cfg/annotations/... 同名骨架目录，若先执行会让
            // 迁移计划误判"目标已存在"而对旧数据全部 Skip（数据不迁移、不写标记）。
            services::migrate::run_migration();
            // 旧目录布局（根目录平铺）→ 新目录布局（staging/library/archive/state/cache）升级。
            // 同样必须先于 initialize_staging_area()，避免骨架目录占用新路径导致跳过。
            services::migrate::upgrade_layout();
            services::staging::initialize_staging_area();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 窗口控制
            commands::window::minimize,
            commands::window::maximize,
            commands::window::close,
            commands::window::is_maximized,
            // 检测
            commands::detect_all,
            commands::set_current_user,
            // 用户配置层
            commands::user_config_get,
            commands::user_config_save,
            commands::user_config_open_folder,
            // VCFG 快照
            commands::vcfg_capture_snapshot,
            commands::vcfg_generate_cfg,
            // 上传 / staging
            commands::upload_files,
            commands::get_upload_history,
            commands::get_uploaded_entries,
            commands::install_from_upload,
            commands::delete_upload_entry,
            commands::open_uploads_folder,
            commands::get_staging_status,
            // 追加安装确认
            commands::confirm_append,
            // 已安装数据（install.json）
            commands::get_installed_data,
            commands::delete_installed_item,
            commands::clear_install_category,
            commands::open_item,
            // 冲突恢复（res.json）
            commands::get_res_data,
            commands::restore_from_res,
            commands::delete_res_item,
            commands::clear_res_category,
            commands::restore_res_category,
            // 备份（save.json）
            commands::get_save_data,
            commands::restore_from_save,
            commands::delete_save_item,
            commands::clear_save_category,
            commands::restore_save_category,
            commands::restore_save_item,
            commands::open_save_folder,
            commands::open_res_folder,
            commands::open_vcfg_snapshots_folder,
            // 下载
            commands::download_from_url,
            commands::get_download_entries,
            commands::delete_download,
            commands::install_from_download,
            commands::open_downloads_folder,
            // 应用信息 / 更新
            commands::app_get_version,
            commands::app_get_latest_version,
            commands::updater_check,
            commands::updater_dismiss,
            commands::updater_history,
            // Shell
            commands::shell_open_external,
            // 进程检测
            commands::check_cs2_running,
            // 物理文件树与浏览
            commands::fs_scan_installed_roots,
            commands::fs_read_file,
            commands::fs_write_file,
            commands::fs_delete_item,
            commands::fs_open_in_explorer,
            // 备份与恢复
            commands::backup_list,
            commands::backup_create_snapshot,
            commands::backup_restore_snapshot,
            commands::backup_delete,
            commands::backup_clean_auto,
            commands::backup_open_folder,
            // 多组件安装流水线
            commands::install_components_pipeline,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// L2.6 实机验收（Windows）：`cargo test -p srp-cfg-desktop --lib -- --ignored --nocapture detect_all`
/// 对照 Electron 版 detectAll 输出与 golden-samples.md §1。
#[cfg(all(test, windows))]
mod real_machine_verify {
    #[test]
    #[ignore = "real-machine acceptance (L2.6)"]
    fn detect_all_on_real_machine() {
        crate::services::staging::initialize_staging_area();
        let r = crate::services::detection::detect_all();
        println!(
            "\n==== L2.6 detectAll 实机输出 ====\n{}",
            serde_json::to_string_pretty(&r).unwrap()
        );
        // 注册表成功分支：Steam 应被检测到（本机 C:\Program Files (x86)\Steam）
        assert!(
            r.steam_path.is_some(),
            "Steam 未检测到（注册表/默认路径分支失败）"
        );
        println!("\n==== 验收项 ====\n- Steam 路径: {:?}\n- CS2 状态: {:?} ({:?})\n- 用户数: {}\n- 当前用户: {:?}\n- VCFG: {}",
            r.steam_path, r.cs2_install_state, r.cs2_install_dir, r.steam_users.len(),
            r.current_user.as_ref().map(|u| u.persona_name.clone().unwrap_or_default()),
            serde_json::to_string(&r.vcfg_state).unwrap());
    }
}
