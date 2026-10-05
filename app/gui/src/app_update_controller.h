#pragma once
#include <QObject>
#include <QFutureWatcher>
#include <functional>
#include "srp/core/app_update.h"
class AppUpdateController : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString version READ version CONSTANT)
    Q_PROPERTY(bool busy READ busy NOTIFY stateChanged)
    Q_PROPERTY(QString status READ status NOTIFY stateChanged)
    Q_PROPERTY(QString latestVersion READ latestVersion NOTIFY stateChanged)
    Q_PROPERTY(QString releaseNotes READ releaseNotes NOTIFY stateChanged)
    Q_PROPERTY(bool updateAvailable READ updateAvailable NOTIFY stateChanged)
    Q_PROPERTY(QString website READ website CONSTANT)
    Q_PROPERTY(QString blog READ blog CONSTANT)
    Q_PROPERTY(QString project READ project CONSTANT)
    Q_PROPERTY(QString releases READ releases CONSTANT)
public:
    explicit AppUpdateController(QObject* parent=nullptr, std::function<srp::core::AppUpdateResult()> checker=srp::core::checkAppUpdate);
    QString version() const {return QString::fromStdString(srp::core::applicationVersion());}
    bool busy() const {return m_watcher.isRunning();}
    QString status() const;
    QString latestVersion() const {return QString::fromStdString(m_result.release.version);}
    QString releaseNotes() const;
    bool updateAvailable() const {return m_result.success&&m_result.updateAvailable;}
    QString website() const {return QString::fromStdString(srp::core::websiteUrl());}
    QString blog() const {return QString::fromStdString(srp::core::blogUrl());}
    QString project() const {return QString::fromStdString(srp::core::projectUrl());}
    QString releases() const {return QString::fromStdString(srp::core::releasesUrl());}
    Q_INVOKABLE void check();
    Q_INVOKABLE void openLink(const QString& kind);
signals:
    void stateChanged();
    void messageNotify(bool success,const QString& text);
private:
    std::function<srp::core::AppUpdateResult()> m_checker;
    bool m_checked=false;
    srp::core::AppUpdateResult m_result;
    QFutureWatcher<srp::core::AppUpdateResult> m_watcher;
};
