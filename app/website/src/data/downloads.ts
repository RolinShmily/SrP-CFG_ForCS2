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
    name: "Runtime Core",
    file: "SrP-CFG_Runtime_Core.zip",
    mirrorUrl: mirror("SrP-CFG_Runtime_Core.zip"),
    githubUrl: direct("SrP-CFG_Runtime_Core.zip"),
    desc: "唯一配置包：Runtime + User + 内置 Preset 案例；在 custom.cfg 中选择起点并写入个人差异",
    badge: "推荐",
    featured: true,
  },
];
