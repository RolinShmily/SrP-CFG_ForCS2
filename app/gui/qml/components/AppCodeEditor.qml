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
    property var editorController: PresetsController
    property bool shortcutsEnabled: visible
    onFontPixelSizeChanged: Qt.callLater(gutter.requestRedraw)
    property bool isDark: HusTheme.isDark

    // 代码字体大小与缩放控制
    property int defaultFontPixelSize: 12
    property int fontPixelSize: 12
    property int minFontPixelSize: 9
    property int maxFontPixelSize: 28

    // 行号槽宽度自适应：随行数位数与字号动态扩展，保持宽敞美观
    property int gutterWidth: Math.max(44, (editorArea.lineCount.toString().length + 1) * Math.round(control.fontPixelSize * 0.65) + 16)

    function zoomIn() {
        if (fontPixelSize < maxFontPixelSize) {
            fontPixelSize += 1;
            gutter.requestRedraw();
        }
    }

    function zoomOut() {
        if (fontPixelSize > minFontPixelSize) {
            fontPixelSize -= 1;
            gutter.requestRedraw();
        }
    }

    function resetZoom() {
        fontPixelSize = defaultFontPixelSize;
        gutter.requestRedraw();
    }

    color: MetaTheme.editorBg
    border.color: MetaTheme.editorBorder
    border.width: 1
    radius: MetaTheme.radiusMd
    clip: true

    // 快捷键支持：Ctrl + / - / = / 0
    Shortcut {
        enabled: control.shortcutsEnabled
        sequence: "Ctrl+="
        onActivated: control.zoomIn()
    }
    Shortcut {
        enabled: control.shortcutsEnabled
        sequence: "Ctrl++"
        onActivated: control.zoomIn()
    }
    Shortcut {
        enabled: control.shortcutsEnabled
        sequence: "Ctrl+-"
        onActivated: control.zoomOut()
    }
    Shortcut {
        enabled: control.shortcutsEnabled
        sequence: "Ctrl+0"
        onActivated: control.resetZoom()
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        // ==========================================
        // 编辑视口与行号一体化区域
        // ==========================================
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
                onZoomRequested: (direction) => {
                    if (direction > 0) control.zoomIn();
                    else control.zoomOut();
                }
                onScrollRequested: (horizontal, vertical) => {
                    editorFlickable.cancelFlick();
                    editorFlickable.contentY = Math.max(0, Math.min(Math.max(0, editorFlickable.contentHeight - editorFlickable.height), editorFlickable.contentY + vertical));
                    editorFlickable.contentX = Math.max(0, Math.min(Math.max(0, editorFlickable.contentWidth - editorFlickable.width), editorFlickable.contentX + horizontal));
                }

            }

            // 代码编辑视口
            Flickable {
                id: editorFlickable
                objectName: "editorFlickable"
                anchors.left: gutter.right
                anchors.right: parent.right
                anchors.top: parent.top
                anchors.bottom: parent.bottom
                clip: true
                boundsBehavior: Flickable.StopAtBounds

                contentWidth: editorArea.width
                contentHeight: editorArea.height

                // Wheel scroll/zoom uses one event filter, avoiding lingering pointer grabs.

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
                    font.pixelSize: control.fontPixelSize
                    topPadding: 8
                    bottomPadding: 8
                    leftPadding: 8
                    rightPadding: 16
                    color: MetaTheme.textPrimary
                    selectionColor: MetaTheme.primaryTint
                    selectedTextColor: MetaTheme.textPrimary
                    selectByMouse: true
                    wrapMode: TextEdit.NoWrap
                    textFormat: TextEdit.PlainText
                    tabStopDistance: Math.round(control.fontPixelSize * 2)

                    Component.onCompleted: {
                        control.editorController.attachHighlighter(editorArea.textDocument, HusTheme.isDark);
                    }

                }
            }
        }

        // ==========================================
        // 编辑器底部状态栏 (Editor Status Bar)
        // ==========================================
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

                // 实时代码缩放百分比微标 (支持点击重置为 100%)
                Rectangle {
                    Layout.preferredHeight: 18
                    Layout.preferredWidth: zoomText.implicitWidth + 8
                    radius: 3
                    color: zoomMouseArea.containsMouse ? MetaTheme.cardBorder : "transparent"

                    Text {
                        id: zoomText
                        anchors.centerIn: parent
                        text: Math.round(control.fontPixelSize / control.defaultFontPixelSize * 100) + "%"
                        font.pixelSize: 10
                        color: control.fontPixelSize !== control.defaultFontPixelSize ? MetaTheme.primaryColor : MetaTheme.textTertiary
                        font.bold: control.fontPixelSize !== control.defaultFontPixelSize
                    }

                    MouseArea {
                        id: zoomMouseArea
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: control.resetZoom()
                    }

                    HusToolTip {
                        visible: zoomMouseArea.containsMouse
                        text: OverviewController.tr("editor.zoom_tip", OverviewController.currentLang)
                    }
                }

                // 格式与统计信息
                Text {
                    text: OverviewController.tr("editor.lines", OverviewController.currentLang).arg(editorArea.lineCount)
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
