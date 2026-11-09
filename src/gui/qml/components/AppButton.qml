import QtQuick
import HuskarUI.Basic
import SrPGui

HusIconButton {
    id: control

    // SVG icon from the shared Lucide subset. Leave empty to keep the HuskarUI icon font.
    property url svgIcon: ""

    // 禁用粗糙的外圈扩散波纹动画，消除突兀闪烁与抽搐感
    effectEnabled: false

    // 高质感背景映射：亮色模式下赋予坚实的实体感，悬停时明确加深
    colorBg: {
        if (!control.enabled) return MetaTheme.surfaceSoft;
        if (control.type === HusButton.Type_Primary) {
            return control.down ? MetaTheme.primaryPressed : (control.hovered ? MetaTheme.primaryHover : MetaTheme.primaryColor);
        }
        if (control.type === HusButton.Type_Text) {
            return control.down ? MetaTheme.surfaceSoft : (control.hovered ? MetaTheme.surfaceSoft : "transparent");
        }
        // Default 按钮 (实体质感，彻底消除亮色下的白底白按)
        return control.down ? MetaTheme.btnDefaultPressedBg : (control.hovered ? MetaTheme.btnDefaultHoverBg : MetaTheme.btnDefaultBg);
    }

    // 文字颜色：在所有状态下都具有高对比度和可读性
    colorText: {
        if (!control.enabled) return MetaTheme.textDisabled;
        if (control.type === HusButton.Type_Primary) {
            return MetaTheme.onPrimaryText;
        }
        return MetaTheme.btnDefaultText;
    }

    // 边框质感：亮色模式下使用精致浅灰边框，悬停时自然收紧
    borderBg.color: {
        if (!control.enabled) return "transparent";
        if (control.type === HusButton.Type_Primary || control.type === HusButton.Type_Text) {
            return "transparent";
        }
        return (control.down || control.hovered) ? MetaTheme.btnDefaultHoverBorder : MetaTheme.btnDefaultBorder;
    }
    borderBg.width: (control.type === HusButton.Type_Primary || control.type === HusButton.Type_Text) ? 0 : 1

    radiusBg.all: MetaTheme.radiusMd

    iconDelegate: String(control.svgIcon).length > 0 ? svgIconDelegate : fontIconDelegate

    Component {
        id: svgIconDelegate

        AppIcon {
            source: control.svgIcon
            size: control.iconSize
            color: control.colorText
            opacity: control.enabled ? 1.0 : 0.5

            NumberAnimation on rotation {
                running: control.loading
                from: 0
                to: 360
                loops: Animation.Infinite
                duration: 1000
                onRunningChanged: if (!running) rotation = 0
            }
        }
    }

    Component {
        id: fontIconDelegate

        HusIconText {
            font: control.iconFont
            color: control.colorIcon
            iconSource: control.loading ? HusIcon.LoadingOutlined : control.iconSource
            verticalAlignment: Text.AlignVCenter
            visible: !empty

            Behavior on color { enabled: control.animationEnabled; ColorAnimation { duration: HusTheme.Primary.durationFast } }

            NumberAnimation on rotation {
                running: control.loading
                from: 0
                to: 360
                loops: Animation.Infinite
                duration: 1000
                onRunningChanged: if (!running) rotation = 0
            }
        }
    }
}
