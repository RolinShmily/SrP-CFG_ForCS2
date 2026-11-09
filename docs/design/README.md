# 设计规范 (Design)

本目录是 SrP-CFG 客户端界面视觉与交互的唯一设计基准，服务于 `src/gui/qml/` 的 HuskarUI / QML 实现。视觉令牌以 [`src/gui/qml/MetaTheme.qml`](../../src/gui/qml/MetaTheme.qml) 为唯一事实来源，本文档只做说明与约束，不引入第二套取值。

## 1. 文档索引

| 文档 | 回答什么问题 | 什么时候必须改 |
| :--- | :--- | :--- |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | 设计哲学、颜色/圆角/字号令牌、层级表达策略、动效与主题持久化 | `MetaTheme.qml` 增删令牌或改值、主题机制变化 |
| [UX_GUIDELINES.md](UX_GUIDELINES.md) | 交互规则：确认弹窗、快捷键、键盘可达性、反馈、路由与选中、空/禁用态、i18n、窗口约束 | 页面行为、快捷键、路由名、反馈通道变化 |
| [COMPONENTS.md](COMPONENTS.md) | HuskarUI-first 组件映射、自定义组件的职责边界、`objectName` / `Accessible` 约定 | 新增/替换组件、`objectName` 改名、无障碍属性调整 |
| [screenshots/README.md](screenshots/README.md) | 截图清单、生成命令、更新流程 | 增删截图或抓图参数变化 |

## 2. 截图索引

全部截图位于 [`screenshots/`](screenshots/)，WebP 格式，命名为 `页面-主题.webp`。截图是当前实现的记录，不是设计目标图。

| 文件 | 页面（路由） | 主题 | 尺寸 |
| :--- | :--- | :--- | :--- |
| [overview-light.webp](screenshots/overview-light.webp) | 总览（`overview`） | 浅色 | 1160 × 751 |
| [overview-dark.webp](screenshots/overview-dark.webp) | 总览（`overview`） | 深色 | 1160 × 751 |
| [presets-light.webp](screenshots/presets-light.webp) | CFG 预设包（`presets`） | 浅色 | 1160 × 751 |
| [assembly-light.webp](screenshots/assembly-light.webp) | CFG 自由装配（`assembly_baseline`） | 浅色 | 1160 × 751 |
| [video-light.webp](screenshots/video-light.webp) | 视频设置（`video_settings`） | 浅色 | 1160 × 751 |
| [annotations-light.webp](screenshots/annotations-light.webp) | 地图标注（`map_guides`） | 浅色 | 1160 × 751 |
| [about-light.webp](screenshots/about-light.webp) | 关于（`about`） | 浅色 | 1160 × 751 |
| [settings-light.webp](screenshots/settings-light.webp) | 设置（`settings`） | 浅色 | 1160 × 751 |
| [settings-dark.webp](screenshots/settings-dark.webp) | 设置（`settings`） | 深色 | 1160 × 751 |
| [settings-980x640.webp](screenshots/settings-980x640.webp) | 设置（`settings`） | 浅色 | 980 × 640（最小窗口） |

生成方式与注意事项见 [screenshots/README.md](screenshots/README.md)。官网用的另一套截图（按语言区分）位于 `website/public/app/`，与本目录的按主题区分截图互不替代。

## 3. 原始草图

[drag-draw.png](drag-draw.png) 是 RoL1n_SrP 提供的原始界面草图，尺寸 5482 × 3235，按原始文件保留，未缩放、未重新压缩。

它记录的是设计起点：总览、预设、装配、视频设置、地图标注、关于与设置的初版分区与信息层级。草图里的弹窗式“关于/设置”等形态在当前实现中已被路由页面取代，构图与控件细节也应视为历史参考——任何冲突以当前代码与本目录的行为文档为准。

## 4. 实现落点

设计规则对应的代码入口，改规则前先读这些文件：

| 文件 | 承载的设计内容 |
| :--- | :--- |
| `src/gui/qml/MetaTheme.qml` | 全部颜色、圆角令牌；主题自适应取色 |
| `src/gui/qml/Main.qml` | 窗口尺寸与最小尺寸、标题栏定制、反馈宿主、页面路由切换、侧边栏边缘阴影 |
| `src/gui/qml/components/AppSidebar.qml` | 导航结构、选中/悬停/焦点态、底部运行状态卡 |
| `src/gui/qml/components/AppButton.qml` | 按钮三态配色与圆角映射 |
| `src/gui/qml/components/AppModal.qml` | 二次确认弹窗形态 |
| `src/gui/qml/components/AppCodeEditor.qml` | 编辑器视口、行号槽、缩放入口 |
| `src/gui/qml/pages/*.qml` | 各页面的布局、空/禁用态与文案键 |
| `src/core/src/i18n.cpp` | 中英文案键表 |

## 5. 维护约定

- 视觉取值只在 `MetaTheme.qml` 定义；文档表格里的十六进制值必须与它逐项一致，改值改文档同一次提交完成。
- 交互规则只写在 `UX_GUIDELINES.md`，组件选型只写在 `COMPONENTS.md`，避免同一规则散落三处。
- 截图不自动更新：UI 改动后在本地重新抓图并覆盖对应文件，不保留旧图；不要为了“看起来好看”手改截图像素。
- 不要记录未实现的组件、令牌或交互。已废弃的描述直接删除或改写，不做“将来会支持”的承诺。
- 文档全部中文；令牌名、组件名、路由名、快捷键、`objectName` 保留英文原样。

## 相关入口

- 文档体系总览：[`../README.md`](../README.md)
- 分层与依赖：[`../architecture/OVERVIEW.md`](../architecture/OVERVIEW.md)
- 关于/设置与软件更新行为：[`../reference/APP_DIALOGS_AND_UPDATES.md`](../reference/APP_DIALOGS_AND_UPDATES.md)
- 配置包与媒体资源：[`../reference/CONFIG_PACKAGES_AND_MEDIA.md`](../reference/CONFIG_PACKAGES_AND_MEDIA.md)
- 自由装配工作区：[`../reference/ASSEMBLY_WORKSPACE.md`](../reference/ASSEMBLY_WORKSPACE.md)
