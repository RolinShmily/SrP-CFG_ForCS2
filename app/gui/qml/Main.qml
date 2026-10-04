import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui
import "components"
import "pages"

HusWindow {
    id: mainWindow
    width: 1160
    height: 720
    minimumWidth: 980
    minimumHeight: 640
    visible: true
    title: OverviewController.tr("title.app", OverviewController.currentLang)
    color: MetaTheme.canvasBg

    // 定制窗口标题栏
    captionBar.color: MetaTheme.sidebarBg
    captionBar.winIcon: "qrc:/SrPGui/resources/icon.png"
    captionBar.winIconWidth: 20
    captionBar.winIconHeight: 20
    captionBar.winTitle: OverviewController.tr("title.app", OverviewController.currentLang)
    captionBar.winTitleColor: MetaTheme.textPrimary
    captionBar.winTitleFont.pixelSize: 13
    captionBar.winTitleFont.bold: true
    captionBar.showThemeButton: false
    captionBar.showTopButton: false

    captionBar.winExtraButtonsDelegate: Component {
        AppHeaderExtras {
            onRequestAccountSwitch: {
                sidebar.activeRoute = "overview";
                overviewPage.triggerAccountSelect();
            }
        }
    }

    // 接收消息通知
    Connections {
        target: OverviewController
        function onMessageNotify(success, message) {
            if (success) {
                HusMessage.success(message);
            } else {
                HusMessage.error(message);
            }
        }
    }

    // 主体布局：一体化侧边栏 + 内容区
    RowLayout {
        anchors.fill: parent
        anchors.topMargin: mainWindow.captionBar.height
        spacing: 0

        // 左侧侧边栏
        AppSidebar {
            id: sidebar
            Layout.fillHeight: true
        }

        // 分割线
        Rectangle {
            Layout.fillHeight: true
            Layout.preferredWidth: 1
            color: MetaTheme.divider
        }

        // 右侧内容区视口
        Item {
            Layout.fillWidth: true
            Layout.fillHeight: true

            OverviewPage {
                id: overviewPage
                anchors.fill: parent
                visible: sidebar.activeRoute === "overview"
            }

            // 占位其他页面（后续迭代逐步接入）
            Item {
                anchors.fill: parent
                visible: sidebar.activeRoute !== "overview"

                ColumnLayout {
                    anchors.centerIn: parent
                    spacing: 12

                    HusAvatar {
                        size: 54
                        iconSource: HusIcon.BuildOutlined
                        colorBg: MetaTheme.surfaceSoft
                        colorIcon: MetaTheme.textSecondary
                        Layout.alignment: Qt.AlignHCenter
                    }

                    Text {
                        text: sidebar.activeRoute + " 正在规划中..."
                        font.pixelSize: 15
                        font.bold: true
                        color: MetaTheme.textSecondary
                        Layout.alignment: Qt.AlignHCenter
                    }

                    HusButton {
                        text: "返回总览"
                        type: HusButton.Type_Primary
                        sizeHint: "small"
                        Layout.alignment: Qt.AlignHCenter
                        onClicked: sidebar.activeRoute = "overview"
                    }
                }
            }
        }
    }
}
