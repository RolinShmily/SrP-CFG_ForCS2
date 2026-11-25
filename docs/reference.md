# 参考手册

## 1. `content/` 内容包与 `catalog.json`

| 包标识 | 目标游戏路径 | 说明 |
| :--- | :--- | :--- |
| `srp-cfg` | `game/csgo/cfg/` | CS2 运行时核心、社区预设、特性模块、模式会话与 `user/custom.cfg` |
| `video` | `Steam/userdata/<ID>/730/local/cfg/` | 竞技画面模板 `cs2_video.txt`，合并时保留本机显卡与显示器标识 |
| `annotations` | `game/csgo/annotations/local/` | CS2 原生 KV3 地图标注指南，不覆盖个人 `mapguide` |
| `srp-cfg-csgo` | `csgo/cfg/` | Source 1（CS:GO）移植版，仅通过独立包分发，不由 CS2 桌面端管理 |

`srp-cfg` 与 `annotations` 通过各自目录下的 `catalog.json`（`schema_version: 1`）驱动桌面端卡片、装配选项与编辑器文件列表，新增条目无需修改 C++/QML：

- **预设（`category: "presets"`）**：包含 `settings.cfg`、`keymap.cfg`、`apply.cfg`，并在 `runtime/commands.cfg` 注册对应入口 `command`。
- **特性 / 模式（`category: "features" | "modes"`）**：包含 `settings.cfg`、`runtime.cfg`，可选 `keymap.cfg` 与 `with-keymap.cfg`（对应可选 `keymap_command`）。
- **地图指南（`content/annotations/catalog.json`）**：目录名与 `.txt` 主名一致（`<directory>/<directory>.txt`），KV3 内 `MapName` 与地图一致。
- **校验约束**：禁止绝对路径、`..` 穿越、反斜杠、符号链接、重复 ID / 命令或非法字符；无效清单会阻止整个包更新并保留旧版。

## 2. 运行时入口指令（`content/srp-cfg/runtime/commands.cfg`）

`content/srp-cfg/` 下每个 `.cfg` 文件均自带行内中文注释，桌面端也可直接装配与查看，无需在游戏内记忆复杂指令。以下为 `commands.cfg` 注册的全部入口（特性与模式带 `_keys` 后缀表示同时加载该模块的默认键位）：

| 类别 | 指令 | 说明 |
| :--- | :--- | :--- |
| 重载 | `srp_reload` | 重新执行 `autoexec.cfg`（`Runtime → User`） |
| 预设 | `srp_apply_default` / `srp_apply_echo` / `srp_apply_visionl` / `srp_apply_yszh` | 应用对应完整预设（含键位） |
| Valve 基线 | `srp_reset_valve` / `srp_reset_valve_user` / `srp_reset_valve_settings` / `srp_reset_valve_keys` | 恢复 Valve 默认基线（完整 / 重载用户层 / 仅设置 / 仅键位） |
| 特性模块 | `srp_autoview[_keys]`、`srp_crosshair_view[_keys]`、`srp_knife[_keys]`、`srp_zeus[_keys]` | 启用对应功能特性 |
| 会话模式 | `srp_practice[_keys]`、`srp_pwa_prac[_keys]`、`srp_preview[_keys]`、`srp_demo[_keys]`、`srp_guidemake[_keys]` | 启动对应离线/观战模式 |
| 地图标注 | `annotation_load <GuideName>`（CS2 原生指令） | 加载已部署地图标注（如 `SrP-Mirage-Guide`） |

## 3. 桌面端诊断与启动参数

`SrP-CFG.exe`（构建产物 `srp_gui.exe`）支持以下命令行诊断开关，主要用于本地调试与截图冒烟：

| 参数 | 作用 |
| :--- | :--- |
| `--store <dir>` | 指定隔离暂存库目录（默认 `%LOCALAPPDATA%/SrP-CFG/packages`） |
| `--route <name>` | 启动直达页面：`overview`、`presets`、`assembly_baseline`、`assembly_features`、`assembly_modes`、`assembly_usercfg`、`video_settings`、`map_guides`、`about`、`settings` |
| `--screenshot <file>` | 渲染就绪约 1200ms 后抓图保存并自动退出 |
| `--width <w> --height <h>` | 指定窗口尺寸（最小支持 `980×640`） |
| `--dark` / `--light` | 强制本次运行主题（不写回持久化偏好） |
| `--en` / `--english` | 强制英文界面 |
| `--preset <id>` / `--file <rel>` | 定位预设或编辑器文件（`settings` / `keymap` / `custom` 或相对路径） |
| `--zoom <9..28>` / `--maximized` | 指定代码编辑器字号或最大化启动 |

## 4. 外部网络契约（`https://cfg.srprolin.com`）

桌面端与官网下载区统一只连接 `https://cfg.srprolin.com`，不上传任何本机路径或账号信息，WinHTTP 禁止一切 HTTP 重定向（`WINHTTP_OPTION_REDIRECT_POLICY_NEVER`）：

1. **内容包清单**：`https://cfg.srprolin.com/packages/manifest.json`（兼容别名 `/packages.json`）
   - 下载地址必须严格落在 `https://cfg.srprolin.com/packages/` 下；
   - 强制校验包大小（≤ 16 MB）、SHA-256、ZIP 条目路径安全与解包后目录内容 / `catalog.json`。
2. **软件版本与下载**：
   - 清单：`https://cfg.srprolin.com/releases/latest.json`（由 `worker/index.ts` 回源 GitHub Release 的 `latest.json` 并将下载链接改写为同源地址，保持原始 SHA-256）；
   - 下载：`https://cfg.srprolin.com/releases/download/<tag>/<file>`（严格白名单匹配 `srp-cfg-<tag>-windows-x64-{gui.zip,setup.exe}`，流式透传 GitHub Releases）；
   - 桌面端仅检查版本号并展示下载入口，不自动静默下载或替换可执行文件。
