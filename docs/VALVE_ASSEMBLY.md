# Valve 基线装配与配置备份

Valve 对应侧边栏“自由装配 → Valve 默认基线”，现在是 [统一工作区](ASSEMBLY_WORKSPACE.md) 的第一段。实现边界：core 修改文件，CLI 调用同一接口，GUI 控制器负责状态、确认与共享编辑器同步。

## 配置操作

- “设置”“按键”复选框只选择本次操作范围，默认未选中，成功后清空，失败/取消后保留。
- 装配会取消当前直接启用的 `srp_apply_*` 预设入口；写入勾选的 Valve `exec`，未勾选的 Valve 项保持原状态。
- 卸载只移除勾选的 Valve 入口，不自动恢复之前的预设，不回滚已经运行的游戏状态。
- 用户层、其他模块命令、注释、BOM 和换行风格保留。可识别未注释的直接命令、分号命令串、带引号的 exec 路径及旧版整体 `apply.cfg`/`srp_reset_valve` 入口。部分卸载旧整体入口会保留另一项独立 exec。
- 状态表示 `custom.cfg` 中存在执行入口，不表示 CS2 已应用。配置在下次启动或执行 `srp_reload` 时应用；移除入口仅阻止后续执行。
- 装配存在已启用预设时要求确认；未安装时要求安装并装配。GUI 成功后切换到 `user/custom.cfg` 展示结果。
- 首页恢复默认调用相同 Valve 入口修改能力，选择设置和按键，保留用户层，另外执行原有 VCFG 清理流程。只写 `srp-cfg/user/custom.cfg`，不再生成游戏 CFG 根目录的 `custom.cfg`。

## 编辑器

默认打开 `user/custom.cfg`，也支持 `valve/settings.cfg`、`valve/keymap.cfg`。Valve 文件允许编辑、保存和恢复随包原始版本；用户文件禁止恢复默认。

- 文件菜单 `(*)`：Valve 文件与随包版本有差异；保存按钮 `*`：编辑器有未保存改动。
- 读取优先使用游戏目录；未安装时只读预览随包文件。保存只写入游戏安装目录，避免修改随包默认源。
- 文件切换、装配/卸载遇到未保存文档时暂停并提示先保存；恢复 Valve 默认文件则通过确认框明确舍弃未保存编辑。
- 监听文件与目录，支持外部替换文件保存。外部冲突不会覆盖未保存草稿。
- Ctrl + 滚轮、Ctrl + / - / 0 缩放字体；普通滚轮滚动；工具栏固定，左右区域分别滚动。

## 写入与备份

CFG 写入共用 `writeConfigWithBackup`：预设加载/卸载、编辑保存/恢复、Valve 装配/卸载、首页恢复和重新安装更新 CFG 均使用该能力。

```text
srp-cfg/user/custom.cfg
srp-cfg/user/custom.cfg.bak
srp-cfg/user/.backups/custom.cfg/<UTC时间戳>-<唯一序号>-<操作原因>.bak
```

- `.bak` 保留最近一次成功修改前的字节内容。
- 历史目录按文件独立管理，保留最近 20 份不同内容；相同历史内容保留最新快照。
- 无内容变化不写文件，不更新 `.bak`，不创建历史备份。
- 先写同目录临时文件、完成备份，再原子替换；备份失败或替换失败不截断原文件。替换失败时恢复此前 `.bak`。
- 只有成功替换后才清理旧历史。目录权限导致清理失败时可能暂时超过 20 份，不能以删除备份失败否认已经完成的文件保存。
- 重新安装保留用户文件及现有备份，不复制源目录的 `.backups`、`.bak` 或 `.tmp`。
- 软件只能备份它发起的写入，无法补回外部程序在监听之前已经覆盖的内容。此功能不是跨文件事务或系统断电恢复日志。

## CLI

```text
srp_cli valve-status --en
srp_cli valve-assemble --settings --keymap --zh
srp_cli valve-unload --settings --en
```

`--cfg-dir <游戏CFG目录>` 支持 Valve 与预设命令，供手动指定目录或隔离测试。CLI 为显式操作入口，装配直接取消预设，没有 GUI 确认弹窗。

## 验证

```text
cmake --build build-gui --config Release --target srp_config_tests
build-gui/app/core/Release/srp_config_tests.exe
```

测试创建临时目录，覆盖用户层保护、旧命令兼容、部分卸载、注释/字符串解析、CRLF/BOM、重复操作、20 份历史保留、备份失败、Windows 文件占用、重新安装及恢复默认，不修改真实游戏目录。
