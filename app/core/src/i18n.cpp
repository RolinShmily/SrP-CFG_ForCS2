#include "srp/core/i18n.h"
#include <unordered_map>

namespace srp::core {

namespace {
Language g_currentLanguage = Language::ZhCN;

const std::unordered_map<std::string_view, std::string_view> g_dictZh = {
    // 基础路径与环境探测
    {"detect.steam.found", "已识别 Steam 安装路径: "},
    {"detect.steam.not_found", "未检测到 Steam 安装路径"},
    {"detect.lib.fallback", "未找到 libraryfolders.vdf，仅尝试 Steam 根目录"},
    {"detect.cs2.installed", "CS2 已就绪: "},
    {"detect.cs2.needs_update", "CS2 需要更新: "},
    {"detect.cs2.not_installed", "未检测到 CS2 游戏安装"},
    {"detect.cfg.found", "游戏全局 CFG 路径: "},
    {"detect.cfg.not_found", "未找到游戏全局 CFG 路径"},
    {"detect.annotations.found", "地图标注指南路径: "},
    {"detect.annotations.created", "地图标注指南路径（已自动创建）: "},
    {"detect.user_cfg.found", "账号本地配置路径: "},
    {"detect.user_cfg.created", "账号本地配置路径（已自动创建）: "},
    {"detect.user.current", "当前登录账号: "},
    {"detect.user.scanned", "从 userdata 目录自动识别到活跃账号: "},
    {"detect.user.none", "未检测到活跃 Steam 登录账号"},
    {"detect.complete", "环境与路径诊断完成"},

    // 侧边栏导航
    {"nav.navigation", "导航"},
    {"nav.overview", "总览"},
    {"nav.presets", "预设包"},
    {"nav.assembly", "自由装配"},
    {"nav.valve_baseline", "Valve 默认基线"},
    {"nav.features", "特性模块"},
    {"nav.modes", "模式预设"},
    {"nav.user_custom", "用户配置 (custom.cfg)"},
    {"nav.video_settings", "视频设置 (cs2_video.txt)"},
    {"nav.map_guides", "地图标注指南"},
    {"nav.about", "关于"},
    {"nav.settings", "设置"},

    // 标题栏与公共
    {"title.app", "SrP-CFG"},
    {"title.switch_account", "切换"},
    {"title.theme_toggle", "亮暗色切换"},
    {"title.language_toggle", "中英文切换"},
    {"title.top_toggle", "窗口置顶"},

    // Overview Hero 卡片
    {"overview.hero.game_name", "Counter Strike 2"},
    {"overview.hero.version_prefix", "版本: "},
    {"overview.hero.select_account", "选择 Steam 账号"},
    {"overview.hero.launch_game", "启动游戏"},
    {"overview.hero.reset_valve", "恢复默认设置"},
    {"overview.hero.open_cfg", "打开CFG目录"},
    {"overview.hero.open_user_cfg", "打开用户目录"},

    // 路径检测卡片
    {"overview.path.title", "路径检测"},
    {"overview.path.redetect", "重新检测"},
    {"overview.path.steam_label", "Steam 路径"},
    {"overview.path.game_label", "游戏路径"},
    {"overview.path.browse", "浏览"},
    {"overview.path.srp_status_installed", "已装配 SrP-CFG"},
    {"overview.path.srp_status_not_installed", "未装配 SrP-CFG"},
    {"overview.path.btn_install_srp", "立即装配"},
    {"overview.path.btn_reinstall_srp", "重新装配"},
    {"overview.path.btn_uninstall_srp", "卸载"},

    // Convars 与按键绑定检测卡片
    {"overview.convars.title", "Convars 与按键绑定检测"},
    {"overview.convars.parsed_from_vcfg", "解析 vcfg 获得"},
    {"overview.convars.redetect", "重新检测"},
    {"overview.convars.total_entries", "Convars 变量"},
    {"overview.convars.keybinds_count", "按键绑定"},
    {"overview.convars.remove_all", "清空 Convars"},
    {"overview.convars.remove_keybinds", "清空按键"},

    // 侧边栏运行环境卡片
    {"sidebar.env_title", "运行环境"},
    {"sidebar.env_ready", "就绪 ✓"},
    {"sidebar.env_steam", "Steam 运行时"},
    {"sidebar.env_game", "CS2 游戏目录"},
    {"sidebar.status_ok", "已就绪"},
    {"sidebar.status_matched", "已匹配"},
    {"sidebar.status_missing", "缺失"},
    {"sidebar.status_unlocated", "未定位"},

    // 模态弹窗与确认对话框
    {"modal.install.title", "未检测到 SrP-CFG 运行环境"},
    {"modal.install.desc", "恢复默认设置需要依托 SrP-CFG 的统一调度体系。\n检测到当前 CS2 游戏目录下尚未装配 SrP-CFG，是否立即一键装配并初始化？"},
    {"modal.install.confirm", "立即装配并重置"},
    {"modal.install.cancel", "取消"},
    {"modal.reset.title", "确认恢复 Valve 默认设置"},
    {"modal.reset.desc", "将把 custom.cfg 重置为纯净 Valve 原生默认基线，并清空按键与变量缓存。\n原 custom.cfg 将自动备份为 .bak。是否继续？"},
    {"modal.reset.confirm", "确认恢复"},
    {"modal.reset.cancel", "取消"},

    // Presets 预设包页面
    {"presets.title", "预设选择"},
    {"presets.select_label", "预设包"},
    {"presets.command_prefix", "Command:"},
    {"presets.status_card_title", "状态"},
    {"presets.status_loaded", "当前已激活预设"},
    {"presets.status_none", "未加载任何预设 (无起点覆盖)"},
    {"presets.btn_load", "加载"},
    {"presets.btn_unload", "卸载"},
    {"presets.file_label", "文件名"},
    {"presets.btn_reset", "恢复默认"},
    {"presets.btn_save", "保存"},
    {"presets.saved_notify", "配置已成功保存并生成 .bak 备份"},
    {"presets.reset_notify", "已恢复为官方出厂初始默认设置"},
    {"presets.save_before_switch", "当前文件有未保存的修改，请先保存再切换文件或预设"},
    {"presets.save_before_load", "custom.cfg 有未保存的修改，请先保存再加载或卸载预设"},
    {"presets.external_change_unsaved", "文件已在外部修改；为保留未保存的编辑，未自动覆盖当前内容"},
    {"presets.load_notify", "预设已成功加载至 custom.cfg"},
    {"presets.unload_notify", "已从 custom.cfg 卸载预设命令"},
    {"presets.modal_install_title", "未检测到 SrP-CFG 运行环境"},
    {"presets.modal_install_desc", "加载预设需要将运行命令写入 custom.cfg。\n尚未在 CS2 目录检测到 SrP-CFG，是否立即部署并激活此预设？"},
    {"presets.modal_install_confirm", "立即部署并加载"},
    {"presets.modal_install_cancel", "取消"},
    {"presets.tooltip_modified", "该预设文件已自定义修改，非官方初始出厂状态"},
    {"presets.tooltip_unsaved", "当前文件有未保存的改动"},

    // 目录选择与提示
    {"dialog.browse_steam", "手动选择 Steam 安装目录"},
    {"dialog.browse_game", "手动选择 CS2 游戏安装目录"},
    {"tooltip.steam_manual", "手动指定 Steam 目录"},
    {"tooltip.game_manual", "手动指定 CS2 游戏目录"},
    {"tooltip.browse_explorer", "在文件资源管理器中定位"},
    {"tooltip.reset_valve", "恢复 Valve 官方默认基线设置"},
    {"tooltip.clean_convars", "清空当前账号全部 convars 缓存 (自动备份为 .bak)"},
    {"tooltip.clean_keys", "清空当前账号全部按键绑定 (自动备份为 .bak)"},
    {"tooltip.switch_account", "点击切换当前 Steam 账号"},
    {"tooltip.pinned", "已置顶 (点击取消)"},
    {"tooltip.pin_window", "置顶窗口"},
    {"tooltip.to_light", "切换为明亮模式"},
    {"tooltip.to_dark", "切换为暗色模式"},
    {"tooltip.install_srp", "将 SrP-CFG 运行库与 autoexec 部署到游戏目录"},
    {"tooltip.reinstall_srp", "重新覆盖装配核心运行时 (自动保留个人 custom.cfg)"},
    {"tooltip.uninstall_srp", "移除游戏目录下的 SrP-CFG 并停用 autoexec"},

    // 交互反馈与通知
    {"feedback.launch_success", "已成功拉起 CS2 启动协议"},
    {"feedback.launch_failed", "启动游戏失败，请确认 Steam 是否运行"},
    {"feedback.open_folder_failed", "打开目录失败，路径不存在"},
    {"feedback.reset_success", "已成功重置为 Valve Baseline 基线"},
    {"feedback.clean_all_success", "已清空全部 Convars，原配置已备份至 .bak"},
    {"feedback.clean_keybinds_success", "已清空按键绑定，原配置已备份至 .bak"},
    {"feedback.path_detect_done", "路径检测完成"},
    {"feedback.install_srp_success", "SrP-CFG 运行环境已成功装配至游戏目录！"},
    {"feedback.install_srp_failed", "装配失败，未找到随附的 config 目录或文件写入被拒绝"},
    {"feedback.uninstall_srp_success", "已成功从游戏目录移除 SrP-CFG 运行环境"},
    {"feedback.uninstall_srp_failed", "卸载失败，文件可能被占用"},
    {"feedback.steam_path_updated", "Steam 路径已更新为: "},
    {"feedback.game_path_updated", "CS2 游戏路径已更新为: "},
    {"feedback.invalid_cfg_dir", "未检测到有效的 CS2 游戏 CFG 目录"},
    {"feedback.account_switched", "已切换至 Steam 账号: "}
};

const std::unordered_map<std::string_view, std::string_view> g_dictEn = {
    // Basic Detection
    {"detect.steam.found", "Found Steam installation path: "},
    {"detect.steam.not_found", "Steam installation path not detected"},
    {"detect.lib.fallback", "libraryfolders.vdf not found, trying Steam root only"},
    {"detect.cs2.installed", "CS2 is ready: "},
    {"detect.cs2.needs_update", "CS2 has an available update: "},
    {"detect.cs2.not_installed", "CS2 installation not found"},
    {"detect.cfg.found", "Global CS2 CFG path: "},
    {"detect.cfg.not_found", "Global CS2 CFG path not found"},
    {"detect.annotations.found", "Map annotations path: "},
    {"detect.annotations.created", "Map annotations path (auto-created): "},
    {"detect.user_cfg.found", "User local CFG path: "},
    {"detect.user_cfg.created", "User local CFG path (auto-created): "},
    {"detect.user.current", "Current active user: "},
    {"detect.user.scanned", "Scanned active user from userdata: "},
    {"detect.user.none", "No active Steam login user detected"},
    {"detect.complete", "Environment detection complete"},

    // Sidebar Navigation
    {"nav.navigation", "NAVIGATION"},
    {"nav.overview", "Overview"},
    {"nav.presets", "Presets"},
    {"nav.assembly", "Modular Assembly"},
    {"nav.valve_baseline", "Valve Baseline"},
    {"nav.features", "Features"},
    {"nav.modes", "Modes"},
    {"nav.user_custom", "User Config (custom.cfg)"},
    {"nav.video_settings", "Video Settings (cs2_video.txt)"},
    {"nav.map_guides", "Map Guides"},
    {"nav.about", "About"},
    {"nav.settings", "Settings"},

    // Caption Bar & Common
    {"title.app", "SrP-CFG"},
    {"title.switch_account", "Switch"},
    {"title.theme_toggle", "Toggle Dark/Light"},
    {"title.language_toggle", "Switch Language"},
    {"title.top_toggle", "Always on Top"},

    // Overview Hero Card
    {"overview.hero.game_name", "Counter Strike 2"},
    {"overview.hero.version_prefix", "Version: "},
    {"overview.hero.select_account", "Select Steam Account"},
    {"overview.hero.launch_game", "Launch Game"},
    {"overview.hero.reset_valve", "Reset Baseline"},
    {"overview.hero.open_cfg", "Open CFG Folder"},
    {"overview.hero.open_user_cfg", "Open User Folder"},

    // Path Diagnostics Card
    {"overview.path.title", "Path Diagnostics"},
    {"overview.path.redetect", "Re-detect"},
    {"overview.path.steam_label", "Steam Path"},
    {"overview.path.game_label", "Game Path"},
    {"overview.path.browse", "Browse"},
    {"overview.path.srp_status_installed", "SrP-CFG Installed"},
    {"overview.path.srp_status_not_installed", "SrP-CFG Not Installed"},
    {"overview.path.btn_install_srp", "Deploy"},
    {"overview.path.btn_reinstall_srp", "Redeploy"},
    {"overview.path.btn_uninstall_srp", "Uninstall"},

    // Convars & Keybinds Diagnostics Card
    {"overview.convars.title", "Convars & Keybinds Detection"},
    {"overview.convars.parsed_from_vcfg", "Parsed from vcfg"},
    {"overview.convars.redetect", "Re-detect"},
    {"overview.convars.total_entries", "Convars"},
    {"overview.convars.keybinds_count", "Keybinds"},
    {"overview.convars.remove_all", "Clear Convars"},
    {"overview.convars.remove_keybinds", "Clear Keybinds"},

    // Sidebar Environment Diagnostics
    {"sidebar.env_title", "Environment"},
    {"sidebar.env_ready", "Ready ✓"},
    {"sidebar.env_steam", "Steam Runtime"},
    {"sidebar.env_game", "CS2 Game Path"},
    {"sidebar.status_ok", "Ready"},
    {"sidebar.status_matched", "Matched"},
    {"sidebar.status_missing", "Missing"},
    {"sidebar.status_unlocated", "Unlocated"},

    // Modals & Confirmation Dialogs
    {"modal.install.title", "SrP-CFG Runtime Not Found"},
    {"modal.install.desc", "Resetting defaults relies on the SrP-CFG unified structure.\nSrP-CFG is not yet deployed in your CS2 directory. Would you like to deploy and initialize it now?"},
    {"modal.install.confirm", "Deploy & Reset"},
    {"modal.install.cancel", "Cancel"},
    {"modal.reset.title", "Confirm Valve Baseline Reset"},
    {"modal.reset.desc", "This will reset custom.cfg to the pure Valve baseline and clear keybind/convar caches.\nYour existing custom.cfg will be backed up as .bak. Continue?"},
    {"modal.reset.confirm", "Reset Now"},
    {"modal.reset.cancel", "Cancel"},

    // Presets Page
    {"presets.title", "Preset Selection"},
    {"presets.select_label", "Preset Pack"},
    {"presets.command_prefix", "Command:"},
    {"presets.status_card_title", "Status"},
    {"presets.status_loaded", "Active Preset"},
    {"presets.status_none", "No Preset Active (No Baseline Override)"},
    {"presets.btn_load", "Load"},
    {"presets.btn_unload", "Unload"},
    {"presets.file_label", "File Name"},
    {"presets.btn_reset", "Reset Default"},
    {"presets.btn_save", "Save"},
    {"presets.saved_notify", "Configuration saved with .bak backup"},
    {"presets.reset_notify", "Reset to official factory defaults"},
    {"presets.save_before_switch", "Save your changes before switching files or presets"},
    {"presets.save_before_load", "Save your unsaved custom.cfg changes before loading or unloading a preset"},
    {"presets.external_change_unsaved", "The file changed externally; unsaved editor changes were preserved instead of overwritten"},
    {"presets.load_notify", "Preset successfully loaded into custom.cfg"},
    {"presets.unload_notify", "Preset command unloaded from custom.cfg"},
    {"presets.modal_install_title", "SrP-CFG Not Found"},
    {"presets.modal_install_desc", "Loading presets requires writing commands into custom.cfg.\nSrP-CFG is not yet deployed in your CS2 directory. Deploy and load this preset now?"},
    {"presets.modal_install_confirm", "Deploy & Load"},
    {"presets.modal_install_cancel", "Cancel"},
    {"presets.tooltip_modified", "This preset has been customized and differs from factory defaults"},
    {"presets.tooltip_unsaved", "Unsaved modifications in current file"},

    // Directory Selection & Tooltips
    {"dialog.browse_steam", "Select Steam Installation Directory"},
    {"dialog.browse_game", "Select CS2 Game Installation Directory"},
    {"tooltip.steam_manual", "Manually specify Steam directory"},
    {"tooltip.game_manual", "Manually specify CS2 game directory"},
    {"tooltip.browse_explorer", "Open in file explorer"},
    {"tooltip.reset_valve", "Restore Valve official baseline defaults"},
    {"tooltip.clean_convars", "Clear all convars cache for current account (backed up as .bak)"},
    {"tooltip.clean_keys", "Clear all keybinds for current account (backed up as .bak)"},
    {"tooltip.switch_account", "Click to switch active Steam account"},
    {"tooltip.pinned", "Pinned (click to unpin)"},
    {"tooltip.pin_window", "Pin window on top"},
    {"tooltip.to_light", "Switch to light mode"},
    {"tooltip.to_dark", "Switch to dark mode"},
    {"tooltip.install_srp", "Deploy SrP-CFG runtime & autoexec into game directory"},
    {"tooltip.reinstall_srp", "Reinstall core runtime (preserves personal custom.cfg)"},
    {"tooltip.uninstall_srp", "Remove SrP-CFG from game directory & disable autoexec"},

    // Feedback & Notifications
    {"feedback.launch_success", "CS2 launch request dispatched successfully"},
    {"feedback.launch_failed", "Failed to launch CS2, check if Steam is running"},
    {"feedback.open_folder_failed", "Failed to open folder, path does not exist"},
    {"feedback.reset_success", "Successfully reset to Valve Baseline"},
    {"feedback.clean_all_success", "All Convars cleared. Backup saved to .bak"},
    {"feedback.clean_keybinds_success", "All Keybinds cleared. Backup saved to .bak"},
    {"feedback.path_detect_done", "Path detection complete"},
    {"feedback.install_srp_success", "SrP-CFG runtime successfully deployed to game directory!"},
    {"feedback.install_srp_failed", "Deployment failed: source config directory not found or write error."},
    {"feedback.uninstall_srp_success", "SrP-CFG successfully uninstalled from game directory"},
    {"feedback.uninstall_srp_failed", "Uninstall failed: files may be in use"},
    {"feedback.steam_path_updated", "Steam path updated to: "},
    {"feedback.game_path_updated", "CS2 game path updated to: "},
    {"feedback.invalid_cfg_dir", "Valid CS2 game CFG directory not found"},
    {"feedback.account_switched", "Switched to Steam Account: "}
};
} // namespace

void setLanguage(Language lang) {
    g_currentLanguage = lang;
}

Language currentLanguage() {
    return g_currentLanguage;
}

std::string tr(std::string_view key) {
    const auto& dict = (g_currentLanguage == Language::ZhCN) ? g_dictZh : g_dictEn;
    auto it = dict.find(key);
    if (it != dict.end()) {
        return std::string(it->second);
    }
    return std::string(key);
}

} // namespace srp::core
