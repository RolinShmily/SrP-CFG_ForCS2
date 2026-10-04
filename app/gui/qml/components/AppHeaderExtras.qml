import QtQuick
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui

RowLayout {
    id: headerExtras
    spacing: 2
    anchors.verticalCenter: parent.verticalCenter

    signal requestAccountSwitch()

    property bool isTop: false

    Component.onCompleted: {
        if (typeof mainWindow !== "undefined" && mainWindow && mainWindow.captionBar) {
            mainWindow.captionBar.addInteractionItem(accountCapsule);
            mainWindow.captionBar.addInteractionItem(pinCaptionBtn);
            mainWindow.captionBar.addInteractionItem(themeCaptionBtn);
        }
    }

    // 账号信息胶囊 (省去多余切换按钮，点击直接切换账号，支持丝滑悬停动效)
    Rectangle {
        id: accountCapsule
        Layout.preferredHeight: 26
        Layout.preferredWidth: accountRow.implicitWidth + 14
        Layout.alignment: Qt.AlignVCenter
        radius: MetaTheme.radiusPill
        color: accountCapsuleMouse.containsMouse ? MetaTheme.surfaceSoft : "transparent"

        Behavior on color {
            ColorAnimation { duration: 150; easing.type: Easing.OutCubic }
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
                color: accountCapsuleMouse.containsMouse ? MetaTheme.primaryColor : MetaTheme.textPrimary
                elide: Text.ElideRight
                Layout.maximumWidth: 110

                Behavior on color {
                    ColorAnimation { duration: 150 }
                }
            }

            // 轻量下拉指示小角标
            Text {
                text: "▾"
                font.pixelSize: 10
                color: accountCapsuleMouse.containsMouse ? MetaTheme.primaryColor : MetaTheme.textTertiary
                Layout.alignment: Qt.AlignVCenter

                Behavior on color {
                    ColorAnimation { duration: 150 }
                }
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

    // 窗口置顶按钮 (HusCaptionButton 原生标题栏嵌入风格，状态切换图标与动画)
    HusCaptionButton {
        id: pinCaptionBtn
        Layout.preferredWidth: 38
        Layout.fillHeight: true
        checkable: true
        checked: headerExtras.isTop
        iconSource: headerExtras.isTop ? HusIcon.PushpinFilled : HusIcon.PushpinOutlined
        onClicked: {
            headerExtras.isTop = !headerExtras.isTop;
            if (typeof mainWindow !== "undefined" && mainWindow) {
                if (headerExtras.isTop) {
                    mainWindow.flags |= Qt.WindowStaysOnTopHint;
                } else {
                    mainWindow.flags &= ~Qt.WindowStaysOnTopHint;
                }
            }
        }

        HusToolTip {
            text: headerExtras.isTop ? OverviewController.tr("tooltip.pinned", OverviewController.currentLang) : OverviewController.tr("tooltip.pin_window", OverviewController.currentLang)
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
