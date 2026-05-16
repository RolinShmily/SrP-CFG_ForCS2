using System.Windows;
using System.Windows.Controls;
using SrPInstaller.ViewModels;

namespace SrPInstaller.Pages;

public partial class AboutPage : Page
{
    public AboutPage()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        if (DataContext != null) return;

        if (Application.Current.MainWindow?.DataContext is MainViewModel vm)
            DataContext = vm.AboutVM;
    }
}
