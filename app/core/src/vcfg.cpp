#include "srp/core/vcfg.h"
#include "srp/core/config_backup.h"

#include <algorithm>
#include <cctype>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <vector>

namespace srp::core {

namespace fs = std::filesystem;

namespace {

std::string readFileToString(const fs::path& filePath) {
    std::ifstream file(filePath, std::ios::in | std::ios::binary);
    if (!file) return {};
    std::ostringstream ss;
    ss << file.rdbuf();
    return ss.str();
}

std::vector<std::string> tokenizeVdf(const std::string& content) {
    std::vector<std::string> tokens;
    const size_t n = content.size();
    size_t i = 0;

    while (i < n) {
        char c = content[i];
        if (std::isspace(static_cast<unsigned char>(c))) {
            i++;
            continue;
        }
        if (c == '/' && i + 1 < n && content[i + 1] == '/') {
            while (i < n && content[i] != '\n') {
                i++;
            }
            continue;
        }
        if (c == '{' || c == '}') {
            tokens.push_back(std::string(1, c));
            i++;
            continue;
        }
        if (c != '"') {
            i++;
            continue;
        }

        i++; // skip open quote
        size_t start = i;
        while (i < n && content[i] != '"') {
            i++;
        }
        tokens.push_back(std::string(content.substr(start, i - start)));
        if (i < n) i++; // skip close quote
    }
    return tokens;
}

fs::path findConvarsFile(const std::string& userCfgDir) {
    if (userCfgDir.empty()) return {};
    fs::path p1 = fs::u8path(userCfgDir) / "cs2_user_convars_0_slot0.vcfg";
    if (fs::exists(p1)) return p1;
    fs::path p2 = fs::u8path(userCfgDir) / "cs2_user_convars.vcfg";
    if (fs::exists(p2)) return p2;
    return p1;
}

fs::path findKeybindsFile(const std::string& userCfgDir) {
    if (userCfgDir.empty()) return {};
    fs::path p1 = fs::u8path(userCfgDir) / "cs2_user_keys_0_slot0.vcfg";
    if (fs::exists(p1)) return p1;
    fs::path p2 = fs::u8path(userCfgDir) / "cs2_user_keys.vcfg";
    if (fs::exists(p2)) return p2;
    return p1;
}

} // namespace

std::unordered_map<std::string, std::string> readUserConvars(const std::string& userCfgDir) {
    std::unordered_map<std::string, std::string> convars;
    if (userCfgDir.empty()) return convars;

    fs::path vcfgPath = findConvarsFile(userCfgDir);
    std::string content = readFileToString(vcfgPath);
    if (content.empty()) return convars;

    auto tokens = tokenizeVdf(content);
    for (size_t i = 0; i + 2 < tokens.size(); ++i) {
        if (tokens[i] == "convars" && tokens[i + 1] == "{") {
            size_t cursor = i + 2;
            while (cursor + 1 < tokens.size() && tokens[cursor] != "}") {
                std::string key = tokens[cursor];
                std::string val = tokens[cursor + 1];
                convars[key] = val;
                cursor += 2;
            }
            break;
        }
    }
    return convars;
}

std::unordered_map<std::string, std::string> readUserKeybinds(const std::string& userCfgDir) {
    std::unordered_map<std::string, std::string> bindings;
    if (userCfgDir.empty()) return bindings;

    fs::path vcfgPath = findKeybindsFile(userCfgDir);
    std::string content = readFileToString(vcfgPath);
    if (content.empty()) return bindings;

    auto tokens = tokenizeVdf(content);
    for (size_t i = 0; i + 2 < tokens.size(); ++i) {
        if (tokens[i] == "bindings" && tokens[i + 1] == "{") {
            size_t cursor = i + 2;
            while (cursor + 1 < tokens.size() && tokens[cursor] != "}") {
                std::string key = tokens[cursor];
                std::string val = tokens[cursor + 1];
                bindings[key] = val;
                cursor += 2;
            }
            break;
        }
    }
    return bindings;
}

ConvarsSummary inspectConvars(const std::string& userCfgDir) {
    ConvarsSummary summary;
    if (userCfgDir.empty()) return summary;

    auto convars = readUserConvars(userCfgDir);
    summary.totalCount = convars.size();

    auto bindings = readUserKeybinds(userCfgDir);
    summary.totalBindings = bindings.size();

    return summary;
}

bool cleanAllConvars(const std::string& userCfgDir) {
    if (userCfgDir.empty()) return false;

    const fs::path vcfgPath = findConvarsFile(userCfgDir);
    return writeConfigWithBackup(vcfgPath.u8string(), "\"config\"\n{\n\t\"convars\"\n\t{\n\t}\n}\n", "clear-convars").success;
}

bool cleanAllKeybinds(const std::string& userCfgDir) {
    if (userCfgDir.empty()) return false;

    const fs::path vcfgPath = findKeybindsFile(userCfgDir);
    return writeConfigWithBackup(vcfgPath.u8string(), "\"config\"\n{\n\t\"bindings\"\n\t{\n\t}\n}\n", "clear-keybinds").success;
}

} // namespace srp::core
