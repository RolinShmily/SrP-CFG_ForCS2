# 界面截图 (Screenshots)

本目录存放 SrP-CFG 客户端当前实现的窗口截图，WebP 格式，按“页面-主题”命名。截图由程序自身抓取，不是设计效果图，也不是自动更新的产物。设计规则见 [../DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)、[../UX_GUIDELINES.md](../UX_GUIDELINES.md)、[../COMPONENTS.md](../COMPONENTS.md)。

## 1. 清单

| 文件 | 页面（路由） | 主题 | 尺寸（WebP 实际像素） | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| [overview-light.webp](overview-light.webp) | 总览（`overview`） | 浅色 | 1160 × 751 | 默认窗口，Hero + 路径/Convars 双卡 + 运行时卡 |
| [overview-dark.webp](overview-dark.webp) | 总览（`overview`） | 深色 | 1160 × 751 | 同上，用于验证深色令牌与状态色对比度 |
| [settings-light.webp](settings-light.webp) | 设置（`settings`） | 浅色 | 1160 × 751 | 语言 / 主题 / 字体 / 暂存库四张卡片 |
| [settings-dark.webp](settings-dark.webp) | 设置（`settings`） | 深色 | 1160 × 751 | 同上 |
| [settings-980x640.webp](settings-980x640.webp) | 设置（`settings`） | 浅色 | 980 × 640 | 最小窗口验收尺寸，检查滚动与无裁切 |
| [about-light.webp](about-light.webp) | 关于（`about`） | 浅色 | 1160 × 751 | Hero、软件更新、项目链接三段 |
| [presets-light.webp](presets-light.webp) | CFG 预设包（`presets`） | 浅色 | 1160 × 751 | 左侧控制区 + 右侧代码编辑器视口 |
| [assembly-light.webp](assembly-light.webp) | CFG 自由装配（`assembly_baseline`） | 浅色 | 1160 × 751 | Valve 基线分区，含模块卡与折叠编辑器 |
| [video-light.webp](video-light.webp) | 视频设置（`video_settings`） | 浅色 | 1160 × 751 | 配置包面板 + 选项表单 + 媒体编辑器 |
| [annotations-light.webp](annotations-light.webp) | 地图标注（`map_guides`） | 浅色 | 1160 × 751 | 指南选择列表 + 媒体编辑器 |

## 2. 生成方式

截图由 `srp_gui.exe` 自带参数抓取：加载完成后约 1200ms 用 `QQuickWindow::grabWindow()` 抓取整窗并保存，随后退出进程。

```text
srp_gui.exe --store <暂存库路径> --route <路由> --screenshot <输出文件> [--dark|--light] [--width <宽> --height <高>]
```

参数：

| 参数 | 作用 |
| :--- | :--- |
| `--store <路径>` | 指向配置包暂存库；空目录会在首次运行时从仓库 `config/` 初始化。不传则使用默认 `LOCALAPPDATA/SrP-CFG/packages`，可能混入本机已有状态 |
| `--route <路由>` | 启动即切到的页面路由，取值见 `UX_GUIDELINES.md` 的路由表 |
| `--screenshot <文件>` | 抓图输出路径；扩展名决定格式 |
| `--dark` / `--light` | 强制主题，仅用于抓图与诊断，覆盖已保存的 `ui/darkMode` 但不写回 |
| `--width` / `--height` | 指定窗口尺寸，两个都要给才生效；最小窗口用 `980` × `640` |
| `--en` | 强制英文界面，仅在需要英文版素材时使用 |
| `--preset` / `--file` / `--zoom` / `--maximized` | 预设页与装配页的定位辅助参数（预设 id、文件名、编辑器字号 9–28、最大化启动） |

常用命令（在仓库根目录执行；`run_gui.bat` 会设置 Qt/HuskarUI 的 `PATH`，`build-gui/docs-store` 是可复用的隔离暂存库）：

```text
run_gui.bat --store build-gui/docs-store --route overview --screenshot docs/design/screenshots/overview-light.webp
run_gui.bat --store build-gui/docs-store --route overview --dark --screenshot docs/design/screenshots/overview-dark.webp
run_gui.bat --store build-gui/docs-store --route settings --screenshot docs/design/screenshots/settings-light.webp
run_gui.bat --store build-gui/docs-store --route settings --dark --screenshot docs/design/screenshots/settings-dark.webp
run_gui.bat --store build-gui/docs-store --route settings --width 980 --height 640 --screenshot docs/design/screenshots/settings-980x640.webp
run_gui.bat --store build-gui/docs-store --route about --screenshot docs/design/screenshots/about-light.webp
run_gui.bat --store build-gui/docs-store --route presets --screenshot docs/design/screenshots/presets-light.webp
run_gui.bat --store build-gui/docs-store --route assembly_baseline --screenshot docs/design/screenshots/assembly-light.webp
run_gui.bat --store build-gui/docs-store --route video_settings --screenshot docs/design/screenshots/video-light.webp
run_gui.bat --store build-gui/docs-store --route map_guides --screenshot docs/design/screenshots/annotations-light.webp
```

`run_gui.bat` 只负责设置 `PATH` 并透传参数；`scripts/run-gui.ps1` 的退出码在 `WIN32_EXECUTABLE` 下不可靠，截图是否成功以 PNG 是否生成、`srp_gui_debug.log` 是否出现 QML 错误为准（见 [TESTING.md](../../development/TESTING.md) 第 5 节）。

## 3. 注意事项

- **截图不是自动更新的**：没有脚本、没有 CI 步骤会重新生成它们。UI 改动后必须手动重抓并覆盖同名文件，否则文档会与实现脱节。
- 抓图包含定制标题栏，因此像素高度与 `Main.qml` 声明的窗口高度不完全相等；以本文件清单里的尺寸为准。
- 默认窗口尺寸为 1160 × 720，最小 980 × 640；除 `settings-980x640.webp` 外都用默认尺寸，便于逐张对比。
- 抓图只等 1200ms：若某页依赖异步资源（封面图、配置包检查），先确认页面已稳定，必要时用 `--preset` / `--file` 固定内容后重抓。
- 截图内含本机账号名与路径，属于个人信息；提交前确认内容可公开，且不要抓取包含完整用户目录的页面。
- 官网使用的另一套按语言区分的截图位于 `website/public/app/`（`overview-zh.webp` 等），与本目录用途不同，不要互相替换。
- 抓完图后检查：浅/深两色是否有白底白字或灰黑残留、卡片层级是否仍只靠边框、980 × 640 下是否出现横向裁切。
