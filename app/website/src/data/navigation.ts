export const REPO_URL = "https://github.com/RolinShmily/SrP-CFG_ForCS2";
export const RELEASES_URL = `${REPO_URL}/releases`;

// 下载镜像前缀：纯字符串拼接到 GitHub Release 链接最前面。
// - 留空字符串 ""        → 直连 GitHub（默认）
// - 填镜像站 URL 且必须以 "/" 结尾 → 全部走镜像
// 例：""                          → 直连 GitHub
//     "https://gh.269601.xyz/"    → 走镜像站（原 GitHub 链接前置该前缀）
export const DL_MIRROR_PREFIX = "https://gh.269601.xyz/";

// GitHub Release 稳定下载基底（始终指向 latest，要求 asset 文件名固定无版本号）
export const RELEASE_DOWNLOAD_BASE = `${REPO_URL}/releases/latest/download`;

export const navLinks = [
  { href: "/", label: "首页" },
  { href: "/download", label: "下载" },
  { href: "/docs", label: "文档" },
  { href: "/about", label: "关于" },
];
