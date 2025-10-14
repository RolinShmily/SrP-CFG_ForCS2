<h1 align="center">SrP-CFG</h1>
<h4 align="center">适用于CS2各场景的CFG预设文件</h3>

<div align="center">

[![stars](https://img.shields.io/github/stars/RolinShmily/SrP-CFG_ForCS2.svg?style=flat&color=green)](https://github.com/RolinShmily/SrP-CFG_ForCS2)
[![fork](https://img.shields.io/github/forks/RolinShmily/SrP-CFG_ForCS2.svg?style=flat&color=critical)](https://github.com/RolinShmily/SrP-CFG_ForCS2)
![license](https://img.shields.io/badge/license-GPL%203-orange.svg?style=flat)
[![release](https://img.shields.io/github/release/RolinShmily/SrP-CFG_ForCS2.svg?style=flat&color=blue)](https://github.com/RolinShmily/SrP-CFG_ForCS2/releases)

</div>

## 简介

文件功能表：

|功能|文件|
|:---:|:---:|
|自启动基础设置|`autoexec.cfg`|
|准星与持枪视角|`crosshair_view.cfg`|
|个人自建房跑图|`practice.cfg`|
|使用[HLAE](https://github.com/advancedfx/advancedfx)观看demo|`demo_hlae.cfg`|
|匕首模型切换|`knife.cfg`|
|电击枪快速切换|`zeus.cfg`|
|视频设置|`cs2_video.txt`|

> 以下的CFG详细功能表，所有的CFG在运行后都会在控制台输出导航信息，请注意查看。

### autoexec.cfg

- `zeus.cfg`默认启动，它重定义了`1`、`2`、`3`、`4`、`5`、`q` 键的功能。

|          功能           |    快捷键     |     控制台别名      |
| :---------------------: | :-----------: | :-----------------: |
|          前进           |       `W`       |          -          |
|          后退           |       `S`       |          -          |
|          向左           |       `A`       |          -          |
|          向右           |       `D`       |          -          |
|        普通攻击         |   鼠标左键    |          -          |
|        特殊攻击         |   鼠标右键    |          -          |
|          使用           |       `E`       |          -          |
|        装填弹药         |       `R`       |          -          |
|          检视           |       `F`       |          -          |
|          跳跃           | 空格/滚轮上下 |          -          |
|          蹲下           |     `Ctrl`      |          -          |
|       显示计分板        |      `TAB`      |          -          |
|        丢弃物品         |       `G`       |          -          |
|        选择队伍         |       `M`       |          -          |
|          静步           |     `Shift`     |          -          |
|        购买菜单         |       `B`       |          -          |
|         主武器          |       `1`       |          -          |
|         副武器          |       `2`       |          -          |
|          匕首           |       `3`       |          -          |
|         电击枪          |       `4`       |          -          |
|           C4            |       `5`       |          -          |
|           雷            |       `Z`       |          -          |
|           火            |       `V`       |          -          |
|           闪            |       `X`       |          -          |
|           烟            |       `C`       |          -          |
|         诱饵弹          |       `6`       |          -          |
|     切换为最近武器      |       `Q`       |          -          |
|          喷漆           |       `Y`       |          -          |
|        团队聊天         |       `U`       |          -          |
|        全体聊天         |       `I`       |          -          |
|          语音           |    `后侧键`     |          -          |
|      快捷聊天轮盘       |      `Alt`      |          -          |
|          标点           |    `前侧键`     |          -          |
|         控制台          |      `` ` ``       |          -          |
|       切换左右手        |       `T`       |          -          |
|        雷达缩放         |       `H`       |          -          |
|      队友头顶标识       |       `N`       |          -          |
|   无线电菜单、医疗针    |       `‘`       |          -          |
|  仅显示准星与击杀信息   |       `-`       |          -          |
|      显示/关闭雷达      |       `=`       |          -          |
|        投票同意         |      `F1`       |          -          |
|        投票拒绝         |      `F2`       |          -          |
|    购买手枪第五槽位     |      `F3`       |          -          |
|    购买步枪第二槽位     |      `F4`       |          -          |
|        购买手雷         |      `F5`       |          -          |
|        购买闪光         |      `F6`       |          -          |
|        购买烟雾         |      `F7`       |          -          |
|       购买燃烧弹        |      `F8`       |          -          |
|        购买半甲         |      `F9`       |          -          |
|        购买全甲         |      `F10`      |          -          |
|        购买钳子         |      `F11`      |          -          |
|      出售所有装备       |    退格键     |          -          |
|       总音量 30%        |    `Delete`     |          -          |
|      重启 autoexec      |       `O`       |    `exec autoexec`    |
|      匕首模型更换       |       `J`       |     `exec knife`      |
|        跑图训练         |       `P`       |    `exec practice`    |
|   准星、持枪视角预设    |       `[`       | `exec crosshair_view` |
|        demo 预设        |       `]`       |   `exec demo_hlae`    |
|        平台发刀         |       `K`       |      `say !drop`      |
|      5E 平台报伤害      |      `\`        |       `say .hp`       |
|      默认左手持枪       |       `-`       |      `lefthand`       |
| 关闭狙击开枪后自动开镜  |       -       |      `debounce`       |
|     禁用卸下消音器      |       -       |      `silencer`       |
|      显示对局头像       |       -       |       `avatars`       |
|      显示对局人数       |       -       |       `numbers`       |
|       关闭曳光弹        |       -       |       `tracer`        |
|    启用快捷轮盘标点     |       -       |        `ping`         |
|     强制方形小地图      |       -       |      `squareon`       |
|     POV 圆形小地图      |       -       |      `squareoff`      |
|    计分板圆形小地图     |       -       |        `round`        |
|     开启狙击镜扩散      |       -       |      `sniperon`       |
|     关闭狙击镜扩散      |       -       |      `sniperoff`      |
| n 为飞行，ralt 标识切换 |       -       |        `flyn`         |
| ralt 为飞行，n 标识切换 |       -       |       `flyralt`       |
|       默认飞行键        |     `ralt`      |          -          |

### practice.cfg

> 出生点预设参考于 [Bad0RANG3](https://github.com/Bad0RANG3/CS2PraticeCFG)

- 默认状态下`P`键启用

|          功能          |     快捷键      | 控制台别名 |
| :--------------------: | :-------------: | :--------: |
|    切换队友头顶显示    | `ralt`(右 alt 键) |     -      |
|         弹着点         |        `↑`        |     -      |
|        杀死 Bot        |        `↓`        |     -      |
|    实时预测道具轨迹    |        `←`        |     -      |
|        重新开始        |        `→`        |     -      |
|        补全护甲        |       `F1`        |     -      |
|        自动回血        |       `F2`        |     -      |
|      取消摔落伤害      |       `F3`        |     -      |
|        添加 Bot        |       `F4`        |     -      |
|      使 Bot 蹲下       |       `F5`        |     -      |
|  使机器人模仿你的操作  |       `F6`        |     -      |
|       视角放大镜       |       `F7`        |     -      |
|        删除 Bot        |       `F8`        |     -      |
|       Bhop 连跳        |       `F12`       |     -      |
|    重现最近一次道具    |        `L`        |     -      |
|      加速时间流逝      |        `0`        |     -      |
|        放置 Bot        |     `MOUSE4`后侧键      |     -      |
|        飞行模式        |        `N`        |     -      |
|     显示速度信息等     |        `K`        |     -      |
|      标准实战模拟      |        -        |    `gkd`     |
|      恢复跑图模式      |        -        |     `gg`     |
|     加载出生点预设     |        -        |   `spawn`    |
| 实体显示(高环境光遮蔽) |        `.`        |     -      |
|       任意处安包       |        -        |   `plant`    |
|      弹夹容量状态      |        `/`        |     -      |
|        友伤状态        |       `F9`        |     -      |

### spawn.cfg

- 只在跑图模式下(运行`practice.cfg`后)，控制台输入`spawn`启用
- 请先在控制台选择地图，再输入出生点别名。

|    地图    | 控制台别名 |
| :--------: | :--------: |
|  炼狱小镇  |  `inferno``   |
|   沙漠 2   |   `dust2`    |
|  荒漠迷城  |   `mirage`   |
|  远古遗迹  |  `ancient`   |
|  核子危机  |    `nuke`    |
|  殒命大厦  |  `vertigo`   |
|  阿努比斯  |   `anubis`   |
|   办公室   |   `office`   |
|   意大利   |   `italy`    |
| 列车停放站 |   `train`    |
| 死亡游乐园 |  `overpass`  |

|     出生位      | 控制台别名 |
| :-------------: | :--------: |
| 警察 1 号出生点 |    `CT1`     |
| 警察 2 号出生点 |    `CT2`     |
| 匪徒 3 号出生点 |     `T3`     |
| 匪徒 4 号出生点 |     `T4`     |
|       ...       |    ...     |

出生点地图预设文件:
- `vertigo.cfg`
- `office.cfg`
- `nuke.cfg`
- `mirage.cfg`
- `italy.cfg`
- `inferno.cfg`
- `dust2.cfg`
- `anubis.cfg`
- `ancient.cfg`
- `train.cfg`
- `overpass.cfg`

初始化文件：
- `init_spawns.cfg`


### demo_hlae.cfg

> 参考自[Purp1e](https://github.com/Purple-CSGO/CSGO-Config-Presets)，整合了[动态模糊录制功能(来自YouTube)](https://www.youtube.com/watch?v=4zq27TcpfVg)

- 默认状态下`]`键启用

- 完整功能需要安装[HLAE](https://github.com/advancedfx/advancedfx)和正确配置[FFmpeg](https://ffmpeg.org/)，在CFG中也有指示。


|            功能            |   快捷键   |     控制台别名     |
| :------------------------: | :--------: | :----------------: |
|        demoUI 开关         | `Q` / `shift+F2` |       `demoui`       |
|     标记当前时间 tick      |     `Y`      |         -          |
|     跳转标记时间 tick      |     `U`      |         -          |
|   镜头摆放模式(ESC 退出)   |     `T`      |         -          |
|          添加镜头          |  `Capslock`  |         -          |
|          清空镜头          |   `Delete`   |         -          |
|          镜头激活          |     `I`      |         -          |
|          镜头轨迹          |     `O`      |         -          |
|         demo 暂停          | `P`/ `MOUSE3` 鼠标中键  |         -          |
|      只保留准星和击杀      |     `H`      |         -          |
|   只显示当前玩家击杀信息   |     `J`      |         -          |
|       开关 CSGO 语音       |     `K`      |         -          |
|       开关 CS2 语音        |     `'`      |         -          |
| 查看当前玩家信息和语音屏蔽 |     `L`      |         -          |
|        队友头顶标识        |    `ralt`    |         -          |
|          X 光透视          |     `X`      |         -          |
|            准星            |     `V`      |         -          |
|          hud 开关          |     `B`      |         -          |
|            雷达            |     `N`      |         -          |
|            静音            |     `M`      |         -          |
|          快退 5s           |     `,`      |         -          |
|          快进 5s           |     `.`      |         -          |
|         +播放速度          |   `MOUSE5`前侧键   |         -          |
|         - 播放速度         |   `MOUSE4`后侧键   |         -          |
|       运镜回退 0.25s       |     `[`      |         -          |
|       运镜快进 0.25s       |     `]`      |         -          |
|      切换击杀信息显示      |     `\`      |        `ass`         |
|          广角 POV          |     `=`      |         -          |
|       开启 HLAE 录制       |     `↑`      |         -          |
|       关闭 HLAE 录制       |     `↓`      |         -          |
|   设置当前 tick 开始录制   |     `F5`     |         -          |
|   设置当前 tick 结束录制   |     `F6`     |         -          |
|     打印 mirv_cmd 信息     |     `F7`     |         -          |
|     清除 mirv_cmd 指令     |     `F8`     |         -          |
|  开关 VGUI(Reshade 功能)   |     `F9`     |         -          |
|      开启动态模糊录制      |     -      |       `bluron`       |
|      关闭动态模糊录制      |     -      |      `bluroff`       |
|  关闭 BGM、MVP、无线电等   |     -      |        `mute`        |
|      解绑运镜模式按键      |     -      |         `t`          |
|       回合开始无灰色       |     -      |        `post`        |
|    使运镜开始为当前视角    |     -      |        `pos`         |
|   使运镜开始为当前 tick    |     -      |        `time`        |
|    运镜模式的 FOV 修改     |     -      | `f10、f15、... f100` |
|        显示对局头像        |     -      |      `avatars`       |
|        显示对局人数        |     -      |      `numbers`       |
|          显示demo下方小字提示          |     -      |        `show`        |
|          屏蔽demo下方小字提示           |     -      |       `noshow`       |

### knife.cfg

> V社在2025年8月15日更新过后，原来的命令不再适用，新的操作已在CFG中写明。

- 默认状态下`j`键启用

|  刀具模型  | 控制台别名 |
| :--------: | :--------: |
|    刺刀    |    `500`     |
|  海豹短刀  |    `503`     |
|   折叠刀   |    `505`     |
|   穿肠刀   |    `506`     |
|   爪子刀   |    `507`     |
|  M9 刺刀   |    `508`     |
| 猎杀者匕首 |    `509`     |
|    弯刀    |    `512`     |
|  鲍伊猎刀  |    `514`     |
|   蝴蝶刀   |    `515`     |
|  暗影双匕  |    `516`     |
|  系绳匕首  |    `517`     |
|  求生匕首  |    `518`     |
|    熊刀    |    `519`     |
|    折刀    |    `520`     |
| 流浪者匕首 |    `521`     |
|    短剑    |    `522`     |
|  锯齿爪刀  |    `523`     |
|  默认匕首  |    `524`     |
|  骷髅匕首  |    `525`     |
|   尼泊尔   |    `526``     |

### zeus.cfg

- 在 `autoexec.cfg` 中自动启用，必须绑定“4”键电击枪
- 功能：在电击枪左键使用之后自动切出主武器/副武器，手持电击枪右键时则不使用，直接切出主武器/副武器。
- Tips: 电击枪充电完成是有声音的，请注意使用后利用该声音做一定战术调整，或者直接将其丢弃，避免在关键时刻暴露位置。

### crosshair_view.cfg

> 由于 Valve 的脚本指令单条有长度限制，而准星参数的设置已经超过该限制，故直接用 cfg 文件来保存准星预设，这也就要求若更换准星，则必须搭配 `crosshair_library` 准星代码库使用

- 默认状态下 `[` 键启用
- 准星与持枪视角的存储与即时更换

|           功能           | 快捷键 | 控制台别名 |
| :----------------------: | :----: | :--------: |
|      开关 T 型准星       |   ←    |     -      |
|      开关准星中心点      |   →    |     -      |
|      关闭投掷物准星      |   ↑    |  nothrow   |
|      开启投掷物准星      |   ↓    |   throw    |
|    更改准星颜色为...     |  ...   |    ...     |
|           红色           |   -    |    red     |
|           橙色           |   -    |   orange   |
|           黄色           |   -    |   yellow   |
|           绿色           |   -    |   green    |
|           青色           |   -    |    cyan    |
|           蓝色           |   -    |    blue    |
|           紫色           |   -    |   purple   |
|           黑色           |   -    |   black    |
|           白色           |   -    |   white    |
|           粉色           |   -    |    pink    |
|           棕色           |   -    |   brown    |
|           灰色           |   -    |    gray    |
| 投掷时保持玩家自定义准星 |   -    |    keep    |
| 输入...切换准星/持枪视角 |  ...   |    ...     |
|         0 号准星         |   -    |    c00     |
|         1 号准星         |   -    |    c01     |
|         2 号准星         |   -    |    c02     |
|         3 号准星         |   -    |    c03     |
|         4 号准星         |   -    |    c04     |
|         5 号准星         |   -    |    c05     |
|         6 号准星         |   -    |    c06     |
|         0 号视角         |   -    |    v00     |
|         1 号视角         |   -    |    v01     |
|         2 号视角         |   -    |    v02     |
|         3 号视角         |   -    |    v03     |
|         4 号视角         |   -    |    v04     |
|         5 号视角         |   -    |    v05     |
|         6 号视角         |   -    |    v06     |

`crosshair_library`代码库中的准星预设文件：
- 01.cfg
- - 准星代码: `CSGO-H9mcs-8GDFZ-MfxkQ-2Kx7O-pTLoD`
- 02.cfg
- - 准星代码: `CSGO-oK2db-LY2wT-seq73-YTnJB-3bOUD`
- 03.cfg
- - 准星代码: `CSGO-9StUb-FrcBs-HhYjr-mzVip-YScNE`
- 04.cfg
- - 准星代码: `CSGO-pqEaF-5AKXB-DCdnh-vpxAJ-94GSQ`
- 05.cfg
- - 准星代码: `CSGO-Q4APO-buiyc-i9V7H-7sxJN-Zy8rN`
- 06.cfg
- - 准星代码: `CSGO-LpB26-mhWAt-srQVK-fEE34-BWxTC`

### 仓库活动

![仓库活动](https://repobeats.axiom.co/api/embed/55700fe0f86a32b2418b023fa87c8ec214153ef0.svg "Repobeats analytics image")