# SrP-CFG 技术参考

本文档按主题分组，索引 `docs/reference/` 下的全部技术参考文件。各篇均以当前代码实现为准，不虚构未实现行为。

---

## 快速入口

| 你想了解 | 先读 |
|---|---|
| 命令行全部命令与退出码 | [CLI_REFERENCE.md](CLI_REFERENCE.md) |
| 配置文件如何被安全写入、备份与回滚 | [FILE_TRANSACTIONS.md](FILE_TRANSACTIONS.md) |
| 新增文案、翻译键与语言切换机制 | [I18N.md](I18N.md) |
| 自由装配工作区与 CLI 调用方式 | [ASSEMBLY_WORKSPACE.md](ASSEMBLY_WORKSPACE.md) |
| 配置包在线更新、视频与标注 | [CONFIG_PACKAGES_AND_MEDIA.md](CONFIG_PACKAGES_AND_MEDIA.md) |

---

## 主题分组

### 配置格式与装配

| 文档 | 说明 |
|------|------|
| [VALVE_ASSEMBLY.md](VALVE_ASSEMBLY.md) | Valve 默认基线的装配/卸载、custom.cfg 写入规则与备份机制 |
| [ASSEMBLY_WORKSPACE.md](ASSEMBLY_WORKSPACE.md) | 自由装配工作区：Features、Modes、共享编辑器、锚点导航与 CLI 调用 |
| [CONFIG_CATALOG.md](CONFIG_CATALOG.md) | 配置包条目清单结构、新增地图指南 / 特性 / 模式 / 预设的步骤与校验规则 |

### 配置包与媒体

| 文档 | 说明 |
|------|------|
| [CONFIG_PACKAGES_AND_MEDIA.md](CONFIG_PACKAGES_AND_MEDIA.md) | 配置包暂存分层、在线更新、视频设置、地图标注、编辑保护与 CLI 示例 |

### CLI

| 文档 | 说明 |
|------|------|
| [CLI_REFERENCE.md](CLI_REFERENCE.md) | 完整命令表、选项、退出码语义、典型示例；CLI 与 GUI 共用 Core 但独立进程 |

### 文件事务

| 文档 | 说明 |
|------|------|
| [FILE_TRANSACTIONS.md](FILE_TRANSACTIONS.md) | 原子写入与备份、autoexec 挂载/解挂、安装卸载边界、暂存区事务、视频运行守卫与错误键 |

### i18n

| 文档 | 说明 |
|------|------|
| [I18N.md](I18N.md) | core 双语表结构、键命名约定、CLI/GUI 使用方式、新增文案步骤与已知限制 |

### 边界与后续

| 文档 | 说明 |
|------|------|
| [BOUNDARY_CONDITIONS.md](BOUNDARY_CONDITIONS.md) | 各页面边界条件与待后续实现清单 |

### 其他

| 文档 | 说明 |
|------|------|
| [APP_DIALOGS_AND_UPDATES.md](APP_DIALOGS_AND_UPDATES.md) | 关于/设置页面、主题与字体持久化、软件更新检查与版本来源 |

---

## 跨文档关联

- 架构总览：[OVERVIEW.md](../architecture/OVERVIEW.md)
- 设计系统：[DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md)
- GUI 页面与交互由 QML 实现，技术细节见对应核心模块头文件 `src/core/include/srp/core/*.h`、GUI 控制器 `src/gui/src/*_controller.cpp`，以及 [GUI 层](../architecture/GUI.md)

核心源码位置：
- `src/core/src/`：配置解析、写入、备份、探测、装配、包管理、i18n
- `src/cli/src/main.cpp`：CLI 入口与命令分发
- `src/gui/src/*_controller.cpp`：各页面 QML 控制器
