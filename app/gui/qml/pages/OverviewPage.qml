import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Dialogs
import HuskarUI.Basic
import SrPGui
import "../components"

Item {
    id: overviewRoot

    property bool isPathChecking: false
    property bool isConvarsChecking: false

    function triggerAccountSelect() {
        if (steamIdSelect) {
            steamIdSelect.forceActiveFocus();
        }
    }

    function doPathDetect() {
        overviewRoot.isPathChecking = true;
        OverviewController.redetectPaths();
        pathTimer.restart();
    }

    function doConvarsReload() {
        overviewRoot.isConvarsChecking = true;
        OverviewController.reloadConvars();
        convarsTimer.restart();
    }

    Timer {
        id: pathTimer
        interval: 650
        repeat: false
        onTriggered: {
            overviewRoot.isPathChecking = false;
        }
    }

    Timer {
        id: convarsTimer
        interval: 650
        repeat: false
        onTriggered: {
            overviewRoot.isConvarsChecking = false;
        }
    }

    // 手动选择 Steam 路径对话框
    FolderDialog {
        id: steamFolderDialog
        title: OverviewController.tr("dialog.browse_steam", OverviewController.currentLang)
        currentFolder: OverviewController.steamPath.length > 0 ? ("file:///" + OverviewController.steamPath) : ""
        onAccepted: {
            OverviewController.setSteamPath(selectedFolder.toString());
        }
    }

    // 手动选择 CS2 游戏路径对话框
    FolderDialog {
        id: gameFolderDialog
        title: OverviewController.tr("dialog.browse_game", OverviewController.currentLang)
        currentFolder: OverviewController.gamePath.length > 0 ? ("file:///" + OverviewController.gamePath) : ""
        onAccepted: {
            OverviewController.setGamePath(selectedFolder.toString());
        }
    }

    // 首次未检测到 SrP-CFG 运行环境时的引导弹窗
    AppModal {
        id: installModal
        title: OverviewController.tr("modal.install.title", OverviewController.currentLang)
        description: OverviewController.tr("modal.install.desc", OverviewController.currentLang)
        confirmText: OverviewController.tr("modal.install.confirm", OverviewController.currentLang)
        cancelText: OverviewController.tr("modal.install.cancel", OverviewController.currentLang)
        onConfirm: {
            close();
            OverviewController.installAndResetValve();
        }
        onCancel: {
            close();
        }
    }

    // 已安装环境时的二次确认弹窗
    AppModal {
        id: resetConfirmModal
        title: OverviewController.tr("modal.reset.title", OverviewController.currentLang)
        description: OverviewController.tr("modal.reset.desc", OverviewController.currentLang)
        confirmText: OverviewController.tr("modal.reset.confirm", OverviewController.currentLang)
        cancelText: OverviewController.tr("modal.reset.cancel", OverviewController.currentLang)
        onConfirm: {
            close();
            OverviewController.resetValveBaselineDirect();
        }
        onCancel: {
            close();
        }
    }

    Connections {
        target: OverviewController
        function onPromptInstallSrp() {
            installModal.openWarning();
        }
    }



    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 16
        spacing: 16

        // ==========================================
        // 1. Hero 主卡片：全包边独立容器 (四周内收 12px，无露角漏馅)
        // ==========================================
        Rectangle {
            id: heroCard
            Layout.fillWidth: true
            Layout.preferredHeight: 252
            color: MetaTheme.cardBg
            border.color: MetaTheme.cardBorder
            border.width: 1
            radius: MetaTheme.radiusLg
            clip: true

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 12
                spacing: 10

                // 内嵌官方海报视窗 (四周收进 12px，带独立圆角和微边框，完全包裹)
                Rectangle {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    radius: MetaTheme.radiusMd
                    color: MetaTheme.surfaceSoft
                    border.color: MetaTheme.cardBorder
                    border.width: 1
                    clip: true

                    // 底层 Valve 官方原版母带背板 (1920x620 高清原图)
                    Image {
                        id: steamBanner
                        anchors.fill: parent
                        source: "qrc:/SrPGui/resources/images/cs2_official_banner.jpg"
                        fillMode: Image.PreserveAspectCrop
                        horizontalAlignment: Image.AlignHCenter
                        verticalAlignment: Image.AlignVCenter
                        mipmap: true
                    }

                    // 左侧官方矢量 Logo (完全落在灰白底色，数字 2 留出充裕安全边距，绝不被切面遮挡)
                    Image {
                        source: "qrc:/SrPGui/resources/images/cs2_logo.svg"
                        anchors.left: parent.left
                        anchors.leftMargin: 20
                        anchors.verticalCenter: parent.verticalCenter
                        anchors.verticalCenterOffset: -4
                        height: 42
                        width: height * (556.0 / 114.0)
                        fillMode: Image.PreserveAspectFit
                        mipmap: true
                    }

                    // 右上角版本号微标签
                    Rectangle {
                        anchors.right: parent.right
                        anchors.top: parent.top
                        anchors.margins: 10
                        height: 22
                        width: verRow.implicitWidth + 14
                        radius: MetaTheme.radiusSm
                        color: Qt.rgba(0, 0, 0, 0.65)

                        RowLayout {
                            id: verRow
                            anchors.centerIn: parent
                            spacing: 6

                            Rectangle {
                                width: 6; height: 6; radius: 3
                                color: OverviewController.cs2Status === "Installed" ? MetaTheme.statusSuccess : MetaTheme.statusWarning
                            }

                            Text { font.family: MetaTheme.fontFamily;
                                text: OverviewController.cs2Version.length > 0 ? OverviewController.cs2Version : "Counter-Strike 2"
                                font.pixelSize: 11
                                font.bold: true
                                color: "#ffffff"
                            }
                        }
                    }
                }

                // 下半部分：操作控制条 (在卡片内部自然舒展，与海报自然呼应)
                RowLayout {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 42
                    Layout.leftMargin: 4
                    Layout.rightMargin: 4
                    spacing: 10

                    // 大号【启动游戏】主按钮
                    AppButton {
                        text: OverviewController.tr("overview.hero.launch_game", OverviewController.currentLang)
                        type: HusButton.Type_Primary
                        iconSource: HusIcon.PlayCircleOutlined
                        sizeHint: "normal"
                        Layout.preferredHeight: 36
                        Layout.preferredWidth: 120
                        onClicked: OverviewController.launchGame()
                    }

                    // 辅助按钮组
                    AppButton {
                        text: OverviewController.tr("overview.hero.reset_valve", OverviewController.currentLang)
                        type: HusButton.Type_Default
                        iconSource: HusIcon.UndoOutlined
                        sizeHint: "normal"
                        Layout.preferredHeight: 36
                        onClicked: {
                            if (!OverviewController.isSrpInstalled) {
                                installModal.openWarning();
                            } else {
                                resetConfirmModal.openWarning();
                            }
                        }

                        HusToolTip {
                            text: OverviewController.tr("tooltip.reset_valve", OverviewController.currentLang)
                        }
                    }

                    AppButton {
                        text: OverviewController.tr("overview.hero.open_cfg", OverviewController.currentLang)
                        type: HusButton.Type_Default
                        iconSource: HusIcon.FolderOpenOutlined
                        sizeHint: "normal"
                        Layout.preferredHeight: 36
                        onClicked: OverviewController.openCfgFolder()
                    }

                    AppButton {
                        text: OverviewController.tr("overview.hero.open_user_cfg", OverviewController.currentLang)
                        type: HusButton.Type_Default
                        iconSource: HusIcon.UserOutlined
                        sizeHint: "normal"
                        Layout.preferredHeight: 36
                        onClicked: OverviewController.openUserFolder()
                    }

                    Item { Layout.fillWidth: true }

                    // 右侧：当前 Steam 账号信息与下拉切换 (带丝滑悬停动效)
                    RowLayout {
                        spacing: 8

                        // 平滑圆形头像 (抗锯齿优化，无生硬外黑圈)
                        Rectangle {
                            width: 32
                            height: 32
                            radius: 16
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

                        ColumnLayout {
                            spacing: 1

                            Text { font.family: MetaTheme.fontFamily;
                                text: OverviewController.currentUserName.length > 0 ? OverviewController.currentUserName : "Steam User"
                                font.pixelSize: 11
                                font.bold: true
                                color: MetaTheme.textPrimary
                            }

                            HusSelect {
                                id: steamIdSelect
                                Layout.preferredWidth: 190
                                sizeHint: "small"
                                textRole: "label"
                                valueRole: "value"

                                model: {
                                    let list = [];
                                    for (let i = 0; i < OverviewController.usersList.length; ++i) {
                                        let u = OverviewController.usersList[i];
                                        list.push({
                                            label: u.name + " (" + u.accountId + ")",
                                            value: u.accountId
                                        });
                                    }
                                    return list;
                                }

                                currentIndex: {
                                    for (let i = 0; i < OverviewController.usersList.length; ++i) {
                                        if (OverviewController.usersList[i].accountId === OverviewController.currentAccountId) {
                                            return i;
                                        }
                                    }
                                    return 0;
                                }

                                onActivated: (index) => {
                                    if (index >= 0 && index < OverviewController.usersList.length) {
                                        let accId = OverviewController.usersList[index].accountId;
                                        OverviewController.switchAccount(accId);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // ==========================================
        // 2. 下半区：两个紧凑独立的圆角卡片 (逻辑彻底解耦，标题样式严格对齐，零废话小字)
        // ==========================================
        RowLayout {
            Layout.fillWidth: true
            spacing: 16

            // --------------------------------------
            // 左卡片：路径检测 (独立逻辑：只检测路径与装配环境)
            // --------------------------------------
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 216
                color: MetaTheme.cardBg
                border.color: MetaTheme.cardBorder
                border.width: 1
                radius: MetaTheme.radiusLg
                clip: true

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 12

                    // 卡片头部
                    RowLayout {
                        Layout.fillWidth: true

                        Text { font.family: MetaTheme.fontFamily;
                            text: OverviewController.tr("overview.path.title", OverviewController.currentLang)
                            font.pixelSize: 13
                            font.bold: true
                            color: MetaTheme.textPrimary
                        }

                        Item { Layout.fillWidth: true }

                        AppButton {
                            text: overviewRoot.isPathChecking ? "检测中..." : OverviewController.tr("overview.path.redetect", OverviewController.currentLang)
                            type: HusButton.Type_Text
                            iconSource: HusIcon.SyncOutlined
                            sizeHint: "small"
                            loading: overviewRoot.isPathChecking
                            onClicked: overviewRoot.doPathDetect()
                        }
                    }

                    // Steam 路径
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 4

                        Text { font.family: MetaTheme.fontFamily;
                            text: OverviewController.tr("overview.path.steam_label", OverviewController.currentLang)
                            font.pixelSize: 11
                            font.bold: true
                            color: MetaTheme.textSecondary
                        }

                        RowLayout {
                            Layout.fillWidth: true
                            spacing: 8

                            HusInput {
                                id: steamInput
                                Layout.fillWidth: true
                                sizeHint: "small"
                                readOnly: true
                                text: OverviewController.steamPath.length > 0 ? OverviewController.steamPath : "未检测到 Steam 路径"

                                HusToolTip {
                                    visible: steamInput.hovered
                                    text: OverviewController.steamPath
                                }
                            }

                            AppButton {
                                text: "..."
                                type: HusButton.Type_Default
                                sizeHint: "small"
                                Layout.preferredWidth: 36
                                onClicked: steamFolderDialog.open()

                                HusToolTip {
                                    text: OverviewController.tr("tooltip.steam_manual", OverviewController.currentLang)
                                }
                            }

                            AppButton {
                                text: OverviewController.tr("overview.path.browse", OverviewController.currentLang)
                                type: HusButton.Type_Default
                                sizeHint: "small"
                                iconSource: HusIcon.FolderOutlined
                                onClicked: OverviewController.openPath(OverviewController.steamPath)

                                HusToolTip {
                                    text: OverviewController.tr("tooltip.browse_explorer", OverviewController.currentLang)
                                }
                            }
                        }
                    }

                    // 游戏路径
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 4

                        Text { font.family: MetaTheme.fontFamily;
                            text: OverviewController.tr("overview.path.game_label", OverviewController.currentLang)
                            font.pixelSize: 11
                            font.bold: true
                            color: MetaTheme.textSecondary
                        }

                        RowLayout {
                            Layout.fillWidth: true
                            spacing: 8

                            HusInput {
                                id: gameInput
                                Layout.fillWidth: true
                                sizeHint: "small"
                                readOnly: true
                                text: OverviewController.gamePath.length > 0 ? OverviewController.gamePath : "未检测到 CS2 路径"

                                HusToolTip {
                                    visible: gameInput.hovered
                                    text: OverviewController.gamePath
                                }
                            }

                            AppButton {
                                text: "..."
                                type: HusButton.Type_Default
                                sizeHint: "small"
                                Layout.preferredWidth: 36
                                onClicked: gameFolderDialog.open()

                                HusToolTip {
                                    text: OverviewController.tr("tooltip.game_manual", OverviewController.currentLang)
                                }
                            }

                            AppButton {
                                text: OverviewController.tr("overview.path.browse", OverviewController.currentLang)
                                type: HusButton.Type_Default
                                sizeHint: "small"
                                iconSource: HusIcon.FolderOutlined
                                onClicked: OverviewController.openPath(OverviewController.gamePath)

                                HusToolTip {
                                    text: OverviewController.tr("tooltip.browse_explorer", OverviewController.currentLang)
                                }
                            }
                        }
                    }

                    // 分割微线
                    Rectangle {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 1
                        color: MetaTheme.divider
                        Layout.topMargin: 2
                        Layout.bottomMargin: 2
                    }

                    // SrP-CFG 部署控制与版本状态行
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 8

                        // 状态小圆点与文本
                        Rectangle {
                            width: 6; height: 6; radius: 3
                            color: OverviewController.isSrpInstalled ? MetaTheme.statusSuccess : MetaTheme.statusWarning
                        }

                        Text { font.family: MetaTheme.fontFamily;
                            text: OverviewController.isSrpInstalled
                                  ? (OverviewController.tr("overview.path.srp_status_installed", OverviewController.currentLang) + " (" + OverviewController.installedSrpVersion + ")")
                                  : OverviewController.tr("overview.path.srp_status_not_installed", OverviewController.currentLang)
                            font.pixelSize: 11
                            font.bold: true
                            color: OverviewController.isSrpInstalled ? MetaTheme.textPrimary : MetaTheme.textSecondary
                        }

                        Item { Layout.fillWidth: true }

                        // 操作按钮组
                        RowLayout {
                            spacing: 6

                            // 未装配时显示：立即装配 (主色按钮)
                            AppButton {
                                visible: !OverviewController.isSrpInstalled
                                text: OverviewController.tr("overview.path.btn_install_srp", OverviewController.currentLang)
                                type: HusButton.Type_Primary
                                sizeHint: "small"
                                iconSource: HusIcon.DownloadOutlined
                                Layout.preferredHeight: 26
                                onClicked: OverviewController.installSrp()

                                HusToolTip {
                                    text: OverviewController.tr("tooltip.install_srp", OverviewController.currentLang)
                                }
                            }

                            // 已装配时显示：重新装配 (次要按钮)
                            AppButton {
                                visible: OverviewController.isSrpInstalled
                                text: OverviewController.tr("overview.path.btn_reinstall_srp", OverviewController.currentLang)
                                type: HusButton.Type_Default
                                sizeHint: "small"
                                iconSource: HusIcon.SyncOutlined
                                Layout.preferredHeight: 26
                                onClicked: OverviewController.installSrp()

                                HusToolTip {
                                    text: OverviewController.tr("tooltip.reinstall_srp", OverviewController.currentLang)
                                }
                            }

                            // 已装配时显示：卸载 (高级危险微光按钮)
                            AppButton {
                                visible: OverviewController.isSrpInstalled
                                text: OverviewController.tr("overview.path.btn_uninstall_srp", OverviewController.currentLang)
                                type: HusButton.Type_Default
                                sizeHint: "small"
                                iconSource: HusIcon.DeleteOutlined
                                Layout.preferredHeight: 26
                                colorBg: hovered ? (HusTheme.isDark ? Qt.rgba(247/255, 79/255, 79/255, 0.15) : "#fee2e2") : MetaTheme.btnDefaultBg
                                borderBg.color: hovered ? Qt.rgba(247/255, 79/255, 79/255, 0.45) : MetaTheme.btnDefaultBorder
                                borderBg.width: 1
                                colorText: hovered ? MetaTheme.statusCritical : MetaTheme.btnDefaultText
                                onClicked: OverviewController.uninstallSrp()

                                HusToolTip {
                                    text: OverviewController.tr("tooltip.uninstall_srp", OverviewController.currentLang)
                                }
                            }
                        }
                    }
                }
            }

            // --------------------------------------
            // 右卡片：Convars 与按键绑定检测 (独立逻辑：只解析 vcfg)
            // --------------------------------------
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 216
                color: MetaTheme.cardBg
                border.color: MetaTheme.cardBorder
                border.width: 1
                radius: MetaTheme.radiusLg
                clip: true

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 12

                    // 卡片头部
                    RowLayout {
                        Layout.fillWidth: true

                        Text { font.family: MetaTheme.fontFamily;
                            text: OverviewController.tr("overview.convars.title", OverviewController.currentLang)
                            font.pixelSize: 13
                            font.bold: true
                            color: MetaTheme.textPrimary
                        }

                        Item { Layout.fillWidth: true }

                        AppButton {
                            text: overviewRoot.isConvarsChecking ? "解析中..." : OverviewController.tr("overview.convars.redetect", OverviewController.currentLang)
                            type: HusButton.Type_Text
                            iconSource: HusIcon.SyncOutlined
                            sizeHint: "small"
                            loading: overviewRoot.isConvarsChecking
                            onClicked: overviewRoot.doConvarsReload()
                        }
                    }

                    // 大数字指标展示区 (双列对称仪表盘)
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 0

                        // 指标 1: Convars 变量
                        ColumnLayout {
                            Layout.fillWidth: true
                            spacing: 4

                            Text { font.family: MetaTheme.fontFamily;
                                text: OverviewController.totalConvars.toString()
                                font.pixelSize: 28
                                font.bold: true
                                color: MetaTheme.textPrimary
                            }
                            Text { font.family: MetaTheme.fontFamily;
                                text: OverviewController.tr("overview.convars.total_entries", OverviewController.currentLang)
                                font.pixelSize: 11
                                color: MetaTheme.textSecondary
                            }
                        }

                        Rectangle {
                            width: 1
                            height: 36
                            color: MetaTheme.divider
                            Layout.rightMargin: 24
                            Layout.leftMargin: 12
                        }

                        // 指标 2: 按键绑定
                        ColumnLayout {
                            Layout.fillWidth: true
                            spacing: 4

                            Text { font.family: MetaTheme.fontFamily;
                                text: OverviewController.totalBindings.toString()
                                font.pixelSize: 28
                                font.bold: true
                                color: MetaTheme.textPrimary
                            }
                            Text { font.family: MetaTheme.fontFamily;
                                text: OverviewController.tr("overview.convars.keybinds_count", OverviewController.currentLang)
                                font.pixelSize: 11
                                color: MetaTheme.textSecondary
                            }
                        }
                    }

                    Item { Layout.fillHeight: true }

                    // 底部操作按钮行：清空 Convars、清空按键 (双按钮对称高级风格)
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 10

                        AppButton {
                            id: cleanConvarsBtn
                            text: OverviewController.tr("overview.convars.remove_all", OverviewController.currentLang)
                            type: HusButton.Type_Default
                            sizeHint: "small"
                            iconSource: HusIcon.DeleteOutlined
                            Layout.fillWidth: true
                            Layout.preferredHeight: 32
                            colorBg: hovered ? (HusTheme.isDark ? Qt.rgba(247/255, 79/255, 79/255, 0.15) : "#fee2e2") : MetaTheme.btnDefaultBg
                            borderBg.color: hovered ? Qt.rgba(247/255, 79/255, 79/255, 0.45) : MetaTheme.btnDefaultBorder
                            borderBg.width: 1
                            colorText: hovered ? MetaTheme.statusCritical : MetaTheme.btnDefaultText
                            onClicked: OverviewController.cleanAllConvars()

                            HusToolTip {
                                text: OverviewController.tr("tooltip.clean_convars", OverviewController.currentLang)
                            }
                        }

                        AppButton {
                            id: cleanKeysBtn
                            text: OverviewController.tr("overview.convars.remove_keybinds", OverviewController.currentLang)
                            type: HusButton.Type_Default
                            sizeHint: "small"
                            iconSource: HusIcon.DisconnectOutlined
                            Layout.fillWidth: true
                            Layout.preferredHeight: 32
                            colorBg: hovered ? (HusTheme.isDark ? Qt.rgba(245/255, 158/255, 11/255, 0.15) : "#fef3c7") : MetaTheme.btnDefaultBg
                            borderBg.color: hovered ? Qt.rgba(245/255, 158/255, 11/255, 0.45) : MetaTheme.btnDefaultBorder
                            borderBg.width: 1
                            colorText: hovered ? MetaTheme.statusWarning : MetaTheme.btnDefaultText
                            onClicked: OverviewController.cleanAllKeybinds()

                            HusToolTip {
                                text: OverviewController.tr("tooltip.clean_keys", OverviewController.currentLang)
                            }
                        }
                    }
                }
            }
        }

        PackagePanel {
            Layout.fillWidth: true
            packageId: "srp-cfg"
        }

        // 下半区自然弹性留白
        Item {
            Layout.fillHeight: true
        }
    }
}
