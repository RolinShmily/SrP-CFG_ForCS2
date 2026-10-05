#include "srp/core/assembly.h"
#include "srp/core/actions.h"
#include "srp/core/preset.h"
#include "srp/core/packages.h"
#include <filesystem>
#include <fstream>
#include <iostream>
#include <chrono>
#include <stdexcept>
#include <set>
#if defined(_WIN32)
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#endif
namespace fs = std::filesystem;
using namespace srp::core;
void require(bool value, const char* label) {
    if (!value) throw std::runtime_error(label);
    std::cout << "PASS: " << label << '\n';
}
void put(const fs::path& path, const std::string& content) {
    fs::create_directories(path.parent_path());
    std::ofstream out(path, std::ios::binary | std::ios::trunc);
    out << content;
    if (!out) throw std::runtime_error("Cannot write fixture");
}
std::string get(const fs::path& path) {
    std::ifstream in(path, std::ios::binary);
    if (!in) throw std::runtime_error("Cannot read fixture");
    return {std::istreambuf_iterator<char>(in), std::istreambuf_iterator<char>()};
}
size_t historyCount(const fs::path& path) {
    const auto dir = path.parent_path() / ".backups" / path.filename();
    if (!fs::exists(dir)) return 0;
    size_t n = 0;
    for (const auto& file : fs::directory_iterator(dir)) if (file.path().extension() == ".bak") ++n;
    return n;
}
struct TemporaryDirectory {
    fs::path path = fs::temp_directory_path() / ("srp-core-test-" + std::to_string(std::chrono::high_resolution_clock::now().time_since_epoch().count()));
    ~TemporaryDirectory() { std::error_code ec; fs::remove_all(path, ec); }
};
int main() {
    try {
        TemporaryDirectory temp;
        setPackageStoreRoot((temp.path / "store").u8string());
        require(initializePackages().success, "isolated package defaults");
        const auto dir = temp.path / "game-cfg";
        const auto custom = dir / "srp-cfg/user/custom.cfg";
        const auto source = temp.path / "source";
        require(installSrp(dir.u8string()), "install runtime entries for isolated regression");
        put(dir / "srp-cfg/runtime/init.cfg", "// runtime\n");
        put(dir / "autoexec.cfg", "exec srp-cfg/runtime/init.cfg\nexec srp-cfg/user/custom.cfg\n");
        const std::string userLayer = "// SrP-CFG User Layer\r\nsensitivity 1.20\r\nalias \"mine\" \"srp_apply_echo;exec srp-cfg/valve/apply.cfg\"\r\nbind \"mouse4\" \"+voicerecord\"\r\nexec srp-cfg/features/zeus/settings.cfg\r\n";
        const std::string original = "\xEF\xBB\xBF// SrP-CFG Preset Layer\r\n// srp_apply_visionl\r\nsrp_apply_yszh; echo \"my message; // not a comment\" // keep comment\r\n// Preset Layer End\r\n\r\n" + userLayer;
        put(custom, original);
        auto result = assembleValve(dir.u8string(), true, false);
        require(result.success && result.changed, "assemble settings cancels preset");
        auto state = inspectValveAssembly(dir.u8string());
        require(state.settings && !state.keymap && state.activePresetId.empty(), "separate flags and cancelled preset");
        const auto assembled = get(custom);
        require(assembled.find(userLayer) != std::string::npos, "personal layer preserved byte-for-byte");
        require(assembled.rfind("\xEF\xBB\xBF", 0) == 0, "UTF-8 BOM preserved");
        require(assembled.find("echo \"my message; // not a comment\"") != std::string::npos, "semicolon sibling and quoted content preserved");
        require(assembled.find("// srp_apply_visionl") != std::string::npos, "commented examples preserved");
        require(assembled.find("settings.cfg\r\n") != std::string::npos, "CRLF command insertion");
        require(get(fs::u8path(custom.u8string() + ".bak")) == original && historyCount(custom) == 1, "latest plus history byte-accurate backup");
        result = assembleValve(dir.u8string(), true, false);
        require(result.success && !result.changed && historyCount(custom) == 1, "repeat assembly creates no backup");
        require(get(fs::u8path(custom.u8string() + ".bak")) == original, "no-op does not clobber latest backup");
        require(assembleValve(dir.u8string(), false, true).success, "assemble keys keeps settings");
        state = inspectValveAssembly(dir.u8string());
        require(state.settings && state.keymap, "both assembled");
        require(disassembleValve(dir.u8string(), true, false).success, "selective unload settings");
        state = inspectValveAssembly(dir.u8string());
        require(!state.settings && state.keymap && state.activePresetId.empty(), "keys stay assembled, no preset restoration");
        require(disassembleValve(dir.u8string(), false, true).success, "unload last Valve entry");
        require(get(custom).find(userLayer) != std::string::npos, "unload preserves user layer");
        require(!assembleValve(dir.u8string(), false, false).success, "empty action rejected");

        put(custom, "exec \"srp-cfg/valve/apply.cfg\" // legacy combined baseline\n" + userLayer);
        require(disassembleValve(dir.u8string(), true, false).success, "split combined exec on partial unload");
        state = inspectValveAssembly(dir.u8string());
        require(!state.settings && state.keymap, "combined unload keeps unselected keys");
        for (const std::string entry : {"srp_reset_valve", "execifexists srp-cfg/valve/apply.cfg"}) {
            put(custom, entry + "\n" + userLayer);
            require(disassembleValve(dir.u8string(), false, true).success, "legacy alias/execifexists selective unload");
            state = inspectValveAssembly(dir.u8string());
            require(state.settings && !state.keymap, "legacy selective flags");
        }
        put(custom, "// exec srp-cfg/valve/settings.cfg\nalias x \"srp_reset_valve;srp_apply_echo\"\necho srp_apply_default\nexec srp-cfg/valve/keymap.cfg.extra\nsrp_reset_valve_keys_extra\n");
        state = inspectValveAssembly(dir.u8string());
        require(!state.settings && !state.keymap && state.activePresetId.empty(), "parser ignores comments/strings/lookalikes");
        put(custom, "srp_apply_echo;exec \"srp-cfg\\valve\\keymap.cfg\"\n" + userLayer);
        state = inspectValveAssembly(dir.u8string());
        require(state.keymap && state.activePresetId == "echo", "parser supports quoted backslash exec and semicolons");
        require(loadPreset("default", dir.u8string()), "existing preset action shares atomic backup logic");
        require(inspectValveAssembly(dir.u8string()).activePresetId == "default", "preset load recognizes new entry");
        require(unloadPreset(dir.u8string()), "preset unload shared helper");
        require(get(custom).find(userLayer) != std::string::npos, "preset operations preserve user layer");

        put(custom, "// SrP-CFG Preset Layer\nsrp_apply_echo\n// Preset Layer End\n// SrP-CFG User Layer\nsensitivity 2\nbind mouse4 +voicerecord\n");
        require(assemblyModules().size() == 9, "core module registry contains four features and five modes");
        require(assembleFeature(dir.u8string(), "autoview", true).success, "feature settings and keymap assembly");
        auto feature = inspectModuleAssembly(dir.u8string(), "autoview");
        require(feature.settings && feature.keymap && get(custom).find("srp_apply_echo") != std::string::npos, "feature assembly preserves preset and personal layer");
        require(get(custom).find("srp_apply_echo") < get(custom).find("srp_autoview_keys") && get(custom).find("srp_autoview_keys") < get(custom).find("sensitivity 2"), "feature executes after preset before personal overrides");
        const auto histories = historyCount(custom);
        result = assembleFeature(dir.u8string(), "autoview", true);
        require(result.success && !result.changed && historyCount(custom) == histories, "repeat feature assembly no backup");
        require(assembleFeature(dir.u8string(), "autoview", false).success, "feature changes to settings only");
        require(!inspectModuleAssembly(dir.u8string(), "autoview").keymap, "unselected optional keys removed");
        require(unloadFeature(dir.u8string(), "autoview").success && !inspectModuleAssembly(dir.u8string(), "autoview").settings, "whole feature unload");
        require(!assembleFeature(dir.u8string(), "../../outside", true).success, "unknown feature rejected");
        auto plan = planModeBinding(dir.u8string(), "practice", "mouse4", true);
        require(plan.success && plan.needsConfirmation && plan.previousCommand == "+voicerecord", "mode plan detects personal key conflict");
        const auto beforeConflict = get(custom);
        require(!applyModeBinding(dir.u8string(), plan).success && get(custom) == beforeConflict, "conflict cannot write without confirmation");
        require(applyModeBinding(dir.u8string(), plan, true).success, "confirmed mode key binds");
        auto mode = inspectModuleAssembly(dir.u8string(), "practice");
        require(mode.launchKeys == std::vector<std::string>{"mouse4"} && mode.keymap && !mode.legacyAutoLoad, "mode assembly is deferred launcher only");
        require(get(custom).find("bind \"mouse4\" \"srp_practice_keys\"") != std::string::npos && get(custom).find("\nsrp_practice_keys\n") == std::string::npos, "startup writes bind without executing mode");
        plan = planModeBinding(dir.u8string(), "demo-hlae", "f6", false);
        require(plan.success && applyModeBinding(dir.u8string(), plan).success && inspectModuleAssembly(dir.u8string(), "practice").launchKeys.size() == 1, "multiple different mode launchers coexist");
        plan = planModeBinding(dir.u8string(), "demo-hlae", "f6", false);
        result = applyModeBinding(dir.u8string(), plan);
        require(result.success && !result.changed, "identical launcher no-op");
        plan = planModeBinding(dir.u8string(), "preview", "f7", true);
        put(custom, get(custom) + "// external change\n");
        require(!applyModeBinding(dir.u8string(), plan, true).success, "stale confirmed snapshot rejected");
        require(!planModeBinding(dir.u8string(), "preview", "p;quit", false).success && !isValidLaunchKey("\""), "launch key injection rejected");
        put(custom, "// bind p srp_practice\nbind p \"+jump;srp_practice_keys;echo Hello\"\nsensitivity 3\n");
        require(!planModeBinding(dir.u8string(), "practice", "f6", true).success, "complex rebinding requests manual split");
        require(removeModeBinding(dir.u8string(), "practice").success, "compound entry removal");
        require(get(custom).find("+jump;") != std::string::npos && get(custom).find("echo Hello") != std::string::npos && inspectModuleAssembly(dir.u8string(), "practice").launchKeys.empty(), "remove preserves unrelated compound bind commands and casing");
        put(custom, "srp_demo_keys\nbind f6 srp_demo\nbind f6 +jump\n");
        require(inspectModuleAssembly(dir.u8string(), "demo-hlae").legacyAutoLoad && inspectModuleAssembly(dir.u8string(), "demo-hlae").launchKeys.empty(), "effective launch state ignores overwritten bind");
        require(removeModeBinding(dir.u8string(), "demo-hlae").success && get(custom).find("bind f6 +jump") != std::string::npos, "remove legacy mode and obsolete launcher preserves latest unrelated binding");
        put(dir / "srp-cfg/presets/echo/keymap.cfg", "bind p \"srp_practice_keys\"\n");
        put(custom, "srp_apply_echo\nsensitivity 2\n");
        plan = planModeBinding(dir.u8string(), "demo-hlae", "p", false);
        require(plan.success && plan.needsConfirmation && plan.previousCommand == "srp_practice_keys", "known preset keymap conflict detected");
        require(assembleFeature(dir.u8string(), "knife", false).success, "unmarked custom file feature assembly");
        require(get(custom).find("srp_apply_echo") < get(custom).find("srp_knife"), "unmarked custom retains baseline before feature");
        put(custom, "bind p \"echo \\\"My Message\\\"; srp_preview_keys; +jump\"\n");
        require(removeModeBinding(dir.u8string(), "preview").success, "remove mode beside escaped quoted command");
        require(get(custom).find("My Message") != std::string::npos && get(custom).find("+jump") != std::string::npos && !inspectModuleAssembly(dir.u8string(), "preview").launchKeys.size(), "escaped quoted sibling and action survive");
        require(!planModeBinding(dir.u8string(), "practice", "", true).success, "missing launcher key rejected");
        put(custom, "bind p srp_preview_keys\nunbind p\n");
        require(inspectModuleAssembly(dir.u8string(), "preview").launchKeys.empty(), "unbound key does not report a launch entry");
        put(custom, userLayer);

        const auto revisions = temp.path / "rapid/custom.cfg";
        put(revisions, "version 0\n");
        for (int i = 1; i <= 25; ++i) require(writeConfigWithBackup(revisions.u8string(), "version " + std::to_string(i) + "\n", "editor-save").success, "rapid revision saved");
        require(historyCount(revisions) == 20, "20 history versions retained after rapid saves");
        std::set<std::string> retained;
        for (const auto& file : fs::directory_iterator(revisions.parent_path() / ".backups/custom.cfg")) retained.insert(get(file.path()));
        require(retained.size() == 20 && retained.count("version 24\n") && retained.count("version 5\n") && !retained.count("version 4\n"), "history unique and oldest pruned");
        require(get(fs::u8path(revisions.u8string() + ".bak")) == "version 24\n", "latest backup is previous revision");
        require(writeConfigWithBackup(revisions.u8string(), "version 24\n", "undo").success, "return to earlier revision");
        require(writeConfigWithBackup(revisions.u8string(), "version 26\n", "edit").success, "save repeated prior content");
        retained.clear();
        for (const auto& file : fs::directory_iterator(revisions.parent_path() / ".backups/custom.cfg")) retained.insert(get(file.path()));
        require(retained.size() == historyCount(revisions), "historical identical content deduplicated");
        const auto blocked = temp.path / "blocked/custom.cfg";
        put(blocked, "original");
        put(blocked.parent_path() / ".backups", "not a directory");
        result = writeConfigWithBackup(blocked.u8string(), "new", "edit");
        require(!result.success && get(blocked) == "original", "backup failure leaves target unchanged");
#if defined(_WIN32)
        const auto locked = temp.path / "locked/custom.cfg";
        put(locked, "original");
        put(fs::u8path(locked.u8string() + ".bak"), "older backup");
        HANDLE handle = CreateFileW(locked.c_str(), GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE, nullptr, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
        require(handle != INVALID_HANDLE_VALUE, "lock fixture opened without delete sharing");
        result = writeConfigWithBackup(locked.u8string(), "replacement", "edit");
        CloseHandle(handle);
        require(!result.success && get(locked) == "original", "atomic replacement failure leaves original intact");
        require(get(fs::u8path(locked.u8string() + ".bak")) == "older backup", "failed replacement preserves prior latest backup");
#endif
        put(source / "srp-cfg/runtime/init.cfg", "// factory\n");
        put(source / "srp-cfg/user/custom.cfg", "// factory user\n");
        put(source / "srp-cfg/valve/settings.cfg", "sensitivity 1.25\n");
        put(source / "srp-cfg/valve/keymap.cfg", "binddefaults\n");
        require(installSrp(dir.u8string(), source.u8string()), "reinstall succeeds");
        const auto before = get(custom);
        require(get(custom).find(userLayer) != std::string::npos, "reinstall protects personal file");
        require(resetValveBaseline(dir.u8string()), "homepage uses shared Valve transform");
        state = inspectValveAssembly(dir.u8string());
        require(state.settings && state.keymap && state.activePresetId.empty(), "homepage assembles both types");
        require(!fs::exists(dir / "custom.cfg") && get(custom).find(userLayer) != std::string::npos, "homepage writes only owned custom path, preserves user layer");
        const auto userCfg = temp.path / "userdata-cfg";
        const auto convarsFile = userCfg / "cs2_user_convars_0_slot0.vcfg";
        const auto keysFile = userCfg / "cs2_user_keys_0_slot0.vcfg";
        put(convarsFile, "\"config\" { \"convars\" { \"sensitivity\" \"2\" } }\n");
        put(keysFile, "\"config\" { \"bindings\" { \"w\" \"+forward\" } }\n");
        const auto oldConvars = get(convarsFile), oldKeys = get(keysFile);
        require(resetValveBaseline(dir.u8string(), userCfg.u8string()), "homepage additionally clears both user caches");
        require(get(fs::u8path(convarsFile.u8string() + ".bak")) == oldConvars && get(fs::u8path(keysFile.u8string() + ".bak")) == oldKeys, "cache clears also use byte-accurate backup");
        require(resetValveBaseline(dir.u8string(), userCfg.u8string()), "repeat homepage reset succeeds");
        require(historyCount(convarsFile) == 1 && historyCount(keysFile) == 1 && get(fs::u8path(keysFile.u8string() + ".bak")) == oldKeys, "repeat reset never overwrites useful cache backups");
        require(saveAssemblyFile("valve/settings.cfg", "sensitivity 7\n", dir.u8string()).success, "Valve editor save");
        require(isAssemblyFileModified("valve/settings.cfg", dir.u8string(), source.u8string()), "factory diff detected");
        require(resetAssemblyFile("valve/settings.cfg", dir.u8string(), source.u8string()).success, "restore clean source");
        require(!isAssemblyFileModified("valve/settings.cfg", dir.u8string(), source.u8string()), "restore clears factory diff");
        require(!resetAssemblyFile("user/custom.cfg", dir.u8string(), source.u8string()).success, "custom reset forbidden");
        require(!saveAssemblyFile("../outside.cfg", "bad", dir.u8string()).success, "path traversal rejected");
        require(!assembleValve((temp.path / "uninstalled").u8string(), true, true).success, "uninstalled mutation rejected");
        require(!saveAssemblyFile("valve/settings.cfg", "bad", "").success, "no installed directory never writes source");
        require(fs::u8path(resolveAssemblyFilePath("valve/settings.cfg", "", (source / "srp-cfg").u8string())) == source / "srp-cfg/valve/settings.cfg", "source supports srp-cfg root");
        require(get(source / "srp-cfg/valve/settings.cfg") == "sensitivity 1.25\n", "factory defaults remain untouched");
        std::cout << "ALL CONFIG OPERATION CHECKS PASSED\n";
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "FAIL: " << error.what() << '\n';
        return 1;
    }
}
