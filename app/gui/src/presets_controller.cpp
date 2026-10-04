#include "presets_controller.h"
#include "cs2_cfg_highlighter.h"
#include "overview_controller.h"
#include "srp/core/preset.h"
#include "srp/core/actions.h"
#include "srp/core/detection.h"
#include "srp/core/i18n.h"

using srp::gui::OverviewController;

PresetsController* PresetsController::s_instance = nullptr;

PresetsController::PresetsController(QObject* parent)
    : QObject(parent) {
    s_instance = this;
    m_availableFiles = {
        QVariantMap{{QStringLiteral("label"), QStringLiteral("settings.cfg")}, {QStringLiteral("value"), QStringLiteral("settings.cfg")}},
        QVariantMap{{QStringLiteral("label"), QStringLiteral("keymap.cfg")}, {QStringLiteral("value"), QStringLiteral("keymap.cfg")}},
        QVariantMap{{QStringLiteral("label"), QStringLiteral("user/custom.cfg")}, {QStringLiteral("value"), QStringLiteral("user/custom.cfg")}}
    };

    refreshPresets();
    loadCurrentFileContent();
}

PresetsController::~PresetsController() {
    if (s_instance == this) {
        s_instance = nullptr;
    }
}

PresetsController* PresetsController::instance() {
    return s_instance;
}

std::string PresetsController::getEffectiveGameCfgDir() const {
    if (OverviewController::instance()) {
        std::string cfg = OverviewController::instance()->cfgPath().toStdString();
        if (!cfg.empty()) {
            return cfg;
        }
    }
    auto res = srp::core::detectAll();
    if (res.cs2CfgPath) {
        return *res.cs2CfgPath;
    }
    return "";
}

bool PresetsController::isSrpInstalled() const {
    if (OverviewController::instance()) {
        return OverviewController::instance()->isSrpInstalled();
    }
    return srp::core::isSrpInstalled(getEffectiveGameCfgDir());
}

QString PresetsController::currentLang() const {
    return OverviewController::instance() ? OverviewController::instance()->currentLang() : QStringLiteral("zh");
}

void PresetsController::refreshPresets() {
    std::string cfgDir = getEffectiveGameCfgDir();
    auto list = srp::core::scanPresets(cfgDir);
    m_activePresetId = QString::fromStdString(srp::core::getActivePresetId(cfgDir));

    QVariantList qlist;
    for (const auto& p : list) {
        QVariantMap map;
        map[QStringLiteral("id")] = QString::fromStdString(p.id);
        map[QStringLiteral("displayName")] = QString::fromStdString(p.displayName);
        map[QStringLiteral("command")] = QString::fromStdString(p.command);
        map[QStringLiteral("hasDiff")] = p.hasDiff;
        map[QStringLiteral("label")] = QString::fromStdString(p.displayName) + (p.hasDiff ? QStringLiteral(" (*)") : QStringLiteral(""));
        qlist.append(map);
    }

    m_availablePresets = qlist;
    emit presetsChanged();
    emit activePresetChanged();
    emit isPresetLoadedChanged();
}

void PresetsController::setSelectedPresetIndex(int index) {
    if (index >= 0 && index < m_availablePresets.size()) {
        m_selectedPresetIndex = index;
        emit selectedPresetChanged();
        emit isPresetLoadedChanged();
        emit currentFilePathDisplayChanged();
        loadCurrentFileContent();
    }
}

QString PresetsController::selectedPresetId() const {
    if (m_selectedPresetIndex >= 0 && m_selectedPresetIndex < m_availablePresets.size()) {
        return m_availablePresets[m_selectedPresetIndex].toMap().value(QStringLiteral("id")).toString();
    }
    return QStringLiteral("default");
}

QString PresetsController::selectedPresetName() const {
    if (m_selectedPresetIndex >= 0 && m_selectedPresetIndex < m_availablePresets.size()) {
        return m_availablePresets[m_selectedPresetIndex].toMap().value(QStringLiteral("displayName")).toString();
    }
    return QStringLiteral("Default");
}

QString PresetsController::selectedPresetCommand() const {
    if (m_selectedPresetIndex >= 0 && m_selectedPresetIndex < m_availablePresets.size()) {
        return m_availablePresets[m_selectedPresetIndex].toMap().value(QStringLiteral("command")).toString();
    }
    return QStringLiteral("srp_apply_default");
}

bool PresetsController::selectedPresetHasDiff() const {
    if (m_selectedPresetIndex >= 0 && m_selectedPresetIndex < m_availablePresets.size()) {
        return m_availablePresets[m_selectedPresetIndex].toMap().value(QStringLiteral("hasDiff")).toBool();
    }
    return false;
}

bool PresetsController::isPresetLoaded() const {
    return !m_activePresetId.isEmpty() && (selectedPresetId() == m_activePresetId);
}

void PresetsController::setSelectedFileIndex(int index) {
    if (index >= 0 && index < m_availableFiles.size()) {
        m_selectedFileIndex = index;
        emit selectedFileChanged();
        emit currentFilePathDisplayChanged();
        loadCurrentFileContent();
    }
}

QString PresetsController::selectedFileName() const {
    if (m_selectedFileIndex >= 0 && m_selectedFileIndex < m_availableFiles.size()) {
        return m_availableFiles[m_selectedFileIndex].toMap().value(QStringLiteral("value")).toString();
    }
    return QStringLiteral("settings.cfg");
}

QString PresetsController::currentFilePathDisplay() const {
    if (selectedFileName() == QStringLiteral("user/custom.cfg")) {
        return QStringLiteral("srp-cfg/user/custom.cfg");
    }
    return QStringLiteral("srp-cfg/presets/") + selectedPresetId() + QStringLiteral("/") + selectedFileName();
}

void PresetsController::loadCurrentFileContent() {
    std::string cfgDir = getEffectiveGameCfgDir();
    std::string text = srp::core::readPresetFile(
        selectedPresetId().toStdString(),
        selectedFileName().toStdString(),
        cfgDir
    );

    m_savedFileContent = QString::fromStdString(text);
    m_editorContent = m_savedFileContent;
    m_isEditorDirty = false;

    emit editorContentChanged();
    emit editorDirtyChanged();
}

void PresetsController::updateEditorContent(const QString& content) {
    m_editorContent = content;
    bool dirty = (m_editorContent != m_savedFileContent);
    if (dirty != m_isEditorDirty) {
        m_isEditorDirty = dirty;
        emit editorDirtyChanged();
    }
}

void PresetsController::reload() {
    refreshPresets();
    loadCurrentFileContent();
}

bool PresetsController::loadCurrentPreset() {
    std::string cfgDir = getEffectiveGameCfgDir();
    if (!isSrpInstalled()) {
        emit promptInstallSrp();
        return false;
    }

    bool success = srp::core::loadPreset(selectedPresetId().toStdString(), cfgDir);
    if (success) {
        m_activePresetId = selectedPresetId();
        emit activePresetChanged();
        emit isPresetLoadedChanged();
        emit messageNotify(true, tr("presets.load_notify"));
    } else {
        emit messageNotify(false, QStringLiteral("加载预设失败"));
    }
    return success;
}

bool PresetsController::unloadPreset() {
    std::string cfgDir = getEffectiveGameCfgDir();
    bool success = srp::core::unloadPreset(cfgDir);
    if (success) {
        m_activePresetId.clear();
        emit activePresetChanged();
        emit isPresetLoadedChanged();
        emit messageNotify(true, tr("presets.unload_notify"));
    } else {
        emit messageNotify(false, QStringLiteral("卸载预设失败"));
    }
    return success;
}

bool PresetsController::saveCurrentFile(const QString& content) {
    std::string cfgDir = getEffectiveGameCfgDir();
    bool success = srp::core::savePresetFile(
        selectedPresetId().toStdString(),
        selectedFileName().toStdString(),
        content.toStdString(),
        cfgDir
    );

    if (success) {
        m_savedFileContent = content;
        m_editorContent = content;
        m_isEditorDirty = false;
        emit editorDirtyChanged();
        refreshPresets();
        emit messageNotify(true, tr("presets.saved_notify"));
    } else {
        emit messageNotify(false, QStringLiteral("保存文件失败"));
    }
    return success;
}

bool PresetsController::resetCurrentFileToDefault() {
    std::string cfgDir = getEffectiveGameCfgDir();
    bool success = srp::core::resetPresetFileToDefault(
        selectedPresetId().toStdString(),
        selectedFileName().toStdString(),
        cfgDir
    );

    if (success) {
        loadCurrentFileContent();
        refreshPresets();
        emit messageNotify(true, tr("presets.reset_notify"));
    } else {
        emit messageNotify(false, QStringLiteral("恢复出厂默认失败"));
    }
    return success;
}

bool PresetsController::installSrpAndLoadCurrentPreset() {
    std::string cfgDir = getEffectiveGameCfgDir();
    if (!srp::core::installSrp(cfgDir)) {
        emit messageNotify(false, QStringLiteral("装配 SrP-CFG 失败"));
        return false;
    }

    if (OverviewController::instance()) {
        OverviewController::instance()->checkSrpInstalled();
    }
    emit srpInstalledChanged();

    return loadCurrentPreset();
}

void PresetsController::attachHighlighter(QQuickTextDocument* document, bool isDark) {
    if (!document) return;
    m_highlighter = std::make_unique<Cs2CfgHighlighter>(document->textDocument());
    m_highlighter->setDarkTheme(isDark);
}

void PresetsController::updateTheme(bool isDark) {
    if (m_highlighter) {
        m_highlighter->setDarkTheme(isDark);
    }
}

QString PresetsController::tr(const QString& key, const QString& /*langDependency*/) const {
    return QString::fromStdString(srp::core::tr(key.toStdString()));
}
