#pragma once
#include <QObject>
#include <QVariantList>
#include <QPointer>
#include <QQuickTextDocument>
#include <QFileSystemWatcher>
#include <QTimer>
#include "srp/core/media_config.h"
class Cs2CfgHighlighter;
class MediaController : public QObject {
    Q_OBJECT
    Q_PROPERTY(QString editorContent READ editorContent NOTIFY editorContentChanged)
    Q_PROPERTY(bool isEditorDirty READ isEditorDirty NOTIFY stateChanged)
    Q_PROPERTY(QString validationError READ validationError NOTIFY stateChanged)
    Q_PROPERTY(QString currentFilePathDisplay READ currentFilePathDisplay NOTIFY stateChanged)
    Q_PROPERTY(QVariantList availableFiles READ availableFiles NOTIFY stateChanged)
    Q_PROPERTY(int selectedFileIndex READ selectedFileIndex NOTIFY stateChanged)
    Q_PROPERTY(QVariantList options READ options NOTIFY stateChanged)
    Q_PROPERTY(QVariantList guides READ guides NOTIFY stateChanged)
    Q_PROPERTY(QStringList guideIds READ guideIds NOTIFY catalogChanged)
    Q_PROPERTY(int optionCount READ optionCount CONSTANT)
    Q_PROPERTY(bool outdated READ outdated NOTIFY stateChanged)
    Q_PROPERTY(QString baseVersion READ baseVersion NOTIFY stateChanged)
public:
    explicit MediaController(bool video, QObject* parent = nullptr);
    QString editorContent() const { return m_content; }
    bool isEditorDirty() const { return m_content != m_saved; }
    QString validationError() const;
    QString currentFilePathDisplay() const;
    QVariantList availableFiles() const;
    int selectedFileIndex() const { return m_index; }
    QVariantList options() const;
    QVariantList guides() const;
    QStringList guideIds() const;
    int optionCount() const { return static_cast<int>(srp::core::videoOptions().size()); }
    bool outdated() const;
    QString baseVersion() const;
    Q_INVOKABLE void updateEditorContent(const QString& text);
    Q_INVOKABLE bool saveCurrentFile();
    Q_INVOKABLE void resetCurrentFileToDefault();
    Q_INVOKABLE void setSelectedFileIndex(int index);
    Q_INVOKABLE void setOption(const QString& key, const QString& value);
    Q_INVOKABLE void applyVideo();
    Q_INVOKABLE void deployGuides(const QStringList& ids, bool remove);
    Q_INVOKABLE void attachHighlighter(QQuickTextDocument* document, bool dark);
    Q_INVOKABLE void updateTheme(bool dark);
    Q_INVOKABLE void refresh();
signals:
    void stateChanged();
    void catalogChanged();
    void editorContentChanged();
    void messageNotify(bool success, const QString& message);
    void actionCompleted();
private:
    QString packageId() const;
    QString relativeFile() const;
    QString annotationDirectory() const;
    void load();
    void watch();
    bool editable();
    bool clean();
    bool report(bool success, const std::string& key);
    std::vector<srp::core::AnnotationGuide> m_guides;
    void refreshCatalog();
    bool m_video;
    int m_index = 0;
    QString m_content, m_saved, m_path;
    std::string m_baseContent, m_baseVersion;
    bool m_bom = false;
    bool m_externalConflict = false;
    QString m_newline = "\n";
    QPointer<Cs2CfgHighlighter> m_highlighter;
    QFileSystemWatcher m_watcher;
    QTimer m_debounce;
};
