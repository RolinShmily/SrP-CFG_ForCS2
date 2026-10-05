import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui

AppDialog {
    id: dialog
    objectName: "settingsDialog"
    property string draftLanguage: "zh"
    property string draftFont: ""
    function t(key) { return OverviewController.tr(key, OverviewController.currentLang); }
    function refreshFonts() {
        const choices = PreferencesController.fontChoices(fontSearch.text);
        fontSelect.model = choices;
        let selected = -1;
        for (let i=0; i<choices.length; ++i) if (choices[i].value === draftFont) selected = i;
        fontSelect.currentIndex = selected;
    }
    onAboutToShow: {
        draftLanguage = PreferencesController.language;
        draftFont = PreferencesController.fontFamily;
        fontSearch.text = "";
        refreshFonts();
    }
    contentItem: Flickable {
        implicitHeight: body.implicitHeight
        contentWidth: width
        contentHeight: body.implicitHeight
        clip: true
        boundsBehavior: Flickable.StopAtBounds
        ScrollBar.vertical: HusScrollBar {}
        ColumnLayout {
        id: body
        width: parent.width
        spacing: 24
        RowLayout {
            Layout.fillWidth: true
            Text { font.family: MetaTheme.fontFamily; text: dialog.t("nav.settings"); font.pixelSize: 24; font.bold: true; color: MetaTheme.textPrimary; Layout.fillWidth: true }
            AppButton { objectName: "settingsCloseTop"; iconSource: HusIcon.CloseOutlined; Accessible.name: dialog.t("dialog.close"); onClicked: dialog.close() }
        }
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 10
            Text { font.family: MetaTheme.fontFamily; text: dialog.t("preferences.language"); font.pixelSize: 13; font.bold: true; color: MetaTheme.textPrimary }
            RowLayout {
                Layout.fillWidth: true
                spacing: 8
                AppButton { objectName: "languageZh"; Layout.fillWidth: true; text: "简体中文"; type: dialog.draftLanguage === "zh" ? HusButton.Type_Primary : HusButton.Type_Default; onClicked: dialog.draftLanguage = "zh" }
                AppButton { objectName: "languageEn"; Layout.fillWidth: true; text: "English"; type: dialog.draftLanguage === "en" ? HusButton.Type_Primary : HusButton.Type_Default; onClicked: dialog.draftLanguage = "en" }
            }
        }
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 10
            Text { font.family: MetaTheme.fontFamily; text: dialog.t("preferences.font"); font.pixelSize: 13; font.bold: true; color: MetaTheme.textPrimary }
            HusInput {
                id: fontSearch
                objectName: "fontSearch"
                Layout.fillWidth: true
                placeholderText: dialog.t("preferences.search_font")
                iconSource: HusIcon.SearchOutlined
                colorBg: MetaTheme.surfaceSoft
                colorText: MetaTheme.textPrimary
                onTextChanged: dialog.refreshFonts()
            }
            HusSelect {
                id: fontSelect
                objectName: "fontSelect"
                Layout.fillWidth: true
                clearEnabled: false
                textRole: "label"
                valueRole: "value"
                placeholderText: dialog.draftFont.length ? dialog.draftFont : dialog.t("preferences.system_font")
                colorBg: MetaTheme.surfaceSoft
                colorText: MetaTheme.textPrimary
                onActivated: (index) => { dialog.draftFont = model[index].value; }
            }
            Text { font.family: MetaTheme.fontFamily; text: dialog.t("preferences.font_note"); Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: 12; color: MetaTheme.textTertiary }
        }
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 10
            Text { font.family: MetaTheme.fontFamily; text: dialog.t("preferences.store"); font.pixelSize: 13; font.bold: true; color: MetaTheme.textPrimary }
            RowLayout {
                Layout.fillWidth: true
                HusInput {
                    objectName: "storePath"
                    Layout.fillWidth: true
                    readOnly: true
                    text: PreferencesController.storePath
                    colorBg: MetaTheme.surfaceSoft
                    colorText: MetaTheme.textSecondary
                    selectByMouse: true
                    HusToolTip { text: PreferencesController.storePath }
                }
                AppButton { objectName: "openStore"; text: dialog.t("preferences.open_store"); iconSource: HusIcon.FolderOpenOutlined; onClicked: PreferencesController.openStore() }
            }
            Text { font.family: MetaTheme.fontFamily; text: dialog.t("preferences.store_note"); Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: 12; color: MetaTheme.textTertiary }
        }
        RowLayout {
            Layout.fillWidth: true
            spacing: 8
            Item { Layout.fillWidth: true }
            AppButton { objectName: "settingsCancel"; text: dialog.t("dialog.cancel"); onClicked: dialog.close() }
            AppButton { objectName: "settingsSave"; text: dialog.t("dialog.save"); type: HusButton.Type_Primary; onClicked: { if (PreferencesController.save(dialog.draftLanguage, dialog.draftFont)) dialog.close(); } }
        }
        }
    }
}
