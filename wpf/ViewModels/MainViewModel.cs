using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using SrPInstaller.Commands;
using SrPInstaller.Services;

namespace SrPInstaller.ViewModels;

public class MainViewModel : INotifyPropertyChanged
{
    private readonly UpdateService _updateService;
    private UpdateService.UpdateInfo? _latestUpdateInfo;

    public InstallViewModel InstallVM { get; }
    public DownloadViewModel DownloadVM { get; }
    public AboutViewModel AboutVM { get; }

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

    public string AppVersion => AboutVM.AppVersion;

    public ICommand OpenUrlCommand => AboutVM.OpenUrlCommand;
    public ICommand OpenReleaseCommand { get; }
    public ICommand DismissUpdateCommand { get; }

    public MainViewModel()
    {
        _updateService = new UpdateService();

        var installer = new InstallerService();
        InstallVM = new InstallViewModel(installer);
        DownloadVM = new DownloadViewModel();
        AboutVM = new AboutViewModel();

        OpenReleaseCommand = new RelayCommand(_ => OpenRelease());
        DismissUpdateCommand = new RelayCommand(_ => DismissUpdate());
    }

    public async Task CheckForUpdatesAsync()
    {
        try
        {
            var updateInfo = await _updateService.CheckForUpdateAsync();
            if (updateInfo != null)
            {
                _latestUpdateInfo = updateInfo;
                _ = Application.Current.Dispatcher.InvokeAsync(() =>
                {
                    UpdateMessage = $"发现新版本：v{updateInfo.LatestVersion}（当前 v{updateInfo.CurrentVersion}）";
                    IsUpdateAvailable = true;
                });
            }
        }
        catch { }
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
            _updateService.SaveDismissedVersion(_latestUpdateInfo.LatestVersion);
        IsUpdateAvailable = false;
    }

    public event PropertyChangedEventHandler? PropertyChanged;
    protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
