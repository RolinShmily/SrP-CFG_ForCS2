#include "srp/core/preset.h"
#include "srp/core/actions.h"

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

bool writeFileContent(const fs::path& path, const std::string& content) {
    std::error_code ec;
    fs::create_directories(path.parent_path(), ec);
    std::ofstream file(path, std::ios::binary | std::ios::trunc);
    if (!file.is_open()) return false;
    file.write(content.data(), static_cast<std::streamsize>(content.size()));
    return file.good();
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
    fs::path customPath = resolveCustomCfgPath(gameCfgDir, sourceConfigDir);
    if (!fs::exists(customPath)) return "";

    std::ifstream file(customPath);
    if (!file.is_open()) return "";

    std::string line;
    while (std::getline(file, line)) {
        std::string trimmed = trim(line);
        if (trimmed.rfind("srp_apply_", 0) == 0) {
            // 匹配到了未被注释的 srp_apply_<id> 命令
            std::string presetId = trimmed.substr(std::string("srp_apply_").length());
            // 去除行末注释或空格
            auto endPos = presetId.find_first_of(" \t;/\r\n");
            if (endPos != std::string::npos) {
                presetId = presetId.substr(0, endPos);
            }
            return presetId;
        }
    }

    return "";
}

bool loadPreset(const std::string& presetId, const std::string& gameCfgDir) {
    fs::path customPath = resolveCustomCfgPath(gameCfgDir, "");
    if (!fs::exists(customPath)) {
        return false;
    }

    // 自动备份 custom.cfg
    std::error_code ec;
    fs::copy_file(customPath, customPath.string() + ".bak", fs::copy_options::overwrite_existing, ec);

    std::string content = readFileContent(customPath);
    std::istringstream stream(content);
    std::string line;
    std::ostringstream out;

    std::string targetCmd = "srp_apply_" + presetId;
    bool presetHandled = false;
    bool inPresetLayer = false;

    while (std::getline(stream, line)) {
        std::string trimmed = trim(line);

        if (trimmed.find("SrP-CFG Preset Layer") != std::string::npos) {
            inPresetLayer = true;
            out << line << "\n";
            continue;
        }
        if (trimmed.find("Preset Layer End") != std::string::npos) {
            if (!presetHandled) {
                out << targetCmd << "\n";
                presetHandled = true;
            }
            inPresetLayer = false;
            out << line << "\n";
            continue;
        }

        if (inPresetLayer) {
            // 检查当前行是否包含任何预设命令
            bool isPresetLine = (trimmed.find("srp_apply_") != std::string::npos);
            if (isPresetLine) {
                if (trimmed.find(targetCmd) != std::string::npos) {
                    out << targetCmd << "\n";
                    presetHandled = true;
                } else {
                    // 其他预设行统一增加注释
                    if (trimmed.rfind("//", 0) == 0) {
                        out << line << "\n";
                    } else {
                        out << "// " << trimmed << "\n";
                    }
                }
                continue;
            }
        }

        out << line << "\n";
    }

    return writeFileContent(customPath, out.str());
}

bool unloadPreset(const std::string& gameCfgDir) {
    fs::path customPath = resolveCustomCfgPath(gameCfgDir, "");
    if (!fs::exists(customPath)) return false;

    std::error_code ec;
    fs::copy_file(customPath, customPath.string() + ".bak", fs::copy_options::overwrite_existing, ec);

    std::string content = readFileContent(customPath);
    std::istringstream stream(content);
    std::string line;
    std::ostringstream out;

    bool inPresetLayer = false;
    while (std::getline(stream, line)) {
        std::string trimmed = trim(line);
        if (trimmed.find("SrP-CFG Preset Layer") != std::string::npos) {
            inPresetLayer = true;
            out << line << "\n";
            continue;
        }
        if (trimmed.find("Preset Layer End") != std::string::npos) {
            inPresetLayer = false;
            out << line << "\n";
            continue;
        }

        if (inPresetLayer) {
            if (trimmed.rfind("srp_apply_", 0) == 0) {
                out << "// " << trimmed << "\n";
                continue;
            }
        }

        out << line << "\n";
    }

    return writeFileContent(customPath, out.str());
}

std::string readPresetFile(const std::string& presetId, const std::string& fileName,
                           const std::string& gameCfgDir, const std::string& sourceConfigDir) {
    fs::path installed = resolveInstalledPresetDir(presetId, gameCfgDir) / fileName;
    if (fs::exists(installed) && fs::is_regular_file(installed)) {
        return readFileContent(installed);
    }
    fs::path source = resolveSourcePresetDir(presetId, sourceConfigDir) / fileName;
    if (fs::exists(source) && fs::is_regular_file(source)) {
        return readFileContent(source);
    }
    return "";
}

bool savePresetFile(const std::string& presetId, const std::string& fileName,
                    const std::string& content, const std::string& gameCfgDir) {
    fs::path targetDir;
    if (!gameCfgDir.empty() && fs::exists(fs::u8path(gameCfgDir) / "srp-cfg")) {
        targetDir = resolveInstalledPresetDir(presetId, gameCfgDir);
    } else {
        targetDir = resolveSourcePresetDir(presetId, "");
    }

    fs::path targetPath = targetDir / fileName;

    // 保存前备份为 .bak
    if (fs::exists(targetPath)) {
        std::error_code ec;
        fs::copy_file(targetPath, targetPath.string() + ".bak", fs::copy_options::overwrite_existing, ec);
    }

    return writeFileContent(targetPath, content);
}

bool resetPresetFileToDefault(const std::string& presetId, const std::string& fileName,
                              const std::string& gameCfgDir, const std::string& sourceConfigDir) {
    fs::path sourcePath = resolveSourcePresetDir(presetId, sourceConfigDir) / fileName;
    if (!fs::exists(sourcePath)) {
        return false;
    }
    std::string defaultContent = readFileContent(sourcePath);
    return savePresetFile(presetId, fileName, defaultContent, gameCfgDir);
}

bool isPresetFileModified(const std::string& presetId, const std::string& fileName,
                          const std::string& gameCfgDir, const std::string& sourceConfigDir) {
    fs::path sourcePath = resolveSourcePresetDir(presetId, sourceConfigDir) / fileName;
    if (!fs::exists(sourcePath)) return false;

    fs::path installedPath = resolveInstalledPresetDir(presetId, gameCfgDir) / fileName;
    if (!fs::exists(installedPath)) return false;

    std::string sourceText = normalizeLineEndings(readFileContent(sourcePath));
    std::string installedText = normalizeLineEndings(readFileContent(installedPath));

    return sourceText != installedText;
}

} // namespace srp::core
