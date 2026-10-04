import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui
import "../components"

Item {
    id: presetsPageRoot

    Component.onCompleted: {
        PresetsController.reload();
        if (typeof editorArea !== "undefined" && editorArea && editorArea.textDocument) {
            PresetsController.attachHighlighter(editorArea.textDocument, HusTheme.isDark);
        }
    }

    Connections {
        target: HusTheme
        function onDarkModeChanged() {
            PresetsController.updateTheme(HusTheme.isDark);
        }
    }

    Connections {
        target: PresetsController
        function onPromptInstallSrp() {
            installPromptModal.openWarning();
        }
        function onEditorContentChanged() {
            if (editorArea.text !== PresetsController.editorContent) {
                editorArea.text = PresetsController.editorContent;
            }
        }
        function onSelectedPresetChanged() {
            if (presetSelect.currentIndex !== PresetsController.selectedPresetIndex) {
                presetSelect.currentIndex = PresetsController.selectedPresetIndex;
            }
        }
        function onSelectedFileChanged() {
            if (fileSelect.currentIndex !== PresetsController.selectedFileIndex) {
                fileSelect.currentIndex = PresetsController.selectedFileIndex;
            }
        }
        function onMessageNotify(success, message) {
            if (success) {
                HusMessage.success(message);
            } else {
                HusMessage.error(message);
            }
        }
    }

    RowLayout {
        anchors.fill: parent
        anchors.margins: 16
        spacing: 16

        // ==========================================
        // 左侧控制区：预设选择、控制台指令、加载/卸载状态
        // ==========================================
        Rectangle {
            Layout.preferredWidth: 310
            Layout.fillHeight: true
            color: MetaTheme.cardBg
            border.color: MetaTheme.cardBorder
            border.width: 1
            radius: MetaTheme.radiusLg
            clip: true

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 18
                spacing: 16

                // 页面主标题
                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 4

                    Text {
                        text: PresetsController.tr("presets.title", OverviewController.currentLang)
                        font.pixelSize: 18
                        font.bold: true
                        color: MetaTheme.textPrimary
                    }
                    Text {
                        text: "选择并加载生效预设，或在右侧深度调校"
                        font.pixelSize: 11
                        color: MetaTheme.textSecondary
                    }
                }

                // 分割线
                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 1
                    color: MetaTheme.divider
                }

                // 预设选择下拉框
                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 6

                    Text {
                        text: PresetsController.tr("presets.select_label", OverviewController.currentLang)
                        font.pixelSize: 11
                        font.bold: true
                        color: MetaTheme.textSecondary
                    }

                    HusSelect {
                        id: presetSelect
                        Layout.fillWidth: true
                        model: PresetsController.availablePresets
                        textRole: "label"
                        currentIndex: PresetsController.selectedPresetIndex
                        onCurrentIndexChanged: {
                            if (currentIndex >= 0 && currentIndex !== PresetsController.selectedPresetIndex) {
                                PresetsController.setSelectedPresetIndex(currentIndex);
                            }
                        }
                        onActivated: function(index) {
                            PresetsController.setSelectedPresetIndex(index);
                        }
                    }
                }

                // 控制台生效指令代码展示胶囊
                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 38
                    radius: MetaTheme.radiusMd
                    color: MetaTheme.surfaceSoft
                    border.color: MetaTheme.cardBorder
                    border.width: 1

                    RowLayout {
                        anchors.fill: parent
                        anchors.leftMargin: 12
                        anchors.rightMargin: 10
                        spacing: 8

                        Text {
                            text: ">"
                            font.family: "Cascadia Code, JetBrains Mono, Consolas, monospace"
                            font.pixelSize: 12
                            font.bold: true
                            color: MetaTheme.textTertiary
                        }

                        Text {
                            text: PresetsController.selectedPresetCommand
                            font.family: "Cascadia Code, JetBrains Mono, Consolas, monospace"
                            font.pixelSize: 11
                            color: MetaTheme.textPrimary
                            Layout.fillWidth: true
                            elide: Text.ElideRight
                        }

                        AppButton {
                            type: HusButton.Type_Text
                            sizeHint: "small"
                            iconSource: HusIcon.CopyOutlined
                            Layout.preferredHeight: 24
                            Layout.preferredWidth: 24
                            onClicked: {
                                OverviewController.copyToClipboard(PresetsController.selectedPresetCommand);
                                HusMessage.success("已复制指令至剪贴板");
                            }

                            HusToolTip {
                                text: "复制控制台指令"
                            }
                        }
                    }
                }

                // 状态卡片 (检测 custom.cfg 有效字段)
                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 140
                    radius: MetaTheme.radiusMd
                    color: MetaTheme.surfaceSoft
                    border.color: MetaTheme.cardBorder
                    border.width: 1

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 14
                        spacing: 10

                        // 卡片标题与小圆点
                        RowLayout {
                            Layout.fillWidth: true

                            Text {
                                text: PresetsController.tr("presets.status_card_title", OverviewController.currentLang)
                                font.pixelSize: 12
                                font.bold: true
                                color: MetaTheme.textSecondary
                            }

                            Item { Layout.fillWidth: true }

                            Rectangle {
                                width: 6; height: 6; radius: 3
                                color: PresetsController.isPresetLoaded ? MetaTheme.statusSuccess : MetaTheme.textDisabled
                            }

                            Text {
                                text: PresetsController.isPresetLoaded ? "已激活" : "未加载"
                                font.pixelSize: 10
                                font.bold: true
                                color: PresetsController.isPresetLoaded ? MetaTheme.statusSuccess : MetaTheme.textSecondary
                            }
                        }

                        // 状态大文本
                        Text {
                            text: PresetsController.isPresetLoaded
                                  ? (PresetsController.selectedPresetName + " 预设已在 custom.cfg 生效")
                                  : "当前预设未作为起点启用"
                            font.pixelSize: 12
                            font.bold: true
                            color: MetaTheme.textPrimary
                            wrapMode: Text.WordWrap
                            Layout.fillWidth: true
                        }

                        Item { Layout.fillHeight: true }

                        // 加载与卸载操作按钮组
                        RowLayout {
                            Layout.fillWidth: true
                            spacing: 8

                            AppButton {
                                Layout.fillWidth: true
                                Layout.preferredHeight: 32
                                text: PresetsController.tr("presets.btn_load", OverviewController.currentLang)
                                type: PresetsController.isPresetLoaded ? HusButton.Type_Default : HusButton.Type_Primary
                                iconSource: HusIcon.CheckOutlined
                                sizeHint: "small"
                                onClicked: PresetsController.loadCurrentPreset()

                                HusToolTip {
                                    text: "将此预设加载至 custom.cfg"
                                }
                            }

                            AppButton {
                                Layout.fillWidth: true
                                Layout.preferredHeight: 32
                                text: PresetsController.tr("presets.btn_unload", OverviewController.currentLang)
                                type: HusButton.Type_Default
                                iconSource: HusIcon.CloseOutlined
                                sizeHint: "small"
                                onClicked: PresetsController.unloadPreset()

                                HusToolTip {
                                    text: "从 custom.cfg 卸载预设起跑命令"
                                }
                            }
                        }
                    }
                }

                Item { Layout.fillHeight: true }
            }
        }

        // ==========================================
        // 右侧代码编辑器区：现代专业 IDE 风格（带文件多选与底部状态栏）
        // ==========================================
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: MetaTheme.cardBg
            border.color: MetaTheme.cardBorder
            border.width: 1
            radius: MetaTheme.radiusLg
            clip: true

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 16
                spacing: 10

                // 顶部工具栏 (Header Bar - 绝对不溢出布局)
                RowLayout {
                    Layout.fillWidth: true
                    spacing: 8

                    // 配置文件下拉选择器 (紧凑宽度)
                    HusSelect {
                        id: fileSelect
                        Layout.preferredWidth: 150
                        sizeHint: "small"
                        model: PresetsController.availableFiles
                        textRole: "label"
                        valueRole: "value"
                        currentIndex: PresetsController.selectedFileIndex
                        onCurrentIndexChanged: {
                            if (currentIndex >= 0 && currentIndex !== PresetsController.selectedFileIndex) {
                                PresetsController.setSelectedFileIndex(currentIndex);
                            }
                        }
                        onActivated: function(index) {
                            PresetsController.setSelectedFileIndex(index);
                        }
                    }

                    // 未保存脏状态微标
                    RowLayout {
                        visible: PresetsController.isEditorDirty
                        spacing: 4
                        Layout.alignment: Qt.AlignVCenter

                        Rectangle {
                            width: 6; height: 6; radius: 3
                            color: MetaTheme.statusWarning
                        }
                        Text {
                            text: "未保存 (*)"
                            font.pixelSize: 11
                            font.bold: true
                            color: MetaTheme.statusWarning
                        }
                    }

                    Item { Layout.fillWidth: true }

                    // 恢复默认按钮
                    AppButton {
                        text: PresetsController.tr("presets.btn_reset", OverviewController.currentLang)
                        type: HusButton.Type_Default
                        iconSource: HusIcon.UndoOutlined
                        sizeHint: "small"
                        Layout.preferredHeight: 28
                        onClicked: resetFileModal.openWarning()

                        HusToolTip {
                            text: "恢复官方初始默认模板"
                        }
                    }

                    // 保存按钮
                    AppButton {
                        text: PresetsController.tr("presets.btn_save", OverviewController.currentLang)
                        type: PresetsController.isEditorDirty ? HusButton.Type_Primary : HusButton.Type_Default
                        iconSource: HusIcon.SaveOutlined
                        sizeHint: "small"
                        Layout.preferredHeight: 28
                        onClicked: PresetsController.saveCurrentFile(editorArea.text)

                        HusToolTip {
                            text: "保存并建立 .bak 备份"
                        }
                    }
                }

                // ==========================================
                // 内嵌式代码编辑容器 (带底部状态栏的完整 IDE 视口)
                // ==========================================
                Rectangle {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    color: MetaTheme.editorBg
                    border.color: MetaTheme.editorBorder
                    border.width: 1
                    radius: MetaTheme.radiusMd
                    clip: true

                    ColumnLayout {
                        anchors.fill: parent
                        spacing: 0

                        // 编辑视口与行号
                        RowLayout {
                            Layout.fillWidth: true
                            Layout.fillHeight: true
                            spacing: 0

                            // 行号指示器列 (背景微灰，严格跟随滚动)
                            Rectangle {
                                Layout.preferredWidth: 44
                                Layout.fillHeight: true
                                color: MetaTheme.editorGutterBg

                                Rectangle {
                                    anchors.right: parent.right
                                    width: 1
                                    height: parent.height
                                    color: MetaTheme.editorBorder
                                }

                                Flickable {
                                    id: lineNumFlickable
                                    anchors.fill: parent
                                    contentY: editorFlickable.contentY
                                    interactive: false
                                    clip: true

                                    Column {
                                        width: parent.width - 8
                                        anchors.top: parent.top
                                        anchors.topMargin: 8

                                        Repeater {
                                            model: editorArea.lineCount
                                            Text {
                                                width: parent.width
                                                horizontalAlignment: Text.AlignRight
                                                text: (index + 1).toString()
                                                font.family: editorArea.font.family
                                                font.pixelSize: editorArea.font.pixelSize
                                                color: MetaTheme.textTertiary
                                                height: editorArea.cursorRectangle.height > 0 ? editorArea.cursorRectangle.height : 18
                                            }
                                        }
                                    }
                                }
                            }

                            // 代码编辑视口
                            Flickable {
                                id: editorFlickable
                                Layout.fillWidth: true
                                Layout.fillHeight: true
                                clip: true
                                boundsBehavior: Flickable.StopAtBounds

                                contentWidth: Math.max(editorArea.implicitWidth + 32, width)
                                contentHeight: editorArea.implicitHeight + 32

                                ScrollBar.vertical: HusScrollBar { }
                                ScrollBar.horizontal: HusScrollBar { }

                                TextEdit {
                                    id: editorArea
                                    anchors.fill: parent
                                    anchors.margins: 8
                                    text: PresetsController.editorContent
                                    font.family: "Cascadia Code, JetBrains Mono, Consolas, monospace"
                                    font.pixelSize: 12
                                    color: MetaTheme.textPrimary
                                    selectionColor: MetaTheme.primaryTint
                                    selectedTextColor: MetaTheme.textPrimary
                                    selectByMouse: true
                                    wrapMode: TextEdit.NoWrap
                                    tabStopDistance: 24

                                    Component.onCompleted: {
                                        PresetsController.attachHighlighter(editorArea.textDocument, HusTheme.isDark);
                                    }

                                    onTextChanged: {
                                        PresetsController.updateEditorContent(editorArea.text);
                                    }
                                }
                            }
                        }

                        // 编辑器底部状态栏 (Editor Status Bar)
                        Rectangle {
                            Layout.fillWidth: true
                            Layout.preferredHeight: 24
                            color: MetaTheme.editorGutterBg

                            Rectangle {
                                anchors.top: parent.top
                                width: parent.width
                                height: 1
                                color: MetaTheme.editorBorder
                            }

                            RowLayout {
                                anchors.fill: parent
                                anchors.leftMargin: 10
                                anchors.rightMargin: 10
                                spacing: 12

                                // 文件路径指示
                                RowLayout {
                                    spacing: 4
                                    Layout.alignment: Qt.AlignVCenter

                                    Text {
                                        text: "📄"
                                        font.pixelSize: 10
                                    }
                                    Text {
                                        text: PresetsController.currentFilePathDisplay
                                        font.family: "Cascadia Code, JetBrains Mono, Consolas, monospace"
                                        font.pixelSize: 10
                                        color: MetaTheme.textSecondary
                                        elide: Text.ElideMiddle
                                        Layout.maximumWidth: 320
                                    }
                                }

                                Item { Layout.fillWidth: true }

                                // 格式与统计信息
                                Text {
                                    text: editorArea.lineCount + " 行"
                                    font.pixelSize: 10
                                    color: MetaTheme.textTertiary
                                }
                                Text {
                                    text: "UTF-8"
                                    font.pixelSize: 10
                                    color: MetaTheme.textTertiary
                                }
                                Text {
                                    text: "Source 2 CFG"
                                    font.pixelSize: 10
                                    font.bold: true
                                    color: MetaTheme.textSecondary
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 未安装 SrP-CFG 联动安装弹窗
    HusModal {
        id: installPromptModal
        title: PresetsController.tr("presets.modal_install_title", OverviewController.currentLang)
        description: PresetsController.tr("presets.modal_install_desc", OverviewController.currentLang)
        cancelText: PresetsController.tr("presets.modal_install_cancel", OverviewController.currentLang)
        confirmText: PresetsController.tr("presets.modal_install_confirm", OverviewController.currentLang)
        onConfirm: {
            installPromptModal.close();
            PresetsController.installSrpAndLoadCurrentPreset();
        }
        onCancel: {
            installPromptModal.close();
        }
    }

    // 恢复默认确认弹窗
    HusModal {
        id: resetFileModal
        title: "确认恢复官方出厂默认"
        description: "此操作将把当前选中的配置文件还原为官方纯净出厂版本。\n您现有的修改将自动备份为 .bak。确认继续？"
        cancelText: "取消"
        confirmText: "确认恢复"
        onConfirm: {
            resetFileModal.close();
            PresetsController.resetCurrentFileToDefault();
        }
        onCancel: {
            resetFileModal.close();
        }
    }
}
