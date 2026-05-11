using System;
using System.IO;
using System.Net.Http;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace SrPInstaller;

public class UpdateService
{
    private const string ReleasesApiUrl = "https://api.github.com/repos/RolinShmily/SrP-CFG_ForCS2/releases/latest";
    private const string CacheDirectoryName = "SrP-CFG_Installer";
    private const string CacheFileName = "update_cache.json";
    private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(4);
    private static readonly TimeSpan HttpTimeout = TimeSpan.FromSeconds(5);

    private static readonly string CacheDirectory = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        CacheDirectoryName);
    private static readonly string CacheFilePath = Path.Combine(CacheDirectory, CacheFileName);

    private static readonly HttpClient _httpClient = new()
    {
        Timeout = HttpTimeout,
        DefaultRequestHeaders =
        {
            { "User-Agent", "SrP-CFG-Installer" }
        }
    };

    public record UpdateInfo(string LatestVersion, string CurrentVersion, string HtmlUrl);

    public async Task<UpdateInfo?> CheckForUpdateAsync()
    {
        var currentVersion = GetCurrentVersion();
        var cache = LoadCache();

        // 频率限制：距上次检查不到 4 小时，使用缓存
        if (cache != null && cache.LastCheckTimeUtc.HasValue
            && DateTime.UtcNow - cache.LastCheckTimeUtc.Value < CheckInterval)
        {
            return EvaluateFromCache(cache, currentVersion);
        }

        // 尝试从 GitHub API 获取最新版本
        try
        {
            var latestVersion = await FetchLatestReleaseAsync();

            // 更新缓存
            var newCache = new UpdateCache
            {
                LatestKnownVersion = latestVersion.tagName.TrimStart('v'),
                DismissedVersion = cache?.DismissedVersion,
                LastCheckTimeUtc = DateTime.UtcNow
            };
            SaveCache(newCache);

            // 比较版本
            if (Version.TryParse(newCache.LatestKnownVersion, out var ghVersion)
                && ghVersion > currentVersion
                && newCache.DismissedVersion != newCache.LatestKnownVersion)
            {
                return new UpdateInfo(newCache.LatestKnownVersion, FormatVersion(currentVersion), latestVersion.htmlUrl);
            }

            return null;
        }
        catch
        {
            // 网络失败，使用缓存兜底
            if (cache != null)
            {
                return EvaluateFromCache(cache, currentVersion);
            }
            return null;
        }
    }

    public void SaveDismissedVersion(string version)
    {
        var cache = LoadCache() ?? new UpdateCache();
        cache.DismissedVersion = version;
        SaveCache(cache);
    }

    private UpdateInfo? EvaluateFromCache(UpdateCache cache, Version currentVersion)
    {
        if (cache.LatestKnownVersion == null) return null;
        if (cache.DismissedVersion == cache.LatestKnownVersion) return null;

        if (Version.TryParse(cache.LatestKnownVersion, out var cachedVersion) && cachedVersion > currentVersion)
        {
            return new UpdateInfo(
                cache.LatestKnownVersion,
                FormatVersion(currentVersion),
                $"https://github.com/RolinShmily/SrP-CFG_ForCS2/releases/tag/v{cache.LatestKnownVersion}");
        }

        return null;
    }

    private static Version GetCurrentVersion()
    {
        return Assembly.GetExecutingAssembly().GetName().Version!;
    }

    private static string FormatVersion(Version v)
    {
        return v.Build >= 0 ? $"{v.Major}.{v.Minor}.{v.Build}" : $"{v.Major}.{v.Minor}";
    }

    private async Task<(string tagName, string htmlUrl)> FetchLatestReleaseAsync()
    {
        var response = await _httpClient.GetAsync(ReleasesApiUrl);
        response.EnsureSuccessStatusCode();

        using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        var root = doc.RootElement;

        string tagName = root.GetProperty("tag_name").GetString()!;
        string htmlUrl = root.GetProperty("html_url").GetString()!;

        return (tagName, htmlUrl);
    }

    private static UpdateCache? LoadCache()
    {
        try
        {
            if (!File.Exists(CacheFilePath)) return null;
            var json = File.ReadAllText(CacheFilePath);
            return JsonSerializer.Deserialize<UpdateCache>(json);
        }
        catch
        {
            return null;
        }
    }

    private static void SaveCache(UpdateCache cache)
    {
        try
        {
            Directory.CreateDirectory(CacheDirectory);
            var json = JsonSerializer.Serialize(cache, new JsonSerializerOptions
            {
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
                WriteIndented = true
            });
            File.WriteAllText(CacheFilePath, json);
        }
        catch
        {
            // 缓存写入失败不影响主流程
        }
    }

    private class UpdateCache
    {
        public string? LatestKnownVersion { get; set; }
        public string? DismissedVersion { get; set; }
        public DateTime? LastCheckTimeUtc { get; set; }
    }
}
