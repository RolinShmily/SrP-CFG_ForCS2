---
title: autoexec.cfg
description: SrP-CFG 核心自启动配置文件，包含键位、准星、雷达、HUD 等基础设置
---

> 自启动基础设置，所有 CFG 的核心配置文件

## 简介

autoexec.cfg 是 CS2 启动时自动加载的配置文件，是整个 SrP-CFG 的核心。它定义了键位绑定、准星、雷达、HUD、声音等基础设置，并在启动时自动加载 crosshair_view.cfg（准星视角预设）和 custom.cfg（用户定制化配置）。

其他 CFG 文件（practice、knife、demo_hlae 等）通过本文件中定义的快捷键按需加载。

## 文件加载关系

启动时自动执行：

1. `exec crosshair_view` — 准星与持枪视角预设
2. `exec custom` — 用户定制化配置（默认为空）

通过快捷键按需加载：

| 快捷键 | 加载文件 | 功能   |
| :--- | :--- | :--- |
| `O` | `exec autoexec.cfg` | 重启 autoexec |
| `P` | `exec practice.cfg` | 跑图练习 |
| `J` | `exec knife.cfg` | 匕首模型更换 |
| `]` | `exec demo_hlae.cfg` | HLAE Demo 观看 |
| `[` | `exec autoview.cfg` | 武器自适应视角切换 |
| `9` | `exec previewmode.cfg` | 饰品预览检视 |
| (默认关闭) | `exec zeus.cfg` | 电击枪自动切换 |
| 控制台 `gm` | `exec guidemake.cfg` | 地图指南制作 |

## 功能总览

| 分类 | 功能 | 快捷键 | 控制台别名 |
| :--- | :--- | :--- | :--- |
| 移动 | 前进/后退/左/右 | `W` `S` `A` `D` | - |
| 移动 | 跳跃 | 空格/滚轮上下 | - |
| 移动 | 蹲下 | `Ctrl` | - |
| 移动 | 静步 | `Shift` | - |
| 操作 | 使用/互动 | `E` | - |
| 操作 | 装填弹药 | `R` | - |
| 操作 | 检视 | `F` | - |
| 操作 | 丢弃物品 | `G` | - |
| 操作 | 切换最近武器 | `Q` | - |
| 武器 | 主武器/副武器/匕首 | `1` `2` `3` | - |
| 武器 | 电击枪/投掷物/C4 | `4` `5` | - |
| 投掷物 | 雷/闪/烟/火/诱饵弹 | `Z` `X` `C` `V` `6` | - |
| 信息 | 计分板 | `TAB` | - |
| 信息 | 切换 HUD 模式 | `-` | `keyhud` |
| 信息 | 切换左右手 | `H` | - |
| 信息 | 雷达缩放 | `T` | - |
| 信息 | 队友头顶标识 | `N` | - |
| 信息 | 无线电/X光/医疗针 | `'` | - |
| 沟通 | 喷漆 | `Y` | - |
| 沟通 | 全体/团队聊天 | `U` / `I` | - |
| 沟通 | 语音 | `后侧键` | - |
| 沟通 | 快捷聊天轮盘 | `Alt` | - |
| 沟通 | 玩家标记 | `鼠标中键` | - |
| 系统 | 控制台 | `` ` `` | - |
| 系统 | 选择队伍 | `M` | - |
| 系统 | 购买菜单 | `B` | - |
| 系统 | 投票同意/拒绝 | `F1` / `F2` | - |
| 购买 | 手枪 F3 / 步枪 F4 | `F3` / `F4` | - |
| 购买 | 雷/闪/烟/火 | `F5` / `F6` / `F7` / `F8` | - |
| 购买 | 半甲/全甲/钳子 | `F9` / `F10` / `F11` | - |
| 购买 | 出售所有装备 | 退格键 | - |
| 工具 | 一键发刀（平台） | `K` | - |
| 工具 | 5E 平台报伤害 | `\` | - |
| 工具 | 一键消音至 30% | `Delete` | - |
| 工具 | 飞行模式 | `ralt` | - |

## 鼠标设置

| 设置项 | 值 | 说明 |
| :--- | :--- | :--- |
| sensitivity | 0.5625 | 灵敏度 |
| zoom_sensitivity_ratio | 1 | 开镜灵敏度 |
| m_yaw | 0.022 | X 轴角度系数 |

> **提示：** 使用控制台设置灵敏度可以精准到小数位。在游戏设置条上拖动的数字看似精确，实际值可能是随机小数。

关于 **m_yaw**：此参数严格来说是游戏摄像机的 X 轴角度系数。在 16:9 分辨率下默认 0.022 即为标准鼠标速度。使用 **4:3 拉伸** 分辨率时，画面水平拉伸会导致鼠标水平速度变快，如需匹配垂直速度可将此参数调整为 **0.0165**。

## 准星设置

| 设置项 | 值 | 说明 |
| :--- | :--- | :--- |
| crosshair | true | 启用准星（防止被意外关闭） |

详细的准星预设和切换功能由 crosshair_view.cfg 提供，详见 [crosshair_view 文档](/docs/crosshair_view)。

### 狙击镜准星

| 设置项 | 值 | 说明 |
| :--- | :--- | :--- |
| cl_crosshair_sniper_width | 2 | 狙击镜准星线粗细 |
| cl_sniper_show_inaccuracy | 1 | 开启狙击镜扩散显示 |

### 投掷物准星

所有投掷物的轨迹准星均已启用，延迟时间为 0.5 秒（拉完栓顿一下即出现坐标轴准星）。投掷时保留玩家自定义准星。

| 投掷物 | 启用状态 | 延迟 |
| :--- | :--- | :--- |
| 高爆手雷 | 启用 | 0.50s |
| 闪光弹 | 启用 | 0.50s |
| 烟雾弹 | 启用 | 0.50s |
| 燃烧弹 | 启用 | 0.50s |
| 诱饵弹 | 启用 | 0.50s |

### 准星杂项

| 设置项 | 值 | 说明 |
| :--- | :--- | :--- |
| cl_observed_bot_crosshair | 2 | 观察机器人时始终显示准星 |
| cl_show_observer_crosshair | 2 | 观察其他玩家时始终显示准星 |
| cl_teamid_overhead_fade_near_crosshair | 0.5 | 队友 ID 在准星附近的淡出距离 |

## 持枪视角

| 设置项 | 值 | 说明 |
| :--- | :--- | :--- |
| viewmodel_fov | 68 | 武器视野范围 |
| viewmodel_offset_x | 2 | 左右偏移 |
| viewmodel_offset_y | 2 | 前后偏移 |
| viewmodel_offset_z | -1 | 上下偏移 |
| viewmodel_presetpos | 0 | 预设位置编号 |

## 雷达设置

| 设置项 | 值 | 说明 |
| :--- | :--- | :--- |
| cl_radar_always_centered | 0 | 不居中，显示完整地图 |
| cl_radar_scale | 0.37 | 缩放比例 |
| cl_hud_radar_scale | 1 | HUD 雷达缩放 |
| cl_teammate_colors_show | 2 | 队友颜色模式 |
| cl_radar_icon_scale_min | 0.6 | 图标最小缩放 |
| cl_radar_rotate | 1 | 随玩家视角旋转 |
| cl_radar_square_always | 0 | 不强制方形 |
| cl_radar_square_with_scoreboard | 1 | 计分板时方形显示 |

不居中的小地图可以在所有地图上看到完整布局，第一时间获取重要信息。对单排玩家尤其有利——队友报点往往不如自己看到的一手信息准确。

## HUD 界面

| 设置项 | 值 | 说明 |
| :--- | :--- | :--- |
| hud_showtargetid | 1 | 显示队友/敌人 ID |
| hud_scaling | 0.85 | HUD 缩放比例 |
| safezonex | 0.88 | 水平占比（偏集中） |
| safezoney | 0.905 | 竖直占比（偏集中） |
| cl_color | 0 | 队伍雷达与头像框颜色（蓝色） |
| cl_hud_color | 0 | HUD 颜色（跟随队伍） |
| cl_showloadout | 0 | 不常显物品栏 |

> **提示：** HUD 占比在控制台中可以设置到游戏设置条无法达到的精度。此处 0.88/0.905 的设置偏集中，不会抵住屏幕边缘。

### HUD 颜色

控制台输入对应别名即可切换 HUD 颜色：

| 别名 | 颜色 | 编号 |
| :--- | :--- | :--- |
| `lwhite` | 灰白色 | 1 |
| `bwhite` | 亮白色 | 2 |
| `lblue` | 浅蓝色 | 3 |
| `blue` | 深蓝色 | 4 |
| `purple` | 紫色 | 5 |
| `red` | 红色 | 6 |
| `orange` | 橙色 | 7 |
| `yellow` | 黄色 | 8 |
| `green` | 绿色 | 9 |
| `cyan` | 青绿色 | 10 |
| `pink` | 粉色 | 11 |

## 声音设置

| 设置项 | 值 | 说明 |
| :--- | :--- | :--- |
| volume | 1 | 主音量 |
| snd_headphone_eq | 0 | 耳机均衡器 |
| snd_menumusic_volume | 0.03 | 主菜单音乐（极低） |
| snd_roundstart_volume | 0 | 回合开始音量（静音） |
| snd_roundend_volume | 0.02 | 回合结束音量 |
| snd_roundaction_volume | 0 | 回合行动音量（静音） |
| snd_mvp_volume | 0.12 | MVP 音量 |
| snd_mapobjective_volume | 0.12 | 炸弹/人质音量 |
| snd_tensecondwarning_volume | 0.08 | 十秒警告音量 |
| snd_deathcamera_volume | 0.08 | 死亡视角音量 |
| snd_mute_mvp_music_live_players | 1 | 存活时静音 MVP 音乐 |
| snd_mute_losefocus | 0 | 后台播放声音 |
| voice_modenable | 1 | 启用语音 |

## 网络与显示

| 设置项 | 值 | 说明 |
| :--- | :--- | :--- |
| cl_hud_telemetry_frametime_show | 2 | 显示帧生成时间及 FPS |
| cl_hud_telemetry_ping_show | 2 | 显示延迟 |
| mm_dedicated_search_maxping | 70 | 匹配最大 ping 值 |
| r_fullscreen_gamma | 2.6 | 亮度 |
| fps_max | 0 | 帧率无上限 |

> **提示：** 如果使用加速器效果不佳但需要打国际服，可将 `mm_dedicated_search_maxping` 调大，匹配到更远区域的玩家。

## 偏好设置

| 设置项 | 值 | 说明 |
| :--- | :--- | :--- |
| cl_prefer_lefthanded | 0 | 右手持枪 |
| cl_debounce_zoom | 0 | 按住开镜键持续切换 |
| cl_silencer_mode | 1 | 允许卸下消音器 |
| cl_use_opens_buy_menu | 0 | 关闭 E 键打开购买菜单 |
| cl_dm_buyrandomweapons | 0 | 关闭死斗随机买枪 |
| cl_teamcounter_playercount_instead_of_avatars | 1 | 显示存活数字 |
| r_drawtracers_firstperson | 1 | 显示曳光弹 |
| cl_teamid_overhead_mode | 3 | 隔墙显示队友位置 |
| cl_teamid_overhead_colors_show | 1 | 使用玩家颜色标识 |
| con_enable | 1 | 启用控制台 |
| gameinstructor_enable | 0 | 禁用教学提示 |
| cl_autohelp | false | 禁用自动帮助 |
| spec_replay_autostart | 0 | 关闭被击杀回放 |

## 快捷聊天轮盘

使用 `Alt` 键呼出快捷聊天轮盘，共 3 页，每页 8 个选项，使用游戏内置语音和图标：

| 页码 | 选项 1 | 选项 2 | 选项 3 | 选项 4 |
| :--- | :--- | :--- | :--- | :--- |
| 第 0 页 | 请求手雷 | 发现狙击手 | 开火指令 | 撤退指令 |
| | 请求烟雾弹 | 进攻（冲！） | 请求闪光弹 | 需要支援 |
| 第 1 页 | 请求武器 | 请求经济 | B 点计划 | 听到动静 |
| | 中路计划 | 我有炸弹 | A 点计划 | 请求 Eco |
| 第 2 页 | 收到/同意 | 拒绝 | 称赞 | 感谢 |
| | 加油 | 稳住 | 抱歉 | 区域安全 |

可根据个人喜好调整各选项的位置。

## 控制台别名

在控制台中输入以下别名可快速切换设置：

| 别名 | 功能 |
| :--- | :--- |
| `lefthand` | 切换为左手持枪 |
| `debounce` | 关闭连镜切换（按住开镜不松开） |
| `silencer` | 禁用卸下消音器 |
| `avatars` | 显示对局头像 |
| `numbers` | 显示对局数字 |
| `tracer` | 关闭曳光弹 |
| `ping` | 启用快捷轮盘标点 |
| `squareon` / `squareoff` | 强制/取消方形小地图 |
| `round` | 计分板地图改为圆形 |
| `sniperon` / `sniperoff` | 开启/关闭狙击镜扩散 |
| `flyn` / `flyralt` | 切换 N 键或 ralt 为飞行键 |
| `ps` / `pd` | 打印延迟摘要/详细信息 |
| `show` / `notshow` | 开启/关闭常显装备栏 |
| `back` | 重启 autoexec.cfg |
| `zeus` | 加载电击枪自动切换 |

## 控制台导航

启动时，控制台会打印 SrP-CFG 的 ASCII art 标识和完整的命令导航菜单，列出所有可用的别名、快捷键和预设 CFG 调用方式。可随时在控制台中查看。

## 注意事项

- 2025.8.15 更新后，F1/F2 默认绑定为投票功能，已取消自定义绑定
- 4 号键默认绑定为电击枪（slot11），如需恢复为默认投掷物轮切，请使用 `bind "4" "slot4"`。使用该套 CFG 时还需删除 zeus.cfg 或注释掉 `exec zeus.cfg` 行
- 滚轮默认绑定为跳跃，如需恢复为装备切换请使用 `bind "mwheeldown" "invnext"` 和 `bind "mwheelup" "invprev"`
- 飞行键（ralt）仅在跑图作弊模式下有效
- 如需查看完整源码，请访问 [GitHub 仓库](https://github.com/RolinShmily/SrP-CFG_ForCS2) 中的 `default/autoexec.cfg`
