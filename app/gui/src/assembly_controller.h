#pragma once
#include <QObject>
#include <QVariantList>
#include <QFileSystemWatcher>
#include <QTimer>
#include <QPointer>
#include <QQuickTextDocument>
#include "srp/core/assembly.h"
class Cs2CfgHighlighter;

class AssemblyController : public QObject {
    Q_OBJECT
    Q_PROPERTY(QVariantList availableFiles READ availableFiles NOTIFY filesChanged)
    Q_PROPERTY(QVariantList modules READ modules NOTIFY stateChanged)
    Q_PROPERTY(QStringList featureIds READ featureIds NOTIFY catalogChanged)
    Q_PROPERTY(QStringList modeIds READ modeIds NOTIFY catalogChanged)
    Q_PROPERTY(int selectedFileIndex READ selectedFileIndex NOTIFY selectedFileChanged)
    Q_PROPERTY(QString currentFilePathDisplay READ currentFilePathDisplay NOTIFY selectedFileChanged)
    Q_PROPERTY(QString editorContent READ editorContent NOTIFY editorContentChanged)
    Q_PROPERTY(bool isEditorDirty READ isEditorDirty NOTIFY editorDirtyChanged)
    Q_PROPERTY(bool settingsAssembled READ settingsAssembled NOTIFY stateChanged)
    Q_PROPERTY(bool keymapAssembled READ keymapAssembled NOTIFY stateChanged)
    Q_PROPERTY(QString activePresetName READ activePresetName NOTIFY stateChanged)
    Q_PROPERTY(bool isBusy READ isBusy NOTIFY busyChanged)
    Q_PROPERTY(bool canSave READ canSave NOTIFY stateChanged)
public:
    explicit AssemblyController(QObject* parent = nullptr);
    QVariantList availableFiles() const { return m_files; }
    QVariantList modules() const { return m_modules; }
    QStringList featureIds() const;
    QStringList modeIds() const;
    Q_INVOKABLE bool openFile(const QString& relativePath);
    Q_INVOKABLE void openModuleFolder(const QString& moduleId);
    Q_INVOKABLE void requestFeature(const QString& moduleId, bool keys, bool remove = false);
    Q_INVOKABLE void requestMode(const QString& moduleId, const QString& key, bool keys, bool remove = false);
    Q_INVOKABLE void confirmBinding();
    int selectedFileIndex() const { return m_index; }
    QString currentFilePathDisplay() const;
    QString editorContent() const { return m_content; }
    bool isEditorDirty() const { return m_dirty; }
    bool settingsAssembled() const { return m_settings; }
    bool keymapAssembled() const { return m_keymap; }
    QString activePresetName() const;
    bool isBusy() const { return m_busy; }
    bool canSave() const;
    Q_INVOKABLE void refresh();
    Q_INVOKABLE void setSelectedFileIndex(int index);
    Q_INVOKABLE void updateEditorContent(const QString& content);
    Q_INVOKABLE bool saveCurrentFile();
    Q_INVOKABLE bool resetCurrentFileToDefault();
    Q_INVOKABLE void requestAssemble(bool settings, bool keymap);
    Q_INVOKABLE void confirmAssemble();
    Q_INVOKABLE void installAndAssemble();
    Q_INVOKABLE void requestUnload(bool settings, bool keymap);
    Q_INVOKABLE void attachHighlighter(QQuickTextDocument* document, bool dark);
    Q_INVOKABLE void updateTheme(bool dark);
signals:
    void filesChanged();
    void catalogChanged();
    void selectedFileChanged();
    void editorContentChanged();
    void editorDirtyChanged();
    void stateChanged();
    void busyChanged();
    void actionCompleted();
    void promptInstallSrp();
    void promptBindingConflict(const QString& key, const QString& previous, const QString& command);
    void promptReplacePreset(const QString& preset, const QString& items);
    void messageNotify(bool success, const QString& message);
private:
    QString cfgDir() const;
    QString relativeFile() const;
    QString translate(const char* key) const;
    void updateState();
    void loadDocument();
    void watchFiles();
    void synchronize();
    bool guardDraft();
    void runAssembly(bool add);
    bool pendingValid();
    void runModule();
    void completeModule(const srp::core::ConfigWriteResult& result);
    QVariantList m_files, m_modules;
    QStringList m_featureIds, m_modeIds;
    QStringList m_filePaths;
    enum class Pending { Valve, Feature, Mode };
    Pending m_pending = Pending::Valve;
    QString m_pendingModule, m_pendingKey;
    bool m_removeModule = false;
    srp::core::ModeBindingPlan m_bindingPlan;
    int m_index = 0;
    QString m_content, m_saved, m_documentPath, m_documentCfgDir;
    QString m_newline = "\n";
    bool m_hasBom = false;
    QString editorText(const QByteArray& bytes);
    QString fileText() const;
    bool m_dirty = false, m_settings = false, m_keymap = false, m_busy = false;
    bool m_notified = false;
    QString m_preset;
    bool m_pendingSettings = false, m_pendingKeys = false;
    QString m_pendingDir, m_confirmedPreset;
    QFileSystemWatcher m_watcher;
    QTimer m_debounce;
    QPointer<Cs2CfgHighlighter> m_highlighter;
};
