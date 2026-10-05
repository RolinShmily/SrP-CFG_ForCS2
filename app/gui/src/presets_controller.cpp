#include "presets_controller.h"
#include "cs2_cfg_highlighter.h"
#include "overview_controller.h"
#include "srp/core/preset.h"
#include "srp/core/actions.h"
#include "srp/core/detection.h"
#include "srp/core/i18n.h"
#include <QTextBlockFormat>
#include <QTextCursor>
#include <QFileSystemWatcher>
#include <QFile>
#include <QFileInfo>
#include <QDir>
#include <algorithm>

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

    m_fileWatcher = new QFileSystemWatcher(this);
    m_fileChangeTimer.setSingleShot(true);
    m_fileChangeTimer.setInterval(150);
    connect(m_fileWatcher, &QFileSystemWatcher::fileChanged, this, [this]() {
        m_fileChangeTimer.start();
    });
    // 原子保存会替换文件并移除文件监听；目录监听负责发现新文件并重新挂载。
    connect(m_fileWatcher, &QFileSystemWatcher::directoryChanged, this, [this]() {
        m_fileChangeTimer.start();
    });
    connect(&m_fileChangeTimer, &QTimer::timeout, this, &PresetsController::synchronizeCurrentFile);

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
    if (index >= 0 && index < m_availablePresets.size() && index != m_selectedPresetIndex) {
        if (m_isEditorDirty && selectedFileName() != QStringLiteral("user/custom.cfg")) {
            emit messageNotify(false, tr("presets.save_before_switch"));
            emit selectedPresetChanged();
            return;
        }
        m_selectedPresetIndex = index;
        emit selectedPresetChanged();
        emit isPresetLoadedChanged();
        emit currentFilePathDisplayChanged();
        // custom.cfg 为各预设共用，选择预设只改变待加载项，不重新读取用户文档。
        if (selectedFileName() != QStringLiteral("user/custom.cfg")) loadCurrentFileContent();
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

QString PresetsController::selectedPresetDescription() const {
    QString id = selectedPresetId();
    bool isZh = currentLang().startsWith(QStringLiteral("zh"));
    if (id == QStringLiteral("echo")) {
        return isZh ? QStringLiteral("进阶竞技偏好。灵敏度 1.10，包含全套按键别名优化与实战按键映射。")
                    : QStringLiteral("Advanced competitive preference. Sensitivity 1.10 with full alias optimizations.");
    }
    if (id == QStringLiteral("visionl")) {
        return isZh ? QStringLiteral("界面与视觉清晰度专项。极简 HUD 尺寸，雷达与队友标识高对比度调校。")
                    : QStringLiteral("Visual clarity tuned. Compact HUD with high-contrast radar and team markers.");
    }
    if (id == QStringLiteral("yszh")) {
        return isZh ? QStringLiteral("饮水致幻专属高敏激进配置。投掷物十字线秒放辅助与全局音频增强。")
                    : QStringLiteral("Aggressive high-sens config with instant grenade crosshair and audio boost.");
    }
    return isZh ? QStringLiteral("官方推荐标准平衡基线。包含狙击、投掷物准星、雷达视野及常用基础功能规范。")
                : QStringLiteral("Official recommended balanced baseline with crosshairs, radar and standard setup.");
}

QVariantList PresetsController::selectedPresetTags() const {
    QString id = selectedPresetId();
    if (id == QStringLiteral("echo")) {
        return {QStringLiteral("竞技偏好"), QStringLiteral("按键别名"), QStringLiteral("Sens 1.10")};
    }
    if (id == QStringLiteral("visionl")) {
        return {QStringLiteral("极简 HUD"), QStringLiteral("雷达高对比"), QStringLiteral("纯净视野")};
    }
    if (id == QStringLiteral("yszh")) {
        return {QStringLiteral("高敏激进"), QStringLiteral("音频细节"), QStringLiteral("秒放投掷")};
    }
    return {QStringLiteral("官方基线"), QStringLiteral("全能平衡"), QStringLiteral("准星/雷达")};
}

void PresetsController::setEditorFontSize(int size) {
    int clamped = std::clamp(size, 9, 28);
    if (m_editorFontSize != clamped) {
        m_editorFontSize = clamped;
        emit editorFontSizeChanged();
    }
}

void PresetsController::zoomIn() {
    setEditorFontSize(m_editorFontSize + 1);
}

void PresetsController::zoomOut() {
    setEditorFontSize(m_editorFontSize - 1);
}

void PresetsController::resetZoom() {
    setEditorFontSize(12);
}

void PresetsController::openPresetFolder() {
    std::string cfgDir = getEffectiveGameCfgDir();
    std::string path;
    if (selectedFileName() == QStringLiteral("user/custom.cfg")) {
        path = cfgDir.empty() ? (srp::core::findSourceConfigDir() + "/srp-cfg/user") : (cfgDir + "/srp-cfg/user");
    } else {
        path = cfgDir.empty() ? (srp::core::findSourceConfigDir() + "/srp-cfg/presets/" + selectedPresetId().toStdString())
                              : (cfgDir + "/srp-cfg/presets/" + selectedPresetId().toStdString());
    }
    srp::core::openFolderInExplorer(path);
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
    if (index >= 0 && index < m_availableFiles.size() && index != m_selectedFileIndex) {
        if (m_isEditorDirty) {
            emit messageNotify(false, tr("presets.save_before_switch"));
            emit selectedFileChanged();
            return;
        }
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

QString PresetsController::getCurrentAbsoluteFilePath() const {
    return QDir::cleanPath(QString::fromStdString(srp::core::resolvePresetFilePath(
        selectedPresetId().toStdString(), selectedFileName().toStdString(), getEffectiveGameCfgDir())));
}

void PresetsController::watchCurrentFile() {
    if (!m_fileWatcher->files().isEmpty()) m_fileWatcher->removePaths(m_fileWatcher->files());
    if (!m_fileWatcher->directories().isEmpty()) m_fileWatcher->removePaths(m_fileWatcher->directories());
    if (QFileInfo::exists(m_watchedFilePath)) m_fileWatcher->addPath(m_watchedFilePath);
    const QString directory = QFileInfo(m_watchedFilePath).absolutePath();
    if (QFileInfo::exists(directory)) m_fileWatcher->addPath(directory);
}

void PresetsController::synchronizeCurrentFile() {
    // 使用当前文档路径，文件替换期间不回退到出厂模板，也不处理旧文档的延迟事件。
    watchCurrentFile();
    QFile file(m_watchedFilePath);
    if (!file.open(QIODevice::ReadOnly)) return;
    const QByteArray bytes = file.readAll();
    if (file.error() != QFileDevice::NoError) return;
    const QString content = QString::fromUtf8(bytes);
    if (content == m_savedFileContent) return;

    if (m_isEditorDirty) {
        if (!m_externalChangeNotified) {
            m_externalChangeNotified = true;
            emit messageNotify(false, tr("presets.external_change_unsaved"));
        }
        return;
    }
    m_savedFileContent = content;
    m_editorContent = content;
    m_externalChangeNotified = false;
    emit editorContentChanged();
    refreshPresets();
}

bool PresetsController::canChangeCustomCfg() {
    if (selectedFileName() == QStringLiteral("user/custom.cfg") && m_isEditorDirty) {
        emit messageNotify(false, tr("presets.save_before_load"));
        return false;
    }
    return true;
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

    m_fileChangeTimer.stop();
    m_externalChangeNotified = false;
    m_watchedFilePath = getCurrentAbsoluteFilePath();
    watchCurrentFile();

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
    if (!canChangeCustomCfg()) return false;
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
        if (selectedFileName() == QStringLiteral("user/custom.cfg")) synchronizeCurrentFile();
        emit messageNotify(true, tr("presets.load_notify"));
    } else {
        emit messageNotify(false, QStringLiteral("加载预设失败"));
    }
    return success;
}

bool PresetsController::unloadPreset() {
    if (!canChangeCustomCfg()) return false;
    std::string cfgDir = getEffectiveGameCfgDir();
    bool success = srp::core::unloadPreset(cfgDir);
    if (success) {
        m_activePresetId.clear();
        emit activePresetChanged();
        emit isPresetLoadedChanged();
        if (selectedFileName() == QStringLiteral("user/custom.cfg")) synchronizeCurrentFile();
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
        m_externalChangeNotified = false;
        m_watchedFilePath = getCurrentAbsoluteFilePath();
        watchCurrentFile();
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
    if (!canChangeCustomCfg()) return false;
    std::string cfgDir = getEffectiveGameCfgDir();
    if (!srp::core::installSrp(cfgDir)) {
        emit messageNotify(false, QStringLiteral("装配 SrP-CFG 失败"));
        return false;
    }

    if (OverviewController::instance()) {
        OverviewController::instance()->checkSrpInstalled();
    }
    emit srpInstalledChanged();
    m_watchedFilePath = getCurrentAbsoluteFilePath();
    watchCurrentFile();

    return loadCurrentPreset();
}

void PresetsController::attachHighlighter(QQuickTextDocument* document, bool isDark) {
    if (!document) return;
    delete m_highlighter.data();
    // QTextDocument owns its highlighter; QPointer clears when the editor document is destroyed.
    m_highlighter = new Cs2CfgHighlighter(document->textDocument());
    m_highlighter->setDarkTheme(isDark);
}

void PresetsController::applyDocumentFormat() {
    // 保留空实现供 QML 调用，避免 ABI 破坏
}

void PresetsController::updateTheme(bool isDark) {
    if (m_highlighter) {
        m_highlighter->setDarkTheme(isDark);
    }
}

QString PresetsController::tr(const QString& key, const QString& /*langDependency*/) const {
    return QString::fromStdString(srp::core::tr(key.toStdString()));
}
