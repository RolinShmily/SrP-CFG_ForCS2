import QtQuick
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui

// 首页「SrP-CFG 运行时」卡片。
// 把原先分散在两处的 srp-cfg 状态合并为一张紧凑卡：
//   · 装配行 —— 单包部署状态（写进游戏 cfg 目录），是「恢复默认设置」的前提
//   · 暂存行 —— 本地暂存版本 与 远端最新版本（更新只改暂存区，不自动部署到游戏）
// 两行各带语义前缀，避免再出现「同一个版本号被当成同一件事」的歧义。
Rectangle {
    id: panel

    function t(key) { return OverviewController.tr(key, OverviewController.currentLang); }

    readonly property var info: {
        for (let item of PackageController.packages)
            if (item.id === "srp-cfg") return item;
        return { version: "", latest: "", updateAvailable: false };
    }

    readonly property bool installed: OverviewController.isSrpInstalled
    readonly property string stagedVersion: info.version !== undefined ? info.version : ""
    readonly property string latestVersion: info.latest !== undefined ? info.latest : ""
    readonly property bool hasLatest: latestVersion.length > 0
    readonly property bool hasUpdate: hasLatest && info.updateAvailable === true
    // 0 = 未检查（未知）1 = 已是最新 2 = 可更新
    readonly property int badgeState: !hasLatest ? 0 : (hasUpdate ? 2 : 1)

    implicitWidth: body.implicitWidth + 32
    implicitHeight: body.implicitHeight + 28
    color: MetaTheme.cardBg
    border.color: MetaTheme.cardBorder
    border.width: 1
    radius: MetaTheme.radiusLg
    clip: true

    ColumnLayout {
        id: body
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.topMargin: 14
        anchors.leftMargin: 16
        // 内容宽度自适应并靠左；不超过卡宽（英文长文案时自动收缩省略）
        width: Math.min(implicitWidth, parent.width - 32)
        spacing: 10

        // 标题行 + 更新状态徽标
        RowLayout {
            Layout.fillWidth: true
            spacing: 8

            Text {
                Layout.fillWidth: true
                elide: Text.ElideRight
                font.family: MetaTheme.fontFamily
                text: panel.t("overview.runtime.title")
                font.pixelSize: 13
                font.bold: true
                color: MetaTheme.textPrimary
            }

            Rectangle {
                Layout.preferredHeight: 20
                Layout.preferredWidth: badgeRow.implicitWidth + 16
                radius: MetaTheme.radiusPill
                color: panel.badgeState === 2 ? Qt.rgba(245 / 255, 158 / 255, 11 / 255, 0.14)
                     : panel.badgeState === 1 ? Qt.rgba(16 / 255, 185 / 255, 129 / 255, 0.14)
                     : MetaTheme.surfaceSoft

                RowLayout {
                    id: badgeRow
                    anchors.centerIn: parent
                    spacing: 5

                    Rectangle {
                        width: 6; height: 6; radius: 3
                        color: panel.badgeState === 2 ? MetaTheme.statusWarning
                             : panel.badgeState === 1 ? MetaTheme.statusSuccess
                             : MetaTheme.textDisabled
                    }

                    Text {
                        font.family: MetaTheme.fontFamily
                        text: panel.badgeState === 2 ? panel.t("overview.runtime.badge_update")
                            : panel.badgeState === 1 ? panel.t("overview.runtime.badge_latest")
                            : panel.t("overview.runtime.badge_unknown")
                        font.pixelSize: 10
                        font.bold: true
                        color: panel.badgeState === 2 ? MetaTheme.statusWarning
                             : panel.badgeState === 1 ? MetaTheme.statusSuccess
                             : MetaTheme.textSecondary
                    }
                }
            }
        }

        // 装配行：单包 srp-cfg 的部署状态与操作
        RowLayout {
            Layout.fillWidth: true
            spacing: 8

            Rectangle {
                width: 6; height: 6; radius: 3
                color: panel.installed ? MetaTheme.statusSuccess : MetaTheme.statusWarning
            }

            Text {
                Layout.fillWidth: true
                elide: Text.ElideRight
                font.family: MetaTheme.fontFamily
                text: panel.installed
                      ? (panel.t("overview.runtime.installed")
                         + (OverviewController.installedSrpVersion.length > 0 ? " " + OverviewController.installedSrpVersion : ""))
                      : panel.t("overview.runtime.not_installed")
                font.pixelSize: 11
                font.bold: true
                color: panel.installed ? MetaTheme.textPrimary : MetaTheme.textSecondary
            }

            AppButton {
                visible: !panel.installed
                text: panel.t("overview.path.btn_install_srp")
                type: HusButton.Type_Primary
                sizeHint: "small"
                iconSource: HusIcon.DownloadOutlined
                Layout.preferredHeight: 26
                onClicked: OverviewController.installSrp()

                HusToolTip {
                    text: panel.t("tooltip.install_srp")
                }
            }

            AppButton {
                visible: panel.installed
                text: panel.t("overview.path.btn_reinstall_srp")
                type: HusButton.Type_Default
                sizeHint: "small"
                iconSource: HusIcon.SyncOutlined
                Layout.preferredHeight: 26
                onClicked: OverviewController.installSrp()

                HusToolTip {
                    text: panel.t("tooltip.reinstall_srp")
                }
            }

            AppButton {
                visible: panel.installed
                text: panel.t("overview.path.btn_uninstall_srp")
                type: HusButton.Type_Default
                sizeHint: "small"
                iconSource: HusIcon.DeleteOutlined
                Layout.preferredHeight: 26
                colorBg: hovered ? (HusTheme.isDark ? Qt.rgba(247 / 255, 79 / 255, 79 / 255, 0.15) : "#fee2e2") : MetaTheme.btnDefaultBg
                borderBg.color: hovered ? Qt.rgba(247 / 255, 79 / 255, 79 / 255, 0.45) : MetaTheme.btnDefaultBorder
                borderBg.width: 1
                colorText: hovered ? MetaTheme.statusCritical : MetaTheme.btnDefaultText
                onClicked: OverviewController.uninstallSrp()

                HusToolTip {
                    text: panel.t("tooltip.uninstall_srp")
                }
            }
        }

        // 暂存行：本地暂存 →（可更新时）远端最新，与检查/更新操作
        RowLayout {
            Layout.fillWidth: true
            spacing: 8

            Text {
                Layout.fillWidth: true
                elide: Text.ElideRight
                font.family: MetaTheme.fontFamily
                text: {
                    let s = panel.t("overview.runtime.staged") + " v" + panel.stagedVersion;
                    if (panel.hasLatest)
                        s += (panel.hasUpdate ? "  →  " : "  ·  ") + panel.t("overview.runtime.latest") + " v" + panel.latestVersion;
                    else
                        s += "  ·  " + panel.t("overview.runtime.latest") + " —";
                    return s;
                }
                font.pixelSize: 11
                font.bold: panel.hasUpdate
                color: panel.hasUpdate ? MetaTheme.statusWarning : MetaTheme.textSecondary
            }

            AppButton {
                text: panel.t("overview.runtime.btn_check")
                type: HusButton.Type_Default
                sizeHint: "small"
                Layout.preferredHeight: 26
                enabled: !PackageController.busy
                loading: PackageController.busy
                onClicked: PackageController.checkUpdates()
            }

            AppButton {
                text: panel.t("overview.runtime.btn_update")
                type: panel.hasUpdate ? HusButton.Type_Primary : HusButton.Type_Default
                sizeHint: "small"
                Layout.preferredHeight: 26
                enabled: !PackageController.busy
                onClicked: PackageController.updatePackage("srp-cfg")
            }
        }

        // 配置包错误/状态反馈行
        Text {
            visible: PackageController.status.length > 0
            Layout.fillWidth: true
            text: panel.t(PackageController.status)
            font.family: MetaTheme.fontFamily
            font.pixelSize: 11
            wrapMode: Text.WordWrap
            color: MetaTheme.statusCritical
        }
    }
}
