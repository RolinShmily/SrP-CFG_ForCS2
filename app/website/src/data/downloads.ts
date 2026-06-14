import { DL_MIRROR_PREFIX, RELEASE_DOWNLOAD_BASE } from "./navigation";

// 拼接：镜像前缀(可空) + GitHub Release latest/download 基底 + 文件名
// 纯字符串拼接。镜像前缀若非空，必须以 "/" 结尾（见 navigation.ts 注释）。
const dl = (file: string) => `${DL_MIRROR_PREFIX}${RELEASE_DOWNLOAD_BASE}/${file}`;

export const installers = [
  {
    name: "MSI 安装包",
    desc: "推荐方式。通过 Windows 安装向导安装到 Program Files，支持开始菜单和桌面快捷方式",
    file: "SrP-CFG_Installer.msi",
    url: dl("SrP-CFG_Installer.msi"),
    badge: "推荐",
  },
  {
    name: "便携版 (Portable)",
    desc: "解压即用，无需安装，适合 U 盘携带或多实例隔离场景",
    file: "SrP-CFG_Portable.zip",
    url: dl("SrP-CFG_Portable.zip"),
    badge: "Portable",
  },
];

export const packages = [
  {
    name: "Default 默认版",
    file: "Allcfgs.zip",
    url: dl("Allcfgs.zip"),
    desc: "官方完整版预设，包含全部 CFG 和地图指南",
    featured: true,
  },
  {
    name: "Echo 定制版",
    file: "Allcfgs_echo.zip",
    url: dl("Allcfgs_echo.zip"),
    desc: "Echo 用户定制版，覆盖 custom.cfg",
  },
  {
    name: "YSZH 定制版",
    file: "Allcfgs_yszh.zip",
    url: dl("Allcfgs_yszh.zip"),
    desc: "YSZH 用户定制版，覆盖 custom.cfg",
  },
  {
    name: "VisionL 定制版",
    file: "Allcfgs_visionl.zip",
    url: dl("Allcfgs_visionl.zip"),
    desc: "VisionL 用户定制版，覆盖 custom.cfg",
  },
];
