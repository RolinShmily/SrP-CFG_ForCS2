cmake_minimum_required(VERSION 3.20)
set(SRP_APP_VERSION "3.4.0" CACHE STRING "Application release version")
if(NOT SRP_APP_VERSION MATCHES "^[0-9]+[.][0-9]+[.][0-9]+$")
    message(FATAL_ERROR "SRP_APP_VERSION must be a stable major.minor.patch version")
endif()
project(srp_root VERSION ${SRP_APP_VERSION} LANGUAGES CXX)

# 自动探测 Windows 下的 Qt6 安装路径
if(NOT Qt6_FOUND AND NOT CMAKE_PREFIX_PATH)
    file(GLOB QT_CANDIDATE_DIRS "C:/Qt/6.*/msvc2022_64" "D:/Qt/6.*/msvc2022_64")
    if(QT_CANDIDATE_DIRS)
        list(REVERSE QT_CANDIDATE_DIRS)
        list(GET QT_CANDIDATE_DIRS 0 LATEST_QT)
        list(APPEND CMAKE_PREFIX_PATH "${LATEST_QT}")
        message(STATUS "Auto-detected Qt6 at: ${LATEST_QT}")
    endif()
endif()

add_subdirectory(app)
