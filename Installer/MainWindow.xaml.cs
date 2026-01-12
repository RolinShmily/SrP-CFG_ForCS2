using System;
using System.IO;
using System.Windows;
using Microsoft.Win32;
using Forms = System.Windows.Forms;

namespace SrPInstaller;

public partial class MainWindow : Window
{
    private readonly InstallerService _installer;
    private string[]? _selectedFiles;

    public MainWindow()
    {
        InitializeComponent();
        _installer = new InstallerService();
        DataContext = _installer;

        _installer.OnLog += Installer_OnLog;

        Loaded += MainWindow_Loaded;
    }

    private void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        RefreshAllPaths();
    }

    private void RefreshAllPaths()
    {
        // 检测 Steam 路径
        Log("正在检测 Steam 路径...");
        _installer.DetectSteamPath();

        if (_installer.SteamPath != null)
        {
            // 检测 CFG 路径
            Log("正在检测 全局CFG 路径...");
            _installer.DetectCS2CfgPath(_installer.SteamPath);

            // 加载 Steam 用户列表
            RefreshSteamUsers();

            // 默认选中第一个用户（如果有的话）
            if (SteamUserComboBox.Items.Count > 0)
            {
                SteamUserComboBox.SelectedIndex = 0;
            }
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
            SteamUserComboBox.ItemsSource = users;

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

    private void SteamUserComboBox_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
    {
        if (SteamUserComboBox.SelectedItem is string userId)
        {
            _installer.SetSteamUserId(userId);
        }
    }

    private void SelectCfgFolderButton_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new Forms.FolderBrowserDialog();
        dialog.Description = "选择全局CFG目录";
        dialog.ShowNewFolderButton = false;

        if (dialog.ShowDialog() == Forms.DialogResult.OK)
        {
            string selectedPath = dialog.SelectedPath;
            _installer.Cs2CfgPath = selectedPath;
            Log($"[OK] 已设置全局CFG路径：{selectedPath}");
        }
    }

    private void SelectVideoFolderButton_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new Forms.FolderBrowserDialog();
        dialog.Description = "选择用户CFG(视频预设)目录";
        dialog.ShowNewFolderButton = false;

        if (dialog.ShowDialog() == Forms.DialogResult.OK)
        {
            string selectedPath = dialog.SelectedPath;
            _installer.VideoCfgPath = selectedPath;
            Log($"[OK] 已设置用户CFG(视频预设)路径：{selectedPath}");
        }
    }

    private void RefreshButton_Click(object sender, RoutedEventArgs e)
    {
        Log("=== 刷新路径 ===");
        RefreshAllPaths();
    }

    private async void BackupButton_Click(object sender, RoutedEventArgs e)
    {
        BackupButton.IsEnabled = false;

        try
        {
            Log("=== 开始手动备份 ===");

            if (_installer.Cs2CfgPath != null)
            {
                string cfgBackupPath = _installer.CreateCfgBackup(_installer.Cs2CfgPath);
                CfgBackupTextBox.Text = cfgBackupPath;
                Log($"[OK] CFG 备份已创建: {cfgBackupPath}");
            }
            else
            {
                Log("[!] 未设置全局CFG路径，跳过CFG备份");
            }

            if (_installer.VideoCfgPath != null)
            {
                string videoBackupPath = _installer.CreateVideoCfgBackup(_installer.VideoCfgPath);
                VideoBackupTextBox.Text = videoBackupPath;
                Log($"[OK] 用户CFG(视频预设)备份已创建: {videoBackupPath}");
            }
            else
            {
                Log("[!] 未设置用户CFG(视频预设)路径，跳过用户CFG(视频预设)备份");
            }

            Log("[OK] 手动备份完成！");
        }
        catch (Exception ex)
        {
            Log($"[!] 备份失败：{ex.Message}");
        }
        finally
        {
            BackupButton.IsEnabled = true;
        }
    }

    private void DropZone_DragOver(object sender, DragEventArgs e)
    {
        if (e.Data.GetDataPresent(DataFormats.FileDrop))
        {
            e.Effects = DragDropEffects.Copy;
            DropZoneBorder.Background = System.Windows.Media.Brushes.LightBlue;
        }
        else
        {
            e.Effects = DragDropEffects.None;
        }
        e.Handled = true;
    }

    private void DropZone_DragLeave(object sender, DragEventArgs e)
    {
        DropZoneBorder.Background = System.Windows.Media.Brushes.WhiteSmoke;
    }

    private void DropZone_Drop(object sender, DragEventArgs e)
    {
        DropZoneBorder.Background = System.Windows.Media.Brushes.WhiteSmoke;

        if (e.Data.GetDataPresent(DataFormats.FileDrop))
        {
            var files = (string[]?)e.Data.GetData(DataFormats.FileDrop);
            if (files != null && files.Length > 0)
            {
                _selectedFiles = files;

                if (files.Length == 1 && files[0].EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
                {
                    SelectedFileTextBlock.Text = $"已选择: {Path.GetFileName(files[0])} (ZIP)";
                    Log($"已选择 ZIP 文件: {files[0]}");
                }
                else
                {
                    SelectedFileTextBlock.Text = $"已选择: {files.Length} 个文件";
                    Log($"已选择 {files.Length} 个文件");
                }
            }
        }
    }

    private void OpenCfgBackupButton_Click(object sender, RoutedEventArgs e)
    {
        var backupPath = CfgBackupTextBox.Text;
        if (!string.IsNullOrEmpty(backupPath) && backupPath != "安装前将自动备份")
        {
            var dir = Path.GetDirectoryName(backupPath);
            if (dir != null)
            {
                System.Diagnostics.Process.Start("explorer.exe", dir);
            }
        }
    }

    private void OpenVideoBackupButton_Click(object sender, RoutedEventArgs e)
    {
        var backupPath = VideoBackupTextBox.Text;
        if (!string.IsNullOrEmpty(backupPath) && backupPath != "安装前将自动备份")
        {
            var dir = Path.GetDirectoryName(backupPath);
            if (dir != null)
            {
                System.Diagnostics.Process.Start("explorer.exe", dir);
            }
        }
    }

    private async void InstallButton_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedFiles == null || _selectedFiles.Length == 0)
        {
            Log("[!] 请先选择要安装的文件。");
            return;
        }

        bool installCfg = InstallCfgCheckBox.IsChecked == true;
        bool installVideo = InstallVideoCheckBox.IsChecked == true;

        if (!installCfg && !installVideo)
        {
            Log("[!] 请至少选择一项安装选项。");
            return;
        }

        if (installCfg && _installer.Cs2CfgPath == null)
        {
            Log("[!] 未检测到 全局CFG 路径，无法安装 CFG 文件。");
            return;
        }

        if (installVideo && _installer.VideoCfgPath == null)
        {
            Log("[!] 未检测到用户CFG(视频预设)路径，无法安装用户CFG(视频预设)。请选择正确的 Steam 用户。");
            return;
        }

        InstallButton.IsEnabled = false;

        try
        {
            // 先备份
            Log("=== 开始备份 ===");
            if (installCfg && _installer.Cs2CfgPath != null)
            {
                string cfgBackupPath = _installer.CreateCfgBackup(_installer.Cs2CfgPath);
                CfgBackupTextBox.Text = cfgBackupPath;
                Log($"[OK] CFG 备份已创建: {cfgBackupPath}");
            }
            if (installVideo && _installer.VideoCfgPath != null)
            {
                string videoBackupPath = _installer.CreateVideoCfgBackup(_installer.VideoCfgPath);
                VideoBackupTextBox.Text = videoBackupPath;
                Log($"[OK] 用户CFG(视频预设)备份已创建: {videoBackupPath}");
            }

            Log("\n=== 开始安装 ===");

            // 安装
            await System.Threading.Tasks.Task.Run(() =>
            {
                if (_selectedFiles.Length == 1 && _selectedFiles[0].EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
                {
                    _installer.InstallFromZip(_selectedFiles[0], installCfg, installVideo);
                }
                else
                {
                    _installer.InstallFromFiles(_selectedFiles, installCfg, installVideo);
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
            InstallButton.IsEnabled = true;
        }
    }

    private void Installer_OnLog(string message)
    {
        Dispatcher.Invoke(() =>
        {
            LogTextBox.AppendText(message + Environment.NewLine);
            LogTextBox.ScrollToEnd();
        });
    }

    private void Log(string message)
    {
        Dispatcher.Invoke(() =>
        {
            LogTextBox.AppendText(message + Environment.NewLine);
            LogTextBox.ScrollToEnd();
        });
    }
}
