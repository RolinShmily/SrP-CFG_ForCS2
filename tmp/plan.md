 SrP-CFG 双轨重构计划

 Context

 当前项目有一个静态 HTML 落地页（site/）和一个 WPF 安装器（src/）。需要：
 1. 将静态页面替换为 Vue.js SPA 官网（展示 + 文档 + 下载）
 2. 将 WPF 安装器重构为 MVVM 模式 + 现代扁平化 UI

 两条轨道完全独立，可以并行推进。

 ---
 Track 1: Vue 官网 (site/)

 Phase 1A — 项目骨架 (里程碑 1)

 - 清空 site/，用 create-vue / Vite 初始化 Vue 3 + TypeScript + Vue Router 项目
 - 路由结构：
   - / — 首页（展示）
   - /docs — 文档索引
   - /docs/:slug — 单篇文档（autoexec, practice, knife 等）
   - /download — 下载页
 - 通用组件：NavBar、FooterBar
 - 将 13 个 markdown 文档从 D:\GitHub\SrP-DoC\SrP-CFG_CS2\ 复制到 src/content/
 - Commit: feat(site): 初始化 Vue.js SPA 项目骨架

 Phase 1B — 首页实现 (里程碑 2)

 - 将现有 index.html + style.css 内容迁移为 Vue 组件
 - Hero、Features、Steps、Showcase、CTA 各拆为组件
 - 终端打字动画用 Vue 响应式重写
 - Commit: feat(site): 实现首页展示页面

 Phase 1C — 文档页面 (里程碑 3)

 - markdown 渲染管线（markdown-it 或 vite-plugin-vue-markdown）
 - 左侧栏文档列表 + 右侧内容区
 - 支持 markdown 表格、代码块、提示容器
 - 13 篇文档全部可导航访问
 - Commit: feat(site): 实现文档页面与 CFG 功能解析

 Phase 1D — 下载页面 (里程碑 4)

 - 下载链接表（MSI、便携版、各变体 ZIP）
 - 变体选择器（default、echo、yszh、visionl）
 - Commit: feat(site): 实现下载页面

 Phase 1E — 构建部署 (里程碑 5)

 - vite.config.ts 生产构建配置
 - Cloudflare Workers/Pages 部署配置
 - 响应式审查、懒加载
 - Commit: feat(site): 完成构建配置与部署设置

 ---
 Track 2: WPF 安装器 (src/)

 Phase 2A — MVVM 提取 (里程碑 6)

 - 新建 ViewModels/MainViewModel.cs，提取 MainWindow.xaml.cs 中所有 UI 逻辑
 - 新建 Commands/RelayCommand.cs
 - MainViewModel 属性：路径显示、Steam 用户列表、安装选项、日志集合、按钮状态
 - MainViewModel 命令：刷新、备份、安装、文件选择、路径选择
 - MainWindow.xaml.cs 精简为仅拖放事件处理 + DataContext 设置
 - 保持 InstallerService.cs 和 UpdateService.cs 不变
 - Commit: refactor(src): 提取 MainViewModel 实现 MVVM 模式

 Phase 2B — UI 重新设计 (里程碑 7)

 - 现代扁平化设计（Fluent Design 风格），圆角 8px，8px 间距系统
 - 配色方案：与网站品牌一致的暗色主题
 - 三个安装目标改为卡片式布局
 - 拖放区更大更醒目，虚线边框
 - 日志面板终端风格（深色背景、等宽字体）
 - 更新 App.xaml 全局样式
 - Commit: feat(src): 重新设计 MainWindow 为现代化扁平化 UI

 Phase 2C — 日志输出增强 (里程碑 8)

 - RichTextBox 替换为 ItemsControl 绑定 ObservableCollection<LogEntry>
 - LogEntry：Message、Timestamp、Type（OK/Warning/Info）
 - DataTemplate 实现颜色编码和时间戳
 - Commit: feat(src): 实现带样式的 MVVM 绑定日志输出

 Phase 2D — 构建验证 (里程碑 9)

 - dotnet build src 编译通过
 - dotnet publish -c Release 正常发布
 - MSI 构建兼容性验证
 - Commit: chore(src): 验证构建管道和 MSI 兼容性

 ---
 并行执行策略

 批次 1（并行）： Phase 1A + Phase 2A（两个轨道的基础搭建）
 批次 2（各轨道顺序）： Phase 1B + Phase 2B（视觉交付）
 批次 3（并行）： Phase 1C + Phase 2C（功能完善）
 批次 4（顺序）： Phase 1D → 1E + Phase 2D（收尾）

 每个里程碑完成后：
 1. Commit 记录
 2. tmp/ 中生成带时间戳的流程文档
 3. 运行 /simplify 代码优化

 ---
 关键文件

 ┌─────────────────────────────────┬────────────────────────┐
 │              文件               │          操作          │
 ├─────────────────────────────────┼────────────────────────┤
 │ src/InstallerService.cs         │ 不变                   │
 ├─────────────────────────────────┼────────────────────────┤
 │ src/UpdateService.cs            │ 不变                   │
 ├─────────────────────────────────┼────────────────────────┤
 │ src/MainWindow.xaml             │ 重写                   │
 ├─────────────────────────────────┼────────────────────────┤
 │ src/MainWindow.xaml.cs          │ 精简为最小 code-behind │
 ├─────────────────────────────────┼────────────────────────┤
 │ src/App.xaml                    │ 更新全局样式           │
 ├─────────────────────────────────┼────────────────────────┤
 │ src/ViewModels/MainViewModel.cs │ 新建                   │
 ├─────────────────────────────────┼────────────────────────┤
 │ src/Commands/RelayCommand.cs    │ 新建                   │
 ├─────────────────────────────────┼────────────────────────┤
 │ site/*                          │ 全部替换为 Vue 项目    │
 └─────────────────────────────────┴────────────────────────┘

 验证方式

 - Vue: pnpm dev 启动开发服务器，验证所有页面可访问，文档正确渲染
 - WPF: dotnet build src 编译通过，dotnet publish -c Release
 发布成功，手动运行验证路径检测/拖放/安装功能