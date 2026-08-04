//! GitHub Releases 更新检测（纯逻辑）。
//!
//! 对应原 `app/desktop/src/main/services/updater.ts` 的纯计算部分：
//! - `mapRelease`：原始 GitHub API 响应 → 归一化 Release（去掉 tag 的 `v` 前缀、
//!   按资产名判定 desktop/config 包）
//! - `filterNewer` / `buildResult` / `isDismissed`：更新判定与忽略版本
//! - 缓存节流判定（4 小时检查间隔）
//!
//! 网络请求（net.fetch）与缓存文件读写由 tauri 壳层负责。

use crate::version::compare_versions;

/// 归一化后的 Release（对应 TS GitHubRelease）。
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Release {
    pub tag_name: String,
    pub name: String,
    pub body: String,
    pub html_url: String,
    pub published_at: String,
    pub has_desktop_assets: bool,
    pub has_config_assets: bool,
}

/// 更新检测结果（对应 TS UpdateCheckResult）。
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct UpdateCheckResult {
    pub current_version: String,
    pub has_update: bool,
    pub has_desktop_update: bool,
    pub has_config_update: bool,
    pub releases: Vec<Release>,
}

// ─────────────────────────────────────────────
// 资产判定（对应 TS hasDesktopAssets / hasConfigAssets）
// ─────────────────────────────────────────────

pub const DESKTOP_UPDATE_MARKER: &str = "DESKTOP_UPDATE_MARKER";
pub const CONFIG_PACKAGE_REGEX: &str = r"(?i)^SrP-CFG_Runtime_Core\.zip$";

/// desktop 资产 = 存在 DESKTOP_UPDATE_MARKER（仅 desktop 源码真实变更时随 workflow 上传）。
pub fn has_desktop_assets(asset_names: &[String]) -> bool {
    asset_names.iter().any(|name| name == DESKTOP_UPDATE_MARKER)
}

/// config 资产 = 存在 `SrP-CFG_Runtime_Core.zip`（大小写不敏感）。
pub fn has_config_assets(asset_names: &[String]) -> bool {
    asset_names
        .iter()
        .any(|name| name.to_lowercase() == "srp-cfg_runtime_core.zip")
}

// ─────────────────────────────────────────────
// 映射（对应 TS mapRelease）
// ─────────────────────────────────────────────

/// 从 GitHub API 原始字段映射为归一化 Release（tag 去 `v` 前缀）。
pub fn map_release(
    tag_name: &str,
    name: &str,
    body: &str,
    html_url: &str,
    published_at: &str,
    asset_names: &[String],
) -> Release {
    Release {
        tag_name: tag_name.strip_prefix('v').unwrap_or(tag_name).to_string(),
        name: name.to_string(),
        body: body.to_string(),
        html_url: html_url.to_string(),
        published_at: published_at.to_string(),
        has_desktop_assets: has_desktop_assets(asset_names),
        has_config_assets: has_config_assets(asset_names),
    }
}

// ─────────────────────────────────────────────
// 更新判定（对应 TS filterNewer / buildResult / isDismissed）
// ─────────────────────────────────────────────

/// 只保留比当前版本新的 release。
pub fn filter_newer(releases: &[Release], current_version: &str) -> Vec<Release> {
    releases
        .iter()
        .filter(|r| compare_versions(&r.tag_name, current_version) > 0)
        .cloned()
        .collect()
}

/// 排序：版本从新到旧（对应 TS `.sort((a,b) => compareVersions(b,a))`，相等时保持稳定）。
pub fn sort_newest_first(releases: &[Release]) -> Vec<Release> {
    let mut out = releases.to_vec();
    // 对 (a,b)：b > a → Greater → a 排在 b 后 → 降序
    out.sort_by(|a, b| compare_versions(&b.tag_name, &a.tag_name).cmp(&0));
    out
}

/// 组装检查结果。
pub fn build_result(current_version: &str, releases: &[Release]) -> UpdateCheckResult {
    let has_desktop_update = releases.iter().any(|r| r.has_desktop_assets);
    let has_config_update = releases.iter().any(|r| r.has_config_assets);
    UpdateCheckResult {
        current_version: current_version.to_string(),
        has_update: !releases.is_empty(),
        has_desktop_update,
        has_config_update,
        releases: releases.to_vec(),
    }
}

/// 忽略版本判定（对应 TS `isDismissed`）：
/// 已忽略版本 >= 最新 release 版本时，自动检查应视为无更新。
pub fn is_dismissed(newest_release: Option<&str>, dismissed_version: Option<&str>) -> bool {
    match (newest_release, dismissed_version) {
        (Some(latest), Some(dismissed)) => compare_versions(latest, dismissed) <= 0,
        _ => false,
    }
}

/// 缓存是否在检查间隔内（对应 TS 4 小时节流）。
pub fn is_cache_fresh(last_check_time: Option<u64>, now_ms: u64, interval_ms: u64) -> bool {
    last_check_time.is_some_and(|t| now_ms.saturating_sub(t) < interval_ms)
}

// ─────────────────────────────────────────────
// 版本过滤下限（对应 TS fetchUpdateHistory 的 `>= 3.0.0`）
// ─────────────────────────────────────────────

pub fn filter_at_least(releases: &[Release], min_version: &str) -> Vec<Release> {
    releases
        .iter()
        .filter(|r| compare_versions(&r.tag_name, min_version) >= 0)
        .cloned()
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn asset(names: &[&str]) -> Vec<String> {
        names.iter().map(|s| s.to_string()).collect()
    }

    fn release(tag: &str, assets: &[&str]) -> Release {
        map_release(tag, tag, "body", "https://x", "2026-01-01", &asset(assets))
    }

    // ── asset detection ─────────────────────
    #[test]
    fn desktop_marker_detection() {
        assert!(has_desktop_assets(&asset(&["DESKTOP_UPDATE_MARKER"])));
        assert!(!has_desktop_assets(&asset(&["SrP-CFG_Runtime_Core.zip"])));
        assert!(!has_desktop_assets(&[]));
    }

    #[test]
    fn config_package_detection_case_insensitive() {
        assert!(has_config_assets(&asset(&["SrP-CFG_Runtime_Core.zip"])));
        assert!(has_config_assets(&asset(&["srp-cfg_runtime_core.ZIP"])));
        assert!(!has_config_assets(&asset(&["other.zip"])));
        assert!(!has_config_assets(&[]));
    }

    // ── map_release ─────────────────────────
    #[test]
    fn tag_v_prefix_stripped_once() {
        let r = map_release("v3.1.6", "n", "", "u", "t", &[]);
        assert_eq!(r.tag_name, "3.1.6");
        // 无 v 前缀原样保留
        let r2 = map_release("3.1.6", "n", "", "u", "t", &[]);
        assert_eq!(r2.tag_name, "3.1.6");
    }

    #[test]
    fn map_release_flags_assets() {
        let r = map_release(
            "v3.1.6",
            "Release",
            "notes",
            "https://gh/releases/3",
            "2026-08-01T00:00:00Z",
            &asset(&["DESKTOP_UPDATE_MARKER", "SrP-CFG_Runtime_Core.zip"]),
        );
        assert!(r.has_desktop_assets && r.has_config_assets);
        assert_eq!(r.html_url, "https://gh/releases/3");
    }

    // ── filter / sort / build ───────────────
    #[test]
    fn filters_only_newer() {
        let releases = vec![
            release("3.1.6", &[]),
            release("3.1.5", &[]),
            release("2.9.0", &[]),
        ];
        let newer = filter_newer(&releases, "3.1.5");
        assert_eq!(newer.len(), 1);
        assert_eq!(newer[0].tag_name, "3.1.6");
        assert!(filter_newer(&releases, "4.0.0").is_empty());
    }

    #[test]
    fn sorts_newest_first() {
        let releases = vec![release("3.1.5", &[]), release("4.0.0", &[]), release("3.1.6", &[])];
        let sorted = sort_newest_first(&releases);
        let tags: Vec<&str> = sorted.iter().map(|r| r.tag_name.as_str()).collect();
        assert_eq!(tags, vec!["4.0.0", "3.1.6", "3.1.5"]);
    }

    #[test]
    fn build_result_aggregates_flags() {
        let releases = vec![
            release("3.1.6", &["DESKTOP_UPDATE_MARKER"]),
            release("3.1.5", &["SrP-CFG_Runtime_Core.zip"]),
        ];
        let result = build_result("3.1.4", &releases);
        assert!(result.has_update);
        assert!(result.has_desktop_update);
        assert!(result.has_config_update);
        assert_eq!(result.current_version, "3.1.4");

        let none = build_result("3.1.6", &[]);
        assert!(!none.has_update);
    }

    // ── dismissal ───────────────────────────
    #[test]
    fn dismissed_when_latest_not_newer_than_dismissed() {
        // 忽略 3.1.6，最新 3.1.6 → 已忽略
        assert!(is_dismissed(Some("3.1.6"), Some("3.1.6")));
        // 忽略 3.1.7（高于最新）→ 已忽略
        assert!(is_dismissed(Some("3.1.6"), Some("3.1.7")));
        // 忽略 3.1.5，最新 3.1.6 → 有新版本，不忽略
        assert!(!is_dismissed(Some("3.1.6"), Some("3.1.5")));
        // 缺少忽略记录 / 无 release → 不忽略
        assert!(!is_dismissed(Some("3.1.6"), None));
        assert!(!is_dismissed(None, Some("3.1.6")));
    }

    // ── cache throttle ──────────────────────
    #[test]
    fn cache_freshness_uses_interval() {
        let interval = 4 * 60 * 60 * 1000; // 4h
        assert!(is_cache_fresh(Some(1_000), 1_000 + interval - 1, interval));
        assert!(!is_cache_fresh(Some(1_000), 1_000 + interval, interval));
        assert!(!is_cache_fresh(None, 99_999, interval));
        // 时间回拨不 panic（saturating_sub）
        assert!(is_cache_fresh(Some(9_999), 1_000, interval));
    }

    // ── history floor ───────────────────────
    #[test]
    fn history_filters_below_min_version() {
        let releases = vec![release("3.2.0", &[]), release("3.0.0", &[]), release("2.9.9", &[])];
        let kept = filter_at_least(&releases, "3.0.0");
        assert_eq!(kept.len(), 2);
        assert!(kept.iter().all(|r| r.tag_name != "2.9.9"));
    }
}
