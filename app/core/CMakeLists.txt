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

# Explicit target; configuration operations are verified in an isolated temporary directory.
add_executable(srp_config_tests EXCLUDE_FROM_ALL tests/config_operations_test.cpp)
target_link_libraries(srp_config_tests PRIVATE srp_core)
add_executable(srp_media_tests EXCLUDE_FROM_ALL tests/media_packages_test.cpp)
target_link_libraries(srp_media_tests PRIVATE srp_core)
add_executable(srp_catalog_tests EXCLUDE_FROM_ALL tests/catalog_test.cpp)
target_link_libraries(srp_catalog_tests PRIVATE srp_core)
add_executable(srp_app_update_tests EXCLUDE_FROM_ALL tests/app_update_test.cpp)
target_link_libraries(srp_app_update_tests PRIVATE srp_core)
