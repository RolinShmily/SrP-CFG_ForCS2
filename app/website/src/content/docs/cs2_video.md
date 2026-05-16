---
title: cs2_video.txt
---

> CS2 视频设置配置文件

::: warning
此文件中的 `//(例)注释` 等在使用时需删除。
:::

## 配置文件内容

```txt
"video.cfg"
{
	"Version"		"16"  // 配置文件版本号
	"VendorID"		"4318"  // 显卡厂商识别码，此处为NVIDIA
	"DeviceID"		"10464"  // 显卡设备识别码，此处为RTX 4060
	"setting.cpu_level"		"3" // CPU 性能等级梯队
	"setting.gpu_mem_level"		"3" // GPU 显存性能等级梯队
	"setting.gpu_level"		"3" // GPU 性能等级梯队
	"setting.knowndevice"		"0" // 显卡设备（0 为主显卡）
	"setting.monitor_index"		"0" // 显示器索引（0 为主显示器）
	"setting.defaultres"		"1280" // 分辨率宽度
	"setting.defaultresheight"		"960" // 分辨率高度
	"setting.aspectratiomode"		"0" // 宽高比模式（0 为自动，1 为 4:3，2 为 16:9）
	"setting.refreshrate_numerator"		"0" // 刷新率分子（0 表示使用默认值）
	"setting.refreshrate_denominator"		"0" // 刷新率分母（0 表示使用默认值）
	"setting.fullscreen"		"1" // 是否启用全屏模式（0 为否，1 为是）
	"setting.coop_fullscreen"		"0" // 合作模式是否启用全屏（1 为是）
	"setting.nowindowborder"		"1" // 是否启用无边框窗口模式（1 为是）
	"setting.fullscreen_min_on_focus_loss"		"1" // 失去焦点时是否最小化全屏窗口（0 为否）
	"setting.high_dpi"		"0" // 是否启用高 DPI 缩放（0 为否）
	"setting.mat_vsync"		"0" // V-sync 是否启用垂直同步（0 为否，1 为是）
	"setting.r_low_latency"		"1" // 是否启用低延迟模式（1 为是）
	"AutoConfig"		"2" // 自动配置等级（2 为自定义配置）
	"setting.msaa_samples"		"4" // 多重采样抗锯齿（MSAA）采样数（0 为 无; 2 为 2x MSAA; 4 为 4x MSAA; 8 为 8x MSAA）
	"setting.r_csgo_cmaa_enable"		"0" // 是否启用 CMAA 抗锯齿（0 为否）
	"setting.videocfg_shadow_quality"		"2" // 全局阴影效果（0 为低，1 为中，2 为高，3 为非常高）
	"setting.videocfg_dynamic_shadows"		"1" // 动态阴影的启用（1 为是）
	"setting.videocfg_texture_detail"		"1" // 模型/贴图细节（0 为低，1 为中，2 为高）
	"setting.r_texturefilteringquality"		"3" // 贴图过滤模式（0-5，双线性、三线性、异项2X、4X、8X、16X）
	"setting.shaderquality"		"0" // 光影细节（0 为低，1 为高）
	"setting.videocfg_particle_detail"		"0" // 粒子细节（0 为低，1 为中，2 为高，3 为非常高）
	"setting.videocfg_ao_detail"		"0" // 环境光遮蔽（AO）细节（0 为禁用，2 为中，3 为高）
	"setting.videocfg_hdr_detail"		"-1" // 高动态范围 （-1为品质，3为性能）
	"setting.videocfg_fsr_detail"		"0" // 超级分辨率FSR（0 为禁用，1、2、3、4分别为超高品质、品质、均衡、性能）
}
```
