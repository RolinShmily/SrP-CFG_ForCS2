using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using Microsoft.Win32;
using SrPInstaller.ViewModels;
using Forms = System.Windows.Forms;

namespace SrPInstaller;

public partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel;

    public MainWindow()
    {
        InitializeComponent();
        _viewModel = new MainViewModel();

        // Set up dialog callbacks
        _viewModel.BrowseFolderFunc = BrowseFolder;
        _viewModel.BrowseFilesFunc = BrowseFiles;

        DataContext = _viewModel;

        // Auto-scroll log on new entries
        _viewModel.LogEntries.CollectionChanged += (s, e) =>
        {
            Dispatcher.InvokeAsync(() => LogScrollViewer.ScrollToEnd());
        };

        Loaded += OnLoaded;
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

    // Drag-drop handlers (cannot easily bind to ICommand)
    private void DropZone_DragOver(object sender, DragEventArgs e)
    {
        if (e.Data.GetDataPresent(DataFormats.FileDrop))
        {
            e.Effects = DragDropEffects.Copy;
            ((System.Windows.Controls.Border)sender).Background = new SolidColorBrush(Color.FromArgb(40, 232, 121, 12)); // Accent with low alpha
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

    private void Hyperlink_RequestNavigate(object sender, System.Windows.Navigation.RequestNavigateEventArgs e)
    {
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
        {
            FileName = e.Uri.AbsoluteUri,
            UseShellExecute = true
        });
        e.Handled = true;
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
                Background = new SolidColorBrush(Color.FromRgb(15, 17, 23)) // Dark theme background
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
