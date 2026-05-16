using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Windows.Input;
using SrPInstaller.Commands;
using SrPInstaller.Models;

namespace SrPInstaller.ViewModels;

public class DownloadViewModel
{
    public const string GitHubReleasesUrl = "https://github.com/RolinShmily/SrP-CFG_ForCS2/releases";
    public const string MsiDownloadUrl = "https://drive.srprolin.top/SrP-CFG/SrP-CFG_Installer.msi";

    public ObservableCollection<DownloadItem> DownloadItems { get; }
    public ICommand OpenUrlCommand { get; }

    public DownloadViewModel()
    {
        DownloadItems = new ObservableCollection<DownloadItem>(BuildDownloadItems());
        OpenUrlCommand = new RelayCommand(p => OpenUrl(p?.ToString()));
    }

    private static List<DownloadItem> BuildDownloadItems() =>
    [
        new("官方完整版", "Allcfgs.zip", "包含所有官方配置文件的完整版本", null, GitHubReleasesUrl),
        new("Echo 定制版", "Allcfgs_echo.zip", "基于官方版，使用 Echo 的自定义 custom.cfg", "仅替换 custom.cfg", GitHubReleasesUrl),
        new("yszh 定制版", "Allcfgs_yszh.zip", "基于官方版，使用 yszh 的自定义 custom.cfg", "仅替换 custom.cfg", GitHubReleasesUrl),
        new("VisionL 定制版", "Allcfgs_visionl.zip", "基于官方版，使用 VisionL 的自定义 custom.cfg", "仅替换 custom.cfg", GitHubReleasesUrl),
        new("MSI 安装器", "SrP-CFG_Installer.msi", "Windows 标准安装包，自动创建快捷方式，支持系统级卸载", null, MsiDownloadUrl),
        new("便携版", "SrP-CFG_Installer.exe", "单文件自包含发布，无需安装，下载即可直接运行", "需 .NET 8 Runtime", GitHubReleasesUrl),
    ];

    private static void OpenUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return;
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
        {
            FileName = url,
            UseShellExecute = true
        });
    }
}
