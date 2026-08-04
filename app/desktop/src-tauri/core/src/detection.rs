//! Steam / CS2 路径检测（纯逻辑）。
//!
//! 对应原 `app/desktop/src/main/services/detection.ts` 的纯计算部分：
//! - `parseLibraryPaths`：libraryfolders.vdf 的 "path" 条目提取（含 `\\` → `\` 归一化）
//! - `parseAcfValue` / `cs2GameDir` / StateFlags 判定：appmanifest_730.acf → CS2 安装状态
//! - `detectSteamUsers`：loginusers.vdf 用户块解析、当前用户选择（auto-login → 最近使用 → 唯一账号）
//! - `steamId64` → `accountId`（BigInt 减法）
//!
//! 注册表读取（winreg）、文件存在性/目录扫描（fs）由 tauri 壳层负责；
//! 本模块只做字符串/数值解析。路径统一用 `/` 分隔，壳层按平台归一化。

// ─────────────────────────────────────────────
// libraryfolders.vdf（对应 TS parseLibraryPaths）
// ─────────────────────────────────────────────

/// 提取 `"path" "..."` 条目并把 `\\` 归一化为 `\`（TS `replace(/\\\\/g, "\\")`）。
pub fn parse_library_paths(vdf_content: &str) -> Vec<String> {
    let mut paths = Vec::new();
    let bytes = vdf_content.as_bytes();
    let n = bytes.len();
    let mut i = 0;

    while i < n {
        // 找 `"path"` 字面量
        let lit = b"\"path\"";
        if bytes[i..].starts_with(lit) {
            i += lit.len();
            // 跳过空白
            while i < n && bytes[i].is_ascii_whitespace() {
                i += 1;
            }
            if i < n && bytes[i] == b'"' {
                i += 1;
                let start = i;
                while i < n && bytes[i] != b'"' {
                    i += 1;
                }
                let raw = &vdf_content[start..i];
                paths.push(raw.replace(r"\\", r"\"));
                i += 1;
                continue;
            }
        }
        i += 1;
    }
    paths
}

// ─────────────────────────────────────────────
// appmanifest_730.acf（对应 TS parseAcfValue / cs2GameDir / StateFlags）
// ─────────────────────────────────────────────

/// 提取 ACF 中 `"key" "value"`（TS `new RegExp(`"${key}"\s+"([^"]+)"`)`）。
pub fn parse_acf_value(content: &str, key: &str) -> Option<String> {
    let needle = format!("\"{key}\"");
    let bytes = content.as_bytes();
    let n = bytes.len();
    let mut i = 0;

    while i < n {
        if bytes[i..].starts_with(needle.as_bytes()) {
            i += needle.len();
            while i < n && bytes[i].is_ascii_whitespace() {
                i += 1;
            }
            if i < n && bytes[i] == b'"' {
                i += 1;
                let start = i;
                while i < n && bytes[i] != b'"' {
                    i += 1;
                }
                return Some(content[start..i].to_string());
            }
        }
        i += 1;
    }
    None
}

/// 默认 CS2 安装目录名（TS 常量 "Counter-Strike Global Offensive"）。
pub const DEFAULT_CS2_FOLDER: &str = "Counter-Strike Global Offensive";

/// CS2 游戏目录（library/steamapps/common/<installdir|默认名>）。
/// 返回 `/` 分隔的逻辑路径；installdir 为空时用默认名（对应 TS `cs2GameDir`）。
pub fn cs2_game_dir(library: &str, acf_content: Option<&str>) -> String {
    let folder = acf_content
        .and_then(|c| parse_acf_value(c, "installdir"))
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| DEFAULT_CS2_FOLDER.to_string());
    format!("{library}/steamapps/common/{folder}")
}

/// CS2 安装状态（对应 TS `detectCs2InstallState` 的每个 manifest 判定分支）：
/// - manifest 不存在 / StateFlags 缺失 / 非 4 位 → None（继续下一个库）
/// - `(flags & 4) != 0 || flags == 4` 判定已装；再按 `(flags & 2)` 区分 needs-update
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Cs2InstallState {
    Installed,
    NeedsUpdate,
    NotInstalled,
}

pub fn cs2_manifest_state(acf_content: Option<&str>) -> Option<Cs2InstallState> {
    let content = acf_content?;
    let flags = parse_acf_value(content, "StateFlags")?.parse::<u64>().ok()?;
    if (flags & 4) != 0 || flags == 4 {
        Some(if (flags & 2) != 0 {
            Cs2InstallState::NeedsUpdate
        } else {
            Cs2InstallState::Installed
        })
    } else {
        None
    }
}

// ─────────────────────────────────────────────
// loginusers.vdf（对应 TS detectSteamUsers）
// ─────────────────────────────────────────────

pub const STEAM_ID_OFFSET: u64 = 76_561_197_960_265_728;

/// steamId64 → accountId（TS `BigInt(steamId64) - STEAM_ID_OFFSET`）。
pub fn steam_id64_to_account_id(steam_id64: &str) -> Option<String> {
    let id: u64 = steam_id64.parse().ok()?;
    Some((id.saturating_sub(STEAM_ID_OFFSET)).to_string())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SteamUser {
    pub steam_id64: String,
    pub account_id: String,
    pub persona_name: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct LoginUsers {
    pub users: Vec<SteamUser>,
    pub current_user: Option<SteamUser>,
    pub has_auto_login_user: bool,
}

fn block_value(block: &str, key: &str) -> Option<String> {
    parse_acf_value(block, key)
}

/// 解析 loginusers.vdf（TS 用户块正则 `"(\d{17,})"\s*\{([^}]*)\}` + 块内字段提取）。
/// 当前用户选择顺序：显式 auto-login 标记（AutoLogin/AllowAutoLogin/mostrecent）→
/// Timestamp 最大 → 唯一账号。无用户记录时为空。
pub fn parse_login_users(content: &str) -> LoginUsers {
    let mut users: Vec<SteamUser> = Vec::new();
    let mut current: Option<SteamUser> = None;
    let mut max_ts_user: Option<SteamUser> = None;
    let mut max_ts: i64 = -1;

    let bytes = content.as_bytes();
    let n = bytes.len();
    let mut i = 0;

    while i < n {
        // 找 `"` 开头的 17+ 位数字（steamId64），后跟 `{`（跳过空白）
        if bytes[i] == b'"' {
            let mut j = i + 1;
            let mut digits = 0usize;
            while j < n && bytes[j].is_ascii_digit() {
                digits += 1;
                j += 1;
            }
            if digits >= 17 && j < n && bytes[j] == b'"' {
                let steam_id64 = content[i + 1..j].to_string();
                j += 1;
                while j < n && bytes[j].is_ascii_whitespace() {
                    j += 1;
                }
                if j < n && bytes[j] == b'{' {
                    // 块结束：第一个 `}`（与 TS `[^}]*` 一致，loginusers 无嵌套）
                    let start = j + 1;
                    let end = content[start..]
                        .find('}')
                        .map(|pos| start + pos)
                        .unwrap_or(n);
                    let block = &content[start..end];

                    let persona_name = block_value(block, "PersonaName");
                    let auto_login = block_value(block, "AutoLogin").as_deref() == Some("1");
                    let allow_auto_login = block_value(block, "AllowAutoLogin").as_deref() == Some("1");
                    let most_recent = block_value(block, "mostrecent").as_deref() == Some("1");
                    let is_auto_login = auto_login || allow_auto_login || most_recent;

                    let timestamp = block_value(block, "Timestamp")
                        .and_then(|t| t.parse::<i64>().ok())
                        .unwrap_or(0);

                    let account_id = steam_id64_to_account_id(&steam_id64).unwrap_or_default();
                    let user = SteamUser {
                        steam_id64: steam_id64.clone(),
                        account_id,
                        persona_name,
                    };
                    users.push(user.clone());

                    if is_auto_login && current.is_none() {
                        current = Some(user.clone());
                    }
                    if timestamp > max_ts {
                        max_ts = timestamp;
                        max_ts_user = Some(user);
                    }
                    i = end + 1;
                    continue;
                }
            }
        }
        i += 1;
    }

    // 回退：无显式 auto-login → 最近使用；仍无 → 唯一账号
    let current = match current {
        Some(user) => Some(user),
        None => max_ts_user
            .or_else(|| (users.len() == 1).then(|| users[0].clone())),
    };

    LoginUsers {
        users,
        has_auto_login_user: current.is_some(),
        current_user: current,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── parse_library_paths ─────────────────
    #[test]
    fn extracts_library_paths_and_normalizes_backslashes() {
        let vdf = r#""libraryfolders"
{
  "0"
  {
    "path" "C:\Program Files (x86)\Steam\steamapps"
    "label" ""
  }
  "1"
  {
    "path" "D:\SteamLibrary\steamapps"
  }
}"#;
        assert_eq!(
            parse_library_paths(vdf),
            vec![
                r"C:\Program Files (x86)\Steam\steamapps".to_string(),
                r"D:\SteamLibrary\steamapps".to_string(),
            ]
        );
    }

    #[test]
    fn empty_library_vdf_yields_no_paths() {
        assert!(parse_library_paths("").is_empty());
        assert!(parse_library_paths("{ }").is_empty());
    }

    // ── parse_acf_value / cs2_game_dir ──────
    #[test]
    fn acf_value_extraction() {
        let acf = r#""AppID" "730"
"installdir" "Counter-Strike Global Offensive"
"StateFlags" "4"
"name" "Counter-Strike 2""#;
        assert_eq!(parse_acf_value(acf, "installdir"), Some("Counter-Strike Global Offensive".to_string()));
        assert_eq!(parse_acf_value(acf, "StateFlags"), Some("4".to_string()));
        assert_eq!(parse_acf_value(acf, "missing"), None);
    }

    #[test]
    fn game_dir_uses_installdir_or_default() {
        let acf = Some(r#""installdir" "Counter-Strike Global Offensive""#);
        assert_eq!(
            cs2_game_dir("C:/Steam", acf),
            "C:/Steam/steamapps/common/Counter-Strike Global Offensive"
        );
        // 无 ACF → 默认目录名
        assert_eq!(
            cs2_game_dir("C:/Steam", None),
            "C:/Steam/steamapps/common/Counter-Strike Global Offensive"
        );
        // installdir 为空字符串 → 回退默认
        assert_eq!(
            cs2_game_dir("C:/Steam", Some(r#""installdir" ""#)),
            "C:/Steam/steamapps/common/Counter-Strike Global Offensive"
        );
    }

    // ── cs2_manifest_state ──────────────────
    #[test]
    fn manifest_states_by_flags() {
        // StateFlags=4：已安装
        assert_eq!(
            cs2_manifest_state(Some(r#""StateFlags" "4""#)),
            Some(Cs2InstallState::Installed)
        );
        // StateFlags=6（4|2）：已安装且有更新
        assert_eq!(
            cs2_manifest_state(Some(r#""StateFlags" "6""#)),
            Some(Cs2InstallState::NeedsUpdate)
        );
        // 0 / 2：未完成安装 → None（继续下一个库）
        assert_eq!(cs2_manifest_state(Some(r#""StateFlags" "0""#)), None);
        assert_eq!(cs2_manifest_state(Some(r#""StateFlags" "2""#)), None);
        // 无 StateFlags / 无 manifest → None
        assert_eq!(cs2_manifest_state(Some(r#""AppID" "730""#)), None);
        assert_eq!(cs2_manifest_state(None), None);
        // 非法数字 → None
        assert_eq!(cs2_manifest_state(Some(r#""StateFlags" "abc""#)), None);
    }

    // ── steam_id64_to_account_id ────────────
    #[test]
    fn account_id_offset_subtraction() {
        assert_eq!(steam_id64_to_account_id("76561197960265728"), Some("0".to_string()));
        assert_eq!(steam_id64_to_account_id("76561198032473940"), Some("72208212".to_string()));
        assert_eq!(steam_id64_to_account_id("not-a-number"), None);
    }

    // ── parse_login_users ───────────────────
    const LOGIN_USERS: &str = r#""users"
{
  "76561197960265728"
  {
    "AccountName" "first"
    "PersonaName" "Alice"
    "Timestamp" "1700000000"
  }
  "76561198032473940"
  {
    "AccountName" "second"
    "PersonaName" "Bob"
    "Timestamp" "1800000000"
    "mostrecent" "1"
  }
}"#;

    #[test]
    fn parses_users_and_picks_auto_login() {
        let parsed = parse_login_users(LOGIN_USERS);
        assert_eq!(parsed.users.len(), 2);
        assert_eq!(parsed.users[0].persona_name.as_deref(), Some("Alice"));
        assert_eq!(parsed.users[1].account_id, "72208212");
        // mostrecent=1 → Bob 为当前用户
        assert_eq!(parsed.current_user.as_ref().unwrap().persona_name.as_deref(), Some("Bob"));
        assert!(parsed.has_auto_login_user);
    }

    #[test]
    fn falls_back_to_latest_timestamp() {
        let content = r#""users"
{
  "76561197960265728"
  {
    "PersonaName" "Old"
    "Timestamp" "1000"
  }
  "76561198032473940"
  {
    "PersonaName" "New"
    "Timestamp" "9999"
  }
}"#;
        let parsed = parse_login_users(content);
        assert_eq!(parsed.current_user.unwrap().persona_name.as_deref(), Some("New"));
        assert!(parsed.has_auto_login_user);
    }

    #[test]
    fn single_user_is_current() {
        let content = r#""users"
{
  "76561197960265728"
  {
    "PersonaName" "Solo"
  }
}"#;
        let parsed = parse_login_users(content);
        assert_eq!(parsed.users.len(), 1);
        assert_eq!(parsed.current_user.unwrap().persona_name.as_deref(), Some("Solo"));
    }

    #[test]
    fn empty_or_invalid_content() {
        let parsed = parse_login_users("");
        assert!(parsed.users.is_empty());
        assert!(parsed.current_user.is_none());
        assert!(!parsed.has_auto_login_user);

        let junk = parse_login_users("{\"notusers\" {}}");
        assert!(junk.users.is_empty());
    }

    #[test]
    fn auto_login_field_marked() {
        let content = r#""users"
{
  "76561197960265728"
  {
    "PersonaName" "A"
    "AutoLogin" "1"
  }
  "76561198032473940"
  {
    "PersonaName" "B"
    "Timestamp" "9000"
  }
}"#;
        let parsed = parse_login_users(content);
        // AutoLogin=1 优先于 Timestamp
        assert_eq!(parsed.current_user.unwrap().persona_name.as_deref(), Some("A"));
    }
}
