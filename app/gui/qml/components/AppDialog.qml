import QtQuick
import QtQuick.Controls
import HuskarUI.Basic
import SrPGui

HusPopup {
    id: dialog
    parent: Overlay.overlay
    modal: true
    focus: true
    closePolicy: Popup.CloseOnEscape
    width: Math.min(560, parent ? parent.width - 40 : 560)
    height: Math.min(implicitHeight, parent ? parent.height - 64 : implicitHeight)
    x: parent ? (parent.width - width) / 2 : 0
    y: parent ? (parent.height - height) / 2 : 0
    padding: 24
    colorBg: MetaTheme.cardBg
    radiusBg.all: MetaTheme.radiusXl
    Overlay.modal: Rectangle { color: Qt.rgba(0,0,0,0.22) }
}
