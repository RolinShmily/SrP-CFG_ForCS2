import { DRIVE_BASE, RELEASES_URL } from "./navigation";

export const installers = [
  {
    name: "MSI 安装包",
    desc: "推荐方式。通过 Windows 安装向导安装到 Program Files，支持开始菜单和桌面快捷方式",
    file: "SrP-CFG_Installer.msi",
    url: `${DRIVE_BASE}/SrP-CFG_Installer.msi`,
    badge: "推荐",
  },
  {
    name: "便携版 (Portable)",
    desc: "自包含单文件 EXE，无需安装任何运行库，下载即可直接运行",
    file: "SrP-CFG_Installer.exe",
    url: RELEASES_URL,
    badge: "Portable",
  },
];

export const packages = [
  {
    name: "Default 默认版",
    file: "Allcfgs.zip",
    url: `${DRIVE_BASE}/Allcfgs.zip`,
    desc: "官方完整版预设，包含全部 CFG 和地图指南",
    featured: true,
  },
  {
    name: "Echo 定制版",
    file: "Allcfgs_echo.zip",
    url: `${DRIVE_BASE}/Allcfgs_echo.zip`,
    desc: "Echo 用户定制版，覆盖 custom.cfg",
  },
  {
    name: "YSZH 定制版",
    file: "Allcfgs_yszh.zip",
    url: `${DRIVE_BASE}/Allcfgs_yszh.zip`,
    desc: "YSZH 用户定制版，覆盖 custom.cfg",
  },
  {
    name: "VisionL 定制版",
    file: "Allcfgs_visionl.zip",
    url: `${DRIVE_BASE}/Allcfgs_visionl.zip`,
    desc: "VisionL 用户定制版，覆盖 custom.cfg",
  },
];
