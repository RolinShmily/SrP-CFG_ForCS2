#pragma once

#include <QObject>
#include <QString>
#include <QStringList>
#include <QVariantList>
#include <QQuickTextDocument>
#include <memory>

class Cs2CfgHighlighter;

class PresetsController : public QObject {
    Q_OBJECT

    Q_PROPERTY(QVariantList availablePresets READ availablePresets NOTIFY presetsChanged)
    Q_PROPERTY(int selectedPresetIndex READ selectedPresetIndex WRITE setSelectedPresetIndex NOTIFY selectedPresetChanged)
    Q_PROPERTY(QString selectedPresetId READ selectedPresetId NOTIFY selectedPresetChanged)
    Q_PROPERTY(QString selectedPresetName READ selectedPresetName NOTIFY selectedPresetChanged)
    Q_PROPERTY(QString selectedPresetCommand READ selectedPresetCommand NOTIFY selectedPresetChanged)
    Q_PROPERTY(bool selectedPresetHasDiff READ selectedPresetHasDiff NOTIFY selectedPresetChanged)
    Q_PROPERTY(QString activePresetId READ activePresetId NOTIFY activePresetChanged)
    Q_PROPERTY(bool isPresetLoaded READ isPresetLoaded NOTIFY isPresetLoadedChanged)

    Q_PROPERTY(QVariantList availableFiles READ availableFiles CONSTANT)
    Q_PROPERTY(int selectedFileIndex READ selectedFileIndex WRITE setSelectedFileIndex NOTIFY selectedFileChanged)
    Q_PROPERTY(QString selectedFileName READ selectedFileName NOTIFY selectedFileChanged)
    Q_PROPERTY(QString currentFilePathDisplay READ currentFilePathDisplay NOTIFY currentFilePathDisplayChanged)

    Q_PROPERTY(QString editorContent READ editorContent NOTIFY editorContentChanged)
    Q_PROPERTY(bool isEditorDirty READ isEditorDirty NOTIFY editorDirtyChanged)
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
    bool isSrpInstalled() const;
    QString currentLang() const;

    Q_INVOKABLE void reload();
    Q_INVOKABLE void updateEditorContent(const QString& content);
    Q_INVOKABLE bool loadCurrentPreset();
    Q_INVOKABLE bool unloadPreset();
    Q_INVOKABLE bool saveCurrentFile(const QString& content);
    Q_INVOKABLE bool resetCurrentFileToDefault();
    Q_INVOKABLE bool installSrpAndLoadCurrentPreset();

    Q_INVOKABLE void attachHighlighter(QQuickTextDocument* document, bool isDark);
    Q_INVOKABLE void updateTheme(bool isDark);
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
    void srpInstalledChanged();
    void languageChanged();
    void promptInstallSrp();
    void messageNotify(bool success, const QString& message);

private:
    void refreshPresets();
    void loadCurrentFileContent();
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

    std::unique_ptr<Cs2CfgHighlighter> m_highlighter;
};
