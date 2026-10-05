import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui
import "../components"

Item {
    id: page
    function t(key) { return OverviewController.tr(key, OverviewController.currentLang); }
    RowLayout {
        anchors.fill: parent
        anchors.margins: 24
        spacing: 16
        Flickable {
            id: scroll
            objectName: "videoOperationsScroll"
            Layout.preferredWidth: Math.max(300, Math.min(490, page.width * 0.37))
            Layout.fillHeight: true
            contentWidth: width
            contentHeight: content.implicitHeight
            boundsBehavior: Flickable.StopAtBounds
            clip: true
            ScrollBar.vertical: HusScrollBar {}
            ColumnLayout {
                id: content
                width: scroll.width - 8
                spacing: 14
                Text { font.family: MetaTheme.fontFamily; text: page.t("video.title"); font.pixelSize: 22; font.bold: true; color: MetaTheme.textPrimary }
                PackagePanel { Layout.fillWidth: true; packageId: "video" }
                Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: actions.implicitHeight + 28
                    color: MetaTheme.cardBg
                    border.color: MetaTheme.cardBorder
                    radius: MetaTheme.radiusLg
                    ColumnLayout {
                        id: actions
                        anchors.left: parent.left; anchors.right: parent.right; anchors.top: parent.top
                        anchors.margins: 14
                        spacing: 10
                        Text { font.family: MetaTheme.fontFamily;
                            Layout.fillWidth: true
                            text: page.t("video.target").arg(OverviewController.currentUserName || "—")
                            color: MetaTheme.textPrimary
                            font.pixelSize: 12
                            elide: Text.ElideRight
                        }
                        Text { font.family: MetaTheme.fontFamily; Layout.fillWidth: true; text: page.t("video.merge_note"); color: MetaTheme.textTertiary; font.pixelSize: 11; wrapMode: Text.WordWrap }
                        AppButton {
                            objectName: "videoApplyButton"
                            Layout.fillWidth: true
                            text: page.t("video.apply")
                            type: HusButton.Type_Primary
                            iconSource: HusIcon.CheckOutlined
                            enabled: !PackageController.busy && !VideoController.validationError.length && OverviewController.userCfgPath.length > 0
                            onClicked: VideoController.applyVideo()
                        }
                    }
                }
                Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: form.implicitHeight + 32
                    color: MetaTheme.cardBg
                    border.color: MetaTheme.cardBorder
                    radius: MetaTheme.radiusLg
                    ColumnLayout {
                        id: form
                        anchors.left: parent.left; anchors.right: parent.right; anchors.top: parent.top
                        anchors.margins: 16
                        spacing: 10
                        Repeater {
                            model: VideoController.optionCount
                            ColumnLayout {
                                required property int index
                                property var row: VideoController.options[index]
                                Layout.fillWidth: true
                                spacing: 4
                                Text { font.family: MetaTheme.fontFamily; text: parent.row.label; color: MetaTheme.textSecondary; font.pixelSize: 11 }
                                HusSelect {
                                    objectName: "videoOption_" + parent.row.key
                                    Layout.fillWidth: true
                                    model: parent.row.choices
                                    currentIndex: parent.row.index
                                    textRole: "label"
                                    valueRole: "value"
                                    sizeHint: "small"
                                    clearEnabled: false
                                    contentDescription: parent.row.label
                                    enabled: !PackageController.busy && !VideoController.validationError.length
                                    onActivated: (i) => VideoController.setOption(parent.row.key, parent.row.choices[i].value)
                                }
                            }
                        }
                    }
                }

            }
        }
        MediaEditorPanel {
            Layout.fillWidth: true
            Layout.fillHeight: true
            controller: VideoController
            pageVisible: page.visible
        }
    }
}
