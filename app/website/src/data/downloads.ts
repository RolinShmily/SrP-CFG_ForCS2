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
    name: "Runtime Core",
    file: "SrP-CFG_Runtime_Core.zip",
    url: dl("SrP-CFG_Runtime_Core.zip"),
    desc: "唯一配置包：Runtime + User + 内置 Preset 案例；在 custom.cfg 中选择起点并写入个人差异",
    badge: "推荐",
    featured: true,
  },
];
