# 交互规范 (UX Guidelines)

> 本文档描述 SrP-CFG 客户端真实生效的交互规则。视觉取值见 [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)，组件选型见 [COMPONENTS.md](COMPONENTS.md)。规则与代码冲突时以代码为准，并立即修正本文档。

---

## 1. 基本原则

- **可预期**：同一个动作在任何页面表现一致；按钮文案描述结果（“清空按键绑定”），不写“确定”“处理”。
- **可撤销或先确认**：不可逆动作必须先弹确认，并在描述里写清影响范围与保留物（如 `.bak` 备份）。
- **不抢焦点**：后台任务（检查更新、检测路径）只在原位更新状态，不弹窗、不抢焦点、不阻塞页面。
- **键盘可达**：所有可点击元素都能用 Tab 到达、用 Enter/Space 激活，并有可见焦点框。
- **安静**：动效与提示都克制；没有装饰性动画，没有重复 toast。

---

## 2. 破坏性操作二次确认

统一用 `AppModal`（`HusModal` 封装）`openWarning()`，确认键是 `HusButton.Type_Primary`，取消键为默认样式；描述文案必须包含对象或路径。

| 动作 | 入口 | 确认要点 |
| :--- | :--- | :--- |
| 重置 Valve 基线 | 总览 Hero “重置 Valve 基线” | 未安装 SrP-CFG 时先走安装引导弹窗，不直接重置 |
| 安装并重置环境 | 总览环境引导 / 装配页 | 明确会覆盖 Valve 目录配置 |
| 清空 Convars（VCFG） | 总览“移除全部” | 声明不可撤销、仅保留 `.bak` |
| 清空按键绑定 | 总览“移除按键” | 声明不可撤销、仅保留 `.bak` |
| 替换/装配预设 | 装配页 | 描述包含预设名与将被写入的条目数 |
| 按键冲突覆盖 | 装配页绑定弹窗 | 描述旧绑定来源与新手势命令 |
| 复位当前文件 | 装配页 / 媒体编辑面板 | 描述目标文件显示路径 |
| 应用视频配置 | 视频设置 | 描述目标账号 |
| 卸载地图标注 | 地图标注 | 描述将移除的指南集合 |

不安全动作的按钮使用危险悬停态（红/琥珀底 + `statusCritical` / `statusWarning` 文字），但不使用红色实底。打开文件夹、重新检测、复制命令、保存、切换账号等可再生动作**不做**二次确认——过度确认会让用户对弹窗脱敏。

---

## 3. 反馈：只用 HusMessage 通道

- 唯一的轻量反馈通道是 `AppFeedback` 单例，转发到 `Main.qml` 标题栏下方的 `HusMessage`（`objectName: "appFeedbackHost"`，`z: 999`，宽度跟随窗口）。
- 控制器通过 `messageNotify(success, message)` 信号上报结果，`Main.qml` 的 `Connections` 统一转成 `AppFeedback.success()` / `AppFeedback.error()`；`AppFeedback` 在宿主未创建时静默丢弃，不得抛错。
- 页面内点击类即时反馈（如“已复制”）可以直接调用 `AppFeedback.success(page.t("valve.copied"))`。
- 禁止在页面里自建第二套 toast/气泡；也禁止用 `messageNotify` 报告“正在执行”这类过程状态——过程状态用按钮 `loading` 或原位文字。

---

## 4. 快捷键

| 快捷键 | 生效范围 | 启用条件 | 行为 |
| :--- | :--- | :--- | :--- |
| `Ctrl+S` | 预设页、装配页、视频/标注媒体编辑面板、设置页 | 页面可见且存在未保存修改（装配还需 `canSave`） | 调用对应控制器的保存方法 |
| `Ctrl+=` / `Ctrl++` | `AppCodeEditor` | 编辑器可见且 enabled | 增大字号（上限 28） |
| `Ctrl+-` | `AppCodeEditor` | 同上 | 减小字号（下限 9） |
| `Ctrl+0` | `AppCodeEditor` | 同上 | 复位到默认 12px |

- 快捷键必须带 `enabled` 条件，避免跨页串扰：不可见页面的 `Ctrl+S` 不得触发保存。
- 编辑器缩放的 100% 徽标可点击复位，与 `Ctrl+0` 等价。
- 新增快捷键前先在上面表格登记；不要占用系统级组合键。

---

## 5. 键盘可访问性与焦点

- 侧边栏一级导航、二级导航、装配组头均为 `Accessible.role: Accessible.Button` + `Accessible.name`（当前语言标签）+ `Accessible.focusable: true` + `Accessible.onPressAction`。
- `Keys.onPressed` 处理 `Qt.Key_Return` / `Qt.Key_Enter` / `Qt.Key_Space` 并 `event.accepted = true`；鼠标点击时先 `forceActiveFocus()` 再执行动作。
- 焦点可见性是硬要求：`activeFocus` 时显示 1px `primaryColor` 描边层，不能用“无描边”追求极简。
- Tab 顺序按视觉顺序：主导航自上而下 → 装配子项（展开时）→ 视频/标注 → 底部“关于”“设置”固定列尾。折叠的装配组不进入焦点循环。
- 图标按钮与被截断文本必须有替代表述：`contentDescription`（HuskarUI 组件）或 `HusToolTip`；侧边栏标签 `truncated` 时自动挂 ToolTip。

---

## 6. 输入与路径字段

- 只读路径统一：`readOnly: true` + `selectByMouse: true` + `onTextChanged: cursorPosition = 0`。光标强制回到起点，让用户先看到盘符（`C:\` / `D:\`）而不是路径尾部。
- 空路径不显示空白：用 i18n 文案占位（“尚未检测到 Steam 路径”等），并用 `HusToolTip` 提供完整值。
- 路径只能通过“更改”（`FolderDialog`）或“重新检测”更新，**不提供手工键入**；也不提供“恢复默认路径”。暂存库路径仅只读展示 + 打开文件夹。
- 检测类操作要立刻给出进行中反馈：按钮切换为“检测中…”并 `loading: true`，配合约 650ms 的结束计时器复位，避免重复点击。

---

## 7. 空状态、禁用态与危险态

- **空状态**：说明缺什么、去哪里补。例：路径缺失显示 missing 文案；地图标注目标未定位时显示 `statusWarning` 色的 `annotations.no_target` 提示。
- **禁用态**：`enabled` 由业务前置条件组合而成，典型为 `!PackageController.busy && 业务条件`。禁用时文字用 `textDisabled`、默认按钮底色退到 `surfaceSoft`、边框透明；**不要**只调低透明度却保留点击。需要解释原因时在 ToolTip 里写清。
- **危险态**：危险按钮默认仍是中性外观，仅在悬停时转为危险配色；常驻危险色会让界面失去层次。
- 空集合不渲染“空卡片骨架”：宁可少一块，也不要显示 0 与空列表。

---

## 8. 页面路由与侧边栏选中

路由名即状态，唯一位于 `AppSidebar.activeRoute`：

| 路由 | 页面文件 | 说明 |
| :--- | :--- | :--- |
| `overview` | `pages/OverviewPage.qml` | 总览、环境检测、运行时卡片 |
| `presets` | `pages/PresetsPage.qml` | 预设包与 CFG 编辑 |
| `assembly_baseline` / `assembly_features` / `assembly_modes` / `assembly_usercfg` | `pages/AssemblyPage.qml` | 同一页面的四个分区 |
| `video_settings` | `pages/VideoPage.qml` | 视频配置 |
| `map_guides` | `pages/AnnotationsPage.qml` | 地图标注 |
| `about` | `pages/AboutPage.qml` | 关于 |
| `settings` | `pages/SettingsPage.qml` | 设置 |

- 页面切换是**同一内容容器内**的 `visible` 绑定（`Main.qml` 右侧 `Item` 内并排七个页面），不是 StackView、不是弹窗、不销毁页面状态。因此“关于/设置”不是模态层，没有“关闭弹窗”语义，滚动位置与草稿随页面存活。
- 自由装配是单页四分区：侧边栏子项通过 `AssemblyPage.navigateTo(route)` 滚动定位分区，`sectionChanged` 与滚动位置跟踪把当前分区回写 `sidebar.activeRoute`，双向保持同步。分区滚动动画时长为 `HusTheme.animationEnabled ? 220 : 0`。
- 启动时 `initialRoute` 由 `engine.setInitialProperties` 注入；仅 `about` / `settings` 会在启动即切换侧栏选中，其余一律落在 `overview`。
- 装配组默认折叠，进入任一 `assembly_*` 路由时自动展开。
- 标题栏账号胶囊的跳转约定：路由切回 `overview` 并聚焦账号 `HusSelect`。
- 新增页面 = 新增路由名 + 页面文件 + 侧栏 `NavItem` + 本表一行，四者缺一不可。

---

## 9. 减少动效

- 所有 `Behavior` 与显式动画都必须能被 `HusTheme.animationEnabled` 关闭：`Behavior` 用 `enabled:`，`NumberAnimation` 用条件时长。
- 时长参考：悬停 90ms、选中 110ms、展开折叠 180–220ms。禁止超过 300ms 的界面动效。
- 禁止按钮缩放弹跳、卡片悬停上浮、页面转场位移、列表逐项延迟入场；HuskarUI 按钮的扩散波纹统一关闭（`effectEnabled: false`）。
- 悬停/选中反馈通过独立图层 `opacity` 切换实现，不对 `transparent` 或颜色值做插值，避免灰黑闪烁。

---

## 10. i18n 与文案

- 界面文案一律 `OverviewController.tr(key, OverviewController.currentLang)`，页面内可封装 `function t(key)` 简写；控制器内部用 `srp::core::tr`。键与中英文表在 `src/core/src/i18n.cpp`，新增键必须中英成对。
- 允许直接书写的只有：品牌与专名（`SrP-CFG`、`Steam`、`GitHub Releases`）、语言名（`简体中文` / `English`）、技术常量（`UTF-8`、`Source 2 CFG`、`MIT License`）、符号（`▶` `▾` `📄`）与纯格式串（版本号前缀 `"v"`）。兜底用户名必须包在 i18n 之外但保持一致（`Steam` / `Steam User`）。
- 拼接句子不要在 QML 里用 `+` 拼自然语言，用带占位符的键 + `.arg()`。
- 语言切换后需要重算的列表（包名、导航标签、字体说明）由控制器 `languageChanged` 触发刷新，页面不得缓存已翻译字符串。

---

## 11. 窗口尺寸与滚动

- 默认窗口 1160 × 720，最小 980 × 640（`Main.qml` 的 `minimumWidth` / `minimumHeight`）；不要把关键操作放到只在更宽窗口才可见的位置。
- 每页内容用 `Flickable` + `boundsBehavior: Flickable.StopAtBounds` + `ScrollBar.vertical: HusScrollBar`，内容 `contentHeight` 必须显式设置，保证最小窗口下可完整滚动。
- 正文列宽上限 920，两侧留白 24；页面主标题 22px，卡片标题 13px。
- 最小窗口 980 × 640 是验收尺寸之一，改动布局后按 [screenshots/README.md](screenshots/README.md) 重新抓图对比。

---

## 12. 检查清单

- [ ] 破坏性动作是否二次确认，描述是否包含对象与保留物？
- [ ] 结果反馈是否只走 `AppFeedback` / `messageNotify`，没有自建 toast？
- [ ] `Ctrl+S` 是否只在页面可见且有修改时生效？
- [ ] 侧边栏项能否 Tab 到、Enter/Space 激活、焦点框可见？
- [ ] 只读路径是否从盘符起点显示并可选中复制？
- [ ] 禁用态是否真的不可点击，且原因可查？
- [ ] 新路由是否同步了 `Main.qml`、侧栏与本表？
- [ ] 是否没有新增硬编码中文文案？
- [ ] 980 × 640 下是否无横向滚动、无被裁切的操作按钮？
