#include "overview_controller.h"
#include "srp/core/detection.h"
#include "srp/core/vcfg.h"
#include "srp/core/actions.h"
#include "srp/core/i18n.h"
#include <QUrl>

namespace srp::gui {

OverviewController::OverviewController(QObject* parent)
    : QObject(parent) {
    m_currentLang = (srp::core::currentLanguage() == srp::core::Language::ZhCN) ? "zh" : "en";
    refresh();
}

void OverviewController::refresh() {
    m_isScanning = true;
    emit isScanningChanged();

    auto res = srp::core::detectAll();

    m_steamPath = res.steamPath ? QString::fromStdString(*res.steamPath) : QString();
    m_gamePath = res.cs2InstallDir ? QString::fromStdString(*res.cs2InstallDir) : QString();
    m_cs2Version = res.cs2Version ? QString::fromStdString(*res.cs2Version) : QString();
    m_cfgPath = res.cs2CfgPath ? QString::fromStdString(*res.cs2CfgPath) : QString();
    m_userCfgPath = res.userCfgPath ? QString::fromStdString(*res.userCfgPath) : QString();

    switch (res.cs2InstallState) {
        case srp::core::Cs2InstallState::Installed:
            m_cs2Status = "Installed";
            break;
        case srp::core::Cs2InstallState::NeedsUpdate:
            m_cs2Status = "NeedsUpdate";
            break;
        case srp::core::Cs2InstallState::NotInstalled:
            m_cs2Status = "NotInstalled";
            break;
    }

    m_usersList.clear();
    for (const auto& u : res.steamUsers) {
        QVariantMap map;
        map["name"] = QString::fromStdString(u.personaName.value_or(u.accountId));
        map["accountId"] = QString::fromStdString(u.accountId);
        map["steamId64"] = QString::fromStdString(u.steamId64);
        map["avatar"] = u.avatarPath.empty() ? QString() : QUrl::fromLocalFile(QString::fromStdString(u.avatarPath)).toString();
        m_usersList.append(map);
    }
    emit usersListChanged();

    if (res.currentUser) {
        m_currentUserName = QString::fromStdString(res.currentUser->personaName.value_or(res.currentUser->accountId));
        m_currentAccountId = QString::fromStdString(res.currentUser->accountId);
        m_currentUserAvatar = res.currentUser->avatarPath.empty() ? QString() : QUrl::fromLocalFile(QString::fromStdString(res.currentUser->avatarPath)).toString();
    } else if (!res.steamUsers.empty()) {
        m_currentUserName = QString::fromStdString(res.steamUsers[0].personaName.value_or(res.steamUsers[0].accountId));
        m_currentAccountId = QString::fromStdString(res.steamUsers[0].accountId);
        m_currentUserAvatar = res.steamUsers[0].avatarPath.empty() ? QString() : QUrl::fromLocalFile(QString::fromStdString(res.steamUsers[0].avatarPath)).toString();
    } else {
        m_currentUserName.clear();
        m_currentAccountId.clear();
        m_currentUserAvatar.clear();
    }
    emit accountChanged();

    emit detectionChanged();
    checkSrpInstalled();
    loadConvars();

    m_isScanning = false;
    emit isScanningChanged();
}

void OverviewController::redetectPaths() {
    auto res = srp::core::detectAll();
    m_steamPath = res.steamPath ? QString::fromStdString(*res.steamPath) : QString();
    m_gamePath = res.cs2InstallDir ? QString::fromStdString(*res.cs2InstallDir) : QString();
    m_cfgPath = res.cs2CfgPath ? QString::fromStdString(*res.cs2CfgPath) : QString();
    m_cs2Version = res.cs2Version ? QString::fromStdString(*res.cs2Version) : QString();
    m_cs2Status = res.cs2InstallState == srp::core::Cs2InstallState::Installed ? "Installed" : "NotInstalled";

    emit detectionChanged();
    checkSrpInstalled();
    emit messageNotify(true, QString::fromStdString(srp::core::tr("feedback.path_detect_done")));
}

bool OverviewController::checkSrpInstalled() {
    bool installed = !m_cfgPath.isEmpty() && srp::core::isSrpInstalled(m_cfgPath.toStdString());
    m_sourceSrpVersion = QString::fromStdString(srp::core::getSourceSrpVersion());
    m_installedSrpVersion = installed ? QString::fromStdString(srp::core::getInstalledSrpVersion(m_cfgPath.toStdString())) : QString();
    if (m_isSrpInstalled != installed) {
        m_isSrpInstalled = installed;
    }
    emit srpInstallStateChanged();
    return m_isSrpInstalled;
}

bool OverviewController::installSrp() {
    if (m_cfgPath.isEmpty()) {
        emit messageNotify(false, QString::fromStdString(srp::core::tr("feedback.invalid_cfg_dir")));
        return false;
    }
    bool ok = srp::core::installSrp(m_cfgPath.toStdString());
    checkSrpInstalled();
    if (ok) {
        emit messageNotify(true, QString::fromStdString(srp::core::tr("feedback.install_srp_success")));
    } else {
        emit messageNotify(false, QString::fromStdString(srp::core::tr("feedback.install_srp_failed")));
    }
    return ok;
}

bool OverviewController::uninstallSrp() {
    if (m_cfgPath.isEmpty()) return false;
    bool ok = srp::core::uninstallSrp(m_cfgPath.toStdString());
    checkSrpInstalled();
    loadConvars();
    if (ok) {
        emit messageNotify(true, QString::fromStdString(srp::core::tr("feedback.uninstall_srp_success")));
    } else {
        emit messageNotify(false, QString::fromStdString(srp::core::tr("feedback.uninstall_srp_failed")));
    }
    return ok;
}

void OverviewController::installAndResetValve() {
    if (installSrp()) {
        resetValveBaseline();
    }
}

void OverviewController::reloadConvars() {
    loadConvars();
    emit messageNotify(true, QStringLiteral("Convars 状态已刷新"));
}

void OverviewController::switchAccount(const QString& accountId) {
    if (accountId.isEmpty() || accountId == m_currentAccountId) {
        return;
    }

    for (const auto& var : m_usersList) {
        auto map = var.toMap();
        if (map["accountId"].toString() == accountId) {
            m_currentAccountId = accountId;
            m_currentUserName = map["name"].toString();
            m_currentUserAvatar = map["avatar"].toString();
            break;
        }
    }

    if (!m_steamPath.isEmpty()) {
        auto newPath = srp::core::detectUserCfgPath(m_steamPath.toStdString(), accountId.toStdString());
        m_userCfgPath = newPath ? QString::fromStdString(*newPath) : QString();
    }

    emit accountChanged();
    emit detectionChanged();
    loadConvars();

    emit messageNotify(true, QString::fromStdString(srp::core::tr("feedback.account_switched")) + m_currentUserName);
}

void OverviewController::loadConvars() {
    if (m_userCfgPath.isEmpty()) {
        m_totalConvars = 0;
        m_totalBindings = 0;
    } else {
        auto summary = srp::core::inspectConvars(m_userCfgPath.toStdString());
        m_totalConvars = static_cast<int>(summary.totalCount);
        m_totalBindings = static_cast<int>(summary.totalBindings);
    }
    emit convarsChanged();
}

void OverviewController::launchGame() {
    bool ok = srp::core::launchCs2();
    if (ok) {
        emit messageNotify(true, QString::fromStdString(srp::core::tr("feedback.launch_success")));
    } else {
        emit messageNotify(false, QString::fromStdString(srp::core::tr("feedback.launch_failed")));
    }
}

void OverviewController::resetValveBaseline() {
    if (!checkSrpInstalled()) {
        emit promptInstallSrp();
        return;
    }
    resetValveBaselineDirect();
}

void OverviewController::resetValveBaselineDirect() {
    bool ok = srp::core::resetValveBaseline(m_cfgPath.toStdString(), m_userCfgPath.toStdString());
    if (ok) {
        loadConvars();
        emit messageNotify(true, QString::fromStdString(srp::core::tr("feedback.reset_success")));
    } else {
        emit messageNotify(false, "Failed to apply Valve Baseline.");
    }
}

void OverviewController::openCfgFolder() {
    if (m_cfgPath.isEmpty()) {
        emit messageNotify(false, QString::fromStdString(srp::core::tr("feedback.open_folder_failed")));
        return;
    }
    openPath(m_cfgPath);
}

void OverviewController::openUserFolder() {
    if (m_userCfgPath.isEmpty()) {
        emit messageNotify(false, QString::fromStdString(srp::core::tr("feedback.open_folder_failed")));
        return;
    }
    openPath(m_userCfgPath);
}

void OverviewController::openPath(const QString& path) {
    if (path.isEmpty()) return;
    srp::core::openFolderInExplorer(path.toStdString());
}

void OverviewController::setSteamPath(const QString& path) {
    QString clean = path;
    if (clean.startsWith("file:///")) {
        clean = QUrl(clean).toLocalFile();
    }
    if (clean.endsWith('/') || clean.endsWith('\\')) {
        clean.chop(1);
    }
    m_steamPath = clean;
    emit detectionChanged();
    refresh();
    emit messageNotify(true, QString::fromStdString(srp::core::tr("feedback.steam_path_updated")) + clean);
}

void OverviewController::setGamePath(const QString& path) {
    QString clean = path;
    if (clean.startsWith("file:///")) {
        clean = QUrl(clean).toLocalFile();
    }
    if (clean.endsWith('/') || clean.endsWith('\\')) {
        clean.chop(1);
    }
    m_gamePath = clean;
    m_cfgPath = clean + "/game/csgo/cfg";
    m_cs2Status = "Installed";
    emit detectionChanged();
    checkSrpInstalled();
    loadConvars();
    emit messageNotify(true, QString::fromStdString(srp::core::tr("feedback.game_path_updated")) + clean);
}

void OverviewController::cleanAllConvars() {
    if (m_userCfgPath.isEmpty()) {
        emit messageNotify(false, QString::fromStdString(srp::core::tr("feedback.open_folder_failed")));
        return;
    }
    bool ok = srp::core::cleanAllConvars(m_userCfgPath.toStdString());
    if (ok) {
        loadConvars();
        emit messageNotify(true, QString::fromStdString(srp::core::tr("feedback.clean_all_success")));
    } else {
        emit messageNotify(false, "Failed to clear convars.");
    }
}

void OverviewController::cleanAllKeybinds() {
    if (m_userCfgPath.isEmpty()) {
        emit messageNotify(false, QString::fromStdString(srp::core::tr("feedback.open_folder_failed")));
        return;
    }
    bool ok = srp::core::cleanAllKeybinds(m_userCfgPath.toStdString());
    if (ok) {
        loadConvars();
        emit messageNotify(true, QString::fromStdString(srp::core::tr("feedback.clean_keybinds_success")));
    } else {
        emit messageNotify(false, "Failed to clear keybinds.");
    }
}

void OverviewController::toggleLanguage() {
    if (m_currentLang == "zh") {
        m_currentLang = "en";
        srp::core::setLanguage(srp::core::Language::EnUS);
    } else {
        m_currentLang = "zh";
        srp::core::setLanguage(srp::core::Language::ZhCN);
    }
    emit languageChanged();
}

QString OverviewController::tr(const QString& key, const QString& langDependency) const {
    Q_UNUSED(langDependency);
    return QString::fromStdString(srp::core::tr(key.toStdString()));
}

} // namespace srp::gui
