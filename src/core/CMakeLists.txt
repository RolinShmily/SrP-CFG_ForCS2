cmake_minimum_required(VERSION 3.20)

# Allow configuring src/core on its own (no root project, no Qt, no CLI).
if(NOT DEFINED SRP_APP_VERSION)
    set(SRP_APP_VERSION "0.0.0" CACHE STRING "Application release version")
    message(STATUS "srp_core standalone build: SRP_APP_VERSION defaults to ${SRP_APP_VERSION}")
endif()
project(srp_core VERSION ${SRP_APP_VERSION} LANGUAGES CXX)

include(CTest)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Source files contain UTF-8 comments; keep MSVC parsing independent of the host code page.
if(MSVC)
    add_compile_options(/utf-8)
endif()

find_package(Threads REQUIRED)

add_library(srp_core STATIC
    src/detection.cpp
    src/i18n.cpp
    src/vcfg.cpp
    src/actions.cpp
    src/preset.cpp
    src/config_backup.cpp
    src/assembly.cpp
    src/catalog.cpp
    src/packages.cpp
    src/media_config.cpp
    src/app_update.cpp
    src/text_document.cpp
)

target_compile_definitions(srp_core PRIVATE SRP_APP_VERSION="${SRP_APP_VERSION}")

target_include_directories(srp_core PUBLIC
    include
)

target_link_libraries(srp_core PRIVATE Threads::Threads)

if(WIN32)
    target_link_libraries(srp_core PRIVATE advapi32 shell32 winhttp bcrypt)
endif()

if(BUILD_TESTING)
    foreach(name IN ITEMS config media catalog app_update text_document)
        if(name STREQUAL "config")
            set(source config_operations_test.cpp)
        elseif(name STREQUAL "media")
            set(source media_packages_test.cpp)
        else()
            set(source ${name}_test.cpp)
        endif()
        add_executable(srp_${name}_tests tests/${source})
        target_link_libraries(srp_${name}_tests PRIVATE srp_core)
    endforeach()
    add_test(NAME config_operations COMMAND srp_config_tests)
    add_test(NAME media_packages COMMAND srp_media_tests "${PROJECT_SOURCE_DIR}/../../config")
    add_test(NAME catalog_extension COMMAND srp_catalog_tests)
    add_test(NAME app_update COMMAND srp_app_update_tests)
    add_test(NAME text_document COMMAND srp_text_document_tests)
    set_tests_properties(config_operations media_packages catalog_extension app_update text_document
        PROPERTIES WORKING_DIRECTORY "${CMAKE_SOURCE_DIR}" TIMEOUT 120)
endif()
