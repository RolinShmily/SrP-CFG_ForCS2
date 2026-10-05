#include "srp/core/media_config.h"
#include "srp/core/packages.h"
#include "srp/core/catalog.h"
#include <optional>
#include <filesystem>
#include <fstream>
#include <algorithm>
#include <cctype>
#include <set>
#include <cmath>
#if defined(_WIN32)
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <tlhelp32.h>
#endif
namespace srp::core {
namespace fs = std::filesystem;
namespace {
struct Token { std::string text; size_t start = 0, end = 0; bool quoted = false; };
class Lexer {
    const std::string& text; size_t pos = 0;
public:
    explicit Lexer(const std::string& t) : text(t) { if (text.rfind("\xEF\xBB\xBF", 0) == 0) pos = 3; }
    Token next() {
        while (pos < text.size()) {
            if (std::isspace(static_cast<unsigned char>(text[pos]))) { ++pos; continue; }
            if (text.compare(pos, 2, "//") == 0) { pos = text.find('\n', pos); if (pos == std::string::npos) pos = text.size(); continue; }
            if (text.compare(pos, 2, "/*") == 0) { auto end = text.find("*/", pos + 2); if (end == std::string::npos) throw std::runtime_error("Invalid comment"); pos = end + 2; continue; }
            break;
        }
        Token token; token.start = pos;
        if (pos == text.size()) { token.end = pos; return token; }
        if (text[pos] == '"') {
            token.quoted = true; ++pos;
            while (pos < text.size() && text[pos] != '"') {
                char c = text[pos++];
                if (c == '\\') { if (pos == text.size()) throw std::runtime_error("Invalid escape"); c = text[pos++]; }
                token.text += c;
            }
            if (pos == text.size()) throw std::runtime_error("Unclosed string"); ++pos;
        } else if (std::string("{}[]=,").find(text[pos]) != std::string::npos) token.text = text[pos++];
        else {
            while (pos < text.size() && !std::isspace(static_cast<unsigned char>(text[pos])) && std::string("{}[]=,\"").find(text[pos]) == std::string::npos) token.text += text[pos++];
            if (token.text.empty()) throw std::runtime_error("Invalid token");
        }
        token.end = pos; return token;
    }
};
struct VideoDocument { std::map<std::string, Token> values; size_t close = 0; };
VideoDocument videoDocument(const std::string& text) {
    if (text.size() > 1024 * 1024) throw std::runtime_error("video.invalid");
    Lexer lexer(text); VideoDocument result;
    auto root = lexer.next(); if (!root.quoted || root.text != "video.cfg" || lexer.next().text != "{") throw std::runtime_error("video.invalid");
    for (;;) {
        auto key = lexer.next(); if (!key.quoted && key.text == "}") { result.close = key.start; break; }
        auto value = lexer.next();
        std::string canonical = key.text;
        std::transform(canonical.begin(),canonical.end(),canonical.begin(),[](unsigned char c){return static_cast<char>(std::tolower(c));});
        if (canonical == "autoconfig") canonical = "AutoConfig"; else canonical = key.text;
        if (!key.quoted || key.text.empty() || !value.quoted || !result.values.emplace(canonical, value).second) throw std::runtime_error("video.invalid");
    }
    if (!lexer.next().text.empty() || result.values.empty()) throw std::runtime_error("video.invalid");
    return result;
}
bool permitted(const VideoOption& option, const std::string& value) {
    return std::any_of(option.values.begin(), option.values.end(), [&](const auto& item) { return item.first == value; });
}
std::string escaped(const std::string& value) {
    std::string out = "\""; for (char c : value) { if (c == '"' || c == '\\') out += '\\'; out += c; } return out + '"';
}
std::string replaceFields(const std::string& text, const std::map<std::string, std::string>& fields) {
    const auto doc = videoDocument(text); std::string out = text, additional;
    struct Edit { size_t start, end; std::string content; }; std::vector<Edit> edits;
    const std::string nl = text.find("\r\n") == std::string::npos ? "\n" : "\r\n";
    for (const auto& [key, value] : fields) {
        const auto it = doc.values.find(key);
        if (it != doc.values.end()) edits.push_back({it->second.start, it->second.end, escaped(value)});
        else additional += "\t" + escaped(key) + "\t\t" + escaped(value) + nl;
    }
    if (!additional.empty()) edits.push_back({doc.close, doc.close, additional});
    std::sort(edits.begin(), edits.end(), [](const auto& a, const auto& b) { return a.start > b.start; });
    for (const auto& e : edits) out.replace(e.start, e.end - e.start, e.content);
    return out;
}
std::optional<AnnotationGuide> guide(const std::string& id, const std::string& root = {}) {
    for (const auto& entry : annotationGuides(root)) if (entry.id == id) return entry;
    return {};
}
class Kv3Parser {
    Lexer lexer; Token token; std::string map;
    void advance() { token = lexer.next(); }
    void object(int depth) {
        if (depth > 32 || token.text != "{" || token.quoted) throw std::runtime_error("Invalid object"); advance();
        std::set<std::string> keys;
        while (token.text != "}" || token.quoted) {
            if (token.text.empty()) throw std::runtime_error("Unclosed object");
            const auto key = token.text; if (!keys.insert(key).second) throw std::runtime_error("Duplicate key"); advance();
            if (token.text != "=" || token.quoted) throw std::runtime_error("Missing equals"); advance();
            if (depth == 0 && key == "MapName") { if (!token.quoted) throw std::runtime_error("Invalid map"); map = token.text; }
            value(depth + 1);
        }
        advance();
    }
    void value(int depth) {
        if (depth > 32 || (token.text.empty() && !token.quoted)) throw std::runtime_error("Invalid value");
        if (token.quoted) { advance(); return; }
        if (token.text == "{") { object(depth); return; }
        if (token.text == "[") {
            advance(); if (token.text == "]") { advance(); return; }
            for (;;) { value(depth + 1); if (token.text == "]") { advance(); return; } if (token.text != ",") throw std::runtime_error("Invalid array"); advance(); }
        }
        if (token.text != "true" && token.text != "false" && token.text != "null") {
            size_t used = 0; const double n = std::stod(token.text, &used); if (used != token.text.size() || !std::isfinite(n)) throw std::runtime_error("Invalid number");
        }
        advance();
    }
public:
    explicit Kv3Parser(const std::string& text) : lexer(text) { advance(); }
    std::string parse() { object(0); if (!token.text.empty()) throw std::runtime_error("Trailing data"); return map; }
};
}
const std::vector<VideoOption>& videoOptions() {
    static const std::vector<VideoOption> items = {
        {"resolution", "video.resolution", {{"1024x768","1024 × 768 · 4:3"},{"1280x960","1280 × 960 · 4:3"},{"1440x1080","1440 × 1080 · 4:3"},{"1280x720","1280 × 720 · 16:9"},{"1920x1080","1920 × 1080 · 16:9"},{"2560x1440","2560 × 1440 · 16:9"},{"3840x2160","3840 × 2160 · 16:9"}}},
        {"display", "video.display", {{"window","video.window"},{"borderless","video.borderless"},{"fullscreen","video.fullscreen"}}},
        {"setting.mat_vsync","video.vsync",{{"0","video.off"},{"1","video.on"}}},
        {"setting.r_low_latency","video.latency",{{"0","video.off"},{"1","video.on"},{"2","video.boost"}}},
        {"setting.r_csgo_cmaa_enable","video.cmaa",{{"0","video.off"},{"1","video.on"}}},
        {"setting.msaa_samples","video.msaa",{{"0","video.off"},{"2","2× MSAA"},{"4","4× MSAA"},{"8","8× MSAA"}}},
        {"setting.videocfg_shadow_quality","video.shadow",{{"0","video.low"},{"1","video.medium"},{"2","video.high"},{"3","video.veryhigh"}}},
        {"setting.videocfg_dynamic_shadows","video.dynamic",{{"0","video.sun"},{"1","video.all"}}},
        {"setting.videocfg_texture_detail","video.texture",{{"0","video.low"},{"1","video.medium"},{"2","video.high"}}},
        {"setting.r_texturefilteringquality","video.filter",{{"0","video.bilinear"},{"1","video.trilinear"},{"2","2×"},{"3","4×"},{"4","8×"},{"5","16×"}}},
        {"setting.shaderquality","video.shader",{{"0","video.low"},{"1","video.high"}}},
        {"setting.videocfg_particle_detail","video.particle",{{"0","video.low"},{"1","video.medium"},{"2","video.high"},{"3","video.veryhigh"}}},
        {"setting.videocfg_ao_detail","video.ao",{{"0","video.off"},{"2","video.medium"},{"3","video.high"}}},
        {"setting.videocfg_hdr_detail","video.hdr",{{"-1","video.quality"},{"3","video.performance"}}},
        {"setting.videocfg_fsr_detail","video.fsr",{{"0","video.off"},{"1","video.ultraquality"},{"2","video.quality"},{"3","video.balanced"},{"4","video.performance"}}}
    }; return items;
}
VideoParseResult parseVideoConfig(const std::string& text) {
    try {
        VideoParseResult result; const auto doc = videoDocument(text);
        for (const auto& [key, token] : doc.values) result.values[key] = token.text;
        for (const auto& option : videoOptions()) if (option.key != "resolution" && option.key != "display") {
            auto it = result.values.find(option.key); if (it != result.values.end() && !permitted(option, it->second)) return {false, {}, "video.invalid_value"};
        }
        if (result.values.count("setting.aspectratiomode") && result.values["setting.aspectratiomode"] != "0" && result.values["setting.aspectratiomode"] != "1" && result.values["setting.aspectratiomode"] != "2") return {false, {}, "video.invalid_value"};
        if (result.values.count("setting.defaultres") && result.values.count("setting.defaultresheight")) {
            for (const auto& key : {"setting.defaultres", "setting.defaultresheight"}) {
                const auto v = result.values[key];
                if (v.empty() || v.size() > 5 || !std::all_of(v.begin(), v.end(), [](unsigned char c) { return std::isdigit(c); }) || std::stoi(v) < 320 || std::stoi(v) > 16384) return {false, {}, "video.invalid_value"};
            }
            result.values["resolution"] = result.values["setting.defaultres"] + "x" + result.values["setting.defaultresheight"];
        }
        if (result.values.count("setting.fullscreen") && result.values.count("setting.nowindowborder")) {
            if ((result.values["setting.fullscreen"] != "0" && result.values["setting.fullscreen"] != "1") || (result.values["setting.nowindowborder"] != "0" && result.values["setting.nowindowborder"] != "1")) return {false, {}, "video.invalid_value"};
            result.values["display"] = result.values["setting.fullscreen"] == "1" ? "fullscreen" : result.values["setting.nowindowborder"] == "1" ? "borderless" : "window";
        }
        result.success = true; return result;
    } catch (const std::runtime_error&) { return {false, {}, "video.invalid"}; }
      catch (const std::invalid_argument&) { return {false, {}, "video.invalid"}; }
      catch (const std::out_of_range&) { return {false, {}, "video.invalid"}; }
}
ConfigWriteResult changeVideoOption(const std::string& text, const std::string& key, const std::string& value, std::string& changed) {
    const auto parsed = parseVideoConfig(text); if (!parsed.success) return {false,false,parsed.error};
    const auto found = std::find_if(videoOptions().begin(), videoOptions().end(), [&](const auto& o) { return o.key == key; });
    if (found == videoOptions().end() || !permitted(*found, value)) return {false,false,"video.invalid_value"};
    std::map<std::string,std::string> fields;
    if (key == "resolution") { auto x = value.find('x'); fields["setting.defaultres"] = value.substr(0,x); fields["setting.defaultresheight"] = value.substr(x+1); const int w = std::stoi(value.substr(0,x)), h = std::stoi(value.substr(x+1)); fields["setting.aspectratiomode"] = w * 3 == h * 4 ? "0" : w * 10 == h * 16 ? "2" : "1"; }
    else if (key == "display") { fields["setting.fullscreen"] = value == "fullscreen" ? "1" : "0"; fields["setting.nowindowborder"] = value == "window" ? "0" : "1"; }
    else fields[key] = value;
    try { changed = replaceFields(text, fields); return {true, changed != text, {}}; }
    catch (const std::runtime_error&) { return {false,false,"video.invalid"}; }
}
bool isCs2Running() {
#if defined(_WIN32)
    HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0); if (snapshot == INVALID_HANDLE_VALUE) return true;
    PROCESSENTRY32W e{}; e.dwSize = sizeof(e); bool running = false;
    if (Process32FirstW(snapshot, &e)) do { if (_wcsicmp(e.szExeFile,L"cs2.exe") == 0) { running = true; break; } } while (Process32NextW(snapshot,&e));
    CloseHandle(snapshot); return running;
#else
    return false;
#endif
}
ConfigWriteResult mergeVideoConfig(const std::string& text, const std::string& current, std::string& merged) {
    const auto source = parseVideoConfig(text); if (!source.success) return {false,false,source.error};
    try {
        // Parse the target structurally; unfamiliar values must remain intact.
        videoDocument(current);
        std::map<std::string,std::string> fields;
        for (const auto& option : videoOptions()) if (option.key != "resolution" && option.key != "display" && source.values.count(option.key)) fields[option.key] = source.values.at(option.key);
        for (const auto& key : {"setting.defaultres","setting.defaultresheight","setting.fullscreen","setting.nowindowborder","setting.aspectratiomode"}) if (source.values.count(key)) fields[key] = source.values.at(key);
        // Keep rendering settings in custom mode; GPU/CPU detection fields remain target-owned.
        if (source.values.count("AutoConfig") && source.values.at("AutoConfig") == "2") fields["AutoConfig"] = "2";
        merged = replaceFields(current,fields);
        return {true,merged!=current,{}};
    } catch (const std::runtime_error&) { return {false,false,"video.invalid_target"}; }
}
ConfigWriteResult applyVideoConfig(const std::string& text, const std::string& userCfgDir) {
    if (userCfgDir.empty()) return {false,false,"video.no_account"};
    if (isCs2Running()) return {false,false,"video.running"};
    const auto source = parseVideoConfig(text); if (!source.success) return {false,false,source.error};
    try {
        const auto target = fs::u8path(userCfgDir) / "cs2_video.txt";
        if (!fs::is_regular_file(target)) return {false,false,"video.no_file"};
        std::ifstream f(target,std::ios::binary); if (!f) return {false,false,"pkg.write_failed"};
        const std::string current{std::istreambuf_iterator<char>(f),std::istreambuf_iterator<char>()}; f.close();
        std::string merged;const auto result = mergeVideoConfig(text,current,merged);
        if (!result.success) return result;
        return writeConfigWithBackup(target.u8string(),merged,"video-apply");
    } catch (const fs::filesystem_error&) { return {false,false,"pkg.write_failed"}; }
      catch (const std::runtime_error&) { return {false,false,"video.invalid_target"}; }
}
std::vector<AnnotationGuide> annotationGuides(const std::string& root) {
    std::vector<AnnotationGuide> guides;
    for (const auto& e : configCatalog("annotations",root)) guides.push_back({e.id,e.name,e.directory,e.map,e.files.front()});
    return guides;
}
bool validateAnnotation(const std::string& text, const std::string& id, const std::string& root) {
    const auto item = guide(id,root); if (!item || text.size() > 8 * 1024 * 1024) return false;
    const auto start = text.find("<!-- kv3"); if (start == std::string::npos || start > 3) return false;
    const auto end = text.find("-->",start); if (end == std::string::npos) return false;
    try { return Kv3Parser(text.substr(end+3)).parse() == item->map; }
    catch (const std::runtime_error&) { return false; }
    catch (const std::invalid_argument&) { return false; }
    catch (const std::out_of_range&) { return false; }
}
ConfigWriteResult operateAnnotationGuides(const std::vector<std::string>& ids, const std::string& directory, bool remove) {
    if (directory.empty() || ids.empty()) return {false,false,"annotations.invalid"};
    std::map<std::string,std::string> documents;
    for (const auto& id : ids) {
        const auto entry = guide(id); if (!entry || documents.count(id)) return {false,false,"annotations.invalid"};
        std::string text;
        if (!remove) {
            std::ifstream f(fs::u8path(packageFilePath("annotations",entry->relativeFile())),std::ios::binary);
            if (!f) return {false,false,"pkg.write_failed"};
            text.assign(std::istreambuf_iterator<char>(f),std::istreambuf_iterator<char>());
            if (f.bad() || !validateAnnotation(text,id)) return {false,false,"annotations.invalid"};
        }
        documents[id] = std::move(text);
    }
    // Each file has its own atomic write/backup. Report partial progress on an OS failure.
    bool changed = false;
    for (const auto& [id,text] : documents) {
        const auto result = remove ? removeAnnotation(id,directory) : deployAnnotation(id,text,directory);
        if (!result.success) return {false,changed,changed ? "annotations.partial" : result.error};
        changed = changed || result.changed;
    }
    return {true,changed,{}};
}
std::string annotationTarget(const std::string& id, const std::string& directory) {
    const auto item = guide(id); return !item || directory.empty() ? std::string() : (fs::u8path(directory) / fs::u8path(item->relativeFile())).u8string();
}
ConfigWriteResult deployAnnotation(const std::string& id,const std::string& text,const std::string& directory) {
    const auto target = annotationTarget(id,directory);
    if (target.empty() || !validateAnnotation(text,id)) return {false,false,"annotations.invalid"};
    return writeConfigWithBackup(target,text,"annotation-deploy");
}
ConfigWriteResult removeAnnotation(const std::string& id,const std::string& directory) {
    const auto target = annotationTarget(id,directory); if (target.empty()) return {false,false,"annotations.invalid"};
    try {
        if (!fs::exists(fs::u8path(target))) return {true,false,{}};
        return removeConfigWithBackup(target,"annotation-remove");
    } catch (const fs::filesystem_error&) { return {false,false,"pkg.write_failed"}; }
}
}
