#include "srp/core/assembly.h"
#include "srp/core/actions.h"
#include "srp/core/catalog.h"
#include <optional>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <vector>
#include <algorithm>
#include <cctype>
#include <functional>
#include <map>

namespace srp::core {
namespace fs = std::filesystem;
namespace {
struct Command { size_t start, end; std::vector<std::string> words, rawWords; };
std::string lower(std::string value) {
    std::transform(value.begin(), value.end(), value.begin(), [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
    return value;
}
// Split only outside strings; // comments and quoted aliases are never executed entries.
std::vector<Command> commands(const std::string& text) {
    std::vector<Command> result;
    size_t start = 0, i = (text.rfind("\xEF\xBB\xBF", 0) == 0 ? 3 : 0);
    start = i;
    bool quoted = false;
    auto append = [&](size_t end) {
        size_t begin = start;
        while (begin < end && std::isspace(static_cast<unsigned char>(text[begin]))) ++begin;
        while (end > begin && std::isspace(static_cast<unsigned char>(text[end - 1]))) --end;
        if (begin >= end) return;
        Command cmd{begin, end, {}, {}};
        for (size_t p = begin; p < end;) {
            while (p < end && std::isspace(static_cast<unsigned char>(text[p]))) ++p;
            if (p == end) break;
            std::string word;
            if (text[p] == '"') {
                ++p;
                while (p < end && text[p] != '"') {
                    if (text[p] == '\\' && p + 1 < end && text[p + 1] == '"') ++p;
                    word += text[p++];
                }
                if (p < end) ++p;
            } else {
                while (p < end && !std::isspace(static_cast<unsigned char>(text[p]))) word += text[p++];
            }
            cmd.rawWords.push_back(word);
            cmd.words.push_back(lower(word));
        }
        result.push_back(std::move(cmd));
    };
    while (i < text.size()) {
        const char c = text[i];
        if (!quoted && c == '/' && i + 1 < text.size() && text[i + 1] == '/') {
            append(i);
            while (i < text.size() && text[i] != '\n') ++i;
            start = i + 1;
        } else if (!quoted && (c == ';' || c == '\n' || c == '\r')) {
            append(i);
            start = i + 1;
        } else if (c == '"') {
            size_t slashes = 0;
            for (size_t p = i; p > 0 && text[p - 1] == '\\'; --p) ++slashes;
            if (slashes % 2 == 0) quoted = !quoted;
        }
        ++i;
    }
    append(text.size());
    return result;
}
std::string preset(const Command& cmd) {
    if (cmd.words.size() != 1) return {};
    const auto& word = cmd.words[0];
    for (const auto& e : configCatalog("srp-cfg")) if (e.category == "presets" && word == lower(e.command)) return e.id;
    if (word.rfind("srp_apply_",0) == 0 && catalogIdentifier(word.substr(10))) return word.substr(10);
    return {};
}
int valve(const Command& cmd) {
    if (cmd.words.size() == 1) {
        if (cmd.words[0] == "srp_reset_valve") return 3;
        if (cmd.words[0] == "srp_reset_valve_settings") return 1;
        if (cmd.words[0] == "srp_reset_valve_keys") return 2;
    }
    if (cmd.words.size() != 2 || (cmd.words[0] != "exec" && cmd.words[0] != "execifexists")) return 0;
    std::string path = cmd.words[1];
    std::replace(path.begin(), path.end(), '\\', '/');
    if (path == "srp-cfg/valve/settings.cfg") return 1;
    if (path == "srp-cfg/valve/keymap.cfg") return 2;
    if (path == "srp-cfg/valve/apply.cfg") return 3;
    return 0;
}
bool read(const fs::path& path, std::string& out) {
    std::ifstream in(path, std::ios::binary);
    if (!in) return false;
    out.assign(std::istreambuf_iterator<char>(in), std::istreambuf_iterator<char>());
    return !in.bad();
}
std::optional<AssemblyModule> module(const std::string& id) {
    for (const auto& entry : assemblyModules()) if (entry.id == id) return entry;
    return {};
}
bool available(const AssemblyModule& entry,const std::string& dir,bool keys) {
    CatalogEntry e;e.id=entry.id;e.category=entry.category;e.directory=entry.directory();e.command=entry.command;e.keymapCommand=entry.keymapCommand;
    return catalogEntryAvailable(e,(fs::u8path(dir)/"srp-cfg").u8string(),keys);
}
int moduleCommand(const Command& cmd, const AssemblyModule& entry) {
    if (cmd.words.size() == 1) {
        if (cmd.words[0] == lower(entry.command)) return 1;
        if (!entry.keymapCommand.empty() && cmd.words[0] == lower(entry.keymapCommand)) return 3;
    }
    if (cmd.words.size() == 2 && (cmd.words[0] == "exec" || cmd.words[0] == "execifexists")) {
        std::string path = cmd.words[1];
        std::replace(path.begin(), path.end(), '\\', '/');
        const auto base = "srp-cfg/" + lower(entry.directory()) + "/";
        if (path == base + "settings.cfg") return 1;
        if (path == base + "keymap.cfg") return 2;
        if (path == base + "with-keymap.cfg") return 3;
    }
    return 0;
}
bool allowed(const std::string& path) {
    if (path == "user/custom.cfg" || path == "valve/settings.cfg" || path == "valve/keymap.cfg") return true;
    const auto root = findSourceConfigDir();
    return catalogFileAllowed("srp-cfg",path,(fs::u8path(root)/"srp-cfg").u8string());
}
fs::path sourceRoot(const std::string& dir) {
    const std::string source = dir.empty() ? findSourceConfigDir() : dir;
    if (source.empty()) return {};
    const fs::path base = fs::u8path(source);
    std::error_code ec;
    return fs::is_directory(base / "srp-cfg", ec) ? base / "srp-cfg" : base;
}
std::string normalize(std::string text) {
    text.erase(std::remove(text.begin(), text.end(), '\r'), text.end());
    return text;
}
ValveAssemblyState inspect(const std::string& content) {
    ValveAssemblyState state;
    for (const auto& cmd : commands(content)) {
        const int flags = valve(cmd);
        state.settings |= (flags & 1) != 0;
        state.keymap |= (flags & 2) != 0;
        const auto id = preset(cmd);
        if (!id.empty()) state.activePresetId = id;
    }
    return state;
}
// All untouched bytes (including the personal layer, BOM, comments and newline style) survive.
std::string transformCommands(const std::string& content,
    const std::function<bool(const Command&)>& remove, const std::string& entries, bool afterBaseline = false) {
    std::string output = content;
    const auto list = commands(content);
    for (auto it = list.rbegin(); it != list.rend(); ++it) {
        if (remove(*it)) {
            size_t first = it->start, last = it->end;
            const auto previousNewline = content.rfind('\n', first);
            const size_t lineStart = previousNewline == std::string::npos ? (content.rfind("\xEF\xBB\xBF", 0) == 0 ? 3 : 0) : previousNewline + 1;
            const auto nextNewline = content.find('\n', last);
            const size_t lineEnd = nextNewline == std::string::npos ? content.size() : nextNewline;
            auto whitespace = [&](size_t begin, size_t end) {
                for (size_t p = begin; p < end; ++p) if (!std::isspace(static_cast<unsigned char>(content[p]))) return false;
                return true;
            };
            if (whitespace(lineStart, first) && whitespace(last, lineEnd)) {
                first = lineStart;
                last = nextNewline == std::string::npos ? lineEnd : lineEnd + 1;
            }
            output.erase(first, last - first);
        }
    }
    if (!entries.empty()) {
        const std::string eol = content.find("\r\n") != std::string::npos ? "\r\n" : "\n";
        std::string block;
        std::istringstream lines(entries);
        std::string line;
        while (std::getline(lines, line)) block += line + eol;
        // Place at the start of the baseline/preset layer, before personal overrides.
        size_t pos = (output.rfind("\xEF\xBB\xBF", 0) == 0 ? 3 : 0);
        if (afterBaseline) {
            for (const auto& cmd : commands(output)) {
                if (!preset(cmd).empty() || valve(cmd)) {
                    const auto end = output.find('\n', cmd.end);
                    pos = end == std::string::npos ? output.size() : end + 1;
                }
            }
        }
        for (size_t lineStart = (output.rfind("\xEF\xBB\xBF", 0) == 0 ? 3 : 0); lineStart < output.size();) {
            const auto end = output.find('\n', lineStart);
            const size_t lineEnd = end == std::string::npos ? output.size() : end;
            const auto first = output.find_first_not_of(" \t\r", lineStart);
            if (first < lineEnd && output.compare(first, 2, "//") == 0) {
                const auto comment = output.substr(first, lineEnd - first);
                if (afterBaseline && comment.find("SrP-CFG User Layer") != std::string::npos) {
                    pos = lineStart;
                    break;
                }
                if (!afterBaseline && comment.find("SrP-CFG Preset Layer") != std::string::npos) {
                    if (end != std::string::npos) pos = end + 1;
                    break;
                }
                if (afterBaseline && comment.find("Preset Layer End") != std::string::npos && end != std::string::npos)
                    pos = end + 1;
            }
            if (end == std::string::npos) break;
            lineStart = end + 1;
        }
        if (pos == output.size() && pos > 0 && output.back() != '\n') block.insert(0, eol);
        output.insert(pos, block);
    }
    return output;
}
std::string transform(const std::string& content, bool removeValve, bool removePreset,
    const std::string& entries) {
    return transformCommands(content, [=](const Command& cmd) {
        return (removeValve && valve(cmd)) || (removePreset && !preset(cmd).empty());
    }, entries);
}
bool readCustom(const std::string& dir, std::string& content) {
    return !dir.empty() && isSrpInstalled(dir)
        && read(fs::u8path(dir) / "srp-cfg/user/custom.cfg", content);
}
std::string quoteCfg(const std::string& text) {
    std::string result = "\"";
    for (char c : text) {
        if (c == '"') result += '\\';
        result += c;
    }
    return result + '"';
}
int bindingFlags(const Command& cmd, const AssemblyModule& entry) {
    if (cmd.words.size() != 3 || cmd.words[0] != "bind") return 0;
    int flags = 0;
    for (const auto& action : commands(cmd.rawWords[2])) flags |= moduleCommand(action, entry);
    return flags;
}
bool simpleModeBinding(const Command& cmd, const AssemblyModule& entry) {
    if (cmd.words.size() != 3 || cmd.words[0] != "bind") return false;
    const auto actions = commands(cmd.rawWords[2]);
    return actions.size() == 1 && moduleCommand(actions[0], entry) != 0;
}
ConfigWriteResult change(const std::string& dir, bool settings, bool keymap, bool add) {
    if (!settings && !keymap) return {false, false, "Select settings or keymap"};
    if (!isSrpInstalled(dir)) return {false, false, "SrP-CFG is not installed"};
    const fs::path path = fs::u8path(dir) / "srp-cfg/user/custom.cfg";
    std::string content;
    if (!read(path, content)) return {false, false, "Cannot read custom.cfg"};
    const auto state = inspect(content);
    const bool nextSettings = settings ? add : state.settings;
    const bool nextKeys = keymap ? add : state.keymap;
    if ((!add || state.activePresetId.empty()) && state.settings == nextSettings && state.keymap == nextKeys)
        return {true, false, {}};
    std::string entries;
    if (nextSettings) entries += "exec srp-cfg/valve/settings.cfg\n";
    if (nextKeys) entries += "exec srp-cfg/valve/keymap.cfg\n";
    return writeConfigWithBackup(path.u8string(), transform(content, true, add, entries),
        add ? "assemble-valve" : "unload-valve");
}
}
std::vector<AssemblyModule> assemblyModules() {
    std::vector<AssemblyModule> result;
    for (const auto& e : configCatalog("srp-cfg")) if (e.category == "features" || e.category == "modes")
        result.push_back({e.id,e.name,e.category,e.command,e.keymapCommand,e.directory,e.files});
    return result;
}
bool isValidLaunchKey(const std::string& key) {
    const auto value = lower(key);
    if (value.size() == 1) {
        const unsigned char c = value[0];
        return std::isalnum(c) || std::string("[];',./=-`").find(c) != std::string::npos;
    }
    static const std::vector<std::string> keys = {"space", "tab", "enter", "escape", "backspace", "capslock", "shift", "rshift", "ctrl", "rctrl", "alt", "ralt", "ins", "del", "home", "end", "pgup", "pgdn", "pause", "scrolllock", "numlock", "uparrow", "downarrow", "leftarrow", "rightarrow", "mouse1", "mouse2", "mouse3", "mouse4", "mouse5", "mwheelup", "mwheeldown", "kp_ins", "kp_end", "kp_downarrow", "kp_pgdn", "kp_leftarrow", "kp_5", "kp_rightarrow", "kp_home", "kp_uparrow", "kp_pgup", "kp_del", "kp_enter", "kp_plus", "kp_minus", "kp_multiply", "kp_slash"};
    if (std::find(keys.begin(), keys.end(), value) != keys.end()) return true;
    for (int i = 1; i <= 12; ++i) if (value == "f" + std::to_string(i)) return true;
    return false;
}
ModuleAssemblyState inspectModuleAssembly(const std::string& dir, const std::string& id) {
    ModuleAssemblyState state;
    const auto entry = module(id);
    std::string content;
    if (!entry || dir.empty() || !read(fs::u8path(dir) / "srp-cfg/user/custom.cfg", content)) return state;
    std::map<std::string, Command> bindings;
    for (const auto& cmd : commands(content)) {
        const int flags = moduleCommand(cmd, *entry);
        state.settings |= (flags & 1) != 0;
        state.keymap |= (flags & 2) != 0;
        if (cmd.words.size() == 1 && (cmd.words[0] == "unbindall" || cmd.words[0] == "binddefaults")) bindings.clear();
        else if (cmd.words.size() == 2 && cmd.words[0] == "unbind") bindings.erase(cmd.words[1]);
        else if (cmd.words.size() == 3 && cmd.words[0] == "bind") bindings.insert_or_assign(cmd.words[1], cmd);
    }
    state.legacyAutoLoad = entry->category == "modes" && (state.settings || state.keymap);
    if (entry->category == "modes") {
        for (const auto& [key, cmd] : bindings) {
            const auto flags = bindingFlags(cmd, *entry);
            if (flags) {
                state.launchKeys.push_back(key);
                state.settings |= (flags & 1) != 0;
                state.keymap |= (flags & 2) != 0;
            }
        }
    }
    return state;
}
ConfigWriteResult assembleFeature(const std::string& dir, const std::string& id, bool keys) {
    const auto entry = module(id);
    if (!entry || entry->category != "features") return {false, false, "Unknown feature"};
    if (keys && entry->keymapCommand.empty()) return {false,false,"assembly.no_keymap"};
    if(!available(*entry,dir,keys))return {false,false,"assembly.needs_deploy"};
    std::string content;
    if (!readCustom(dir, content)) return {false, false, "Cannot read installed custom.cfg"};
    const auto state = inspectModuleAssembly(dir, id);
    if (state.settings && state.keymap == keys) return {true, false, {}};
    return writeConfigWithBackup((fs::u8path(dir) / "srp-cfg/user/custom.cfg").u8string(),
        transformCommands(content, [&](const Command& cmd) { return moduleCommand(cmd, *entry) != 0; },
            (keys ? entry->keymapCommand : entry->command) + "\n", true), "assemble-feature");
}
ConfigWriteResult unloadFeature(const std::string& dir, const std::string& id) {
    const auto entry = module(id);
    if (!entry || entry->category != "features") return {false, false, "Unknown feature"};
    std::string content;
    if (!readCustom(dir, content)) return {false, false, "Cannot read installed custom.cfg"};
    return writeConfigWithBackup((fs::u8path(dir) / "srp-cfg/user/custom.cfg").u8string(),
        transformCommands(content, [&](const Command& cmd) { return moduleCommand(cmd, *entry) != 0; }, ""), "unload-feature");
}
ModeBindingPlan planModeBinding(const std::string& dir, const std::string& id, const std::string& inputKey, bool keys) {
    ModeBindingPlan plan;
    const auto entry = module(id);
    const auto key = lower(inputKey);
    if (!entry || entry->category != "modes" || !isValidLaunchKey(key)) { plan.error = "assembly.invalid_key"; return plan; }
    if(!available(*entry,dir,keys)){plan.error="assembly.needs_deploy";return plan;}
    if (!readCustom(dir, plan.originalContent)) { plan.error = "valve.write_failed"; return plan; }
    const auto list = commands(plan.originalContent);
    // Resolve inherited preset/feature keymaps for a meaningful conflict preview.
    const auto presetId = inspect(plan.originalContent).activePresetId;
    std::string inherited;
    std::string presetDirectory;
    for(const auto& e : configCatalog("srp-cfg"))if(e.category=="presets"&&e.id==presetId)presetDirectory=e.directory;
    if (!presetDirectory.empty() && read(fs::u8path(dir) / "srp-cfg" / presetDirectory / "keymap.cfg", inherited)) {
        for (const auto& cmd : commands(inherited)) {
            if (cmd.words.size() == 3 && cmd.words[0] == "bind" && cmd.words[1] == key) plan.previousCommand = cmd.rawWords[2];
        }
    }
    for (const auto& cmd : list) {
        if (bindingFlags(cmd, *entry) && !simpleModeBinding(cmd, *entry)) {
            plan.error = "assembly.complex_binding";
            return plan;
        }
        for (const auto& feature : assemblyModules()) {
            if (feature.category != "features" || !(moduleCommand(cmd, feature) & 2)) continue;
            if (read(fs::u8path(dir) / "srp-cfg" / feature.directory() / "keymap.cfg", inherited)) {
                for (const auto& inheritedCmd : commands(inherited)) {
                    if (inheritedCmd.words.size() == 3 && inheritedCmd.words[0] == "bind" && inheritedCmd.words[1] == key)
                        plan.previousCommand = inheritedCmd.rawWords[2];
                }
            }
        }
        if (cmd.words.size() == 1 && (cmd.words[0] == "unbindall" || cmd.words[0] == "binddefaults")) {
            plan.previousCommand = cmd.rawWords[0];
        } else if (cmd.words.size() == 2 && cmd.words[0] == "unbind" && cmd.words[1] == key) {
            plan.previousCommand.clear();
        } else if (cmd.words.size() == 3 && cmd.words[0] == "bind" && cmd.words[1] == key) {
            plan.previousCommand = cmd.rawWords[2];
        }
    }
    if (keys && entry->keymapCommand.empty()) { plan.error = "assembly.no_keymap"; return plan; }
    plan.newCommand = keys ? entry->keymapCommand : entry->command;
    plan.needsConfirmation = !plan.previousCommand.empty() && plan.previousCommand != plan.newCommand;
    if (std::any_of(list.begin(), list.end(), [&](const Command& cmd) { return moduleCommand(cmd, *entry) != 0; })) {
        plan.needsConfirmation = true; // Migrating legacy startup execution must be explicit.
    }
    const auto stripped = transformCommands(plan.originalContent, [&](const Command& cmd) {
        return moduleCommand(cmd, *entry) || simpleModeBinding(cmd, *entry)
            || (cmd.words.size() >= 2 && (cmd.words[0] == "bind" || cmd.words[0] == "unbind") && cmd.words[1] == key);
    }, "");
    const std::string eol = stripped.find("\r\n") != std::string::npos ? "\r\n" : "\n";
    // Bind after preset, baseline and personal commands so the selected entry remains effective.
    plan.newContent = stripped;
    if (!plan.newContent.empty() && plan.newContent.back() != '\n') plan.newContent += eol;
    plan.newContent += "bind " + quoteCfg(key) + " " + quoteCfg(plan.newCommand) + eol;
    if (plan.previousCommand == plan.newCommand && stripped == transformCommands(plan.originalContent,
        [&](const Command& cmd) { return simpleModeBinding(cmd, *entry); }, "")) {
        // Rebinding the identical sole entry is a no-op when no legacy loading remains.
        int count = 0;
        bool sameKey = false;
        for (const auto& cmd : list) {
            if (simpleModeBinding(cmd, *entry)) {
                ++count;
                sameKey = cmd.words[1] == key;
            }
        }
        if (count == 1 && sameKey) plan.newContent = plan.originalContent;
    }
    plan.success = true;
    return plan;
}
ConfigWriteResult applyModeBinding(const std::string& dir, const ModeBindingPlan& plan, bool confirmed) {
    if (!plan.success) return {false, false, plan.error};
    if (plan.needsConfirmation && !confirmed) return {false, false, "assembly.binding_conflict"};
    std::string current;
    if (!readCustom(dir, current)) return {false, false, "valve.write_failed"};
    if (current != plan.originalContent) return {false, false, "assembly.config_changed"};
    return writeConfigWithBackup((fs::u8path(dir) / "srp-cfg/user/custom.cfg").u8string(), plan.newContent, "bind-mode");
}
ConfigWriteResult removeModeBinding(const std::string& dir, const std::string& id) {
    const auto entry = module(id);
    if (!entry || entry->category != "modes") return {false, false, "Unknown mode"};
    std::string content;
    if (!readCustom(dir, content)) return {false, false, "valve.write_failed"};
    // Rewrite compound bind bodies only when direct mode commands can be separated safely.
    std::string output = content;
    const auto list = commands(content);
    for (auto it = list.rbegin(); it != list.rend(); ++it) {
        if (!bindingFlags(*it, *entry) || simpleModeBinding(*it, *entry)) continue;
        const auto body = transformCommands(it->rawWords[2], [&](const Command& cmd) { return moduleCommand(cmd, *entry) != 0; }, "");
        output.replace(it->start, it->end - it->start, "bind " + quoteCfg(it->rawWords[1]) + " " + quoteCfg(body));
    }
    output = transformCommands(output, [&](const Command& cmd) { return moduleCommand(cmd, *entry) || simpleModeBinding(cmd, *entry); }, "");
    return writeConfigWithBackup((fs::u8path(dir) / "srp-cfg/user/custom.cfg").u8string(), output, "remove-mode-entry");
}
ValveAssemblyState inspectValveAssembly(const std::string& dir) {
    if (dir.empty()) return {};
    std::string content;
    if (!read(fs::u8path(dir) / "srp-cfg/user/custom.cfg", content)) return {};
    return inspect(content);
}
ConfigWriteResult assembleValve(const std::string& dir, bool settings, bool keymap) {
    return change(dir, settings, keymap, true);
}
ConfigWriteResult disassembleValve(const std::string& dir, bool settings, bool keymap) {
    return change(dir, settings, keymap, false);
}
ConfigWriteResult setPresetEntry(const std::string& dir, const std::string& id) {
    std::string entryCommand;
    if (!id.empty()) {
        for (const auto& e : configCatalog("srp-cfg")) if (e.category == "presets" && e.id == id) {
            if(!catalogEntryAvailable(e,(fs::u8path(dir)/"srp-cfg").u8string()))return {false,false,"assembly.needs_deploy"};
            entryCommand = e.command;
        }
        if (entryCommand.empty()) return {false,false,"Unknown preset"};
    }
    if (!isSrpInstalled(dir)) return {false, false, "SrP-CFG is not installed"};
    const fs::path path = fs::u8path(dir) / "srp-cfg/user/custom.cfg";
    std::string content;
    if (!read(path, content)) return {false, false, "Cannot read custom.cfg"};
    const auto state = inspect(content);
    if (state.activePresetId == id && (id.empty() || (!state.settings && !state.keymap))) return {true, false, {}};
    return writeConfigWithBackup(path.u8string(), transform(content, !id.empty(), true,
        id.empty() ? "" : entryCommand + "\n"), id.empty() ? "unload-preset" : "load-preset");
}
std::string resolveAssemblyFilePath(const std::string& rel, const std::string& dir, const std::string& source) {
    if (!allowed(rel)) return {};
    if (!dir.empty()) {
        const fs::path installed = fs::u8path(dir) / "srp-cfg" / fs::u8path(rel);
        std::error_code ec;
        if (fs::is_regular_file(installed, ec)) return installed.u8string();
    }
    const auto root = sourceRoot(source);
    return root.empty() ? "" : (root / fs::u8path(rel)).u8string();
}
std::string readAssemblyFile(const std::string& rel, const std::string& dir, const std::string& source) {
    std::string content;
    const auto path = resolveAssemblyFilePath(rel, dir, source);
    if (!path.empty()) read(fs::u8path(path), content);
    return content;
}
ConfigWriteResult saveAssemblyFile(const std::string& rel, const std::string& content, const std::string& dir) {
    if (!allowed(rel)) return {false, false, "Unsupported file"};
    if (!isSrpInstalled(dir)) return {false, false, "SrP-CFG is not installed"};
    return writeConfigWithBackup((fs::u8path(dir) / "srp-cfg" / fs::u8path(rel)).u8string(), content, "editor-save");
}
ConfigWriteResult resetAssemblyFile(const std::string& rel, const std::string& dir, const std::string& source) {
    if (!allowed(rel) || rel == "user/custom.cfg") return {false, false, "Cannot reset user file"};
    const auto root = sourceRoot(source);
    std::string content;
    if (root.empty() || !read(root / fs::u8path(rel), content)) return {false, false, "Factory file unavailable"};
    if (!isSrpInstalled(dir)) return {false, false, "SrP-CFG is not installed"};
    return writeConfigWithBackup((fs::u8path(dir) / "srp-cfg" / fs::u8path(rel)).u8string(), content, "restore-default");
}
bool isAssemblyFileModified(const std::string& rel, const std::string& dir, const std::string& source) {
    if (!allowed(rel) || dir.empty()) return false;
    const auto root = sourceRoot(source);
    std::string original, installed;
    return !root.empty() && read(root / fs::u8path(rel), original)
        && read(fs::u8path(dir) / "srp-cfg" / fs::u8path(rel), installed)
        && normalize(original) != normalize(installed);
}
}
