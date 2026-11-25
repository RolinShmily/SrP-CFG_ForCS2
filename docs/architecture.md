# 架构总览

SrP-CFG 采用**内容包仓库 + C++17 核心引擎 + Qt Quick 桌面工作台**的三段式结构，并配套独立的官网与 CS2 `/console` 指令查询站。

## 1. 目录与分层契约

```text
SrP-CFG_ForCS2/
├── content/               独立版本化的游戏内容包（srp-cfg、video、annotations、srp-cfg-csgo）
├── src/
│   ├── core/              纯 C++17 静态库 srp_core（探测、解析、暂存库、原子备份；零 Qt 依赖）
│   └── gui/               Windows 桌面工作台（Qt 6 Quick + HuskarUI + QWindowKit）
├── tests/
│   ├── core/              C++ 单元与集成测试（CTest，跨 Windows / Linux）
│   ├── gui/               便携包离体启动与渲染冒烟脚本（PowerShell）
│   └── content/           内容包清单、哈希与 ZIP 结构校验
├── scripts/               仓库校验、内容打包、Changelog 提取、漂移检测与本地启动脚本
├── installer/             Windows Inno Setup 安装器脚本
├── worker/                Cloudflare Worker 入口（/releases/* 流式透传 GitHub Releases）
└── website/               官网下载中心与 /console CS2 指令百科（React Router 8 静态预渲染）
```

核心依赖约束：
1. **单向依赖**：`src/core` 严禁引入任何 Qt / QML 头文件，必须支持通过 `cmake -S src/core` 独立编译与测试。
2. **UI 薄层原则**：QML 仅负责视图渲染与交互，不做文件系统 IO 或配置格式解析；所有写入操作统一经 `srp::core` 的事务接口执行。
3. **服务端隔离**：`cfg.srprolin.com` 通过 `wrangler.toml` 同时托管静态前端/内容包（`[assets]`）与 `/releases/*` Worker 代理（`run_worker_first = ["/releases/*"]`），客户端仅与该单一域名交互。

## 2. 四层 CFG 执行模型

`content/srp-cfg` 通过显式分层将引擎运行时逻辑与玩家个人偏好隔离，避免与 Steam Cloud VCFG 冲突：

```text
CS2 启动
  ↓ 加载 Steam Cloud VCFG（游戏原生持久化状态）
  ↓ 执行 autoexec.cfg（非侵入式挂载）
  ↓ Layer 1: Valve 基线 / 社区预设（可选起点，可完整卸载）
  ↓ Layer 2: 特性模块（AutoView / Crosshair-View / Knife / Zeus，按需独立装配）
  ↓ Layer 3: 模式入口（Practice / Preview / Demo / GuideMake / PWA-Prac，绑定按键按需触发，启动不直接执行）
  ↓ Layer 4: user/custom.cfg（最高优先级个人覆盖层，物理隔离、绝不覆盖）
```

## 3. 暂存库与原子文件事务

- **三层暂存库**（默认 `%LOCALAPPDATA%/SrP-CFG/packages/generations/<stamp>/`）：
  - `original/`：来自随附 `content/` 或线上更新的只读原始基线；
  - `work/`：用户可在界面中微调的工作副本；
  - `base/` 与 `base-version/`：记录每个文件修改所基于的原始版本。
- **更新保留策略**：内容包在线更新时原子发布新 generation；未修改过的 `work/` 文件自动跟进新版，用户改过的文件保持原样并标记 `outdated`，且**绝不自动改写 CS2 游戏目录**。
- **写盘保护**：所有面向用户目录的写入统一走 `writeConfigWithBackup` / `removeConfigWithBackup`，写入前保留最多 20 份去重 `.bak` 历史快照，采用同目录临时文件原子替换并在失败时回滚；`cs2_video.txt` 写入前检测 CS2 进程，运行中拒绝覆盖。

## 4. 官网、Worker 分发接口与 `/console` 数据管线

- **静态托管与内容分发**：`website/` 使用 React 19 + React Router 8（`ssr: false` + 构建期预渲染 + Pagefind 分片索引）输出静态产物到 `website/build/client`；`deploy.yml` 调用 `scripts/package_content.py` 生成 `packages/manifest.json`（同时保留 `packages.json` 兼容别名）与内容寻址 ZIP 随 Worker 统一部署至 `cfg.srprolin.com`。
- **软件分发代理（`worker/index.ts`）**：`run_worker_first = ["/releases/*"]` 仅将 `/releases/latest.json` 与 `/releases/download/<tag>/<file>` 交由 Worker 严格白名单校验并流式透传 GitHub Releases（绕开 25 MiB 静态资源上限且保证字节级 SHA-256 一致）；其余静态路径与 `/packages/*` 直接走 Cloudflare Assets 零开销分发。
- **`/console` 指令中心模块**：与官网共享统一设计系统的 CS2 ConVar / Command 参考站。上游事实数据每日通过 `update.yml` 从 `SteamDatabase/GameTracking-CS2` 同步，使用 Cloudflare Workers AI 增量翻译，经校验后在构建期生成 Pagefind 搜索分片与预渲染页面。
