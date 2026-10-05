#include "srp/core/preset.h"
#include "srp/core/actions.h"
#include "srp/core/assembly.h"
#include "srp/core/config_backup.h"

#include <filesystem>
#include <fstream>
#include <sstream>
#include <algorithm>
#include <cctype>

namespace fs = std::filesystem;

namespace srp::core {

namespace {

std::string trim(const std::string& str) {
    auto first = str.find_first_not_of(" \t\r\n");
    if (first == std::string::npos) return "";
    auto last = str.find_last_not_of(" \t\r\n");
    return str.substr(first, (last - first + 1));
}

std::string normalizeLineEndings(const std::string& input) {
    std::string output;
    output.reserve(input.size());
    for (size_t i = 0; i < input.size(); ++i) {
        if (input[i] == '\r') {
            if (i + 1 < input.size() && input[i + 1] == '\n') {
                continue;
            }
            output += '\n';
        } else {
            output += input[i];
        }
    }
    return output;
}

std::string readFileContent(const fs::path& path) {
    if (!fs::exists(path) || !fs::is_regular_file(path)) {
        return "";
    }
    std::ifstream file(path, std::ios::binary);
    if (!file.is_open()) return "";
    std::ostringstream ss;
    ss << file.rdbuf();
    return ss.str();
}

fs::path resolveSourcePresetDir(const std::string& presetId, const std::string& sourceConfigDir) {
    fs::path base = sourceConfigDir.empty() ? fs::u8path(findSourceConfigDir()) : fs::u8path(sourceConfigDir);
    if (fs::exists(base / "srp-cfg" / "presets" / presetId)) {
        return base / "srp-cfg" / "presets" / presetId;
    }
    if (fs::exists(base / "presets" / presetId)) {
        return base / "presets" / presetId;
    }
    return base / "srp-cfg" / "presets" / presetId;
}

fs::path resolveInstalledPresetDir(const std::string& presetId, const std::string& gameCfgDir) {
    if (gameCfgDir.empty()) return {};
    return fs::u8path(gameCfgDir) / "srp-cfg" / "presets" / presetId;
}

fs::path resolveCustomCfgPath(const std::string& gameCfgDir, const std::string& sourceConfigDir) {
    if (!gameCfgDir.empty()) {
        fs::path p = fs::u8path(gameCfgDir) / "srp-cfg" / "user" / "custom.cfg";
        if (fs::exists(p)) return p;
    }
    fs::path base = sourceConfigDir.empty() ? fs::u8path(findSourceConfigDir()) : fs::u8path(sourceConfigDir);
    if (fs::exists(base / "srp-cfg" / "user" / "custom.cfg")) {
        return base / "srp-cfg" / "user" / "custom.cfg";
    }
    return base / "user" / "custom.cfg";
}

} // namespace

std::vector<PresetInfo> scanPresets(const std::string& gameCfgDir, const std::string& sourceConfigDir) {
    std::vector<PresetInfo> list;

    // 默认内置的官方四大预设基准
    static const struct {
        const char* id;
        const char* name;
        const char* cmd;
    } kBuiltins[] = {
        {"default", "Default", "srp_apply_default"},
        {"echo", "Echo", "srp_apply_echo"},
        {"visionl", "VisionL", "srp_apply_visionl"},
        {"yszh", "Yszh", "srp_apply_yszh"}
    };

    for (const auto& b : kBuiltins) {
        PresetInfo info;
        info.id = b.id;
        info.displayName = b.name;
        info.command = b.cmd;
        info.hasDiff = isPresetFileModified(b.id, "settings.cfg", gameCfgDir, sourceConfigDir)
                    || isPresetFileModified(b.id, "keymap.cfg", gameCfgDir, sourceConfigDir);
        list.push_back(info);
    }

    return list;
}

std::string getActivePresetId(const std::string& gameCfgDir, const std::string& sourceConfigDir) {
    if (!gameCfgDir.empty()) return inspectValveAssembly(gameCfgDir).activePresetId;
    // Factory templates have no active starting point; do not report quoted/commented examples.
    return {};
}

bool loadPreset(const std::string& presetId, const std::string& gameCfgDir) {
    return setPresetEntry(gameCfgDir, presetId).success;
}

bool unloadPreset(const std::string& gameCfgDir) {
    return setPresetEntry(gameCfgDir, "").success;
}

std::string resolvePresetFilePath(const std::string& presetId, const std::string& fileName,
                                  const std::string& gameCfgDir, const std::string& sourceConfigDir) {
    if (fileName == "user/custom.cfg" || fileName == "custom.cfg") {
        return resolveCustomCfgPath(gameCfgDir, sourceConfigDir).u8string();
    }
    if (!gameCfgDir.empty()) {
        fs::path installed = resolveInstalledPresetDir(presetId, gameCfgDir) / fileName;
        if (fs::is_regular_file(installed)) return installed.u8string();
    }
    return (resolveSourcePresetDir(presetId, sourceConfigDir) / fileName).u8string();
}

std::string readPresetFile(const std::string& presetId, const std::string& fileName,
                           const std::string& gameCfgDir, const std::string& sourceConfigDir) {
    return readFileContent(fs::u8path(resolvePresetFilePath(presetId, fileName, gameCfgDir, sourceConfigDir)));
}

bool savePresetFile(const std::string& presetId, const std::string& fileName,
                    const std::string& content, const std::string& gameCfgDir) {
    if (!isSrpInstalled(gameCfgDir)) return false;
    fs::path target = fs::u8path(gameCfgDir) / "srp-cfg";
    if (fileName == "user/custom.cfg" || fileName == "custom.cfg") {
        target /= "user/custom.cfg";
    } else {
        if (fileName != "settings.cfg" && fileName != "keymap.cfg") return false;
        if (presetId != "default" && presetId != "echo" && presetId != "visionl" && presetId != "yszh") return false;
        target /= fs::path("presets") / presetId / fileName;
    }
    return writeConfigWithBackup(target.u8string(), content, "editor-save").success;
}

bool resetPresetFileToDefault(const std::string& presetId, const std::string& fileName,
                              const std::string& gameCfgDir, const std::string& sourceConfigDir) {
    if (fileName == "user/custom.cfg" || fileName == "custom.cfg") {
        fs::path base = sourceConfigDir.empty() ? fs::u8path(findSourceConfigDir()) : fs::u8path(sourceConfigDir);
        fs::path sourcePath = fs::exists(base / "srp-cfg" / "user" / "custom.cfg") ? (base / "srp-cfg" / "user" / "custom.cfg") : (base / "user" / "custom.cfg");
        if (!fs::exists(sourcePath)) return false;
        std::string defaultContent = readFileContent(sourcePath);
        return savePresetFile(presetId, fileName, defaultContent, gameCfgDir);
    }
    fs::path sourcePath = resolveSourcePresetDir(presetId, sourceConfigDir) / fileName;
    if (!fs::exists(sourcePath)) {
        return false;
    }
    std::string defaultContent = readFileContent(sourcePath);
    return savePresetFile(presetId, fileName, defaultContent, gameCfgDir);
}

bool isPresetFileModified(const std::string& presetId, const std::string& fileName,
                          const std::string& gameCfgDir, const std::string& sourceConfigDir) {
    if (fileName == "user/custom.cfg" || fileName == "custom.cfg") {
        fs::path base = sourceConfigDir.empty() ? fs::u8path(findSourceConfigDir()) : fs::u8path(sourceConfigDir);
        fs::path sourcePath = fs::exists(base / "srp-cfg" / "user" / "custom.cfg") ? (base / "srp-cfg" / "user" / "custom.cfg") : (base / "user" / "custom.cfg");
        if (!fs::exists(sourcePath)) return false;
        fs::path installedPath = resolveCustomCfgPath(gameCfgDir, "");
        if (!fs::exists(installedPath)) return false;
        std::string sourceText = normalizeLineEndings(readFileContent(sourcePath));
        std::string installedText = normalizeLineEndings(readFileContent(installedPath));
        return sourceText != installedText;
    }
    fs::path sourcePath = resolveSourcePresetDir(presetId, sourceConfigDir) / fileName;
    if (!fs::exists(sourcePath)) return false;

    fs::path installedPath = resolveInstalledPresetDir(presetId, gameCfgDir) / fileName;
    if (!fs::exists(installedPath)) return false;

    std::string sourceText = normalizeLineEndings(readFileContent(sourcePath));
    std::string installedText = normalizeLineEndings(readFileContent(installedPath));

    return sourceText != installedText;
}

} // namespace srp::core
