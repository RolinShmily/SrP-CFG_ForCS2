#pragma once
#include <string>
#include <vector>
namespace srp::core {
struct CatalogEntry {
    std::string id, name, category, directory, command, keymapCommand, map;
    std::string descriptionZh, descriptionEn;
    std::vector<std::string> files, tagsZh, tagsEn;
};
struct ConfigCatalog {
    bool success = true;
    std::string error;
    std::vector<CatalogEntry> entries;
};
// Explicit roots avoid package initialization recursion during archive validation.
ConfigCatalog readConfigCatalog(const std::string& packageId, const std::string& packageDirectory);
std::vector<CatalogEntry> configCatalog(const std::string& packageId, const std::string& packageDirectory = {});
bool catalogSafePath(const std::string& relative);
bool catalogIdentifier(const std::string& id);
bool catalogEntryAvailable(const CatalogEntry& entry, const std::string& packageDirectory, bool keymap = false);
bool catalogFileAllowed(const std::string& packageId, const std::string& relative, const std::string& packageDirectory);
}
