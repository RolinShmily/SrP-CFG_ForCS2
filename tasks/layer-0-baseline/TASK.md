# Layer 0 — 基线（准备与现状快照）

> 目标：建立可回滚的分支基线，记录当前系统的可测试事实（组件清单、API 契约、数据规模、构建方式），为后续各层提供对照依据。

## 任务

- [x] **0.1 创建重构分支**
  - 分支名：`refactor/tauri-vite-react`（已创建，基于 main）
  - 约定：所有重构提交都在该分支上进行，逐层提交，每层一个或一组提交。

- [x] **0.2 构建基线验证**
  - 确认当前 `main` 上 website 与 desktop 均可构建（记录命令与产物）。
  - Website：`pnpm build:web` → `app/website/dist/`（✅ 21 页，3.1MB，2026-08-04 通过）
  - Desktop：`pnpm build:desktop`（electron-forge package）→ 确认可打包（⚠️ WSL 环境受限，见验证记录）
  - 产出：本文件下方"基线验证记录"。

- [x] **0.3 组件清单（供 L1 抽取决策）**
  - 盘点 `app/desktop/src/renderer/components/*.tsx`（20 个组件），按三档归类：
    - A 档：纯 UI 无业务依赖 → 抽入 `@srp-cfg/ui`
    - B 档：领域相关但样式可复用 → 抽核心样式/结构，业务留桌面
    - C 档：平台相关（窗口控制/Steam 检测）→ 留桌面
  - 盘点 website 的 `.astro` 组件（16 个），标记哪些需要 React 化（L3 用）。
  - 产出：✅ `layer-1-shared-ui/component-inventory.md`

- [x] **0.4 Desktop API 契约文档**
  - 从 `app/desktop/src/preload/preload.ts`（124 行，40+ 方法）提取完整 API 签名清单。
  - 从 `app/desktop/src/renderer/types.ts` 提取共享类型。
  - 用途：L2 的 Tauri IPC 适配层必须保持这些签名不变。
  - 产出：✅ `layer-2-desktop-tauri/api-contract.md`

- [x] **0.5 Website 接口契约文档**
  - 记录 `worker.ts` 的 `/api/chat` 请求/响应格式（含 SSE 事件流格式，见 `src/lib/ai-stream.ts`）。
  - 记录 Turnstile 集成方式（site key 注入、token 流程）。
  - 记录 `commands.json` 数据规模（当前 984KB / 2785 条）与记录结构。
  - 用途：L3 保留 AI、指令中心预渲染时对照。
  - 产出：✅ `layer-3-website-react/api-contract.md`

- [ ] **0.6 黄金样本记录**
  - 记录 Desktop 关键业务路径的验收清单（供 L2 Rust 重写后逐条对照）：
    1. Steam 路径检测（注册表读取）
    2. VCFG 解析与快照生成
    3. 上传/下载包 staging（zip 解压、目录归类）
    4. overlay/append 两种安装模式
    5. 冲突检测与 res.json 恢复
    6. save.json 备份/恢复
  - 无法在 CI 无头环境执行 GUI 的，以"手动验收清单"形式记录。
  - 产出：`layer-2-desktop-tauri/golden-checklist.md`。

## 验收标准

- [ ] 分支存在且工作区干净
- [ ] website 构建通过
- [ ] desktop 构建通过（若环境受限，记录阻塞原因）
- [ ] 3 份契约/清单文档落盘（组件清单、API 契约、黄金样本）

## 基线验证记录

### 环境
- WSL（Ubuntu 于 Windows）+ Node v24.18.0 + pnpm 10.11.0
- npm 官方源存在 CERT_HAS_EXPIRED / ECONNRESET 不稳定问题 → 使用 `--registry=https://registry.npmmirror.com` 安装成功

### Website 基线（✅ 通过）
- `pnpm install --filter @srp-cfg/website... --registry=https://registry.npmmirror.com` → 成功
- `pnpm build:web` → 21 页构建完成，`app/website/dist/` 3.1MB，耗时 ~8s
- 图片优化（desktop-*.png → webp）正常
- commands.json 数据规模确认：2785 条 / 8 分类 / 984KB（var 2096, cmd 689）

### Desktop 基线（⚠️ 环境受限）
- WSL 下 electron-forge package 目标产物为 win32（MakerSquirrel/MakerZIP win32），跨平台打包需 Wine 且 electron 二进制下载量大
- 判定：**不在本环境执行**，桌面基线验收移交 L2 阶段（迁移完成后以 Rust 测试 + 手动验收代替）
