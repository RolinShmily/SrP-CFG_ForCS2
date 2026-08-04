export const REPO_URL = "https://github.com/RolinShmily/SrP-CFG_ForCS2";
export const RELEASES_URL = `${REPO_URL}/releases`;

// 下载镜像前缀：纯字符串拼接到 GitHub Release 链接最前面。
// - 留空字符串 ""        → 直连 GitHub（默认）
// - 填镜像站 URL 且必须以 "/" 结尾 → 全部走镜像
// 例：""                          → 直连 GitHub
//     "https://ghproxy.net/"      → 走镜像站（原 GitHub 链接前置该前缀）
// ⚠️ 换镜像前必须用 ureq 3.3（desktop 下载栈）实测兼容——gh.269601.xyz 的 chunked
//   响应 ureq 无法解析（protocol: chunk expected crlf），下载会静默失败；
//   ghproxy.net / gh-proxy.com / ghfast.top / gh.llkk.cc 均实测 116802B 完整下载。
export const DL_MIRROR_PREFIX = "https://ghproxy.net/";

// GitHub Release 稳定下载基底（始终指向 latest，要求 asset 文件名固定无版本号）
export const RELEASE_DOWNLOAD_BASE = `${REPO_URL}/releases/latest/download`;

export const navLinks = [
  { href: "/", label: "首页" },
  { href: "/download", label: "下载" },
  { href: "/docs", label: "文档" },
  { href: "/commands", label: "指令" },
  { href: "/about", label: "关于" },
];
