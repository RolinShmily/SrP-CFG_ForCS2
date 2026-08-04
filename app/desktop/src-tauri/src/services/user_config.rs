//! 用户自定义层（custom.cfg）读写壳层。
//!
//! 对应原 `app/desktop/src/main/services/user-config.ts`：候选目录评分路由
//! （autoexec +500 / runtime +1000 / custom +100，modifiedAt 决胜），读写 `srp-cfg/user/custom.cfg`。

use std::path::{Path, PathBuf};

use crate::log;
use crate::models::UserConfigDocument;

const USER_CONFIG_RELATIVE: &str = "srp-cfg/user/custom.cfg";
const RUNTIME_RELATIVE: &str = "srp-cfg/runtime/init.cfg";
const MAX_USER_CONFIG_BYTES: usize = 256 * 1024;

pub const DEFAULT_USER_CONFIG: &str = "// ─── SrP-CFG Preset Layer ───
// 第一步：从下面四个 Preset 起点中选择一个，删除该行开头的 //。
// 只启用一个；如果完全依赖游戏设置与 VCFG，也可以一个都不启用。
//
// srp_apply_default
// srp_apply_echo
// srp_apply_yszh
// srp_apply_visionl
//
// 想从 Valve 基线重新测试：控制台执行 srp_reset_valve；
// ─── Preset Layer End ───

// ─── SrP-CFG User Layer ───
// 第二步：把自己的灵敏度、准星、HUD、声音、按键和 alias 写在所选命令下面。
// 后面的命令会覆盖 Preset 中的同名设置；不要直接修改 runtime/features/modes/presets。
// 安装器更新、恢复或卸载 Runtime 时都会保护本文件。
//
// 示例（删除行首 // 后生效）：
// sensitivity 1.00
// c06
// cyan
// bind \"mouse4\" \"+voicerecord\"
// alias \"mypractice\" \"srp_practice_keys\"
//
// 修改并保存本文件后执行 srp_reload，再应用\"Preset 起点 → 个人差异\"。
// ─── User Layer End ───
";

#[derive(Debug, Clone)]
pub struct GamePaths {
    pub game_cfg_path: Option<String>,
    pub user_cfg_path: Option<String>,
    pub annotations_path: Option<String>,
}

#[derive(Debug, Clone, Default)]
struct Candidate {
    target: &'static str, // "game" | "account"
    custom_path: PathBuf,
    runtime_path: PathBuf,
    score: i64,
    modified_at: u64,
}

fn mtime_ms(p: &Path) -> u64 {
    p.metadata()
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn candidate(base_dir: &str, target: &'static str) -> Candidate {
    let base = Path::new(base_dir);
    let custom_path = base.join(USER_CONFIG_RELATIVE);
    let runtime_path = base.join(RUNTIME_RELATIVE);
    let autoexec_path = base.join("autoexec.cfg");
    let mut score = 0i64;
    if autoexec_path.exists() {
        score += 500;
    }
    if runtime_path.exists() {
        score += 1000;
    }
    if custom_path.exists() {
        score += 100;
    }
    let modified_at = [autoexec_path, runtime_path.clone(), custom_path.clone()]
        .iter()
        .filter(|p| p.exists())
        .map(|p| mtime_ms(p))
        .fold(0u64, u64::max);
    Candidate {
        target,
        custom_path,
        runtime_path,
        score,
        modified_at,
    }
}

fn resolve_candidate(game_paths: &GamePaths) -> Option<Candidate> {
    let mut candidates: Vec<Candidate> = Vec::new();
    if let Some(p) = &game_paths.game_cfg_path {
        candidates.push(candidate(p, "game"));
    }
    if let Some(p) = &game_paths.user_cfg_path {
        candidates.push(candidate(p, "account"));
    }
    candidates.sort_by(|a, b| {
        b.score
            .cmp(&a.score)
            .then(b.modified_at.cmp(&a.modified_at))
            .then(if a.target == "game" {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            })
    });
    candidates.into_iter().next()
}

pub fn read_user_config(game_paths: &GamePaths) -> UserConfigDocument {
    let Some(selected) = resolve_candidate(game_paths) else {
        return UserConfigDocument {
            path: None,
            target: None,
            exists: false,
            runtime_installed: false,
            content: DEFAULT_USER_CONFIG.to_string(),
            modified_at: None,
        };
    };

    let exists = selected.custom_path.is_file();
    let runtime_installed = selected.runtime_path.exists();
    let content = if exists {
        std::fs::read_to_string(&selected.custom_path).unwrap_or_default()
    } else {
        DEFAULT_USER_CONFIG.to_string()
    };

    UserConfigDocument {
        path: Some(selected.custom_path.to_string_lossy().to_string()),
        target: Some(selected.target.to_string()),
        exists,
        runtime_installed,
        content,
        modified_at: if exists { Some(mtime_ms(&selected.custom_path)) } else { None },
    }
}

pub fn save_user_config(game_paths: &GamePaths, content: &str) -> Result<UserConfigDocument, String> {
    if content.contains('\0') {
        return Err("个人配置不能包含 NUL 字符".to_string());
    }
    if content.len() > MAX_USER_CONFIG_BYTES {
        return Err("个人配置不能超过 256 KiB".to_string());
    }
    let selected = resolve_candidate(game_paths)
        .ok_or_else(|| "尚未检测到可用的 CS2 CFG 目录".to_string())?;

    let normalized = if content.is_empty() || content.ends_with('\n') {
        content.to_string()
    } else {
        format!("{content}\n")
    };
    if let Some(parent) = selected.custom_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    std::fs::write(&selected.custom_path, normalized)
        .map_err(|e| format!("写入失败：{e}"))?;
    log::success("file-ops", "个人配置已保存");
    Ok(read_user_config(game_paths))
}

pub fn get_user_config_folder(game_paths: &GamePaths) -> Option<String> {
    let selected = resolve_candidate(game_paths)?;
    let folder = selected.custom_path.parent()?.to_path_buf();
    let _ = std::fs::create_dir_all(&folder);
    Some(folder.to_string_lossy().to_string())
}
