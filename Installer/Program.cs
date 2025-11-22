using System;
using System.IO;
using Microsoft.Win32;
using System.IO.Compression;
using System.Text.RegularExpressions;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("=== CS2 CFG Installer (with Backup & Multi-file Support) ===\n");

        string? steamPath = GetSteamPath();
        if (steamPath == null)
        {
            Console.WriteLine("[!] 未找到 Steam 路径，请手动输入（或拖入）：");
            steamPath = Console.ReadLine()?.Trim('"');
        }
        Console.WriteLine($"Steam 路径：{steamPath}\n");

        string? cs2Cfg = FindCS2CfgPath(steamPath);
        if (cs2Cfg == null)
        {
            Console.WriteLine("[!] 未找到 CS2 CFG 路径，请手动输入（或拖入）：");
            cs2Cfg = Console.ReadLine()?.Trim('"');
        }

        if (string.IsNullOrWhiteSpace(cs2Cfg) || !Directory.Exists(cs2Cfg))
        {
            Console.WriteLine("[!] 无效的 cfg 路径，程序退出。");
            return;
        }

        Console.WriteLine($"CS2 CFG 路径：{cs2Cfg}\n");

        Console.WriteLine("请将 ZIP 或一个/多个 CFG 文件拖入此窗口：");
        string input = Console.ReadLine()?.Trim('"') ?? "";

        string[] inputFiles = SplitInputFiles(input);

        if (inputFiles.Length == 0)
        {
            Console.WriteLine("[!] 输入为空，程序退出。");
            return;
        }

        bool isZipMode = (inputFiles.Length == 1 && inputFiles[0].EndsWith(".zip", StringComparison.OrdinalIgnoreCase));

        try
        {
            Console.WriteLine("正在备份当前 cfg 文件夹...");
            string backupPath = CreateCfgBackup(cs2Cfg);
            Console.WriteLine($"[OK] 已将 cfg 文件夹备份至上级目录：{backupPath}\n");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[!] 备份失败：{ex.Message}");
            Console.WriteLine("是否继续安装？(Y/N)");
            if (Console.ReadKey(true).Key != ConsoleKey.Y)
            {
                Console.WriteLine("已取消。");
                return;
            }
            Console.WriteLine("继续操作...\n");
        }

        if (isZipMode)
        {
            string zipPath = inputFiles[0];
            if (!File.Exists(zipPath))
            {
                Console.WriteLine("[!] ZIP 文件不存在，程序退出。");
                return;
            }

            string tempDir = Path.Combine(Path.GetTempPath(), "CS2Installer_" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(tempDir);

            Console.WriteLine("解压 ZIP 中...");
            ZipFile.ExtractToDirectory(zipPath, tempDir, true);
            Console.WriteLine("解压完成。\n");

            Console.WriteLine("正在筛选和清理非 .cfg 文件...");
            int deletedCount = CleanTempDir(tempDir);
            Console.WriteLine($"已删除 {deletedCount} 个非 .cfg 文件.\n");

            Console.WriteLine("复制文件至 cfg...");
            CopyDirectory(tempDir, cs2Cfg);
            Console.WriteLine("复制完成！");

            Directory.Delete(tempDir, true);
        }
        else
        {
            Console.WriteLine("检测到多个文件，将复制至 cfg ...");

            foreach (var file in inputFiles)
            {
                if (!File.Exists(file))
                    continue;

                string fileName = Path.GetFileName(file);
                if (!fileName.EndsWith(".cfg", StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine($"已跳过非 .cfg 文件：{fileName}");
                    continue;
                }
                string dest = Path.Combine(cs2Cfg, fileName);

                try
                {
                    File.Copy(file, dest, true);
                    Console.WriteLine($"已复制：{fileName}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"复制失败：{fileName} → {ex.Message}");
                }
            }

            Console.WriteLine("\n文件复制完成！");
        }

        Console.WriteLine("\n安装完成！按任意键退出...");
        Console.ReadKey();
    }

    static string[] SplitInputFiles(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return Array.Empty<string>();
        return input.Split(new[] { ';', ' ' }, StringSplitOptions.RemoveEmptyEntries);
    }

    static string? GetSteamPath()
    {
        try
        {
            return Registry.GetValue(
                @"HKEY_CURRENT_USER\Software\Valve\Steam",
                "SteamPath",
                null
            )?.ToString();
        }
        catch { return null; }
    }

    static string? FindCS2CfgPath(string steamRoot)
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
            if (Directory.Exists(cfg)) return cfg;
        }

        return null;
    }

    static string CreateCfgBackup(string cfgDir)
    {
        if (!Directory.Exists(cfgDir))
            throw new DirectoryNotFoundException("cfg 目录不存在。");

        string parent = Directory.GetParent(cfgDir)!.FullName;
        string backupPath = Path.Combine(parent, "cfg_backup.zip");

        if (File.Exists(backupPath))
            File.Delete(backupPath);

        ZipFile.CreateFromDirectory(cfgDir, backupPath, CompressionLevel.Optimal, false);

        return backupPath;
    }

    static int CleanTempDir(string tempDir)
    {
        if (!Directory.Exists(tempDir)) return 0;

        int deletedCount = 0;

        string[] allFiles = Directory.GetFiles(tempDir, "*", SearchOption.AllDirectories);

        foreach (string file in allFiles)
        {
            if (!file.EndsWith(".cfg", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    File.Delete(file);
                    deletedCount++;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[!] 无法删除文件 {Path.GetFileName(file)}: {ex.Message}");
                }
            }
        }
        return deletedCount;
    }

    static void CopyDirectory(string src, string dst)
    {
        foreach (string file in Directory.GetFiles(src, "*", SearchOption.AllDirectories))
        {
            string relative = Path.GetRelativePath(src, file);
            string target = Path.Combine(dst, relative);

            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            File.Copy(file, target, true);
        }
    }
}
