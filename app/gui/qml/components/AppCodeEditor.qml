import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import HuskarUI.Basic
import SrPGui

Rectangle {
    id: control

    property alias text: editorArea.text
    property alias readOnly: editorArea.readOnly
    property alias lineCount: editorArea.lineCount
    property alias textDocument: editorArea.textDocument
    property string currentFilePath: ""
    property bool isDark: HusTheme.isDark
    property int gutterWidth: 44

    color: MetaTheme.editorBg
    border.color: MetaTheme.editorBorder
    border.width: 1
    radius: MetaTheme.radiusMd
    clip: true

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        // 编辑视口与行号一体化区域
        Item {
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true

            // 行号槽 (原生 C++ QQuickPaintedItem，零延迟读取 QTextLayout 绝对物理坐标)
            CodeEditorGutter {
                id: gutter
                width: control.gutterWidth
                height: parent.height
                editor: editorArea
                scrollY: editorFlickable.contentY
                textColor: MetaTheme.textTertiary
                backgroundColor: MetaTheme.editorGutterBg
                borderColor: MetaTheme.editorBorder
                z: 2
            }

            // 代码编辑视口
            Flickable {
                id: editorFlickable
                anchors.left: gutter.right
                anchors.right: parent.right
                anchors.top: parent.top
                anchors.bottom: parent.bottom
                clip: true
                boundsBehavior: Flickable.StopAtBounds

                contentWidth: editorArea.width
                contentHeight: editorArea.height

                ScrollBar.vertical: HusScrollBar {
                    policy: editorFlickable.contentHeight > editorFlickable.height ? ScrollBar.AsNeeded : ScrollBar.AlwaysOff
                }
                ScrollBar.horizontal: HusScrollBar {
                    policy: editorFlickable.contentWidth > editorFlickable.width ? ScrollBar.AsNeeded : ScrollBar.AlwaysOff
                }

                TextEdit {
                    id: editorArea
                    width: Math.max(editorFlickable.width, implicitWidth + 24)
                    font.family: "Cascadia Code, JetBrains Mono, Consolas, monospace"
                    font.pixelSize: 12
                    topPadding: 8
                    bottomPadding: 8
                    leftPadding: 8
                    rightPadding: 16
                    color: MetaTheme.textPrimary
                    selectionColor: MetaTheme.primaryTint
                    selectedTextColor: MetaTheme.textPrimary
                    selectByMouse: true
                    wrapMode: TextEdit.NoWrap
                    tabStopDistance: 24

                    Component.onCompleted: {
                        PresetsController.attachHighlighter(editorArea.textDocument, HusTheme.isDark);
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
                    visible: control.currentFilePath.length > 0

                    Text {
                        text: "📄"
                        font.pixelSize: 10
                    }
                    Text {
                        text: control.currentFilePath
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
