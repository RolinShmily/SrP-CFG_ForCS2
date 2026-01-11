using System;
using System.IO;
using System.Windows;
using Microsoft.Win32;

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

            // 仅当只有 1 个用户时自动选中，多个用户需用户手动选择
            if (SteamUserComboBox.Items.Count == 1)
            {
                SteamUserComboBox.SelectedIndex = 0;
            }
        }
        else
        {
            Log("[!] 未找到 Steam 路径，部分功能将不可用。");
            StatusTextBlock.Text = "未找到 Steam 路径";
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

    private void RefreshUsersButton_Click(object sender, RoutedEventArgs e)
    {
        RefreshSteamUsers();
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

                StatusTextBlock.Text = "已选择文件，可以开始安装";
            }
        }
    }

    private async void InstallButton_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedFiles == null || _selectedFiles.Length == 0)
        {
            MessageBox.Show("请先选择要安装的文件。", "提示", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        bool installCfg = InstallCfgCheckBox.IsChecked == true;
        bool installVideo = InstallVideoCheckBox.IsChecked == true;

        if (!installCfg && !installVideo)
        {
            MessageBox.Show("请至少选择一项安装选项。", "提示", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (installCfg && _installer.Cs2CfgPath == null)
        {
            MessageBox.Show("未检测到 全局CFG 路径，无法安装 CFG 文件。", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
            return;
        }

        if (installVideo && _installer.VideoCfgPath == null)
        {
            MessageBox.Show("未检测到视频配置路径，无法安装视频配置。\n请选择正确的 Steam 用户。", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
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
                BackupLocationTextBox.Text = cfgBackupPath;
            }
            if (installVideo && _installer.VideoCfgPath != null)
            {
                string videoBackupPath = _installer.CreateVideoCfgBackup(_installer.VideoCfgPath);
                BackupLocationTextBox.Text += $" | {Path.GetFileName(videoBackupPath)}";
            }

            Log("\n=== 开始安装 ===");
            StatusTextBlock.Text = "正在安装...";

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

            StatusTextBlock.Text = "安装完成";
            Log("\n[OK] 所有操作完成！");
            MessageBox.Show("安装完成！", "成功", MessageBoxButton.OK, MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            Log($"[!] 安装失败：{ex.Message}");
            StatusTextBlock.Text = "安装失败";
            MessageBox.Show($"安装失败：{ex.Message}", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
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
