---
title: cs2_video.txt
description: CS2 视频设置预设（RTX 4060，1280x960，4:3）
---

> CS2 视频设置配置文件（KV3 格式）

## 简介

cs2_video.txt 是 CS2 的视频设置文件，采用 KV3 格式。此预设针对 RTX 4060 显卡优化，分辨率 1280x960（4:3），偏向竞技低画质高帧率设置。

## 安装方式

> **注意：** 此文件需要安装到 Steam 用户配置目录，不是 `csgo/cfg/`。请使用安装器自动安装，或参考 [使用指南](/docs/srpcfg-3) 中的手动安装步骤。文件中的注释在使用时需删除。

安装路径：`Steam/userdata/{好友代码}/730/local/cfg/cs2_video.txt`

## 设置一览

| 设置项 | 值 | 说明 |
| :--- | :--- | :--- |
| 分辨率 | 1280x960 | 4:3 拉伸 |
| 全屏模式 | 开启 | 无边框窗口 |
| V-sync | 关闭 | 减少输入延迟 |
| 低延迟模式 | 开启 | NVIDIA Reflex |
| MSAA | 4x | 多重采样抗锯齿 |
| CMAA | 关闭 | |
| 阴影质量 | 高 | 竞技需要看到敌人影子 |
| 动态阴影 | 开启 | |
| 贴图细节 | 中 | |
| 贴图过滤 | 异向 8X | |
| 光影细节 | 低 | |
| 粒子细节 | 低 | |
| 环境光遮蔽 | 禁用 | |
| HDR | 品质 | |
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
	"setting.defaultres"		"1280"
	"setting.defaultresheight"		"960"
	"setting.aspectratiomode"		"0"
	"setting.refreshrate_numerator"		"0"
	"setting.refreshrate_denominator"		"0"
	"setting.fullscreen"		"1"
	"setting.coop_fullscreen"		"0"
	"setting.nowindowborder"		"1"
	"setting.fullscreen_min_on_focus_loss"		"1"
	"setting.high_dpi"		"0"
	"setting.mat_vsync"		"0"
	"setting.r_low_latency"		"1"
	"AutoConfig"		"2"
	"setting.msaa_samples"		"4"
	"setting.r_csgo_cmaa_enable"		"0"
	"setting.videocfg_shadow_quality"		"2"
	"setting.videocfg_dynamic_shadows"		"1"
	"setting.videocfg_texture_detail"		"1"
	"setting.r_texturefilteringquality"		"3"
	"setting.shaderquality"		"0"
	"setting.videocfg_particle_detail"		"0"
	"setting.videocfg_ao_detail"		"0"
	"setting.videocfg_hdr_detail"		"-1"
	"setting.videocfg_fsr_detail"		"0"
}
```

## 各参数说明

| 参数 | 值 | 说明 |
| :--- | :--- | :--- |
| VendorID | 4318 | 显卡厂商识别码（NVIDIA） |
| DeviceID | 10464 | 显卡设备识别码（RTX 4060） |
| cpu_level / gpu_mem_level / gpu_level | 3 | CPU/GPU 性能等级（高） |
| aspectratiomode | 0 | 宽高比（0=自动，1=4:3，2=16:9） |
| fullscreen | 1 | 全屏模式 |
| nowindowborder | 1 | 无边框窗口 |
| msaa_samples | 4 | MSAA 采样数（0/2/4/8） |
| videocfg_shadow_quality | 2 | 阴影质量（0=低，1=中，2=高，3=非常高） |
| videocfg_texture_detail | 1 | 贴图细节（0=低，1=中，2=高） |
| r_texturefilteringquality | 3 | 贴图过滤（0-5：双线性到异向 16X） |
| shaderquality | 0 | 光影细节（0=低，1=高） |
| videocfg_particle_detail | 0 | 粒子细节（0=低 ~ 3=非常高） |
| videocfg_ao_detail | 0 | 环境光遮蔽（0=禁用，2=中，3=高） |
| videocfg_hdr_detail | -1 | HDR（-1=品质，3=性能） |
| videocfg_fsr_detail | 0 | FSR（0=禁用，1-4=超高品质到性能） |

## 相关文件

- [使用指南](/docs/srpcfg-3) — 安装指南（含视频预设安装步骤）

## 注意事项

- 此设置针对 RTX 4060 优化，其他显卡可能需要调整 GPU/CPU 等级
- 修改后如游戏异常，删除此文件即可恢复游戏默认视频设置
- 使用前需删除文件中的所有注释（`//` 开头的内容）
