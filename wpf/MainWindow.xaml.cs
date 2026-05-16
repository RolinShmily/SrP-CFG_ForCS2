using System.Windows;
using SrPInstaller.Pages;
using SrPInstaller.ViewModels;

namespace SrPInstaller;

public partial class MainWindow
{
    private readonly MainViewModel _viewModel;

    public MainWindow()
    {
        _viewModel = new MainViewModel();
        DataContext = _viewModel;

        InitializeComponent();

        RootNavigation.TitleBar = AppTitleBar;
        Wpf.Ui.Appearance.SystemThemeWatcher.Watch(this);

        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        RootNavigation.Navigate(typeof(InstallPage), _viewModel.InstallVM);

        _viewModel.InstallVM.RefreshAllPaths();
        await _viewModel.CheckForUpdatesAsync();
    }
}
