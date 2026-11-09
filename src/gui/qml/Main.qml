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
    captionBar.winTitleFont.family: MetaTheme.fontFamily
    captionBar.winTitleFont.pixelSize: 13
    captionBar.winTitleFont.bold: true
    captionBar.showThemeButton: false
    captionBar.showTopButton: false

    property string initialRoute: "overview"

    captionBar.winExtraButtonsDelegate: Component {
        AppHeaderExtras {
            onRequestAccountSwitch: {
                sidebar.activeRoute = "overview";
                overviewPage.triggerAccountSelect();
            }
        }
    }

    HusMessage {
        id: feedback
        objectName: "appFeedbackHost"
        parent: mainWindow.captionBar
        width: mainWindow.width
        anchors.top: parent.bottom
        anchors.horizontalCenter: parent.horizontalCenter
        z: 999
        colorBg: MetaTheme.cardBg
        colorMessage: MetaTheme.textPrimary
        Component.onCompleted: AppFeedback.host = feedback
        Component.onDestruction: AppFeedback.host = null
    }

    // 接收消息通知
    Connections {
        target: OverviewController
        function onMessageNotify(success, message) {
            if (success) {
                AppFeedback.success(message);
            } else {
                AppFeedback.error(message);
            }
        }
    }

    Connections {
        target: PackageController
        function onMessageNotify(success, message) { if (success) AppFeedback.success(message); else AppFeedback.error(message); }
    }

    Connections {
        target: PreferencesController
        function onMessageNotify(success, message) { if(success) AppFeedback.success(message); else AppFeedback.error(message); }
    }
    Connections {
        target: AppUpdateController
        function onMessageNotify(success, message) { if(success) AppFeedback.success(message); else AppFeedback.error(message); }
    }
    Component.onCompleted: {
        if (initialRoute === "about" || initialRoute === "settings") sidebar.activeRoute = initialRoute;
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
            activeRoute: mainWindow.initialRoute
            onAboutRequested: sidebar.activeRoute = "about"
            onSettingsRequested: sidebar.activeRoute = "settings"
            onAssemblyRequested: (route) => {
                assemblyPage.navigateTo(route);
                sidebar.activeRoute = assemblyPage.activeSection;
            }
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

            // 轻量边缘投影，替代给每张卡片叠加 MultiEffect 的高开销做法。
            Rectangle {
                anchors.left: parent.left
                anchors.top: parent.top
                anchors.bottom: parent.bottom
                width: 12
                z: 5
                gradient: Gradient {
                    orientation: Gradient.Horizontal
                    GradientStop { position: 0.0; color: MetaTheme.edgeShadow }
                    GradientStop { position: 1.0; color: "transparent" }
                }
            }

            OverviewPage {
                id: overviewPage
                anchors.fill: parent
                visible: sidebar.activeRoute === "overview"
            }

            PresetsPage {
                id: presetsPage
                anchors.fill: parent
                visible: sidebar.activeRoute === "presets"
            }

            AssemblyPage {
                id: assemblyPage
                anchors.fill: parent
                initialSection: mainWindow.initialRoute
                visible: sidebar.activeRoute.startsWith("assembly_")
                onSectionChanged: (route) => { sidebar.activeRoute = route; }
            }

            VideoPage { anchors.fill: parent; visible: sidebar.activeRoute === "video_settings" }
            AnnotationsPage { anchors.fill: parent; visible: sidebar.activeRoute === "map_guides" }
            AboutPage { anchors.fill: parent; visible: sidebar.activeRoute === "about" }
            SettingsPage { anchors.fill: parent; visible: sidebar.activeRoute === "settings" }


        }
    }
}
