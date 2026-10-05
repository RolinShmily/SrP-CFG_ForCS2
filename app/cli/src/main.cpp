#include "srp/core/detection.h"
#include "srp/core/i18n.h"
#include "srp/core/vcfg.h"
#include "srp/core/actions.h"
#include "srp/core/preset.h"
#include "srp/core/assembly.h"

#include <iostream>
#include <string_view>
#include <vector>

#if defined(_WIN32)
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#endif

namespace {

void printHelp() {
    std::cout << "Usage: srp_cli [command] [options]\n\n";
    std::cout << "Commands:\n";
    std::cout << "  detect             Run full environment and path diagnostics (default)\n";
    std::cout << "  launch             Launch CS2 game via Steam protocol\n";
    std::cout << "  reset-valve        Reset current user custom.cfg to Valve Baseline\n";
    std::cout << "  open-cfg           Open CS2 global CFG directory in explorer\n";
    std::cout << "  open-user-cfg      Open current Steam user local CFG directory in explorer\n";
    std::cout << "  convars-status     Inspect Convars in current user's VCFG\n";
    std::cout << "  convars-clean-all  Remove all convars from current user's VCFG (creates .bak)\n";
    std::cout << "  keybinds-clean-all Remove all keybinds from current user's VCFG (creates .bak)\n";
    std::cout << "  presets            List all presets and their status/diff\n";
    std::cout << "  preset-load <id>   Load preset into custom.cfg\n";
    std::cout << "  preset-unload      Unload presets from custom.cfg\n";
    std::cout << "  valve-status       Inspect Valve assembly entries in custom.cfg\n";
    std::cout << "  valve-assemble     Assemble --settings and/or --keymap; cancels active preset\n";
    std::cout << "  valve-unload       Unload only --settings and/or --keymap\n";
    std::cout << "  modules            List feature and mode entry states\n";
    std::cout << "  feature-assemble <id>  Add feature, optionally --keymap\n";
    std::cout << "  feature-unload <id>    Remove all direct feature entries\n";
    std::cout << "  mode-bind <id> --key <key> [--keymap] [--confirm]  Bind launcher\n";
    std::cout << "  mode-unbind <id>   Remove mode launchers and legacy direct entries\n";
    std::cout << "  users              List all detected Steam users\n";
    std::cout << "  switch-user <id>   Inspect state for a specific Steam AccountID\n\n";
    std::cout << "Options:\n";
    std::cout << "  --en, --english    Use English output\n";
    std::cout << "  --zh               Use Chinese output\n";
    std::cout << "  --cfg-dir <path>   Explicit game CFG directory (assembly/preset commands)\n";
    std::cout << "  --key <key>        CS2 mode launch key (e.g. f6, p, mouse5)\n";
    std::cout << "  --confirm          Accept a mode binding conflict\n";
    std::cout << "  --settings         Select Valve settings\n";
    std::cout << "  --keymap           Include keymap (Valve/features/mode entry)\n";
    std::cout << "  -h, --help         Show this help message\n";
}

void printDiagnostics(const srp::core::DetectionResult& res) {
    std::cout << "========================================\n";
    std::cout << "   SrP-CFG Environment Diagnostics (C++)\n";
    std::cout << "========================================\n\n";

    if (res.steamPath) {
        std::cout << "[✓] " << srp::core::tr("detect.steam.found") << *res.steamPath << "\n";
    } else {
        std::cout << "[✗] " << srp::core::tr("detect.steam.not_found") << "\n";
    }

    switch (res.cs2InstallState) {
        case srp::core::Cs2InstallState::Installed:
            std::cout << "[✓] " << srp::core::tr("detect.cs2.installed")
                      << res.cs2InstallDir.value_or("N/A") << "\n";
            break;
        case srp::core::Cs2InstallState::NeedsUpdate:
            std::cout << "[!] " << srp::core::tr("detect.cs2.needs_update")
                      << res.cs2InstallDir.value_or("N/A") << "\n";
            break;
        case srp::core::Cs2InstallState::NotInstalled:
            std::cout << "[✗] " << srp::core::tr("detect.cs2.not_installed") << "\n";
            break;
    }

    if (res.cs2Version) {
        std::cout << "[i] CS2 Version: " << *res.cs2Version << "\n";
    }

    if (res.cs2CfgPath) {
        std::cout << "[✓] " << srp::core::tr("detect.cfg.found") << *res.cs2CfgPath << "\n";
    } else {
        std::cout << "[-] " << srp::core::tr("detect.cfg.not_found") << "\n";
    }

    if (res.annotationsPath) {
        std::cout << "[✓] " << srp::core::tr("detect.annotations.found") << *res.annotationsPath << "\n";
    }

    std::cout << "\n----------------------------------------\n";
    std::cout << " Steam Accounts Detected: " << res.steamUsers.size() << "\n";
    std::cout << "----------------------------------------\n";
    for (const auto& u : res.steamUsers) {
        bool isCurrent = res.currentUser && (res.currentUser->accountId == u.accountId);
        std::cout << (isCurrent ? " * " : "   ")
                  << u.personaName.value_or(u.accountId)
                  << " [ID32: " << u.accountId << ", ID64: " << u.steamId64 << "]\n";
    }

    if (res.userCfgPath) {
        std::cout << "\n[✓] " << srp::core::tr("detect.user_cfg.found") << *res.userCfgPath << "\n";
        auto convarsSummary = srp::core::inspectConvars(*res.userCfgPath);
        std::cout << "[i] Convars: " << convarsSummary.totalCount
                  << ", Keybinds: " << convarsSummary.totalBindings << "\n";
    }

    std::cout << "\n[✓] " << srp::core::tr("detect.complete") << "\n";
}

} // namespace

int main(int argc, char* argv[]) {
#if defined(_WIN32)
    SetConsoleOutputCP(CP_UTF8);
#endif

    std::string command = "detect";
    std::string targetAccountId;
    bool useEnglish = false;
    std::string explicitCfgDir;
    bool valveSettings = false, valveKeymap = false, confirmBinding = false;
    std::string launchKey;

    for (int i = 1; i < argc; ++i) {
        std::string_view arg(argv[i]);
        if (arg == "--en" || arg == "--english") {
            useEnglish = true;
        } else if (arg == "--zh") {
            useEnglish = false;
        } else if (arg == "--cfg-dir") {
            if (i + 1 >= argc) { std::cerr << "--cfg-dir requires a path\n"; return 1; }
            explicitCfgDir = argv[++i];
            if (explicitCfgDir.empty()) { std::cerr << "Empty CFG path\n"; return 1; }
        } else if (arg == "--key") {
            if (i + 1 >= argc) { std::cerr << "--key requires a CS2 key name\n"; return 1; }
            launchKey = argv[++i];
        } else if (arg == "--confirm") {
            confirmBinding = true;
        } else if (arg == "--settings") {
            valveSettings = true;
        } else if (arg == "--keymap") {
            valveKeymap = true;
        } else if (arg == "-h" || arg == "--help") {
            printHelp();
            return 0;
        } else if (arg == "detect" || arg == "launch" || arg == "reset-valve" ||
                   arg == "open-cfg" || arg == "open-user-cfg" ||
                   arg == "convars-status" || arg == "convars-clean-all" ||
                   arg == "convars-clean-srp" || arg == "users") {
            command = std::string(arg);
        } else if (arg == "switch-user" || arg == "preset-load" || arg == "feature-assemble" || arg == "feature-unload" || arg == "mode-bind" || arg == "mode-unbind") {
            command = std::string(arg);
            if (i + 1 < argc) {
                targetAccountId = argv[++i];
            }
        } else if (arg.empty() || arg[0] != '-') {
            command = std::string(arg);
        }
    }

    srp::core::setLanguage(useEnglish ? srp::core::Language::EnUS : srp::core::Language::ZhCN);

    auto res = explicitCfgDir.empty() ? srp::core::detectAll() : srp::core::DetectionResult{};
    if (!explicitCfgDir.empty()) res.cs2CfgPath = explicitCfgDir;

    if (command == "modules" || command == "feature-assemble" || command == "feature-unload" || command == "mode-bind" || command == "mode-unbind") {
        const auto cfg = res.cs2CfgPath.value_or("");
        if (cfg.empty()) { std::cerr << srp::core::tr("feedback.invalid_cfg_dir") << '\n'; return 1; }
        if (command != "modules") {
            srp::core::ConfigWriteResult result;
            if (command == "mode-bind") {
                const auto plan = srp::core::planModeBinding(cfg, targetAccountId, launchKey, valveKeymap);
                if (!plan.success) { std::cerr << srp::core::tr(plan.error) << '\n'; return 1; }
                if (plan.needsConfirmation && !confirmBinding) {
                    std::cerr << srp::core::tr("assembly.binding_conflict") << ": " << launchKey << '\n'
                        << plan.previousCommand << " -> " << plan.newCommand << "\nUse --confirm to accept\n";
                    return 2;
                }
                result = srp::core::applyModeBinding(cfg, plan, confirmBinding);
            } else if (command == "mode-unbind") result = srp::core::removeModeBinding(cfg, targetAccountId);
            else if (command == "feature-unload") result = srp::core::unloadFeature(cfg, targetAccountId);
            else result = srp::core::assembleFeature(cfg, targetAccountId, valveKeymap);
            if (!result.success) { std::cerr << srp::core::tr(result.error.rfind("assembly.", 0) == 0 ? result.error : "valve.write_failed") << '\n'; return 1; }
            const char* message = command == "mode-bind" ? "assembly.mode_bound" : command == "mode-unbind" ? "assembly.mode_removed"
                : command == "feature-unload" ? "assembly.feature_removed" : "assembly.feature_added";
            std::cout << srp::core::tr(result.changed ? message : "valve.no_changes") << '\n';
        }
        for (const auto& entry : srp::core::assemblyModules()) {
            const auto state = srp::core::inspectModuleAssembly(cfg, entry.id);
            std::cout << entry.id << ": ";
            if (entry.category == "features") std::cout << srp::core::tr(state.settings ? (state.keymap ? "assembly.with_keys_state" : "assembly.settings_state") : "valve.not_assembled");
            else {
                std::cout << srp::core::tr(state.legacyAutoLoad ? "assembly.legacy" : state.launchKeys.empty() ? "assembly.not_bound" : "assembly.launch_key");
                for (const auto& key : state.launchKeys) std::cout << " " << key;
            }
            std::cout << '\n';
        }
        return 0;
    }
    if (command == "valve-status" || command == "valve-assemble" || command == "valve-unload") {
        const std::string cfg = res.cs2CfgPath.value_or("");
        if (cfg.empty()) { std::cerr << srp::core::tr("feedback.invalid_cfg_dir") << "\n"; return 1; }
        if (command != "valve-status") {
            if (!valveSettings && !valveKeymap) { std::cerr << "Use --settings and/or --keymap\n"; return 1; }
            const auto result = command == "valve-assemble" ? srp::core::assembleValve(cfg, valveSettings, valveKeymap)
                                                            : srp::core::disassembleValve(cfg, valveSettings, valveKeymap);
            if (!result.success) { std::cerr << srp::core::tr("valve.write_failed") << "\n"; return 1; }
            std::cout << srp::core::tr(!result.changed ? "valve.no_changes" : command == "valve-assemble" ? "valve.assembled" : "valve.unloaded") << "\n";
        }
        const auto state = srp::core::inspectValveAssembly(cfg);
        auto label = [](bool assembled) { return srp::core::tr(assembled ? "valve.assembled_state" : "valve.not_assembled"); };
        std::cout << srp::core::tr("valve.settings") << ": " << label(state.settings) << "\n"
                  << srp::core::tr("valve.keymap") << ": " << label(state.keymap) << "\n";
        if (!state.activePresetId.empty()) std::cout << "Preset: " << state.activePresetId << "\n";
        return 0;
    }
    if (!explicitCfgDir.empty() && command != "presets" && command != "preset-load" && command != "preset-unload") {
        std::cerr << "--cfg-dir is supported only by assembly and preset commands\n";
        return 1;
    }

    if (command == "detect") {
        printDiagnostics(res);
        return 0;
    }

    if (command == "launch") {
        std::cout << "[*] Dispatching CS2 launch command...\n";
        if (srp::core::launchCs2()) {
            std::cout << "[✓] " << srp::core::tr("feedback.launch_success") << "\n";
            return 0;
        } else {
            std::cerr << "[✗] " << srp::core::tr("feedback.launch_failed") << "\n";
            return 1;
        }
    }

    if (command == "open-cfg") {
        if (!res.cs2CfgPath) {
            std::cerr << "[✗] Global CFG path not detected.\n";
            return 1;
        }
        std::cout << "[*] Opening: " << *res.cs2CfgPath << "\n";
        srp::core::openFolderInExplorer(*res.cs2CfgPath);
        return 0;
    }

    if (command == "open-user-cfg") {
        if (!res.userCfgPath) {
            std::cerr << "[✗] User CFG path not detected.\n";
            return 1;
        }
        std::cout << "[*] Opening: " << *res.userCfgPath << "\n";
        srp::core::openFolderInExplorer(*res.userCfgPath);
        return 0;
    }

    if (command == "reset-valve") {
        if (!res.cs2CfgPath) {
            std::cerr << srp::core::tr("feedback.invalid_cfg_dir") << "\n";
            return 1;
        }
        if (srp::core::resetValveBaseline(*res.cs2CfgPath, res.userCfgPath.value_or(""))) {
            std::cout << "[✓] " << srp::core::tr("feedback.reset_success") << "\n";
            return 0;
        } else {
            std::cerr << "[✗] Failed to reset Valve Baseline.\n";
            return 1;
        }
    }

    if (command == "convars-status") {
        if (!res.userCfgPath) {
            std::cerr << "[✗] User CFG path not detected.\n";
            return 1;
        }
        auto summary = srp::core::inspectConvars(*res.userCfgPath);
        std::cout << "Config in " << *res.userCfgPath << ":\n";
        std::cout << "  - Convars:  " << summary.totalCount << "\n";
        std::cout << "  - Keybinds: " << summary.totalBindings << "\n";
        return 0;
    }

    if (command == "convars-clean-all") {
        if (!res.userCfgPath) {
            std::cerr << "[✗] User CFG path not detected.\n";
            return 1;
        }
        if (srp::core::cleanAllConvars(*res.userCfgPath)) {
            std::cout << "[✓] " << srp::core::tr("feedback.clean_all_success") << "\n";
            return 0;
        } else {
            std::cerr << "[✗] Failed to clear Convars.\n";
            return 1;
        }
    }

    if (command == "keybinds-clean-all") {
        if (!res.userCfgPath) {
            std::cerr << "[✗] User CFG path not detected.\n";
            return 1;
        }
        if (srp::core::cleanAllKeybinds(*res.userCfgPath)) {
            std::cout << "[✓] " << srp::core::tr("feedback.clean_keybinds_success") << "\n";
            return 0;
        } else {
            std::cerr << "[✗] Failed to clear Keybinds.\n";
            return 1;
        }
    }

    if (command == "presets") {
        std::string cfgDir = res.cs2CfgPath.value_or("");
        auto presets = srp::core::scanPresets(cfgDir);
        std::string active = srp::core::getActivePresetId(cfgDir);
        std::cout << "Available Presets (" << presets.size() << "):\n";
        for (const auto& p : presets) {
            bool isActive = (p.id == active);
            std::cout << (isActive ? " [Active] " : "          ")
                      << p.displayName << (p.hasDiff ? " (*)" : "")
                      << "  ->  Command: " << p.command << "\n";
        }
        return 0;
    }

    if (command == "preset-load") {
        if (targetAccountId.empty()) {
            std::cerr << "Usage: srp_cli preset-load <preset_id>\n";
            return 1;
        }
        std::string cfgDir = res.cs2CfgPath.value_or("");
        if (srp::core::loadPreset(targetAccountId, cfgDir)) {
            std::cout << "[✓] " << srp::core::tr("presets.load_notify") << " (" << targetAccountId << ")\n";
            return 0;
        } else {
            std::cerr << "[✗] Failed to load preset: " << targetAccountId << "\n";
            return 1;
        }
    }

    if (command == "preset-unload") {
        std::string cfgDir = res.cs2CfgPath.value_or("");
        if (srp::core::unloadPreset(cfgDir)) {
            std::cout << "[✓] " << srp::core::tr("presets.unload_notify") << "\n";
            return 0;
        } else {
            std::cerr << "[✗] Failed to unload preset.\n";
            return 1;
        }
    }

    if (command == "users") {
        std::cout << "Detected Steam Users (" << res.steamUsers.size() << "):\n";
        for (const auto& u : res.steamUsers) {
            bool isCurrent = res.currentUser && (res.currentUser->accountId == u.accountId);
            std::cout << (isCurrent ? " * " : "   ")
                      << u.personaName.value_or(u.accountId)
                      << " (ID32: " << u.accountId << ", ID64: " << u.steamId64 << ")\n";
        }
        return 0;
    }

    if (command == "switch-user") {
        if (targetAccountId.empty()) {
            std::cerr << "Usage: srp_cli switch-user <account_id>\n";
            return 1;
        }
        if (!res.steamPath) {
            std::cerr << "[✗] Steam path not found.\n";
            return 1;
        }
        auto targetPath = srp::core::detectUserCfgPath(*res.steamPath, targetAccountId);
        if (targetPath) {
            std::cout << "[✓] " << srp::core::tr("feedback.account_switched") << targetAccountId << "\n";
            std::cout << "User CFG path: " << *targetPath << "\n";
            auto summary = srp::core::inspectConvars(*targetPath);
            std::cout << "Convars: " << summary.totalCount
                      << ", Keybinds: " << summary.totalBindings << "\n";
            return 0;
        } else {
            std::cerr << "[✗] Failed to locate user CFG directory for ID: " << targetAccountId << "\n";
            return 1;
        }
    }

    std::cerr << "Unknown command: " << command << "\n";
    printHelp();
    return 1;
}
