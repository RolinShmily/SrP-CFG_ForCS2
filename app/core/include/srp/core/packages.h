#pragma once
#include "srp/core/config_backup.h"
#include <string>
#include <vector>

namespace srp::core {
struct ConfigPackage {
    std::string id, version, sha256, url;
    size_t size = 0;
};
struct PackageFileState {
    bool modified = false, outdated = false;
    std::string baseVersion;
};
// The override is an explicit path, useful for portable profiles and isolated tests.
std::string packageStoreRoot();
void setPackageStoreRoot(const std::string& root);
void setBundledConfigDir(const std::string& root);
std::string findBundledConfigDir();
ConfigWriteResult initializePackages();
std::string packageOriginalDir();
std::string packageWorkDir();
std::string packageVersion(const std::string& id);
std::string packageDigest(const std::string& id);
std::string packageFileBaseline(const std::string& id, const std::string& relative);
std::string packageFilePath(const std::string& id, const std::string& relative, bool original = false);
PackageFileState inspectPackageFile(const std::string& id, const std::string& relative);
ConfigWriteResult savePackageFile(const std::string& id, const std::string& relative, const std::string& content,
    const std::string& baselineVersion = {}, const std::string& baselineContent = {});
ConfigWriteResult resetPackageFile(const std::string& id, const std::string& relative);
std::string packageManifestUrl();
bool parsePackageManifest(const std::string& json, std::vector<ConfigPackage>& packages, std::string& error);
ConfigWriteResult checkPackageUpdates(std::vector<ConfigPackage>& packages);
ConfigWriteResult updatePackage(const std::string& id);
// Validates an already-downloaded archive against an explicitly supplied trusted manifest entry.
ConfigWriteResult importPackageArchive(const ConfigPackage& package, const std::string& archive);
// Local directory promotion uses the same transaction/draft-preservation path, for verification.
ConfigWriteResult promotePackageDirectory(const std::string& id, const std::string& directory);
}
