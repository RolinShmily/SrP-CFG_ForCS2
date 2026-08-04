//! VCFG / CFG 读取壳层 → core 纯逻辑。
//!
//! 对应原 `app/desktop/src/main/services/vcfg.ts` 的 I/O 部分：
//! 读取文件内容后调用 core 的 `parse_vdf` / `child` / `string_entries` /
//! `parse_cfg_convars` / `snapshot_to_cfg` / `normalize_cfg_value`。

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use srp_cfg_core::{
    child, count_entries, parse_cfg_convars, parse_vdf, snapshot_to_cfg, string_entries,
    SnapshotToCfgOptions, VdfNode,
};

use crate::models::{VcfgSnapshot, VcfgStateSummary};

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn read_vdf(path: &Path) -> Option<VdfNode> {
    std::fs::read_to_string(path).ok().and_then(|c| parse_vdf(&c))
}

fn string_map(node: Option<&VdfNode>) -> HashMap<String, String> {
    node.map(|n| string_entries(n).into_iter().collect())
        .unwrap_or_default()
}

/// 对应 TS `captureVcfgSnapshot`。
pub fn capture_vcfg_snapshot(user_cfg_path: &str) -> VcfgSnapshot {
    let dir = Path::new(user_cfg_path);
    let keys = read_vdf(&dir.join("cs2_user_keys_0_slot0.vcfg"));
    let user_convars = read_vdf(&dir.join("cs2_user_convars_0_slot0.vcfg"));
    let machine_convars = read_vdf(&dir.join("cs2_machine_convars.vcfg"));

    VcfgSnapshot {
        schema_version: 1,
        captured_at: now_ms(),
        user_cfg_path: user_cfg_path.to_string(),
        bindings: string_map(keys.as_ref().and_then(|k| child(k, &["config", "bindings"]))),
        analog_bindings: string_map(keys.as_ref().and_then(|k| child(k, &["config", "analogbindings"]))),
        user_convars: string_map(user_convars.as_ref().and_then(|k| child(k, &["config", "convars"]))),
        machine_convars: string_map(machine_convars.as_ref().and_then(|k| child(k, &["config", "convars"]))),
    }
}

/// 对应 TS `inspectVcfgState`。
pub fn inspect_vcfg_state(user_cfg_path: Option<&str>) -> VcfgStateSummary {
    let Some(user_cfg_path) = user_cfg_path else {
        return VcfgStateSummary::default();
    };
    let dir = Path::new(user_cfg_path);
    let keys_path = dir.join("cs2_user_keys_0_slot0.vcfg");
    let user_convars_path = dir.join("cs2_user_convars_0_slot0.vcfg");
    let machine_convars_path = dir.join("cs2_machine_convars.vcfg");

    let keys = read_vdf(&keys_path);
    let user_convars = read_vdf(&user_convars_path);
    let machine_convars = read_vdf(&machine_convars_path);
    let bindings = string_map(keys.as_ref().and_then(|k| child(k, &["config", "bindings"])));

    VcfgStateSummary {
        available: keys.is_some() || user_convars.is_some() || machine_convars.is_some(),
        bindings: bindings.len(),
        analog_bindings: count_entries(
            keys.as_ref().and_then(|k| child(k, &["config", "analogbindings"])).unwrap_or(&HashMap::new()),
        ),
        cloud_convars: count_entries(
            user_convars.as_ref().and_then(|k| child(k, &["config", "convars"])).unwrap_or(&HashMap::new()),
        ),
        machine_convars: count_entries(
            machine_convars.as_ref().and_then(|k| child(k, &["config", "convars"])).unwrap_or(&HashMap::new()),
        ),
        has_cloud_mirror: {
            let k = format!("{}.vcfg_lastclouded", keys_path.to_string_lossy());
            let u = format!("{}.vcfg_lastclouded", user_convars_path.to_string_lossy());
            Path::new(&k).exists() || Path::new(&u).exists()
        },
        has_video_config: dir.join("cs2_video.txt").exists(),
    }
}

/// 对应 TS `parseCfgConvars`：读文件 → core 解析（跳过 echo/exec/bind/注释）。
pub fn parse_cfg_convars_file(path: &Path) -> HashMap<String, String> {
    std::fs::read_to_string(path)
        .map(|c| parse_cfg_convars(&c).into_iter().collect())
        .unwrap_or_default()
}

/// 对应 TS `saveVcfgBaseline`：首次创建 baseline.json。
pub fn save_vcfg_baseline(
    user_cfg_path: &str,
    snapshot_root: &str,
    account_id: &str,
) -> (PathBuf, bool) {
    let account_dir = Path::new(snapshot_root).join(account_id);
    let baseline_path = account_dir.join("baseline.json");
    if baseline_path.exists() {
        return (baseline_path, false);
    }
    let _ = std::fs::create_dir_all(&account_dir);
    let snapshot = capture_vcfg_snapshot(user_cfg_path);
    let json = serde_json::to_string_pretty(&snapshot).unwrap_or_default();
    let _ = std::fs::write(&baseline_path, json);
    (baseline_path, true)
}

/// 快照 → CFG 文本（core 纯逻辑）。
pub fn snapshot_to_cfg_text(
    snapshot: &VcfgSnapshot,
    options: &SnapshotToCfgOptions,
    baseline: &HashMap<String, String>,
) -> String {
    let bindings: Vec<(String, String)> = snapshot.bindings.clone().into_iter().collect();
    let analog: Vec<(String, String)> = snapshot.analog_bindings.clone().into_iter().collect();
    let user: Vec<(String, String)> = snapshot.user_convars.clone().into_iter().collect();
    let machine: Vec<(String, String)> = snapshot.machine_convars.clone().into_iter().collect();
    snapshot_to_cfg(&bindings, &analog, &user, &machine, options, baseline)
}

