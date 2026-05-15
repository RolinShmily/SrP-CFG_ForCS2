using System;

namespace SrPInstaller.Models;

public enum LogType { Info, Success, Warning, Error }

public class LogEntry
{
    public string Message { get; init; } = "";
    public DateTime Timestamp { get; init; } = DateTime.Now;
    public LogType Type { get; init; } = LogType.Info;
}
