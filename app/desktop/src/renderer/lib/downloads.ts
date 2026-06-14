// 仓库与下载链接配置（与 website 保持一致）

export const REPO_URL = "https://github.com/RolinShmily/SrP-CFG_ForCS2";

// 下载镜像前缀：纯字符串拼接到 GitHub Release 链接最前面。
// - 留空字符串 ""        → 直连 GitHub
// - 填镜像站 URL 且必须以 "/" 结尾 → 全部走镜像
export const DL_MIRROR_PREFIX = "https://gh.269601.xyz/";

// GitHub Release 稳定下载基底（始终指向 latest，要求 asset 文件名固定无版本号）
export const RELEASE_DOWNLOAD_BASE = `${REPO_URL}/releases/latest/download`;

// 预设包文件名（与 CI 产物名一致）
export const PRESET_FILES = {
  default: "Allcfgs.zip",
  echo: "Allcfgs_echo.zip",
  yszh: "Allcfgs_yszh.zip",
  visionl: "Allcfgs_visionl.zip",
} as const;

// MSI 安装包文件名
export const INSTALLER_MSI = "SrP-CFG_Installer.msi";

// 拼接：镜像前缀(可空) + GitHub Release latest/download 基底 + 文件名
export const dl = (file: string): string =>
  `${DL_MIRROR_PREFIX}${RELEASE_DOWNLOAD_BASE}/${file}`;
