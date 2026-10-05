import QtQuick
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui

Rectangle {
    id: card
    required property string moduleId
    property var state: ({})
    readonly property bool isMode: state.category === "modes"
    function t(key) { return OverviewController.tr(key, OverviewController.currentLang); }
    function resetOptions() { keysChoice.checked = false; }
    implicitHeight: contents.implicitHeight + 32
    color: MetaTheme.cardBg
    border.color: MetaTheme.cardBorder
    radius: MetaTheme.radiusLg

    ColumnLayout {
        id: contents
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.top: parent.top
        anchors.margins: 16
        spacing: 12
        RowLayout {
            Layout.fillWidth: true
            Text {
                text: card.state.name || card.moduleId
                font.pixelSize: 17
                font.bold: true
                color: MetaTheme.textPrimary
                Layout.fillWidth: true
            }
            AppButton {
                iconSource: HusIcon.FolderOpenOutlined
                sizeHint: "small"
                type: HusButton.Type_Text
                contentDescription: card.t("assembly.open_folder")
                onClicked: AssemblyController.openModuleFolder(card.moduleId)
                HusToolTip { text: card.t("assembly.open_folder") }
            }
        }
        RowLayout {
            Layout.fillWidth: true
            spacing: 6
            Rectangle {
                implicitWidth: 5; implicitHeight: 5; radius: 3
                color: card.state.settings ? MetaTheme.statusSuccess : MetaTheme.textDisabled
            }
            Text {
                Layout.fillWidth: true
                text: card.isMode
                    ? (card.state.legacyAutoLoad ? card.t("assembly.legacy") : (card.state.launchKeys && card.state.launchKeys.length > 0 ? card.t("assembly.bound_state").arg(card.state.launchKeys.join(", ")) : card.t("assembly.not_bound")))
                    : card.t(card.state.settings ? (card.state.keymap ? "assembly.with_keys_state" : "assembly.settings_state") : "valve.not_assembled")
                font.pixelSize: 11
                color: MetaTheme.textSecondary
                wrapMode: Text.WordWrap
            }
        }
        RowLayout {
            visible: card.isMode
            Layout.fillWidth: true
            Text { text: card.t("assembly.launch_key"); color: MetaTheme.textSecondary; font.pixelSize: 12 }
            HusInput {
                id: launchKey
                objectName: "launchKey_" + card.moduleId
                Layout.fillWidth: true
                sizeHint: "small"
                placeholderText: card.t("assembly.key_placeholder")
                colorText: MetaTheme.textPrimary
                colorBg: MetaTheme.surfaceSoft
                borderBg.color: MetaTheme.cardBorder
                enabled: !AssemblyController.isBusy
                contentDescription: card.t("assembly.launch_key")
                maximumLength: 20
                Component.onCompleted: if (card.state.launchKeys && card.state.launchKeys.length) text = card.state.launchKeys[0];
            }
        }
        HusCheckBox {
            id: keysChoice
            objectName: "moduleKeys_" + card.moduleId
            text: card.t(card.isMode ? "assembly.keys_on_enter" : "assembly.include_keys")
            enabled: !AssemblyController.isBusy
            effectEnabled: false
            colorText: MetaTheme.textPrimary
            colorIndicator: checked ? MetaTheme.starkBlack : MetaTheme.cardBg
            colorIndicatorBorder: checked ? MetaTheme.primaryColor : MetaTheme.btnDefaultBorder
        }
        Rectangle {
            Layout.fillWidth: true
            implicitHeight: 32
            color: MetaTheme.surfaceSoft
            radius: MetaTheme.radiusMd
            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 10; anchors.rightMargin: 4
                Text {
                    Layout.fillWidth: true
                    text: (card.state.command || "") + (keysChoice.checked ? "_keys" : "")
                    font.family: "Consolas"
                    font.pixelSize: 11
                    color: MetaTheme.textSecondary
                    elide: Text.ElideRight
                }
                AppButton {
                    iconSource: HusIcon.CopyOutlined
                    sizeHint: "small"
                    type: HusButton.Type_Text
                    contentDescription: card.t("valve.copy")
                    onClicked: {
                        OverviewController.copyToClipboard((card.state.command || "") + (keysChoice.checked ? "_keys" : ""));
                        AppFeedback.success(card.t("valve.copied"));
                    }
                }
            }
        }
        Flow {
            Layout.fillWidth: true
            spacing: 6
            AppButton {
                text: card.t("assembly.edit_keys")
                sizeHint: "small"
                iconSource: HusIcon.EditOutlined
                onClicked: AssemblyController.openFile(card.state.directory + "/keymap.cfg")
            }
            AppButton {
                visible: card.isMode
                text: card.t("assembly.view_settings")
                sizeHint: "small"
                onClicked: AssemblyController.openFile(card.state.directory + "/settings.cfg")
            }
        }
        Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: MetaTheme.divider }
        RowLayout {
            Layout.fillWidth: true
            spacing: 8
            AppButton {
                objectName: "moduleAdd_" + card.moduleId
                Layout.fillWidth: true
                Layout.preferredHeight: 34
                text: card.t(card.isMode ? "assembly.bind" : "valve.assemble")
                iconSource: HusIcon.CheckOutlined
                type: HusButton.Type_Primary
                enabled: !AssemblyController.isBusy && (!card.isMode || launchKey.text.trim().length > 0)
                onClicked: {
                    if (card.isMode) AssemblyController.requestMode(card.moduleId, launchKey.text, keysChoice.checked);
                    else AssemblyController.requestFeature(card.moduleId, keysChoice.checked);
                }
            }
            AppButton {
                objectName: "moduleRemove_" + card.moduleId
                Layout.fillWidth: true
                Layout.preferredHeight: 34
                text: card.t(card.isMode ? "assembly.remove_entry" : "valve.unload")
                enabled: !AssemblyController.isBusy && (card.state.settings || card.state.keymap)
                onClicked: {
                    if (card.isMode) AssemblyController.requestMode(card.moduleId, "", false, true);
                    else AssemblyController.requestFeature(card.moduleId, false, true);
                }
            }
        }
    }
}
