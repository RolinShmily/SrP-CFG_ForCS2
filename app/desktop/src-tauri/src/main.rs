// 防止 Windows 下弹出控制台窗口
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    srp_cfg_desktop_lib::run()
}
