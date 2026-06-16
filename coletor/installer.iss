#define MyAppName "Coletor - Softcom Cuiabá"
#define MyAppVersion "1.0.0"
#define MyAppExeName "ColetorSoftcom.exe"
#define MyAppDir "dist\ColetorSoftcom"

[Setup]
AppId={{B4F3A2D1-1234-4567-ABCD-9876543210EF}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher=Softcom Cuiabá
DefaultDirName={autopf}\ColetorSoftcom
DefaultGroupName={#MyAppName}
OutputDir=installer_output
OutputBaseFilename=ColetorSoftcom_Setup_v1.0.0
SetupIconFile=assets\icone-novo.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
UninstallDisplayName={#MyAppName}
UninstallDisplayIcon={app}\{#MyAppExeName}
PrivilegesRequired=admin

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na Área de Trabalho"; GroupDescription: "Atalhos:";

[Files]
Source: "{#MyAppDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "ColetorSoftcom"; ValueData: """{app}\{#MyAppExeName}"""; Flags: uninsdeletevalue

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Iniciar {#MyAppName}"; Flags: nowait postinstall skipifsilent