import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui

Rectangle {
    id: sidebar
    width: 216
    color: MetaTheme.sidebarBg
    clip: true

    property string activeRoute: "overview"
    signal assemblyRequested(string route)
    // 自由装配默认折叠收起
    property bool assemblyExpanded: false
    onActiveRouteChanged: {
        if (activeRoute.startsWith("assembly_")) assemblyExpanded = true;
    }
    Component.onCompleted: {
        if (activeRoute.startsWith("assembly_")) assemblyExpanded = true;
    }

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 12
        spacing: 6

        // 导航组小标题
        Text {
            text: OverviewController.tr("nav.navigation", OverviewController.currentLang)
            font.pixelSize: 11
            font.bold: true
            color: MetaTheme.textTertiary
            Layout.leftMargin: 8
            Layout.topMargin: 4
            Layout.bottomMargin: 2
        }

        // 中间主导航项 (自适应滚动)
        Flickable {
            Layout.fillWidth: true
            Layout.fillHeight: true
            contentHeight: navCol.implicitHeight
            boundsBehavior: Flickable.StopAtBounds
            clip: true

            ColumnLayout {
                id: navCol
                width: parent.width
                spacing: 3

                // 1. Overview 总览
                NavItem {
                    iconSource: "qrc:/SrPGui/resources/icons/overview.svg"
                    label: OverviewController.tr("nav.overview", OverviewController.currentLang)
                    selected: sidebar.activeRoute === "overview"
                    onClicked: sidebar.activeRoute = "overview"
                }

                // 2. CFG 预设包
                NavItem {
                    iconSource: "qrc:/SrPGui/resources/icons/presets.svg"
                    label: OverviewController.tr("nav.presets", OverviewController.currentLang)
                    selected: sidebar.activeRoute === "presets"
                    onClicked: sidebar.activeRoute = "presets"
                }

                // 3. CFG 自由装配 (可折叠组头部，不设选中高光，带丝滑旋转箭头)
                Item {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 34

                    // 悬停高光层 (通过 opacity 控制，绝不插值透明黑，0 闪烁)
                    Rectangle {
                        anchors.fill: parent
                        radius: MetaTheme.radiusMd
                        color: MetaTheme.sidebarHoverBg
                        opacity: groupMouse.containsMouse ? 1.0 : 0.0

                        Behavior on opacity {
                            NumberAnimation { duration: 90; easing.type: Easing.OutQuad }
                        }
                    }

                    RowLayout {
                        anchors.fill: parent
                        anchors.leftMargin: 10
                        anchors.rightMargin: 10
                        spacing: 10

                        AppIcon {
                            source: "qrc:/SrPGui/resources/icons/assembly.svg"
                            size: 15
                            color: groupMouse.containsMouse ? MetaTheme.textPrimary : MetaTheme.textSecondary
                            Layout.alignment: Qt.AlignVCenter
                        }

                        Text {
                            text: OverviewController.tr("nav.assembly", OverviewController.currentLang)
                            font.pixelSize: 12
                            font.bold: true
                            color: groupMouse.containsMouse ? MetaTheme.textPrimary : MetaTheme.textSecondary
                            Layout.fillWidth: true
                            elide: Text.ElideRight
                        }

                        Text {
                            text: "▶"
                            font.pixelSize: 8
                            color: MetaTheme.textTertiary
                            transformOrigin: Item.Center
                            rotation: sidebar.assemblyExpanded ? 90 : 0

                            Behavior on rotation {
                                NumberAnimation { duration: 200; easing.type: Easing.InOutQuad }
                            }
                        }
                    }

                    MouseArea {
                        id: groupMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: sidebar.assemblyExpanded = !sidebar.assemblyExpanded
                    }
                }

                // 自由装配子项 (丝滑展开收起高度与淡入淡出动画)
                Item {
                    id: subContainer
                    Layout.fillWidth: true
                    Layout.preferredHeight: sidebar.assemblyExpanded ? subItemsCol.implicitHeight : 0
                    clip: true
                    opacity: sidebar.assemblyExpanded ? 1.0 : 0.0

                    Behavior on Layout.preferredHeight {
                        NumberAnimation { duration: 220; easing.type: Easing.InOutQuad }
                    }

                    Behavior on opacity {
                        NumberAnimation { duration: 180; easing.type: Easing.InOutQuad }
                    }

                    ColumnLayout {
                        id: subItemsCol
                        width: parent.width
                        spacing: 2
                        Layout.leftMargin: 14

                        NavSubItem {
                            label: OverviewController.tr("nav.valve_baseline", OverviewController.currentLang)
                            selected: sidebar.activeRoute === "assembly_baseline"
                            onClicked: sidebar.assemblyRequested("assembly_baseline")
                        }
                        NavSubItem {
                            label: OverviewController.tr("nav.features", OverviewController.currentLang)
                            selected: sidebar.activeRoute === "assembly_features"
                            onClicked: sidebar.assemblyRequested("assembly_features")
                        }
                        NavSubItem {
                            label: OverviewController.tr("nav.modes", OverviewController.currentLang)
                            selected: sidebar.activeRoute === "assembly_modes"
                            onClicked: sidebar.assemblyRequested("assembly_modes")
                        }
                        NavSubItem {
                            label: OverviewController.tr("nav.user_custom", OverviewController.currentLang)
                            selected: sidebar.activeRoute === "assembly_usercfg"
                            onClicked: sidebar.assemblyRequested("assembly_usercfg")
                        }
                    }
                }

                // 4. 视频设置
                NavItem {
                    iconSource: "qrc:/SrPGui/resources/icons/video.svg"
                    label: OverviewController.tr("nav.video_settings", OverviewController.currentLang)
                    selected: sidebar.activeRoute === "video_settings"
                    onClicked: sidebar.activeRoute = "video_settings"
                }

                // 5. 地图标注
                NavItem {
                    iconSource: "qrc:/SrPGui/resources/icons/map.svg"
                    label: OverviewController.tr("nav.map_guides", OverviewController.currentLang)
                    selected: sidebar.activeRoute === "map_guides"
                    onClicked: sidebar.activeRoute = "map_guides"
                }
            }
        }

        // 运行状态小指示卡
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 64
            radius: MetaTheme.radiusMd
            color: MetaTheme.surfaceSoft
            border.color: MetaTheme.cardBorder
            border.width: 1

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 7
                spacing: 3

                RowLayout {
                    Layout.fillWidth: true
                    Text {
                        text: OverviewController.tr("sidebar.env_title", OverviewController.currentLang)
                        font.pixelSize: 10
                        font.bold: true
                        color: MetaTheme.textTertiary
                    }
                    Item { Layout.fillWidth: true }
                    Text {
                        text: OverviewController.tr("sidebar.env_ready", OverviewController.currentLang)
                        font.pixelSize: 10
                        color: MetaTheme.statusSuccess
                    }
                }

                RowLayout {
                    spacing: 6
                    Rectangle {
                        width: 5; height: 5; radius: 2.5
                        color: OverviewController.steamPath.length > 0 ? MetaTheme.statusSuccess : MetaTheme.statusCritical
                    }
                    Text {
                        text: OverviewController.tr("sidebar.env_steam", OverviewController.currentLang)
                        font.pixelSize: 10
                        color: MetaTheme.textSecondary
                    }
                    Item { Layout.fillWidth: true }
                    Text {
                        text: OverviewController.steamPath.length > 0 ? OverviewController.tr("sidebar.status_ok", OverviewController.currentLang) : OverviewController.tr("sidebar.status_missing", OverviewController.currentLang)
                        font.pixelSize: 10
                        color: OverviewController.steamPath.length > 0 ? MetaTheme.textPrimary : MetaTheme.statusCritical
                    }
                }

                RowLayout {
                    spacing: 6
                    Rectangle {
                        width: 5; height: 5; radius: 2.5
                        color: OverviewController.gamePath.length > 0 ? MetaTheme.statusSuccess : MetaTheme.statusWarning
                    }
                    Text {
                        text: OverviewController.tr("sidebar.env_game", OverviewController.currentLang)
                        font.pixelSize: 10
                        color: MetaTheme.textSecondary
                    }
                    Item { Layout.fillWidth: true }
                    Text {
                        text: OverviewController.gamePath.length > 0 ? OverviewController.tr("sidebar.status_matched", OverviewController.currentLang) : OverviewController.tr("sidebar.status_unlocated", OverviewController.currentLang)
                        font.pixelSize: 10
                        color: OverviewController.gamePath.length > 0 ? MetaTheme.textPrimary : MetaTheme.statusWarning
                    }
                }
            }
        }

        // 分割线
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 1
            color: MetaTheme.divider
            Layout.topMargin: 1
            Layout.bottomMargin: 1
        }

        // 底部固定：关于、设置
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 2

            NavItem {
                iconSource: "qrc:/SrPGui/resources/icons/info.svg"
                label: OverviewController.tr("nav.about", OverviewController.currentLang)
                selected: sidebar.activeRoute === "about"
                onClicked: sidebar.activeRoute = "about"
            }

            NavItem {
                iconSource: "qrc:/SrPGui/resources/icons/settings.svg"
                label: OverviewController.tr("nav.settings", OverviewController.currentLang)
                selected: sidebar.activeRoute === "settings"
                onClicked: sidebar.activeRoute = "settings"
            }
        }
    }

    // 单个一级导航项组件 (分层叠加模型，彻底根除向 transparent 插值的闪烁与深灰 Bug)
    component NavItem: Item {
        id: itemRoot
        property string iconSource: ""
        property string label: ""
        property bool selected: false
        signal clicked()

        Layout.fillWidth: true
        Layout.preferredHeight: 34

        // 1. 悬停反馈层 (未选中时 hover 显示清爽浅灰/微光暗色)
        Rectangle {
            anchors.fill: parent
            radius: MetaTheme.radiusMd
            color: MetaTheme.sidebarHoverBg
            opacity: (!itemRoot.selected && itemMouse.containsMouse) ? 1.0 : 0.0

            Behavior on opacity {
                NumberAnimation { duration: 90; easing.type: Easing.OutQuad }
            }
        }

        // 2. 选中激活层 (坚实明确的卡片选中质感)
        Rectangle {
            anchors.fill: parent
            radius: MetaTheme.radiusMd
            color: MetaTheme.sidebarSelectedBg
            border.color: MetaTheme.sidebarSelectedBorder
            border.width: MetaTheme.sidebarSelectedBorderWidth
            opacity: itemRoot.selected ? 1.0 : 0.0

            Behavior on opacity {
                NumberAnimation { duration: 110; easing.type: Easing.OutQuad }
            }
        }

        // 3. 选中左侧 3px 指示条
        Rectangle {
            visible: itemRoot.selected
            width: 3
            height: 16
            radius: 2
            color: MetaTheme.primaryColor
            anchors.left: parent.left
            anchors.leftMargin: 2
            anchors.verticalCenter: parent.verticalCenter
        }

        RowLayout {
            anchors.fill: parent
            anchors.leftMargin: 10
            anchors.rightMargin: 10
            spacing: 10

            AppIcon {
                source: itemRoot.iconSource
                size: 15
                color: itemRoot.selected ? MetaTheme.primaryColor : (itemMouse.containsMouse ? MetaTheme.textPrimary : MetaTheme.textSecondary)
                Layout.alignment: Qt.AlignVCenter
            }

            Text {
                text: itemRoot.label
                font.pixelSize: 12
                font.bold: itemRoot.selected
                color: itemRoot.selected ? MetaTheme.textPrimary : (itemMouse.containsMouse ? MetaTheme.textPrimary : MetaTheme.textSecondary)
                Layout.fillWidth: true
                elide: Text.ElideRight
            }
        }

        MouseArea {
            id: itemMouse
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: itemRoot.clicked()
        }
    }

    // 二级导航项组件 (分层叠加模型，彻底消除深灰闪烁)
    component NavSubItem: Item {
        id: subRoot
        property string label: ""
        property bool selected: false
        signal clicked()

        Layout.fillWidth: true
        Layout.preferredHeight: 28

        Rectangle {
            anchors.fill: parent
            radius: MetaTheme.radiusSm
            color: MetaTheme.sidebarHoverBg
            opacity: (!subRoot.selected && subMouse.containsMouse) ? 1.0 : 0.0

            Behavior on opacity {
                NumberAnimation { duration: 90; easing.type: Easing.OutQuad }
            }
        }

        Rectangle {
            anchors.fill: parent
            radius: MetaTheme.radiusSm
            color: MetaTheme.sidebarSelectedBg
            border.color: MetaTheme.sidebarSelectedBorder
            border.width: MetaTheme.sidebarSelectedBorderWidth
            opacity: subRoot.selected ? 1.0 : 0.0

            Behavior on opacity {
                NumberAnimation { duration: 110; easing.type: Easing.OutQuad }
            }
        }

        RowLayout {
            anchors.fill: parent
            anchors.leftMargin: 10
            anchors.rightMargin: 6
            spacing: 6

            Rectangle {
                width: 4
                height: 4
                radius: 2
                color: subRoot.selected ? MetaTheme.primaryColor : (subMouse.containsMouse ? MetaTheme.textSecondary : MetaTheme.textDisabled)
            }

            Text {
                text: subRoot.label
                font.pixelSize: 11
                color: subRoot.selected ? MetaTheme.textPrimary : (subMouse.containsMouse ? MetaTheme.textPrimary : MetaTheme.textSecondary)
                Layout.fillWidth: true
                elide: Text.ElideRight
            }
        }

        MouseArea {
            id: subMouse
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: subRoot.clicked()
        }
    }
}
