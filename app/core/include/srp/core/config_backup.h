#pragma once
#include <string>

namespace srp::core {
struct ConfigWriteResult {
    bool success = false;
    bool changed = false;
    std::string error;
};
// Byte-preserving backups: latest .bak plus up to 20 timestamped revisions.
// A no-op does not alter backups. Failed writes leave the target intact.
ConfigWriteResult writeConfigWithBackup(const std::string& filePath,
    const std::string& content, const std::string& reason);
ConfigWriteResult removeConfigWithBackup(const std::string& filePath, const std::string& reason);
}
