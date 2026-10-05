#include "srp/core/packages.h"
#include "srp/core/media_config.h"
#include "srp/core/catalog.h"
#include "json_reader.h"
#include <filesystem>
#include <fstream>
#include <map>
#include <set>
#include <algorithm>
#include <chrono>
#include <mutex>
#include <sstream>
#include <cstdlib>
#include <cctype>
#if defined(_WIN32)
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winhttp.h>
#include <bcrypt.h>
#endif

namespace srp::core {
namespace fs = std::filesystem;
namespace {
std::string storeOverride, bundleOverride;
std::recursive_mutex storeMutex;
const std::vector<std::string> ids = {"srp-cfg", "video", "annotations"};
bool validId(const std::string& id) { return std::find(ids.begin(), ids.end(), id) != ids.end(); }
std::string read(const fs::path& p) {
    std::ifstream f(p, std::ios::binary);
    if (!f) return {};
    return {std::istreambuf_iterator<char>(f), std::istreambuf_iterator<char>()};
}
std::string readRequired(const fs::path& p) {
    std::ifstream f(p,std::ios::binary);
    if (!f) throw std::runtime_error("pkg.write_failed");
    const std::string bytes{std::istreambuf_iterator<char>(f),std::istreambuf_iterator<char>()};
    if (f.bad()) throw std::runtime_error("pkg.write_failed");
    return bytes;
}
void write(const fs::path& p, const std::string& bytes) {
    fs::create_directories(p.parent_path());
    std::ofstream f(p, std::ios::binary | std::ios::trunc);
    f.write(bytes.data(), static_cast<std::streamsize>(bytes.size())); f.close();
    if (!f) throw std::runtime_error("pkg.write_failed");
}
std::string trim(std::string s) {
    auto a = s.find_first_not_of(" \t\r\n");
    return a == std::string::npos ? std::string() : s.substr(a, s.find_last_not_of(" \t\r\n") - a + 1);
}
bool safeRelative(const std::string& s) {
    if (s.empty() || s.find_first_of("\\:\r\n") != std::string::npos || s.find('\0') != std::string::npos || s.front() == '/') return false;
    const fs::path p = fs::u8path(s);
    for (const auto& part : p) {
        const auto name = part.u8string();
        if (part == "." || part == ".." || name.empty() || name.back() == '.' || name.back() == ' ' || name.find_first_of("<>\"|?*") != std::string::npos) return false;
    }
    return true;
}
fs::path current() {
    const auto root = fs::u8path(packageStoreRoot());
    const auto name = trim(read(root / "current.txt"));
    if (!safeRelative(name) || name.find('/') != std::string::npos) return {};
    return root / "generations" / fs::u8path(name);
}
bool editable(const std::string& id, const std::string& rel) {
    if (!validId(id) || !safeRelative(rel)) return false;
    if (id == "video") return rel == "cs2_video.txt";
    if (id == "srp-cfg" && (rel == "user/custom.cfg" || rel == "valve/settings.cfg" || rel == "valve/keymap.cfg")) return true;
    const auto active = current();
    return !active.empty() && catalogFileAllowed(id,rel,(active / "original" / id).u8string());
}
std::string stamp() { return std::to_string(std::chrono::high_resolution_clock::now().time_since_epoch().count()); }
void copyTree(const fs::path& from, const fs::path& to, bool preserveBackups = false) {
    if (!fs::is_directory(from)) throw std::runtime_error("pkg.invalid_package");
    fs::create_directories(to);
    size_t count = 0, total = 0;
    for (const auto& e : fs::recursive_directory_iterator(from)) {
        if (e.is_symlink()) throw std::runtime_error("pkg.invalid_package");
        const auto rel = e.path().lexically_relative(from);
        if (e.is_directory()) {
            if (!preserveBackups && e.path().filename() == ".backups") continue;
            fs::create_directories(to / rel);
        } else if (e.is_regular_file()) {
            if (!preserveBackups && (e.path().extension() == ".bak" || e.path().extension() == ".tmp" || rel.u8string().find(".backups") != std::string::npos)) continue;
            if (++count > (preserveBackups ? 50000 : 5000) || (total += static_cast<size_t>(e.file_size())) > (preserveBackups ? 512 : 64) * 1024 * 1024) throw std::runtime_error("pkg.invalid_package");
            write(to / rel, readRequired(e.path()));
        } else throw std::runtime_error("pkg.invalid_package");
    }
}
bool validVersion(const std::string& version) {
    if (version.empty() || version.size() > 40) return false;
    return std::all_of(version.begin(), version.end(), [](unsigned char c) { return std::isalnum(c) || c == '.' || c == '-'; });
}
void validateDirectory(const std::string& id, const fs::path& path) {
    if (!validId(id) || !validVersion(trim(read(path / "VERSION.txt")))) throw std::runtime_error("pkg.invalid_package");
    if (id == "video") {
        if (!parseVideoConfig(read(path / "cs2_video.txt")).success) throw std::runtime_error("pkg.invalid_package");
        return;
    }
    if (id == "srp-cfg") for (const auto* file : {"runtime/init.cfg","user/custom.cfg","valve/settings.cfg","valve/keymap.cfg"})
        if (!fs::is_regular_file(path / file) || read(path / file).empty()) throw std::runtime_error("pkg.invalid_package");
    const auto catalog = readConfigCatalog(id,path.u8string());
    if (!catalog.success) throw std::runtime_error("pkg.invalid_catalog");
    if (id == "annotations") for (const auto& guide : annotationGuides(path.u8string()))
        if (!validateAnnotation(read(path / guide.relativeFile()),guide.id,path.u8string())) throw std::runtime_error("pkg.invalid_package");
}
// A process-level lock also protects GUI/CLI users of the same store.
struct StoreLock {
    fs::path directory;
#if defined(_WIN32)
    HANDLE handle = INVALID_HANDLE_VALUE;
#endif
    explicit StoreLock(const fs::path& root) : directory(root / ".update-lock") {
        fs::create_directories(root);
#if defined(_WIN32)
        handle = CreateFileW(directory.c_str(), GENERIC_READ | GENERIC_WRITE, 0, nullptr, OPEN_ALWAYS, FILE_ATTRIBUTE_NORMAL, nullptr);
        if (handle == INVALID_HANDLE_VALUE) throw std::runtime_error("pkg.busy");
#else
        if (!fs::create_directory(directory)) throw std::runtime_error("pkg.busy");
#endif
    }
    ~StoreLock() {
#if defined(_WIN32)
        if (handle != INVALID_HANDLE_VALUE) CloseHandle(handle);
#else
        std::error_code ec; fs::remove(directory, ec);
#endif
    }
};
struct Cleanup {
    fs::path path;
    bool keep = false;
    ~Cleanup() { if (!keep) { std::error_code ec; fs::remove_all(path, ec); } }
};
ConfigWriteResult publishGeneration(const fs::path& next, const fs::path& old, const std::string& name) {
    const auto result = writeConfigWithBackup((fs::u8path(packageStoreRoot()) / "current.txt").u8string(), name, "package-update");
    if (result.success) {
        std::vector<fs::path> generations;
        std::error_code ec;
        for (fs::directory_iterator it(next.parent_path(), ec), end; !ec && it != end; it.increment(ec)) if (it->is_directory(ec)) generations.push_back(it->path());
        std::sort(generations.rbegin(), generations.rend());
        size_t retained = 0;
        for (const auto& generation : generations) {
            if (generation == next || generation == old || retained++ < 2) continue;
            fs::remove_all(generation, ec);
        }
    }
    return result;
}
ConfigWriteResult transactDocument(const std::string& id, const std::string& rel, const std::string& content,
    const std::string& version, const std::string& baseline, const char* reason) {
    const auto old = current();
    if (old.empty()) return {false,false,"pkg.no_bundle"};
    const auto target = old / "work" / id / fs::u8path(rel);
    const auto metadata = old / "base-version" / id / fs::u8path(rel + ".version");
    const auto base = old / "base" / id / fs::u8path(rel);
    if (version.empty() || (trim(read(metadata)) == version && read(base) == baseline)) return writeConfigWithBackup(target.u8string(),content,reason);
    const std::string name = stamp();
    const auto next = old.parent_path() / name; Cleanup cleanup{next};
    copyTree(old,next,true);
    const auto changed = writeConfigWithBackup((next / "work" / id / fs::u8path(rel)).u8string(),content,reason);
    if (!changed.success) return changed;
    write(next / "base" / id / fs::u8path(rel),baseline);
    write(next / "base-version" / id / fs::u8path(rel + ".version"),version);
    const auto published = publishGeneration(next,old,name);
    if (published.success) cleanup.keep = true;
    return published;
}
ConfigWriteResult promote(const std::map<std::string, fs::path>& replacements, const std::map<std::string, std::string>& digests = {}) {
    StoreLock lock(fs::u8path(packageStoreRoot()));
    const auto old = current();
    const std::string name = stamp();
    const auto next = fs::u8path(packageStoreRoot()) / "generations" / name;
    Cleanup cleanup{next};
    if (!old.empty() && fs::is_directory(old)) copyTree(old, next, true);
    for (const auto& [id, source] : replacements) {
        validateDirectory(id, source);
        const auto original = next / "original" / id;
        if (fs::is_directory(original)) for (const auto& entry : fs::recursive_directory_iterator(original)) {
            if (!entry.is_regular_file()) continue;
            const auto rel = entry.path().lexically_relative(original);
            const auto work = next / "work" / id / rel;
            const auto base = next / "base" / id / rel;
            if (!fs::exists(source / rel) && fs::exists(work) && fs::exists(base) && read(work) == read(base)) {
                fs::remove(work); fs::remove(base);
            }
        }
        fs::remove_all(original);
        copyTree(source, original);
        const std::string version = trim(read(original / "VERSION.txt"));
        fs::remove(next / "digest" / id);
        if (digests.count(id)) write(next / "digest" / id, digests.at(id));
        for (const auto& entry : fs::recursive_directory_iterator(original)) {
            if (!entry.is_regular_file()) continue;
            const auto rel = entry.path().lexically_relative(original);
            const auto work = next / "work" / id / rel;
            const auto base = next / "base" / id / rel;
            // Base snapshots record exactly which default a local file was edited from.
            if (!fs::exists(work) || (fs::exists(base) && read(work) == read(base))) {
                write(work, read(entry.path())); write(base, read(entry.path()));
                write(next / "base-version" / id / fs::u8path(rel.u8string() + ".version"), version);
            }
        }
    }
    const auto result = publishGeneration(next,old,name);
    if (result.success) cleanup.keep = true;
    return result;
}
using detail::JsonParser;
bool allowedUrl(const std::string& url) {
    const std::string prefix = "https://cfg.srprolin.top/packages/";
    return url.rfind(prefix, 0) == 0 && safeRelative(url.substr(prefix.size())) && url.find_first_of("?#") == std::string::npos;
}
#if defined(_WIN32)
struct InternetHandle { HINTERNET value = nullptr; ~InternetHandle() { if (value) WinHttpCloseHandle(value); } };
bool download(const std::string& url, std::string& bytes, size_t limit) {
    const std::wstring wide = fs::u8path(url).wstring();
    URL_COMPONENTS parts{}; parts.dwStructSize = sizeof(parts); parts.dwHostNameLength = parts.dwUrlPathLength = static_cast<DWORD>(-1);
    if (!WinHttpCrackUrl(wide.c_str(), 0, 0, &parts) || parts.nScheme != INTERNET_SCHEME_HTTPS) return false;
    InternetHandle session{WinHttpOpen(L"SrP-CFG/3.4", WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY, nullptr, nullptr, 0)};
    if (!session.value) return false;
    WinHttpSetTimeouts(session.value, 10000, 10000, 15000, 15000);
    InternetHandle conn{WinHttpConnect(session.value, std::wstring(parts.lpszHostName, parts.dwHostNameLength).c_str(), parts.nPort, 0)};
    InternetHandle request{conn.value ? WinHttpOpenRequest(conn.value, L"GET", std::wstring(parts.lpszUrlPath, parts.dwUrlPathLength).c_str(), nullptr, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, WINHTTP_FLAG_SECURE) : nullptr};
    if (!request.value) return false;
    DWORD policy = WINHTTP_OPTION_REDIRECT_POLICY_NEVER;
    WinHttpSetOption(request.value, WINHTTP_OPTION_REDIRECT_POLICY, &policy, sizeof(policy));
    if (!WinHttpSendRequest(request.value, L"Cache-Control: no-cache\r\n", static_cast<DWORD>(-1), nullptr, 0, 0, 0) || !WinHttpReceiveResponse(request.value, nullptr)) return false;
    DWORD status = 0, len = sizeof(status);
    if (!WinHttpQueryHeaders(request.value, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER, WINHTTP_HEADER_NAME_BY_INDEX, &status, &len, WINHTTP_NO_HEADER_INDEX) || status != 200) return false;
    char buffer[16384]; DWORD got = 0;
    const auto deadline = std::chrono::steady_clock::now() + std::chrono::seconds(60);
    for (;;) {
        if (std::chrono::steady_clock::now() > deadline) return false;
        if (!WinHttpReadData(request.value, buffer, sizeof(buffer), &got)) return false;
        if (!got) return true;
        if (bytes.size() + got > limit) return false;
        bytes.append(buffer, got);
    }
}
std::string sha256(const std::string& bytes) {
    BCRYPT_ALG_HANDLE alg = nullptr; BCRYPT_HASH_HANDLE hash = nullptr;
    if (BCryptOpenAlgorithmProvider(&alg, BCRYPT_SHA256_ALGORITHM, nullptr, 0) < 0) return {};
    unsigned char result[32];
    const bool ok = BCryptCreateHash(alg, &hash, nullptr, 0, nullptr, 0, 0) >= 0 && BCryptHashData(hash, reinterpret_cast<PUCHAR>(const_cast<char*>(bytes.data())), static_cast<ULONG>(bytes.size()), 0) >= 0 && BCryptFinishHash(hash, result, 32, 0) >= 0;
    if (hash) BCryptDestroyHash(hash); BCryptCloseAlgorithmProvider(alg, 0);
    if (!ok) return {};
    std::string out; const char* hex = "0123456789abcdef"; for (auto b : result) { out += hex[b >> 4]; out += hex[b & 15]; } return out;
}
std::wstring quoteArg(const fs::path& path) {
    // Native Windows command-line quoting, not a shell expression.
    std::wstring result = L"\""; size_t slashes = 0;
    for (wchar_t c : path.wstring()) {
        if (c == L'\\') { ++slashes; continue; }
        if (c == L'"') result.append(slashes * 2 + 1, L'\\'); else result.append(slashes, L'\\');
        slashes = 0; result += c;
    }
    result.append(slashes * 2, L'\\'); return result + L"\"";
}
bool extract(const fs::path& archive, const fs::path& dest) {
    const auto script = dest.parent_path() / "extract.ps1";
    write(script, R"PS(param([string]$Zip,[string]$Dest)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=[IO.Compression.ZipFile]::OpenRead($Zip)
try {
 $root=[IO.Path]::GetFullPath($Dest)+[IO.Path]::DirectorySeparatorChar
 $seen=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
 $sum=0L
 if ($archive.Entries.Count -gt 5000) { throw 'Entry limit' }
 foreach($e in $archive.Entries) {
  $name=$e.FullName
  if($name.Contains('\') -or $name.Contains(':') -or $name.StartsWith('/') -or ($name.Split('/') -contains '..') -or ($name.Split('/') -contains '.')) { throw 'Unsafe path' }
  foreach($part in $name.Split('/')) {
   if($part -and ($part.EndsWith('.') -or $part.EndsWith(' ') -or $part.IndexOfAny([IO.Path]::GetInvalidFileNameChars()) -ge 0 -or $part -match '^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)')) { throw 'Unsafe name' }
  }
  $target=[IO.Path]::GetFullPath([IO.Path]::Combine($root,$name))
  if(-not $target.StartsWith($root,[StringComparison]::OrdinalIgnoreCase) -or -not $seen.Add($target)) { throw 'Duplicate or escaping path' }
  $type=($e.ExternalAttributes -shr 16) -band 0xF000
  if($type -eq 0xA000 -or (($e.ExternalAttributes -band 0x400) -ne 0)) { throw 'Links forbidden' }
  $sum+=$e.Length
  if($sum -gt 67108864 -or $e.Length -gt 16777216) { throw 'Expanded size limit' }
 }
 foreach($e in $archive.Entries) {
  $target=[IO.Path]::GetFullPath([IO.Path]::Combine($root,$e.FullName))
  if($e.FullName.EndsWith('/')) { [IO.Directory]::CreateDirectory($target)|Out-Null }
  else {
   [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target))|Out-Null
   $input=$e.Open(); $output=[IO.File]::Open($target,[IO.FileMode]::CreateNew)
   try { $buffer=New-Object byte[] 16384; $written=0L; while(($n=$input.Read($buffer,0,$buffer.Length)) -gt 0) { $written+=$n; if($written -gt $e.Length) { throw 'Invalid length' }; $output.Write($buffer,0,$n) }; if($written -ne $e.Length) { throw 'Invalid length' } } finally { $input.Dispose(); $output.Dispose() }
  }
 }
} finally { $archive.Dispose() }
)PS");
    wchar_t system[MAX_PATH]; if (!GetSystemDirectoryW(system, MAX_PATH)) return false;
    const fs::path exe = fs::path(system) / "WindowsPowerShell/v1.0/powershell.exe";
    std::wstring cmd = quoteArg(exe) + L" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File " + quoteArg(script) + L" -Zip " + quoteArg(archive) + L" -Dest " + quoteArg(dest);
    STARTUPINFOW startup{}; startup.cb = sizeof(startup); PROCESS_INFORMATION process{};
    if (!CreateProcessW(exe.c_str(), cmd.data(), nullptr, nullptr, FALSE, CREATE_NO_WINDOW, nullptr, nullptr, &startup, &process)) return false;
    const auto waited = WaitForSingleObject(process.hProcess, 30000);
    if (waited != WAIT_OBJECT_0) { TerminateProcess(process.hProcess, 1); WaitForSingleObject(process.hProcess, 5000); }
    DWORD code = 1; GetExitCodeProcess(process.hProcess, &code); CloseHandle(process.hThread); CloseHandle(process.hProcess);
    return waited == WAIT_OBJECT_0 && code == 0;
}
#endif
}
void setPackageStoreRoot(const std::string& root) { std::lock_guard<std::recursive_mutex> lock(storeMutex); storeOverride = root; }
void setBundledConfigDir(const std::string& root) { std::lock_guard<std::recursive_mutex> lock(storeMutex); bundleOverride = root; }
std::string packageStoreRoot() {
    if (!storeOverride.empty()) return storeOverride;
#if defined(_WIN32)
    wchar_t* local = nullptr; size_t n = 0; _wdupenv_s(&local, &n, L"LOCALAPPDATA");
    fs::path root = local ? fs::path(local) : fs::temp_directory_path(); free(local);
#else
    const char* xdg = std::getenv("XDG_DATA_HOME");
    fs::path root = xdg ? fs::path(xdg) : fs::temp_directory_path();
#endif
    return (root / "SrP-CFG" / "packages").u8string();
}
std::string findBundledConfigDir() {
    if (!bundleOverride.empty()) return bundleOverride;
    std::vector<fs::path> roots;
#if defined(_WIN32)
    wchar_t exe[32768]; const auto size = GetModuleFileNameW(nullptr, exe, 32768);
    if (size && size < 32768) { auto dir = fs::path(exe).parent_path(); for (int i = 0; i < 6; ++i) { roots.push_back(dir / "config"); dir = dir.parent_path(); } }
#endif
    roots.push_back("config"); roots.push_back("../config");
    for (const auto& root : roots) { std::error_code ec; if (fs::is_regular_file(root / "srp-cfg/runtime/init.cfg", ec)) return fs::absolute(root).u8string(); }
    return {};
}
ConfigWriteResult initializePackages() {
    std::lock_guard<std::recursive_mutex> guard(storeMutex);
    try {
        if (!current().empty() && fs::is_directory(current() / "original/srp-cfg")) return {true, false, {}};
        const auto bundle = findBundledConfigDir(); if (bundle.empty()) return {false, false, "pkg.no_bundle"};
        std::map<std::string, fs::path> sources; for (const auto& id : ids) sources[id] = fs::u8path(bundle) / id;
        return promote(sources);
    } catch (const fs::filesystem_error&) { return {false, false, "pkg.write_failed"}; }
      catch (const std::runtime_error& e) { return {false, false, e.what()}; }
}
std::string packageOriginalDir() { std::lock_guard<std::recursive_mutex> guard(storeMutex); const auto p = current(); return p.empty() ? std::string() : (p / "original").u8string(); }
std::string packageWorkDir() { std::lock_guard<std::recursive_mutex> guard(storeMutex); const auto p = current(); return p.empty() ? std::string() : (p / "work").u8string(); }
std::string packageVersion(const std::string& id) { const auto root = packageOriginalDir(); if (!validId(id) || root.empty()) return {}; return trim(read(fs::u8path(root) / id / "VERSION.txt")); }
std::string packageDigest(const std::string& id) { std::lock_guard<std::recursive_mutex> guard(storeMutex); return !validId(id) || current().empty() ? std::string() : read(current() / "digest" / id); }
std::string packageFileBaseline(const std::string& id, const std::string& relative) { std::lock_guard<std::recursive_mutex> guard(storeMutex); return !editable(id, relative) || current().empty() ? std::string() : read(current() / "base" / id / fs::u8path(relative)); }
std::string packageFilePath(const std::string& id, const std::string& rel, bool original) {
    if (!editable(id, rel)) return {};
    const auto root = original ? packageOriginalDir() : packageWorkDir();
    return root.empty() ? std::string() : (fs::u8path(root) / id / fs::u8path(rel)).u8string();
}
PackageFileState inspectPackageFile(const std::string& id, const std::string& rel) {
    std::lock_guard<std::recursive_mutex> guard(storeMutex);
    if (!editable(id, rel) || current().empty()) return {};
    const auto base = current() / "base" / id / fs::u8path(rel);
    const auto work = current() / "work" / id / fs::u8path(rel);
    return {read(work) != read(base), trim(read(current() / "base-version" / id / fs::u8path(rel + ".version"))) != packageVersion(id), trim(read(current() / "base-version" / id / fs::u8path(rel + ".version")))};
}
ConfigWriteResult savePackageFile(const std::string& id, const std::string& rel, const std::string& content, const std::string& baselineVersion, const std::string& baselineContent) {
    std::lock_guard<std::recursive_mutex> guard(storeMutex);
    if (!editable(id, rel)) return {false, false, "pkg.invalid_file"};
    if (id == "video" && !parseVideoConfig(content).success) return {false,false,"video.invalid"};
    if (id == "annotations") for (const auto& guide : annotationGuides()) if (guide.relativeFile() == rel && !validateAnnotation(content,guide.id)) return {false,false,"annotations.invalid"};
    if (current().empty()) return {false, false, "pkg.no_bundle"};
    try {
        StoreLock lock(fs::u8path(packageStoreRoot()));
        return transactDocument(id,rel,content,baselineVersion,baselineContent,"staging-save");
    }
    catch (const fs::filesystem_error&) { return {false, false, "pkg.write_failed"}; }
    catch (const std::runtime_error& e) { return {false, false, e.what()}; }
}
ConfigWriteResult resetPackageFile(const std::string& id, const std::string& rel) {
    std::lock_guard<std::recursive_mutex> guard(storeMutex);
    if (!editable(id, rel) || current().empty()) return {false, false, "pkg.invalid_file"};
    try {
        StoreLock lock(fs::u8path(packageStoreRoot()));
        const auto content = readRequired(fs::u8path(packageFilePath(id, rel, true)));
        return transactDocument(id,rel,content,packageVersion(id),content,"staging-reset");
    } catch (const fs::filesystem_error&) { return {false, false, "pkg.write_failed"}; }
      catch (const std::runtime_error& e) { return {false, false, e.what()}; }
}
std::string packageManifestUrl() { return "https://cfg.srprolin.top/packages.json"; }
bool parsePackageManifest(const std::string& json, std::vector<ConfigPackage>& packages, std::string& error) {
    try {
        if (json.size() > 256 * 1024) throw std::runtime_error("pkg.invalid_manifest");
        const auto doc = JsonParser(json).parse();
        if (doc.type != '{' || doc.object.at("schema_version").type != '1' || doc.object.at("schema_version").scalar != "1") throw std::runtime_error("pkg.invalid_manifest");
        std::vector<ConfigPackage> result;
        for (const auto& id : ids) {
            const auto& p = doc.object.at("packages").object.at(id);
            ConfigPackage item; item.id = id; item.version = p.object.at("version").scalar; item.url = p.object.at("url").scalar;
            item.sha256 = p.object.at("sha256").scalar;
            const auto size = p.object.at("size").scalar;
            if (p.type != '{' || p.object.at("version").type != '"' || p.object.at("url").type != '"' || p.object.at("sha256").type != '"' || p.object.at("size").type == '"') throw std::runtime_error("pkg.invalid_manifest");
            if (!validVersion(item.version) || !allowedUrl(item.url) || item.sha256.size() != 64 || !std::all_of(item.sha256.begin(), item.sha256.end(), [](unsigned char c) { return std::isxdigit(c); }) || size.empty() || !std::all_of(size.begin(), size.end(), [](unsigned char c) { return std::isdigit(c); })) throw std::runtime_error("pkg.invalid_manifest");
            item.size = std::stoull(size); if (!item.size || item.size > 16 * 1024 * 1024) throw std::runtime_error("pkg.invalid_manifest");
            std::transform(item.sha256.begin(), item.sha256.end(), item.sha256.begin(), [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
            result.push_back(item);
        }
        packages = std::move(result); error.clear(); return true;
    } catch (const std::runtime_error&) { error = "pkg.invalid_manifest"; }
      catch (const std::out_of_range&) { error = "pkg.invalid_manifest"; }
      catch (const std::invalid_argument&) { error = "pkg.invalid_manifest"; }
    return false;
}
ConfigWriteResult checkPackageUpdates(std::vector<ConfigPackage>& packages) {
#if defined(_WIN32)
    std::string bytes; if (!download(packageManifestUrl(), bytes, 256 * 1024)) return {false, false, "pkg.network_failed"};
    std::string error; if (!parsePackageManifest(bytes, packages, error)) return {false, false, error};
    return {true, false, {}};
#else
    return {false, false, "pkg.unsupported"};
#endif
}
ConfigWriteResult promotePackageDirectory(const std::string& id, const std::string& directory) {
    std::lock_guard<std::recursive_mutex> guard(storeMutex);
    if (!validId(id)) return {false, false, "pkg.invalid_package"};
    try { return promote({{id, fs::u8path(directory)}}); }
    catch (const fs::filesystem_error&) { return {false, false, "pkg.write_failed"}; }
    catch (const std::runtime_error& e) { return {false, false, e.what()}; }
}
ConfigWriteResult importPackageArchive(const ConfigPackage& package, const std::string& archive) {
#if defined(_WIN32)
    try {
        if (!validId(package.id) || !package.size || package.size > 16 * 1024 * 1024 || package.sha256.size() != 64 || fs::file_size(fs::u8path(archive)) != package.size) return {false, false, "pkg.hash_failed"};
        const auto bytes = read(fs::u8path(archive));
        if (bytes.size() > 16 * 1024 * 1024 || sha256(bytes) != package.sha256) return {false, false, "pkg.hash_failed"};
        Cleanup temporary{fs::u8path(packageStoreRoot()) / "downloads" / stamp()};
        fs::create_directories(temporary.path);
        const auto copy = temporary.path / "package.zip"; write(copy, bytes);
        const auto extracted = temporary.path / "extracted";
        if (!extract(copy, extracted)) return {false, false, "pkg.invalid_package"};
        const auto source = package.id == "srp-cfg" ? extracted / "srp-cfg" : extracted;
        if (trim(read(source / "VERSION.txt")) != package.version) return {false, false, "pkg.invalid_package"};
        std::lock_guard<std::recursive_mutex> guard(storeMutex);
        return promote({{package.id,source}},{{package.id,package.sha256}});
    } catch (const fs::filesystem_error&) { return {false, false, "pkg.write_failed"}; }
      catch (const std::runtime_error& e) { return {false, false, e.what()}; }
#else
    return {false, false, "pkg.unsupported"};
#endif
}
ConfigWriteResult updatePackage(const std::string& id) {
    if (!validId(id)) return {false, false, "pkg.invalid_package"};
    std::vector<ConfigPackage> packages; const auto checked = checkPackageUpdates(packages); if (!checked.success) return checked;
#if defined(_WIN32)
    for (const auto& p : packages) {
        if (p.id != id) continue;
        if (packageDigest(id) == p.sha256) return {true, false, {}};
        std::string bytes; if (!download(p.url, bytes, p.size)) return {false, false, "pkg.network_failed"};
        try {
            Cleanup downloadDir{fs::u8path(packageStoreRoot()) / "downloads" / stamp()};
            fs::create_directories(downloadDir.path); const auto file = downloadDir.path / "download.zip"; write(file, bytes);
            return importPackageArchive(p, file.u8string());
        } catch (const fs::filesystem_error&) { return {false, false, "pkg.write_failed"}; }
          catch (const std::runtime_error& e) { return {false, false, e.what()}; }
    }
#endif
    return {false, false, "pkg.unsupported"};
}
}
