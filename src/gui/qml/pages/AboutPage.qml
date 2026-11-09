import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui

Item {
    id: page
    objectName: "aboutPage"
    function t(key) { return OverviewController.tr(key, OverviewController.currentLang); }

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
                Text { font.family: MetaTheme.fontFamily; text: page.t("nav.about"); font.pixelSize: 22; font.bold: true; color: MetaTheme.textPrimary }
                Text { font.family: MetaTheme.fontFamily; text: page.t("about.subtitle"); font.pixelSize: 12; color: MetaTheme.textSecondary; wrapMode: Text.WordWrap; Layout.fillWidth: true }
            }

            Rectangle {
                Layout.fillWidth: true
                implicitHeight: hero.implicitHeight + 36
                color: MetaTheme.cardBg
                border.color: MetaTheme.cardBorder
                border.width: 1
                radius: MetaTheme.radiusLg

                RowLayout {
                    id: hero
                    anchors.left: parent.left
                    anchors.right: parent.right
                    anchors.top: parent.top
                    anchors.margins: 18
                    spacing: 18

                    Image {
                        source: "qrc:/SrPGui/resources/icon.png"
                        Layout.preferredWidth: 64
                        Layout.preferredHeight: 64
                        fillMode: Image.PreserveAspectFit
                        mipmap: true
                    }

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 7

                        RowLayout {
                            Layout.fillWidth: true
                            Text { font.family: MetaTheme.fontFamily; text: "SrP-CFG"; font.pixelSize: 20; font.bold: true; color: MetaTheme.textPrimary }
                            Text { font.family: MetaTheme.fontFamily; text: "v" + AppUpdateController.version; font.pixelSize: 12; color: MetaTheme.textSecondary }
                            Item { Layout.fillWidth: true }
                        }

                        Text { font.family: MetaTheme.fontFamily; text: page.t("about.description"); Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: 12; color: MetaTheme.textSecondary }
                        Text { font.family: MetaTheme.fontFamily; text: page.t("about.architecture") + " · " + page.t("about.architecture_detail"); Layout.fillWidth: true; wrapMode: Text.WordWrap; font.pixelSize: 11; color: MetaTheme.textTertiary }
                    }
                }
            }

            Rectangle {
                Layout.fillWidth: true
                implicitHeight: updateBody.implicitHeight + 32
                color: MetaTheme.cardBg
                border.color: MetaTheme.cardBorder
                border.width: 1
                radius: MetaTheme.radiusLg

                ColumnLayout {
                    id: updateBody
                    anchors.left: parent.left
                    anchors.right: parent.right
                    anchors.top: parent.top
                    anchors.margins: 16
                    spacing: 10

                    RowLayout {
                        Layout.fillWidth: true
                        Text { font.family: MetaTheme.fontFamily; text: page.t("about.software_update"); font.pixelSize: 13; font.bold: true; color: MetaTheme.textPrimary; Layout.fillWidth: true }
                        AppButton {
                            objectName: "appUpdateCheck"
                            text: AppUpdateController.busy ? page.t("appupdate.checking") : page.t("pkg.check")
                            iconSource: HusIcon.ReloadOutlined
                            enabled: !AppUpdateController.busy
                            onClicked: AppUpdateController.check()
                        }
                    }

                    Text {
                        objectName: "appUpdateStatus"
                        font.family: MetaTheme.fontFamily
                        text: AppUpdateController.status + (AppUpdateController.latestVersion ? " · v" + AppUpdateController.latestVersion : "")
                        Layout.fillWidth: true
                        wrapMode: Text.WordWrap
                        font.pixelSize: 12
                        color: AppUpdateController.updateAvailable ? MetaTheme.statusSuccess : MetaTheme.textSecondary
                    }

                    Text {
                        font.family: MetaTheme.fontFamily
                        visible: AppUpdateController.updateAvailable && text.length > 0
                        text: AppUpdateController.releaseNotes
                        Layout.fillWidth: true
                        Layout.maximumHeight: 58
                        maximumLineCount: 3
                        elide: Text.ElideRight
                        wrapMode: Text.WordWrap
                        font.pixelSize: 12
                        color: MetaTheme.textTertiary
                    }

                    RowLayout {
                        visible: AppUpdateController.updateAvailable
                        Layout.fillWidth: true
                        spacing: 8
                        AppButton { text: page.t("about.download_website"); type: HusButton.Type_Primary; onClicked: AppUpdateController.openLink("website") }
                        AppButton { text: "GitHub Releases"; onClicked: AppUpdateController.openLink("releases") }
                    }
                }
            }

            Rectangle {
                Layout.fillWidth: true
                implicitHeight: linksBody.implicitHeight + 32
                color: MetaTheme.cardBg
                border.color: MetaTheme.cardBorder
                border.width: 1
                radius: MetaTheme.radiusLg

                ColumnLayout {
                    id: linksBody
                    anchors.left: parent.left
                    anchors.right: parent.right
                    anchors.top: parent.top
                    anchors.margins: 16
                    spacing: 10

                    Text { font.family: MetaTheme.fontFamily; text: page.t("about.links"); font.pixelSize: 13; font.bold: true; color: MetaTheme.textPrimary }

                    Repeater {
                        model: [
                            { label: page.t("about.website"), url: AppUpdateController.website, kind: "website" },
                            { label: page.t("about.blog"), url: AppUpdateController.blog, kind: "blog" },
                            { label: page.t("about.project"), url: AppUpdateController.project, kind: "project" }
                        ]
                        RowLayout {
                            required property var modelData
                            Layout.fillWidth: true
                            spacing: 10
                            Text { font.family: MetaTheme.fontFamily; text: modelData.label; Layout.preferredWidth: 96; font.pixelSize: 12; color: MetaTheme.textTertiary }
                            Text { font.family: MetaTheme.fontFamily; text: modelData.url.replace("https://", ""); Layout.fillWidth: true; elide: Text.ElideMiddle; font.pixelSize: 12; color: MetaTheme.textPrimary; HusToolTip { text: parent.text } }
                            AppButton { objectName: "aboutLink_" + modelData.kind; text: page.t("about.visit"); iconSource: HusIcon.ExportOutlined; onClicked: AppUpdateController.openLink(modelData.kind) }
                        }
                    }

                    HusDivider { Layout.fillWidth: true; Layout.preferredHeight: 1; colorSplit: MetaTheme.divider; animationEnabled: HusTheme.animationEnabled }

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 10
                        Text { font.family: MetaTheme.fontFamily; text: page.t("about.author"); Layout.preferredWidth: 96; font.pixelSize: 12; color: MetaTheme.textTertiary }
                        Text { font.family: MetaTheme.fontFamily; text: "RoL1n_SrP"; Layout.fillWidth: true; font.pixelSize: 12; color: MetaTheme.textPrimary }
                    }

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 10
                        Text { font.family: MetaTheme.fontFamily; text: page.t("about.license"); Layout.preferredWidth: 96; font.pixelSize: 12; color: MetaTheme.textTertiary }
                        Text { font.family: MetaTheme.fontFamily; text: page.t("about.license_name"); Layout.fillWidth: true; font.pixelSize: 12; color: MetaTheme.textPrimary }
                        AppButton { text: page.t("about.visit"); iconSource: HusIcon.ExportOutlined; onClicked: Qt.openUrlExternally(AppUpdateController.project + "/blob/main/LICENSE") }
                    }
                }
            }

            Item { Layout.fillHeight: true }
        }
    }
}
