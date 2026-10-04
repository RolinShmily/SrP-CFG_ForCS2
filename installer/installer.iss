; SrP-CFG - Inno Setup Installer Script
; Defines can be passed from command line via /DMyAppVersion=v3.4.0 /DSourceDir=... /DOutputDir=...

#ifndef MyAppVersion
  #define MyAppVersion "v3.4.0"
#endif

#ifndef SourceDir
  #define SourceDir "dist\srp-cfg-gui"
#endif

#ifndef OutputDir
  #define OutputDir "dist"
#endif

[Setup]
AppId={{E7D88147-380F-4859-994B-C4F4E4BC6C88}
AppName=SrP-CFG
AppVersion={#MyAppVersion}
AppVerName=SrP-CFG {#MyAppVersion}
AppPublisher=RoL1n_SrP
AppPublisherURL=https://github.com/RolinShmily/SrP-CFG_ForCS2
AppSupportURL=https://github.com/RolinShmily/SrP-CFG_ForCS2/issues
AppUpdatesURL=https://github.com/RolinShmily/SrP-CFG_ForCS2/releases
DefaultDirName={autopf}\SrP-CFG
DefaultGroupName=SrP-CFG
AllowNoIcons=yes
OutputDir={#OutputDir}
OutputBaseFilename=srp-cfg-{#MyAppVersion}-windows-x64-setup
SetupIconFile=..\app\gui\resources\favicon.ico
UninstallDisplayIcon={app}\SrP-CFG.exe
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

[Languages]
Name: "chinesesimplified"; MessagesFile: "ChineseSimplified.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\SrP-CFG"; Filename: "{app}\SrP-CFG.exe"
Name: "{group}\{cm:UninstallProgram,SrP-CFG}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\SrP-CFG"; Filename: "{app}\SrP-CFG.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\SrP-CFG.exe"; Description: "{cm:LaunchProgram,SrP-CFG}"; Flags: nowait postinstall skipifsilent
