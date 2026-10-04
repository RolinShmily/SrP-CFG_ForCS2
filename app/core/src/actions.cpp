#include "srp/core/actions.h"
#include "srp/core/vcfg.h"

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

    std::string srcDir = sourceConfigDir.empty() ? findSourceConfigDir() : sourceConfigDir;
    if (srcDir.empty()) return false;

    std::error_code ec;
    fs::path srcPath = fs::u8path(srcDir);
    fs::path dstCfg = fs::u8path(gameCfgDir);

    if (!fs::exists(dstCfg, ec)) {
        fs::create_directories(dstCfg, ec);
    }

    // 0. 保护现有用户 custom.cfg (如果已存在，绝不冲掉)
    fs::path dstSrp = dstCfg / "srp-cfg";
    fs::path userCustom = dstSrp / "user" / "custom.cfg";
    std::string existingCustomContent;
    bool hasExistingCustom = false;
    if (fs::exists(userCustom, ec)) {
        std::ifstream in(userCustom);
        if (in) {
            std::ostringstream ss;
            ss << in.rdbuf();
            existingCustomContent = ss.str();
            hasExistingCustom = true;
        }
        // 自动创建备份
        fs::path bak = userCustom;
        bak += ".bak";
        fs::copy_file(userCustom, bak, fs::copy_options::overwrite_existing, ec);
    }

    // 1. 复制整个 srp-cfg 运行时目录
    fs::path srcSrp = srcPath / "srp-cfg";
    if (fs::exists(srcSrp, ec)) {
        fs::copy(srcSrp, dstSrp, fs::copy_options::recursive | fs::copy_options::overwrite_existing, ec);
        if (ec) return false;
    }

    // 2. 如果之前有用户的 custom.cfg，恢复回去；否则保持模板
    if (hasExistingCustom) {
        std::ofstream out(userCustom, std::ios::out | std::ios::trunc);
        if (out) {
            out << existingCustomContent;
        }
    }

    // 3. 非侵入式挂载 autoexec.cfg 启动引线 (不破坏玩家原有任何指令)
    fs::path dstAutoexec = dstCfg / "autoexec.cfg";
    mountAutoexecHook(dstAutoexec);

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
    if (gameCfgDir.empty()) return false;

    std::error_code ec;
    fs::path cfgDir = fs::u8path(gameCfgDir);

    // 1. 修改 custom.cfg: 写入 Valve 基线预设
    auto writeValveCustom = [](const fs::path& customCfg) -> bool {
        std::error_code ec;
        if (!fs::exists(customCfg.parent_path(), ec)) {
            fs::create_directories(customCfg.parent_path(), ec);
        }

        if (fs::exists(customCfg, ec)) {
            fs::path bak = customCfg;
            bak += ".bak";
            fs::copy_file(customCfg, bak, fs::copy_options::overwrite_existing, ec);
        }

        std::ofstream out(customCfg, std::ios::out | std::ios::trunc);
        if (!out) return false;

        out << "// ─── SrP-CFG Preset Layer ───\n";
        out << "// Applied: Valve Baseline Default\n";
        out << "exec srp-cfg/valve/apply.cfg\n\n";
        out << "// ─── SrP-CFG User Layer ───\n";
        out << "// Add your personal habit overrides below:\n";
        return true;
    };

    bool ok = false;
    ok |= writeValveCustom(cfgDir / "srp-cfg" / "user" / "custom.cfg");
    writeValveCustom(cfgDir / "custom.cfg");

    // 2. 联动清理用户端的脏按键与脏变量缓存 (带 .bak 备份)
    if (!userCfgDir.empty()) {
        cleanAllKeybinds(userCfgDir);
        cleanAllConvars(userCfgDir);
    }

    return ok;
}

} // namespace srp::core
