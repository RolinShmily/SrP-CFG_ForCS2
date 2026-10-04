@echo off
setlocal enabledelayedexpansion

set "APP_DIR=%~dp0build-gui\app\gui\Release"
set "HUSKAR_DIR=%~dp0build-gui\HuskarUI\bin\Release"
set "QT_BIN=C:\Qt\6.11.2\msvc2022_64\bin"

set "PATH=%QT_BIN%;%HUSKAR_DIR%;%APP_DIR%;%PATH%"

cd /d "%APP_DIR%"
start "" "%APP_DIR%\srp_gui.exe" %*

endlocal
