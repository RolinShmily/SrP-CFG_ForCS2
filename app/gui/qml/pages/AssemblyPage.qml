import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui
import "../components"

Item {
    id: page
    objectName: "assemblyWorkspace"
    property bool editorExpanded: false
    property string activeSection: "assembly_baseline"
    property string initialSection: "assembly_baseline"
    signal sectionChanged(string route)
    function t(key) { return OverviewController.tr(key, OverviewController.currentLang); }
    function moduleState(id) {
        const entries = AssemblyController.modules;
        for (let i = 0; i < entries.length; ++i) if (entries[i].id === id) return entries[i];
        return ({});
    }
    function navigateTo(route) {
        if (route === "assembly_usercfg" && !AssemblyController.openFile("user/custom.cfg")) {
            sectionChanged(activeSection);
            return;
        }
        const section = route === "assembly_features" ? featuresSection : route === "assembly_modes" ? modesSection : route === "assembly_usercfg" ? userSection : valveSection;
        scrollAnimation.stop();
        activeSection = route;
        sectionChanged(route);
        scrollAnimation.to = Math.max(0, Math.min(section.y, operationScroll.contentHeight - operationScroll.height));
        scrollAnimation.start();
    }
    function trackSection() {
        if (!visible || scrollAnimation.running || editorExpanded) return;
        const y = operationScroll.contentY + 24;
        const route = y >= userSection.y ? "assembly_usercfg" : y >= modesSection.y ? "assembly_modes" : y >= featuresSection.y ? "assembly_features" : "assembly_baseline";
        if (route !== activeSection) { activeSection = route; sectionChanged(route); }
    }
    onVisibleChanged: if (visible) AssemblyController.refresh()
    Component.onCompleted: Qt.callLater(function() { if (initialSection.startsWith("assembly_")) navigateTo(initialSection); })
    Connections {
        target: HusTheme
        function onDarkModeChanged() { AssemblyController.updateTheme(HusTheme.isDark); }
    }
    Connections {
        target: AssemblyController
        function onEditorContentChanged() { if (editor.text !== AssemblyController.editorContent) editor.text = AssemblyController.editorContent; }
        function onSelectedFileChanged() { fileSelect.currentIndex = AssemblyController.selectedFileIndex; }
        function onActionCompleted() { settingsChoice.checked = false; keymapChoice.checked = false; }
        function onPromptInstallSrp() { installModal.openWarning(); }
        function onPromptReplacePreset(preset, items) { replaceModal.preset = preset; replaceModal.items = items; replaceModal.openWarning(); }
        function onPromptBindingConflict(key, previous, command) { bindingModal.keyName = key; bindingModal.previous = previous; bindingModal.command = command; bindingModal.openWarning(); }
        function onMessageNotify(success, message) { if (success) AppFeedback.success(message); else AppFeedback.error(message); }
    }
    NumberAnimation {
        id: scrollAnimation
        target: operationScroll
        property: "contentY"
        duration: 220
        easing.type: Easing.OutCubic
    }
    RowLayout {
        id: body
        anchors.top: parent.top
        anchors.bottom: parent.bottom
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.topMargin: 20
        anchors.bottomMargin: 16
        width: Math.min(parent.width - 48, 1920)
        spacing: 16
        Flickable {
            id: operationScroll
            objectName: "assemblyOperationScroll"
            visible: !page.editorExpanded
            Layout.preferredWidth: Math.max(300, Math.min(500, Math.round(body.width * 0.37)))
            Layout.fillHeight: true
            contentWidth: width
            contentHeight: operations.implicitHeight
            clip: true
            boundsBehavior: Flickable.StopAtBounds
            onContentYChanged: page.trackSection()
            ScrollBar.vertical: HusScrollBar {
                id: outerScroll
                objectName: "assemblyOuterScrollBar"
                parent: page
                x: page.width - width - 5
                y: 20
                height: page.height - 36
                policy: page.editorExpanded ? ScrollBar.AlwaysOff : ScrollBar.AlwaysOn
                Accessible.name: page.t("assembly.scroll_sections")
            }
            ColumnLayout {
                id: operations
                width: operationScroll.width
                spacing: 24
                ColumnLayout {
                    id: valveSection
                    Layout.fillWidth: true
                    spacing: 16
                    SectionTitle { text: page.t("valve.title") }
                Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: choices.implicitHeight + 36
                    radius: MetaTheme.radiusLg
                    color: MetaTheme.cardBg
                    border.width: 1
                    border.color: MetaTheme.cardBorder
                    ColumnLayout {
                        id: choices
                        anchors.left: parent.left
                        anchors.right: parent.right
                        anchors.top: parent.top
                        anchors.margins: 18
                        spacing: 16
                        ColumnLayout {
                            Layout.fillWidth: true
                            spacing: 8
                            RowLayout {
                                Layout.fillWidth: true
                                HusCheckBox {
                                    id: settingsChoice
                                    objectName: "valveSettingsChoice"
                                    text: page.t("valve.settings")
                                    effectEnabled: false
                                    enabled: !AssemblyController.isBusy
                                    colorText: MetaTheme.textPrimary
                                    colorIndicator: checked ? MetaTheme.starkBlack : MetaTheme.cardBg
                                    colorIndicatorBorder: checked ? MetaTheme.primaryColor : MetaTheme.btnDefaultBorder
                                    contentDescription: text
                                }
                                Item { Layout.fillWidth: true }
                                StateLabel { assembled: AssemblyController.settingsAssembled }
                            }
                            CommandRow { command: "exec srp-cfg/valve/settings.cfg" }
                        }
                        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: MetaTheme.divider }
                        ColumnLayout {
                            Layout.fillWidth: true
                            spacing: 8
                            RowLayout {
                                Layout.fillWidth: true
                                HusCheckBox {
                                    id: keymapChoice
                                    objectName: "valveKeymapChoice"
                                    text: page.t("valve.keymap")
                                    effectEnabled: false
                                    enabled: !AssemblyController.isBusy
                                    colorText: MetaTheme.textPrimary
                                    colorIndicator: checked ? MetaTheme.starkBlack : MetaTheme.cardBg
                                    colorIndicatorBorder: checked ? MetaTheme.primaryColor : MetaTheme.btnDefaultBorder
                                    contentDescription: text
                                }
                                Item { Layout.fillWidth: true }
                                StateLabel { assembled: AssemblyController.keymapAssembled }
                            }
                            CommandRow { command: "exec srp-cfg/valve/keymap.cfg" }
                        }
                        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: MetaTheme.divider }
                        RowLayout {
                            Layout.fillWidth: true
                            spacing: 10
                            AppButton {
                                objectName: "valveAssembleButton"
                                Layout.fillWidth: true
                                Layout.preferredHeight: 36
                                text: page.t("valve.assemble")
                                type: HusButton.Type_Primary
                                iconSource: HusIcon.CheckOutlined
                                enabled: (settingsChoice.checked || keymapChoice.checked) && !AssemblyController.isBusy
                                loading: AssemblyController.isBusy
                                onClicked: AssemblyController.requestAssemble(settingsChoice.checked, keymapChoice.checked)
                            }
                            AppButton {
                                objectName: "valveUnloadButton"
                                Layout.fillWidth: true
                                Layout.preferredHeight: 36
                                text: page.t("valve.unload")
                                iconSource: HusIcon.DisconnectOutlined
                                enabled: (settingsChoice.checked || keymapChoice.checked) && !AssemblyController.isBusy
                                onClicked: AssemblyController.requestUnload(settingsChoice.checked, keymapChoice.checked)
                            }
                        }
                    }
                }
                }
                ColumnLayout {
                    id: featuresSection
                    Layout.fillWidth: true
                    spacing: 12
                    SectionTitle { text: page.t("assembly.features") }
                    Repeater {
                        model: AssemblyController.featureIds
                        AssemblyModuleCard {
                            required property string modelData
                            Layout.fillWidth: true
                            moduleId: modelData
                            state: page.moduleState(moduleId)
                        }
                    }
                }
                ColumnLayout {
                    id: modesSection
                    Layout.fillWidth: true
                    spacing: 12
                    SectionTitle { text: page.t("assembly.modes") }
                    Repeater {
                        model: AssemblyController.modeIds
                        AssemblyModuleCard {
                            required property string modelData
                            Layout.fillWidth: true
                            moduleId: modelData
                            state: page.moduleState(moduleId)
                        }
                    }
                }
                ColumnLayout {
                    id: userSection
                    Layout.fillWidth: true
                    Layout.minimumHeight: operationScroll.height
                    spacing: 12
                    SectionTitle { text: page.t("nav.user_custom") }
                    Rectangle {
                        Layout.fillWidth: true
                        implicitHeight: userContent.implicitHeight + 32
                        color: MetaTheme.cardBg
                        border.color: MetaTheme.cardBorder
                        radius: MetaTheme.radiusLg
                        ColumnLayout {
                            id: userContent
                            anchors.left: parent.left; anchors.right: parent.right; anchors.top: parent.top
                            anchors.margins: 16
                            spacing: 12
                            Text {
                                Layout.fillWidth: true
                                text: page.t("assembly.user_description")
                                color: MetaTheme.textSecondary
                                font.pixelSize: 12
                                wrapMode: Text.WordWrap
                            }
                            AppButton {
                                text: page.t("assembly.open_custom")
                                iconSource: HusIcon.EditOutlined
                                onClicked: AssemblyController.openFile("user/custom.cfg")
                            }
                        }
                    }
                    Item { Layout.fillHeight: true }
                }
            }
        }
        Rectangle {
            id: editorPanel
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: MetaTheme.cardBg
            border.color: MetaTheme.cardBorder
            border.width: 1
            radius: MetaTheme.radiusLg
            clip: true
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 16
                spacing: 10
                RowLayout {
                    Layout.fillWidth: true
                    spacing: 8
                    AppButton {
                        objectName: "assemblyExpandButton"
                        iconSource: page.editorExpanded ? HusIcon.DoubleRightOutlined : HusIcon.DoubleLeftOutlined
                        sizeHint: "small"
                        type: HusButton.Type_Text
                        contentDescription: page.t(page.editorExpanded ? "assembly.collapse_editor" : "assembly.expand_editor")
                        onClicked: page.editorExpanded = !page.editorExpanded
                        HusToolTip { text: parent.contentDescription }
                    }
                    HusSelect {
                        id: fileSelect
                        objectName: "valveFileSelect"
                        Layout.fillWidth: true
                        Layout.minimumWidth: 140
                        sizeHint: "small"
                        textRole: "label"
                        valueRole: "value"
                        model: AssemblyController.availableFiles
                        currentIndex: AssemblyController.selectedFileIndex
                        enabled: !AssemblyController.isBusy
                        clearEnabled: false
                        showToolTip: true
                        contentDescription: page.t("valve.file_label")
                        onActivated: (index) => AssemblyController.setSelectedFileIndex(index)
                    }
                    AppButton {
                        objectName: "valveResetButton"
                        visible: AssemblyController.selectedFileIndex !== 0
                        text: page.t("presets.btn_reset")
                        sizeHint: "small"
                        Layout.preferredHeight: 28
                        iconSource: HusIcon.UndoOutlined
                        enabled: AssemblyController.canSave
                        onClicked: resetModal.openWarning()
                        HusToolTip { text: page.t("valve.reset_tip") }
                    }
                    AppButton {
                        objectName: "valveSaveButton"
                        text: page.t("presets.btn_save") + (AssemblyController.isEditorDirty ? " *" : "")
                        sizeHint: "small"
                        Layout.preferredHeight: 28
                        type: AssemblyController.isEditorDirty ? HusButton.Type_Primary : HusButton.Type_Default
                        iconSource: HusIcon.SaveOutlined
                        enabled: AssemblyController.canSave
                        onClicked: AssemblyController.saveCurrentFile()
                        HusToolTip { text: page.t("valve.save_tip") }
                    }
                }
                AppCodeEditor {
                    id: editor
                    objectName: "valveEditor"
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    editorController: AssemblyController
                    shortcutsEnabled: page.visible
                    text: AssemblyController.editorContent
                    readOnly: !AssemblyController.canSave
                    currentFilePath: AssemblyController.currentFilePathDisplay
                    onTextChanged: AssemblyController.updateEditorContent(text)
                }
                Text {
                    visible: !AssemblyController.canSave && !AssemblyController.isBusy
                    Layout.fillWidth: true
                    text: page.t("valve.readonly")
                    font.pixelSize: 11
                    color: MetaTheme.textTertiary
                    wrapMode: Text.WordWrap
                }
            }
        }
    }

    component SectionTitle: Text {
        Layout.fillWidth: true
        font.pixelSize: 22
        font.bold: true
        color: MetaTheme.textPrimary
        wrapMode: Text.WordWrap
        Layout.leftMargin: 2
    }
    AppModal {
        id: bindingModal
        objectName: "assemblyBindingModal"
        property string keyName: ""
        property string previous: ""
        property string command: ""
        title: page.t("assembly.conflict_title")
        description: page.t("assembly.conflict_desc").arg(keyName).arg(previous || page.t("assembly.legacy")).arg(command)
        confirmText: page.t("assembly.confirm_bind")
        cancelText: page.t("valve.cancel")
        onConfirm: { close(); AssemblyController.confirmBinding(); }
        onCancel: close()
    }
    component StateLabel: RowLayout {
        property bool assembled: false
        spacing: 6
        Rectangle {
            implicitWidth: 5; implicitHeight: 5; radius: 3
            color: parent.assembled ? MetaTheme.statusSuccess : MetaTheme.textDisabled
        }
        Text {
            text: page.t(parent.assembled ? "valve.assembled_state" : "valve.not_assembled")
            font.pixelSize: 11
            color: parent.assembled ? MetaTheme.textSecondary : MetaTheme.textTertiary
        }
    }
    component CommandRow: Rectangle {
        id: row
        property string command
        Layout.fillWidth: true
        implicitHeight: 34
        radius: MetaTheme.radiusMd
        color: MetaTheme.surfaceSoft
        RowLayout {
            anchors.fill: parent
            anchors.leftMargin: 10
            anchors.rightMargin: 4
            spacing: 4
            Text {
                Layout.fillWidth: true
                text: row.command
                font.family: "Consolas"
                font.pixelSize: 11
                color: MetaTheme.textSecondary
                elide: Text.ElideRight
                HusToolTip { visible: commandHover.hovered; text: row.command }
                HoverHandler { id: commandHover }
            }
            AppButton {
                Layout.preferredWidth: 26
                Layout.preferredHeight: 26
                type: HusButton.Type_Text
                sizeHint: "small"
                iconSource: HusIcon.CopyOutlined
                contentDescription: page.t("valve.copy")
                onClicked: {
                    OverviewController.copyToClipboard(row.command);
                    AppFeedback.success(page.t("valve.copied"));
                }
                HusToolTip { text: page.t("valve.copy") }
            }
        }
    }
    AppModal {
        id: replaceModal
        objectName: "valveReplaceModal"
        property string preset: ""
        property string items: ""
        modal: true
        title: page.t("valve.replace_title")
        description: page.t("valve.replace_desc").arg(preset).arg(items)
        confirmText: page.t("valve.confirm_assemble")
        cancelText: page.t("valve.cancel")
        onConfirm: { close(); AssemblyController.confirmAssemble(); }
        onCancel: close()
    }
    AppModal {
        id: installModal
        modal: true
        title: page.t("valve.install_title")
        description: page.t("valve.install_desc")
        confirmText: page.t("valve.install_confirm")
        cancelText: page.t("valve.cancel")
        onConfirm: { close(); AssemblyController.installAndAssemble(); }
        onCancel: close()
    }
    AppModal {
        id: resetModal
        modal: true
        title: page.t("valve.reset_title")
        description: page.t("valve.reset_desc").arg(AssemblyController.currentFilePathDisplay)
        confirmText: page.t("valve.confirm_reset")
        cancelText: page.t("valve.cancel")
        onConfirm: { close(); AssemblyController.resetCurrentFileToDefault(); }
        onCancel: close()
    }
}
