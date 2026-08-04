//! 追加安装冲突决策（纯逻辑）。
//!
//! 对应原 `app/desktop/src/main/services/installer.ts` 的 `checkAppendConflicts`。
//! 文件存在性检查（fs）由壳层完成，本模块只做集合运算与阈值决策。

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CategoryKey {
    GameCfg,
    UserCfg,
    Annotations,
    Video,
}

impl CategoryKey {
    pub fn as_str(&self) -> &'static str {
        match self {
            CategoryKey::GameCfg => "gameCfg",
            CategoryKey::UserCfg => "userCfg",
            CategoryKey::Annotations => "annotations",
            CategoryKey::Video => "video",
        }
    }
}

/// 单个分类的输入：staging 顶层条目名 + 目标目录顶层条目名。
#[derive(Debug, Clone)]
pub struct CategoryInput {
    pub key: CategoryKey,
    pub staging_names: Vec<String>,
    pub target_names: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AppendConflict {
    pub category: CategoryKey,
    pub names: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AppendConflictDecision {
    /// 冲突 > 3：调用方应直接拒绝
    Reject,
    /// 有冲突（≤ 3）：调用方应弹窗让用户确认
    Confirm(Vec<AppendConflict>),
    /// 无冲突：继续安装
    Proceed,
}

/// 冲突决策：
/// - `use_personal_cfg = true` 时跳过 gameCfg；`false` 时跳过 userCfg
/// - 冲突名 = staging 顶层名 ∩ 目标目录已存在名（保持 staging 顺序）
/// - 总冲突数 > 3 → Reject；> 0 → Confirm；否则 Proceed
pub fn decide_append_conflicts(
    categories: &[CategoryInput],
    use_personal_cfg: bool,
) -> AppendConflictDecision {
    let mut conflicts: Vec<AppendConflict> = Vec::new();

    for cat in categories {
        if cat.key == CategoryKey::GameCfg && use_personal_cfg {
            continue;
        }
        if cat.key == CategoryKey::UserCfg && !use_personal_cfg {
            continue;
        }
        if cat.staging_names.is_empty() {
            continue;
        }

        let names: Vec<String> = cat
            .staging_names
            .iter()
            .filter(|name| cat.target_names.contains(name))
            .cloned()
            .collect();

        if !names.is_empty() {
            conflicts.push(AppendConflict {
                category: cat.key,
                names,
            });
        }
    }

    let total: usize = conflicts.iter().map(|c| c.names.len()).sum();

    if total > 3 {
        return AppendConflictDecision::Reject;
    }
    if total > 0 {
        return AppendConflictDecision::Confirm(conflicts);
    }
    AppendConflictDecision::Proceed
}

#[cfg(test)]
mod tests {
    use super::*;

    fn input(key: CategoryKey, staging: &[&str], target: &[&str]) -> CategoryInput {
        CategoryInput {
            key,
            staging_names: staging.iter().map(|s| s.to_string()).collect(),
            target_names: target.iter().map(|s| s.to_string()).collect(),
        }
    }

    #[test]
    fn no_conflicts_proceeds() {
        let decision = decide_append_conflicts(
            &[
                input(CategoryKey::GameCfg, &["autoexec.cfg"], &["custom.cfg"]),
                input(CategoryKey::Annotations, &["dust2/"], &[]),
            ],
            false,
        );
        assert_eq!(decision, AppendConflictDecision::Proceed);
    }

    #[test]
    fn small_conflict_requires_confirm() {
        let decision = decide_append_conflicts(
            &[input(CategoryKey::GameCfg, &["autoexec.cfg", "new.cfg"], &["autoexec.cfg"])],
            false,
        );
        match decision {
            AppendConflictDecision::Confirm(conflicts) => {
                assert_eq!(conflicts.len(), 1);
                assert_eq!(conflicts[0].category, CategoryKey::GameCfg);
                assert_eq!(conflicts[0].names, vec!["autoexec.cfg".to_string()]);
            }
            other => panic!("expected Confirm, got {other:?}"),
        }
    }

    #[test]
    fn over_three_conflicts_rejected() {
        let decision = decide_append_conflicts(
            &[input(
                CategoryKey::Video,
                &["a.cfg", "b.cfg", "c.cfg", "d.cfg"],
                &["a.cfg", "b.cfg", "c.cfg", "d.cfg"],
            )],
            false,
        );
        assert_eq!(decision, AppendConflictDecision::Reject);
    }

    #[test]
    fn exact_three_conflicts_confirms() {
        let decision = decide_append_conflicts(
            &[input(
                CategoryKey::Video,
                &["a.cfg", "b.cfg", "c.cfg"],
                &["a.cfg", "b.cfg", "c.cfg"],
            )],
            false,
        );
        match decision {
            AppendConflictDecision::Confirm(_) => {}
            other => panic!("expected Confirm, got {other:?}"),
        }
    }

    #[test]
    fn use_personal_cfg_skips_game_cfg() {
        // usePersonalCfg=true → gameCfg 跳过，即使有冲突
        let decision = decide_append_conflicts(
            &[input(CategoryKey::GameCfg, &["autoexec.cfg"], &["autoexec.cfg"])],
            true,
        );
        assert_eq!(decision, AppendConflictDecision::Proceed);
    }

    #[test]
    fn without_personal_cfg_skips_user_cfg() {
        let decision = decide_append_conflicts(
            &[input(CategoryKey::UserCfg, &["custom.cfg"], &["custom.cfg"])],
            false,
        );
        assert_eq!(decision, AppendConflictDecision::Proceed);
    }

    #[test]
    fn conflicts_across_categories_are_grouped() {
        let decision = decide_append_conflicts(
            &[
                input(CategoryKey::GameCfg, &["autoexec.cfg"], &["autoexec.cfg"]),
                input(CategoryKey::Annotations, &["dust2/"], &["dust2/"]),
            ],
            false,
        );
        match decision {
            AppendConflictDecision::Confirm(conflicts) => {
                assert_eq!(conflicts.len(), 2);
            }
            other => panic!("expected Confirm, got {other:?}"),
        }
    }

    #[test]
    fn empty_staging_skipped_even_if_target_has_files() {
        let decision = decide_append_conflicts(
            &[input(CategoryKey::GameCfg, &[], &["autoexec.cfg"])],
            false,
        );
        assert_eq!(decision, AppendConflictDecision::Proceed);
    }
}
