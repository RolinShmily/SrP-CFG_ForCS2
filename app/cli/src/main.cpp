#include "srp/core/detection.h"
#include "srp/core/i18n.h"

#include <iostream>

#if defined(_WIN32)
#include <windows.h>
#endif

int main(int argc, char* argv[]) {
#if defined(_WIN32)
    SetConsoleOutputCP(CP_UTF8);
#endif

    bool useEnglish = false;
    for (int i = 1; i < argc; ++i) {
        std::string_view arg(argv[i]);
        if (arg == "--en" || arg == "--english") {
            useEnglish = true;
        }
    }

    srp::core::setLanguage(useEnglish ? srp::core::Language::EnUS : srp::core::Language::ZhCN);

    std::cout << "========================================\n";
    std::cout << "   SrP-CFG Environment Diagnostics (C++)\n";
    std::cout << "========================================\n\n";

    auto res = srp::core::detectAll();

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
    }

    std::cout << "\n[✓] " << srp::core::tr("detect.complete") << "\n";
    return 0;
}
