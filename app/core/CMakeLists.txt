cmake_minimum_required(VERSION 3.20)
project(srp_core CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

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
)

target_compile_definitions(srp_core PRIVATE SRP_APP_VERSION="${CMAKE_PROJECT_VERSION}")

target_include_directories(srp_core PUBLIC
    include
)

if(WIN32)
    target_link_libraries(srp_core PRIVATE advapi32 shell32 winhttp bcrypt)
endif()

if(BUILD_TESTING)
    foreach(name IN ITEMS config media catalog app_update)
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
    set_tests_properties(config_operations media_packages catalog_extension app_update
        PROPERTIES WORKING_DIRECTORY "${CMAKE_SOURCE_DIR}" TIMEOUT 120)
endif()
