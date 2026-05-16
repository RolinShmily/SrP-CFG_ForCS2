using System;
using System.Collections.Specialized;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
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
        _viewModel = new MainViewModel();

        _viewModel.BrowseFolderFunc = BrowseFolder;
        _viewModel.BrowseFilesFunc = BrowseFiles;

        DataContext = _viewModel;

        _viewModel.LogEntries.CollectionChanged += LogEntries_CollectionChanged;

        Loaded += OnLoaded;
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
            ((System.Windows.Controls.Border)sender).Background = DropZoneHighlight;
        }
        else
        {
            e.Effects = DragDropEffects.None;
        }
        e.Handled = true;
    }

    private void DropZone_DragLeave(object sender, DragEventArgs e)
    {
        ((System.Windows.Controls.Border)sender).Background = (Brush)FindResource("BgInput");
    }

    private void DropZone_Drop(object sender, DragEventArgs e)
    {
        ((System.Windows.Controls.Border)sender).Background = (Brush)FindResource("BgInput");
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
            var source = ((System.Windows.Controls.Image)sender).Source;
            if (source == null) return;

            var w = new Window
            {
                Title = "Steam 好友ID 查找指南",
                Width = 1000,
                Height = 800,
                WindowStartupLocation = WindowStartupLocation.CenterOwner,
                Owner = this,
                Background = new SolidColorBrush(Color.FromRgb(15, 17, 23))
            };

            var sv = new System.Windows.Controls.ScrollViewer
            {
                HorizontalScrollBarVisibility = System.Windows.Controls.ScrollBarVisibility.Auto,
                VerticalScrollBarVisibility = System.Windows.Controls.ScrollBarVisibility.Auto,
                Padding = new Thickness(10)
            };

            sv.Content = new System.Windows.Controls.Image
            {
                Source = source,
                Stretch = Stretch.Uniform
            };

            w.Content = sv;
            w.ShowDialog();
        }
        catch { }
    }
}
