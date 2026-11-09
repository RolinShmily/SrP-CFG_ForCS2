; SrP-CFG - Inno Setup Installer Script
; Defines can be passed from command line via /DMyAppVersion=v3.4.8 /DSourceDir=... /DOutputDir=...

#ifndef MyAppVersion
  #define MyAppVersion "v3.4.8"
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
SetupIconFile=..\src\gui\resources\favicon.ico
UninstallDisplayIcon={app}\SrP-CFG.exe
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
ChangesEnvironment=yes

[Languages]
Name: "chinesesimplified"; MessagesFile: "ChineseSimplified.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[CustomMessages]
english.AddCliPath=Add SrP-CFG CLI (srpcfg.exe) to the current user PATH
chinesesimplified.AddCliPath=将 SrP-CFG CLI（srpcfg.exe）添加到当前用户 PATH
english.AdditionalTasks=Additional tasks:
chinesesimplified.AdditionalTasks=附加任务：

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "addclitopath"; Description: "{cm:AddCliPath}"; GroupDescription: "{cm:AdditionalTasks}"; Flags: checkedonce

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\SrP-CFG"; Filename: "{app}\SrP-CFG.exe"
Name: "{group}\{cm:UninstallProgram,SrP-CFG}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\SrP-CFG"; Filename: "{app}\SrP-CFG.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\SrP-CFG.exe"; Description: "{cm:LaunchProgram,SrP-CFG}"; Flags: nowait postinstall skipifsilent

[Code]
const
  EnvironmentKey = 'Environment';

function NormalizePathEntry(const Entry: String): String;
var
  Value: String;
begin
  Value := Trim(Entry);
  if (Length(Value) >= 2) and (Value[1] = '"') and (Value[Length(Value)] = '"') then
    Value := Trim(Copy(Value, 2, Length(Value) - 2));
  Result := Value;
end;

function PathContains(const Paths, Entry: String): Boolean;
var
  Start, I: Integer;
  Part: String;
begin
  Result := False;
  Start := 1;
  for I := 1 to Length(Paths) + 1 do
    if (I > Length(Paths)) or (Paths[I] = ';') then
    begin
      Part := NormalizePathEntry(Copy(Paths, Start, I - Start));
      if CompareText(Part, Entry) = 0 then
      begin
        Result := True;
        Exit;
      end;
      Start := I + 1;
    end;
end;

function RemovePathEntry(const Paths, Entry: String): String;
var
  Start, I: Integer;
  Part: String;
begin
  Result := '';
  Start := 1;
  for I := 1 to Length(Paths) + 1 do
    if (I > Length(Paths)) or (Paths[I] = ';') then
    begin
      Part := Copy(Paths, Start, I - Start);
      if (Trim(Part) <> '') and (CompareText(NormalizePathEntry(Part), Entry) <> 0) then
      begin
        if Result <> '' then
          Result := Result + ';';
        Result := Result + Part;
      end;
      Start := I + 1;
    end;
end;

procedure AddCliToUserPath();
var
  Paths, Entry: String;
begin
  Entry := ExpandConstant('{app}');
  if not RegQueryStringValue(HKCU, EnvironmentKey, 'Path', Paths) then
    Paths := '';
  if PathContains(Paths, Entry) then
    Exit;
  if Paths <> '' then
    Paths := Paths + ';';
  Paths := Paths + Entry;
  RegWriteExpandStringValue(HKCU, EnvironmentKey, 'Path', Paths);
end;

procedure RemoveCliFromUserPath();
var
  Paths, Entry, NewPaths: String;
begin
  Entry := ExpandConstant('{app}');
  if not RegQueryStringValue(HKCU, EnvironmentKey, 'Path', Paths) then
    Exit;
  NewPaths := RemovePathEntry(Paths, Entry);
  if NewPaths <> Paths then
    RegWriteExpandStringValue(HKCU, EnvironmentKey, 'Path', NewPaths);
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if (CurStep = ssPostInstall) and WizardIsTaskSelected('addclitopath') then
    AddCliToUserPath();
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usUninstall then
    RemoveCliFromUserPath();
end;
