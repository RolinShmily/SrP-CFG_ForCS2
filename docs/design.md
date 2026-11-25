# 设计思路与架构权衡

## 1. 为什么收束为「`content/` 内容包 + 单一 Qt 桌面工作台」

早期仓库同时维护过桌面端、独立 CLI（`srpcfg`）与 Agent Skill，但 CS2 配置管理的核心用户场景是**可视化浏览、安全装配与所见即所得微调**，绝大多数玩家既不会在终端拼参数，也不需要通过 Agent 间接改本地 CFG。同时保留多入口不仅拉宽了发布包与安装器（注册表 `PATH`、额外 ZIP）的维护面，也让核心定位失焦。

因此项目明确收束为**内容资产（`content/`）+ 桌面端包管理/编辑工作台（`src/core` + `src/gui`）**：
- `src/core` 仍保持纯 C++17、无 Qt 依赖，靠 `tests/core` 的 CTest 在双平台直接验证逻辑正确性；
- `src/gui` 成为唯一的终端产品界面，所有交互、备份和冲突确认都在一处演进。

## 2. 为什么坚持纯原生 CFG 与可逆四层装配

网传单体“大包 CFG”最常见的痛点是直接覆盖玩家的灵敏度、键位甚至污染 Steam Cloud VCFG，事后难以回退。SrP-CFG 选择把每一类职责拆开：
- **零注入、零内存修改**：全部能力依赖 CS2 原生 `+exec`、`.cfg`、KV3 标注和 `cs2_video.txt`，跟随引擎原生机制运行；
- **模式延迟触发**：练习、检视、Demo 等会改动大量游戏变量的模式只绑定启动键，不直接写进开机自启链，避免排位误触；
- **`user/custom.cfg` 永久隔离**：运行时脚本与自动装配绝不破坏个人自定义区，卸载 SrP-CFG 时保留备份。

## 3. 为什么内置包管理器与 `Original / Work` 暂存区

CS2 玩家实际会高频维护三类原生文件（CFG、画面配置、地图标点），它们的更新节奏往往快于软件本体。桌面端内置 `Original / Work / Base` 暂存模型：
- **离线即用**：安装包与便携包均内置最新 `content/`，断网也能完整初始化和装配；
- **热更不丢改动**：上游推送新标点或新预设后，暂存库只更新未改动模板，已微调的工作副本原样保护；
- **统一分发入口**：GitHub Releases 仅作为软件二进制（`gui.zip`、`setup.exe`、`latest.json`）的大源头，不重复塞入 `content/` 归档；`cfg.srprolin.com` 通过静态 Assets 提供 `/packages/*`，通过 `worker/index.ts` 流式反代 `/releases/*`，桌面端与官网均只需访问同一域名且字节级 SHA-256 严格一致。

## 4. 为什么在官网提供 `/console` 作为附加能力

玩家在 `user/custom.cfg` 中自定义参数时，最常遇到的问题是查不到 CS2 ConVar / Command 的真实含义、默认值和标记（如 `cheat`、`archive`）。`/console` 将 `SteamDatabase/GameTracking-CS2` 上游数据加工成可搜索、带中文说明和可复制片段的在线词典，与桌面端形成互补：
- 工程上完全隔离在 `website/` 内部，不影响 `src/` 编译与发版；
- 统一通过 `test.yml` 校验数据契约、通过 `update.yml` 维护上游数据新鲜度。

## 5. 为什么 `src/core` 严禁依赖 Qt

将路径探测、VCFG/KV3/video 解析、包校验与备份事务留在纯 C++17 静态库中：
- 测试无需 Qt 运行时即可在 Linux / Windows CI 中秒级跑完；
- 界面层（Qt Quick / HuskarUI）即使大幅改版或重构，核心文件安全保证与回归测试都不受影响。
