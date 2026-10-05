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
            if (codeEditor.text !== PresetsController.editorContent) {
                codeEditor.text = PresetsController.editorContent;
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
        anchors.top: parent.top
        anchors.bottom: parent.bottom
        anchors.horizontalCenter: parent.horizontalCenter
        width: Math.min(parent.width - 32, 1920)
        anchors.topMargin: 16
        anchors.bottomMargin: 16
        spacing: 16

        // ==========================================
        // 左侧控制区：自适应黄金比例 (宽屏下舒展至 460~540px)
        // ==========================================
        Rectangle {
            Layout.preferredWidth: Math.max(340, Math.min(540, Math.round(parent.width * 0.30)))
            Layout.fillHeight: true
            color: MetaTheme.cardBg
            border.color: MetaTheme.cardBorder
            border.width: 1
            radius: MetaTheme.radiusLg
            clip: true

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 18
                spacing: 14

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
        // 右侧代码编辑器区：现代专业 IDE 风格 (AppCodeEditor 内聚组件)
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
                        onClicked: PresetsController.saveCurrentFile(codeEditor.text)

                        HusToolTip {
                            text: "保存并建立 .bak 备份"
                        }
                    }
                }

                // ==========================================
                // 专业内聚代码编辑器 (行号、高亮、缩放、状态栏内置一体化)
                // ==========================================
                AppCodeEditor {
                    id: codeEditor
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    text: PresetsController.editorContent
                    currentFilePath: PresetsController.currentFilePathDisplay
                    isDark: HusTheme.isDark
                    fontPixelSize: PresetsController.editorFontSize
                    onFontPixelSizeChanged: {
                        if (PresetsController.editorFontSize !== fontPixelSize) {
                            PresetsController.setEditorFontSize(fontPixelSize);
                        }
                    }
                    onTextChanged: {
                        PresetsController.updateEditorContent(codeEditor.text);
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
