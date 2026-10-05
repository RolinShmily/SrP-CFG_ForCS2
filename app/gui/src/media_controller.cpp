#include "media_controller.h"
#include "package_controller.h"
#include "overview_controller.h"
#include "cs2_cfg_highlighter.h"
#include "srp/core/packages.h"
#include "srp/core/media_config.h"
#include "srp/core/i18n.h"
#include <QFile>
#include <QFileInfo>
#include <QDir>
using srp::gui::OverviewController;
namespace { QString trKey(const std::string& key) { return QString::fromStdString(srp::core::tr(key)); } }
MediaController::MediaController(bool video, QObject* parent) : QObject(parent), m_video(video) {
    m_debounce.setSingleShot(true); m_debounce.setInterval(180);
    connect(&m_watcher,&QFileSystemWatcher::fileChanged,this,[this]{m_debounce.start();});
    connect(&m_watcher,&QFileSystemWatcher::directoryChanged,this,[this]{m_debounce.start();});
    connect(&m_debounce,&QTimer::timeout,this,&MediaController::refresh);
    if (auto* packages = PackageController::instance()) connect(packages,&PackageController::packageChanged,this,[this](const QString&){refresh();});
    if (auto* overview = OverviewController::instance()) {
        connect(overview,&OverviewController::detectionChanged,this,&MediaController::refresh);
        connect(overview,&OverviewController::accountChanged,this,[this]{emit stateChanged();});
        connect(overview,&OverviewController::languageChanged,this,[this]{emit stateChanged();});
    }
    refreshCatalog();
    load();
}
QStringList MediaController::guideIds() const { QStringList ids; for (const auto& e : m_guides) ids << QString::fromStdString(e.id); return ids; }
void MediaController::refreshCatalog() {
    if (m_video) return;
    const auto previousIds = guideIds();
    const std::string selected = m_index < static_cast<int>(m_guides.size()) ? m_guides[m_index].id : std::string();
    auto next = srp::core::annotationGuides();
    if (isEditorDirty() && m_index < static_cast<int>(m_guides.size())) {
        auto existing = std::find_if(next.begin(),next.end(),[&](const auto& e){return e.id==selected;});
        if (existing == next.end()) next.push_back(m_guides[m_index]);
        else *existing = m_guides[m_index];
    }
    m_guides = std::move(next); m_index = 0;
    for (int i=0;i<static_cast<int>(m_guides.size());++i) if(m_guides[i].id==selected)m_index=i;
    if (previousIds != guideIds()) emit catalogChanged();
}
QString MediaController::packageId() const { return m_video ? "video" : "annotations"; }
QString MediaController::relativeFile() const { return m_video ? "cs2_video.txt" : (m_index < static_cast<int>(m_guides.size()) ? QString::fromStdString(m_guides[m_index].relativeFile()) : QString()); }
QString MediaController::currentFilePathDisplay() const { return packageId()+"/"+relativeFile(); }
QString MediaController::annotationDirectory() const {
    auto* overview = OverviewController::instance(); if (!overview || overview->gamePath().isEmpty()) return {};
    return overview->gamePath()+"/game/csgo/annotations/local";
}
void MediaController::watch() {
    if (!m_watcher.files().isEmpty()) m_watcher.removePaths(m_watcher.files());
    if (!m_watcher.directories().isEmpty()) m_watcher.removePaths(m_watcher.directories());
    if (QFileInfo(m_path).isFile()) m_watcher.addPath(m_path);
    const QString parent = QFileInfo(m_path).absolutePath(); if (QFileInfo(parent).isDir()) m_watcher.addPath(parent);
}
void MediaController::load() {
    m_path = QString::fromStdString(srp::core::packageFilePath(packageId().toStdString(),relativeFile().toStdString()));
    QFile file(m_path); QByteArray bytes; if (file.open(QIODevice::ReadOnly)) bytes = file.readAll();
    const QString previous = m_content;
    m_externalConflict = false;
    m_bom = bytes.startsWith("\xEF\xBB\xBF"); m_content = QString::fromUtf8(m_bom ? bytes.mid(3) : bytes);
    m_newline = m_content.contains("\r\n") ? "\r\n" : "\n"; m_content.replace("\r\n","\n");
    m_saved = m_content;
    m_baseContent = srp::core::packageFileBaseline(packageId().toStdString(),relativeFile().toStdString());
    m_baseVersion = srp::core::inspectPackageFile(packageId().toStdString(),relativeFile().toStdString()).baseVersion;
    watch(); if (m_content != previous) emit editorContentChanged(); emit stateChanged();
}
void MediaController::refresh() {
    refreshCatalog();
    if (!isEditorDirty()) { load(); return; }
    // Keep unsaved editor state across generation promotion and external replacements.
    QFile source(m_path);
    if (source.open(QIODevice::ReadOnly)) {
        QString external = QString::fromUtf8(source.readAll());
        if (external.startsWith(QChar(0xfeff))) external.remove(0,1);
        external.replace("\r\n","\n");
        if (external != m_saved && !m_externalConflict) { m_externalConflict = true; report(false,"presets.external_change_unsaved"); }
    }
    watch(); emit stateChanged();
}
QString MediaController::validationError() const {
    if (m_video) { const auto p = srp::core::parseVideoConfig(m_content.toStdString()); return p.success ? QString() : trKey(p.error); }
    return m_index < static_cast<int>(m_guides.size()) && srp::core::validateAnnotation(m_content.toStdString(),m_guides[m_index].id) ? QString() : trKey("annotations.invalid");
}
QVariantList MediaController::availableFiles() const {
    QVariantList files;
    const int count = m_video ? 1 : static_cast<int>(m_guides.size());
    for (int i=0;i<count;++i) {
        const QString rel = m_video ? "cs2_video.txt" : QString::fromStdString(m_guides[i].relativeFile());
        const auto state = srp::core::inspectPackageFile(packageId().toStdString(),rel.toStdString());
        files.append(QVariantMap{{"label",rel.section('/',-1)+(state.modified ? " (*)" : "")},{"value",i}});
    }
    return files;
}
QVariantList MediaController::options() const {
    QVariantList result; const auto parsed = srp::core::parseVideoConfig(m_content.toStdString());
    for (const auto& option : srp::core::videoOptions()) {
        QVariantList choices; int index = -1; std::string current;
        const auto it = parsed.values.find(option.key); if (it != parsed.values.end()) current = it->second;
        for (const auto& choice : option.values) {
            if (choice.first == current) index = static_cast<int>(choices.size());
            choices.append(QVariantMap{{"label",choice.second.rfind("video.",0)==0 ? trKey(choice.second) : QString::fromStdString(choice.second)},{"value",QString::fromStdString(choice.first)}});
        }
        if (index < 0 && !current.empty()) { index = static_cast<int>(choices.size()); choices.append(QVariantMap{{"label",QString::fromStdString(current)},{"value",QString::fromStdString(current)}}); }
        result.append(QVariantMap{{"key",QString::fromStdString(option.key)},{"label",trKey(option.label)},{"choices",choices},{"index",index}});
    }
    return result;
}
QVariantList MediaController::guides() const {
    QVariantList result;
    for (const auto& guide : m_guides) {
        const auto target = srp::core::annotationTarget(guide.id,annotationDirectory().toStdString());
        QFile installed(QString::fromStdString(target)); QByteArray bytes; const bool exists = !target.empty() && QFileInfo(QString::fromStdString(target)).isFile();
        if (installed.open(QIODevice::ReadOnly)) bytes=installed.readAll();
        QFile work(QString::fromStdString(srp::core::packageFilePath("annotations",guide.relativeFile()))); QByteArray source;
        if (work.open(QIODevice::ReadOnly)) source=work.readAll();
        result.append(QVariantMap{{"id",QString::fromStdString(guide.id)},{"name",QString::fromStdString(guide.name)},
            {"installed",exists},{"matches",exists && bytes==source},{"command",QString::fromStdString("annotation_load "+guide.directory)}});
    }
    return result;
}
bool MediaController::outdated() const { return isEditorDirty() ? m_baseVersion != srp::core::packageVersion(packageId().toStdString()) : srp::core::inspectPackageFile(packageId().toStdString(),relativeFile().toStdString()).outdated; }
QString MediaController::baseVersion() const { return QString::fromStdString(isEditorDirty() ? m_baseVersion : srp::core::inspectPackageFile(packageId().toStdString(),relativeFile().toStdString()).baseVersion); }
bool MediaController::report(bool success,const std::string& key) { emit messageNotify(success,trKey(key)); return success; }
bool MediaController::editable() {
    if (auto* packages=PackageController::instance(); packages && packages->busy()) return report(false,"pkg.busy");
    return true;
}
bool MediaController::clean() { return !isEditorDirty() || report(false,"media.save_first"); }
void MediaController::updateEditorContent(const QString& text) { if (m_content == text) return; m_content=text; emit stateChanged(); }
bool MediaController::saveCurrentFile() {
    if (!editable()) return false;
    refresh();
    if (m_externalConflict) return report(false,"media.external_conflict");
    if (!validationError().isEmpty()) return report(false,m_video ? "video.invalid" : "annotations.invalid");
    QString text=m_content; if (m_newline=="\r\n") text.replace("\n","\r\n"); if(m_bom) text.prepend(QChar(0xfeff));
    const auto result=srp::core::savePackageFile(packageId().toStdString(),relativeFile().toStdString(),text.toStdString(),m_baseVersion,m_baseContent);
    if (!result.success) return report(false,result.error);
    load(); return report(true,"media.saved");
}
void MediaController::resetCurrentFileToDefault() {
    if (!editable()) return;
    const auto result=srp::core::resetPackageFile(packageId().toStdString(),relativeFile().toStdString());
    if (!result.success) {report(false,result.error);return;} load(); report(true,"media.restored");
}
void MediaController::setSelectedFileIndex(int index) {
    if (m_video || index==m_index || index<0 || index>=static_cast<int>(m_guides.size())) return;
    if (!clean()) {emit stateChanged();return;} m_index=index;load();
}
void MediaController::setOption(const QString& key,const QString& value) {
    if (!m_video || !editable()) return;
    std::string changed;const auto result=srp::core::changeVideoOption(m_content.toStdString(),key.toStdString(),value.toStdString(),changed);
    if(!result.success){report(false,result.error);return;}m_content=QString::fromStdString(changed);emit editorContentChanged();emit stateChanged();
}
void MediaController::applyVideo() {
    if (!m_video || !editable() || !clean()) return;
    auto* overview=OverviewController::instance();
    const auto result=srp::core::applyVideoConfig(m_content.toStdString(),overview ? overview->userCfgPath().toStdString() : std::string());
    report(result.success,result.success ? "video.applied" : result.error);
}
void MediaController::deployGuides(const QStringList& ids,bool remove) {
    if(m_video || !editable() || !clean() || ids.isEmpty()) return;
    const auto directory=annotationDirectory(); if(directory.isEmpty()){report(false,"feedback.invalid_cfg_dir");return;}
    std::vector<std::string> selected; for (const auto& id : ids) selected.push_back(id.toStdString());
    const auto result = srp::core::operateAnnotationGuides(selected,directory.toStdString(),remove);
    if (!result.success) { emit stateChanged(); report(false,result.error); return; }
    emit stateChanged();emit actionCompleted();report(true,remove ? "annotations.removed" : "annotations.deployed");
}
void MediaController::attachHighlighter(QQuickTextDocument* document,bool dark) { if(!document)return;delete m_highlighter.data();m_highlighter=new Cs2CfgHighlighter(document->textDocument());m_highlighter->setStructuredMode(true);m_highlighter->setDarkTheme(dark); }
void MediaController::updateTheme(bool dark) { if(m_highlighter)m_highlighter->setDarkTheme(dark); }
