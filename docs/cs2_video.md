---
title: cs2_video.txt
description: CS2 视频设置预设（RTX 4060，1440x1080，4:3）
---

> CS2 视频设置配置文件（KV3 格式）

## 简介

cs2_video.txt 是 CS2 的视频设置文件，采用 KV3 格式。此预设针对 RTX 4060 显卡优化，分辨率 1440x1080（4:3），偏向竞技低画质高帧率设置。

## 安装方式

> **注意：** 此文件需要安装到 Steam 用户配置目录，不是 `csgo/cfg/`。请使用安装器自动安装，或参考 [使用指南](/docs/srpcfg-3) 中的手动安装步骤。文件中的注释在使用时需删除。

安装路径：`Steam/userdata/{好友代码}/730/local/cfg/cs2_video.txt`

## 设置一览

| 设置项 | 值 | 说明 |
| :--- | :--- | :--- |
| 分辨率 | 1440x1080 | 4:3 |
| 显示模式 | 无边框窗口 | `fullscreen 0` + `nowindowborder 1`，即全屏窗口化 |
| V-sync | 关闭 | 减少输入延迟 |
| 低延迟模式 | 开启 | NVIDIA Reflex |
| MSAA | 4x | 多重采样抗锯齿 |
| CMAA | 关闭 | |
| 阴影质量 | 低 | 竞技需要看到敌人影子 |
| 动态阴影 | 开启 | |
| 贴图细节 | 低 | |
| 贴图过滤 | 异向 8X | |
| 光影细节 | 低 | |
| 粒子细节 | 低 | |
| 环境光遮蔽 | 禁用 | |
| HDR | 性能 | |
| FSR | 禁用 | |

## 完整文件内容

```txt
"video.cfg"
{
	"Version"		"16"
	"VendorID"		"4318"
	"DeviceID"		"10464"
	"setting.cpu_level"		"3"
	"setting.gpu_mem_level"		"3"
	"setting.gpu_level"		"3"
	"setting.knowndevice"		"0"
	"setting.monitor_index"		"0"
	"setting.defaultres"		"1440"
	"setting.defaultresheight"		"1080"
	"setting.aspectratiomode"		"0"
	"setting.refreshrate_numerator"		"0"
	"setting.refreshrate_denominator"		"0"
	"setting.fullscreen"		"0"
	"setting.coop_fullscreen"		"1"
	"setting.nowindowborder"		"1"
	"setting.fullscreen_min_on_focus_loss"		"0"
	"setting.high_dpi"		"0"
	"setting.mat_vsync"		"0"
	"setting.r_low_latency"		"1"
	"AutoConfig"		"2"
	"setting.msaa_samples"		"4"
	"setting.r_csgo_cmaa_enable"		"0"
	"setting.videocfg_shadow_quality"		"0"
	"setting.videocfg_dynamic_shadows"		"1"
	"setting.videocfg_texture_detail"		"0"
	"setting.r_texturefilteringquality"		"3"
	"setting.shaderquality"		"0"
	"setting.videocfg_particle_detail"		"0"
	"setting.videocfg_ao_detail"		"0"
	"setting.videocfg_hdr_detail"		"3"
	"setting.videocfg_fsr_detail"		"0"
}
```

## 逐项配置说明

下表覆盖文件里全部 32 个键。**本预设值** 一列是 `config/video/cs2_video.txt` 实际写入的值。

> 带 ⚙ 的键由游戏按当前硬件写入（显卡识别码、显示器索引、刷新率），换机器后 CS2 会自己改写，**照抄到别的电脑没有意义**。

### 一、文件标识与显卡识别

| 键 | 本预设值 | 含义 | 取值 |
| :--- | :--- | :--- | :--- |
| `Version` ⚙ | 16 | 视频配置文件的格式版本号 | 随 CS2 版本变化，不要手改 |
| `VendorID` ⚙ | 4318 | 显卡厂商识别码（4318 = NVIDIA） | 由游戏写入 |
| `DeviceID` ⚙ | 10464 | 显卡设备识别码（10464 = RTX 4060） | 由游戏写入 |
| `setting.knowndevice` | 0 | 是否已记住当前 GPU；0 = 未记住，游戏每次重新探测 | 0 / 1 |
| `setting.monitor_index` ⚙ | 0 | 输出到第几台显示器；0 = 主显示器 | 0 起的显示器索引 |

### 二、性能等级

| 键 | 本预设值 | 含义 | 取值 |
| :--- | :--- | :--- | :--- |
| `setting.cpu_level` | 3 | CPU 性能等级梯队，影响物理/粒子的预算 | 0–3，越高越吃 CPU |
| `setting.gpu_mem_level` | 3 | 显存等级梯队 | 0–3 |
| `setting.gpu_level` | 3 | GPU 性能等级梯队 | 0–3 |
| `AutoConfig` | 2 | 自动配置等级；2 = 自定义，不再按硬件自动改写画质 | 见下方说明 |

> `AutoConfig` 是这套文件里最关键的一项：**2 表示「自定义」**，游戏启动时不会重新套用硬件推荐的画质档，上面手改的画质项才留得住。若不是 2，改完的画质可能在下次启动被自动配置覆盖。

### 三、分辨率与显示模式

| 键 | 本预设值 | 含义 | 取值 |
| :--- | :--- | :--- | :--- |
| `setting.defaultres` | 1440 | 分辨率宽度 | 游戏支持的分辨率宽度 |
| `setting.defaultresheight` | 1080 | 分辨率高度 | 与宽度配对，1440x1080 即 4:3 |
| `setting.aspectratiomode` | 0 | 宽高比模式 | 0 = 自动（按分辨率推断），1 = 4:3，2 = 16:9 |
| `setting.fullscreen` | 0 | 独占全屏开关 | 0 = 否，1 = 是 |
| `setting.nowindowborder` | 1 | 无边框窗口 | 0 = 有边框，1 = 无边框 |
| `setting.coop_fullscreen` | 1 | 合作模式的全屏开关，CS2 已无该模式，属遗留键 | 0 / 1 |
| `setting.fullscreen_min_on_focus_loss` | 0 | 全屏窗口失去焦点时是否最小化 | 0 = 不最小化（切出仍渲染），1 = 最小化 |
| `setting.high_dpi` | 0 | 高 DPI 缩放，影响 UI 尺寸与鼠标坐标 | 0 = 关闭，1 = 开启 |
| `setting.refreshrate_numerator` ⚙ | 0 | 刷新率分子 | 0 = 用系统默认；否则按 `分子/分母` 解析 |
| `setting.refreshrate_denominator` ⚙ | 0 | 刷新率分母 | 同上 |

> 本预设用 **`fullscreen 0` + `nowindowborder 1`**，即「全屏窗口化（无边框）」：切窗口不黑屏、不重排窗口。配合 `fullscreen_min_on_focus_loss 0`，切出游戏后画面继续渲染，直播/录屏时不会掉帧。

### 四、同步与延迟

| 键 | 本预设值 | 含义 | 取值 |
| :--- | :--- | :--- | :--- |
| `setting.mat_vsync` | 0 | 垂直同步 | 0 = 关闭（降低输入延迟），1 = 开启 |
| `setting.r_low_latency` | 1 | NVIDIA Reflex 低延迟模式 | 0 = 关闭，1 = 开启，2 = 开启 + Boost |

### 五、抗锯齿

| 键 | 本预设值 | 含义 | 取值 |
| :--- | :--- | :--- | :--- |
| `setting.msaa_samples` | 4 | 多重采样抗锯齿（MSAA）采样数 | 0 = 关闭，2 / 4 / 8 = 2x / 4x / 8x |
| `setting.r_csgo_cmaa_enable` | 0 | CMAA 抗锯齿 | 0 = 关闭，1 = 开启 |

> MSAA 4x 是本预设里最重的一项。要更高帧率可降到 2x 或 0，代价是画面边缘明显变毛糙。

### 六、画质分级

| 键 | 本预设值 | 含义 | 取值 |
| :--- | :--- | :--- | :--- |
| `setting.videocfg_shadow_quality` | 0 | 全局阴影质量 | 0 = 低，1 = 中，2 = 高，3 = 非常高 |
| `setting.videocfg_dynamic_shadows` | 1 | 动态阴影（会动的物体是否投影） | 0 = 关，1 = 开 |
| `setting.videocfg_texture_detail` | 0 | 模型 / 贴图细节 | 0 = 低，1 = 中，2 = 高 |
| `setting.r_texturefilteringquality` | 3 | 贴图过滤模式 | 0 = 双线性，1 = 三线性，2–5 = 异向 2X / 4X / 8X / 16X |
| `setting.shaderquality` | 0 | 光影细节 | 0 = 低，1 = 高 |
| `setting.videocfg_particle_detail` | 0 | 粒子细节 | 0 = 低，1 = 中，2 = 高，3 = 非常高 |
| `setting.videocfg_ao_detail` | 0 | 环境光遮蔽（AO） | 0 = 禁用，2 = 中，3 = 高 |
| `setting.videocfg_hdr_detail` | 3 | HDR 处理方式 | -1 = 品质，3 = 性能 |
| `setting.videocfg_fsr_detail` | 0 | AMD FSR 超分辨率 | 0 = 禁用，1 = 超高品质，2 = 品质，3 = 均衡，4 = 性能 |

> 竞技取向的取舍：阴影质量给到**低但不关动态阴影**——低阴影仍然看得见敌人的影子，关掉动态阴影则会失去「人走过、影子还在动」这类信息。贴图细节、粒子、AO 全压到最低，是为了减少视线干扰与 GPU 开销。

## 相关文件

- [使用指南](/docs/srpcfg-3) — 安装指南（含视频预设安装步骤）

## 注意事项

- 此设置针对 RTX 4060 优化，其他显卡可能需要调整 GPU/CPU 等级
- 修改后如游戏异常，删除此文件即可恢复游戏默认视频设置
- 使用前需删除文件中的所有注释（`//` 开头的内容）
