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

set_source_files_properties(qml/MetaTheme.qml qml/components/AppFeedback.qml
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

set(HUSKARUI_IMPORT_PATH "${CMAKE_BINARY_DIR}/HuskarUI/qml")
target_compile_definitions(srp_gui PRIVATE
    HUSKARUI_IMPORT_PATH="${HUSKARUI_IMPORT_PATH}"
)

qt_add_qml_module(srp_gui
    URI SrPGui
    VERSION 1.0
    RESOURCE_PREFIX "/"
    QML_FILES
        qml/Main.qml
        qml/MetaTheme.qml
        qml/components/AppModal.qml
        qml/components/AppDialog.qml
        qml/components/AboutDialog.qml
        qml/components/SettingsDialog.qml
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
        qml/components/MediaEditorPanel.qml
        qml/pages/VideoPage.qml
        qml/pages/AnnotationsPage.qml
    RESOURCES
        resources/icon.png
        resources/favicon.ico
        resources/font/HuskarUI-Icons.ttf
        resources/images/cs2_logo.svg
        resources/images/cs2_official_banner.jpg
        resources/icons/overview.svg
        resources/icons/presets.svg
        resources/icons/assembly.svg
        resources/icons/video.svg
        resources/icons/map.svg
        resources/icons/info.svg
        resources/icons/settings.svg
        resources/icons/sun.svg
        resources/icons/moon.svg
        resources/icons/globe.svg
        resources/icons/play.svg
        resources/icons/undo.svg
        resources/icons/folder.svg
        resources/icons/user.svg
        resources/icons/refresh.svg
        resources/icons/trash.svg
        resources/icons/minimize.svg
        resources/icons/maximize.svg
        resources/icons/close.svg
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
