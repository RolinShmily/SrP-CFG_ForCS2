#include "srp/core/actions.h"
#include "srp/core/vcfg.h"
#include "srp/core/assembly.h"
#include "srp/core/config_backup.h"
#include "srp/core/packages.h"

#include <filesystem>
#include <fstream>
#include <sstream>
#include <vector>

#if defined(_WIN32)
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <shellapi.h>
#endif

namespace srp::core {

namespace fs = std::filesystem;

namespace {

constexpr const char* SRP_HOOK_START = "// ─── SrP-CFG Launcher Hook (Managed) ───";
constexpr const char* SRP_HOOK_CMD1  = "exec srp-cfg/runtime/init.cfg";
constexpr const char* SRP_HOOK_CMD2  = "exec srp-cfg/user/custom.cfg";
constexpr const char* SRP_HOOK_END   = "// ─── End of SrP-CFG ───";

std::string trimString(const std::string& str) {
    size_t first = str.find_first_not_of(" \t\r\n");
    if (first == std::string::npos) return "";
    size_t last = str.find_last_not_of(" \t\r\n");
    return str.substr(first, (last - first + 1));
}

std::string readVersionFile(const fs::path& verPath) {
    std::error_code ec;
    if (!fs::exists(verPath, ec)) return "";
    std::ifstream file(verPath);
    if (!file) return "";
    std::string line;
    if (std::getline(file, line)) {
        line = trimString(line);
        if (!line.empty() && line[0] != 'v' && line[0] != 'V') {
            line = "v" + line;
        }
        return line;
    }
    return "";
}

bool mountAutoexecHook(const fs::path& autoexecPath) {
    std::error_code ec;
    if (!fs::exists(autoexecPath, ec)) {
        std::ofstream out(autoexecPath, std::ios::out | std::ios::trunc);
        if (!out) return false;
        out << SRP_HOOK_START << "\n";
        out << SRP_HOOK_CMD1 << "\n";
        out << SRP_HOOK_CMD2 << "\n";
        out << SRP_HOOK_END << "\n";
        return true;
    }

    // 已存在文件：读取并检测是否已经挂载
    std::ifstream in(autoexecPath);
    if (!in) return false;
    std::ostringstream ss;
    ss << in.rdbuf();
    std::string content = ss.str();
    in.close();

    if (content.find("srp-cfg/runtime/init.cfg") != std::string::npos) {
        // 已有挂载点，无需重复插入
        return true;
    }

    // 备份原有 autoexec.cfg
    fs::path bak = autoexecPath;
    bak += ".bak";
    fs::copy_file(autoexecPath, bak, fs::copy_options::overwrite_existing, ec);

    // 在最前面优雅插入非侵入式挂载块，完整保留玩家原有全部内容
    std::ofstream out(autoexecPath, std::ios::out | std::ios::trunc);
    if (!out) return false;
    out << SRP_HOOK_START << "\n";
    out << SRP_HOOK_CMD1 << "\n";
    out << SRP_HOOK_CMD2 << "\n";
    out << SRP_HOOK_END << "\n\n";
    out << content;
    return true;
}

bool unmountAutoexecHook(const fs::path& autoexecPath) {
    std::error_code ec;
    if (!fs::exists(autoexecPath, ec)) return true;

    std::ifstream in(autoexecPath);
    if (!in) return false;

    std::vector<std::string> remainingLines;
    std::string line;
    bool inHookBlock = false;
    while (std::getline(in, line)) {
        std::string trimmed = trimString(line);
        if (trimmed == SRP_HOOK_START) {
            inHookBlock = true;
            continue;
        }
        if (inHookBlock) {
            if (trimmed == SRP_HOOK_END) {
                inHookBlock = false;
            }
            continue;
        }
        // 兜底去除散落的单个挂载指令
        if (trimmed.find("srp-cfg/runtime/init.cfg") != std::string::npos ||
            trimmed.find("srp-cfg/user/custom.cfg") != std::string::npos) {
            continue;
        }
        remainingLines.push_back(line);
    }
    in.close();

    // 检查剩余内容是否有实质内容（非全空行）
    bool hasUserContent = false;
    for (const auto& l : remainingLines) {
        if (!trimString(l).empty()) {
            hasUserContent = true;
            break;
        }
    }

    if (!hasUserContent) {
        // 如果原本全是我们注入的启动引线，直接干净删除该文件
        fs::remove(autoexecPath, ec);
    } else {
        // 备份原有 autoexec.cfg
        fs::path bak = autoexecPath;
        bak += ".bak";
        fs::copy_file(autoexecPath, bak, fs::copy_options::overwrite_existing, ec);

        // 如果用户原有自己的内容，写回用户内容
        std::ofstream out(autoexecPath, std::ios::out | std::ios::trunc);
        if (!out) return false;
        for (size_t i = 0; i < remainingLines.size(); ++i) {
            out << remainingLines[i];
            if (i + 1 < remainingLines.size() || !remainingLines[i].empty()) {
                out << "\n";
            }
        }
    }
    return true;
}

} // namespace

bool launchCs2() {
#if defined(_WIN32)
    HINSTANCE res = ShellExecuteW(
        nullptr,
        L"open",
        L"steam://run/730",
        nullptr,
        nullptr,
        SW_SHOWNORMAL
    );
    return reinterpret_cast<intptr_t>(res) > 32;
#else
    return false;
#endif
}

bool openFolderInExplorer(const std::string& folderPath) {
    if (folderPath.empty()) return false;

    std::error_code ec;
    fs::path p = fs::u8path(folderPath);
    if (!fs::exists(p, ec)) {
        fs::create_directories(p, ec);
    }

#if defined(_WIN32)
    std::wstring widePath = p.wstring();
    HINSTANCE res = ShellExecuteW(
        nullptr,
        L"open",
        L"explorer.exe",
        widePath.c_str(),
        nullptr,
        SW_SHOWNORMAL
    );
    return reinterpret_cast<intptr_t>(res) > 32;
#else
    return false;
#endif
}

bool isSrpInstalled(const std::string& gameCfgDir) {
    if (gameCfgDir.empty()) return false;
    std::error_code ec;
    fs::path cfgPath = fs::u8path(gameCfgDir);

    fs::path initPath = cfgPath / "srp-cfg" / "runtime" / "init.cfg";
    fs::path autoexecPath = cfgPath / "autoexec.cfg";

    if (!fs::exists(initPath, ec) || !fs::exists(autoexecPath, ec)) {
        return false;
    }

    // 检查 autoexec.cfg 中是否挂载了 srp-cfg
    std::ifstream in(autoexecPath);
    if (!in) return false;
    std::string line;
    while (std::getline(in, line)) {
        if (line.find("srp-cfg/runtime/init.cfg") != std::string::npos) {
            return true;
        }
    }
    return false;
}

std::string getInstalledSrpVersion(const std::string& gameCfgDir) {
    if (!isSrpInstalled(gameCfgDir)) return "";
    fs::path verPath = fs::u8path(gameCfgDir) / "srp-cfg" / "VERSION.txt";
    std::string ver = readVersionFile(verPath);
    return ver.empty() ? "v3.4.0" : ver;
}

std::string findSourceConfigDir() {
    // Defaults are immutable; installed editors still target game files.
    if (initializePackages().success) return packageOriginalDir();
    std::vector<fs::path> candidates = {
        "config",
        "../config",
        "../../config",
        "../../../config"
    };

#if defined(_WIN32)
    wchar_t exePathBuf[MAX_PATH];
    if (GetModuleFileNameW(nullptr, exePathBuf, MAX_PATH)) {
        fs::path exeDir = fs::path(exePathBuf).parent_path();
        candidates.push_back(exeDir / "config");
        candidates.push_back(exeDir.parent_path() / "config");
        candidates.push_back(exeDir.parent_path().parent_path() / "config");
        candidates.push_back(exeDir.parent_path().parent_path().parent_path() / "config");
        candidates.push_back(exeDir.parent_path().parent_path().parent_path().parent_path() / "config");
    }
#endif

    std::error_code ec;
    for (const auto& p : candidates) {
        if (fs::exists(p / "srp-cfg" / "runtime" / "init.cfg", ec)) {
            return fs::absolute(p).u8string();
        }
    }
    return {};
}

std::string getSourceSrpVersion() {
    std::string src = findSourceConfigDir();
    if (src.empty()) return "v3.4.0";
    fs::path verPath = fs::u8path(src) / "srp-cfg" / "VERSION.txt";
    std::string ver = readVersionFile(verPath);
    return ver.empty() ? "v3.4.0" : ver;
}

bool installSrp(const std::string& gameCfgDir, const std::string& sourceConfigDir) {
    if (gameCfgDir.empty()) return false;

    std::string srcDir = sourceConfigDir.empty() ? (initializePackages().success ? packageWorkDir() : findSourceConfigDir()) : sourceConfigDir;
    if (srcDir.empty()) return false;

    std::error_code ec;
    fs::path srcPath = fs::u8path(srcDir);
    fs::path dstCfg = fs::u8path(gameCfgDir);

    if (!fs::exists(dstCfg, ec)) {
        fs::create_directories(dstCfg, ec);
    }

    // Leave the user file and all existing backups untouched, even during reinstall.
    // Never copy development backups into a user's installation.
    const fs::path dstSrp = dstCfg / "srp-cfg";
    const fs::path srcSrp = fs::is_directory(srcPath / "srp-cfg", ec) ? srcPath / "srp-cfg" : srcPath;
    if (!fs::is_regular_file(srcSrp / "runtime/init.cfg", ec)) return false;
    fs::recursive_directory_iterator it(srcSrp, ec), end;
    for (; !ec && it != end; it.increment(ec)) {
        const auto relative = it->path().lexically_relative(srcSrp);
        if (it->is_directory(ec)) {
            if (it->path().filename() == ".backups") it.disable_recursion_pending();
            else fs::create_directories(dstSrp / relative, ec);
        } else if (it->is_regular_file(ec)) {
            if (it->path().extension() == ".bak" || it->path().extension() == ".tmp") continue;
            if (relative == fs::path("user/custom.cfg") && fs::exists(dstSrp / relative, ec)) continue;
            const fs::path target = dstSrp / relative;
            if (fs::exists(target, ec) && it->path().extension() == ".cfg") {
                std::ifstream in(it->path(), std::ios::binary);
                if (!in) return false;
                const std::string content{std::istreambuf_iterator<char>(in), std::istreambuf_iterator<char>()};
                if (in.bad() || !writeConfigWithBackup(target.u8string(), content, "reinstall").success) return false;
            } else {
                fs::copy_file(it->path(), target, fs::copy_options::overwrite_existing, ec);
            }
        }
    }
    if (ec) return false;

    // 3. 非侵入式挂载 autoexec.cfg 启动引线 (不破坏玩家原有任何指令)
    fs::path dstAutoexec = dstCfg / "autoexec.cfg";
    if (!mountAutoexecHook(dstAutoexec)) return false;

    return isSrpInstalled(gameCfgDir);
}

bool uninstallSrp(const std::string& gameCfgDir) {
    if (gameCfgDir.empty()) return false;
    std::error_code ec;
    fs::path cfgPath = fs::u8path(gameCfgDir);
    fs::path srpDir = cfgPath / "srp-cfg";

    // 1. 备份用户的 custom.cfg
    fs::path userCustom = srpDir / "user" / "custom.cfg";
    if (fs::exists(userCustom, ec)) {
        fs::path bak = cfgPath / "custom.cfg.uninstalled.bak";
        fs::copy_file(userCustom, bak, fs::copy_options::overwrite_existing, ec);
    }

    // 2. 删除 srp-cfg 目录
    if (fs::exists(srpDir, ec)) {
        fs::remove_all(srpDir, ec);
    }

    // 3. 精准解挂 autoexec.cfg (仅剔除挂载块，玩家自己的指令 100% 保留)
    fs::path autoexec = cfgPath / "autoexec.cfg";
    unmountAutoexecHook(autoexec);

    return !isSrpInstalled(gameCfgDir);
}

bool resetValveBaseline(const std::string& gameCfgDir, const std::string& userCfgDir) {
    const auto result = assembleValve(gameCfgDir, true, true);
    if (!result.success) return false;
    if (!userCfgDir.empty()) {
        const bool keys = cleanAllKeybinds(userCfgDir);
        const bool convars = cleanAllConvars(userCfgDir);
        return keys && convars;
    }
    return true;
}

} // namespace srp::core
