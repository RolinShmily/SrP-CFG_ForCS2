# SrP-CFG 边界条件与待后续实现清单 (Boundary Conditions & Future Milestones)

本文档记录在实现 9 个核心页面草图初稿时梳理出的边界条件、假定约束及后续阶段性演进目标。

---

## 1. 页面 1：Overview 总览
- **边界条件**：
  - 用户无 Steam 本地登录记录或本地多账号时，优先按 `Timestamp` 探测活跃账号；若均未识别，退化为提示引导。
  - 用户头像若无网络或 Steam 未缓存，直接退化为账号名称首字母圆形徽章或内置占位矢量图标。
- **待后续实现**：
  - 接入 Steam Web API（可选配置 API Key）用于在线拉取最新头像与昵称；
  - 启动游戏时支持自定义启动项（Launch Options）。

---

## 2. 页面 2：CFG 预设包 (Presets)
- **边界条件**：
  - `custom.cfg` 可能已被用户手工修改或包含语法冲突字段；初稿装配时采用“追加/注释标记块”模式（如 `// BEGIN srp-preset: default`），避免覆盖用户个人私有配置。
  - 预设导入时若格式不合规，先做语法校验与备份。
- **待后续实现**：
  - 支持从网络或 ZIP 压缩包一键导入第三方预设包；
  - 预设包冲突检测器（检测不同预设间 keybind 冲突）。

---

## 3. 页面 3 & 4 & 5：自由装配 (ValveBaseline, Features, Modes)
- **统一工作区已落实**：见 [ASSEMBLY_WORKSPACE.md](ASSEMBLY_WORKSPACE.md)。Valve、特性、模式、用户配置组成连续左侧内容，最右侧滚动条控制左侧，右侧编辑器固定。特性直接装配，模式配置启动键；不在启动时直接执行模式。Valve 细则见 [VALVE_ASSEMBLY.md](VALVE_ASSEMBLY.md)。
- **边界条件**：
  - 各特性/模式在 `custom.cfg` 中生效依赖于执行链 (`exec`)。装配与卸载需要原子性修改 `custom.cfg`。
  - 特性或模式的 `keymap.cfg` 可能会互相覆盖按键；初稿状态提供装配状态查询与装配/卸载命令。
- **待后续实现**：
  - 键位可视化热力图（键盘按键冲突高亮）；
  - 模式联动启动参数（例如 HLAE 自动唤起相关 hook 动态库）。

---

## 4. 页面 6：user/custom.cfg (全宽代码编辑器)
- **边界条件**：
  - 大文件加载与保存时的编码处理（UTF-8，保留原文件 BOM 和换行格式）；
  - 每次保存自动建立 `.bak` 副本，防止用户手滑清空配置。
- **待后续实现**：
  - 完整的 Source Engine CFG / VCFG 语法高亮分词器（基于 QSyntaxHighlighter / QML TextEdit 增强）；
  - 自动补全 Convars 与别名（通过 core 扫描出的 runtime aliases 提供）。

---

## 5. 页面 7：cs2_video.txt 视频设置
- **边界条件**：
  - CS2 显卡驱动与不同分辨率配置存在硬件差异（如 `setting.gpu_mem_level`）；直接拷贝不同机型的 `cs2_video.txt` 可能导致游戏闪退。
  - 初稿提供键值对解析与当前用户的读写应用，提供备份机制。
- **待后续实现**：
  - 自动保留用户的硬件特定键（如 `VendorID`, `DeviceID`），仅替换画质与渲染关键字段；
  - 提供职业选手预设（如 S1mple / Donk 画质配置）。

---

## 6. 页面 8：annotations 地图标注
- **边界条件**：
  - 游戏目录可能只读或受权限保护，目标路径为 `game/csgo/annotations/local/mapguide/<mapname>.txt`。
  - 首次安装需自动创建 `annotations/local/mapguide` 目录。
- **待后续实现**：
  - 地图点位图文预览与点位快速查找；
  - 支持多套地图点位包并存与快速切换。

---

## 7. 页面 9：弹框 (关于与设置)
- **边界条件**：
  - 字体切换需读取系统已安装字体族列表，若无则回退系统默认；
  - 语言切换需同时影响 GUI 文本与 CLI 输出。
- **待后续实现**：
  - 远程 GitHub Release 自动检查更新与静默升级包下载；
  - 自定义主题色与深色模式定时自动切换。
