#include "srp/core/config_backup.h"
#include <filesystem>
#include <fstream>
#include <sstream>
#include <chrono>
#include <atomic>
#include <algorithm>
#include <vector>
#include <iomanip>
#include <cctype>
#include <thread>
#if defined(_WIN32)
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#endif

namespace srp::core {
namespace fs = std::filesystem;
namespace {
std::atomic<unsigned long long> sequence{0};
std::string uniqueStamp() {
    const auto now = std::chrono::system_clock::now();
    const auto time = std::chrono::system_clock::to_time_t(now);
    std::tm tm{};
#if defined(_WIN32)
    gmtime_s(&tm, &time);
#else
    gmtime_r(&time, &tm);
#endif
    const auto ticks = std::chrono::duration_cast<std::chrono::nanoseconds>(now.time_since_epoch()).count();
    std::ostringstream out;
    out << std::put_time(&tm, "%Y%m%d-%H%M%S") << '-' << std::setw(9) << std::setfill('0')
        << ticks % 1000000000 << '-' << ++sequence;
    return out.str();
}
struct TempFile {
    fs::path path;
    ~TempFile() { std::error_code ec; fs::remove(path, ec); }
};
bool writeBytes(const fs::path& path, const std::string& bytes) {
    std::ofstream out(path, std::ios::binary | std::ios::trunc);
    if (!out) return false;
    out.write(bytes.data(), static_cast<std::streamsize>(bytes.size()));
    out.flush();
    if (!out) return false;
    out.close();
    return !out.fail();
}
bool replaceFile(const fs::path& from, const fs::path& to) {
#if defined(_WIN32)
    // Directory watchers and antivirus can hold transient handles during replacement.
    // Windows can also report access denied for a transient delete-sharing conflict.
    // Retries are bounded and never change permissions or remove the live file.
    for (int attempt = 0; attempt < 50; ++attempt) {
        if (MoveFileExW(from.c_str(), to.c_str(), MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH)) return true;
        const DWORD error = GetLastError();
        if (error != ERROR_SHARING_VIOLATION && error != ERROR_LOCK_VIOLATION && error != ERROR_ACCESS_DENIED) return false;
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
        SetLastError(error);
    }
    return false;
#else
    std::error_code ec;
    fs::rename(from, to, ec);
    return !ec;
#endif
}
}
ConfigWriteResult writeConfigWithBackup(const std::string& filePath,
    const std::string& content, const std::string& reason) {
    if (filePath.empty()) return {false, false, "Empty file path"};
    try {
        const fs::path path = fs::u8path(filePath);
        const bool exists = fs::exists(path);
        std::string previous;
        if (exists) {
            if (!fs::is_regular_file(path)) return {false, false, "Target is not a regular file"};
            std::ifstream in(path, std::ios::binary);
            if (!in) return {false, false, "Cannot read current file"};
            previous.assign(std::istreambuf_iterator<char>(in), std::istreambuf_iterator<char>());
            if (in.bad()) return {false, false, "Cannot read current file"};
            if (previous == content) return {true, false, {}};
        }
        fs::create_directories(path.parent_path());
        const auto stamp = uniqueStamp();
        TempFile staged{path.parent_path() / fs::u8path("." + path.filename().u8string() + "." + stamp + ".tmp")};
        if (!writeBytes(staged.path, content)) return {false, false, "Cannot write temporary file"};
        const fs::path history = path.parent_path() / ".backups" / path.filename();
        const fs::path latest = fs::u8path(filePath + ".bak");
        TempFile previousBackup{fs::u8path(filePath + ".bak." + stamp + ".previous.tmp")};
        bool hadBackup = false;
        fs::path revision;
        if (exists) {
            std::string safeReason;
            for (unsigned char c : reason) if (std::isalnum(c) || c == '-') safeReason += static_cast<char>(c);
            if (safeReason.empty()) safeReason = "edit";
            fs::create_directories(history);
            revision = history / fs::u8path(stamp + "-" + safeReason.substr(0, 48) + ".bak");
            hadBackup = fs::exists(latest);
            if (hadBackup) fs::copy_file(latest, previousBackup.path, fs::copy_options::none);
            // Backups finish before replacing the live file.
            fs::copy_file(path, revision, fs::copy_options::none);
            TempFile stagedBackup{fs::u8path(filePath + ".bak." + stamp + ".tmp")};
            fs::copy_file(path, stagedBackup.path, fs::copy_options::none);
            if (!replaceFile(stagedBackup.path, latest)) {
                std::error_code ec;
                fs::remove(revision, ec);
                return {false, false, "Cannot replace latest backup"};
            }
        }
        if (!replaceFile(staged.path, path)) {
#if defined(_WIN32)
            const DWORD replaceError = GetLastError();
#endif
            if (exists) {
                bool restored = true;
                std::error_code ec;
                if (hadBackup) restored = replaceFile(previousBackup.path, latest);
                else fs::remove(latest, ec);
                fs::remove(revision, ec);
                if (!restored) return {false, false, "Cannot replace file or restore prior .bak; current file remains intact"};
            }
#if defined(_WIN32)
            return {false, false, "Cannot replace configuration file (Windows error " + std::to_string(replaceError) + ")"};
#else
            return {false, false, "Cannot replace configuration file"};
#endif
        }
        if (exists) {
            std::vector<fs::path> revisions;
            std::error_code ec;
            for (fs::directory_iterator it(history, ec), end; !ec && it != end; it.increment(ec)) {
                if (it->is_regular_file(ec) && it->path().extension() == ".bak") revisions.push_back(it->path());
            }
            std::sort(revisions.rbegin(), revisions.rend());
            std::vector<std::string> keptContent;
            for (const auto& candidate : revisions) {
                std::ifstream in(candidate, std::ios::binary);
                if (!in) continue;
                const std::string bytes{std::istreambuf_iterator<char>(in), std::istreambuf_iterator<char>()};
                if (in.bad()) continue;
                in.close();
                const bool duplicate = std::find(keptContent.begin(), keptContent.end(), bytes) != keptContent.end();
                if (duplicate || keptContent.size() >= 20) fs::remove(candidate, ec);
                else keptContent.push_back(bytes);
            }
        }
        return {true, true, {}};
    } catch (const fs::filesystem_error& error) {
        return {false, false, error.what()};
    }
}
}
