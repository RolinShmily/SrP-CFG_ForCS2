cmake_minimum_required(VERSION 3.20)
project(srp_cli CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(srp_cli
    src/main.cpp
)

# Keep the internal target name stable; expose one CLI name in builds and releases.
set_target_properties(srp_cli PROPERTIES OUTPUT_NAME srpcfg)

target_link_libraries(srp_cli PRIVATE
    srp_core
)

if(BUILD_TESTING)
    find_package(Python3 COMPONENTS Interpreter QUIET)
    if(Python3_Interpreter_FOUND)
        add_test(NAME srpcfg_cli_skill COMMAND "${Python3_EXECUTABLE}"
            "${CMAKE_SOURCE_DIR}/skills/srpcfg-cli/evals/run_cli_checks.py"
            --exe "$<TARGET_FILE:srp_cli>" --bundle "${CMAKE_SOURCE_DIR}/config")
        set_tests_properties(srpcfg_cli_skill PROPERTIES TIMEOUT 120)
    endif()
endif()
