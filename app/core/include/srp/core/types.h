#pragma once

#include <string>
#include <vector>
#include <optional>
#include <cstdint>

namespace srp::core {

constexpr uint64_t STEAM_ID_OFFSET = 76561197960265728ULL;
constexpr const char* DEFAULT_CS2_FOLDER = "Counter-Strike Global Offensive";

enum class Cs2InstallState {
    NotInstalled,
    Installed,
    NeedsUpdate
};

struct SteamUser {
    std::string steamId64;
    std::string accountId;
    std::optional<std::string> personaName;
};

struct LoginUsers {
    std::vector<SteamUser> users;
    std::optional<SteamUser> currentUser;
    bool hasAutoLoginUser = false;
};

struct DetectionResult {
    std::optional<std::string> steamPath;
    Cs2InstallState cs2InstallState = Cs2InstallState::NotInstalled;
    std::optional<std::string> cs2InstallDir;
    std::optional<std::string> cs2CfgPath;
    std::optional<std::string> annotationsPath;
    std::optional<std::string> userCfgPath;
    std::vector<SteamUser> steamUsers;
    std::optional<SteamUser> currentUser;
    bool hasAutoLoginUser = false;
};

} // namespace srp::core
