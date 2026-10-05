#include "assembly_controller.h"
#include "overview_controller.h"
#include "cs2_cfg_highlighter.h"
#include "srp/core/assembly.h"
#include "srp/core/actions.h"
#include "srp/core/i18n.h"
#include <QDir>
#include <QFile>
#include <QFileInfo>
#include <QDebug>

using srp::gui::OverviewController;
namespace {
QStringList editorFiles() {
    QStringList result = {"user/custom.cfg", "valve/settings.cfg", "valve/keymap.cfg"};
    for (const auto& entry : srp::core::assemblyModules()) {
        const auto base = QString::fromStdString(entry.directory());
        result << base + "/settings.cfg" << base + "/keymap.cfg";
    }
    return result;
}
}
AssemblyController::AssemblyController(QObject* parent) : QObject(parent), m_filePaths(editorFiles()) {
    m_debounce.setSingleShot(true);
    m_debounce.setInterval(150);
    connect(&m_watcher, &QFileSystemWatcher::fileChanged, this, [this] { m_debounce.start(); });
    connect(&m_watcher, &QFileSystemWatcher::directoryChanged, this, [this] { m_debounce.start(); });
    connect(&m_debounce, &QTimer::timeout, this, &AssemblyController::synchronize);
    if (auto* overview = OverviewController::instance()) {
        connect(overview, &OverviewController::detectionChanged, this, &AssemblyController::refresh);
        connect(overview, &OverviewController::srpInstallStateChanged, this, &AssemblyController::refresh);
    }
    refresh();
}
QStringList AssemblyController::featureIds() const {
    QStringList ids; for (const auto& entry : srp::core::assemblyModules()) if (entry.category == "features") ids << QString::fromStdString(entry.id);
    return ids;
}
QStringList AssemblyController::modeIds() const {
    QStringList ids; for (const auto& entry : srp::core::assemblyModules()) if (entry.category == "modes") ids << QString::fromStdString(entry.id);
    return ids;
}
QString AssemblyController::cfgDir() const {
    return OverviewController::instance() ? OverviewController::instance()->cfgPath() : QString();
}
QString AssemblyController::relativeFile() const { return m_filePaths[m_index]; }
QString AssemblyController::currentFilePathDisplay() const { return "srp-cfg/" + relativeFile(); }
QString AssemblyController::translate(const char* key) const { return QString::fromStdString(srp::core::tr(key)); }
bool AssemblyController::canSave() const {
    return !m_busy && m_documentCfgDir == cfgDir() && srp::core::isSrpInstalled(cfgDir().toStdString());
}
QString AssemblyController::activePresetName() const {
    if (m_preset == "default") return "Default";
    if (m_preset == "echo") return "Echo";
    if (m_preset == "visionl") return "VisionL";
    if (m_preset == "yszh") return "Yszh";
    return m_preset;
}
void AssemblyController::updateState() {
    const auto state = srp::core::inspectValveAssembly(cfgDir().toStdString());
    m_settings = state.settings;
    m_keymap = state.keymap;
    m_preset = QString::fromStdString(state.activePresetId);
    m_files.clear();
    for (const auto& file : m_filePaths) {
        const bool changed = file != "user/custom.cfg" && srp::core::isAssemblyFileModified(file.toStdString(), cfgDir().toStdString());
        m_files.append(QVariantMap{{"label", file + (changed ? " (*)" : "")}, {"value", file}});
    }
    m_modules.clear();
    for (const auto& entry : srp::core::assemblyModules()) {
        const auto state = srp::core::inspectModuleAssembly(cfgDir().toStdString(), entry.id);
        QStringList keys;
        for (const auto& key : state.launchKeys) keys << QString::fromStdString(key);
        m_modules.append(QVariantMap{
            {"id", QString::fromStdString(entry.id)}, {"name", QString::fromStdString(entry.name)},
            {"category", QString::fromStdString(entry.category)}, {"directory", QString::fromStdString(entry.directory())},
            {"command", QString::fromStdString(entry.command)}, {"settings", state.settings}, {"keymap", state.keymap},
            {"launchKeys", keys}, {"legacyAutoLoad", state.legacyAutoLoad}});
    }
    emit filesChanged();
    emit selectedFileChanged();
    emit stateChanged();
}
void AssemblyController::watchFiles() {
    if (!m_watcher.files().isEmpty()) m_watcher.removePaths(m_watcher.files());
    if (!m_watcher.directories().isEmpty()) m_watcher.removePaths(m_watcher.directories());
    QStringList paths;
    for (const auto& file : m_filePaths) {
        const QString installed = cfgDir().isEmpty() ? QString() : cfgDir() + "/srp-cfg/" + file;
        const QString resolved = QString::fromStdString(srp::core::resolveAssemblyFilePath(file.toStdString(), cfgDir().toStdString()));
        for (const auto& path : {installed, resolved}) {
            if (path.isEmpty()) continue;
            if (QFileInfo(path).isFile()) paths.append(path);
            QString parent = QFileInfo(path).absolutePath();
            // Existing ancestor detects creation of previously absent installed directories.
            while (!QFileInfo(parent).isDir()) {
                const QString next = QFileInfo(parent).dir().absolutePath();
                if (next == parent) break;
                parent = next;
            }
            if (QFileInfo(parent).isDir()) paths.append(parent);
        }
    }
    if (!m_documentPath.isEmpty() && QFileInfo(m_documentPath).isFile()) paths.append(m_documentPath);
    paths.removeDuplicates();
    if (!paths.isEmpty()) m_watcher.addPaths(paths);
}
QString AssemblyController::editorText(const QByteArray& bytes) {
    m_hasBom = bytes.startsWith("\xEF\xBB\xBF");
    const QString raw = QString::fromUtf8(m_hasBom ? bytes.mid(3) : bytes);
    m_newline = raw.contains("\r\n") ? "\r\n" : "\n";
    QString text = raw;
    text.replace("\r\n", "\n");
    text.replace('\r', '\n');
    return text;
}
QString AssemblyController::fileText() const {
    QString text = m_content;
    if (m_newline == "\r\n") text.replace("\n", "\r\n");
    if (m_hasBom) text.prepend(QChar(0xfeff));
    return text;
}
void AssemblyController::loadDocument() {
    m_debounce.stop();
    m_documentCfgDir = cfgDir();
    m_documentPath = QString::fromStdString(srp::core::resolveAssemblyFilePath(relativeFile().toStdString(), cfgDir().toStdString()));
    const auto raw = srp::core::readAssemblyFile(relativeFile().toStdString(), cfgDir().toStdString());
    m_saved = editorText(QByteArray(raw.data(), static_cast<qsizetype>(raw.size())));
    m_content = m_saved;
    m_dirty = false;
    m_notified = false;
    watchFiles();
    emit editorContentChanged();
    emit editorDirtyChanged();
    emit selectedFileChanged();
    emit stateChanged();
}
void AssemblyController::refresh() {
    updateState();
    if (m_documentCfgDir != cfgDir()) {
        if (m_dirty) {
            emit messageNotify(false, translate("valve.path_changed_dirty"));
            watchFiles();
            return;
        }
        loadDocument();
    } else if (m_documentPath.isEmpty()) {
        loadDocument();
    } else {
        synchronize();
    }
}
void AssemblyController::synchronize() {
    updateState();
    watchFiles();
    // Pin the open document while external editors replace it; do not fall back to a factory copy.
    QFile file(m_documentPath);
    if (!file.open(QIODevice::ReadOnly)) return;
    const QByteArray bytes = file.readAll();
    if (file.error() != QFileDevice::NoError) return;
    QString text = QString::fromUtf8(bytes);
    if (text.startsWith(QChar(0xfeff))) text.remove(0, 1);
    text.replace("\r\n", "\n");
    text.replace('\r', '\n');
    if (text == m_saved) return;
    if (m_dirty) {
        if (!m_notified) {
            m_notified = true;
            emit messageNotify(false, translate("presets.external_change_unsaved"));
        }
        return;
    }
    m_saved = editorText(bytes);
    m_content = m_saved;
    m_notified = false;
    emit editorContentChanged();
}
bool AssemblyController::guardDraft() {
    if (!m_dirty) return true;
    emit messageNotify(false, translate("valve.save_first"));
    return false;
}
void AssemblyController::setSelectedFileIndex(int index) {
    if (m_busy || index < 0 || index >= m_filePaths.size() || index == m_index) return;
    if (!guardDraft()) { emit selectedFileChanged(); return; }
    m_index = index;
    loadDocument();
}
void AssemblyController::updateEditorContent(const QString& content) {
    m_content = content;
    const bool dirty = content != m_saved;
    if (m_dirty != dirty) { m_dirty = dirty; emit editorDirtyChanged(); }
}
bool AssemblyController::saveCurrentFile() {
    if (!canSave()) { emit messageNotify(false, translate("valve.save_unavailable")); return false; }
    const auto result = srp::core::saveAssemblyFile(relativeFile().toStdString(), fileText().toStdString(), cfgDir().toStdString());
    if (!result.success) {
        qWarning() << "Valve editor save failed:" << QString::fromStdString(result.error);
        emit messageNotify(false, translate("valve.write_failed"));
        return false;
    }
    loadDocument();
    updateState();
    emit messageNotify(true, translate(result.changed ? "valve.saved" : "valve.no_changes"));
    return true;
}
bool AssemblyController::resetCurrentFileToDefault() {
    if (m_index == 0 || !canSave()) return false;
    const auto result = srp::core::resetAssemblyFile(relativeFile().toStdString(), cfgDir().toStdString());
    if (!result.success) { emit messageNotify(false, translate("valve.restore_failed")); return false; }
    loadDocument();
    updateState();
    emit messageNotify(true, translate(result.changed ? "valve.restored" : "valve.no_changes"));
    return true;
}
bool AssemblyController::pendingValid() {
    if (!guardDraft() || m_busy) return false;
    if (m_pendingDir != cfgDir()) { emit messageNotify(false, translate("valve.path_changed")); return false; }
    return m_pending != Pending::Valve || m_pendingSettings || m_pendingKeys;
}
bool AssemblyController::openFile(const QString& relativePath) {
    const int index = m_filePaths.indexOf(relativePath);
    if (index < 0 || m_busy || (index != m_index && !guardDraft())) return false;
    setSelectedFileIndex(index);
    return m_index == index;
}
void AssemblyController::openModuleFolder(const QString& id) {
    for (const auto& entry : srp::core::assemblyModules()) {
        if (QString::fromStdString(entry.id) != id) continue;
        const QString path = QString::fromStdString(srp::core::resolveAssemblyFilePath(entry.directory() + "/settings.cfg", cfgDir().toStdString()));
        if (!srp::core::openFolderInExplorer(QFileInfo(path).absolutePath().toStdString()))
            emit messageNotify(false, translate("assembly.folder_failed"));
        return;
    }
}
void AssemblyController::requestFeature(const QString& id, bool keys, bool remove) {
    if (m_busy || !guardDraft()) return;
    if (cfgDir().isEmpty()) { emit messageNotify(false, translate("feedback.invalid_cfg_dir")); return; }
    m_pending = Pending::Feature; m_pendingModule = id; m_pendingKeys = keys;
    m_pendingDir = cfgDir(); m_removeModule = remove;
    if (!srp::core::isSrpInstalled(cfgDir().toStdString())) {
        if (!remove) emit promptInstallSrp();
        else emit messageNotify(false, translate("valve.write_failed"));
        return;
    }
    runModule();
}
void AssemblyController::requestMode(const QString& id, const QString& key, bool keys, bool remove) {
    if (m_busy || !guardDraft()) return;
    if (cfgDir().isEmpty()) { emit messageNotify(false, translate("feedback.invalid_cfg_dir")); return; }
    m_pending = Pending::Mode; m_pendingModule = id; m_pendingKey = key.trimmed().toLower();
    m_pendingKeys = keys; m_pendingDir = cfgDir(); m_removeModule = remove;
    if (!remove && !srp::core::isValidLaunchKey(m_pendingKey.toStdString())) {
        emit messageNotify(false, translate("assembly.invalid_key")); return;
    }
    if (!srp::core::isSrpInstalled(cfgDir().toStdString())) {
        if (!remove) emit promptInstallSrp();
        else emit messageNotify(false, translate("valve.write_failed"));
        return;
    }
    runModule();
}
void AssemblyController::runModule() {
    if (!pendingValid()) return;
    if (m_pending == Pending::Mode && !m_removeModule) {
        m_bindingPlan = srp::core::planModeBinding(cfgDir().toStdString(), m_pendingModule.toStdString(), m_pendingKey.toStdString(), m_pendingKeys);
        if (!m_bindingPlan.success) {
            emit messageNotify(false, translate(m_bindingPlan.error.c_str())); return;
        }
        if (m_bindingPlan.needsConfirmation) {
            emit promptBindingConflict(m_pendingKey, QString::fromStdString(m_bindingPlan.previousCommand), QString::fromStdString(m_bindingPlan.newCommand));
            return;
        }
        confirmBinding();
        return;
    }
    m_busy = true; emit busyChanged(); emit stateChanged();
    QTimer::singleShot(0, this, [this] {
        const auto dir = m_pendingDir.toStdString(), id = m_pendingModule.toStdString();
        const auto result = m_pending == Pending::Mode ? srp::core::removeModeBinding(dir, id)
            : m_removeModule ? srp::core::unloadFeature(dir, id) : srp::core::assembleFeature(dir, id, m_pendingKeys);
        completeModule(result);
    });
}
void AssemblyController::confirmBinding() {
    if (!pendingValid() || m_pending != Pending::Mode) return;
    m_busy = true; emit busyChanged(); emit stateChanged();
    QTimer::singleShot(0, this, [this] {
        completeModule(srp::core::applyModeBinding(m_pendingDir.toStdString(), m_bindingPlan, true));
    });
}
void AssemblyController::completeModule(const srp::core::ConfigWriteResult& result) {
    m_busy = false; emit busyChanged(); emit stateChanged();
    if (!result.success) {
        qWarning() << "Assembly operation failed:" << QString::fromStdString(result.error);
        emit messageNotify(false, translate(result.error.rfind("assembly.", 0) == 0 ? result.error.c_str() : "valve.write_failed"));
        return;
    }
    m_index = 0; loadDocument(); updateState(); emit actionCompleted();
    emit messageNotify(true, translate(!result.changed ? "valve.no_changes" : m_pending == Pending::Mode
        ? (m_removeModule ? "assembly.mode_removed" : "assembly.mode_bound")
        : (m_removeModule ? "assembly.feature_removed" : "assembly.feature_added")));
}
void AssemblyController::requestAssemble(bool settings, bool keymap) {
    if (m_busy || (!settings && !keymap) || !guardDraft()) return;
    if (cfgDir().isEmpty()) { emit messageNotify(false, translate("feedback.invalid_cfg_dir")); return; }
    m_pending = Pending::Valve;
    m_pendingSettings = settings;
    m_pendingKeys = keymap;
    m_pendingDir = cfgDir();
    updateState();
    m_confirmedPreset.clear();
    if (!srp::core::isSrpInstalled(cfgDir().toStdString())) { emit promptInstallSrp(); return; }
    if (!m_preset.isEmpty()) {
        m_confirmedPreset = m_preset;
        emit promptReplacePreset(activePresetName(), settings && keymap ? translate("valve.settings_and_keys") : translate(settings ? "valve.settings" : "valve.keymap"));
        return;
    }
    runAssembly(true);
}
void AssemblyController::confirmAssemble() {
    if (!pendingValid() || m_pending != Pending::Valve) return;
    updateState();
    if (!srp::core::isSrpInstalled(cfgDir().toStdString())) { emit promptInstallSrp(); return; }
    if (!m_preset.isEmpty() && m_preset != m_confirmedPreset) {
        m_confirmedPreset = m_preset;
        emit promptReplacePreset(activePresetName(), m_pendingSettings && m_pendingKeys ? translate("valve.settings_and_keys") : translate(m_pendingSettings ? "valve.settings" : "valve.keymap"));
        return;
    }
    runAssembly(true);
}
void AssemblyController::installAndAssemble() {
    if (!pendingValid()) return;
    if (!srp::core::installSrp(cfgDir().toStdString())) { emit messageNotify(false, translate("feedback.install_srp_failed")); return; }
    if (auto* overview = OverviewController::instance()) overview->checkSrpInstalled();
    refresh();
    if (m_pending == Pending::Valve) confirmAssemble();
    else runModule();
}
void AssemblyController::requestUnload(bool settings, bool keymap) {
    if (m_busy || (!settings && !keymap) || !guardDraft()) return;
    m_pending = Pending::Valve;
    m_pendingSettings = settings;
    m_pendingKeys = keymap;
    m_pendingDir = cfgDir();
    runAssembly(false);
}
void AssemblyController::runAssembly(bool add) {
    if (!pendingValid()) return;
    m_busy = true;
    emit busyChanged();
    emit stateChanged();
    QTimer::singleShot(0, this, [this, add] {
        const auto dir = m_pendingDir.toStdString();
        const auto result = add ? srp::core::assembleValve(dir, m_pendingSettings, m_pendingKeys)
                                : srp::core::disassembleValve(dir, m_pendingSettings, m_pendingKeys);
        m_busy = false;
        emit busyChanged();
        if (!result.success) {
            qWarning() << "Valve configuration write failed:" << QString::fromStdString(result.error);
            emit stateChanged();
            emit messageNotify(false, translate("valve.write_failed"));
            return;
        }
        m_index = 0;
        loadDocument();
        updateState();
        emit actionCompleted();
        emit messageNotify(true, translate(!result.changed ? "valve.no_changes" : add ? "valve.assembled" : "valve.unloaded"));
    });
}
void AssemblyController::attachHighlighter(QQuickTextDocument* document, bool dark) {
    if (!document) return;
    delete m_highlighter.data();
    m_highlighter = new Cs2CfgHighlighter(document->textDocument());
    m_highlighter->setDarkTheme(dark);
}
void AssemblyController::updateTheme(bool dark) {
    if (m_highlighter) m_highlighter->setDarkTheme(dark);
}
