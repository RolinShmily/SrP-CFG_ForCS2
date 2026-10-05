#include "srp/core/preset.h"
#include "srp/core/actions.h"
#include "srp/core/assembly.h"
#include "srp/core/config_backup.h"
#include "srp/core/catalog.h"

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

std::string presetDirectory(const std::string& id, const fs::path& root) {
    for (const auto& e : configCatalog("srp-cfg",root.u8string())) if(e.category=="presets" && e.id==id)return e.directory;
    return {};
}
fs::path resolveSourcePresetDir(const std::string& presetId, const std::string& sourceConfigDir) {
    fs::path base = sourceConfigDir.empty() ? fs::u8path(findSourceConfigDir()) : fs::u8path(sourceConfigDir);
    if (fs::is_directory(base / "srp-cfg")) base /= "srp-cfg";
    const auto directory=presetDirectory(presetId,base);
    return directory.empty()?fs::path():base/fs::u8path(directory);
}

fs::path resolveInstalledPresetDir(const std::string& presetId, const std::string& gameCfgDir) {
    if (gameCfgDir.empty()) return {};
    const auto directory = presetDirectory(presetId,fs::u8path(findSourceConfigDir())/"srp-cfg");
    return directory.empty()?fs::path():fs::u8path(gameCfgDir)/"srp-cfg"/fs::u8path(directory);
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

    std::string root = sourceConfigDir.empty() ? findSourceConfigDir() : sourceConfigDir;
    fs::path base = fs::u8path(root);
    if (fs::is_directory(base / "srp-cfg")) base /= "srp-cfg";
    for (const auto& e : configCatalog("srp-cfg",base.u8string())) {
        if (e.category != "presets") continue;
        PresetInfo info; info.id=e.id; info.displayName=e.name; info.command=e.command;
        info.descriptionZh=e.descriptionZh;info.descriptionEn=e.descriptionEn;info.files=e.files;info.tagsZh=e.tagsZh;info.tagsEn=e.tagsEn;
        for (const auto& file : e.files) info.hasDiff = info.hasDiff || isPresetFileModified(e.id,file,gameCfgDir,sourceConfigDir);
        list.push_back(std::move(info));
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
    const auto sourceDirectory=resolveSourcePresetDir(presetId,sourceConfigDir);
    fs::path catalogRoot = sourceConfigDir.empty() ? fs::u8path(findSourceConfigDir()) : fs::u8path(sourceConfigDir);
    if(fs::is_directory(catalogRoot/"srp-cfg"))catalogRoot/="srp-cfg";
    const auto entryDirectory=presetDirectory(presetId,catalogRoot);
    if(sourceDirectory.empty() || !catalogFileAllowed("srp-cfg",entryDirectory+"/"+fileName,catalogRoot.u8string())) return {};
    if (!gameCfgDir.empty()) {
        fs::path installed = resolveInstalledPresetDir(presetId, gameCfgDir) / fileName;
        if (fs::is_regular_file(installed)) return installed.u8string();
    }
    return (sourceDirectory / fs::u8path(fileName)).u8string();
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
        const auto root = fs::u8path(findSourceConfigDir()) / "srp-cfg";
        const auto directory=presetDirectory(presetId,root);
        if (directory.empty() || !catalogFileAllowed("srp-cfg",directory+"/"+fileName,root.u8string())) return false;
        target /= fs::u8path(directory) / fs::u8path(fileName);
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
    const auto resolved = resolvePresetFilePath(presetId,fileName,"",sourceConfigDir);
    if (resolved.empty()) return false;
    fs::path sourcePath = fs::u8path(resolved);
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
    const auto resolved = resolvePresetFilePath(presetId,fileName,"",sourceConfigDir);
    if (resolved.empty()) return false;
    fs::path sourcePath = fs::u8path(resolved);
    if (!fs::exists(sourcePath)) return false;

    fs::path installedPath = resolveInstalledPresetDir(presetId, gameCfgDir) / fileName;
    if (!fs::exists(installedPath)) return false;

    std::string sourceText = normalizeLineEndings(readFileContent(sourcePath));
    std::string installedText = normalizeLineEndings(readFileContent(installedPath));

    return sourceText != installedText;
}

} // namespace srp::core
