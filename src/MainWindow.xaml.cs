using System;
using System.Collections.Specialized;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shell;
using Microsoft.Win32;
using SrPInstaller.ViewModels;
using Forms = System.Windows.Forms;

namespace SrPInstaller;

public partial class MainWindow : Window
{
    private static readonly Brush DropZoneHighlight = new SolidColorBrush(Color.FromArgb(40, 232, 121, 12));

    private readonly MainViewModel _viewModel;

    public MainWindow()
    {
        InitializeComponent();

        // Apply WindowChrome for custom title bar
        WindowChrome.SetWindowChrome(this, new WindowChrome
        {
            CaptionHeight = 42,
            CornerRadius = new CornerRadius(8, 8, 0, 0),
            GlassFrameThickness = new Thickness(0),
            ResizeBorderThickness = new Thickness(5)
        });

        _viewModel = new MainViewModel();

        _viewModel.BrowseFolderFunc = BrowseFolder;
        _viewModel.BrowseFilesFunc = BrowseFiles;

        DataContext = _viewModel;

        _viewModel.LogEntries.CollectionChanged += LogEntries_CollectionChanged;

        Loaded += OnLoaded;
        SetWindowSizeByScreen();
    }

    private void SetWindowSizeByScreen()
    {
        var screen = Forms.Screen.FromHandle(
            new System.Windows.Interop.WindowInteropHelper(this).Handle);

        var bounds = screen?.Bounds ?? Forms.Screen.PrimaryScreen?.Bounds
                     ?? new System.Drawing.Rectangle(0, 0, 1920, 1080);

        var screenH = bounds.Height;

        // 4:3 ratio, half the screen height
        double winH, winW;
        if (screenH >= 2160)
        {
            winH = 1080; winW = 1440;
        }
        else if (screenH >= 1440)
        {
            winH = 720; winW = 960;
        }
        else
        {
            winH = 540; winW = 720;
        }

        // Clamp to 90% of screen
        winH = Math.Min(winH, bounds.Height * 0.9);
        winW = Math.Min(winW, bounds.Width * 0.9);

        Width = winW;
        Height = winH;
    }

    private void LogEntries_CollectionChanged(object? sender, NotifyCollectionChangedEventArgs e)
    {
        if (e.Action == NotifyCollectionChangedAction.Add)
            Dispatcher.InvokeAsync(() => LogScrollViewer.ScrollToEnd());
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        _viewModel.RefreshAllPaths();
        await _viewModel.CheckForUpdatesAsync();
    }

    // Title bar button handlers
    private void MinimizeButton_Click(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;

    private void MaximizeButton_Click(object sender, RoutedEventArgs e)
    {
        WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;
    }

    private void CloseButton_Click(object sender, RoutedEventArgs e) => Close();

    private string? BrowseFolder(string description)
    {
        var dialog = new Forms.FolderBrowserDialog
        {
            Description = description,
            ShowNewFolderButton = false
        };
        return dialog.ShowDialog() == Forms.DialogResult.OK ? dialog.SelectedPath : null;
    }

    private string[]? BrowseFiles()
    {
        var dialog = new OpenFileDialog
        {
            Title = "选择要安装的文件",
            Filter = "支持的文件|*.zip;*.cfg;*.txt|ZIP (*.zip)|*.zip|CFG (*.cfg)|*.cfg|TXT (*.txt)|*.txt|All (*.*)|*.*",
            Multiselect = true
        };
        return dialog.ShowDialog() == true ? dialog.FileNames : null;
    }

    private void DropZone_DragOver(object sender, DragEventArgs e)
    {
        if (e.Data.GetDataPresent(DataFormats.FileDrop))
        {
            e.Effects = DragDropEffects.Copy;
            ((Border)sender).Background = DropZoneHighlight;
        }
        else
        {
            e.Effects = DragDropEffects.None;
        }
        e.Handled = true;
    }

    private void DropZone_DragLeave(object sender, DragEventArgs e)
    {
        ((Border)sender).Background = (Brush)FindResource("BgInput");
    }

    private void DropZone_Drop(object sender, DragEventArgs e)
    {
        ((Border)sender).Background = (Brush)FindResource("BgInput");
        if (e.Data.GetDataPresent(DataFormats.FileDrop))
        {
            var files = (string[]?)e.Data.GetData(DataFormats.FileDrop);
            if (files != null) _viewModel.HandleDroppedFiles(files);
        }
    }

    private void DropZoneBorder_Click(object sender, MouseButtonEventArgs e)
    {
        _viewModel.SelectFileCommand.Execute(null);
    }

    private void SteamGuideImage_MouseUp(object sender, MouseButtonEventArgs e)
    {
        try
        {
            var source = ((Image)sender).Source as BitmapSource;
            if (source == null) return;

            var imgW = source.PixelWidth / (source.DpiX / 96.0);
            var imgH = source.PixelHeight / (source.DpiY / 96.0);

            var maxW = ActualWidth * 0.9;
            var maxH = ActualHeight * 0.9;

            var winW = Math.Min(imgW + 24, maxW);
            var winH = Math.Min(imgH + 24, maxH);

            var w = new Window
            {
                Title = "Steam 好友ID 查找指南",
                Width = winW,
                Height = winH,
                WindowStartupLocation = WindowStartupLocation.CenterOwner,
                Owner = this,
                Background = new SolidColorBrush(Color.FromRgb(15, 17, 23)),
                ResizeMode = ResizeMode.NoResize
            };

            var img = new Image
            {
                Source = source,
                Stretch = Stretch.Uniform,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center
            };

            w.Content = new Border
            {
                Background = new SolidColorBrush(Color.FromRgb(15, 17, 23)),
                Child = img,
                Padding = new Thickness(8)
            };
            w.ShowDialog();
        }
        catch { }
    }
}
