import QtQuick
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui

Rectangle {
    id: panel
    property string packageId: ""
    property var info: {
        for (let item of PackageController.packages) if (item.id === packageId) return item;
        return { version: "", latest: "", updateAvailable: false };
    }
    function t(key) { return OverviewController.tr(key, OverviewController.currentLang); }
    implicitHeight: body.implicitHeight + 28
    color: MetaTheme.cardBg
    border.color: MetaTheme.cardBorder
    radius: MetaTheme.radiusLg
    ColumnLayout {
        id: body
        anchors.left: parent.left; anchors.right: parent.right; anchors.top: parent.top
        anchors.margins: 14
        spacing: 10
        RowLayout {
            Layout.fillWidth: true
            Text { font.family: MetaTheme.fontFamily; text: panel.packageId; font.bold: true; font.pixelSize: 13; color: MetaTheme.textPrimary }
            Item { Layout.fillWidth: true }
            Text { font.family: MetaTheme.fontFamily; text: panel.t("pkg.local") + " · v" + panel.info.version; font.pixelSize: 11; color: MetaTheme.textSecondary }
        }
        Text { font.family: MetaTheme.fontFamily;
            visible: panel.info.latest.length > 0
            text: panel.t("pkg.latest") + " · v" + panel.info.latest
            font.pixelSize: 11
            color: panel.info.updateAvailable ? MetaTheme.statusWarning : MetaTheme.textSecondary
        }
        RowLayout {
            Layout.fillWidth: true
            AppButton {
                Layout.fillWidth: true
                text: panel.t("pkg.check")
                sizeHint: "small"
                iconSource: HusIcon.SyncOutlined
                enabled: !PackageController.busy
                loading: PackageController.busy
                onClicked: PackageController.checkUpdates()
            }
            AppButton {
                Layout.fillWidth: true
                text: panel.t("pkg.update")
                sizeHint: "small"
                type: panel.info.updateAvailable ? HusButton.Type_Primary : HusButton.Type_Default
                iconSource: HusIcon.DownloadOutlined
                enabled: !PackageController.busy
                onClicked: PackageController.updatePackage(panel.packageId)
            }
        }
        Text { font.family: MetaTheme.fontFamily;
            visible: PackageController.status.length > 0
            Layout.fillWidth: true
            text: panel.t(PackageController.status)
            font.pixelSize: 11
            wrapMode: Text.WordWrap
            color: MetaTheme.statusCritical
        }
    }
}
