//! 版本号比较（纯逻辑）。
//!
//! 对应原 `app/desktop/src/main/services/updater.ts` 的 `compareVersions`：
//! 去掉前缀 `v` 后按 `.` 分段比较前 3 段；缺失段视为 0；
//! 非数字段解析失败视为 0（与 JS `Number()` 对 NaN 的比较语义近似）。

/// 返回 `1`（a > b）、`-1`（a < b）、`0`（相等）。
pub fn compare_versions(a: &str, b: &str) -> i32 {
    let pa = parse_segments(a);
    let pb = parse_segments(b);
    for i in 0..3 {
        let x = pa.get(i).copied().unwrap_or(0);
        let y = pb.get(i).copied().unwrap_or(0);
        if x > y {
            return 1;
        }
        if x < y {
            return -1;
        }
    }
    0
}

fn parse_segments(v: &str) -> Vec<i32> {
    // 只去掉一个前缀 v（对应 TS `replace(/^v/, "")`）；
    // 段解析失败视为 0（对应 TS `Number()` → NaN → `|| 0`）。
    v.strip_prefix('v')
        .unwrap_or(v)
        .split('.')
        .map(|s| s.parse::<i32>().unwrap_or(0))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn equal_versions() {
        assert_eq!(compare_versions("3.1.6", "3.1.6"), 0);
        assert_eq!(compare_versions("v3.1.6", "3.1.6"), 0);
    }

    #[test]
    fn greater_and_less() {
        assert_eq!(compare_versions("3.1.7", "3.1.6"), 1);
        assert_eq!(compare_versions("3.2.0", "3.1.99"), 1);
        assert_eq!(compare_versions("4.0.0", "3.9.9"), 1);
        assert_eq!(compare_versions("3.1.6", "3.1.7"), -1);
        assert_eq!(compare_versions("3.1.6", "3.2.0"), -1);
    }

    #[test]
    fn missing_segments_treated_as_zero() {
        assert_eq!(compare_versions("3.1", "3.1.0"), 0);
        assert_eq!(compare_versions("3.1", "3.1.6"), -1);
        assert_eq!(compare_versions("3.1.6", "3.1"), 1);
        assert_eq!(compare_versions("3", "3.0.0"), 0);
    }

    #[test]
    fn prerelease_suffix_treated_as_zero_segment() {
        // "6-beta" → Number() → NaN → `|| 0` → 0，因此 3.1.6-beta < 3.1.6
        assert_eq!(compare_versions("3.1.6-beta", "3.1.6"), -1);
        assert_eq!(compare_versions("v3.1.6-beta", "3.1.6"), -1);
        assert_eq!(compare_versions("3.1.6-beta", "3.1.5"), -1); // 0 段 vs 5 段
    }

    #[test]
    fn v_prefix_only_stripped_once() {
        // "vv3.1.6" 只去一个 v → 段 "v3" 解析失败 → 0 → vv3.1.6 < 3.1.6
        assert_eq!(compare_versions("vv3.1.6", "3.1.6"), -1);
        assert_eq!(compare_versions("v3.1.6", "3.1.6"), 0);
    }
}
