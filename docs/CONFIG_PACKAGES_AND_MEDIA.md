# 配置暂存、视频设置与地图标注

## 分层

- `srp_core` 定义包清单解析、网络下载、哈希/路径校验、暂存事务、视频字段合并和指南部署。
- CLI 调用相同 core 接口，可显式指定隔离目录。
- `PackageController` 用 QtConcurrent 在后台执行检查/更新；`MediaController` 管理编辑草稿、外部修改、编码和界面状态。
- QML 只处理布局与交互，两页采用左侧独立滚动操作区及右侧固定编辑器。

## 配置包与暂存区

三个包独立管理：`srp-cfg`、`video`、`annotations`，Valve 包含在 `srp-cfg` 内。软件版本与包版本相互独立。地图、预设和模块由包内清单驱动，新增步骤见 [CONFIG_CATALOG.md](CONFIG_CATALOG.md)。

GUI 安装/便携包及 CLI 包随附完整 `config/`。首次运行离线初始化到 Windows 当前用户的：

```text
%LOCALAPPDATA%/SrP-CFG/packages/
  current.txt
  generations/<generation>/
    original/<package>/       # 当前包的原始配置
    work/<package>/           # 可编辑副本
    base/<package>/           # 副本所依据的原始内容
    base-version/<package>/   # 副本基准版本
    digest/<package>          # 已导入 ZIP 的 SHA-256
```

CLI 与 GUI 均可传入 `--store <path>` 使用独立暂存区。安装目录无需写权限；源仓库 `config/` 不作为可编辑文件。

初始化只在无有效暂存区时进行，不会因重新安装软件把已更新的包降级。后续在对应页面手动检查并更新包。

## 在线更新

读取 Cloudflare Worker 上的 `https://cfg.srprolin.top/packages.json`（schema 1）。只接受已知三个包和官网 `/packages/` 路径的 HTTPS 下载；验证版本、大小和 SHA-256。大小限制为 ZIP 16 MiB、解包总量 64 MiB、单文件 16 MiB、最多 5000 条目。拒绝绝对/越界路径、Windows 非法名称、链接及大小写重复路径。

Windows 网络使用 WinHTTP，哈希使用 BCrypt；解包通过系统 Windows PowerShell/.NET 执行应用生成的校验脚本，配置包本身不提供可执行脚本。当前在线更新只实现 Windows 平台。

准备新 generation 后，通过安全写入器切换 `current.txt`；失败保留旧指针和旧配置。进程级文件锁防止同一暂存区被 CLI/GUI 同时写入。保留有限旧 generation，副本的 `.bak` 与历史备份随 generation 迁移。

- 未修改副本随新包刷新。
- 已修改副本保留内容及基准，标记“基于旧版本”。
- 编辑器未保存草稿保留；以后保存也保留原基准。
- 恢复默认时备份工作副本，再采用当前包原始内容和新基准。
- 更新只修改暂存区，绝不自动部署到游戏。
- 内容 SHA-256 也参与更新判断，同版本不同内容可更新，相同哈希不重复导入。

Worker 工作流生成版本 ZIP、latest ZIP，清单下载 URL 使用带 SHA 的内容文件名，避免清单与 mutable latest ZIP 错配。网站与包一起静态部署，不再依赖 gh-pages 分支。旧软件包中的 Pages 地址不会自动改变，需下载安装包含官网地址迁移的新构建。

## SrP-CFG 接入

首页保留原有装配/重新装配/卸载，新增包检查/更新区。

`findSourceConfigDir()` 返回暂存区 original，用于未安装预览和恢复原始配置。`installSrp()` 默认部署 work；重新装配继续保留游戏中的 `user/custom.cfg`。预设与自由装配安装文件的编辑行为保持原有规则，包更新不覆盖游戏安装文件。

## 视频设置

- 左侧 15 类选项与右侧 `video/cs2_video.txt` 对应同一份草稿，双向同步。
- KeyValues 解析、重复键/选项值校验及变更属于 core；修改一个字段保留其余文本。
- “保存”仅写暂存副本；“应用到当前账号”必须先保存草稿。
- 显示目标账号；使用当前账号 `Steam/userdata/<accountId>/730/local/cfg/cs2_video.txt`。
- 应用前检测 `cs2.exe`，游戏运行时暂停写入。
- 目标原文件不存在时引导先启动游戏生成，绝不使用模板硬件标识伪造首次配置。
- 只合并支持的画质、显示和分辨率字段；保留目标 VendorID、DeviceID、Version、CPU/GPU 识别等级、显示器索引、刷新率和未知字段。
- 分辨率变化同步写入 aspectratiomode；当前表单提供常见分辨率，原文件合法自定义分辨率可保留并显示。自定义文本尺寸范围为 320–16384。
- AutoConfig 为 2 时合并为自定义画质模式；键名大小写兼容。
- 保留目标 BOM/CRLF 及完整备份，下一次启动游戏应用。
- “恢复默认”恢复当前 video 包原始副本，不代表 CS2 的硬件自动推荐画质。

## 地图标注

地图条目来自 annotations/catalog.json，scope 复选框与装配状态独立；当前包提供 Dust II、Mirage、Ancient、Inferno，后续新增地图不必修改程序。

```text
game/csgo/annotations/local/
  SrP-Dust2-Guide/SrP-Dust2-Guide.txt
  SrP-Mirage-Guide/SrP-Mirage-Guide.txt
  SrP-Ancient-Guide/SrP-Ancient-Guide.txt
  SrP-Inferno-Guide/SrP-Inferno-Guide.txt
  mapguide/mapguide.txt                         # 个人指南，应用不修改
```

编辑、保存、恢复针对暂存副本。装配前校验所有所选指南的 KV3 结构与 MapName；指南逐文件安全写入。批量操作发生 OS 错误时可能部分成功，界面报告部分完成、刷新状态且保留操作选择以便重试。全成功后清空操作选择。

卸载只移除所选 SrP 文件，保留原始字节的 `.bak`/历史，不删除目录、其他文件或个人 mapguide。通过原子重命名移出目标再删除临时文件，删除失败不会把 live 文件清空。

“已装配”表示目标文件存在，“内容不同”比较目标文件和暂存副本；均不表示指南已在游戏内加载。

每行可复制 `annotation_load SrP-<Map>-Guide`。目录结构已与本机现有指南核对；当前测试不启动 CS2，实际游戏版本的指南加载效果仍需要游戏内验证。

## 编辑保护

保留 BOM 与换行格式，文件与父目录监测支持外部原子替换。未保存草稿阻止切换/部署，外部冲突不覆盖草稿并阻止静默保存。恢复默认需要确认，允许用户明确放弃草稿。编辑器支持语法高亮、行号、Ctrl+滚轮缩放和独立滚动，中英文及手动深色切换。

文件写入沿用最新 `.bak` + 最多 20 个不同字节内容的历史版本，无变化不增加备份。

## CLI 示例

```text
srpcfg packages
srpcfg packages-check
srpcfg package-update video
srpcfg package-reset video --file cs2_video.txt
srpcfg video-status
srpcfg video-set --field setting.msaa_samples --value 2
srpcfg video-apply --user-cfg-dir <account-cfg>
srpcfg annotations --annotations-dir <annotations/local>
srpcfg annotation-deploy mirage --annotations-dir <annotations/local>
srpcfg annotation-remove mirage --annotations-dir <annotations/local>
```

命令支持 `--zh/--en`、`--store`；成功/无变化返回 0，失败返回 1。

## 验证

- `srp_media_tests`：临时目录验证初始化、更新保留/刷新、原始包不变、旧基准、失败发布回滚、视频字段合并、BOM/CRLF、缺失账号文件拒绝、KV3 地图校验、选择性移除和 Windows 占用失败保护。
- `srp_config_tests`：既有装配、模式绑定、备份、首页恢复回归。
- 真实 QML harness：鼠标选项、文本双向同步、保存、更新保留草稿、外部替换/冲突、地图选择/装配/移除、复制命令、固定编辑器、缩放、中英文/深色、异步真实下载且 UI 仍响应。
- CLI 在线下载/校验/导入，所有写入隔离暂存/账号/指南目录。
- 受控 ZIP：正常、路径越界、反斜杠、绝对路径、符号链接、大小写重复、坏哈希。
- 正式 GUI 预览：两页亮/暗、中/英、980×640 最小窗口、1920×1080 宽屏及首页。

验证日志、截图及临时 harness 源码副本保存在 `build-gui/verification-media/`（构建产物，不提交）。Windows installer 尚未在本机运行 Inno Setup 编译；已核对 release 将完整 config 随包复制，在线 CI 构建仍需后续运行确认。
