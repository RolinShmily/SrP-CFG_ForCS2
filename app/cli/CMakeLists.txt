cmake_minimum_required(VERSION 3.20)
project(srp_cli CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(srp_cli
    src/main.cpp
)

target_link_libraries(srp_cli PRIVATE
    srp_core
)
