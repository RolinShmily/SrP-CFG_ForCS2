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
)

target_include_directories(srp_core PUBLIC
    include
)

if(WIN32)
    target_link_libraries(srp_core PRIVATE advapi32 shell32)
endif()

# Explicit target; configuration operations are verified in an isolated temporary directory.
add_executable(srp_config_tests EXCLUDE_FROM_ALL tests/config_operations_test.cpp)
target_link_libraries(srp_config_tests PRIVATE srp_core)
