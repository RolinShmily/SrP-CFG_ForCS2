import QtQuick
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui

Rectangle {
    id: panel
    required property var controller
    property bool pageVisible: visible
    function t(key) { return OverviewController.tr(key, OverviewController.currentLang); }
    Connections {
        target: HusTheme
        function onDarkModeChanged() { panel.controller.updateTheme(HusTheme.isDark); }
    }
    color: MetaTheme.cardBg
    border.color: MetaTheme.cardBorder
    radius: MetaTheme.radiusLg
    clip: true
    Connections {
        target: panel.controller
        function onEditorContentChanged() { if (code.text !== panel.controller.editorContent) code.text = panel.controller.editorContent; }
        function onStateChanged() { files.currentIndex = panel.controller.selectedFileIndex; }
        function onMessageNotify(success, message) { if (success) AppFeedback.success(message); else AppFeedback.error(message); }
    }
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 16
        spacing: 10
        RowLayout {
            Layout.fillWidth: true
            spacing: 8
            HusSelect {
                id: files
                objectName: "mediaFileSelect"
                Layout.fillWidth: true
                Layout.minimumWidth: 90
                sizeHint: "small"
                model: panel.controller.availableFiles
                textRole: "label"
                valueRole: "value"
                currentIndex: panel.controller.selectedFileIndex
                clearEnabled: false
                showToolTip: true
                contentDescription: panel.t("valve.file_label")
                onActivated: (index) => panel.controller.setSelectedFileIndex(index)
            }
            AppButton {
                text: panel.t("presets.btn_reset")
                iconSource: HusIcon.UndoOutlined
                sizeHint: "small"
                enabled: !PackageController.busy
                onClicked: resetModal.openWarning()
            }
            AppButton {
                objectName: "mediaSaveButton"
                text: panel.t("presets.btn_save") + (panel.controller.isEditorDirty ? " *" : "")
                iconSource: HusIcon.SaveOutlined
                sizeHint: "small"
                type: panel.controller.isEditorDirty ? HusButton.Type_Primary : HusButton.Type_Default
                enabled: !PackageController.busy
                onClicked: panel.controller.saveCurrentFile()
            }
        }
        Text { font.family: MetaTheme.fontFamily;
            visible: panel.controller.outdated
            Layout.fillWidth: true
            text: panel.t("pkg.outdated").arg(panel.controller.baseVersion)
            color: MetaTheme.statusWarning
            font.pixelSize: 11
            wrapMode: Text.WordWrap
        }
        AppCodeEditor {
            id: code
            objectName: "mediaEditor"
            Layout.fillWidth: true
            Layout.fillHeight: true
            editorController: panel.controller
            shortcutsEnabled: panel.pageVisible
            text: panel.controller.editorContent
            currentFilePath: panel.controller.currentFilePathDisplay
            syntaxLabel: panel.controller.currentFilePathDisplay.startsWith("video/") ? "Valve KeyValues" : "Valve KV3"
            onTextChanged: panel.controller.updateEditorContent(text)
        }
        Text { font.family: MetaTheme.fontFamily;
            Layout.fillWidth: true
            text: panel.controller.validationError || panel.t("pkg.staging")
            color: panel.controller.validationError ? MetaTheme.statusCritical : MetaTheme.textTertiary
            font.pixelSize: 11
            wrapMode: Text.WordWrap
        }
    }
    AppModal {
        id: resetModal
        title: panel.t("media.reset_title")
        description: panel.t("media.reset_desc")
        confirmText: panel.t("presets.btn_reset")
        cancelText: panel.t("valve.cancel")
        onConfirm: { close(); panel.controller.resetCurrentFileToDefault(); }
        onCancel: close()
    }
}
