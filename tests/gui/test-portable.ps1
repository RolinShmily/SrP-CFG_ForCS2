param([Parameter(Mandatory=$true)][string]$PackageDir)
$ErrorActionPreference = 'Stop'
$package = (Resolve-Path $PackageDir).Path
function Get-PeSubsystem([string]$Executable) {
    $bytes = [IO.File]::ReadAllBytes($Executable)
    $pe = [BitConverter]::ToInt32($bytes, 0x3c)
    if ([BitConverter]::ToUInt32($bytes, $pe) -ne 0x00004550) { throw "Invalid PE executable: $Executable" }
    return [BitConverter]::ToUInt16($bytes, $pe + 24 + 68)
}
if ((Get-PeSubsystem (Join-Path $package 'SrP-CFG.exe')) -ne 2) { throw 'GUI must use the Windows subsystem (no console)' }
foreach ($required in @('vcruntime140.dll', 'msvcp140.dll', 'LICENSE.txt', 'THIRD_PARTY_NOTICES.txt', 'content/srp-cfg/runtime/init.cfg', 'content/video/cs2_video.txt', 'content/annotations/catalog.json')) {
    if (!(Test-Path (Join-Path $package $required))) { throw "Missing required package file: $required" }
}
$temporary = Join-Path ([IO.Path]::GetTempPath()) ('srp-portable-' + [Guid]::NewGuid().ToString('N'))
$oldPath = $env:PATH
$oldImports = $env:QML2_IMPORT_PATH
$oldPlugins = $env:QT_PLUGIN_PATH
$oldLocal = $env:LOCALAPPDATA
try {
    New-Item -ItemType Directory -Path $temporary | Out-Null
    # A different location catches compiled-in absolute QML import paths.
    Copy-Item $package -Destination "$temporary/app" -Recurse
    $appDir = Join-Path $temporary 'app'
    $env:PATH = "$appDir;$env:SystemRoot/System32;$env:SystemRoot"
    $env:QML2_IMPORT_PATH = ''
    $env:QT_PLUGIN_PATH = ''
    $env:LOCALAPPDATA = Join-Path $temporary 'profile'
    Push-Location $appDir
    try {
        # Only inspect log entries emitted by this launch, not a copied developer log.
        Remove-Item 'srp_gui_debug.log' -Force -ErrorAction SilentlyContinue
        $image = Join-Path $temporary 'overview.png'
        $process = Start-Process "$appDir/SrP-CFG.exe" -ArgumentList @('--store', "$temporary/store", '--screenshot', $image) -PassThru
        if (!$process.WaitForExit(30000)) { $process.Kill(); throw 'Portable GUI startup timed out' }
        if ($process.ExitCode -ne 0 -or !(Test-Path $image) -or (Get-Item $image).Length -lt 1000) { throw "Portable GUI failed to render (exit $($process.ExitCode))" }
        $log = Get-Content 'srp_gui_debug.log' -Raw
        if ($log -match 'Failed to load|is not installed|TypeError|ReferenceError|Unable to assign') { throw "Portable QML runtime error: $log" }
        if (!(Test-Path "$temporary/store/current.txt")) { throw 'Offline content package initialization failed' }
        Write-Host 'Relocated GUI rendering and offline content packages verified.'
    } finally { Pop-Location }
} finally {
    $env:PATH = $oldPath
    $env:QML2_IMPORT_PATH = $oldImports
    $env:QT_PLUGIN_PATH = $oldPlugins
    $env:LOCALAPPDATA = $oldLocal
    Remove-Item $temporary -Recurse -Force -ErrorAction SilentlyContinue
}
