import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui
import "../components"

Item {
    id: page
    property var selection: []
    function t(key) { return OverviewController.tr(key, OverviewController.currentLang); }
    function guideState(id) {
        for (let guide of AnnotationsController.guides) if (guide.id === id) return guide;
        return {id:id,name:id,installed:false,matches:false,command:""};
    }
    function selectMap(id, checked) {
        let next = selection.filter(x => x !== id);
        if (checked) next.push(id);
        selection = next;
    }
    Connections { target: AnnotationsController; function onActionCompleted() { page.selection = []; } }
    RowLayout {
        anchors.fill: parent
        anchors.margins: 24
        spacing: 16
        Flickable {
            id: scroll
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
                Text { font.family: MetaTheme.fontFamily; text: page.t("annotations.title"); font.pixelSize: 22; font.bold: true; color: MetaTheme.textPrimary }
                PackagePanel { Layout.fillWidth: true; packageId: "annotations" }
                Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: maps.implicitHeight + 32
                    color: MetaTheme.cardBg
                    border.color: MetaTheme.cardBorder
                    radius: MetaTheme.radiusLg
                    ColumnLayout {
                        id: maps
                        anchors.left: parent.left; anchors.right: parent.right; anchors.top: parent.top
                        anchors.margins: 16
                        spacing: 12
                        Repeater {
                            model: AnnotationsController.guideIds
                            ColumnLayout {
                                required property int index
                                required property string modelData
                                property var guide: page.guideState(modelData)
                                Layout.fillWidth: true
                                spacing: 6
                                RowLayout {
                                    Layout.fillWidth: true
                                    HusCheckBox {
                                        objectName: "guideChoice_" + parent.parent.guide.id
                                        text: parent.parent.guide.name
                                        colorText: MetaTheme.textPrimary
                                        colorIndicator: checked ? MetaTheme.starkBlack : MetaTheme.cardBg
                                        checked: page.selection.indexOf(parent.parent.guide.id) >= 0
                                        onClicked: page.selectMap(parent.parent.guide.id, checked)
                                    }
                                    Item { Layout.fillWidth: true }
                                    Text { font.family: MetaTheme.fontFamily;
                                        text: page.t(parent.parent.guide.installed ? (parent.parent.guide.matches ? "annotations.installed" : "annotations.different") : "annotations.not_installed")
                                        color: parent.parent.guide.installed ? MetaTheme.statusSuccess : MetaTheme.textTertiary
                                        font.pixelSize: 10
                                    }
                                }
                                RowLayout {
                                    Layout.fillWidth: true
                                    AppButton {
                                        text: page.t("annotations.edit")
                                        iconSource: HusIcon.EditOutlined
                                        sizeHint: "small"
                                        onClicked: AnnotationsController.setSelectedFileIndex(parent.parent.index)
                                    }
                                    AppButton {
                                        objectName: "guideCopy_" + parent.parent.guide.id
                                        text: page.t("annotations.load")
                                        iconSource: HusIcon.CopyOutlined
                                        sizeHint: "small"
                                        onClicked: HusApi.setClipboardText(parent.parent.guide.command)
                                        HusToolTip { text: parent.parent.parent.guide.command }
                                    }
                                }
                                Rectangle { Layout.fillWidth: true; height: 1; color: MetaTheme.divider }
                            }
                        }
                        RowLayout {
                            Layout.fillWidth: true
                            AppButton {
                                objectName: "annotationDeployButton"
                                Layout.fillWidth: true
                                text: page.t("valve.assemble")
                                type: HusButton.Type_Primary
                                iconSource: HusIcon.CheckOutlined
                                enabled: page.selection.length > 0 && !PackageController.busy
                                onClicked: AnnotationsController.deployGuides(page.selection, false)
                            }
                            AppButton {
                                Layout.fillWidth: true
                                text: page.t("valve.unload")
                                iconSource: HusIcon.DeleteOutlined
                                enabled: page.selection.length > 0 && !PackageController.busy
                                onClicked: removeModal.openWarning()
                            }
                        }
                        Text { font.family: MetaTheme.fontFamily; Layout.fillWidth: true; text: page.t("annotations.note"); font.pixelSize: 11; color: MetaTheme.textTertiary; wrapMode: Text.WordWrap }
                    }
                }
            }
        }
        MediaEditorPanel { Layout.fillWidth: true; Layout.fillHeight: true; controller: AnnotationsController; pageVisible: page.visible }
    }
    AppModal {
        id: removeModal
        title: page.t("annotations.remove_title")
        description: page.t("annotations.remove_desc")
        confirmText: page.t("valve.unload")
        cancelText: page.t("valve.cancel")
        onConfirm: { close(); AnnotationsController.deployGuides(page.selection, true); }
        onCancel: close()
    }
}
