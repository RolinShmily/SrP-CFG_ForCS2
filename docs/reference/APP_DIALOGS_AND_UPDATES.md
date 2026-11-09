# 关于、设置与软件版本检查

## 页面

侧栏“关于”和“设置”为独立页面（`AboutPage.qml` / `SettingsPage.qml`），通过路由切换显示，不再是模态弹窗。

- 路由切换不中断编辑器草稿、光标位置与缩放状态。
- 语言与字体修改仅在点击“保存”后生效；点击“还原”或切走其他页面放弃未保存更改。

关于页面展示软件信息，不涉及可写操作；设置页面保存失败时回退到原值。

关于显示软件图标、构建版本、简介、作者、架构、许可证及三个外部入口：

- 官网：https://cfg.srprolin.com
- 博客：https://blog.srprolin.com
- 项目：https://github.com/RolinShmily/SrP-CFG_ForCS2

设置提供简体中文/English、界面主题（浅色/深色）、本机普通字体搜索与选择、只读配置暂存库路径及打开文件夹入口。主题切换即时生效并持久化到 QSettings（`ui/darkMode`）；语言与字体在点击“保存”后生效并持久化（`ui/language`、`ui/fontFamily`）。页面不再提供关闭按钮或 Esc 关闭行为。

字体只影响界面普通文字，代码等宽字体和 HuskarUI 图标字体独立。系统默认使用 Qt 的 GeneralFont；保存的字体卸载后回退到系统默认。字体列表排除 Symbol-only、图标、符号字体。Qt 仍负责不足字形的字体回退。

## 软件更新

软件更新只由用户在“关于”点击检查触发，不在启动或打开关于时自动联网。GUI 使用 QtConcurrent 工作线程；core 提供 Release 获取、清单校验与稳定版本比较，CLI 共用相同 API。

发布清单：

`https://github.com/RolinShmily/SrP-CFG_ForCS2/releases/latest/download/latest.json`

兼容 Release 工作流的 UTF-8 BOM、version、tag、notes_zh、notes_en 等字段。仅接受 major.minor.patch 稳定版本，tag 必须为 v+version；按数值比较，拒绝重复 JSON 字段、异常类型、超限内容和不一致的标签。WinHTTP 使用 HTTPS、有限重定向、超时与 256 KiB 清单上限。

发现新版后展示官网和 GitHub Releases 下载入口；不下载制品、不执行安装器、不替换程序、不退出当前软件。网络失败明确显示重试/官网下载提示。固定导航地址来自程序，清单不能改写目标链接。

配置包更新使用官网 Cloudflare Worker 上的独立 packages.json，与软件 Release 检查无关。

## 版本与设置存储

顶层 CMake 的 SRP_APP_VERSION 默认为 3.4.6；Release 标签构建传入去 v 的标签版本。core applicationVersion、GUI applicationVersion、关于显示及 CLI version 共享同一来源。

设置是用户级 QSettings INI（SrP/SrP-CFG），包含 `ui/language`、`ui/darkMode`、`ui/fontFamily`；不是游戏配置，不放入暂存库。保存同步失败时不会应用新值。测试可传入独立 INI 文件，避免修改真实用户偏好。CLI 语言由 `--en` / `--zh` 指定，与 GUI 偏好独立。

CLI：

```text
srpcfg version
srpcfg app-update-check --en
srpcfg app-update-check --zh
```

检查失败返回 1。
CLI 始终输出官网和 Releases 地址，方便手动下载；网络不可用时不阻塞其他操作。

## 验证

验证覆盖页面路由、设置持久化、网络失败响应与多语言切换。

- srp_app_update_tests：稳定版本数值比较、同版/旧版、非法版本、BOM 清单、非法类型、重复字段、标签不一致和固定导航 URL。
- GUI 冒烟：`srp_gui.exe --route about|settings --screenshot ...` 生成页面截图，检查 `srp_gui_debug.log` 无 QML 运行时错误；浅色/深色与 980×640 最小窗口均已验证。
- 设置持久化：`ui/language`、`ui/fontFamily`、`ui/darkMode` 读写由 PreferencesController 覆盖；主题切换失败会回退。
- 软件更新：`srp_app_update_tests` 覆盖版本比较、BOM/重复字段/标签不一致与固定导航 URL；GUI 手动触发与网络失败提示通过冒烟验证。

当前没有自动化 GUI 交互测试；历史弹窗测试记录不再代表现状。此验证不包含发布新 Release 或实际浏览器下载升级。
