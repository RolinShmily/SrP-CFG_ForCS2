using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.IO.Compression;
using System.Text.RegularExpressions;
using Microsoft.Win32;

namespace SrPInstaller;

public class InstallerService : INotifyPropertyChanged
{
    public event Action<string>? OnLog;
    public event Action<string?>? OnSteamPathDetected;
    public event Action<string?>? OnCs2CfgPathDetected;
    public event Action<string?>? OnSteamUserIdDetected;
    public event Action<string?>? OnVideoCfgPathDetected;
    public event PropertyChangedEventHandler? PropertyChanged;

    private string? _cs2CfgPath;
    private string? _videoCfgPath;

    public string? SteamPath { get; private set; }
    public string? SteamUserId { get; private set; }

    public string? Cs2CfgPath
    {
        get => _cs2CfgPath;
        set
        {
            if (_cs2CfgPath != value)
            {
                _cs2CfgPath = value;
                OnPropertyChanged(nameof(Cs2CfgPath));
                OnPropertyChanged(nameof(CfgBackupPath));
            }
        }
    }

    public string? VideoCfgPath
    {
        get => _videoCfgPath;
        set
        {
            if (_videoCfgPath != value)
            {
                _videoCfgPath = value;
                OnPropertyChanged(nameof(VideoCfgPath));
                OnPropertyChanged(nameof(VideoBackupPath));
            }
        }
    }

    public string? CfgBackupPath => Cs2CfgPath != null ? Path.Combine(Directory.GetParent(Cs2CfgPath)!.FullName, "cfg_backup.zip") : null;
    public string? VideoBackupPath => VideoCfgPath != null ? Path.Combine(Directory.GetParent(VideoCfgPath)!.FullName, "user_cfg_backup.zip") : null;

    public string? DetectSteamPath()
    {
        (RegistryHive hive, string subKey, string valueName)[] registryPaths = new[]
        {
            (RegistryHive.CurrentUser, @"Software\Valve\Steam", "SteamPath"),
            (RegistryHive.CurrentUser, @"Software\Valve\Steam", "InstallPath"),
            (RegistryHive.LocalMachine, @"SOFTWARE\Valve\Steam", "InstallPath"),
            (RegistryHive.LocalMachine, @"SOFTWARE\Wow6432Node\Valve\Steam", "InstallPath"),
        };

        foreach (var registryPath in registryPaths)
        {
            try
            {
                using var key = RegistryKey.OpenBaseKey(registryPath.hive, RegistryView.Default).OpenSubKey(registryPath.subKey);
                if (key != null)
                {
                    var value = key.GetValue(registryPath.valueName);
                    if (value != null)
                    {
                        string path = value.ToString()!;
                        path = path.Replace('/', '\\').TrimEnd('\\');

                        if (Directory.Exists(path) && File.Exists(Path.Combine(path, "steam.exe")))
                        {
                            SteamPath = path;
                            OnSteamPathDetected?.Invoke(path);
                            Log($"[OK] Steam 路径：{path}");
                            return path;
                        }
                    }
                }
            }
            catch { }
        }

        Log("[!] 未找到 Steam 路径");
        return null;
    }

    public string? DetectCS2CfgPath(string steamRoot)
    {
        if (!Directory.Exists(steamRoot)) return null;

        string libraryVdf = Path.Combine(steamRoot, "steamapps", "libraryfolders.vdf");
        if (!File.Exists(libraryVdf)) return null;

        string content = File.ReadAllText(libraryVdf);
        var matches = Regex.Matches(content, "\"path\"\\s*\"([^\"]+)\"");

        foreach (Match m in matches)
        {
            string library = m.Groups[1].Value.Replace("\\\\", "\\");
            string cs2 = Path.Combine(library, "steamapps", "common", "Counter-Strike Global Offensive");
            string cfg = Path.Combine(cs2, "game", "csgo", "cfg");
            if (Directory.Exists(cfg))
            {
                Cs2CfgPath = cfg;
                OnCs2CfgPathDetected?.Invoke(cfg);
                Log($"[OK] 全局CFG 路径：{cfg}");
                return cfg;
            }
        }

        Log("[!] 未找到 全局CFG 路径");
        return null;
    }

    public string[] GetAvailableSteamUsers(string steamRoot)
    {
        string userData = Path.Combine(steamRoot, "userdata");
        if (!Directory.Exists(userData))
            return Array.Empty<string>();

        var folders = Directory.GetDirectories(userData);
        var userIds = new string[folders.Length];

        for (int i = 0; i < folders.Length; i++)
        {
            userIds[i] = Path.GetFileName(folders[i])!;
        }

        return userIds;
    }

    public void SetSteamUserId(string userId)
    {
        SteamUserId = userId;
        OnSteamUserIdDetected?.Invoke(userId);

        if (SteamPath != null)
        {
            var videoPath = DetectVideoCfgPath(SteamPath, userId, silent: true);
            // 仅当路径实际变化时才触发事件和输出日志
            if (videoPath != _videoCfgPath)
            {
                VideoCfgPath = videoPath;
                OnVideoCfgPathDetected?.Invoke(videoPath);
                // 只有在这里输出日志，避免 DetectVideoCfgPath 内部重复输出
                if (videoPath != null)
                {
                    Log($"[OK] 用户CFG(视频预设)路径：{videoPath}");
                }
            }
        }
    }

    public string? DetectVideoCfgPath(string steamRoot, string userId, bool silent = false)
    {
        string videoCfgPath = Path.Combine(steamRoot, "userdata", userId, "730", "local", "cfg");
        if (Directory.Exists(videoCfgPath))
        {
            if (!silent)
                Log($"[OK] 用户CFG(视频预设)路径：{videoCfgPath}");
            return videoCfgPath;
        }

        if (!silent)
            Log("[!] 未找到用户CFG(视频预设)路径");
        return null;
    }

    public string CreateCfgBackup(string cfgDir)
    {
        if (!Directory.Exists(cfgDir))
            throw new DirectoryNotFoundException("cfg 目录不存在。");

        string parent = Directory.GetParent(cfgDir)!.FullName;
        string backupPath = Path.Combine(parent, "cfg_backup.zip");

        if (File.Exists(backupPath))
            File.Delete(backupPath);

        Log("[~] 正在备份当前 cfg 文件夹...");
        ZipFile.CreateFromDirectory(cfgDir, backupPath, CompressionLevel.Optimal, false);

        return backupPath;
    }

    public string CreateVideoCfgBackup(string videoCfgDir)
    {
        if (!Directory.Exists(videoCfgDir))
            throw new DirectoryNotFoundException("用户CFG(视频预设)目录不存在。");

        string parent = Directory.GetParent(videoCfgDir)!.FullName;
        string backupPath = Path.Combine(parent, "user_cfg_backup.zip");

        if (File.Exists(backupPath))
            File.Delete(backupPath);

        Log("[~] 正在备份用户CFG(视频预设)文件...");
        ZipFile.CreateFromDirectory(videoCfgDir, backupPath, CompressionLevel.Optimal, false);

        return backupPath;
    }

    public void InstallFromZip(string zipPath, bool installCfg, bool installVideo)
    {
        Log($"[~] 开始安装：{Path.GetFileName(zipPath)}");

        string tempDir = Path.Combine(Path.GetTempPath(), "CS2Installer_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempDir);

        try
        {
            Log("[~] 解压 ZIP 中...");
            ZipFile.ExtractToDirectory(zipPath, tempDir, true);
            Log("[OK] 解压完成。");

            // 安装 CFG
            if (installCfg && Cs2CfgPath != null)
            {
                int cfgCount = CopyCfgFiles(tempDir, Cs2CfgPath);
                if (cfgCount > 0)
                {
                    Log($"[OK] CFG 复制完成！（已复制 {cfgCount} 个 .cfg 文件）");
                }
                else
                {
                    Log("[!] 未找到 CFG 文件。");
                }
            }

            // 安装视频配置
            if (installVideo && VideoCfgPath != null)
            {
                int txtCount = CopyTxtFiles(tempDir, VideoCfgPath);
                if (txtCount > 0)
                {
                    Log($"[OK] 用户CFG(视频预设)复制完成！（已复制 {txtCount} 个 .txt 文件）");
                }
                else
                {
                    Log("[!] 未找到用户CFG(视频预设)文件。");
                }
            }
        }
        finally
        {
            if (Directory.Exists(tempDir))
                Directory.Delete(tempDir, true);
        }

        Log("[OK] 安装完成！");
    }

    public void InstallFromFiles(string[] files, bool installCfg, bool installVideo)
    {
        Log($"[~] 开始安装 {files.Length} 个文件...");

        int cfgCount = 0;
        int txtCount = 0;
        var skippedFiles = 0;
        var failedFiles = new List<string>();

        foreach (var file in files)
        {
            if (!File.Exists(file))
                continue;

            string fileName = Path.GetFileName(file);

            // .cfg 文件
            if (installCfg && fileName.EndsWith(".cfg", StringComparison.OrdinalIgnoreCase))
            {
                if (Cs2CfgPath != null)
                {
                    try
                    {
                        string dest = Path.Combine(Cs2CfgPath, fileName);
                        File.Copy(file, dest, true);
                        cfgCount++;
                    }
                    catch (Exception ex)
                    {
                        failedFiles.Add($"CFG：{fileName} ({ex.Message})");
                    }
                }
            }
            // .txt 文件
            else if (installVideo && fileName.EndsWith(".txt", StringComparison.OrdinalIgnoreCase))
            {
                if (VideoCfgPath != null)
                {
                    try
                    {
                        string dest = Path.Combine(VideoCfgPath, fileName);
                        File.Copy(file, dest, true);
                        txtCount++;
                    }
                    catch (Exception ex)
                    {
                        failedFiles.Add($"视频预设：{fileName} ({ex.Message})");
                    }
                }
            }
            else
            {
                skippedFiles++;
            }
        }

        // 批量输出统计信息
        if (cfgCount > 0)
            Log($"  [OK] 已复制 {cfgCount} 个 CFG 文件");
        if (txtCount > 0)
            Log($"  [OK] 已复制 {txtCount} 个视频预设文件");
        if (skippedFiles > 0)
            Log($"  [~] 跳过 {skippedFiles} 个非 CFG/TXT 文件");

        // 输出失败信息
        if (failedFiles.Count > 0)
        {
            foreach (var failed in failedFiles)
            {
                Log($"  [!] 复制失败：{failed}");
            }
        }

        Log("[OK] 文件复制完成！");
    }

    private int CopyCfgFiles(string src, string dst)
    {
        int copiedCount = 0;
        var failedFiles = new List<string>();

        foreach (string file in Directory.GetFiles(src, "*", SearchOption.AllDirectories))
        {
            if (!file.EndsWith(".cfg", StringComparison.OrdinalIgnoreCase))
                continue;

            string relative = Path.GetRelativePath(src, file);
            string target = Path.Combine(dst, relative);

            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(target)!);
                File.Copy(file, target, true);
                copiedCount++;
            }
            catch (Exception ex)
            {
                failedFiles.Add($"{relative} ({ex.Message})");
            }
        }

        // 批量输出失败信息
        if (failedFiles.Count > 0)
        {
            foreach (var failed in failedFiles)
            {
                Log($"  [!] 复制失败：{failed}");
            }
        }

        return copiedCount;
    }

    private int CopyTxtFiles(string src, string dst)
    {
        int copiedCount = 0;
        var failedFiles = new List<string>();

        foreach (string file in Directory.GetFiles(src, "*.txt", SearchOption.AllDirectories))
        {
            string fileName = Path.GetFileName(file);
            string target = Path.Combine(dst, fileName);

            try
            {
                File.Copy(file, target, true);
                copiedCount++;
            }
            catch (Exception ex)
            {
                failedFiles.Add($"{fileName} ({ex.Message})");
            }
        }

        // 批量输出失败信息，减少日志冗余
        if (failedFiles.Count > 0)
        {
            foreach (var failed in failedFiles)
            {
                Log($"  [!] 复制失败：{failed}");
            }
        }

        return copiedCount;
    }

    private void Log(string message)
    {
        OnLog?.Invoke(message);
    }

    protected void OnPropertyChanged(string propertyName)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
