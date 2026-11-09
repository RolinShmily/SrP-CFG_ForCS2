import QtQuick
import HuskarUI.Basic
import SrPGui

HusModal {
    id: control
    colorBg: MetaTheme.cardBg
    colorTitle: MetaTheme.textPrimary
    colorDescription: MetaTheme.textSecondary
    radiusBg.all: MetaTheme.radiusLg
    confirmButtonDelegate: AppButton {
        text: control.confirmText
        type: HusButton.Type_Primary
        animationEnabled: control.animationEnabled
        onClicked: control.confirm()
    }
    cancelButtonDelegate: AppButton {
        text: control.cancelText
        animationEnabled: control.animationEnabled
        onClicked: control.cancel()
    }
}
