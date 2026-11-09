# CLI 参考

CLI 可执行文件 `srpcfg` 与 GUI 共用同一 `srp_core`，但运行在不同进程中。参数解析、输出打印和退出码处理完全独立；两者不共享内存状态。语言只由 CLI 的 `--zh` / `--en` 决定，不受 GUI 偏好影响；`--store` 只让两个进程指向同一暂存目录，不传递语言或运行时状态。

## 调用约定

```text
srpcfg [command] [options]
```

未提供命令时默认执行 `detect`。

## 退出码

| 值 | 含义 |
|----|------|
| 0 | 成功或无变化（如重复装配、文件内容未变） |
| 1 | 失败（参数错误、写入失败、网络失败、无效配置等） |
| 2 | 模式绑定冲突，需要 `--confirm` 确认替换（仅 `mode-bind`） |

## 语言选项

| 选项 | 说明 |
|------|------|
| `--en`, `--english` | 英文输出 |
| `--zh` | 简体中文输出 |

语言设置影响 `srp::core::tr()` 解析的文案表，对 GUI 无效（GUI 通过 QSettings 持久化语言）。

## 通用路径与作用域选项

| 选项 | 说明 |
|------|------|
| `--cfg-dir <path>` | 显式指定游戏 CFG 根目录（装配/预设/Valve 命令） |
| `--store <path>` | 显式指定配置包暂存区根目录 |
| `--user-cfg-dir <path>` | 显式指定账号本地 CFG 目录（video-apply） |
| `--annotations-dir <path>` | 显式指定 annotations/local 目录 |

## 完整命令表

### 环境与探测

- `detect` — 运行完整环境与路径诊断（默认命令）
- `launch` — 通过 Steam 协议启动 CS2
- `users` — 列出检测到的所有 Steam 用户
- `switch-user <account_id>` — 查看指定账号的本地 CFG 与 Convars 摘要
- `open-cfg` — 在资源管理器中打开游戏全局 CFG 目录
- `open-user-cfg` — 在资源管理器中打开当前账号本地 CFG 目录

### VCFG 与 Convars

- `convars-status` — 查看当前账号 VCFG 中的 Convars/键位绑定数量
- `convars-clean-all` — 移除当前账号全部 Convars（创建 `.bak`）
- `keybinds-clean-all` — 移除当前账号全部键位绑定（创建 `.bak`）

### 预设

- `presets` — 列出所有预设 ID、激活状态及差异标记 `(*)`
- `preset-load <id>` — 加载指定预设到 `custom.cfg`
- `preset-unload` — 卸载当前激活的预设入口

### Valve 基线

- `valve-status` — 查看 Valve 装配状态（settings / keymap / active preset）
- `valve-assemble` — 装配 Valve（需 `--settings` 和/或 `--keymap`）
- `valve-unload` — 卸载 Valve（需 `--settings` 和/或 `--keymap`）
- `reset-valve` — 装配 Valve 设置+按键，并清理当前账号 VCFG

选项：`--settings`, `--keymap`

### 特性与模式

- `modules` — 列出所有特性/模式及其装配/绑定状态
- `feature-assemble <id>` — 装配指定特性；可选 `--keymap`
- `feature-unload <id>` — 卸载指定特性的全部直接入口
- `mode-bind <id> --key <key> [--keymap] [--confirm]` — 绑定模式启动键
- `mode-unbind <id>` — 移除模式启动键与旧版直接入口

选项：`--key <key>`, `--keymap`, `--confirm`

### 版本与更新

- `version` — 显示当前软件版本
- `app-update-check` — 检查 GitHub Release（不下载、不安装）

### 配置包与媒体

- `packages` — 列出暂存包版本及当前暂存区路径
- `packages-check` — 拉取官方配置清单
- `package-update <id>` — 更新指定暂存包（绝不部署到游戏）
- `package-reset <id> --file <relative>` — 恢复暂存包的指定文件为默认
- `video-status` — 查看暂存视频配置的所有字段值
- `video-set --field <key> --value <value>` — 修改暂存视频字段
- `video-apply` — 将暂存视频合并到当前或指定账号
- `annotations` — 列出所有指南部署状态
- `annotation-deploy <id>` — 部署指定指南
- `annotation-remove <id>` — 移除指定指南

选项：`--file <relative>`, `--field <key>`, `--value <value>`

## 典型示例

```text
# 探测环境
srpcfg detect --zh

# 装配 autoview 特性并附带按键
srpcfg feature-assemble autoview --keymap --zh

# 绑定 practice 模式到 p 键，遇到冲突时确认
srpcfg mode-bind practice --key p --keymap --confirm --zh

# 更新 video 暂存包并查看字段
srpcfg package-update video
srpcfg video-status
srpcfg video-set --field setting.msaa_samples --value 2
srpcfg video-apply

# 使用独立暂存区测试
srpcfg packages --store C:\Temp\srp-store
```

## 与 GUI 的关系

- CLI 不依赖 GUI 进程；两者可并发运行同一暂存区，`StoreLock` 保证进程级互斥。
- CLI `--cfg-dir` 直接写入游戏 CFG 目录；GUI 则通过装配控制器在后台调用相同 core 函数。
- 语言选项仅影响当前 CLI 进程输出；GUI 语言由 `PreferencesController` 通过 QSettings 管理。
