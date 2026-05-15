using System;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.ComponentModel;
using System.IO;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using SrPInstaller.Commands;
using SrPInstaller.Models;

namespace SrPInstaller.ViewModels;

public class MainViewModel : INotifyPropertyChanged
{
    private readonly InstallerService _installer;
    private readonly UpdateService _updateService;
    private UpdateService.UpdateInfo? _latestUpdateInfo;
    private string[]? _selectedFiles;

    #region Dialog Callbacks (set by View)

    public Func<string, string?>? BrowseFolderFunc { get; set; }
    public Func<string[]?>? BrowseFilesFunc { get; set; }

    #endregion

    #region Bindable Properties

    // Proxy properties from InstallerService
    public string? Cs2CfgPath => _installer.Cs2CfgPath;
    public string? VideoCfgPath => _installer.VideoCfgPath;
    public string? AnnotationsPath => _installer.AnnotationsPath;
    public string? CfgBackupPath => _installer.CfgBackupPath;
    public string? VideoBackupPath => _installer.VideoBackupPath;
    public string? AnnotationsBackupPath => _installer.AnnotationsBackupPath;

    // Steam users
    public ObservableCollection<string> SteamUsers { get; }

    private int _selectedSteamUserIndex = -1;
    public int SelectedSteamUserIndex
    {
        get => _selectedSteamUserIndex;
        set
        {
            if (_selectedSteamUserIndex != value)
            {
                _selectedSteamUserIndex = value;
                OnPropertyChanged();
                OnSteamUserChanged(value);
            }
        }
    }

    // Install target checkboxes
    private bool _installCfgChecked = true;
    public bool InstallCfgChecked
    {
        get => _installCfgChecked;
        set { if (_installCfgChecked != value) { _installCfgChecked = value; OnPropertyChanged(); } }
    }

    private bool _installVideoChecked;
    public bool InstallVideoChecked
    {
        get => _installVideoChecked;
        set { if (_installVideoChecked != value) { _installVideoChecked = value; OnPropertyChanged(); } }
    }

    private bool _installAnnotationsChecked;
    public bool InstallAnnotationsChecked
    {
        get => _installAnnotationsChecked;
        set { if (_installAnnotationsChecked != value) { _installAnnotationsChecked = value; OnPropertyChanged(); } }
    }

    // Selected file display
    private string _selectedFileDisplay = "";
    public string SelectedFileDisplay
    {
        get => _selectedFileDisplay;
        set { if (_selectedFileDisplay != value) { _selectedFileDisplay = value; OnPropertyChanged(); } }
    }

    // Progress flags
    private bool _isBackupInProgress;
    public bool IsBackupInProgress
    {
        get => _isBackupInProgress;
        set { if (_isBackupInProgress != value) { _isBackupInProgress = value; OnPropertyChanged(); } }
    }

    private bool _isInstallInProgress;
    public bool IsInstallInProgress
    {
        get => _isInstallInProgress;
        set
        {
            if (_isInstallInProgress != value)
            {
                _isInstallInProgress = value;
                OnPropertyChanged();
                OnPropertyChanged(nameof(InstallButtonText));
            }
        }
    }

    public string InstallButtonText => IsInstallInProgress ? "安装中..." : "开始安装";

    // Update notification
    private bool _isUpdateAvailable;
    public bool IsUpdateAvailable
    {
        get => _isUpdateAvailable;
        set { if (_isUpdateAvailable != value) { _isUpdateAvailable = value; OnPropertyChanged(); } }
    }

    private string _updateMessage = "";
    public string UpdateMessage
    {
        get => _updateMessage;
        set { if (_updateMessage != value) { _updateMessage = value; OnPropertyChanged(); } }
    }

    // Log entries
    public ObservableCollection<LogEntry> LogEntries { get; }

    #endregion

    #region Commands

    public ICommand RefreshCommand { get; }
    public ICommand BackupCommand { get; }
    public ICommand InstallCommand { get; }
    public ICommand SelectFileCommand { get; }
    public ICommand SelectCfgFolderCommand { get; }
    public ICommand SelectVideoFolderCommand { get; }
    public ICommand SelectAnnotationsFolderCommand { get; }
    public ICommand OpenReleaseCommand { get; }
    public ICommand DismissUpdateCommand { get; }
    public ICommand OpenCfgBackupCommand { get; }
    public ICommand OpenVideoBackupCommand { get; }
    public ICommand OpenAnnotationsBackupCommand { get; }

    #endregion

    public MainViewModel()
    {
        _installer = new InstallerService();
        _updateService = new UpdateService();

        _installer.OnLog += OnInstallerLog;
        _installer.PropertyChanged += OnInstallerServicePropertyChanged;

        SteamUsers = new ObservableCollection<string>();
        LogEntries = new ObservableCollection<LogEntry>();

        // Initialize commands
        RefreshCommand = new RelayCommand(_ => RefreshAllPaths());
        BackupCommand = new RelayCommand(_ => BackupAll(), _ => !IsBackupInProgress);
        InstallCommand = new AsyncRelayCommand(_ => InstallSelectedFilesAsync(), _ => !IsInstallInProgress);
        SelectFileCommand = new RelayCommand(_ => SelectFiles());
        SelectCfgFolderCommand = new RelayCommand(_ => SelectCfgFolder());
        SelectVideoFolderCommand = new RelayCommand(_ => SelectVideoFolder());
        SelectAnnotationsFolderCommand = new RelayCommand(_ => SelectAnnotationsFolder());
        OpenReleaseCommand = new RelayCommand(_ => OpenRelease());
        DismissUpdateCommand = new RelayCommand(_ => DismissUpdate());
        OpenCfgBackupCommand = new RelayCommand(_ => OpenBackupInExplorer(CfgBackupPath));
        OpenVideoBackupCommand = new RelayCommand(_ => OpenBackupInExplorer(VideoBackupPath));
        OpenAnnotationsBackupCommand = new RelayCommand(_ => OpenBackupInExplorer(AnnotationsBackupPath));
    }

    #region Public Methods (called from View)

    public async Task CheckForUpdatesAsync()
    {
        try
        {
            var updateInfo = await _updateService.CheckForUpdateAsync();
            if (updateInfo != null)
            {
                _latestUpdateInfo = updateInfo;
                Application.Current.Dispatcher.Invoke(() =>
                {
                    UpdateMessage = $"发现新版本：v{updateInfo.LatestVersion}（当前 v{updateInfo.CurrentVersion}）";
                    IsUpdateAvailable = true;
                });
            }
        }
        catch
        {
            // Update check failure does not affect main flow
        }
    }

    public void HandleDroppedFiles(string[] files)
    {
        _selectedFiles = files;

        if (files.Length == 1 && files[0].EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
        {
            SelectedFileDisplay = $"已选择: {Path.GetFileName(files[0])} (ZIP)";
            Log($"[OK] 已选择 ZIP 文件: {files[0]}");
        }
        else
        {
            SelectedFileDisplay = $"已选择: {files.Length} 个文件";
            Log($"[OK] 已选择 {files.Length} 个文件");
        }
    }

    #endregion

    #region Private Logic

    public void RefreshAllPaths()
    {
        Log("[~] 正在检测 Steam 路径...");
        _installer.DetectSteamPath();

        if (_installer.SteamPath != null)
        {
            Log("[~] 正在检测 全局CFG 路径...");
            _installer.DetectCS2CfgPath(_installer.SteamPath);

            Log("[~] 正在检测 地图指南 路径...");
            _installer.DetectAnnotationsPath(_installer.SteamPath);

            RefreshSteamUsers();

            // Default select first user
            Application.Current.Dispatcher.Invoke(() =>
            {
                if (SteamUsers.Count > 0)
                {
                    SelectedSteamUserIndex = 0;
                }
            });
        }
        else
        {
            Log("[!] 未找到 Steam 路径，部分功能将不可用。");
        }
    }

    private void RefreshSteamUsers()
    {
        if (_installer.SteamPath == null) return;

        try
        {
            var users = _installer.GetAvailableSteamUsers(_installer.SteamPath);

            Application.Current.Dispatcher.Invoke(() =>
            {
                SteamUsers.Clear();
                foreach (var user in users)
                    SteamUsers.Add(user);
            });

            if (users.Length == 1)
            {
                Log($"[OK] 检测到 1 个 Steam 用户");
            }
            else if (users.Length > 1)
            {
                Log($"[OK] 检测到 {users.Length} 个 Steam 用户");
            }
            else
            {
                Log("[!] 未检测到 Steam 用户");
            }
        }
        catch (Exception ex)
        {
            Log($"[!] 获取 Steam 用户列表失败：{ex.Message}");
        }
    }

    private void OnSteamUserChanged(int index)
    {
        if (index >= 0 && index < SteamUsers.Count)
        {
            var userId = SteamUsers[index];
            _installer.SetSteamUserId(userId);
        }
    }

    private void BackupAll()
    {
        IsBackupInProgress = true;
        try
        {
            Log("[~] === 开始手动备份 ===");

            if (_installer.Cs2CfgPath != null)
            {
                string cfgBackupPath = _installer.CreateCfgBackup(_installer.Cs2CfgPath);
                Log($"[OK] CFG 备份已创建: {cfgBackupPath}");
            }
            else
            {
                Log("[!] 未设置全局CFG路径，跳过CFG备份");
            }

            if (_installer.VideoCfgPath != null)
            {
                string videoBackupPath = _installer.CreateVideoCfgBackup(_installer.VideoCfgPath);
                Log($"[OK] 用户CFG(视频预设)备份已创建: {videoBackupPath}");
            }
            else
            {
                Log("[!] 未设置用户CFG(视频预设)路径，跳过用户CFG(视频预设)备份");
            }

            if (_installer.AnnotationsPath != null)
            {
                string annotationsBackupPath = _installer.CreateAnnotationsBackup(_installer.AnnotationsPath);
                Log($"[OK] 地图指南备份已创建: {annotationsBackupPath}");
            }
            else
            {
                Log("[!] 未设置地图指南路径，跳过地图指南备份");
            }

            Log("[OK] 手动备份完成！");
        }
        catch (Exception ex)
        {
            Log($"[!] 备份失败：{ex.Message}");
        }
        finally
        {
            IsBackupInProgress = false;
        }
    }

    public async Task InstallSelectedFilesAsync()
    {
        if (_selectedFiles == null || _selectedFiles.Length == 0)
        {
            Log("[!] 请先选择要安装的文件。");
            return;
        }

        if (!InstallCfgChecked && !InstallVideoChecked && !InstallAnnotationsChecked)
        {
            Log("[!] 请至少选择一项安装选项。");
            return;
        }

        if (InstallCfgChecked && _installer.Cs2CfgPath == null)
        {
            Log("[!] 未检测到 全局CFG 路径，无法安装 CFG 文件。");
            return;
        }

        if (InstallVideoChecked && _installer.VideoCfgPath == null)
        {
            Log("[!] 未检测到用户CFG(视频预设)路径，无法安装用户CFG(视频预设)。请选择正确的 Steam 用户。");
            return;
        }

        if (InstallAnnotationsChecked && _installer.AnnotationsPath == null)
        {
            Log("[!] 未检测到地图指南路径，无法安装地图指南。请先刷新路径检测。");
            return;
        }

        IsInstallInProgress = true;

        try
        {
            // Backup first
            Log("[~] === 开始备份 ===");
            if (InstallCfgChecked && _installer.Cs2CfgPath != null)
            {
                string cfgBackupPath = _installer.CreateCfgBackup(_installer.Cs2CfgPath);
                Log($"[OK] CFG 备份已创建: {cfgBackupPath}");
            }
            if (InstallVideoChecked && _installer.VideoCfgPath != null)
            {
                string videoBackupPath = _installer.CreateVideoCfgBackup(_installer.VideoCfgPath);
                Log($"[OK] 用户CFG(视频预设)备份已创建: {videoBackupPath}");
            }
            if (InstallAnnotationsChecked && _installer.AnnotationsPath != null)
            {
                string annotationsBackupPath = _installer.CreateAnnotationsBackup(_installer.AnnotationsPath);
                Log($"[OK] 地图指南备份已创建: {annotationsBackupPath}");
            }

            Log("\n[~] === 开始安装 ===");

            var files = _selectedFiles;
            var installCfg = InstallCfgChecked;
            var installVideo = InstallVideoChecked;
            var installAnnotations = InstallAnnotationsChecked;

            await Task.Run(() =>
            {
                if (files!.Length == 1 && files[0].EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
                {
                    _installer.InstallFromZip(files[0], installCfg, installVideo, installAnnotations);
                }
                else
                {
                    _installer.InstallFromFiles(files, installCfg, installVideo, installAnnotations);
                }
            });

            Log("\n[OK] 所有操作完成！");
        }
        catch (Exception ex)
        {
            Log($"[!] 安装失败：{ex.Message}");
        }
        finally
        {
            IsInstallInProgress = false;
        }
    }

    private void SelectFiles()
    {
        var files = BrowseFilesFunc?.Invoke();
        if (files != null && files.Length > 0)
        {
            _selectedFiles = files;

            if (files.Length == 1 && files[0].EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
            {
                SelectedFileDisplay = $"已选择: {Path.GetFileName(files[0])} (ZIP)";
                Log($"[OK] 已选择 ZIP 文件: {files[0]}");
            }
            else
            {
                SelectedFileDisplay = $"已选择: {files.Length} 个文件";
                Log($"[OK] 已选择 {files.Length} 个文件");
            }
        }
    }

    private void SelectCfgFolder()
    {
        var path = BrowseFolderFunc?.Invoke("选择全局CFG目录");
        if (path != null)
        {
            _installer.Cs2CfgPath = path;
            Log($"[OK] 已设置全局CFG路径：{path}");
        }
    }

    private void SelectVideoFolder()
    {
        var path = BrowseFolderFunc?.Invoke("选择用户CFG(视频预设)目录");
        if (path != null)
        {
            _installer.VideoCfgPath = path;
            Log($"[OK] 已设置用户CFG(视频预设)路径：{path}");
        }
    }

    private void SelectAnnotationsFolder()
    {
        var path = BrowseFolderFunc?.Invoke("选择地图指南目录");
        if (path != null)
        {
            _installer.AnnotationsPath = path;
            Log($"[OK] 已设置地图指南路径：{path}");
        }
    }

    private void OpenRelease()
    {
        if (_latestUpdateInfo != null)
        {
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = _latestUpdateInfo.HtmlUrl,
                UseShellExecute = true
            });
        }
    }

    private void DismissUpdate()
    {
        if (_latestUpdateInfo != null)
        {
            _updateService.SaveDismissedVersion(_latestUpdateInfo.LatestVersion);
        }
        IsUpdateAvailable = false;
    }

    private void OpenBackupInExplorer(string? backupPath)
    {
        if (string.IsNullOrEmpty(backupPath) || backupPath == "安装前将自动备份")
        {
            Log("[!] 目标文件无法选中，请预先备份或安装");
            return;
        }
        if (!File.Exists(backupPath))
        {
            Log("[!] 目标文件无法选中，请预先备份或安装");
            return;
        }
        System.Diagnostics.Process.Start("explorer.exe", $"/select,\"{backupPath}\"");
    }

    #endregion

    #region Event Handlers

    private void OnInstallerLog(string message)
    {
        var type = message.StartsWith("[OK]") ? LogType.Success :
                   message.StartsWith("[!]") ? LogType.Warning :
                   message.StartsWith("[~]") ? LogType.Info :
                   LogType.Info;

        Application.Current.Dispatcher.Invoke(() =>
        {
            LogEntries.Add(new LogEntry { Message = message, Type = type });
        });
    }

    private void Log(string message)
    {
        OnInstallerLog(message);
    }

    private void OnInstallerServicePropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        // Forward property change notifications from InstallerService
        switch (e.PropertyName)
        {
            case nameof(InstallerService.Cs2CfgPath):
                OnPropertyChanged(nameof(Cs2CfgPath));
                break;
            case nameof(InstallerService.VideoCfgPath):
                OnPropertyChanged(nameof(VideoCfgPath));
                break;
            case nameof(InstallerService.AnnotationsPath):
                OnPropertyChanged(nameof(AnnotationsPath));
                break;
            case nameof(InstallerService.CfgBackupPath):
                OnPropertyChanged(nameof(CfgBackupPath));
                break;
            case nameof(InstallerService.VideoBackupPath):
                OnPropertyChanged(nameof(VideoBackupPath));
                break;
            case nameof(InstallerService.AnnotationsBackupPath):
                OnPropertyChanged(nameof(AnnotationsBackupPath));
                break;
        }
    }

    #endregion

    #region INotifyPropertyChanged

    public event PropertyChangedEventHandler? PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    #endregion
}
