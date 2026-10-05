param([Parameter(Mandatory=$true)][string]$PackageDir, [Parameter(Mandatory=$true)][string]$Version)
$ErrorActionPreference = 'Stop'
$package = (Resolve-Path $PackageDir).Path
foreach ($required in @('vcruntime140.dll', 'msvcp140.dll')) {
    if (!(Test-Path (Join-Path $package $required))) { throw "Missing app-local MSVC runtime: $required" }
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
    $actual = & "$appDir/srp.exe" version
    if ($LASTEXITCODE -ne 0 -or ($actual -join "`n").Trim() -ne $Version) { throw "Unexpected packaged CLI version: $actual" }
    Push-Location $appDir
    try {
        $image = Join-Path $temporary 'overview.png'
        $process = Start-Process "$appDir/SrP-CFG.exe" -ArgumentList @('--store', "$temporary/store", '--screenshot', $image) -PassThru
        if (!$process.WaitForExit(30000)) { $process.Kill(); throw 'Portable GUI startup timed out' }
        if ($process.ExitCode -ne 0 -or !(Test-Path $image) -or (Get-Item $image).Length -lt 1000) { throw "Portable GUI failed to render (exit $($process.ExitCode))" }
        $log = Get-Content 'srp_gui_debug.log' -Raw
        if ($log -match 'Failed to load|is not installed|TypeError|ReferenceError|Unable to assign') { throw "Portable QML runtime error: $log" }
        if (!(Test-Path "$temporary/store/current.txt")) { throw 'Offline package initialization failed' }
        Write-Host 'Portable CLI, relocated GUI rendering and offline packages verified.'
    } finally { Pop-Location }
} finally {
    $env:PATH = $oldPath
    $env:QML2_IMPORT_PATH = $oldImports
    $env:QT_PLUGIN_PATH = $oldPlugins
    $env:LOCALAPPDATA = $oldLocal
    Remove-Item $temporary -Recurse -Force -ErrorAction SilentlyContinue
}
