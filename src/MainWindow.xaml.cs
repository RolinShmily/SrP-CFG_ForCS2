using System;
using System.Collections.Specialized;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using Microsoft.Win32;
using SrPInstaller.Models;
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

        // Subscribe to log entries for RichTextBox rendering
        _viewModel.LogEntries.CollectionChanged += LogEntries_CollectionChanged;

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

    private void LogEntries_CollectionChanged(object? sender, NotifyCollectionChangedEventArgs e)
    {
        if (e.NewItems == null) return;

        foreach (LogEntry entry in e.NewItems)
        {
            string timestamp = entry.Timestamp.ToString("HH:mm:ss");
            string logMessage = $"[{timestamp}] {entry.Message}";

            var range = new TextRange(LogTextBox.Document.ContentEnd, LogTextBox.Document.ContentEnd);
            range.Text = logMessage + Environment.NewLine;

            var color = entry.Type == LogType.Success
                ? Color.FromRgb(34, 139, 34)
                : entry.Type == LogType.Warning || entry.Type == LogType.Error
                    ? Color.FromRgb(220, 20, 60)
                    : Colors.Black;

            range.ApplyPropertyValue(TextElement.ForegroundProperty, new SolidColorBrush(color));
        }

        LogTextBox.ScrollToEnd();
    }

    // Drag-drop handlers (cannot easily bind to ICommand)
    private void DropZone_DragOver(object sender, DragEventArgs e)
    {
        if (e.Data.GetDataPresent(DataFormats.FileDrop))
        {
            e.Effects = DragDropEffects.Copy;
            ((System.Windows.Controls.Border)sender).Background = Brushes.LightBlue;
        }
        else
        {
            e.Effects = DragDropEffects.None;
        }
        e.Handled = true;
    }

    private void DropZone_DragLeave(object sender, DragEventArgs e)
    {
        ((System.Windows.Controls.Border)sender).Background = Brushes.WhiteSmoke;
    }

    private void DropZone_Drop(object sender, DragEventArgs e)
    {
        ((System.Windows.Controls.Border)sender).Background = Brushes.WhiteSmoke;
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
                Background = new SolidColorBrush(Color.FromRgb(250, 250, 250))
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
