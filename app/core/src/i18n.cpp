#include "srp/core/i18n.h"
#include <unordered_map>

namespace srp::core {

namespace {
Language g_currentLanguage = Language::ZhCN;

const std::unordered_map<std::string_view, std::string_view> g_dictZh = {
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
    {"detect.complete", "环境与路径诊断完成"}
};

const std::unordered_map<std::string_view, std::string_view> g_dictEn = {
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
    {"detect.complete", "Environment detection complete"}
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
