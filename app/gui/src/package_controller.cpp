#include "package_controller.h"
#include "overview_controller.h"
#include "srp/core/i18n.h"
#include <QtConcurrentRun>
namespace { PackageController* currentController = nullptr; QString translated(const char* key) { return QString::fromStdString(srp::core::tr(key)); } }
PackageController* PackageController::instance() { return currentController; }
PackageController::PackageController(QObject* parent) : QObject(parent) {
    currentController = this;
    const auto initialized = srp::core::initializePackages();
    if (!initialized.success) m_status = QString::fromStdString(initialized.error);
    connect(&m_future, &QFutureWatcher<Result>::finished, this, [this] {
        const auto result = m_future.result(); m_busy = false;
        if (result.operation.success) {
            m_latest = result.latest; m_status.clear();
            const QString id = m_pendingId; m_pendingId.clear();
            refresh(); if (!id.isEmpty()) emit packageChanged(id);
            emit messageNotify(true, translated(id.isEmpty() ? "pkg.checked" : result.operation.changed ? "pkg.updated" : "pkg.current"));
        } else {
            m_status = QString::fromStdString(result.operation.error); refresh();
            emit messageNotify(false, translated(result.operation.error.c_str()));
        }
    });
    if (auto* overview = srp::gui::OverviewController::instance()) connect(overview, &srp::gui::OverviewController::languageChanged, this, &PackageController::refresh);
    refresh();
}
PackageController::~PackageController() { m_future.waitForFinished(); if (currentController == this) currentController = nullptr; }
void PackageController::refresh() {
    m_packages.clear();
    for (const std::string id : {"srp-cfg","video","annotations"}) {
        const auto local = srp::core::packageVersion(id); std::string remote, remoteHash;
        for (const auto& item : m_latest) if (item.id == id) { remote = item.version; remoteHash = item.sha256; }
        m_packages.append(QVariantMap{{"id",QString::fromStdString(id)},{"version",QString::fromStdString(local)},
            {"latest",QString::fromStdString(remote)},{"updateAvailable",!remote.empty() && (remote != local || remoteHash != srp::core::packageDigest(id))}});
    }
    emit stateChanged();
}
void PackageController::checkUpdates() {
    if (m_busy) return; m_busy = true; m_pendingId.clear(); emit stateChanged();
    m_future.setFuture(QtConcurrent::run([] { Result result; result.operation = srp::core::checkPackageUpdates(result.latest); return result; }));
}
void PackageController::updatePackage(const QString& id) {
    if (m_busy || (id != "srp-cfg" && id != "video" && id != "annotations")) return;
    m_busy = true; m_pendingId = id; emit stateChanged();
    const auto knownLatest = m_latest;
    m_future.setFuture(QtConcurrent::run([id, knownLatest] {
        Result result; result.operation = srp::core::updatePackage(id.toStdString());
        result.latest = knownLatest;
        return result;
    }));
}
