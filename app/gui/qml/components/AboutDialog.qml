import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui

AppDialog {
    id: dialog
    objectName: "aboutDialog"
    function t(key) { return OverviewController.tr(key, OverviewController.currentLang); }
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
        spacing: 20
        RowLayout {
            Layout.fillWidth: true
            Text { font.family: MetaTheme.fontFamily; text: dialog.t("nav.about"); font.pixelSize: 24; font.bold: true; color: MetaTheme.textPrimary; Layout.fillWidth: true }
            AppButton { objectName: "aboutCloseTop"; iconSource: HusIcon.CloseOutlined; Accessible.name: dialog.t("dialog.close"); onClicked: dialog.close() }
        }
        Rectangle {
            Layout.fillWidth: true
            implicitHeight: hero.implicitHeight + 32
            color: MetaTheme.surfaceSoft
            radius: MetaTheme.radiusLg
            RowLayout {
                id: hero
                anchors.fill: parent
                anchors.margins: 16
                spacing: 16
                Image { source: "qrc:/SrPGui/resources/icon.png"; Layout.preferredWidth: 56; Layout.preferredHeight: 56; fillMode: Image.PreserveAspectFit; mipmap: true }
                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 8
                    RowLayout {
                        Layout.fillWidth: true
                        Text { font.family: MetaTheme.fontFamily; text: "SrP-CFG"; font.pixelSize: 19; font.bold: true; color: MetaTheme.textPrimary }
                        Text { font.family: MetaTheme.fontFamily; text: "v" + AppUpdateController.version; font.pixelSize: 12; color: MetaTheme.textSecondary }
                        Item { Layout.fillWidth: true }
                    }
                    Text { font.family: MetaTheme.fontFamily; text: dialog.t("about.description"); Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: 12; color: MetaTheme.textSecondary }
                }
            }
        }
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 8
            RowLayout {
                Layout.fillWidth: true
                Text { font.family: MetaTheme.fontFamily; text: dialog.t("about.software_update"); font.pixelSize: 13; font.bold: true; color: MetaTheme.textPrimary; Layout.fillWidth: true }
                AppButton { objectName: "appUpdateCheck"; text: AppUpdateController.busy ? dialog.t("appupdate.checking") : dialog.t("pkg.check"); iconSource: HusIcon.ReloadOutlined; enabled: !AppUpdateController.busy; onClicked: AppUpdateController.check() }
            }
            Text { font.family: MetaTheme.fontFamily; objectName: "appUpdateStatus"; text: AppUpdateController.status + (AppUpdateController.latestVersion ? " · v" + AppUpdateController.latestVersion : ""); Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: 12; color: AppUpdateController.updateAvailable ? MetaTheme.statusSuccess : MetaTheme.textSecondary }
            Text { font.family: MetaTheme.fontFamily; visible: AppUpdateController.updateAvailable && text.length > 0; text: AppUpdateController.releaseNotes; Layout.fillWidth: true; Layout.maximumHeight: 58; maximumLineCount: 3; elide: Text.ElideRight; wrapMode: Text.WordWrap; font.pixelSize: 12; color: MetaTheme.textTertiary }
            RowLayout {
                visible: AppUpdateController.updateAvailable
                Layout.fillWidth: true
                AppButton { text: dialog.t("about.download_website"); type: HusButton.Type_Primary; onClicked: AppUpdateController.openLink("website") }
                AppButton { text: "GitHub Releases"; onClicked: AppUpdateController.openLink("releases") }
            }
        }
        Rectangle { Layout.fillWidth: true; height: 1; color: MetaTheme.divider }
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 10
            RowLayout {
                Layout.fillWidth: true
                Text { font.family: MetaTheme.fontFamily; text: dialog.t("about.author"); Layout.preferredWidth: OverviewController.currentLang === "en" ? 82 : 58; font.pixelSize: 12; color: MetaTheme.textTertiary }
                Text { font.family: MetaTheme.fontFamily; text: "RoL1n_SrP"; Layout.fillWidth: true; font.pixelSize: 12; color: MetaTheme.textPrimary }
            }
            Repeater {
                model: [
                    { label: dialog.t("about.website"), url: AppUpdateController.website, kind: "website" },
                    { label: dialog.t("about.blog"), url: AppUpdateController.blog, kind: "blog" },
                    { label: dialog.t("about.project"), url: AppUpdateController.project, kind: "project" }
                ]
                RowLayout {
                    required property var modelData
                    Layout.fillWidth: true
                    Text { font.family: MetaTheme.fontFamily; text: modelData.label; Layout.preferredWidth: OverviewController.currentLang === "en" ? 82 : 58; font.pixelSize: 12; color: MetaTheme.textTertiary }
                    Text { font.family: MetaTheme.fontFamily; text: modelData.url.replace("https://", ""); Layout.fillWidth: true; elide: Text.ElideMiddle; font.pixelSize: 12; color: MetaTheme.textPrimary; HusToolTip { text: parent.text } }
                    AppButton { objectName: "aboutLink_" + modelData.kind; text: dialog.t("about.visit"); iconSource: HusIcon.ExportOutlined; onClicked: AppUpdateController.openLink(modelData.kind) }
                }
            }
            RowLayout {
                Layout.fillWidth: true
                Text { font.family: MetaTheme.fontFamily; text: dialog.t("about.architecture"); Layout.preferredWidth: OverviewController.currentLang === "en" ? 82 : 58; font.pixelSize: 12; color: MetaTheme.textTertiary }
                Text { font.family: MetaTheme.fontFamily; text: dialog.t("about.architecture_detail"); Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: 12; color: MetaTheme.textSecondary }
            }
        }
        RowLayout { Layout.fillWidth: true; Item { Layout.fillWidth: true } AppButton { objectName: "aboutClose"; text: dialog.t("dialog.close"); onClicked: dialog.close() } }
        }
    }
}
