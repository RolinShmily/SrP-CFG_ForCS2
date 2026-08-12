// 仓库与下载链接配置（与 website 保持一致）

export const REPO_URL = "https://github.com/RolinShmily/SrP-CFG_ForCS2";
// 项目官网前缀（cfg.srprolin.top 为 SrP-CFG 官网根域；文档/下载等路由均基于此前缀拼接）
export const WEBSITE_URL = "https://cfg.srprolin.top";
// 官方文档中心（基于官网前缀的固定路由）
export const DOCS_URL = `${WEBSITE_URL}/docs`;

// 下载镜像前缀：纯字符串拼接到 GitHub Release 链接最前面。
// - 留空字符串 ""        → 直连 GitHub
// - 填镜像站 URL 且必须以 "/" 结尾 → 全部走镜像
// ⚠️ 必须与 ureq 3.3 下载栈兼容（gh.269601.xyz 的 chunked 响应会让 ureq 报
//   "protocol: chunk expected crlf" 导致下载静默失败；ghproxy.net 等实测通过）
export const DL_MIRROR_PREFIX = "https://ghproxy.net/";

// GitHub Release 稳定下载基底（始终指向 latest，要求 asset 文件名固定无版本号）
export const RELEASE_DOWNLOAD_BASE = `${REPO_URL}/releases/latest/download`;

// v3 唯一配置包文件名（与 CI 产物名一致）
export const CONFIG_PACKAGE_FILE = "SrP-CFG_Runtime_Core.zip";

// MSI 安装包文件名
export const INSTALLER_MSI = "SrP-CFG_Installer.msi";

// 拼接：镜像前缀(可空) + GitHub Release latest/download 基底 + 文件名
// 国内加速下载（带镜像前缀）
export const dl = (file: string): string =>
  `${DL_MIRROR_PREFIX}${RELEASE_DOWNLOAD_BASE}/${file}`;

// GitHub 直连下载（无镜像前缀）
export const dlGithub = (file: string): string => `${RELEASE_DOWNLOAD_BASE}/${file}`;
