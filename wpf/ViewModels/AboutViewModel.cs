using System.Reflection;
using System.Windows.Input;
using SrPInstaller.Commands;

namespace SrPInstaller.ViewModels;

public class AboutViewModel
{
    public const string GitHubRepoUrl = "https://github.com/RolinShmily/SrP-CFG_ForCS2";
    public const string WebsiteUrl = "https://blog.srprolin.top/posts/srp-cfg/";
    public const string DocUrl = "https://doc.srprolin.top/SrP-CFG_CS2/srpcfg-1.html";
    public const string GitHubReleasesUrl = "https://github.com/RolinShmily/SrP-CFG_ForCS2/releases";

    public string AppVersion
    {
        get
        {
            var v = Assembly.GetExecutingAssembly().GetName().Version!;
            return v.Build >= 0 ? $"v{v.Major}.{v.Minor}.{v.Build}" : $"v{v.Major}.{v.Minor}";
        }
    }

    public ICommand OpenUrlCommand { get; }

    public AboutViewModel()
    {
        OpenUrlCommand = new RelayCommand(p => OpenUrl(p?.ToString()));
    }

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
