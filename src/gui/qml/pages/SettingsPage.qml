import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui

Item {
    id: page
    objectName: "settingsPage"
    property string draftLanguage: "zh"
    property string draftFont: ""
    readonly property bool dirty: draftLanguage !== PreferencesController.language
                                   || draftFont !== PreferencesController.fontFamily
    function t(key) { return OverviewController.tr(key, OverviewController.currentLang); }
    function refreshFonts() {
        const choices = PreferencesController.fontChoices(fontSearch.text);
        fontSelect.model = choices;
        let selected = -1;
        for (let i = 0; i < choices.length; ++i) if (choices[i].value === draftFont) selected = i;
        fontSelect.currentIndex = selected;
    }
    function reloadDraft() {
        if (!fontSearch || !fontSelect) return;
        draftLanguage = PreferencesController.language;
        draftFont = PreferencesController.fontFamily;
        fontSearch.text = "";
        refreshFonts();
    }
    Shortcut {
        sequence: "Ctrl+S"
        enabled: page.visible && page.dirty
        onActivated: { if (PreferencesController.save(page.draftLanguage, page.draftFont)) page.reloadDraft(); }
    }
    Component.onCompleted: reloadDraft()
    onVisibleChanged: { if (visible) reloadDraft(); }

    Flickable {
        anchors.fill: parent
        contentWidth: width
        contentHeight: body.implicitHeight + 48
        clip: true
        boundsBehavior: Flickable.StopAtBounds
        ScrollBar.vertical: HusScrollBar {}

        ColumnLayout {
            id: body
            width: Math.min(parent.width - 48, 920)
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: parent.top
            anchors.topMargin: 24
            spacing: 16

            ColumnLayout {
                Layout.fillWidth: true
                spacing: 4
                RowLayout {
                    Layout.fillWidth: true
                    Text { font.family: MetaTheme.fontFamily; text: page.t("nav.settings"); font.pixelSize: 22; font.bold: true; color: MetaTheme.textPrimary; Layout.fillWidth: true }
                    Text { font.family: MetaTheme.fontFamily; visible: page.dirty; text: page.t("preferences.dirty"); font.pixelSize: 11; color: MetaTheme.statusWarning }
                }
                Text { font.family: MetaTheme.fontFamily; text: page.t("preferences.subtitle"); font.pixelSize: 12; color: MetaTheme.textSecondary; wrapMode: Text.WordWrap; Layout.fillWidth: true }
            }

            Rectangle {
                Layout.fillWidth: true
                implicitHeight: languageBody.implicitHeight + 32
                color: MetaTheme.cardBg
                border.color: MetaTheme.cardBorder
                border.width: 1
                radius: MetaTheme.radiusLg

                ColumnLayout {
                    id: languageBody
                    anchors.left: parent.left
                    anchors.right: parent.right
                    anchors.top: parent.top
                    anchors.margins: 16
                    spacing: 10

                    Text { font.family: MetaTheme.fontFamily; text: page.t("preferences.language"); font.pixelSize: 13; font.bold: true; color: MetaTheme.textPrimary }
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 8
                        AppButton { objectName: "languageZh"; Layout.fillWidth: true; text: "简体中文"; type: page.draftLanguage === "zh" ? HusButton.Type_Primary : HusButton.Type_Default; onClicked: page.draftLanguage = "zh" }
                        AppButton { objectName: "languageEn"; Layout.fillWidth: true; text: "English"; type: page.draftLanguage === "en" ? HusButton.Type_Primary : HusButton.Type_Default; onClicked: page.draftLanguage = "en" }
                    }
                }
            }

            Rectangle {
                Layout.fillWidth: true
                implicitHeight: themeBody.implicitHeight + 32
                color: MetaTheme.cardBg
                border.color: MetaTheme.cardBorder
                border.width: 1
                radius: MetaTheme.radiusLg

                ColumnLayout {
                    id: themeBody
                    anchors.left: parent.left
                    anchors.right: parent.right
                    anchors.top: parent.top
                    anchors.margins: 16
                    spacing: 10

                    Text { font.family: MetaTheme.fontFamily; text: page.t("preferences.theme"); font.pixelSize: 13; font.bold: true; color: MetaTheme.textPrimary }
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 8
                        AppButton { objectName: "themeLight"; Layout.fillWidth: true; text: page.t("preferences.theme_light"); type: !PreferencesController.darkMode ? HusButton.Type_Primary : HusButton.Type_Default; onClicked: PreferencesController.setDarkMode(false) }
                        AppButton { objectName: "themeDark"; Layout.fillWidth: true; text: page.t("preferences.theme_dark"); type: PreferencesController.darkMode ? HusButton.Type_Primary : HusButton.Type_Default; onClicked: PreferencesController.setDarkMode(true) }
                    }
                }
            }

            Rectangle {
                Layout.fillWidth: true
                implicitHeight: fontBody.implicitHeight + 32
                color: MetaTheme.cardBg
                border.color: MetaTheme.cardBorder
                border.width: 1
                radius: MetaTheme.radiusLg

                ColumnLayout {
                    id: fontBody
                    anchors.left: parent.left
                    anchors.right: parent.right
                    anchors.top: parent.top
                    anchors.margins: 16
                    spacing: 10

                    Text { font.family: MetaTheme.fontFamily; text: page.t("preferences.font"); font.pixelSize: 13; font.bold: true; color: MetaTheme.textPrimary }
                    HusInput {
                        id: fontSearch
                        objectName: "fontSearch"
                        Layout.fillWidth: true
                        placeholderText: page.t("preferences.search_font")
                        iconSource: HusIcon.SearchOutlined
                        colorBg: MetaTheme.surfaceSoft
                        colorText: MetaTheme.textPrimary
                        onTextChanged: page.refreshFonts()
                    }
                    HusSelect {
                        id: fontSelect
                        objectName: "fontSelect"
                        Layout.fillWidth: true
                        clearEnabled: false
                        textRole: "label"
                        valueRole: "value"
                        placeholderText: page.draftFont.length ? page.draftFont : page.t("preferences.system_font")
                        colorBg: MetaTheme.surfaceSoft
                        colorText: MetaTheme.textPrimary
                        onActivated: (index) => { page.draftFont = model[index].value; }
                    }
                    Text { font.family: MetaTheme.fontFamily; text: page.t("preferences.font_note"); Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: 12; color: MetaTheme.textTertiary }
                }
            }

            Rectangle {
                Layout.fillWidth: true
                implicitHeight: storeBody.implicitHeight + 32
                color: MetaTheme.cardBg
                border.color: MetaTheme.cardBorder
                border.width: 1
                radius: MetaTheme.radiusLg

                ColumnLayout {
                    id: storeBody
                    anchors.left: parent.left
                    anchors.right: parent.right
                    anchors.top: parent.top
                    anchors.margins: 16
                    spacing: 10

                    Text { font.family: MetaTheme.fontFamily; text: page.t("preferences.store"); font.pixelSize: 13; font.bold: true; color: MetaTheme.textPrimary }
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 8
                        HusInput {
                            objectName: "storePath"
                            Layout.fillWidth: true
                            readOnly: true
                            selectByMouse: true
                            onTextChanged: cursorPosition = 0
                            text: PreferencesController.storePath
                            colorBg: MetaTheme.surfaceSoft
                            colorText: MetaTheme.textSecondary
                            HusToolTip { text: PreferencesController.storePath }
                        }
                        AppButton { objectName: "openStore"; text: page.t("preferences.open_store"); iconSource: HusIcon.FolderOpenOutlined; onClicked: PreferencesController.openStore() }
                    }
                    Text { font.family: MetaTheme.fontFamily; text: page.t("preferences.store_note"); Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: 12; color: MetaTheme.textTertiary }
                }
            }

            RowLayout {
                Layout.fillWidth: true
                spacing: 8
                Item { Layout.fillWidth: true }
                AppButton {
                    objectName: "settingsCancel"
                    text: page.t("preferences.revert")
                    enabled: page.dirty
                    onClicked: page.reloadDraft()
                }
                AppButton {
                    objectName: "settingsSave"
                    text: page.t("dialog.save")
                    type: HusButton.Type_Primary
                    enabled: page.dirty
                    onClicked: { if (PreferencesController.save(page.draftLanguage, page.draftFont)) page.reloadDraft(); }
                }
            }

            Item { Layout.fillHeight: true }
        }
    }
}
