# SrP-CFG 架构重构任务总览

> 分支：`refactor/tauri-vite-react`
> 状态：进行中（逐层执行，每层完成后勾选）

## 一、重构目标

1. **Desktop**：Electron → **Tauri v2**（Rust 后端 + React 19 前端保留），体积 100MB→~15MB，内存占用大幅下降。
2. **Website**：Astro → **Vite + React + React Router 7（SSG 预渲染）**，AI worker（`worker.ts`）**原样保留**。
3. **组件库**：以 Desktop 为组件来源（desktop-first），扩展 `@srp-cfg/ui`，Website 直接复用；Website 展示 Desktop 演示截图等素材。
4. **SEO**：文档中心 + **指令检索中心**均需静态化/预渲染优化（当前指令中心为纯客户端 fetch `commands.json`，爬虫不可见）。

## 二、已确认的架构决策

| # | 决策 | 说明 |
| :--- | :--- | :--- |
| D1 | Desktop → Tauri v2 | 前端 React 19 + Vite 保留，`window.api` 签名不变，写 IPC 适配层（renderer 66 处调用点零改动） |
| D2 | 数据目录走 Tauri 原生 | `app_data_dir()` + 首启动一次性迁移旧路径 `%APPDATA%/srp-cfg`（20 行 Rust） |
| D3 | 测试按 Rust 重构后代码编写 | Rust 单元测试（cargo-nextest）+ 重构前记录 Node 版"黄金样本"对照 |
| D4 | CI/CD 推迟到软件测试完成后再动 | 打包链（NSIS/MSI 替代 Squirrel/WiX）属于最后层 |
| D5 | 不兼容老 Windows（Win10 21H2+）| 不打包 WebView2 引导；编码一律 UTF-8 |
| D6 | Website → Vite + React + Router7 SSG | AI 保留在独立 `worker.ts`，静态产物 + worker 共存于一个 Cloudflare Worker |
| D7 | 组件共享以 Desktop 为主 | Website 消费 `@srp-cfg/ui`，演示素材（desktop-*.png）由 Website 展示 |
| D8 | 内容管线用 Velite | 替代 Astro Content Collections，schema 校验 + 类型生成 + MDX，Vite 原生 |
| D9 | 指令检索中心 SEO 化 | 由"客户端 fetch JSON"改为构建期预渲染静态 HTML（Router 7 SSG prerender） |
| D10 | 共享包边界 | 纯 UI 组件进 `@srp-cfg/ui`；平台相关（TitleBar 窗口控制等）留在 Desktop；领域组件（SteamStatusBanner 等）留桌面 |

## 三、分层依赖关系

```
Layer 0  基线（分支 + 现状快照 + 黄金样本）          ← 无依赖，先行
   │
Layer 1  共享组件库 @srp-cfg/ui 扩展               ← 依赖 L0 的组件清单
   │
Layer 2  Desktop → Tauri（骨架→后端→前端→测试）    ← 依赖 L1（前端换用共享组件）
   │
Layer 3  Website → Vite+React（骨架→内容→指令SEO→AI）← 依赖 L1（组件复用）
   │
Layer 4  CI/CD 与发布（website CI + tauri build + 打包链）← 依赖 L2/L3 测试完成
```

> 注：L2 与 L3 可并行推进，但共享组件必须先于两者落地（L1 前置）。

## 四、执行规则

1. 严格按层顺序执行；每层内任务自上而下逐个完成，完成后勾选 `[x]`。
2. 每层执行完，跑对应验证（构建/测试）通过后，再进入下一层。
3. 遇到与决策冲突的情况，先更新本文件决策表，再动手。
4. 每层 TASK.md 中的"验收标准"必须满足。

## 五、状态看板

| 层 | 状态 | 备注 |
| :--- | :--- | :--- |
| [Layer 0](./layer-0-baseline/TASK.md) | ✅ 完成 | 分支 ✓ 构建基线 ✓ 契约/清单 3 份 ✓ |
| [Layer 1](./layer-1-shared-ui/TASK.md) | 🔄 进行中 | 9 组件已抽，Desktop 已接入 2 处，构建/类型检查通过 |
| [Layer 2](./layer-2-desktop-tauri/TASK.md) | ⬜ 未开始 | |
| [Layer 3](./layer-3-website-react/TASK.md) | ⬜ 未开始 | |
| [Layer 4](./layer-4-ci-release/TASK.md) | ⬜ 未开始 | |
