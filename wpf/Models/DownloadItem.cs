namespace SrPInstaller.Models;

public record DownloadItem(
    string Name,
    string FileName,
    string Description,
    string? Note,
    string DownloadUrl
);
