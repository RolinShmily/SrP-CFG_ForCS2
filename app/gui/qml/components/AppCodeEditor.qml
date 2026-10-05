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
        sequence: "Ctrl+="
        onActivated: control.zoomIn()
    }
    Shortcut {
        sequence: "Ctrl++"
        onActivated: control.zoomIn()
    }
    Shortcut {
        sequence: "Ctrl+-"
        onActivated: control.zoomOut()
    }
    Shortcut {
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

                WheelHandler {
                    target: null
                    acceptedModifiers: Qt.ControlModifier
                    onWheel: (event) => {
                        if (event.angleDelta.y > 0) {
                            control.zoomIn();
                        } else if (event.angleDelta.y < 0) {
                            control.zoomOut();
                        }
                        event.accepted = true;
                    }
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

                // 内置优先拦截 Ctrl + 滚轮缩放，未按 Ctrl 时完全无视并放行 Flickable 正常滚动
                WheelHandler {
                    id: editorZoomHandler
                    target: null
                    acceptedModifiers: Qt.ControlModifier
                    onWheel: (event) => {
                        if (event.angleDelta.y > 0) {
                            control.zoomIn();
                        } else if (event.angleDelta.y < 0) {
                            control.zoomOut();
                        }
                        event.accepted = true;
                    }
                }

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
                    tabStopDistance: Math.round(control.fontPixelSize * 2)

                    Component.onCompleted: {
                        PresetsController.attachHighlighter(editorArea.textDocument, HusTheme.isDark);
                    }

                    WheelHandler {
                        id: textEditZoomHandler
                        target: null
                        acceptedModifiers: Qt.ControlModifier
                        onWheel: (event) => {
                            if (event.angleDelta.y > 0) {
                                control.zoomIn();
                            } else if (event.angleDelta.y < 0) {
                                control.zoomOut();
                            }
                            event.accepted = true;
                        }
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
                        color: control.fontPixelSize !== control.defaultFontPixelSize ? MetaTheme.primary : MetaTheme.textTertiary
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
                        text: "Ctrl + 滚轮放缩代码，点击重置 100%"
                    }
                }

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
