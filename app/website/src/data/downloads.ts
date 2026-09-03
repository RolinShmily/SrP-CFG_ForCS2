import { DL_MIRROR_PREFIX, RELEASE_DOWNLOAD_BASE } from "./navigation";

// 拼接：镜像前缀(可空) + GitHub Release latest/download 基底 + 文件名
// 纯字符串拼接。镜像前缀若非空，必须以 "/" 结尾（见 navigation.ts 注释）。
const mirror = (file: string) => `${DL_MIRROR_PREFIX}${RELEASE_DOWNLOAD_BASE}/${file}`;
// GitHub 直连（无镜像前缀）
const direct = (file: string) => `${RELEASE_DOWNLOAD_BASE}/${file}`;

export const installers = [
  {
    name: "MSI 安装包",
    desc: "推荐方式。通过 Windows 安装向导安装到 Program Files，支持开始菜单和桌面快捷方式",
    file: "SrP-CFG_Installer.msi",
    mirrorUrl: mirror("SrP-CFG_Installer.msi"),
    githubUrl: direct("SrP-CFG_Installer.msi"),
    badge: "推荐",
  },
  {
    name: "Setup 安装程序 (EXE)",
    desc: "NSIS 自包含安装向导，双击运行即可安装，无需额外依赖",
    file: "SrP-CFG_Setup_x64.exe",
    mirrorUrl: mirror("SrP-CFG_Setup_x64.exe"),
    githubUrl: direct("SrP-CFG_Setup_x64.exe"),
    badge: "Setup",
  },
];

export const packages = [
  {
    name: "Runtime Core 核心配置包",
    file: "SrP-CFG_Runtime_Core.zip",
    mirrorUrl: mirror("SrP-CFG_Runtime_Core.zip"),
    githubUrl: direct("SrP-CFG_Runtime_Core.zip"),
    desc: "核心运行时：包含 autoexec.cfg、srp-cfg/ 核心功能、RoL1n / Echo / YSZH / VisionL 预设案例与 user/custom.cfg 用户入口",
    badge: "核心推荐",
    featured: true,
    targetDir: "game/csgo/cfg/",
  },
  {
    name: "Map Guides 跑图道具标点集",
    file: "SrP-CFG_Map_Guides.zip",
    mirrorUrl: mirror("SrP-CFG_Map_Guides.zip"),
    githubUrl: direct("SrP-CFG_Map_Guides.zip"),
    desc: "解耦扩展包：全地图跑位与烟闪道具标点 annotations（包含 Dust2、Mirage、Inferno、Ancient 等单级目录规范标点）",
    badge: "可选扩展",
    featured: false,
    targetDir: "game/csgo/annotations/",
  },
  {
    name: "Video Settings 视频画质配置",
    file: "SrP-CFG_Video_Settings.zip",
    mirrorUrl: mirror("SrP-CFG_Video_Settings.zip"),
    githubUrl: direct("SrP-CFG_Video_Settings.zip"),
    desc: "解耦扩展包：CS2 推荐视频与图形设置模版 cs2_video.txt，兼顾竞技帧率稳定性与画面清晰度",
    badge: "可选扩展",
    featured: false,
    targetDir: "game/csgo/cfg/",
  },
];
