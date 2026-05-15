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
    public event Action<string?>? OnAnnotationsPathDetected;
    public event PropertyChangedEventHandler? PropertyChanged;

    private string? _cs2CfgPath;
    private string? _videoCfgPath;
    private string? _annotationsPath;

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

    public string? AnnotationsPath
    {
        get => _annotationsPath;
        set
        {
            if (_annotationsPath != value)
            {
                _annotationsPath = value;
                OnPropertyChanged(nameof(AnnotationsPath));
                OnPropertyChanged(nameof(AnnotationsBackupPath));
            }
        }
    }

    public string? CfgBackupPath => Cs2CfgPath != null ? Path.Combine(Directory.GetParent(Cs2CfgPath)!.FullName, "cfg_backup.zip") : null;
    public string? VideoBackupPath => VideoCfgPath != null ? Path.Combine(Directory.GetParent(VideoCfgPath)!.FullName, "user_cfg_backup.zip") : null;
    public string? AnnotationsBackupPath => AnnotationsPath != null ? Path.Combine(Directory.GetParent(AnnotationsPath)!.FullName, "annotations_backup.zip") : null;

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

    public string? DetectAnnotationsPath(string steamRoot)
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
            string annotations = Path.Combine(cs2, "game", "csgo", "annotations", "local");

            // 检查 csgo 目录是否存在
            string csgoDir = Path.GetDirectoryName(annotations);
            if (csgoDir != null && Directory.Exists(csgoDir))
            {
                // 目录存在，直接返回
                if (Directory.Exists(annotations))
                {
                    AnnotationsPath = annotations;
                    OnAnnotationsPathDetected?.Invoke(annotations);
                    Log($"[OK] 地图指南 路径：{annotations}");
                    return annotations;
                }

                // 目录不存在，尝试创建
                try
                {
                    Directory.CreateDirectory(annotations);
                    AnnotationsPath = annotations;
                    OnAnnotationsPathDetected?.Invoke(annotations);
                    Log($"[OK] 地图指南 路径（已自动创建）：{annotations}");
                    Log("[!] 提示：首次创建可能需要启动一次游戏");
                    return annotations;
                }
                catch (Exception ex)
                {
                    Log($"[!] 无法创建地图指南目录：{ex.Message}");
                    Log("[!] 请手动创建以下文件夹结构：");
                    Log("    [盘符]:\\...\\Counter-Strike Global Offensive\\game\\csgo\\annotations\\local");
                    Log("  （具体路径请根据您的 Steam 库位置调整）");
                    Log("  提示：软件没有权限自动创建此目录，需要您手动创建后重试");
                    return null;
                }
            }
        }

        Log("[!] 未找到 CS2 游戏目录");
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

        // 目录不存在，尝试创建
        try
        {
            Directory.CreateDirectory(videoCfgPath);
            if (!silent)
            {
                Log($"[OK] 用户CFG(视频预设)路径（已自动创建）：{videoCfgPath}");
                Log("[!] 提示：首次创建可能需要启动一次游戏");
            }
            return videoCfgPath;
        }
        catch (Exception ex)
        {
            if (!silent)
                Log($"[!] 无法创建用户CFG目录：{ex.Message}");
            Log("[!] 请手动创建以下文件夹结构：");
            Log("    [盘符]:\\...\\userdata\\123456789\\730\\local\\cfg");
            Log("  （具体路径请根据您的 Steam 路径和账户ID调整）");
            Log("  提示：软件没有权限自动创建此目录，需要您手动创建后重试");
            return null;
        }
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

    public string CreateAnnotationsBackup(string annotationsDir)
    {
        if (!Directory.Exists(annotationsDir))
            throw new DirectoryNotFoundException("地图指南目录不存在。");

        string parent = Directory.GetParent(annotationsDir)!.FullName;
        string backupPath = Path.Combine(parent, "annotations_backup.zip");

        if (File.Exists(backupPath))
            File.Delete(backupPath);

        Log("[~] 正在备份地图指南文件...");
        ZipFile.CreateFromDirectory(annotationsDir, backupPath, CompressionLevel.Optimal, false);

        return backupPath;
    }

    public void InstallFromZip(string zipPath, bool installCfg, bool installVideo, bool installAnnotations)
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

            // 安装视频配置 - 仅识别 cs2_video.txt
            if (installVideo && VideoCfgPath != null)
            {
                int txtCount = CopyVideoTxtFile(tempDir, VideoCfgPath);
                if (txtCount > 0)
                {
                    Log($"[OK] 用户CFG(视频预设)复制完成！（已复制 {txtCount} 个文件）");
                }
                else
                {
                    Log("[!] 未找到 cs2_video.txt 文件。");
                }
            }

            // 安装 annotations 目录
            if (installAnnotations && AnnotationsPath != null)
            {
                int annotationsCount = CopyAnnotationsFiles(tempDir, AnnotationsPath);
                if (annotationsCount > 0)
                {
                    Log($"[OK] 地图指南复制完成！（已复制 {annotationsCount} 个文件）");
                }
                else
                {
                    Log("[!] 未找到地图指南文件。");
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

    public void InstallFromFiles(string[] files, bool installCfg, bool installVideo, bool installAnnotations)
    {
        Log($"[~] 开始安装 {files.Length} 个文件...");

        int cfgCount = 0;
        int txtCount = 0;
        int annotationsCount = 0;
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
            // cs2_video.txt 文件 - 仅识别该特定文件
            else if (installVideo && fileName.Equals("cs2_video.txt", StringComparison.OrdinalIgnoreCase))
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
            // annotations 目录文件（从 ZIP 解压后的临时目录复制）
            else if (installAnnotations && AnnotationsPath != null)
            {
                // 检查是否是 annotations 子目录中的文件
                string? annotationsDir = FindAnnotationsDirInFile(file);
                if (annotationsDir != null)
                {
                    try
                    {
                        string relative = Path.GetRelativePath(annotationsDir, file);
                        string targetDir = Path.Combine(AnnotationsPath, Path.GetDirectoryName(relative) ?? "");
                        Directory.CreateDirectory(targetDir);
                        string target = Path.Combine(targetDir, Path.GetFileName(file));
                        File.Copy(file, target, true);
                        annotationsCount++;
                    }
                    catch (Exception ex)
                    {
                        failedFiles.Add($"地图指南：{fileName} ({ex.Message})");
                    }
                }
                else
                {
                    skippedFiles++;
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
            Log($"  [OK] 已复制 {txtCount} 个 cs2_video.txt 文件");
        if (annotationsCount > 0)
            Log($"  [OK] 已复制 {annotationsCount} 个地图指南文件");
        if (skippedFiles > 0)
            Log($"  [~] 跳过 {skippedFiles} 个非目标文件");

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

    private string? FindAnnotationsDirInFile(string file)
    {
        // 检查文件是否在 annotations 子目录中
        string dir = Path.GetDirectoryName(file) ?? "";
        if (dir.Contains("annotations"))
        {
            // 找到 annotations 目录
            int idx = dir.IndexOf("annotations", StringComparison.OrdinalIgnoreCase);
            return dir.Substring(0, idx + "annotations".Length);
        }
        return null;
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

    private int CopyVideoTxtFile(string src, string dst)
    {
        // 仅复制 cs2_video.txt 文件
        string srcFile = Path.Combine(src, "cs2_video.txt");
        if (!File.Exists(srcFile))
            return 0;

        try
        {
            string target = Path.Combine(dst, "cs2_video.txt");
            File.Copy(srcFile, target, true);
            return 1;
        }
        catch (Exception ex)
        {
            Log($"  [!] 复制失败：cs2_video.txt ({ex.Message})");
            return 0;
        }
    }

    private int CopyAnnotationsFiles(string src, string annotationsPath)
    {
        // annotationsPath 已经是 csgo/annotations/local
        int copiedCount = 0;
        var failedFiles = new List<string>();

        // 确保目标目录存在
        Directory.CreateDirectory(annotationsPath);

        // 检查是否存在 annotations 子目录
        string annotationsSrc = Path.Combine(src, "annotations");
        if (!Directory.Exists(annotationsSrc))
            return 0;

        // 复制 annotations 下的所有子目录和文件（不带 annotations 父文件夹）
        foreach (string dir in Directory.GetDirectories(annotationsSrc))
        {
            string dirName = Path.GetFileName(dir);
            string targetDir = Path.Combine(annotationsPath, dirName);
            Directory.CreateDirectory(targetDir);

            foreach (string file in Directory.GetFiles(dir, "*", SearchOption.AllDirectories))
            {
                string relative = Path.GetRelativePath(dir, file);
                string target = Path.Combine(targetDir, relative);

                try
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(target)!);
                    File.Copy(file, target, true);
                    copiedCount++;
                }
                catch (Exception ex)
                {
                    failedFiles.Add($"{dirName}/{relative} ({ex.Message})");
                }
            }
        }

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
