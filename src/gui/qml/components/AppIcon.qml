import QtQuick
import QtQuick.Effects
import SrPGui

Item {
    id: iconRoot
    property url source: ""
    property color color: MetaTheme.textPrimary
    property int size: 16

    implicitWidth: size
    implicitHeight: size

    Image {
        id: srcImg
        anchors.fill: parent
        source: iconRoot.source
        sourceSize.width: iconRoot.size * 2
        sourceSize.height: iconRoot.size * 2
        visible: false
        mipmap: true
    }

    MultiEffect {
        anchors.fill: srcImg
        source: srcImg
        colorization: 1.0
        colorizationColor: iconRoot.color
        visible: iconRoot.source.toString().length > 0
    }
}
