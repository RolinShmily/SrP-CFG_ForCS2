pragma Singleton
import QtQuick
import HuskarUI.Basic

QtObject {
    id: meta

    // 核心黑白
    readonly property color starkBlack: "#141517"
    readonly property color starkWhite: "#ffffff"
    readonly property color obsidian: "#09090b"

    // 主操作色
    readonly property color primaryColor: HusTheme.isDark ? starkWhite : starkBlack
    readonly property color primaryHover: HusTheme.isDark ? "#e4e4e7" : "#27272a"
    readonly property color primaryPressed: HusTheme.isDark ? "#d4d4d8" : "#000000"
    readonly property color primaryTint: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.09) : Qt.rgba(0, 0, 0, 0.05)
    readonly property color onPrimaryText: HusTheme.isDark ? "#09090b" : starkWhite

    // 次级/默认按钮调色板 (解决亮色模式下白底白按、悬停不明显与闪烁问题)
    readonly property color btnDefaultBg: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.05) : "#f1f3f5"
    readonly property color btnDefaultHoverBg: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.11) : "#e2e6ea"
    readonly property color btnDefaultPressedBg: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.18) : "#d8dde2"
    readonly property color btnDefaultBorder: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.10) : "#e2e8f0"
    readonly property color btnDefaultHoverBorder: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.22) : "#cbd5e1"
    readonly property color btnDefaultText: HusTheme.isDark ? "#f4f4f5" : "#1e293b"

    // 侧边栏交互色彩规范 (彻底解决亮色闪烁与无选中感)
    readonly property color sidebarHoverBg: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.06) : "#e2e6ea"
    readonly property color sidebarSelectedBg: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.10) : starkWhite
    readonly property color sidebarSelectedBorder: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.12) : Qt.rgba(0, 0, 0, 0.08)
    readonly property real sidebarSelectedBorderWidth: 1

    // 表面与背景
    readonly property color canvasBg: HusTheme.isDark ? obsidian : "#fbfcfd"
    readonly property color sidebarBg: HusTheme.isDark ? "#101114" : "#f3f4f6"
    readonly property color cardBg: HusTheme.isDark ? "#15171b" : starkWhite
    readonly property color surfaceSoft: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.04) : "#f3f4f6"
    readonly property color cardBorder: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.09) : Qt.rgba(0, 0, 0, 0.07)
    readonly property color divider: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.07) : Qt.rgba(0, 0, 0, 0.06)

    // 文本层级
    readonly property color textPrimary: HusTheme.isDark ? "#f4f4f5" : "#09090b"
    readonly property color textSecondary: HusTheme.isDark ? "#a1a1aa" : "#52525b"
    readonly property color textTertiary: HusTheme.isDark ? "#71717a" : "#71717a"
    readonly property color textDisabled: HusTheme.isDark ? "#52525b" : "#a1a1aa"

    // 语义状态
    readonly property color statusSuccess: "#10b981"
    readonly property color statusWarning: "#f59e0b"
    readonly property color statusCritical: "#ef4444"
    readonly property color watermark: HusTheme.isDark ? Qt.rgba(1, 1, 1, 0.04) : Qt.rgba(0, 0, 0, 0.03)

    // 圆角标准
    readonly property real radiusSm: 4
    readonly property real radiusMd: 8
    readonly property real radiusLg: 12
    readonly property real radiusXl: 16
    readonly property real radiusPill: 100
}
