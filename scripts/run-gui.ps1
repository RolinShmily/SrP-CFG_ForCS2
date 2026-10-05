param([string]$BuildDir = 'build-gui', [string]$Configuration = 'Release', [Parameter(ValueFromRemainingArguments=$true)][string[]]$AppArgs)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$build = if ([IO.Path]::IsPathRooted($BuildDir)) { $BuildDir } else { Join-Path $repo $BuildDir }
$exe = Join-Path $build "app/gui/$Configuration/srp_gui.exe"
if (!(Test-Path $exe)) { $exe = Join-Path $build 'app/gui/srp_gui.exe' }
if (!(Test-Path $exe)) { throw 'Build the GUI first: cmake --preset windows-msvc; cmake --build --preset release-msvc' }
$cache = Get-Content (Join-Path $build 'CMakeCache.txt')
$qtConfig = $cache | Where-Object { $_ -match '^Qt6_DIR:[^=]+=' } | Select-Object -First 1
if (!$qtConfig) { throw 'Qt6_DIR is missing from CMakeCache.txt' }
$qtRoot = [IO.Path]::GetFullPath((Join-Path (($qtConfig -split '=',2)[1]) '../../..'))
$env:PATH = "$qtRoot/bin;$build/HuskarUI/bin/$Configuration;$build/HuskarUI/bin;$(Split-Path $exe);$env:PATH"
Push-Location $repo
try { & $exe @AppArgs; if ($LASTEXITCODE -ne 0) { throw "GUI exited with code $LASTEXITCODE" } }
finally { Pop-Location }
