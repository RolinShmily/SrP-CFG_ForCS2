# 配置包条目清单与拓展

地图指南、CFG 预设、Features、Modes 不再由 C++/QML 固定枚举。每个包携带 `catalog.json`，程序读取清单生成 CLI 列表、GUI 卡片和编辑器文件选项。

三个包类型 `srp-cfg`、`video`、`annotations` 属于软件协议，不是任意插件系统。本文说明在这些现有类型中新增内容，未知包类型、全新交互类型或新的视频字段语义仍需要软件升级。

## 文件位置

- `config/srp-cfg/catalog.json`：预设、特性、模式。
- `config/annotations/catalog.json`：地图指南。

release 打包整个 config，Worker 打包整个对应目录，清单与文件一起随独立包更新。无需改工作流添加单个条目。

## 新增地图指南

示例：

```json
{
  "schema_version": 1,
  "entries": [
    {
      "id": "nuke",
      "name": "Nuke",
      "directory": "nuke-notes",
      "map": "de_nuke",
      "files": ["nuke-notes.txt"]
    }
  ]
}
```

添加对应 `nuke-notes/nuke-notes.txt`；KV3 的 MapName 必须为 de_nuke。清单数组顺序即 GUI 顺序，name 是显示名，id 是 CLI/状态稳定标识。每条指南目前对应一个地图、一个 txt 文件。

该条目会自动进入地图卡片、编辑器下拉框、装配/卸载与校验。目标：`annotations/local/nuke-notes/nuke-notes.txt`，复制命令为 `annotation_load nuke-notes`。目录与文件主名须一致，以符合游戏加载约定；名称可不同于现有指南，个人 mapguide 不变。

## 新增 CFG 特性或模式

```json
{
  "id": "my-feature",
  "name": "My Feature",
  "category": "features",
  "directory": "features/my-feature",
  "command": "srp_my_feature",
  "keymap_command": "srp_my_feature_with_keys",
  "files": ["settings.cfg", "keymap.cfg", "extra.cfg"]
}
```

category 为 features 或 modes。目录须位于对应 category 下，路径可由清单声明；settings.cfg 为现有行为协议的一部分。可额外加入多个 cfg 文件供编辑器选择。

必须在 `srp-cfg/runtime/commands.cfg` 注册一致的入口：

```text
alias "srp_my_feature" "exec srp-cfg/features/my-feature/settings.cfg"
alias "srp_my_feature_with_keys" "exec srp-cfg/features/my-feature/with-keymap.cfg"
```

keymap_command 是可选项，不固定为 `_keys`。没有默认按键的模块可不声明 keymap_command/keymap.cfg，界面隐藏默认按键操作，core 拒绝错误的附带按键请求。

Modes 仍使用按键触发，不改为启动时自动执行。新增模块下载到暂存后，须在首页重新装配到游戏才能使用；core 核对游戏中的入口与文件，尚未部署时明确提示。

## 新增预设

category 为 presets，directory 指向 presets 下的条目目录，command 指向在 runtime/commands.cfg 中注册的 apply.cfg 入口。

```json
{
  "id": "my-preset",
  "name": "My Preset",
  "category": "presets",
  "directory": "presets/my-preset",
  "command": "srp_my_preset",
  "files": ["settings.cfg", "keymap.cfg", "extra.cfg", "apply.cfg"],
  "description_zh": "预设说明",
  "description_en": "Preset description",
  "tags_zh": ["竞技"],
  "tags_en": ["Competitive"]
}
```

说明、标签、文件列表、顺序均来自元数据，未知 id 不会套用 Default 的说明。预设命令不要求 srp_apply_ 前缀；旧的 srp_apply_* 入口仍按协议识别，确保以前启用的预设可清除。

GUI/CLI 的 `--preset <id>` 按 ID 查找，`--file <relative>` 不依赖固定位置；命令支持新增条目。

## 校验和兼容

- schema 必须为 1；重复 JSON 键、重复 ID、命令、大小写重复目标文件被拒绝。
- ID、地图名、命令是有限字符标识；路径不得越界，不允许绝对路径、反斜杠、链接或非法名称。
- 声明文件必须存在，CFG/指南文件类型受限；命令须指向对应目录的入口，防止仅改清单就生成无效或其他命令。
- 无效清单阻止整个包更新，保留旧包；不静默退回固定列表。
- 老版本包没有 catalog.json 时，通过 presets/features/modes 目录与 runtime 入口别名发现条目。指南通过 `<directory>/<directory>.txt` 与 MapName 发现地图，不使用固定地图白名单。
- 正式清单支持自定义指南名称，但文件须为 `<directory>.txt`；旧包同样遵循这个游戏命名约定。
- 已保存工作副本跟随原有更新保留规则；GUI 模型更新按 ID/路径保留选择，脏草稿被删除条目不会自动转到其他文件。

## 验证

新增 `srp_catalog_tests` 显式测试目标。隔离扩展包验证第五张地图、自定义指南文件名、新无按键 Feature、新 Mode、新 Preset、额外 CFG 文件；检查装配、卸载、保存/恢复、目录发现及非法清单失败保留旧包。

真实 QML harness 同时验证新条目自动出现、地图鼠标装配、列表排序后草稿保持、新模块文件模型、新预设说明和加载。日志/截图在 `build-gui/verification-catalog/`。
