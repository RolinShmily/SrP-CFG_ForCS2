cmake_minimum_required(VERSION 3.20)
project(srp_gui CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(NOT TARGET HuskarUIBasic)
    set(BUILD_HUSKARUI_GALLERY OFF CACHE BOOL "" FORCE)
    set(BUILD_HUSKARUI_ON_DESKTOP_PLATFORM ON CACHE BOOL "" FORCE)
    set(INSTALL_HUSKARUI_IN_DEFAULT_LOCATION OFF CACHE BOOL "" FORCE)
    add_subdirectory(3rdparty/HuskarUI)
endif()

find_package(Qt6 6.5 COMPONENTS Core Gui Quick QuickControls2 Concurrent REQUIRED)
qt_standard_project_setup(REQUIRES 6.5)

if(QT_KNOWN_POLICY_QTP0004)
    qt_policy(SET QTP0004 NEW)
endif()

set_source_files_properties(qml/MetaTheme.qml qml/AppIcons.qml qml/components/AppFeedback.qml
    PROPERTIES
        QT_QML_SINGLETON_TYPE TRUE
)

set(GUI_RC_FILE "")
if(WIN32)
    set(GUI_RC_FILE resources/app.rc)
endif()

qt_add_executable(srp_gui
    src/main.cpp
    src/overview_controller.h
    src/overview_controller.cpp
    src/presets_controller.h
    src/presets_controller.cpp
    src/assembly_controller.h
    src/assembly_controller.cpp
    src/package_controller.h
    src/package_controller.cpp
    src/media_controller.h
    src/media_controller.cpp
    src/preferences_controller.h
    src/preferences_controller.cpp
    src/app_update_controller.h
    src/app_update_controller.cpp
    src/cs2_cfg_highlighter.h
    src/cs2_cfg_highlighter.cpp
    src/code_editor_gutter.h
    src/code_editor_gutter.cpp
    ${GUI_RC_FILE}
)

# Desktop GUI applications must not allocate a console when launched on Windows.
set_target_properties(srp_gui PROPERTIES WIN32_EXECUTABLE TRUE)

set(HUSKARUI_IMPORT_PATH "${CMAKE_BINARY_DIR}/HuskarUI/qml")
target_compile_definitions(srp_gui PRIVATE
    HUSKARUI_IMPORT_PATH="${HUSKARUI_IMPORT_PATH}"
)

set(LUCIDE_ICON_RESOURCES
    resources/icons/lucide/blocks.svg
    resources/icons/lucide/info.svg
    resources/icons/lucide/layout-dashboard.svg
    resources/icons/lucide/keyboard.svg
    resources/icons/lucide/layers.svg
    resources/icons/lucide/map.svg
    resources/icons/lucide/monitor.svg
    resources/icons/lucide/settings.svg
    resources/icons/lucide/sliders-horizontal.svg
    resources/icons/lucide/check.svg
    resources/icons/lucide/chevron-down.svg
    resources/icons/lucide/chevron-right.svg
    resources/icons/lucide/chevrons-left.svg
    resources/icons/lucide/chevrons-right.svg
    resources/icons/lucide/circle-play.svg
    resources/icons/lucide/copy.svg
    resources/icons/lucide/download.svg
    resources/icons/lucide/external-link.svg
    resources/icons/lucide/file-text.svg
    resources/icons/lucide/globe.svg
    resources/icons/lucide/folder.svg
    resources/icons/lucide/folder-open.svg
    resources/icons/lucide/languages.svg
    resources/icons/lucide/moon.svg
    resources/icons/lucide/pencil.svg
    resources/icons/lucide/refresh-cw.svg
    resources/icons/lucide/rotate-ccw.svg
    resources/icons/lucide/rotate-cw.svg
    resources/icons/lucide/save.svg
    resources/icons/lucide/search.svg
    resources/icons/lucide/sun.svg
    resources/icons/lucide/trash.svg
    resources/icons/lucide/type.svg
    resources/icons/lucide/unplug.svg
    resources/icons/lucide/user.svg
    resources/icons/lucide/x.svg
)

qt_add_qml_module(srp_gui
    URI SrPGui
    VERSION 1.0
    RESOURCE_PREFIX "/"
    QML_FILES
        qml/Main.qml
        qml/MetaTheme.qml
        qml/AppIcons.qml
        qml/components/AppModal.qml
        qml/components/AppFeedback.qml
        qml/components/AppButton.qml
        qml/components/AppIcon.qml
        qml/components/AppCodeEditor.qml
        qml/components/AppHeaderExtras.qml
        qml/components/AppSidebar.qml
        qml/pages/OverviewPage.qml
        qml/pages/PresetsPage.qml
        qml/components/AssemblyModuleCard.qml
        qml/pages/AssemblyPage.qml
        qml/components/PackagePanel.qml
        qml/components/RuntimePanel.qml
        qml/components/MediaEditorPanel.qml
        qml/pages/VideoPage.qml
        qml/pages/AnnotationsPage.qml
        qml/pages/AboutPage.qml
        qml/pages/SettingsPage.qml
    RESOURCES
        resources/icon.png
        resources/favicon.ico
        resources/font/HuskarUI-Icons.ttf
        resources/images/cs2_logo.svg
        resources/images/cs2_official_banner.jpg
        ${LUCIDE_ICON_RESOURCES}
)

target_include_directories(srp_gui PRIVATE
    src
    ${CMAKE_CURRENT_SOURCE_DIR}/3rdparty/HuskarUI/src/cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/3rdparty/HuskarUI/src/cpp/theme
    ${CMAKE_CURRENT_SOURCE_DIR}/3rdparty/HuskarUI/src/cpp/utils
    ${CMAKE_CURRENT_SOURCE_DIR}/3rdparty/HuskarUI/src/cpp/controls
)

target_link_libraries(srp_gui PRIVATE
    srp_core
    HuskarUIBasic
    HuskarUIImpl
    Qt6::Core
    Qt6::Gui
    Qt6::Quick
    Qt6::QuickControls2
    Qt6::Concurrent
)
