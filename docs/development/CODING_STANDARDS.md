# 编码规范

适用于 `src/` 下的 C++/QML/CMake 与仓库级依赖。规则分三类：**必须**（违反即拒收）、**应当**（偏离需在 PR 里说明理由）、**现状**（描述既有事实，新代码不要扩大偏离）。

架构背景见 [架构总览](../architecture/OVERVIEW.md)、[GUI 层](../architecture/GUI.md)。

## 1. 四条硬性边界（必须）

1. **`src/core` 不引入 Qt**。`srp_core` 只用 C++17 标准库与平台 API（`windows.h`、`winhttp`、`bcrypt` 等已在 `src/core/CMakeLists.txt` 中链接）。自检：

   ```bash
   grep -rn "#include <Q\|#include \"Q" src/core/include src/core/src   # 期望无输出
   grep -rn "QString\|QObject\|QVariant" src/core/include                # 期望无输出
   ```

2. **文件写入必须走事务 API**。用户可见的配置写入只有两个入口：`writeConfigWithBackup(path, content, reason)` 与 `removeConfigWithBackup(path, reason)`（声明见 `src/core/include/srp/core/config_backup.h`）；同目录原子替换用 `replaceFileAtomically(staged, target)`。自检：

   ```bash
   grep -rn "ofstream" src/core/src/*.cpp | grep -v "\.tmp\|staged\|/dev/null"  # 逐个确认目标不是最终文件
   ```

   允许直接写文件的场景：写同目录临时文件（`.filename.<stamp>.tmp`）、写暂存区（`packageStoreRoot()` 之下）、测试 fixture。

3. **QML 不做 IO 与业务解析**。QML 里不得出现 `XMLHttpRequest`、`Qt.createQmlObject` 之外的动态求值、路径拼接、CFG/KV3 解析；除 `FolderDialog` / `FileDialog` 这类用户选择器外，不得直接读写文件。所有路径与数据来自 Controller 的 `Q_PROPERTY` / `Q_INVOKABLE`。

4. **业务错误以 i18n 键返回，不以中文句子返回**。`srp_core` 的失败结果优先填键名（如 `"pkg.write_failed"`、`"video.invalid"`、`"feedback.invalid_cfg_dir"`），由调用方 `srp::core::tr(...)` 渲染；底层 OS/文件错误允许可读英文兜底，`tr()` 未命中时原样显示。CLI 的写法是 `std::cerr << srp::core::tr(result.error)`；GUI 交给 Controller 转成 `messageNotify`。

## 2. C++17 规范

### 2.1 命名（必须）

| 实体 | 规则 | 现有示例 |
| --- | --- | --- |
| 命名空间 | `srp::core`；GUI 控制器在全局命名空间或 `srp::gui` | `srp::core::writeConfigWithBackup` |
| 类型 / 结构体 | `PascalCase` | `ConfigWriteResult`、`PackageFileState` |
| 函数 / 方法 | `camelCase`，动宾结构 | `installSrp`、`compareAppVersions` |
| 自由常量 | `UPPER_SNAKE`，优先 `constexpr` | `STEAM_ID_OFFSET`、`DEFAULT_CS2_FOLDER` |
| 成员变量 | `m_` + `camelCase` | `m_storePath`、`m_darkMode` |
| 局部变量 / 参数 | `camelCase` | `gameCfgDir`、`stagedPath` |
| 头文件 | `snake_case.h`，与源文件同名 | `config_backup.h` / `config_backup.cpp` |
| 匿名命名空间辅助函数 | `camelCase`，不导出 | `startsWith`、`readFileToString` |
| i18n 键 | `域.子域.标识`，小写 + 下划线 | `nav.assembly`、`preferences.store_note` |

### 2.2 头文件与包含顺序（必须）

- 一律 `#pragma once`，不用 include guard。
- 顺序：**本文件对应头文件** → 本项目其它头文件（`"srp/core/xxx.h"`）→ 标准库 → 平台头（`#if defined(_WIN32)` 内 `WIN32_LEAN_AND_MEAN` 再 `windows.h`）→ 第三方。组间空一行。
- 头文件里只放接口；需要第三方/平台类型时用前向声明或 `optional` 包装，不要把 `<windows.h>` 塞进 `include/srp/core/*.h`。
- 新增实现文件必须手动加入 `src/core/CMakeLists.txt` 的 `add_library(srp_core STATIC ...)` 清单（**不允许 glob**）。
- `include/srp/core/` 是 `PUBLIC` include 目录，加进去的文件就是对外契约：改签名视为 API 变更，需同步 [OVERVIEW.md](../architecture/OVERVIEW.md)。

### 2.3 异常策略（必须）

内部实现可以用 `throw std::runtime_error("Invalid catalog field")` 做快速失败（`catalog.cpp`、`app_update.cpp` 的做法），但**每个导出函数必须在边界把异常转成返回值**：

```cpp
try {
    // 解析 / 校验 / 写入
} catch (const fs::filesystem_error&) {
    return {false, false, "pkg.write_failed"};
} catch (const std::runtime_error& e) {
    return {false, false, e.what()};   // 仅当 thrower 抛的就是 i18n 键时（如 packages.cpp）
}
```

两种可接受风格，选一种并在文件内保持一致：

- `packages.cpp` 风格：内部直接 `throw std::runtime_error("pkg.invalid_package")`，边界 `catch` 后把 `e.what()` 当作键返回。
- `catalog.cpp` 风格：内部抛英文诊断句（`"Invalid catalog field"`），边界统一映射成对外的键（`"pkg.invalid_catalog"`）。

无论哪种，**英文诊断句不得直接冒到 CLI/GUI**；它们只能进日志或被映射掉。禁止裸 `catch (...) {}` 吞异常；捕获后要么映射成明确的键，要么带上下文重新抛出。

### 2.4 返回值形状（应当）

- 有副作用的写操作返回 `ConfigWriteResult { bool success; bool changed; std::string error; }`。`changed=false` 表示内容相同、未触碰磁盘，调用方据此避免无意义提示。
- 只读查询用 `std::optional<T>`（缺失即无值）或 `bool` + 输出参数（如 `compareAppVersions(a, b, newer)`）。
- 不要为新功能另造一套 `Error/Result` 类型；扩展 `ConfigWriteResult` 之外的形状前先在 PR 里讨论。

### 2.5 路径安全（必须）

- 用户输入、catalog 字段、归档条目一律视为不可信。校验点：禁止绝对路径、禁止 `..` 上跳、禁止符号链接穿透（现有实现见 `catalogSafePath` 与 `catalog.cpp` 的 symlink 检查）。
- 拼接路径用 `std::filesystem::path` 的 `/` 运算符，不要手写 `+ "/"`；跨平台输出时再转字符串。
- 定位随附资源依次尝试 `config`、`../config`、`../../config`（`actions.cpp`、`packages.cpp` 的既有做法），新增探针时保持这个顺序并只读。
- 不把用户绝对路径写进仓库文件、日志断言或测试 fixture；测试里用 `fs::temp_directory_path()`。

### 2.6 注释与格式化（应当）

- 注释语言：`.cpp` 内部实现注释中英皆可，**同一文件内保持一致**；`include/srp/core/*.h` 新增注释用英文（CLI/GUI 共用契约）。既有中文注释（如 `types.h` 的字段说明）属历史遗留，不要求批量重写，但被改动的行请顺手统一。
- 不写「// 设置值」「// 循环」这类复述代码的注释。写约束：为什么必须原子替换、为什么必须先备份、为什么这个字段可空。
- 缩进 4 空格，不使用 Tab；行宽上限 120 列；`if`/`for` 必须带花括号（单行紧凑写法仅限 `tests/*.cpp` 的既有风格）。
- 仓库当前**没有** `.clang-format`：不要引入格式化工具连带重排整个文件；PR diff 只应包含本次逻辑改动。

### 2.7 警告（必须）

现状：根 `CMakeLists.txt` 只加 MSVC `/utf-8`，**未启用** `/W4` 或 `-Wall -Wextra`。因此规则是「不得新增警告」，而不是「全仓库零警告」：

```bash
cmake -S . -B build-warn -DSRP_BUILD_GUI=OFF -DCMAKE_CXX_FLAGS="/W4 /utf-8"
cmake --build build-warn --config Release --parallel 2 2>&1 | grep -i "warning C" | sort -u
```

把输出与改动前的基线对比；本次改动引入的行必须清零后再提交。特别注意：`char` 与 `unsigned char` 的转换、`size_t` 与 `int` 混用、`std::stoull` 未捕获异常。

## 3. QML 规范

视觉取值（颜色、字体、间距、饱和度）的语义定义见 [设计系统](../design/DESIGN_SYSTEM.md)，交互规则见 [交互规范](../design/UX_GUIDELINES.md)，组件选型与命名见 [组件规范](../design/COMPONENTS.md)；本节只规定「代码怎么写才能不偏离它们」。三份设计文档与本节冲突时，先确认哪一边是错的，同一次提交里一起改。

### 3.1 HuskarUI-first（必须）

- 优先用 `HuskarUI.Basic` 提供的 `Hus*` 组件（`HusButton`、`HusInput`、`HusScrollBar`、`HusDivider`、`HusIcon.*`）。标准控件能表达的场景不要自绘。
- 自研组件只放在 `src/gui/qml/components/`，命名 `App*.qml`（`AppButton`、`AppModal`、`AppCodeEditor`、`AppSidebar`、`AppFeedback`），且必须建立在 HuskarUI 控件或 `MetaTheme` 之上。
- 新增 QML 文件必须加入 `src/gui/CMakeLists.txt` 的 `qt_add_qml_module(... QML_FILES ...)`；新增图标/图片加入 `RESOURCES`。漏加会在发布包里变成「运行时找不到组件」。

### 3.2 主题（必须）

- 颜色、字体、圆角、语义色只从 `MetaTheme` 取：`MetaTheme.canvasBg`、`MetaTheme.textPrimary`、`MetaTheme.statusCritical`、`MetaTheme.radiusMd`、`MetaTheme.fontFamily`。
- `MetaTheme.qml` 是唯一允许出现十六进制字面量的 QML 文件（它按 `HusTheme.isDark` 分支给出两套值）。其它文件的十六进制属于遗留问题，现状仅剩 `pages/OverviewPage.qml`（Hero 覆盖层白字、清空按钮的危险/警告悬停底色）与 `components/RuntimePanel.qml`（卸载按钮悬停底色）；**新增代码不得再引入**。
- 深/浅色不得靠 `HusTheme.isDark ? A : B` 在页面里临时分支——先给 `MetaTheme` 加语义属性，页面只引用语义名。
- 文字一律 `font.family: MetaTheme.fontFamily`；代码编辑器另用其字体属性，不与界面字体混用。
- 圆角只用 `radiusSm/Md/Lg/Xl/Pill`，不写字面量 `radius: 8`。

### 3.3 文案与 i18n（必须）

- 用户可见文案禁止硬编码。页面用本页 `function t(key) { return OverviewController.tr(key, OverviewController.currentLang); }`（`SettingsPage.qml` 的既有写法），组件内直接调用 `OverviewController.tr(...)`。
- 新增键必须同时加入 `src/core/src/i18n.cpp` 的 `g_dictZh` 与 `g_dictEn`；缺一边会导致英文界面回落到中文或空串。键表约定见 [i18n](../reference/I18N.md)。
- 语言切换必须即时生效：`readonly` 绑定到 `currentLang`，不要在 `Component.onCompleted` 里把译文快照进普通 `property string`。

### 3.4 动效（必须）

- 所有 `Behavior`/动画的 `duration` 或 `enabled` 必须尊重 `HusTheme.animationEnabled`：`duration: HusTheme.animationEnabled ? 220 : 0`、`enabled: HusTheme.animationEnabled`。无障碍与低性能机器都依赖这个开关。
- 动效只用于状态切换的因果解释（展开、保存结果、面板切换），不给静态列表加装饰性运动。

### 3.5 objectName 与可访问性（必须）

- 会被脚本、截图冒烟或快捷键引用的交互控件必须有 `objectName`，命名用 `camelCase` 且**不随语言/主题变化**（`settingsSave`、`navSettings`、`languageEn`、`themeDark`、`storePath`；重复行用 `<名称>_<模型标识>`）。完整清单与命名约定见 [COMPONENTS.md](../design/COMPONENTS.md) 第 5 节。
- 自定义交互区域（`MouseArea` 承载的导航项等）必须补 `Accessible.role`、`Accessible.name`（用 `tr` 取当前语言文案）、`Accessible.focusable`，可点击的再加 `Accessible.onPressAction` 与 `Keys.onPressed` 的 Enter/Space 处理；细则见 [COMPONENTS.md](../design/COMPONENTS.md) 第 6 节。
- 图标按钮必须同时提供 `Accessible.name` 或可见文本，不允许只有图标。

### 3.6 布局与窗口（必须）

- `Main.qml` 固定 `minimumWidth: 980`、`minimumHeight: 640`。任何页面在此尺寸下不得出现横向溢出、控件重叠或文字被裁切；大屏用居中内容列（如 `width: Math.min(parent.width - 48, 920)`）而非无限拉伸。
- 优先 `QtQuick.Layouts`（`Layout.fillWidth`、`Layout.preferredWidth`、`Layout.maximumWidth`）与 `ColumnLayout`/`RowLayout`；避免满屏 `anchors` 硬坐标。
- 可滚动页面用 `Flickable` + `boundsBehavior: Flickable.StopAtBounds` + `HusScrollBar`（既有页面一致写法），不要用 `ScrollView` 包裹整页。
- 长文本必须 `wrapMode: Text.WordWrap` 且给出 `Layout.fillWidth`，否则 980px 窗口下会被截断。

## 4. CMake 规范

- **target 边界**：`srp_core`（无 Qt）、`srp_cli`（只链接 `srp_core`）、`srp_gui`（`srp_core` + `HuskarUIBasic`/`HuskarUIImpl` + 所需 `Qt6::*`）。新增依赖只能加在真正使用它的 target 上。
- **include 传递**：`srp_core` 的 `target_include_directories(... PUBLIC include)` 是唯一 PUBLIC 目录；其它所有 include 目录（含 HuskarUI 的 `src/cpp/**`）保持 `PRIVATE`。新增对子模块头文件的依赖必须能在 `build-gui` 完整构建中解析，不得依赖开发者本地路径。
- **编译选项**：新增全局选项前先确认它在 MSVC 与 GCC/Clang 下都成立；平台专属链接库放进 `if(WIN32)` 块（现状：`advapi32 shell32 winhttp bcrypt`）。
- **QML 模块**：`qt_add_qml_module(URI SrPGui ...)` 的 `QML_FILES`/`RESOURCES` 是白名单，不是目录扫描。`MetaTheme.qml`、`components/AppFeedback.qml` 通过 `set_source_files_properties(... QT_QML_SINGLETON_TYPE TRUE)` 成为单例，新增单例照此登记。
- **测试 target**：测试源文件放在 `src/core/tests/<area>_test.cpp`，在 `src/core/CMakeLists.txt` 的 `foreach(name IN ITEMS ...)` 清单里登记目标，并补 `add_test(NAME <snake_case> COMMAND ...)` 与 `set_tests_properties(... WORKING_DIRECTORY "${CMAKE_SOURCE_DIR}" TIMEOUT 120)`。详见 [TESTING.md](TESTING.md)。
- **版本注入**：`SRP_APP_VERSION` 由根 `CMakeLists.txt` 定义并 `target_compile_definitions(srp_core PRIVATE SRP_APP_VERSION="...")`。不要在代码里另写版本常量。
- 独立配置 `src/core` 必须继续可用（`cmake -S src/core -B build-core-standalone`）。新增对根工程变量的依赖前先验证这条路径。

## 5. 依赖与锁文件

- Node 侧只通过 pnpm 安装，且必须带防护：

  ```bash
  pnpm install --frozen-lockfile --ignore-scripts
  ```

  `--frozen-lockfile` 防止 CI/本地静默改锁；`--ignore-scripts` 阻止安装期任意脚本执行。需要原生编译的包必须先说明理由并获确认。
- `pnpm-lock.yaml`、`.gitmodules`（`src/gui/3rdparty/HuskarUI`）、`wrangler.toml` 视为源码：不手工编辑，不在无说明的 PR 里升级。升级依赖单独成 PR，附 `pnpm why`/变更说明。`skills-lock.json` 属于开发者本地产物（已被 `.gitignore` 忽略），不要提交。
- HuskarUI 是上游子模块：不在 `src/gui/3rdparty/HuskarUI` 内改动。确需补丁时改为在 `src/gui` 侧包一层组件，并在 PR 描述记录原因。
- Python 脚本只用标准库（`scripts/*.py` 现状如此），不引入 `pip` 依赖；需要第三方能力就落到 Node 侧或纯 CMake。
- 依赖清单与许可证：新增运行期依赖必须同步 `THIRD_PARTY_NOTICES.md` 与 `licenses/`，并跑 `node scripts/collect-licenses.mjs` 确认生成物一致。
