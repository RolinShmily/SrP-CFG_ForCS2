#pragma once

#include <QObject>
#include <QString>
#include <QStringList>
#include <QVariantList>
#include <QQuickTextDocument>
#include <QFileSystemWatcher>
#include <QTimer>
#include <QPointer>

class Cs2CfgHighlighter;

class PresetsController : public QObject {
    Q_OBJECT

    Q_PROPERTY(QVariantList availablePresets READ availablePresets NOTIFY presetsChanged)
    Q_PROPERTY(int selectedPresetIndex READ selectedPresetIndex WRITE setSelectedPresetIndex NOTIFY selectedPresetChanged)
    Q_PROPERTY(QString selectedPresetId READ selectedPresetId NOTIFY selectedPresetChanged)
    Q_PROPERTY(QString selectedPresetName READ selectedPresetName NOTIFY selectedPresetChanged)
    Q_PROPERTY(QString selectedPresetCommand READ selectedPresetCommand NOTIFY selectedPresetChanged)
    Q_PROPERTY(QString selectedPresetDescription READ selectedPresetDescription NOTIFY selectedPresetChanged)
    Q_PROPERTY(QVariantList selectedPresetTags READ selectedPresetTags NOTIFY selectedPresetChanged)
    Q_PROPERTY(bool selectedPresetHasDiff READ selectedPresetHasDiff NOTIFY selectedPresetChanged)
    Q_PROPERTY(QString activePresetId READ activePresetId NOTIFY activePresetChanged)
    Q_PROPERTY(bool isPresetLoaded READ isPresetLoaded NOTIFY isPresetLoadedChanged)

    Q_PROPERTY(QVariantList availableFiles READ availableFiles CONSTANT)
    Q_PROPERTY(int selectedFileIndex READ selectedFileIndex WRITE setSelectedFileIndex NOTIFY selectedFileChanged)
    Q_PROPERTY(QString selectedFileName READ selectedFileName NOTIFY selectedFileChanged)
    Q_PROPERTY(QString currentFilePathDisplay READ currentFilePathDisplay NOTIFY currentFilePathDisplayChanged)

    Q_PROPERTY(QString editorContent READ editorContent NOTIFY editorContentChanged)
    Q_PROPERTY(bool isEditorDirty READ isEditorDirty NOTIFY editorDirtyChanged)
    Q_PROPERTY(int editorFontSize READ editorFontSize WRITE setEditorFontSize NOTIFY editorFontSizeChanged)
    Q_PROPERTY(bool isSrpInstalled READ isSrpInstalled NOTIFY srpInstalledChanged)
    Q_PROPERTY(QString currentLang READ currentLang NOTIFY languageChanged)

public:
    explicit PresetsController(QObject* parent = nullptr);
    ~PresetsController() override;

    static PresetsController* instance();

    QVariantList availablePresets() const { return m_availablePresets; }
    int selectedPresetIndex() const { return m_selectedPresetIndex; }
    Q_INVOKABLE void setSelectedPresetIndex(int index);

    QString selectedPresetId() const;
    QString selectedPresetName() const;
    QString selectedPresetCommand() const;
    QString selectedPresetDescription() const;
    QVariantList selectedPresetTags() const;
    bool selectedPresetHasDiff() const;

    QString activePresetId() const { return m_activePresetId; }
    bool isPresetLoaded() const;

    QVariantList availableFiles() const { return m_availableFiles; }
    int selectedFileIndex() const { return m_selectedFileIndex; }
    Q_INVOKABLE void setSelectedFileIndex(int index);
    QString selectedFileName() const;
    QString currentFilePathDisplay() const;

    QString editorContent() const { return m_editorContent; }
    bool isEditorDirty() const { return m_isEditorDirty; }
    int editorFontSize() const { return m_editorFontSize; }
    Q_INVOKABLE void setEditorFontSize(int size);
    bool isSrpInstalled() const;
    QString currentLang() const;

    Q_INVOKABLE void reload();
    Q_INVOKABLE void updateEditorContent(const QString& content);
    Q_INVOKABLE bool loadCurrentPreset();
    Q_INVOKABLE bool unloadPreset();
    Q_INVOKABLE bool saveCurrentFile(const QString& content);
    Q_INVOKABLE bool resetCurrentFileToDefault();
    Q_INVOKABLE bool installSrpAndLoadCurrentPreset();
    Q_INVOKABLE void openPresetFolder();

    Q_INVOKABLE void zoomIn();
    Q_INVOKABLE void zoomOut();
    Q_INVOKABLE void resetZoom();

    Q_INVOKABLE void attachHighlighter(QQuickTextDocument* document, bool isDark);
    Q_INVOKABLE void updateTheme(bool isDark);
    Q_INVOKABLE void applyDocumentFormat();
    Q_INVOKABLE QString tr(const QString& key, const QString& langDependency = QString()) const;

signals:
    void presetsChanged();
    void selectedPresetChanged();
    void activePresetChanged();
    void isPresetLoadedChanged();
    void selectedFileChanged();
    void currentFilePathDisplayChanged();
    void editorContentChanged();
    void editorDirtyChanged();
    void editorFontSizeChanged();
    void srpInstalledChanged();
    void languageChanged();
    void promptInstallSrp();
    void messageNotify(bool success, const QString& message);

private:
    void refreshPresets();
    void loadCurrentFileContent();
    QString getCurrentAbsoluteFilePath() const;
    void watchCurrentFile();
    void synchronizeCurrentFile();
    bool canChangeCustomCfg();
    std::string getEffectiveGameCfgDir() const;

    static PresetsController* s_instance;

    QVariantList m_availablePresets;
    int m_selectedPresetIndex = 0;
    QString m_activePresetId;

    QVariantList m_availableFiles;
    int m_selectedFileIndex = 0;

    QString m_editorContent;
    QString m_savedFileContent;
    bool m_isEditorDirty = false;
    int m_editorFontSize = 12;

    QPointer<Cs2CfgHighlighter> m_highlighter;
    QQuickTextDocument* m_quickDoc = nullptr;
    QFileSystemWatcher* m_fileWatcher = nullptr;
    QTimer m_fileChangeTimer;
    QString m_watchedFilePath;
    bool m_externalChangeNotified = false;
};
