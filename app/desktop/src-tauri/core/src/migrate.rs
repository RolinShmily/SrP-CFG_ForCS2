//! 旧版 Electron 数据目录 → Tauri 原生数据目录的一次性迁移（D2）。
//!
//! 纯决策逻辑：壳层传入候选路径集合与存在性，本模块产出迁移计划。
//! 文件复制由壳层（`src-tauri/src/services/migrate.rs`）执行。

/// 旧版 Electron 时代的数据根目录名（`%APPDATA%/srp-cfg` 下的子项）。
pub const LEGACY_DATA_ROOT: &str = "srp-cfg";

/// 迁移计划中的单个动作。
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MigrationAction {
    /// 需要从旧目录复制/移动到目标
    Move { name: String },
    /// 该数据已存在于新位置，无需迁移
    Skip { name: String },
    /// 旧位置没有该数据
    Absent { name: String },
}

/// 计算迁移计划。
///
/// - `legacy_entries`：旧 `%APPDATA%/srp-cfg` 下的顶层条目名（壳层列目录得到）
/// - `target_entries`：新 `app_data_dir()` 下已存在的条目名（壳层列目录得到）
///
/// 规则：旧目录存在且新位置不存在 → Move；两边都有 → Skip（以新为准）；
/// 旧目录没有 → Absent（无需处理）。
pub fn plan_migration(
    legacy_entries: &[String],
    target_entries: &[String],
) -> Vec<MigrationAction> {
    let mut actions = Vec::with_capacity(legacy_entries.len());
    for name in legacy_entries {
        if target_entries.iter().any(|t| t == name) {
            actions.push(MigrationAction::Skip { name: name.clone() });
        } else {
            actions.push(MigrationAction::Move { name: name.clone() });
        }
    }
    actions
}

/// 是否需要迁移：旧目录存在且至少有 1 个条目需要 Move。
pub fn should_migrate(actions: &[MigrationAction]) -> bool {
    actions
        .iter()
        .any(|a| matches!(a, MigrationAction::Move { .. }))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn names(items: &[&str]) -> Vec<String> {
        items.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn moves_entries_missing_in_target() {
        let actions = plan_migration(
            &names(&["install.json", "save.json", "uploads"]),
            &names(&["save.json"]),
        );
        assert_eq!(
            actions,
            vec![
                MigrationAction::Move { name: "install.json".into() },
                MigrationAction::Skip { name: "save.json".into() },
                MigrationAction::Move { name: "uploads".into() },
            ]
        );
        assert!(should_migrate(&actions));
    }

    #[test]
    fn no_migration_when_all_present_or_empty() {
        let actions = plan_migration(&names(&["install.json"]), &names(&["install.json"]));
        assert_eq!(actions, vec![MigrationAction::Skip { name: "install.json".into() }]);
        assert!(!should_migrate(&actions));

        let empty = plan_migration(&[], &[]);
        assert!(empty.is_empty());
        assert!(!should_migrate(&empty));
    }

    #[test]
    fn absent_entries_are_not_part_of_plan() {
        // 旧目录不存在的条目根本不会出现在输入里（壳层只列旧目录实际内容）
        let actions = plan_migration(&names(&["vcfg"]), &names(&[]));
        assert_eq!(actions, vec![MigrationAction::Move { name: "vcfg".into() }]);
    }

    #[test]
    fn target_wins_on_conflict() {
        // 两边都有同名条目 → Skip（以新位置为准，不覆盖）
        let actions = plan_migration(
            &names(&["install.json", "res.json"]),
            &names(&["install.json"]),
        );
        assert_eq!(
            actions,
            vec![
                MigrationAction::Skip { name: "install.json".into() },
                MigrationAction::Move { name: "res.json".into() },
            ]
        );
    }
}
