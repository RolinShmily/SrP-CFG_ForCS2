#pragma once
#include <string>
namespace srp::core {
struct AppRelease {
    std::string version, tag, publishedAt, notesZh, notesEn;
};
struct AppUpdateResult {
    bool success = false, updateAvailable = false;
    AppRelease release;
    std::string error;
};
std::string applicationVersion();
std::string appReleaseManifestUrl();
std::string websiteUrl();
std::string blogUrl();
std::string projectUrl();
std::string releasesUrl();
bool parseAppRelease(const std::string& json, AppRelease& release);
// Stable versions only. Returns false for malformed versions rather than comparing strings.
bool compareAppVersions(const std::string& candidate, const std::string& current, bool& newer);
AppUpdateResult checkAppUpdate();
}
