# SrP-CFG 文档体系

本目录按四类职责组织。新文档先判断归属，再从对应分类的 `README.md` 建立入口；不要把跨领域内容堆在 `docs/` 根目录。

| 体系 | 目录 | 回答什么问题 | 入口 |
| :--- | :--- | :--- | :--- |
| **项目架构** | [`architecture/`](architecture/README.md) | 分层、依赖方向、模块职责、调用链、构建与发布 | [架构总览](architecture/OVERVIEW.md) |
| **开发规范** | [`development/`](development/README.md) | 代码怎么写、测试怎么跑、提交与评审怎么做 | [编码规范](development/CODING_STANDARDS.md) |
| **技术参考** | [`reference/`](reference/README.md) | 具体格式、命令、事务、i18n 与边界条件 | [技术参考索引](reference/README.md) |
| **设计规范** | [`design/`](design/README.md) | 视觉令牌、组件选择、交互规则、页面截图 | [设计系统](design/DESIGN_SYSTEM.md) |

## 按任务导航

| 任务 | 先读 |
| :--- | :--- |
| 新增预设 / 特性 / 模式 / 地图指南 | [`reference/CONFIG_CATALOG.md`](reference/CONFIG_CATALOG.md) |
| 修改 Core 解析、装配或文件事务 | [`architecture/OVERVIEW.md`](architecture/OVERVIEW.md) + [`reference/FILE_TRANSACTIONS.md`](reference/FILE_TRANSACTIONS.md) |
| 新增或修改 CLI 命令 | [`reference/CLI_REFERENCE.md`](reference/CLI_REFERENCE.md) + [`development/TESTING.md`](development/TESTING.md) |
| 修改 QML 页面 / 组件 / 动效 | [`design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md) + [`design/UX_GUIDELINES.md`](design/UX_GUIDELINES.md) + [`design/COMPONENTS.md`](design/COMPONENTS.md) |
| 调整配置包、视频或地图标注 | [`reference/CONFIG_PACKAGES_AND_MEDIA.md`](reference/CONFIG_PACKAGES_AND_MEDIA.md) |
| 准备发布 / 打包 / CI | [`architecture/BUILD_AND_RELEASE.md`](architecture/BUILD_AND_RELEASE.md) + [`development/WORKFLOW.md`](development/WORKFLOW.md) |
| 新增界面文案 | [`reference/I18N.md`](reference/I18N.md) |
| 了解暂未实现或已知边界 | [`reference/BOUNDARY_CONDITIONS.md`](reference/BOUNDARY_CONDITIONS.md) |

## 放置规则

- `architecture/`：稳定的结构决策、依赖规则、构建/发布拓扑。不要写具体命令清单或单页交互细节。
- `development/`：可执行的编码、测试、提交、评审规则。规则应能被检查，避免“注意质量”这类空话。
- `reference/`：格式、协议、命令、事务、i18n 等实现参考。行为变化时必须同步更新。
- `design/`：设计令牌、组件映射、交互规范、视觉资产。页面截图统一放在 `design/screenshots/`。
- 图片：界面截图使用 WebP，命名 `页面-主题.webp`；原始草图放 `design/` 根目录。截图不自动更新，UI 改动后按 [`design/screenshots/README.md`](design/screenshots/README.md) 重新生成。
- 语言：技术文档默认中文，命令、路径、标识符、错误键保留英文；面向贡献者的根目录文档保留中英双语对应文件。
- 链接：使用相对链接，提交前确认目标文件存在。

## 维护约定

- 文档与代码同一次变更提交；接口、命令、错误键、页面路由变化必须更新对应文档。
- `architecture/OVERVIEW.md` 是分层与依赖的唯一说明；`design/DESIGN_SYSTEM.md` 是视觉令牌的唯一说明；`reference/` 下的格式文档是各配置格式的唯一说明。
- 已实现的“待后续”条目从 `reference/BOUNDARY_CONDITIONS.md` 移除或改写，不要长期保留过期承诺。
- 文档本身不引入新依赖；不要为了排版引入构建工具。

## 相关入口

- 贡献流程：[`../CONTRIBUTING.md`](../CONTRIBUTING.md) / [`../CONTRIBUTING.zh-CN.md`](../CONTRIBUTING.zh-CN.md)
- 安全策略：[`../SECURITY.md`](../SECURITY.md) / [`../SECURITY.zh-CN.md`](../SECURITY.zh-CN.md)
- 项目说明：[`../README.md`](../README.md) / [`../README.zh-CN.md`](../README.zh-CN.md)
