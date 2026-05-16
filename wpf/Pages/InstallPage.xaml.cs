using System;
using System.Collections.Specialized;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Microsoft.Win32;
using SrPInstaller.Controls;
using SrPInstaller.ViewModels;
using Forms = System.Windows.Forms;

namespace SrPInstaller.Pages;

public partial class InstallPage : Page
{
    private static readonly Brush DropZoneHighlight = new SolidColorBrush(Color.FromArgb(40, 232, 121, 12));
    private static readonly Brush DropZoneNormal = new SolidColorBrush(Color.FromArgb(0, 0, 0, 0));

    private InstallViewModel ViewModel => (InstallViewModel)DataContext;

    public InstallPage()
    {
        InitializeComponent();
        Loaded += OnLoaded;
        Unloaded += OnUnloaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        if (DataContext is InstallViewModel vm)
        {
            vm.BrowseFolderFunc = BrowseFolder;
            vm.BrowseFilesFunc = BrowseFiles;
            vm.LogEntries.CollectionChanged += LogEntries_CollectionChanged;
            return;
        }

        if (Application.Current.MainWindow?.DataContext is MainViewModel mainVm)
        {
            var installVm = mainVm.InstallVM;
            DataContext = installVm;
            installVm.BrowseFolderFunc = BrowseFolder;
            installVm.BrowseFilesFunc = BrowseFiles;
            installVm.LogEntries.CollectionChanged += LogEntries_CollectionChanged;
        }
    }

    private void OnUnloaded(object sender, RoutedEventArgs e)
    {
        if (DataContext is InstallViewModel vm)
            vm.LogEntries.CollectionChanged -= LogEntries_CollectionChanged;
    }

    private void LogEntries_CollectionChanged(object? sender, NotifyCollectionChangedEventArgs e)
    {
        if (e.Action == NotifyCollectionChangedAction.Add)
            Dispatcher.InvokeAsync(() => LogScrollViewer.ScrollToEnd());
    }

    private void LogScrollViewer_PreviewMouseWheel(object sender, MouseWheelEventArgs e)
    {
        e.Handled = true;
        var sv = (ScrollViewer)sender;
        sv.ScrollToVerticalOffset(sv.VerticalOffset - e.Delta);
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
        ((Border)sender).Background = DropZoneNormal;
    }

    private void DropZone_Drop(object sender, DragEventArgs e)
    {
        ((Border)sender).Background = DropZoneNormal;
        if (e.Data.GetDataPresent(DataFormats.FileDrop))
        {
            var files = (string[]?)e.Data.GetData(DataFormats.FileDrop);
            if (files != null) ViewModel.HandleDroppedFiles(files);
        }
    }

    private void DropZoneBorder_Click(object sender, MouseButtonEventArgs e)
    {
        ViewModel.SelectFileCommand.Execute(null);
    }

    private void SteamGuideImage_MouseUp(object sender, MouseButtonEventArgs e)
    {
        try
        {
            var source = ((Image)sender).Source as BitmapSource;
            if (source == null) return;

            var viewer = new ImageViewerWindow(source, "Steam 好友ID 查找指南")
            {
                Owner = Window.GetWindow(this),
                WindowStartupLocation = WindowStartupLocation.CenterOwner
            };
            viewer.ShowDialog();
        }
        catch { }
    }
}
