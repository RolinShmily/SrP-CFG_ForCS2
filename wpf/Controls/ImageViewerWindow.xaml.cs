using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media.Imaging;
using Wpf.Ui.Controls;

namespace SrPInstaller.Controls;

public partial class ImageViewerWindow : FluentWindow
{
    private const double MinZoom = 0.1;
    private const double MaxZoom = 10.0;
    private const double ZoomStep = 1.25;

    private double _zoomLevel = 1.0;
    private bool _isPanning;
    private Point _panStart;
    private double _startOffsetX, _startOffsetY;

    public string ImageViewTitle { get; }

    public ImageViewerWindow(BitmapSource source, string title)
    {
        ImageViewTitle = title;
        DataContext = this;

        InitializeComponent();

        ViewerTitleBar.Title = title;
        ZoomableImage.Source = source;

        Loaded += (_, _) => FitToWindow();
    }

    private void UpdateZoom(double newZoom)
    {
        _zoomLevel = Math.Clamp(newZoom, MinZoom, MaxZoom);
        ImageScale.ScaleX = _zoomLevel;
        ImageScale.ScaleY = _zoomLevel;
        ZoomLabel.Text = $"{(int)(_zoomLevel * 100)}%";

        Cursor = _zoomLevel > 1.01 ? Cursors.ScrollAll : Cursors.Arrow;

        if (_zoomLevel <= 1.01)
        {
            ImageTranslate.X = 0;
            ImageTranslate.Y = 0;
        }
    }

    private void FitToWindow()
    {
        if (ZoomableImage.Source is not BitmapSource src) return;

        var imgW = src.PixelWidth / (src.DpiX / 96.0);
        var imgH = src.PixelHeight / (src.DpiY / 96.0);

        var pad = 16;
        var availW = ImageContainer.ActualWidth - pad;
        var availH = ImageContainer.ActualHeight - pad;

        if (availW <= 0 || availH <= 0) return;

        var scaleX = availW / imgW;
        var scaleY = availH / imgH;
        UpdateZoom(Math.Min(scaleX, scaleY));
    }

    private void ImageContainer_PreviewMouseWheel(object sender, MouseWheelEventArgs e)
    {
        if (Keyboard.Modifiers != ModifierKeys.Control)
        {
            e.Handled = true;
            return;
        }

        e.Handled = true;
        var factor = e.Delta > 0 ? ZoomStep : 1.0 / ZoomStep;
        UpdateZoom(_zoomLevel * factor);
    }

    private void ZoomableImage_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (_zoomLevel <= 1.01) return;
        _isPanning = true;
        _panStart = e.GetPosition(ImageContainer);
        _startOffsetX = ImageTranslate.X;
        _startOffsetY = ImageTranslate.Y;
        ((FrameworkElement)sender).CaptureMouse();
        e.Handled = true;
    }

    private void ZoomableImage_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        if (!_isPanning) return;
        _isPanning = false;
        ((FrameworkElement)sender).ReleaseMouseCapture();
        e.Handled = true;
    }

    private void ZoomableImage_MouseMove(object sender, MouseEventArgs e)
    {
        if (!_isPanning) return;
        var pos = e.GetPosition(ImageContainer);
        ImageTranslate.X = _startOffsetX + (pos.X - _panStart.X);
        ImageTranslate.Y = _startOffsetY + (pos.Y - _panStart.Y);
        e.Handled = true;
    }

    private void BtnZoomIn_Click(object sender, RoutedEventArgs e) => UpdateZoom(_zoomLevel * ZoomStep);
    private void BtnZoomOut_Click(object sender, RoutedEventArgs e) => UpdateZoom(_zoomLevel / ZoomStep);
    private void BtnFit_Click(object sender, RoutedEventArgs e) => FitToWindow();
    private void BtnActual_Click(object sender, RoutedEventArgs e) => UpdateZoom(1.0);
}
