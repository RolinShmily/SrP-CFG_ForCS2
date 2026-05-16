---
title: autoexec.cfg
---

> 自启动基础设置，所有 CFG 的核心配置文件

- `crosshair_view.cfg` 默认启动，它存有基础的准星、视角设置代码。

## 功能表总览

| 功能 | 快捷键 | 控制台别名 |
| :---: | :---: | :---: |
| 前进 | `W` | - |
| 后退 | `S` | - |
| 向左 | `A` | - |
| 向右 | `D` | - |
| 普通攻击 | 鼠标左键 | - |
| 特殊攻击 | 鼠标右键 | - |
| 使用 | `E` | - |
| 装填弹药 | `R` | - |
| 检视 | `F` | - |
| 跳跃 | 空格/滚轮上下 | - |
| 蹲下 | `Ctrl` | - |
| 显示计分板 | `TAB` | - |
| 丢弃物品 | `G` | - |
| 选择队伍 | `M` | - |
| 静步 | `Shift` | - |
| 购买菜单 | `B` | - |
| 主武器 | `1` | - |
| 副武器 | `2` | |
| 匕首、电击枪 | `3` | - |
| 投掷物 | `4` | - |
| C4 | `5` | - |
| 雷 | `Z` | - |
| 火 | `V` | - |
| 闪 | `X` | - |
| 烟 | `C` | - |
| 诱饵弹 | `6` | - |
| 切换为最近武器 | `Q` | - |
| 喷漆 | `Y` | - |
| 团队聊天 | `U` | - |
| 全体聊天 | `I` | - |
| 语音 | `后侧键` | - |
| 快捷聊天轮盘 | `Alt` | - |
| 标点 | `前侧键` | - |
| 控制台 | `` ` `` | - |
| 切换左右手 | `H` | - |
| 雷达缩放 | `T` | - |
| 队友头顶标识 | `N` | - |
| 无线电菜单、医疗针 | `'` | - |
| 仅显示准星、击杀信息与雷达 | `-` | - |
| 投票同意 | `F1` | - |
| 投票拒绝 | `F2` | - |
| 购买手枪第五槽位 | `F3` | - |
| 购买步枪第二槽位 | `F4` | - |
| 购买手雷 | `F5` | - |
| 购买闪光 | `F6` | - |
| 购买烟雾 | `F7` | - |
| 购买燃烧弹 | `F8` | - |
| 购买半甲 | `F9` | - |
| 购买全甲 | `F10` | - |
| 购买钳子 | `F11` | - |
| 出售所有装备 | 退格键 | - |
| 总音量 30% | `Delete` | - |
| 重启 autoexec | `O` | `back` / `exec autoexec` |
| 加载预览检视模式 | `9` | `exec previewmode` |
| 匕首模型更换 | `J` | `exec knife` |
| 电击枪预设 | (默认关闭) | `zeus` / `exec zeus` |
| 跑图训练 | `P` | `exec practice` |
| 准星、持枪视角预设 | (默认启用) | `exec crosshair_view` |
| 武器自适应视角切换 | `[` | `exec autoview` |
| demo 预设 | `]` | `exec demo_hlae` |
| 平台发刀 | `K` | `say !drop` |
| 5E 平台报伤害 | `\` | `say .hp` |
| 默认左手持枪 | - | `lefthand` |
| 关闭狙击开枪后自动开镜 | - | `debounce` |
| 禁用卸下消音器 | - | `silencer` |
| 显示对局头像 | - | `avatars` |
| 显示对局人数 | - | `numbers` |
| 关闭曳光弹 | - | `tracer` |
| 启用快捷轮盘标点 | - | `ping` |
| 强制方形小地图 | - | `squareon` |
| POV 圆形小地图 | - | `squareoff` |
| 计分板圆形小地图 | - | `round` |
| 开启狙击镜扩散 | - | `sniperon` |
| 关闭狙击镜扩散 | - | `sniperoff` |
| n 为飞行，ralt 标识切换 | - | `flyn` |
| ralt 为飞行，n 标识切换 | - | `flyralt` |
| 默认飞行键 | `ralt` | - |
| 控制台打印游戏延迟 | - | `ps` |
| 打印游戏延迟详细信息 | - | `pd` |
| 开启常显装备栏 | - | `show` |
| 关闭常显装备栏 | - | `notshow` |
::: tip
⚠️下方为源码分区详解，最后更新日期为`2025.11.18`，版本号为`v1.1.0`
:::
## 鼠标相关设置

```cfg
sensitivity 0.5625                 // 灵敏度
zoom_sensitivity_ratio 1 		   // 开镜灵敏度
m_yaw 0.022                        // x轴速度
```
这里前两行都是对标游戏设置里的选项。

小技巧tips：在设置鼠标灵敏度时，使用控制台，是可以精准设置数字的。例如这里文件中设置的**0.5625**,如果你在游戏的那个设置条(Bar)上拉一个数字也是**0.562**,但是你在控制台中输入**sensitivity**，你会发现控制台提示，你的灵敏度是随机数比如**0.56234536456**。

对于第三项**x轴速度**，严格来说是游戏摄像机的**x轴角度系数**，但为了方便理解，还是用**x轴速度**吧，在CS中主要涉及到分辨率相关的问题。
我们知道现在的主流游戏、显示器、视频都是**16:9**，也就是我们日常使用电脑时的分辨率；而大多数CS玩家的复古分辨率**4:3拉伸**，会导致画面被水平拉伸至两侧，这样使游戏人物变**宽**,但也带来的问题就是鼠标的光标也被拉**宽**、水平速度变**快**了。

在游戏中默认**0.022**的**x轴速度**为**16:9**下的默认参数。也就是如果你游戏是**16:9**，那么鼠标的移动速度是和平时使用一样的；但如果你是**4:3拉伸**，拉伸带来的速度加快，也是会体现到你游戏视角中的。

为了匹配鼠标横向和纵向的移动速度，在**4:3拉伸**的情况下，可以调整参数为**0.0165**,还原到日常使用鼠标时带来的反馈速度。我这里没有调整，请自行按需尝试修改。

## 基础按键绑定
```cfg
bind "w" "+forward"                // 向前移动
bind "s" "+back"                   // 向后移动
bind "a" "+left"                   // 向左移动
bind "d" "+right"                  // 向右移动
bind "mouse1" "+attack"            // 普通攻击
bind "mouse2" "+attack2"           // 特殊攻击
bind "mouse_x" "yaw"               // 鼠标水平移动控制视角
bind "mouse_y" "pitch"             // 鼠标垂直移动控制视角
bind "e" "+use"                    // 使用/互动
bind "r" "+reload"                 // 装填弹药
bind "f" "+lookatweapon"           // 检视
bind "space" "+jump"               // 跳跃
bind "ctrl" "+duck"                // 蹲下
bind "tab" "+showscores"           // 显示计分板
bind "g" "drop"                    // 丢弃物品
bind "m" "teammenu"                // 打开队伍选择菜单
bind "shift" "+sprint"             // 静步
bind "b" "buymenu"                 // 打开购买菜单
bind "1" "slot1"                   // 主武器
bind "2" "slot2"                   // 副武器
bind "3" "slot3"                   // 匕首
bind "4" "slot11"                  // 电击枪
bind "5" "slot5"                   // C4
bind "z" "slot6;"                  // 雷
bind "x" "slot7"                   // 闪
bind "c" "slot8"                   // 烟
bind "6" "slot9"                   // 诱饵弹
bind "v" "slot10"                  // 火
bind "q" "lastinv"                 // 切换到上一个武器
bind "y" "+spray_menu"             // 打开喷漆菜单
bind "i" "messagemode2"            // 打开团队聊天
bind "u" "messagemode"             // 打开全局聊天
bind "mouse4" "+voicerecord"       // 语音
bind "alt" "+radialradio"          // 快捷聊天轮盘
bind "ralt" "noclip"               // 飞行键
bind "mouse5" "player_ping"		   // 玩家标记
bind "mwheeldown" "+jump"          // 鼠标滚轮向下跳跃
bind "mwheelup" "+jump"            // 鼠标滚轮向上跳跃
bind "`" "toggleconsole"                           // 打开/关闭控制台
bind "t" "switchhands"                             // 切换武器持握方式（左手/右手）
bind "h" "toggleradarscale"                        // 切换雷达缩放比例
bind "n" "toggle cl_teamid_overhead_mode 1 3"      // 切换队友头顶标识模式
bind "'" "radio2;slot12"                           // 打开无线电菜单、X光显示、医疗针
bind "-" "toggle cl_draw_only_deathnotices 1 0"    // 切换是否仅显示死亡通知与准星
bind "=" "toggle cl_drawhud_force_radar 0 1"       // 切换是否强制显示雷达
bind "f1" "vote 1"                                 // 投票选择同意
bind "f2" "vote 2"                                 // 投票选择拒绝
bind "f5" "buy hegrenade"                          // 购买高爆手雷
bind "f6" "buy flashbang"                          // 购买闪光弹
bind "f7" "buy smokegrenade"                       // 购买烟雾弹
bind "f8" "buy molotov;buy incgrenade"             // 购买燃烧瓶/燃烧弹
bind "f9" "buy vest"                               // 购买防弹衣
bind "f10" "buy vesthelm"                          // 购买防弹衣+头盔
bind "f11" "buy defuser"                           // 购买拆弹器
bind "f4" "buy rifle1"                             // 购买主武器（步枪第二槽位）
bind "f3" "buy secondary4"                         // 购买副武器（手枪第五槽位）
bind "backspace" "sellbackall"                     // 出售所有已购买物品
bind "del" "toggle volume 0.10 1.00"               // 切换总音量为30%
```
没什么特别要说的，都是直意注释，将你的按键替换掉原来的按键即可。

飞行键当然只能在跑图作弊模式使用，请不要问我为什么竞技模式按了不能飞。

队友头顶显示、仅显示雷达、准星等功能可以到视频里观看效果。

购买主武器和副武器等功能，可以尽情发挥。这里我的游戏中步枪第二槽位放的AK、M4，手枪第五槽位放的沙鹰。

最后一个一键消音是死斗神器说是，避免枪声过大导致耳聋。

如果你希望使用游戏默认的4号键轮切投掷物，或者滚轮切换装备请自行使用：
```cfg
bind "4" "slot4"
bind "mwheeldown" "invnext"
bind "mwheelup" "invprev"
```
需要注意的是，该套CFG中的4号键切换电击枪是强绑定的。如果你修改了4号键功能，并使用该套CFG(而不是单独使用autoexec)的话，需要删除`exec zeus.cfg`代码行或者删除`zeus.cfg`文件，否则你的4号键功能会异常。

## 联动CFG启动按键

```cfg
exec zeus.cfg                                      // 默认启动，电击枪自动切换。
bind "o" "exec autoexec;"                          // 恢复默认准星与持枪视角
bind "j" "exec knife.cfg;"                         // 更换匕首模型
bind "p" "exec practice.cfg;"                         // 加载跑图预设
bind "[" "exec crosshair_view;"                    // 准星与持枪预设
bind "]" "exec demo_hlae.cfg;"                     // demo预设
bind "k" "say_team !drop"                          // 一键发刀(平台)
bind "\" "say_team .hp"                            // 伤害统计(5E平台)
```
看到的兄弟们有福了，虽然说是联动CFG，但我写文章时才发现把一键发刀和报伤害也写到这里了。

其实是很简单的功能了，你也可以随便写个比如一键暂停，对面掉人了卡投票(很恶意，不提倡)。

## 基础准星
```cfg
crosshair true                                       // 启用准星
//──────────────────────  自定义准星替换区  ─────────────────────────────
cl_crosshair_drawoutline "false"                     // 禁用准星轮廓绘制
cl_crosshair_dynamic_maxdist_splitratio "0.300000"   // 动态准星最大分离距离的比例
cl_crosshair_dynamic_splitalpha_innermod "1.000000"  // 动态准星内部分离部分的透明度
cl_crosshair_dynamic_splitalpha_outermod "0.500000"  // 动态准星外部分离部分的透明度
cl_crosshair_dynamic_splitdist "7"                   // 动态准星分离距离
cl_crosshair_outlinethickness "1.000000"             // 准星轮廓的厚度（如果启用轮廓）
cl_crosshair_recoil "false"                          // 禁用准星随武器后坐力动态变化
cl_crosshair_t "false"                               // 禁用T形准星
cl_crosshairalpha "255"                              // 准星的透明度（255为完全不透明）
cl_crosshaircolor "5"                                // 准星颜色（5为自定义颜色）
cl_crosshaircolor_b "255"                            // 准星颜色的蓝色分量（RGB）
cl_crosshaircolor_g "255"                            // 准星颜色的绿色分量（RGB）
cl_crosshaircolor_r "255"                            // 准星颜色的红色分量（RGB）
cl_crosshairdot "false"                              // 禁用准星中心点
cl_crosshairgap "-3.400000"                          // 准星间隙大小（负值表示准星向内收缩）
cl_crosshairgap_useweaponvalue "false"               // 禁用根据武器调整准星间隙
cl_crosshairsize "0.900000"                          // 准星大小
cl_crosshairstyle "4"                                // 准星样式（4为经典静态准星）
cl_crosshairthickness "0.800000"                     // 准星线条的厚度
cl_crosshairusealpha "true"                          // 启用准星透明度设置
//───────────────────────────────────────────────────────────────────────────
```
唯一要说的也就`crosshair true`了吧，说来这是之前有位朋友玩游戏时发现没有准星，我告知它可能是这条命令参数被设置为了0(false)，故将此代码加入至该文件。

## 狙击镜准星
```cfg
cl_crosshair_sniper_width "2"						 // 狙击镜准星线粗细
cl_sniper_show_inaccuracy 1                          // 狙击镜扩散开启
```
依旧直意。

## 投掷物准星
```cfg
cl_grenadecrosshair_decoy 1               // 启用诱饵弹的投掷轨迹准星
cl_grenadecrosshair_explosive 1           // 启用爆炸物（如手雷）的投掷轨迹准星
cl_grenadecrosshair_fire 1                // 启用燃烧弹的投掷轨迹准星
cl_grenadecrosshair_flash 1               // 启用闪光弹的投掷轨迹准星
cl_grenadecrosshair_keepusercrosshair 1   // 投掷时保留玩家自定义准星
cl_grenadecrosshair_smoke 1               // 启用烟雾弹的投掷轨迹准星
cl_grenadecrosshairdelay_decoy "0.50"     // 设置诱饵弹投掷轨迹准星的延迟时间
cl_grenadecrosshairdelay_explosive "0.50" // 设置爆炸物投掷轨迹准星的延迟时间
cl_grenadecrosshairdelay_fire "0.50"      // 设置燃烧弹投掷轨迹准星的延迟时间
cl_grenadecrosshairdelay_flash "0.50"     // 设置闪光弹投掷轨迹准星的延迟时间
cl_grenadecrosshairdelay_smoke "0.50"     // 设置烟雾弹投掷轨迹准星的延迟时间
```
关键就是设置一个延迟时间吧，0.5是差不多拉完栓顿一下就会出现坐标轴准星了。

## 准星杂项
```cfg
cl_observed_bot_crosshair 2               // 观察机器人时显示准星（2为始终显示）
cl_show_observer_crosshair 2              // 观察其他玩家时显示准星（2为始终显示）
cl_teamid_overhead_fade_near_crosshair "0.5" // 设置队友ID在准星附近时的淡出距离
```
直意。

## 持枪视角
```cfg
viewmodel_fov 68                  // 设置视角模型（武器）的视野范围
viewmodel_offset_x 2              // 调整视角模型在X轴上的偏移（左右位置）
viewmodel_offset_y 2              // 调整视角模型在Y轴上的偏移（前后位置）
viewmodel_offset_z -1             // 调整视角模型在Z轴上的偏移（上下位置）
viewmodel_presetpos 0             // 预设的视角模型
```
直意。

## 雷达
```cfg
cl_radar_always_centered "0"        // 雷达不居中，显示整个地图
cl_radar_scale "0.37"               // 设置雷达缩放比例为 0.37
cl_hud_radar_scale "1"              // 设置 HUD 雷达缩放比例为 1
cl_teammate_colors_show "2"         // 显示队友颜色为 2（默认颜色模式）
cl_radar_icon_scale_min "0.6"       // 设置雷达图标最小缩放比例为 0.6
cl_radar_rotate "1"                 // 雷达随玩家视角旋转
cl_radar_square_always 0            // 不强制方形小地图
cl_radar_square_with_scoreboard 1   // 计分板地图为方形
```
这个设置是所有地图都可以从小地图看到完整地图的，第一时间获取重要信息。

设置完整小地图是对单排玩家极其利好的，很多时候队友报点甚至不如自己看到的一手信息。

## 网络、延迟、帧数显示
```cfg
cl_hud_telemetry_frametime_show 2  // 显示帧生成时间及FPS
cl_hud_telemetry_ping_show 2       // 显示延迟
mm_dedicated_search_maxping "70"   // 设置匹配时允许的最大 ping 值
```
依旧是直意。

匹配时最大ping值，如果你使用的加速器效果不好，但又在打国际服，可以把这个参数设置大一些，能让你匹配到除香港之外比如东南亚的玩家。

## 杂项
```cfg
cl_prefer_lefthanded 0             // 右手持枪（默认）
cl_debounce_zoom 0                 // 按住开镜键持续切换
cl_silencer_mode 1                 // 开启卸下消音器
cl_use_opens_buy_menu "0"          // 关闭E键打开购买菜单
cl_dm_buyrandomweapons 0           // 关闭死斗随机买枪
cl_teamcounter_playercount_instead_of_avatars 1 // 显示上层对局存活数字(1)或者头像(0)
r_drawtracers_firstperson 1        // 显示曳光弹
r_fullscreen_gamma 2.6             // 设置亮度
cl_teamid_overhead_mode 3          // 隔墙显示队友位置
cl_teamid_overhead_colors_show 1   // 玩家ID上使用玩家颜色
```
直意。

## 快捷聊天轮盘
```cfg
cl_radial_radio_tap_to_ping false  // 关闭“地图标记”功能
cl_radial_radio_tab 0              // 当前激活标签页：0（后续可通过操作切换1/2页）
cl_radial_radio_tab_0_text_1 #Chatwheel_grenade         // 第0页选项1：请求手雷
cl_radial_radio_tab_0_text_2 #Chatwheel_sniperspotted   // 第0页选项2：发现狙击手
cl_radial_radio_tab_0_text_3 #Chatwheel_fire            // 第0页选项3：开火指令
cl_radial_radio_tab_0_text_4 #Chatwheel_fallback        // 第0页选项4：撤退指令
cl_radial_radio_tab_0_text_5 #Chatwheel_smoke           // 第0页选项5：请求烟雾弹
cl_radial_radio_tab_0_text_6 #Chatwheel_gogogo          // 第0页选项6：进攻指令（冲！）
cl_radial_radio_tab_0_text_7 #Chatwheel_flashbang       // 第0页选项7：请求闪光弹
cl_radial_radio_tab_0_text_8 #Chatwheel_needbackup      // 第0页选项8：需要支援
cl_radial_radio_tab_1_text_1 #Chatwheel_requestweapon   // 第1页选项1：请求武器
cl_radial_radio_tab_1_text_2 #Chatwheel_requestspend    // 第1页选项2：请求经济支援
cl_radial_radio_tab_1_text_3 #Chatwheel_bplan           // 第1页选项3：B点战术计划
cl_radial_radio_tab_1_text_4 #Chatwheel_heardnoise      // 第1页选项4：听到动静（有声音）
cl_radial_radio_tab_1_text_5 #Chatwheel_midplan         // 第1页选项5：中路战术计划
cl_radial_radio_tab_1_text_6 #Chatwheel_ihavethebomb    // 第1页选项6：我持有炸弹
cl_radial_radio_tab_1_text_7 #Chatwheel_aplan           // 第1页选项7：A点战术计划
cl_radial_radio_tab_1_text_8 #Chatwheel_requestecoround // 第1页选项8：请求经济局（eco）
cl_radial_radio_tab_2_text_1 #Chatwheel_affirmative     // 第2页选项1：收到/同意
cl_radial_radio_tab_2_text_2 #Chatwheel_negative        // 第2页选项2：拒绝/不同意
cl_radial_radio_tab_2_text_3 #Chatwheel_compliment      // 第2页选项3：称赞（打得好）
cl_radial_radio_tab_2_text_4 #Chatwheel_thanks          // 第2页选项4：感谢
cl_radial_radio_tab_2_text_5 #Chatwheel_cheer           // 第2页选项5：加油/鼓舞
cl_radial_radio_tab_2_text_6 #Chatwheel_peptalk         // 第2页选项6：打气（稳住）
cl_radial_radio_tab_2_text_7 #Chatwheel_sorry           // 第2页选项7：抱歉
cl_radial_radio_tab_2_text_8 #Chatwheel_sectorclear     // 第2页选项8：区域安全
```
这里没有使用之前很火的轮盘切换道具瞄点(有点太折腾了，效果又不如你在实战中多丢几次，不过回味轮盘买装备倒是挺有趣)，而是直接用游戏内置的一些文本和图标，匹配游戏内置的语音信息。

这里你可以根据游戏中的效果，自行将`#Chatwheel_fire`等参数修改到你想要的位置。

## 声音
```cfg
volume 1                              // 主音量
snd_headphone_eq 0                    // 均衡器
snd_menumusic_volume 0.03             // 主菜单音乐音量
snd_roundstart_volume 0               // 回合开始音量
snd_roundend_volume 0.02              // 回合结束音量
snd_roundaction_volume 0              // 回合开始行动音量
snd_mvp_volume 0.12                   // MVP音量
snd_mapobjective_volume 0.12          // 炸弹/人质音量
snd_tensecondwarning_volume 0.08      // 十秒警告音量
snd_deathcamera_volume 0.08           // 死亡视角音量
snd_mute_mvp_music_live_players 1     // 当双方团队成员都存活时关闭 MVP 音乐
snd_mute_losefocus 0                  // 后台播放声音
voice_modenable 1                     // 启用语音
```
直意。

## HUD界面
```cfg
hud_showtargetid "1"               // 显示队友/敌人的 ID
hud_scaling "0.85"                 // 设置 HUD 缩放比例
safezonex "0.88"                   // 设置 HUD 水平占比
safezoney "0.905"                  // 设置 HUD 竖直占比
cl_color "4"                       // 设置队伍中玩家颜色
cl_hud_color "0"                   // 设置 HUD 颜色
cl_showloadout "0"                 // 不总显示物品栏
```
HUD水平和竖直占比，在游戏中拉条(Bar)设置的话，是有极限的，但在控制台，你可以尽可能将HUD集中。我这里的设置是保守的，偏集中，而不是默认的抵住顶部底部边缘。

HUD颜色可以看下面的颜色代码，自行选择一个默认值，或者利用下面的代码定义别名，控制台输入别名进行更换，默认值0为灰白色。

不总显示物品栏就是你走路时不切换装备，就会隐藏掉主武器副武器和刀的右下角显示。

## 其他
```cfg
con_enable "1"                     // 启用开发者控制台
fps_max 0                          // 帧率无上限
cl_join_advertise "2"              // 公开游戏会话
gameinstructor_enable "0"          // 禁用教学提示系统
cl_autohelp "false"                // 禁用自动帮助提示
func_break_max_pieces 0            // 可破坏物体破碎时最大碎片数
r_show_build_info 0                // 关闭版本信息
spec_replay_autostart 0            // 关闭被击杀回放
```
一些无人在意的小设置。
## HUD颜色更改
```cfg
alias "lwhite" "cl_hud_color 1;echo HUD更改为灰白色!"
alias "bwhite" "cl_hud_color 2;echo HUD更改为亮白色!"
alias "lblue" "cl_hud_color 3;echo HUD更改为浅蓝色!"
alias "blue" "cl_hud_color 4;echo HUD更改为深蓝色!"
alias "purple" "cl_hud_color 5;echo HUD更改为紫色!"
alias "red" "cl_hud_color 6;echo HUD更改为红色!"
alias "orange" "cl_hud_color 7;echo HUD更改为橙色!"
alias "yellow" "cl_hud_color 8;echo HUD更改为黄色!"
alias "green" "cl_hud_color 9;echo HUD更改为绿色!"
alias "cyan" "cl_hud_color 10;echo HUD更改为青绿色!"
alias "pink" "cl_hud_color 11;echo HUD更改为粉色!"
```
可以结合这里的颜色参数(1,2,3...)将上面HUD界面提到的`cl_hud_color 0`设置为你想要的颜色。

这里前边的别名(lwhite、bwhite)是在控制台输入时，即可执行后面的命令。
## 控制台功能别名绑定
```cfg
alias "lefthand" "cl_prefer_lefthanded 1;echo 默认左手持枪!"
alias "debounce" "cl_debounce_zoom 1;echo 关闭连镜切换!"
alias "silencer" "cl_silencer_mode 0;echo 关闭卸下消音器!"
alias "avatars" "cl_teamcounter_playercount_instead_of_avatars 0;echo 显示对局头像!"
alias "numbers" "cl_teamcounter_playercount_instead_of_avatars 1;echo 显示对局数字!"
alias "tracer" "r_drawtracers_firstperson 0;echo 关闭曳光弹!"
alias "ping" "cl_radial_radio_tap_to_ping true;echo 快捷轮盘启用标点!"
alias "squareon" "cl_radar_square_always 1;echo 强制方形小地图!"
alias "squareoff" "cl_radar_square_always 0;echo 取消强制方形小地图!"
alias "round" "cl_radar_square_with_scoreboard 0;echo 计分板地图为圆形!"
alias "sniperon" "cl_sniper_show_inaccuracy 1;echo 已开启狙击镜扩散!"
alias "sniperoff" "cl_sniper_show_inaccuracy 0;echo 已关闭狙击镜扩散!"
alias "flyn" "bind "n" "noclip";bind "ralt" "toggle cl_teamid_overhead_mode 1 3";echo 已绑定"n"为飞行，"ralt"为队友标识切换！"
alias "flyralt" "bind "ralt" "noclip";bind "n" "toggle cl_teamid_overhead_mode 1 3";echo 已绑定"ralt"为飞行，"n"为队友标识切换！"
alias "ps" "cl_ticktiming print summary;echo 显示服务器tick信息!"
alias "pd" "cl_ticktiming print detail;echo 显示服务器tick详细信息!"
alias "show" "cl_showloadout 1;echo 常显装备栏!"
alias "notshow" "cl_showloadout 0;echo 取消常显装备栏!"
```
具体可见控制台导航的提示信息，这一部分是为了实现那里提到的功能。
## 准星、视角查询初始化
```cfg
alias "whoamic" "echo 您还未启动准星视角预设CFG,请按']'键启动准星视角预设!"
alias "whoamiv" "echo 您还未启动准星视角预设CFG,请按']'键启动准星视角预设!"
```
这里需要搭配`crosshair_view.cfg`使用。单独使用`autoexec`则可以删掉这部分。

这里的两行是取消掉任何绑定的F1、F2功能，让它们回到本身的默认功能，也即同意或拒绝投票。
原因是在2025.8.15更新后，平台投票功能，无法使用`vote 1/2`来实现，尚未知晓原因，故直接改为默认。
## 控制台导航
```cfg
echo ══════════════════════════════════════════════════════════════════
echo       ____           ____             ____   _____    ____
echo      / ___|   _ __  |  _ \           / ___| |  ___|  / ___|
echo      \___ \  | '__| | |_) |  _____  | |     | |_    | |  _
echo       ___) | | |    |  __/  |_____| | |___  |  _|   | |_| |
echo      |____/  |_|    |_|              \____| |_|      \____|
echo ══════════════════════════════════════════════════════════════════
echo 文档地址：https://doc.srprolin.top/posts/SrP-CFG_CS2/srpcfg-1.html
echo autoexec Enabled!
echo ═════════════════════════════════════════════════════════════
echo ──────────────────────  更新报告  ─────────────────────────────
echo 2025.08.15更新后F1、F2默认绑定为投票，需要取消自定义绑定
echo ──────────────────────  HUD颜色更换  ─────────────────────────────
echo ·输入 lwhite → 灰白色 | cl_hud_color 1;
echo ·输入 bwhite → 亮白色   | cl_hud_color 2;
echo ·输入 lblue →  浅蓝色   | cl_hud_color 3;
echo ·输入 blue  →  蓝色   | cl_hud_color 4;
echo ·输入 purple → 紫色   | cl_hud_color 5;
echo ·输入 red   →  红色   | cl_hud_color 6;
echo ·输入 orange → 橙色   | cl_hud_color 7;
echo ·输入 yellow → 黄色   | cl_hud_color 8;
echo ·输入 green →  绿色   | cl_hud_color 9;
echo ·输入 cyan  →  青绿色   | cl_hud_color 10;
echo ·输入 pink  →  粉色   | cl_hud_color 11;
echo ──────────────────────  常用指令  ─────────────────────────────
echo ·输入 lefthand → 切换默认左手持枪 | cl_prefer_lefthanded 1;
echo ·输入 debounce → 关闭连镜切换         | cl_debounce_zoom 1;
echo ·输入 silencer → 禁用卸下消音器   | cl_silencer_mode 0;
echo ·输入 avatars → 显示对局头像      | cl_teamcounter_playercount_instead_of_avatars 0;
echo ·输入 numbers → 显示对局数字      | cl_teamcounter_playercount_instead_of_avatars 1;
echo ·输入 tracer → 关闭曳光弹         | r_drawtracers_firstperson 0;
echo ·输入 ping → 开启快捷轮盘标点     | cl_radial_radio_tap_to_ping true;
echo ·输入 squareon → 强制方形小地图     | cl_radar_square_always 1;
echo ·输入 squareoff → 取消强制方形小地图  | cl_radar_square_always 0;
echo ·输入 round → 计分板地图为圆形    | cl_radar_square_with_scoreboard 0;
echo ·输入 clear → 清除控制台           | clear;
echo ·输入 cvarlist → 显示所有控制台指令    | cvarlist;
echo ·输入 status → 显示steamID         | status;
echo ·输入 sniperon → 显示狙击镜扩散     | cl_sniper_show_inaccuracy 1;
echo ·输入 sniperoff → 关闭狙击镜扩散     | cl_sniper_show_inaccuracy 0;
echo ·输入 flyn → 开启n键飞行           | bind "n" "noclip";
echo ·输入 flyralt → 开启ralt键飞行      | bind "ralt" "noclip";
echo ·输入 ps → 显示当前游戏延迟总结      | cl_ticktiming print summary;
echo ·输入 pd → 显示当前游戏延迟详情      | cl_ticktiming print detail;
echo ·输入 show → 常显装备栏    			| cl_showloadout 1；
echo ·输入 notshow → 取消常显装备栏      | cl_showloadout 0；
echo ────快捷轮盘当前激活标签页：0（切换1/2页）  | cl_radial_radio_tab 0;
echo ───────────────────────  快捷键  ─────────────────────────────
echo ──── 重启autoexec  		    : O键 | exec autoexec
echo ──── 跑图,练习道具  			:  P键 | exec practice
echo ──── 更换匕首模型 			    :  J键 | exec knife
echo ──── demo观赛预设(含HLAE) 	     :  ]键 | exec demo_hlae
echo ──── 一键发刀(平台) 	        :  K键 | say_team !drop
echo ──── 一键伤害提示(5E平台)	    :  \键 | say_team .hp
echo ──── 准星与持枪视角预设         :  [键 | exec crosshair_view
echo ──── 切换雷达缩放比例           :  h键 | toggleradarscale
echo ──── 切换是否仅显示死亡通知与准星:  -键 | toggle cl_draw_only_deathnotices 1 0
echo ──── 切换是否强制显示雷达       :  =键 | toggle cl_drawhud_force_radar 1 0
echo ──── 快捷聊天轮盘              : alt键 | +radialradio
echo ──── 默认飞行键                : ralt键 | noclip
echo ──── 一键消音至30%  		    : delete键 | toggle volume 0.10 1.00
echo ──── 购买雷、闪、烟、火、半甲、全甲、钳 : F5|F6|F7|F8|F9|F9|F10|F11
echo ──── 出售所有已购买物品 		 : backspace键 | sellbackall
echo ──── 以下功能，在跑图模式下，产生按键冲突，后启动的模式按键优先：
echo ──── 切换队友头顶标识模式       : n键 toggle cl_teamid_overhead_mode 1 3
echo ═════════════════════════════════════════════════════════════
```
