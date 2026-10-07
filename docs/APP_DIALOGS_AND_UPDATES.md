# 关于、设置与软件版本检查

## 弹窗

侧栏“关于”和“设置”打开 HusPopup 模态弹窗，不改变当前页面。关闭后保留页面、滚动位置、编辑文档、未保存草稿与编辑器缩放。弹窗打开时背景内容与编辑器快捷键停止接收操作，防止滚轮或缩放穿透。

关于显示软件图标、构建版本、简介、作者、架构及三个外部入口：

- 官网：https://cfg.srprolin.top
- 博客：https://blog.srprolin.top
- 项目：https://github.com/RolinShmily/SrP-CFG_ForCS2

设置提供简体中文/English、本机普通字体搜索与选择、只读配置暂存库路径及打开文件夹入口。暂存库不提供修改、迁移或恢复默认操作。设置项仅在保存后生效并持久化；取消、右上角关闭与 Esc 放弃待保存值。

字体只影响界面普通文字，代码等宽字体和 HuskarUI 图标字体独立。系统默认使用 Qt 的 GeneralFont；保存的字体卸载后回退到系统默认。字体列表排除 Symbol-only、图标、符号字体。Qt 仍负责不足字形的字体回退。

## 软件更新

软件更新只由用户在“关于”点击检查触发，不在启动或打开关于时自动联网。GUI 使用 QtConcurrent 工作线程；core 提供 Release 获取、清单校验与稳定版本比较，CLI 共用相同 API。

发布清单：

`https://github.com/RolinShmily/SrP-CFG_ForCS2/releases/latest/download/latest.json`

兼容 Release 工作流的 UTF-8 BOM、version、tag、notes_zh、notes_en 等字段。仅接受 major.minor.patch 稳定版本，tag 必须为 v+version；按数值比较，拒绝重复 JSON 字段、异常类型、超限内容和不一致的标签。WinHTTP 使用 HTTPS、有限重定向、超时与 256 KiB 清单上限。

发现新版后展示官网和 GitHub Releases 下载入口；不下载制品、不执行安装器、不替换程序、不退出当前软件。网络失败明确显示重试/官网下载提示。固定导航地址来自程序，清单不能改写目标链接。

配置包更新使用官网 Cloudflare Worker 上的独立 packages.json，与软件 Release 检查无关。

## 版本与设置存储

顶层 CMake 的 SRP_APP_VERSION 默认为 3.4.2；Release 标签构建传入去 v 的标签版本。core applicationVersion、GUI applicationVersion、关于显示及 CLI version 共享同一来源。

设置是用户级 QSettings INI（SrP/SrP-CFG），包含 ui/language、ui/fontFamily；不是游戏配置，不放入暂存库。保存同步失败时不会应用新值。测试可传入独立 INI 文件，避免修改真实用户偏好。

CLI：

```text
srpcfg version
srpcfg app-update-check --en
```

检查失败返回 1，但始终提供官网和 Releases 地址。

## 验证

- srp_app_update_tests：稳定版本数值比较、同版/旧版、非法版本、BOM 清单、非法类型、重复字段、标签不一致和固定导航 URL。
- 真实 Main.qml 控制器测试：打开/取消/Esc/保存、重启恢复、缺失字体回退、失败设置写入、字体搜索、草稿与缩放保留、三个链接实际 URL、手动触发、异步新版状态及真实网络失败不阻塞 UI。
- 浅色中文、深色英文与 980×640 最小窗口预览；小窗口/较大字体下内容可滚动。

证据保存在 build-gui/verification-dialogs。线上检查在本次环境未取得有效软件清单，已验证错误提示与 UI 响应；新版成功流程使用受控清单结果验证。此验证不包含发布新 Release 或实际浏览器下载升级。
