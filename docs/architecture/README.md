# 架构文档（architecture）

本目录描述 SrP-CFG 的**代码结构真相**：谁依赖谁、状态放在哪、一次操作如何穿过 QML/CLI 落到文件系统、如何构建与发布。它回答“改这里会不会破坏那里”，不回答“这个功能怎么用”或“界面长什么样”。

上级索引：[docs/README.md](../README.md)（四大文档体系与按任务导航）。

## 阅读顺序

1. **[OVERVIEW.md](OVERVIEW.md)** — 先读。分层与依赖方向、硬性规则、Core 13 个模块职责、真实调用链、错误与原子性约定、CLI/GUI 双进程状态模型、启动与线程策略。
2. **[GUI.md](GUI.md)** — 进入 Qt 侧：QML / Controller / Core 边界、8 个控制器实例的职责与对应页面、`QVariantList` 数据形状、页面路由、文件监听与草稿保护、主题持久化、异步边界。
3. **[BUILD_AND_RELEASE.md](BUILD_AND_RELEASE.md)** — 落地到工具链：三个 CMake 目标、Core 独立构建、Qt/HuskarUI 依赖、CMakePresets、测试、四条 CI 工作流、安装包与发布脚本、website 与主程序的关系、第三方依赖隔离。
4. **[WEBSITE.md](WEBSITE.md)** — 前端：React Router 路由、统一导航、Console 数据流水线、静态预渲染、SEO、Cloudflare 部署与 AI 翻译 secrets。

按这个顺序读，前一篇的结论是后一篇的前提：不先确认依赖方向，就无法判断某个 Controller 该做什么；不先确认 Core 边界，就无法判断构建产物该怎样切分。

## 文档分工

| 目录 | 负责内容 | 与本目录的关系 |
| --- | --- | --- |
| `architecture/`（本目录） | 代码分层、目标边界、进程与线程模型、构建发布链路 | — |
| [reference/](../reference/CONFIG_PACKAGES_AND_MEDIA.md) | 具体机制实现：配置包暂存与媒体文件、Valve 装配与备份、包条目清单、装配工作区、边界条件清单、关于/设置与更新 | 本目录给出“在哪一层”，reference 给出“这一层怎么做” |
| [design/](../design/DESIGN_SYSTEM.md) | 视觉与交互规范：颜色、排版、间距、组件形态 | GUI 层的表现规范，不涉及代码结构 |
| [development/](../development/TESTING.md) | 开发流程与测试策略 | 本目录的构建产物如何被验证 |

## 关键结论速查

- 依赖只有一个方向：GUI/CLI → `srp_core` → 文件系统与外部资源。`srp_core` 不含 Qt、QML、CLI；CLI 与 GUI 互不依赖，也不通过 daemon/IPC 共享状态。
- 唯一跨进程共享的可变目录是包暂存区（`packageStoreRoot`），一致性靠“原子替换 + `StoreLock` + `QFileSystemWatcher`”，没有常驻服务。
- 业务函数统一返回 `ConfigWriteResult { success, changed, error }`，`error` 是 i18n 键；Core 不返回本地化句子。
- 所有配置写入都会保留 `.bak` 与最多 20 份历史；无变化不产生备份；失败保留原文件。
- 只有网络访问跨线程（`PackageController`、`AppUpdateController` 使用 `QtConcurrent` + `QFutureWatcher`）；本地文件事务在主线程同步完成。
- 页面路由用 `visible` 切换而非 `Loader`，因此切页保留编辑器内容与草稿；`about` / `settings` 已是页面。
- `website/` 是独立的 React Router 8 静态站，`/` 与 `/console` 共用统一导航和 Footer；Console 数据由 Python 流水线 + Workers AI 维护，详见 [WEBSITE.md](WEBSITE.md)。

## 事实来源与更新规则

本目录内容以源码与脚本为准，写文档时必须先读对应实现：

| 主题 | 权威来源 |
| --- | --- |
| 目标与依赖 | `CMakeLists.txt`、`src/CMakeLists.txt`、`src/*/CMakeLists.txt` |
| 构建预设 / CI | `CMakePresets.json`、`.github/workflows/*.yml` |
| Core 契约 | `src/core/include/srp/core/*.h` |
| Controller 契约 | `src/gui/src/*_controller.h`、`main.cpp` |
| 页面与路由 | `src/gui/qml/Main.qml`、`src/gui/qml/pages/` |
| 打包发布 | `installer/installer.iss`、`scripts/*.py`、`scripts/*.ps1`、`scripts/*.mjs` |
| 前端路由 / Console / SEO | `website/react-router.config.ts`、`website/src/routes.ts`、`website/scripts/console/`、`website/scripts/seo/` |

维护约定：

- 只写代码中真实存在的行为；未实现或已暂缓的能力必须显式标注“暂缓 / 未实现”，不得用设计意图代替现状。
- 修改分层规则、目标划分或发布流程时，同一提交内更新对应章节；纯实现细节变化（新增一个 `Q_INVOKABLE`）不必改本目录。
- 文档中的技术标识符（target 名、类名、信号名、i18n 键、路径）保留英文原样，叙述用中文。
- 跨目录引用使用相对链接；被引用文档改名时必须同步修正链接。
