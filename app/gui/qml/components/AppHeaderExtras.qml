import QtQuick
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui

RowLayout {
    id: headerExtras
    spacing: 4
    anchors.verticalCenter: parent.verticalCenter

    signal requestAccountSwitch()

    Component.onCompleted: {
        if (typeof mainWindow !== "undefined" && mainWindow && mainWindow.captionBar) {
            mainWindow.captionBar.addInteractionItem(accountCapsule);
            mainWindow.captionBar.addInteractionItem(themeCaptionBtn);
        }
    }

    // 账号信息胶囊 (分层叠加模型，彻底根除透明黑插值导致的闪烁发黑 Bug)
    Item {
        id: accountCapsule
        Layout.preferredHeight: 28
        Layout.preferredWidth: accountRow.implicitWidth + 16
        Layout.alignment: Qt.AlignVCenter

        // 悬停反馈层 (通过 opacity 控制，绝不插值透明黑，0 闪烁，0 变脏)
        Rectangle {
            anchors.fill: parent
            radius: MetaTheme.radiusPill
            color: accountCapsuleMouse.pressed ? MetaTheme.btnDefaultPressedBg : MetaTheme.sidebarHoverBg
            opacity: (accountCapsuleMouse.containsMouse || accountCapsuleMouse.pressed) ? 1.0 : 0.0

            Behavior on opacity {
                NumberAnimation { duration: 90; easing.type: Easing.OutQuad }
            }
        }

        RowLayout {
            id: accountRow
            anchors.centerIn: parent
            spacing: 6

            // 平滑圆形抗锯齿头像
            Rectangle {
                width: 20
                height: 20
                radius: 10
                color: MetaTheme.surfaceSoft
                clip: true
                antialiasing: true
                smooth: true

                Image {
                    anchors.fill: parent
                    source: OverviewController.currentUserAvatar
                    fillMode: Image.PreserveAspectCrop
                    mipmap: true
                    smooth: true
                    antialiasing: true
                }
            }

            Text {
                text: OverviewController.currentUserName.length > 0 ? OverviewController.currentUserName : "Steam"
                font.pixelSize: 11
                font.bold: true
                color: accountCapsuleMouse.containsMouse ? MetaTheme.textPrimary : MetaTheme.textSecondary
                elide: Text.ElideRight
                Layout.maximumWidth: 120
            }

            // 轻量下拉指示小角标
            Text {
                text: "▾"
                font.pixelSize: 9
                color: accountCapsuleMouse.containsMouse ? MetaTheme.textPrimary : MetaTheme.textTertiary
                Layout.alignment: Qt.AlignVCenter
            }
        }

        MouseArea {
            id: accountCapsuleMouse
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: headerExtras.requestAccountSwitch()
        }

        HusToolTip {
            text: OverviewController.tr("tooltip.switch_account", OverviewController.currentLang)
        }
    }

    // 亮暗主题切换按钮 (HusCaptionButton 原生标题栏嵌入风格)
    HusCaptionButton {
        id: themeCaptionBtn
        Layout.preferredWidth: 38
        Layout.fillHeight: true
        iconSource: HusTheme.isDark ? HusIcon.BulbOutlined : HusIcon.BulbFilled
        onClicked: {
            HusTheme.darkMode = HusTheme.isDark ? HusTheme.Light : HusTheme.Dark;
        }

        HusToolTip {
            text: HusTheme.isDark ? OverviewController.tr("tooltip.to_light", OverviewController.currentLang) : OverviewController.tr("tooltip.to_dark", OverviewController.currentLang)
        }
    }
}
