#pragma once

#include "srp/core/types.h"
#include <string>
#include <vector>
#include <optional>

namespace srp::core {

// ── 纯字符串与 VDF / ACF 解析 ────────────────────────────────
std::vector<std::string> parseLibraryPaths(std::string_view vdfContent);
std::optional<std::string> parseAcfValue(std::string_view content, std::string_view key);
std::optional<Cs2InstallState> parseCs2ManifestState(std::string_view acfContent);
std::string cs2GameDir(std::string_view library, std::optional<std::string_view> acfContent = std::nullopt);
std::optional<std::string> steamId64ToAccountId(std::string_view steamId64);
LoginUsers parseLoginUsers(std::string_view content);

// ── 系统与路径探测（Windows 注册表与文件系统）───────────────────
std::optional<std::string> detectSteamPath();
std::vector<std::string> readLibraryPaths(const std::string& steamRoot);
std::pair<Cs2InstallState, std::optional<std::string>> detectCs2InstallState(const std::vector<std::string>& libraries);
std::optional<std::string> detectCs2CfgPath(const std::vector<std::string>& libraries);
std::optional<std::string> detectAnnotationsPath(const std::vector<std::string>& libraries);
LoginUsers detectSteamUsers(const std::string& steamRoot);
std::optional<std::string> detectUserCfgPath(const std::string& steamRoot, const std::string& accountId);

// ── 综合检测调度 ──────────────────────────────────────────────
DetectionResult detectAll();

} // namespace srp::core
