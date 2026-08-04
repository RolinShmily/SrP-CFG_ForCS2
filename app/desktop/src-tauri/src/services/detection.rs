//! Steam / CS2 路径检测壳层。
//!
//! 对应原 `app/desktop/src/main/services/detection.ts`：
//! - 注册表读取（winreg）→ `detect_steam_path`（含默认路径扫描 + steam.exe 评分）
//! - fs 扫描 → 喂给 core 的 `parse_library_paths` / `cs2_manifest_state` /
//!   `parse_login_users` / `cs2_game_dir` 等纯逻辑
//! - 自动创建目录分支（annotations/local、userdata cfg）

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use srp_cfg_core::{
    cs2_game_dir, cs2_manifest_state, parse_library_paths, parse_login_users, Cs2InstallState,
    LoginUsers,
};
use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
use winreg::RegKey;

use crate::log;
use crate::models::{DetectionResult, VcfgStateSummary};

// ── 注册表 ────────────────────────────────────────────────────

const REGISTRY_PATHS: [(&str, &str, &str); 4] = [
    ("HKCU", r"Software\Valve\Steam", "SteamPath"),
    ("HKCU", r"Software\Valve\Steam", "InstallPath"),
    ("HKLM", r"SOFTWARE\Valve\Steam", "InstallPath"),
    ("HKLM", r"SOFTWARE\Wow6432Node\Valve\Steam", "InstallPath"),
];

fn read_registry_value(hive: &str, key: &str, value: &str) -> Option<String> {
    let hk = match hive {
        "HKCU" => RegKey::predef(HKEY_CURRENT_USER),
        "HKLM" => RegKey::predef(HKEY_LOCAL_MACHINE),
        _ => return None,
    };
    let sub = hk.open_subkey(key).ok()?;
    sub.get_value::<String, _>(value).ok()
}

const DEFAULT_PATHS: [&str; 5] = [
    r"C:\Program Files (x86)\Steam",
    r"C:\Program Files\Steam",
    r"C:\Steam",
    r"D:\Steam",
    r"E:\Steam",
];

/// 对应 TS `detectSteamPath`：注册表 4 路径 + 默认路径扫描，steam.exe 存在 + 评分取最优。
pub fn detect_steam_path() -> Option<String> {
    let mut candidates: BTreeSet<String> = BTreeSet::new();

    for (hive, key, value) in REGISTRY_PATHS {
        if let Some(v) = read_registry_value(hive, key, value) {
            let p = v.replace('/', "\\");
            let p = p.trim_end_matches('\\').to_string();
            if Path::new(&p).exists() {
                candidates.insert(p);
            }
        }
    }
    for p in DEFAULT_PATHS {
        if Path::new(p).exists() {
            candidates.insert(p.to_string());
        }
    }

    let mut best: Option<(i32, String)> = None;
    for p in candidates {
        if !Path::new(&format!(r"{p}\steam.exe")).exists() {
            continue;
        }
        let mut score = 1;
        if Path::new(&format!(r"{p}\config\loginusers.vdf")).exists() {
            score += 10;
        }
        if Path::new(&format!(r"{p}\userdata")).exists() {
            score += 10;
        }
        if Path::new(&format!(r"{p}\steamapps\libraryfolders.vdf")).exists() {
            score += 5;
        }
        if best.as_ref().map_or(true, |(s, _)| score > *s) {
            best = Some((score, p));
        }
    }

    if let Some((_, p)) = &best {
        log::success("path-detection", &format!("Steam 路径：{p}"));
    } else {
        log::error("path-detection", "未找到 Steam 路径");
    }
    best.map(|(_, p)| p)
}

// ── Library paths ─────────────────────────────────────────────

/// 对应 TS `readLibraryPaths`：解析 libraryfolders.vdf 并把 steamRoot 置顶。
pub fn read_library_paths(steam_root: &str) -> Vec<String> {
    let vdf_path = Path::new(steam_root).join("steamapps").join("libraryfolders.vdf");
    let mut paths: Vec<String> = if let Ok(content) = std::fs::read_to_string(&vdf_path) {
        parse_library_paths(&content)
    } else {
        log::warning(
            "path-detection",
            "未找到 libraryfolders.vdf，将仅尝试 Steam 根路径",
        );
        Vec::new()
    };
    if !paths.iter().any(|p| p == steam_root) {
        paths.insert(0, steam_root.to_string());
    }
    paths
}

// ── CS2 install state / paths ─────────────────────────────────

/// 对应 TS `detectCs2InstallState`：遍历库找 appmanifest_730.acf 判状态。
pub fn detect_cs2_install_state(
    steam_root: &str,
    libraries: &[String],
) -> (Cs2InstallState, Option<String>) {
    for lib in libraries {
        let manifest_path = Path::new(lib).join("steamapps").join("appmanifest_730.acf");
        let Ok(content) = std::fs::read_to_string(&manifest_path) else {
            continue;
        };
        if let Some(state) = cs2_manifest_state(Some(&content)) {
            let install_dir = cs2_game_dir(lib, Some(&content));
            match state {
                Cs2InstallState::NeedsUpdate => {
                    log::warning(
                        "steam-status",
                        &format!("CS2 有可用更新，{install_dir}"),
                    );
                    return (state, Some(install_dir));
                }
                Cs2InstallState::Installed => {
                    log::success("steam-status", &format!("CS2 已安装，{install_dir}"));
                    return (state, Some(install_dir));
                }
                Cs2InstallState::NotInstalled => {}
            }
        }
    }
    let _ = steam_root;
    log::error("steam-status", "未检测到 CS2 安装");
    (Cs2InstallState::NotInstalled, None)
}

/// 对应 TS `detectCs2CfgPath`：默认游戏目录下 game/csgo/cfg 存在性。
pub fn detect_cs2_cfg_path(libraries: &[String]) -> Option<String> {
    for lib in libraries {
        let cfg = PathBuf::from(cs2_game_dir(lib, None))
            .join("game")
            .join("csgo")
            .join("cfg");
        if cfg.exists() {
            let p = cfg.to_string_lossy().to_string();
            log::success("path-detection", &format!("游戏CFG 路径：{p}"));
            return Some(p);
        }
    }
    log::error("path-detection", "未找到 游戏CFG 路径");
    None
}

/// 对应 TS `detectAnnotationsPath`：存在返回，否则自动创建。
pub fn detect_annotations_path(libraries: &[String]) -> Option<String> {
    for lib in libraries {
        let csgo = PathBuf::from(cs2_game_dir(lib, None)).join("game").join("csgo");
        if !csgo.exists() {
            continue;
        }
        let annotations = csgo.join("annotations").join("local");
        if annotations.exists() {
            let p = annotations.to_string_lossy().to_string();
            log::success("path-detection", &format!("地图指南 路径：{p}"));
            return Some(p);
        }
        match std::fs::create_dir_all(&annotations) {
            Ok(()) => {
                let p = annotations.to_string_lossy().to_string();
                log::success("path-detection", &format!("地图指南 路径（已自动创建）：{p}"));
                log::warning("path-detection", "首次创建可能需要启动一次游戏");
                return Some(p);
            }
            Err(e) => {
                log::error("path-detection", &format!("无法创建地图指南目录：{e}"));
                return None;
            }
        }
    }
    log::error("path-detection", "未找到 CS2 游戏目录");
    None
}

/// 对应 TS `detectUserCfgPath`：存在返回，否则自动创建。
pub fn detect_user_cfg_path(steam_root: &str, account_id: &str) -> Option<String> {
    let user_cfg_dir = Path::new(steam_root)
        .join("userdata")
        .join(account_id)
        .join("730")
        .join("local")
        .join("cfg");
    if user_cfg_dir.exists() {
        let p = user_cfg_dir.to_string_lossy().to_string();
        log::success("path-detection", &format!("账号本地状态目录：{p}"));
        return Some(p);
    }
    match std::fs::create_dir_all(&user_cfg_dir) {
        Ok(()) => {
            let p = user_cfg_dir.to_string_lossy().to_string();
            log::success("path-detection", &format!("账号本地状态目录（已自动创建）：{p}"));
            log::warning("path-detection", "首次创建可能需要启动一次游戏");
            Some(p)
        }
        Err(e) => {
            log::error("path-detection", &format!("无法创建账号本地状态目录：{e}"));
            None
        }
    }
}

// ── Steam users ───────────────────────────────────────────────

/// 对应 TS `detectSteamUsers`：解析 loginusers.vdf（core 纯逻辑）。
pub fn detect_steam_users(steam_root: &str) -> LoginUsers {
    let vdf_path = Path::new(steam_root).join("config").join("loginusers.vdf");
    let Some(content) = std::fs::read_to_string(&vdf_path).ok() else {
        log::warning("steam-status", "未找到 loginusers.vdf");
        return LoginUsers::default();
    };
    let parsed = parse_login_users(&content);

    if let Some(user) = &parsed.current_user {
        log::success(
            "steam-status",
            &format!(
                "当前登录用户：{}",
                user.persona_name.as_deref().unwrap_or(&user.account_id)
            ),
        );
    } else if !parsed.users.is_empty() {
        log::warning("steam-status", "未检测到自动登录用户，请登录 Steam");
    } else {
        log::warning("steam-status", "未找到任何 Steam 用户记录");
    }
    parsed
}

// ── Orchestrator ──────────────────────────────────────────────

/// 对应 TS `detectAll`（注册表部分在本机实测；无 Steam 时返回空结果）。
pub fn detect_all() -> DetectionResult {
    let empty = || DetectionResult {
        steam_path: None,
        cs2_install_state: Cs2InstallState::NotInstalled,
        cs2_install_dir: None,
        cs2_cfg_path: None,
        annotations_path: None,
        user_cfg_path: None,
        vcfg_state: VcfgStateSummary::default(),
        steam_users: Vec::new(),
        current_user: None,
        has_auto_login_user: false,
    };

    let Some(steam_path) = detect_steam_path() else {
        return empty();
    };

    let libs = read_library_paths(&steam_path);
    let (cs2_install_state, cs2_install_dir) = if !libs.is_empty() {
        detect_cs2_install_state(&steam_path, &libs)
    } else {
        (Cs2InstallState::NotInstalled, None)
    };
    let cs2_cfg_path = if !libs.is_empty() {
        detect_cs2_cfg_path(&libs)
    } else {
        None
    };
    let annotations_path = if !libs.is_empty() {
        detect_annotations_path(&libs)
    } else {
        None
    };

    let users_res = detect_steam_users(&steam_path);
    let user_cfg_path = users_res
        .current_user
        .as_ref()
        .map(|u| detect_user_cfg_path(&steam_path, &u.account_id))
        .flatten();

    let vcfg_state = crate::services::vcfg::inspect_vcfg_state(user_cfg_path.as_deref());

    log::success("path-detection", "环境检测完成");
    DetectionResult {
        steam_path: Some(steam_path),
        cs2_install_state,
        cs2_install_dir,
        cs2_cfg_path,
        annotations_path,
        user_cfg_path,
        vcfg_state,
        steam_users: users_res.users,
        current_user: users_res.current_user,
        has_auto_login_user: users_res.has_auto_login_user,
    }
}
