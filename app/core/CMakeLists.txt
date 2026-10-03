cmake_minimum_required(VERSION 3.20)
project(srp_core CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(srp_core STATIC
    src/detection.cpp
    src/i18n.cpp
)

target_include_directories(srp_core PUBLIC
    include
)

if(WIN32)
    target_link_libraries(srp_core PRIVATE advapi32)
endif()
