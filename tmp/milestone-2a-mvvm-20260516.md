# 里程碑记录：Phase 2A — MVVM 提取

**时间**: 2026-05-16
**提交**: `df25dd8` refactor(src): 提取 MainViewModel 实现 MVVM 模式

## 完成内容

### 新建文件
- `src/Commands/RelayCommand.cs` — 同步/异步命令实现（RelayCommand + AsyncRelayCommand）
- `src/Models/LogEntry.cs` — 日志条目模型（Message, Timestamp, Type）
- `src/ViewModels/MainViewModel.cs` (567 行) — 主 ViewModel

### 修改文件
- `src/MainWindow.xaml` — 绑定更新为 VM 属性和命令
- `src/MainWindow.xaml.cs` — 从 569 行精简至 167 行

### 未修改
- `InstallerService.cs`、`UpdateService.cs` 保持不变

## 技术决策

1. **ViewModelBase**: 直接在 MainViewModel 实现 INotifyPropertyChanged，未抽取基类（仅一个 VM）
2. **AsyncRelayCommand**: 安装操作使用异步命令，避免 .Wait() 死锁 UI 线程
3. **对话框回调**: ViewModel 通过 Func<string, string?> 回调打开文件夹/文件对话框，避免 UI 依赖
4. **RichTextBox 桥接**: 暂时保留 RichTextBox，通过 CollectionChanged 订阅渲染日志（Phase 2C 将替换为 ItemsControl）
5. **属性代理**: VM 直接暴露 InstallerService 的属性路径，通过订阅 PropertyChanged 转发通知

## 构建验证
- `dotnet build src` — 0 错误，1 个预存警告（InstallerService.cs CS8600）
