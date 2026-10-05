#pragma once
#include <QObject>
#include <QVariantList>
#include <QFutureWatcher>
#include "srp/core/packages.h"
class PackageController : public QObject {
    Q_OBJECT
    Q_PROPERTY(QVariantList packages READ packages NOTIFY stateChanged)
    Q_PROPERTY(bool busy READ busy NOTIFY stateChanged)
    Q_PROPERTY(QString status READ status NOTIFY stateChanged)
public:
    explicit PackageController(QObject* parent = nullptr);
    ~PackageController() override;
    static PackageController* instance();
    QVariantList packages() const { return m_packages; }
    bool busy() const { return m_busy; }
    QString status() const { return m_status; }
    Q_INVOKABLE void checkUpdates();
    Q_INVOKABLE void updatePackage(const QString& id);
    void refresh();
signals:
    void stateChanged();
    void packageChanged(const QString& id);
    void messageNotify(bool success, const QString& message);
private:
    struct Result { srp::core::ConfigWriteResult operation; std::vector<srp::core::ConfigPackage> latest; };
    QVariantList m_packages;
    std::vector<srp::core::ConfigPackage> m_latest;
    QFutureWatcher<Result> m_future;
    bool m_busy = false;
    QString m_status, m_pendingId;
};
