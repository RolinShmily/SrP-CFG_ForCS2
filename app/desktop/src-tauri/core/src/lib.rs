//! SrP-CFG 纯业务逻辑核心。
//!
//! 设计约束：**不依赖 tauri / 文件系统 / 平台 API**。
//! - 输入输出均为纯数据结构或字符串，便于跨平台单元测试（`cargo test -p srp-cfg-core`）。
//! - 文件读取、注册表、网络等 I/O 由 tauri 壳层（`../src/services`）负责，本 crate 只做纯计算。
//!
//! 对应原 Electron 版 `app/desktop/src/main/services/*.ts` 中的纯逻辑部分。

pub mod conflicts;
pub mod migrate;
pub mod vcfg;
pub mod version;

pub use conflicts::{AppendConflict, AppendConflictDecision, CategoryKey};
pub use migrate::{plan_migration, should_migrate, MigrationAction};
pub use vcfg::{parse_cfg_convars, snapshot_to_cfg, SnapshotToCfgOptions};
pub use version::compare_versions;
