//! Tauri 壳层入口库（Windows 目标构建）。
//!
//! 纯业务逻辑在 `srp-cfg-core`（本 workspace 的 core/），本 crate 只负责：
//! 窗口创建、IPC command 注册、文件系统/注册表/网络等平台 I/O。
//!
//! 注意：本 crate 依赖 tauri，Linux 需要 webkit2gtk-4.1 才能编译；
//! 开发/测试纯逻辑请使用 `cargo test -p srp-cfg-core`。

/// 应用启动入口（Windows 上由 tauri 调用）。
///
/// TODO(L2.2+): 注册 commands（detection / staging / installer / vcfg / updater / window 控制），
/// 对应原 Electron 版 `app/desktop/src/main/main.ts` + `ipc.ts`。
pub fn run() {
    // 占位：Tauri 壳在 Windows 构建时启用
}
