//! GitHub Releases 更新检测壳层。
//!
//! 对应原 `app/desktop/src/main/services/updater.ts`：
//! - 网络请求（ureq）→ core `map_release` / `filter_newer` / `build_result` /
//!   `is_dismissed` / `is_cache_fresh` / `filter_at_least` / `sort_newest_first`
//! - 缓存读写（update-cache/cache.json）+ 4 小时节流

use std::fs;
use std::path::PathBuf;

use srp_cfg_core::{
    build_result, filter_at_least, filter_newer, is_cache_fresh, is_dismissed, map_release,
    sort_newest_first, Release, UpdateCheckResult,
};

use crate::ctx;

const RELEASES_API: &str = "https://api.github.com/repos/RolinShmily/SrP-CFG_ForCS2/releases";
const CHECK_INTERVAL_MS: u64 = 4 * 60 * 60 * 1000;
const HTTP_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(8);
const HISTORY_MIN_VERSION: &str = "3.0.0";

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct UpdateCache {
    pub last_check_time: Option<u64>,
    pub dismissed_version: Option<String>,
    pub cached_releases: Option<Vec<Release>>,
    pub cached_all_releases: Option<Vec<Release>>,
}

fn cache_dir() -> PathBuf {
    ctx::user_data_dir().join("update-cache")
}
fn cache_file() -> PathBuf {
    cache_dir().join("cache.json")
}

fn load_cache() -> Option<UpdateCache> {
    fs::read_to_string(cache_file())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
}

fn save_cache(cache: &UpdateCache) {
    let _ = fs::create_dir_all(cache_dir());
    let _ = fs::write(cache_file(), serde_json::to_string_pretty(cache).unwrap_or_default());
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn get_current_version() -> String {
    crate::ctx::try_handle()
        .map(|h| h.package_info().version.to_string())
        .unwrap_or_else(|| "0.0.0".to_string())
}

// ── 网络 ───────────────────────────────────────────────────────

#[derive(Debug, serde::Deserialize)]
struct GitHubAssetRaw {
    name: String,
}

#[derive(Debug, serde::Deserialize)]
struct GitHubReleaseRaw {
    tag_name: String,
    /// GitHub API 对无标题的 release 返回 null（如 v3.1.4 的 name 为 null）。
    #[serde(default)]
    name: Option<String>,
    /// GitHub API 对无正文的 release 返回 null（如 v3.1.4 的 body 为 null）；
    /// 若按 String 严格反序列化会导致整个列表解析失败（L2 遗留验收实测发现）。
    #[serde(default)]
    body: Option<String>,
    html_url: String,
    published_at: String,
    assets: Vec<GitHubAssetRaw>,
}

fn fetch_all_releases() -> Result<Vec<GitHubReleaseRaw>, String> {
    let agent = ureq::Agent::config_builder()
        .timeout_global(Some(HTTP_TIMEOUT))
        // ureq 3.3 默认 TLS provider 为 Rustls（即使未编译该 feature 也会在 https 时 panic）；
        // 本工程编译 native-tls（Windows SChannel），必须显式指定 provider。
        .tls_config(
            ureq::tls::TlsConfig::builder()
                .provider(ureq::tls::TlsProvider::NativeTls)
                .build(),
        )
        .build()
        .new_agent();
    let resp = agent
        .get(&format!("{RELEASES_API}?per_page=10"))
        .header("User-Agent", "SrP-CFG-Installer")
        .call()
        .map_err(|e| format!("HTTP {e}"))?;
    let body = resp
        .into_body()
        .read_to_string()
        .map_err(|e| e.to_string())?;
    serde_json::from_str(&body).map_err(|e| e.to_string())
}

fn map_raw(r: &GitHubReleaseRaw) -> Release {
    let asset_names: Vec<String> = r.assets.iter().map(|a| a.name.clone()).collect();
    map_release(
        &r.tag_name,
        r.name.as_deref().unwrap_or(""),
        r.body.as_deref().unwrap_or(""),
        &r.html_url,
        &r.published_at,
        &asset_names,
    )
}

// ── 核心检查（对应 TS `checkForUpdate`）────────────────────────

pub fn check_for_update(force: bool) -> UpdateCheckResult {
    let current = get_current_version();
    let cache = load_cache();

    // 自动检查 + 缓存节流
    if !force {
        if let Some(c) = &cache {
            if c.last_check_time.is_some_and(|t| {
                is_cache_fresh(Some(t), now_ms(), CHECK_INTERVAL_MS)
            }) {
                let all = c
                    .cached_all_releases
                    .clone()
                    .or_else(|| c.cached_releases.clone())
                    .unwrap_or_default();
                let newer = filter_newer(&all, &current);
                if is_dismissed(newer.first().map(|r| r.tag_name.as_str()), c.dismissed_version.as_deref()) {
                    return build_result(&current, &[]);
                }
                return build_result(&current, &newer);
            }
        }
    }

    match fetch_all_releases() {
        Ok(raw) => {
            let mut all: Vec<Release> = raw.iter().map(map_raw).collect();
            all = sort_newest_first(&all);
            let newer = filter_newer(&all, &current);
            save_cache(&UpdateCache {
                last_check_time: Some(now_ms()),
                dismissed_version: cache.as_ref().and_then(|c| c.dismissed_version.clone()),
                cached_releases: Some(newer.clone()),
                cached_all_releases: Some(all),
            });
            if !force {
                if is_dismissed(
                    newer.first().map(|r| r.tag_name.as_str()),
                    cache.as_ref().and_then(|c| c.dismissed_version.as_deref()),
                ) {
                    return build_result(&current, &[]);
                }
            }
            build_result(&current, &newer)
        }
        Err(_) => {
            // 网络失败，使用缓存
            let all = cache
                .as_ref()
                .and_then(|c| c.cached_all_releases.clone())
                .or_else(|| cache.as_ref().and_then(|c| c.cached_releases.clone()))
                .unwrap_or_default();
            let newer = filter_newer(&all, &current);
            if !force {
                if is_dismissed(
                    newer.first().map(|r| r.tag_name.as_str()),
                    cache.as_ref().and_then(|c| c.dismissed_version.as_deref()),
                ) {
                    return build_result(&current, &[]);
                }
            }
            build_result(&current, &newer)
        }
    }
}

// ── 更新历史 / 忽略 / 最新版本 ────────────────────────────────

pub fn fetch_update_history() -> Option<Vec<Release>> {
    match fetch_all_releases() {
        Ok(raw) => {
            let mut all: Vec<Release> = raw.iter().map(map_raw).collect();
            all = filter_at_least(&all, HISTORY_MIN_VERSION);
            all = sort_newest_first(&all);
            let mut cache = load_cache().unwrap_or(UpdateCache {
                last_check_time: None,
                dismissed_version: None,
                cached_releases: None,
                cached_all_releases: None,
            });
            cache.cached_all_releases = Some(all.clone());
            save_cache(&cache);
            Some(all)
        }
        Err(_) => {
            let cache = load_cache()?;
            let mut cached = filter_at_least(
                cache.cached_all_releases.as_deref().unwrap_or(&[]),
                HISTORY_MIN_VERSION,
            );
            cached = sort_newest_first(&cached);
            if cached.is_empty() {
                None
            } else {
                Some(cached)
            }
        }
    }
}

pub fn dismiss_version(version: &str) {
    let mut cache = load_cache().unwrap_or(UpdateCache {
        last_check_time: None,
        dismissed_version: None,
        cached_releases: None,
        cached_all_releases: None,
    });
    cache.dismissed_version = Some(version.to_string());
    save_cache(&cache);
}

pub fn get_latest_version() -> String {
    let cache = load_cache();
    if let Some(c) = &cache {
        if c.last_check_time.is_some_and(|t| is_cache_fresh(Some(t), now_ms(), CHECK_INTERVAL_MS))
            && c.cached_all_releases.as_ref().is_some_and(|v| !v.is_empty())
        {
            return c
                .cached_all_releases
                .as_ref()
                .and_then(|v| v.first())
                .map(|r| r.tag_name.clone())
                .unwrap_or_else(|| get_current_version());
        }
    }
    match fetch_all_releases() {
        Ok(raw) => {
            if raw.is_empty() {
                get_current_version()
            } else {
                map_raw(&raw[0]).tag_name
            }
        }
        Err(_) => cache
            .as_ref()
            .and_then(|c| c.cached_all_releases.as_ref())
            .and_then(|v| v.first())
            .map(|r| r.tag_name.clone())
            .unwrap_or_else(|| get_current_version()),
    }
}
