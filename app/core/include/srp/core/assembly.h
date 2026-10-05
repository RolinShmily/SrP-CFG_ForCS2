#pragma once
#include "srp/core/config_backup.h"
#include <string>
#include <vector>

namespace srp::core {
struct AssemblyModule {
    std::string id, name, category, command;
    std::string directory() const { return category + "/" + id; }
};
const std::vector<AssemblyModule>& assemblyModules();
struct ModuleAssemblyState {
    bool settings = false, keymap = false;
    std::vector<std::string> launchKeys;
    bool legacyAutoLoad = false;
};
ModuleAssemblyState inspectModuleAssembly(const std::string& gameCfgDir, const std::string& moduleId);
ConfigWriteResult assembleFeature(const std::string& gameCfgDir, const std::string& moduleId, bool keymap);
ConfigWriteResult unloadFeature(const std::string& gameCfgDir, const std::string& moduleId);
struct ModeBindingPlan {
    bool success = false, needsConfirmation = false;
    std::string error, previousCommand, newCommand, originalContent, newContent;
};
ModeBindingPlan planModeBinding(const std::string& gameCfgDir, const std::string& moduleId,
    const std::string& key, bool keymap);
// Revalidate the snapshot before applying a confirmed plan.
ConfigWriteResult applyModeBinding(const std::string& gameCfgDir, const ModeBindingPlan& plan, bool confirmed = false);
ConfigWriteResult removeModeBinding(const std::string& gameCfgDir, const std::string& moduleId);
bool isValidLaunchKey(const std::string& key);
struct ValveAssemblyState {
    bool settings = false;
    bool keymap = false;
    std::string activePresetId;
};
ValveAssemblyState inspectValveAssembly(const std::string& gameCfgDir);
ConfigWriteResult assembleValve(const std::string& gameCfgDir, bool settings, bool keymap);
ConfigWriteResult disassembleValve(const std::string& gameCfgDir, bool settings, bool keymap);
// Shared baseline entry transformation: empty preset removes only preset commands.
ConfigWriteResult setPresetEntry(const std::string& gameCfgDir, const std::string& presetId);
std::string resolveAssemblyFilePath(const std::string& relativePath, const std::string& gameCfgDir,
    const std::string& sourceConfigDir = {});
std::string readAssemblyFile(const std::string& relativePath, const std::string& gameCfgDir,
    const std::string& sourceConfigDir = {});
ConfigWriteResult saveAssemblyFile(const std::string& relativePath, const std::string& content,
    const std::string& gameCfgDir);
ConfigWriteResult resetAssemblyFile(const std::string& relativePath, const std::string& gameCfgDir,
    const std::string& sourceConfigDir = {});
bool isAssemblyFileModified(const std::string& relativePath, const std::string& gameCfgDir,
    const std::string& sourceConfigDir = {});
}
