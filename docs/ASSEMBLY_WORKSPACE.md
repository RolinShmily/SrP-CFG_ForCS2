# 自由装配工作区

## 界面与职责

Valve 基线、Features、Modes、用户配置组成同一个持续存在的工作区，依次排列在左侧长内容区。应用侧边栏对应四个锚点，点击平滑定位，手动滚动更新导航高亮。

最右侧 `HusScrollBar` 控制左侧内容滚动；右侧编辑器固定，文件内容单独滚动。展开按钮隐藏左侧操作区，编辑器占满内容区；再次点击恢复双栏，草稿、光标和缩放状态保留。点击用户配置锚点打开 `user/custom.cfg`，不自动展开。

默认使用亮色主题；保留手动深色切换和 `--dark` 启动参数，不再随 Windows 主题改变应用主题。

- `app/core/include/srp/core/assembly.h` / `app/core/src/assembly.cpp`：模块目录、命令、状态、配置解析、装配、启动绑定计划、冲突和文件写入规则。
- `app/cli/src/main.cpp`：调用 core，适用于自动化和手动操作。
- `app/gui/src/assembly_controller.*`：编辑草稿、文件监控、安装/冲突确认、core 调用及状态通知。
- `AssemblyPage.qml` / `AssemblyModuleCard.qml`：布局、锚点、展示和事件转发；不解析或拼接写入 CFG。

## Features

模块：AutoView、Crosshair-View、Knife、Zeus。

装配始终包含设置；“附带默认按键”决定是否同时启用模块按键。装配入口位于基线/预设之后、用户层之前，个人覆盖仍然最后执行。特性允许组合，但不同模块的同名按键依然可能相互覆盖。

卸载移除该特性的全部直接入口，不受复选框控制，不删除模块文件，不回滚游戏状态。用户自己定义的 alias 或 bind 不由特性卸载自动拆除。

## Modes

模块：Demo-HLAE、GuideMake、Practice、Preview、PWA-Prac。

模式按需触发，不在游戏启动时自动执行设置。runtime 已注册所有模式命令，工作区只配置启动键：

```cfg
bind "f6" "srp_demo"
bind "p" "srp_practice_keys"
```

第二种入口在进入模式时同时加载该模式的 `keymap.cfg`。“启动键”和“进入时应用预设按键”是两个独立选项；“更改默认按键”编辑进入模式后的操作按键文件。

多个模式可以使用不同启动键。状态表示 `custom.cfg` 中配置的有效启动入口，不代表游戏正在运行该模式，也不检测运行中的 CS2。

- 绑定读取当前配置与已知预设/特性键位，提供已有命令与新命令的冲突预览；确认后替换目标键绑定并移除该模式旧入口。
- 配置在确认期间变化时拒绝过期计划，要求重新操作。
- 旧的直接模式执行入口迁移为绑定前也要求确认。
- 重复绑定相同入口不写文件、不生成新备份。
- 重新绑定遇到同模式的复杂多命令启动绑定时暂停，要求先在编辑器拆分。
- 移除入口可拆除复合 bind 中的直接模式命令，保留同一绑定里的其他命令及文本大小写；不会恢复曾经被替换的原绑定。
- 冲突检查针对配置文本和已知随包执行路径，不声称完整模拟 CS2、用户任意 alias/exec 或 VCFG 的运行态。

## 共享编辑器

默认显示 `user/custom.cfg`，下拉菜单允许选择 Valve 以及各特性/模式的 `settings.cfg`、`keymap.cfg`。

“更改默认按键”打开模块 `keymap.cfg`；模式“查看预设指令”打开 `settings.cfg`；成功装配、绑定或卸载后打开更新后的 `custom.cfg`。

- 切换文件/修改入口时保护未保存草稿；纯锚点导航不切换文档。用户配置导航涉及打开文件，因此可能被草稿保护阻止。
- 模块文件可保存和恢复随包原始版本；用户配置隐藏恢复默认。
- 文件菜单 `(*)` 表示与随包默认有差异；保存按钮 `*` 表示当前未保存编辑。
- 安装目录优先；未安装时只读预览随包默认，安装确认后继续本次操作。
- 文件和目录监控支持外部替换保存，外部冲突不会覆盖草稿。
- 保存保留 BOM/CRLF。备份沿用 [VALVE_ASSEMBLY.md](VALVE_ASSEMBLY.md) 的原子替换、最近 `.bak` 和 20 份不同内容历史。

## CLI

```text
srpcfg modules --en
srpcfg feature-assemble autoview --keymap
srpcfg feature-unload autoview
srpcfg mode-bind demo-hlae --key f6 --keymap
srpcfg mode-bind practice --key p --keymap --confirm
srpcfg mode-unbind demo-hlae
```

所有命令支持 `--cfg-dir <游戏CFG目录>`。遇到冲突且没有 `--confirm` 时返回 2，失败返回 1，成功或无变化返回 0。CLI 和 GUI 使用相同 core 接口。

## 验证

```text
cmake --build build-gui --config Release --target srp_gui srp_cli srp_config_tests
build-gui/app/core/Release/srp_config_tests.exe
```

核心测试使用临时目录，覆盖 Valve、特性、模式冲突和过期确认、复合绑定保留、用户层保护及备份失败。GUI 联动验证包括真实鼠标点击、固定编辑器、锚点滚动、手动全宽、草稿保护、文件编辑恢复、语言主题切换、Ctrl 滚轮与普通滚动。
