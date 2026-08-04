# TitleBar 物理拖拽 OS 循环验收 —— 人工测试规范

> 状态：⏳ **待人工执行**（2026-08-04 晚由 agent 自动模拟失败后移交人工；机制链路已确认，见下）
> 分支：`refactor/tauri-vite-react` ｜ 涉及修复（已提交，勿回退）：`27f8f9d`（drag-region 属性）、`418c2d4`（ACL）
> 复现产物：`C:\Users\Rolin\srp-cfg-build\app\desktop\src-tauri\target\release\srp-cfg-desktop.exe`（含全部修复）

## 一、验收目标

验证标题栏**物理鼠标拖拽**移动窗口的完整 OS 循环：

1. 左键按住标题栏左侧空白区域 → 拖动 → 窗口跟随移动 → 松手窗口停在新位置
2. 拖动时窗口不被"吸回"、不闪断、松手后不弹跳
3. 标题栏右侧三个按钮（最小化/最大化/关闭）区域**不可拖拽**、点击功能正常（不被拖拽逻辑吞掉）

## 二、机制链路（已确认，无需改动代码）

- Tauri v2 只认 `data-tauri-drag-region` 属性（`-webkit-app-region` 是 Electron 机制，无效）
- `app/desktop/src/renderer/components/TitleBar.tsx`：左侧 `flex-1 h-full` 容器带
  `data-tauri-drag-region="deep"`（= 子树可拖，按钮自动阻断）；右侧三按钮是**兄弟节点**，
  不在 drag 容器内，天然不可拖
- 命中拖拽区域后，Tauri 内置 drag 处理（drag.js：`e.button===0 && (e.detail===1||2)`）→
  invoke `plugin:window|start_dragging` → 操作系统接管拖拽循环
- ACL 已配：`app/desktop/src-tauri/capabilities/default.json` 含
  `core:window:allow-start-dragging`（`core:window:default` 不含它，缺了 invoke 被拒
  "not allowed by ACL"——418c2d4 已修）
- 窗口：`decorations:false`（无系统边框），标题栏高 40px（`h-10`）

## 三、环境准备（重要：当前屏幕上有两个全屏窗口会盖住应用）

1. **QuarkCloudDrive（夸克网盘）窗口**（class=FLUTTER_RUNNER_WIN32_WINDOW，常驻
   52,35-2513,1370 全屏，正在播视频）——**先最小化**，否则它抢前台、盖住应用
2. **Windows Terminal**（class=CASCADIA_HOSTING_WINDOW_CLASS，全屏 -8,-8-2568,1448，
   即运行开发会话的终端）——**最小化或移到旁边**，避免挡住应用窗口
3. 启动应用：双击运行 `C:\Users\Rolin\srp-cfg-build\run-release.bat`
   （或直接运行 `srp-cfg-desktop.exe`；若已运行先关闭旧实例）
4. 确认应用窗口在前台（点击任务栏图标或 Alt+Tab 切过去）

## 四、操作步骤

### 测试 1：正常拖拽移动

1. 把鼠标移到应用标题栏左侧空白处（例如窗口 `Left+400, Top+15`，避开右侧按钮区）
2. **按住左键** → 拖动到新位置（如向右下移动 200×100）→ **松开左键**
3. 目视确认：窗口跟随光标移动、松手停在目标位置

### 测试 2：按钮区不可拖

1. 鼠标移到右上角「最小化」/「最大化」/「关闭」任一按钮上
2. 按住左键拖动——**窗口不应移动**；松开后点击该按钮，功能应正常
   （最小化→任务栏、最大化→全屏、关闭→进程退出）

### 测试 3：最大化状态下的拖拽（可选）

1. 先最大化窗口
2. 按住标题栏拖动——窗口**不应**跟随移动（最大化窗口不参与拖拽，属正常）

## 五、结果判定（硬性标准）

| 项目 | 通过标准 | 验证方式 |
| :--- | :--- | :--- |
| 拖拽移动 | 窗口 Rect 跟随位移改变，松手后位置保持 | 目视 + 可选 PowerShell `GetWindowRect`（见下） |
| 按钮区不可拖 | 按住按钮拖动窗口不动 | 目视 |
| 按钮功能 | 最小化/最大化/关闭全部正常 | 目视（关闭后任务管理器确认进程退出） |
| 无 ACL 报错 | 拖拽时开发者工具/控制台无 "not allowed by ACL" | 无（拖拽成功即证明 ACL 通） |

### 可选：命令行核对窗口位置

```powershell
# 窗口位置（L/T/R/B）与 iconic/zoomed 状态
powershell -ExecutionPolicy Bypass -File C:\Users\Rolin\srp-cfg-build\winctl.ps1 -Action rect
# 拖前记一次，拖后（鼠标离开窗口）再记一次，Rect 应变化
```

## 六、agent 自动模拟尝试的记录（2026-08-04 晚，结论：环境受限，移交人工）

- 已用 `mouse_event` 合成左键按下→移动→松开（`winctl.ps1 -Action move`）在标题栏
  （1287,258）执行一次，**窗口 Rect 未变化**（L=426 T=240 保持不动）
- 排查结论：合成输入未触发 WebView2/Tauri 的拖拽捕获（可能原因：合成事件缺少真实
  OS 输入上下文、或前台切换竞态）；**物理鼠标测试是权威判定**，本次自动尝试结果
  **不作为失败依据**，仅记录
- 另发现：此前文档记载的"FLUTTERVIEW 终端遮挡"实为 **QuarkCloudDrive 播放器窗口**
  （FLUTTER_RUNNER_WIN32_WINDOW），并非开发终端——已据此更新环境准备说明

## 七、执行后回报

勾选第五节的判定表，并回报一句结论（如："拖拽移动正常，按钮区不可拖、三按钮功能正常，
无 ACL 报错"）。agent 收到后将其记录进 `tasks/PROGRESS.md` 并勾选该项遗留。
