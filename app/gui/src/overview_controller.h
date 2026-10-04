#pragma once

#include <QObject>
#include <QString>
#include <QVariantList>
#include <QVariantMap>

namespace srp::gui {

class OverviewController : public QObject {
    Q_OBJECT

    Q_PROPERTY(QString steamPath READ steamPath NOTIFY detectionChanged)
    Q_PROPERTY(QString gamePath READ gamePath NOTIFY detectionChanged)
    Q_PROPERTY(QString cs2Version READ cs2Version NOTIFY detectionChanged)
    Q_PROPERTY(QString cs2Status READ cs2Status NOTIFY detectionChanged)
    Q_PROPERTY(QString cfgPath READ cfgPath NOTIFY detectionChanged)
    Q_PROPERTY(QString userCfgPath READ userCfgPath NOTIFY detectionChanged)
    Q_PROPERTY(QString currentUserName READ currentUserName NOTIFY accountChanged)
    Q_PROPERTY(QString currentAccountId READ currentAccountId NOTIFY accountChanged)
    Q_PROPERTY(QString currentUserAvatar READ currentUserAvatar NOTIFY accountChanged)
    Q_PROPERTY(QVariantList usersList READ usersList NOTIFY usersListChanged)
    Q_PROPERTY(int totalConvars READ totalConvars NOTIFY convarsChanged)
    Q_PROPERTY(int totalBindings READ totalBindings NOTIFY convarsChanged)
    Q_PROPERTY(bool isScanning READ isScanning NOTIFY isScanningChanged)
    Q_PROPERTY(bool isSrpInstalled READ isSrpInstalled NOTIFY srpInstallStateChanged)
    Q_PROPERTY(QString installedSrpVersion READ installedSrpVersion NOTIFY srpInstallStateChanged)
    Q_PROPERTY(QString sourceSrpVersion READ sourceSrpVersion NOTIFY srpInstallStateChanged)
    Q_PROPERTY(QString currentLang READ currentLang NOTIFY languageChanged)

public:
    explicit OverviewController(QObject* parent = nullptr);
    ~OverviewController() override = default;

    QString steamPath() const { return m_steamPath; }
    QString gamePath() const { return m_gamePath; }
    QString cs2Version() const { return m_cs2Version; }
    QString cs2Status() const { return m_cs2Status; }
    QString cfgPath() const { return m_cfgPath; }
    QString userCfgPath() const { return m_userCfgPath; }
    QString currentUserName() const { return m_currentUserName; }
    QString currentAccountId() const { return m_currentAccountId; }
    QString currentUserAvatar() const { return m_currentUserAvatar; }
    QVariantList usersList() const { return m_usersList; }
    int totalConvars() const { return m_totalConvars; }
    int totalBindings() const { return m_totalBindings; }
    bool isScanning() const { return m_isScanning; }
    bool isSrpInstalled() const { return m_isSrpInstalled; }
    QString installedSrpVersion() const { return m_installedSrpVersion; }
    QString sourceSrpVersion() const { return m_sourceSrpVersion; }
    QString currentLang() const { return m_currentLang; }

    Q_INVOKABLE void refresh();
    Q_INVOKABLE void redetectPaths();
    Q_INVOKABLE void reloadConvars();
    Q_INVOKABLE bool checkSrpInstalled();
    Q_INVOKABLE bool installSrp();
    Q_INVOKABLE bool uninstallSrp();
    Q_INVOKABLE void installAndResetValve();
    Q_INVOKABLE void switchAccount(const QString& accountId);
    Q_INVOKABLE void launchGame();
    Q_INVOKABLE void resetValveBaseline();
    Q_INVOKABLE void resetValveBaselineDirect();
    Q_INVOKABLE void openCfgFolder();
    Q_INVOKABLE void openUserFolder();
    Q_INVOKABLE void openPath(const QString& path);
    Q_INVOKABLE void setSteamPath(const QString& path);
    Q_INVOKABLE void setGamePath(const QString& path);
    Q_INVOKABLE void cleanAllConvars();
    Q_INVOKABLE void cleanAllKeybinds();
    Q_INVOKABLE void toggleLanguage();
    Q_INVOKABLE QString tr(const QString& key, const QString& langDependency = QString()) const;

signals:
    void detectionChanged();
    void accountChanged();
    void usersListChanged();
    void convarsChanged();
    void isScanningChanged();
    void srpInstallStateChanged();
    void promptInstallSrp();
    void languageChanged();
    void messageNotify(bool success, const QString& message);

private:
    void loadConvars();

    QString m_steamPath;
    QString m_gamePath;
    QString m_cs2Version;
    QString m_cs2Status = "NotInstalled";
    QString m_cfgPath;
    QString m_userCfgPath;
    QString m_currentUserName;
    QString m_currentAccountId;
    QString m_currentUserAvatar;
    QVariantList m_usersList;
    int m_totalConvars = 0;
    int m_totalBindings = 0;
    bool m_isScanning = false;
    bool m_isSrpInstalled = false;
    QString m_installedSrpVersion;
    QString m_sourceSrpVersion;
    QString m_currentLang = "zh";
};

} // namespace srp::gui
