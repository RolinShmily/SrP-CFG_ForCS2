#include "srp/core/detection.h"
#include "srp/core/i18n.h"

#include <algorithm>
#include <cctype>
#include <charconv>
#include <filesystem>
#include <fstream>
#include <set>
#include <sstream>

#if defined(_WIN32)
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#endif

namespace srp::core {

namespace fs = std::filesystem;

namespace {

bool startsWith(std::string_view str, std::string_view prefix) {
    if (str.size() < prefix.size()) return false;
    return str.substr(0, prefix.size()) == prefix;
}

std::string readFileToString(const fs::path& filePath) {
    std::ifstream file(filePath, std::ios::in | std::ios::binary);
    if (!file) return {};
    std::ostringstream ss;
    ss << file.rdbuf();
    return ss.str();
}

std::string normalizeSeparators(std::string pathStr) {
    std::replace(pathStr.begin(), pathStr.end(), '/', '\\');
    while (!pathStr.empty() && pathStr.back() == '\\') {
        pathStr.pop_back();
    }
    return pathStr;
}

#if defined(_WIN32)
std::optional<std::string> readRegistryString(HKEY rootKey, const std::wstring& subKey, const std::wstring& valueName) {
    HKEY hKey = nullptr;
    if (RegOpenKeyExW(rootKey, subKey.c_str(), 0, KEY_READ, &hKey) != ERROR_SUCCESS) {
        return std::nullopt;
    }

    wchar_t buffer[1024] = {0};
    DWORD bufferSize = sizeof(buffer);
    DWORD type = 0;
    LONG res = RegQueryValueExW(hKey, valueName.c_str(), nullptr, &type, reinterpret_cast<LPBYTE>(buffer), &bufferSize);
    RegCloseKey(hKey);

    if (res == ERROR_SUCCESS && (type == REG_SZ || type == REG_EXPAND_SZ)) {
        int utf8Len = WideCharToMultiByte(CP_UTF8, 0, buffer, -1, nullptr, 0, nullptr, nullptr);
        if (utf8Len > 0) {
            std::string utf8Str(utf8Len - 1, '\0');
            WideCharToMultiByte(CP_UTF8, 0, buffer, -1, utf8Str.data(), utf8Len, nullptr, nullptr);
            return utf8Str;
        }
    }
    return std::nullopt;
}
#endif

} // namespace

// ─────────────────────────────────────────────────────────────
// 纯字符串与 VDF / ACF 解析
// ─────────────────────────────────────────────────────────────

std::vector<std::string> parseLibraryPaths(std::string_view vdfContent) {
    std::vector<std::string> paths;
    const std::string_view needle = "\"path\"";
    size_t i = 0;
    const size_t n = vdfContent.size();

    while (i < n) {
        if (startsWith(vdfContent.substr(i), needle)) {
            i += needle.size();
            while (i < n && std::isspace(static_cast<unsigned char>(vdfContent[i]))) {
                i++;
            }
            if (i < n && vdfContent[i] == '"') {
                i++;
                size_t start = i;
                while (i < n && vdfContent[i] != '"') {
                    i++;
                }
                std::string raw(vdfContent.substr(start, i - start));
                // 归一化双斜杠处理
                std::string normalized;
                normalized.reserve(raw.size());
                for (size_t k = 0; k < raw.size(); k++) {
                    if (raw[k] == '\\' && k + 1 < raw.size() && raw[k + 1] == '\\') {
                        normalized.push_back('\\');
                        k++;
                    } else {
                        normalized.push_back(raw[k]);
                    }
                }
                paths.push_back(normalized);
                if (i < n) i++;
                continue;
            }
        }
        i++;
    }
    return paths;
}

std::optional<std::string> parseAcfValue(std::string_view content, std::string_view key) {
    std::string needle = "\"" + std::string(key) + "\"";
    size_t i = 0;
    const size_t n = content.size();

    while (i < n) {
        if (startsWith(content.substr(i), needle)) {
            i += needle.size();
            while (i < n && std::isspace(static_cast<unsigned char>(content[i]))) {
                i++;
            }
            if (i < n && content[i] == '"') {
                i++;
                size_t start = i;
                while (i < n && content[i] != '"') {
                    i++;
                }
                return std::string(content.substr(start, i - start));
            }
        }
        i++;
    }
    return std::nullopt;
}

std::optional<Cs2InstallState> parseCs2ManifestState(std::string_view acfContent) {
    auto flagsStr = parseAcfValue(acfContent, "StateFlags");
    if (!flagsStr) return std::nullopt;

    uint64_t flags = 0;
    auto [ptr, ec] = std::from_chars(flagsStr->data(), flagsStr->data() + flagsStr->size(), flags);
    if (ec != std::errc()) return std::nullopt;

    if ((flags & 4) != 0 || flags == 4) {
        if ((flags & 2) != 0) {
            return Cs2InstallState::NeedsUpdate;
        }
        return Cs2InstallState::Installed;
    }
    return std::nullopt;
}

std::string cs2GameDir(std::string_view library, std::optional<std::string_view> acfContent) {
    std::string folder = DEFAULT_CS2_FOLDER;
    if (acfContent) {
        if (auto dir = parseAcfValue(*acfContent, "installdir"); dir && !dir->empty()) {
            folder = *dir;
        }
    }
    fs::path p = fs::u8path(library);
    p = p / "steamapps" / "common" / folder;
    return p.string();
}

std::optional<std::string> steamId64ToAccountId(std::string_view steamId64) {
    uint64_t id = 0;
    auto [ptr, ec] = std::from_chars(steamId64.data(), steamId64.data() + steamId64.size(), id);
    if (ec != std::errc()) return std::nullopt;

    uint64_t accId = (id >= STEAM_ID_OFFSET) ? (id - STEAM_ID_OFFSET) : 0;
    return std::to_string(accId);
}

LoginUsers parseLoginUsers(std::string_view content) {
    LoginUsers result;
    std::optional<SteamUser> maxTsUser;
    int64_t maxTs = -1;

    size_t i = 0;
    const size_t n = content.size();

    while (i < n) {
        if (content[i] == '"') {
            size_t j = i + 1;
            size_t digits = 0;
            while (j < n && std::isdigit(static_cast<unsigned char>(content[j]))) {
                digits++;
                j++;
            }
            if (digits >= 17 && j < n && content[j] == '"') {
                std::string steamId64(content.substr(i + 1, j - (i + 1)));
                j++;
                while (j < n && std::isspace(static_cast<unsigned char>(content[j]))) {
                    j++;
                }
                if (j < n && content[j] == '{') {
                    size_t start = j + 1;
                    size_t end = content.find('}', start);
                    if (end == std::string_view::npos) end = n;
                    std::string_view block = content.substr(start, end - start);

                    auto persona = parseAcfValue(block, "PersonaName");
                    bool autoLogin = (parseAcfValue(block, "AutoLogin") == "1");
                    bool allowAuto = (parseAcfValue(block, "AllowAutoLogin") == "1");
                    bool mostRecent = (parseAcfValue(block, "mostrecent") == "1");
                    bool isAutoLogin = autoLogin || allowAuto || mostRecent;

                    int64_t timestamp = 0;
                    if (auto tsStr = parseAcfValue(block, "Timestamp")) {
                        std::from_chars(tsStr->data(), tsStr->data() + tsStr->size(), timestamp);
                    }

                    auto accountId = steamId64ToAccountId(steamId64).value_or("");
                    SteamUser user{steamId64, accountId, persona};
                    result.users.push_back(user);

                    if (isAutoLogin && !result.currentUser) {
                        result.currentUser = user;
                    }
                    if (timestamp > maxTs) {
                        maxTs = timestamp;
                        maxTsUser = user;
                    }
                    i = end + 1;
                    continue;
                }
            }
        }
        i++;
    }

    if (!result.currentUser) {
        if (maxTsUser) {
            result.currentUser = maxTsUser;
        } else if (result.users.size() == 1) {
            result.currentUser = result.users[0];
        }
    }

    result.hasAutoLoginUser = result.currentUser.has_value();
    return result;
}

// ─────────────────────────────────────────────────────────────
// 系统与路径探测
// ─────────────────────────────────────────────────────────────

#if defined(_WIN32)
struct RegItem {
    HKEY root;
    const wchar_t* subKey;
    const wchar_t* val;
};
#endif

std::optional<std::string> detectSteamPath() {
    std::set<std::string> candidates;

#if defined(_WIN32)
    // 1. 注册表查询
    const RegItem regPaths[] = {
        {HKEY_CURRENT_USER, L"Software\\Valve\\Steam", L"SteamPath"},
        {HKEY_CURRENT_USER, L"Software\\Valve\\Steam", L"InstallPath"},
        {HKEY_LOCAL_MACHINE, L"SOFTWARE\\Valve\\Steam", L"InstallPath"},
        {HKEY_LOCAL_MACHINE, L"SOFTWARE\\Wow6432Node\\Valve\\Steam", L"InstallPath"}
    };

    for (const auto& item : regPaths) {
        if (auto p = readRegistryString(item.root, item.subKey, item.val)) {
            std::string norm = normalizeSeparators(*p);
            std::error_code ec;
            if (fs::exists(fs::u8path(norm), ec)) {
                candidates.insert(norm);
            }
        }
    }
#endif

    // 2. 默认路径回退
    const char* defaultDirs[] = {
        "C:\\Program Files (x86)\\Steam",
        "C:\\Program Files\\Steam",
        "C:\\Steam",
        "D:\\Steam",
        "E:\\Steam"
    };
    for (const char* p : defaultDirs) {
        std::error_code ec;
        if (fs::exists(fs::u8path(p), ec)) {
            candidates.insert(p);
        }
    }

    // 3. 计分选优
    std::optional<std::string> bestPath;
    int bestScore = -1;

    for (const auto& p : candidates) {
        fs::path dir = fs::u8path(p);
        std::error_code ec;
        if (!fs::exists(dir / "steam.exe", ec)) {
            continue;
        }
        int score = 1;
        if (fs::exists(dir / "config" / "loginusers.vdf", ec)) score += 10;
        if (fs::exists(dir / "userdata", ec)) score += 10;
        if (fs::exists(dir / "steamapps" / "libraryfolders.vdf", ec)) score += 5;

        if (score > bestScore) {
            bestScore = score;
            bestPath = p;
        }
    }

    return bestPath;
}

std::vector<std::string> readLibraryPaths(const std::string& steamRoot) {
    std::vector<std::string> libraries;
    fs::path vdfPath = fs::u8path(steamRoot) / "steamapps" / "libraryfolders.vdf";

    std::string content = readFileToString(vdfPath);
    if (!content.empty()) {
        libraries = parseLibraryPaths(content);
    }

    // 确保 steamRoot 本身在首位
    bool foundRoot = false;
    for (const auto& lib : libraries) {
        if (fs::equivalent(fs::u8path(lib), fs::u8path(steamRoot), std::error_code{})) {
            foundRoot = true;
            break;
        }
    }
    if (!foundRoot) {
        libraries.insert(libraries.begin(), steamRoot);
    }
    return libraries;
}

std::pair<Cs2InstallState, std::optional<std::string>> detectCs2InstallState(const std::vector<std::string>& libraries) {
    for (const auto& lib : libraries) {
        fs::path manifestPath = fs::u8path(lib) / "steamapps" / "appmanifest_730.acf";
        std::string content = readFileToString(manifestPath);
        if (content.empty()) continue;

        if (auto state = parseCs2ManifestState(content)) {
            std::string gamePath = cs2GameDir(lib, content);
            return {*state, gamePath};
        }
    }
    return {Cs2InstallState::NotInstalled, std::nullopt};
}

std::optional<std::string> detectCs2CfgPath(const std::vector<std::string>& libraries) {
    for (const auto& lib : libraries) {
        fs::path candidate = fs::u8path(cs2GameDir(lib, std::nullopt)) / "game" / "csgo" / "cfg";
        std::error_code ec;
        if (fs::exists(candidate, ec)) {
            return candidate.string();
        }
    }
    return std::nullopt;
}

std::optional<std::string> detectAnnotationsPath(const std::vector<std::string>& libraries) {
    for (const auto& lib : libraries) {
        fs::path csgoDir = fs::u8path(cs2GameDir(lib, std::nullopt)) / "game" / "csgo";
        std::error_code ec;
        if (!fs::exists(csgoDir, ec)) {
            continue;
        }
        fs::path target = csgoDir / "annotations" / "local";
        if (fs::exists(target, ec)) {
            return target.string();
        }
        // 自动创建
        if (fs::create_directories(target, ec)) {
            return target.string();
        }
    }
    return std::nullopt;
}

LoginUsers detectSteamUsers(const std::string& steamRoot) {
    fs::path vdfPath = fs::u8path(steamRoot) / "config" / "loginusers.vdf";
    std::string content = readFileToString(vdfPath);

    LoginUsers parsed = !content.empty() ? parseLoginUsers(content) : LoginUsers{};

    // 兜底扫描：若未能定位活跃账号，扫描 userdata 下的文件夹
    if (!parsed.currentUser) {
        fs::path userdataDir = fs::u8path(steamRoot) / "userdata";
        std::error_code ec;
        if (fs::exists(userdataDir, ec) && fs::is_directory(userdataDir, ec)) {
            struct UserEntry {
                fs::file_time_type mtime;
                SteamUser user;
            };
            std::vector<UserEntry> scanned;

            for (const auto& entry : fs::directory_iterator(userdataDir, ec)) {
                if (!entry.is_directory(ec)) continue;
                std::string folderName = entry.path().filename().string();
                if (folderName == "0") continue;
                if (!std::all_of(folderName.begin(), folderName.end(), [](unsigned char c) { return std::isdigit(c); })) {
                    continue;
                }

                auto mtime = entry.last_write_time(ec);
                uint64_t accIdNum = 0;
                std::from_chars(folderName.data(), folderName.data() + folderName.size(), accIdNum);
                uint64_t s64 = accIdNum + STEAM_ID_OFFSET;

                auto it = std::find_if(parsed.users.begin(), parsed.users.end(), [&](const SteamUser& u) {
                    return u.accountId == folderName;
                });

                SteamUser u;
                if (it != parsed.users.end()) {
                    u = *it;
                } else {
                    u = SteamUser{std::to_string(s64), folderName, "账号 (" + folderName + ")"};
                }
                scanned.push_back({mtime, u});
            }

            // 按最近写入时间排序
            std::sort(scanned.begin(), scanned.end(), [](const UserEntry& a, const UserEntry& b) {
                return a.mtime > b.mtime;
            });

            if (!scanned.empty()) {
                for (const auto& item : scanned) {
                    if (std::none_of(parsed.users.begin(), parsed.users.end(), [&](const SteamUser& existing) {
                        return existing.accountId == item.user.accountId;
                    })) {
                        parsed.users.push_back(item.user);
                    }
                }
                parsed.currentUser = scanned.front().user;
                parsed.hasAutoLoginUser = true;
            }
        }
    }

    return parsed;
}

std::optional<std::string> detectUserCfgPath(const std::string& steamRoot, const std::string& accountId) {
    if (accountId.empty()) return std::nullopt;

    fs::path userCfg = fs::u8path(steamRoot) / "userdata" / accountId / "730" / "local" / "cfg";
    std::error_code ec;
    if (fs::exists(userCfg, ec)) {
        return userCfg.string();
    }

    // 自动创建
    if (fs::create_directories(userCfg, ec)) {
        return userCfg.string();
    }
    return std::nullopt;
}

DetectionResult detectAll() {
    DetectionResult res;
    res.steamPath = detectSteamPath();
    if (!res.steamPath) {
        return res;
    }

    auto libraries = readLibraryPaths(*res.steamPath);
    auto [state, installDir] = detectCs2InstallState(libraries);
    res.cs2InstallState = state;
    res.cs2InstallDir = installDir;
    res.cs2CfgPath = detectCs2CfgPath(libraries);
    res.annotationsPath = detectAnnotationsPath(libraries);

    auto users = detectSteamUsers(*res.steamPath);
    res.steamUsers = users.users;
    res.currentUser = users.currentUser;
    res.hasAutoLoginUser = users.hasAutoLoginUser;

    if (res.currentUser) {
        res.userCfgPath = detectUserCfgPath(*res.steamPath, res.currentUser->accountId);
    }

    return res;
}

} // namespace srp::core
