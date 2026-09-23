/**
 * 站点 / 仓库 / 下载链接与产物文件名单点常量（desktop 与 website 共用）。
 *
 * 修改仓库地址、镜像站或产物命名时，只需改这里——两端的下载链接、外链按钮
 * 与文件名将同步生效。
 */

export const REPO_URL = "https://github.com/RolinShmily/SrP-CFG_ForCS2";
export const RELEASES_URL = `${REPO_URL}/releases`;

/** SrP-CFG 官网根域（desktop 侧用于跳转官网 / 文档中心）。 */
export const WEBSITE_URL = "https://cfg.srprolin.top";
/** 官方文档中心（基于官网前缀的固定路由）。 */
export const DOCS_URL = `${WEBSITE_URL}/docs`;

/**
 * 下载镜像前缀：纯字符串拼接到 GitHub Release 链接最前面。
 * - 留空字符串 "" → 直连 GitHub（默认）
 * - 填镜像站 URL 且必须以 "/" 结尾 → 全部走镜像
 * ⚠️ 换镜像前必须用 ureq 3.3（desktop 下载栈）实测兼容。历史坑：gh.269601.xyz 曾对
 *   302 重定向响应返回 chunked 编码，旧 ureq 解析报 "protocol: chunk expected crlf"
 *   导致下载静默失败；2026-08-12 已用 ureq 3.3.0 实测完整下载通过。若再换镜像需重新实测。
 */
export const DL_MIRROR_PREFIX = "https://gh.269601.xyz/";

/** GitHub Release 稳定下载基底（始终指向 latest，要求 asset 文件名固定无版本号）。 */
export const RELEASE_DOWNLOAD_BASE = `${REPO_URL}/releases/latest/download`;

/** 镜像加速下载 URL（前缀为空时等同直连）。 */
export const dlMirror = (file: string): string =>
  `${DL_MIRROR_PREFIX}${RELEASE_DOWNLOAD_BASE}/${file}`;

/** GitHub 直连下载 URL。 */
export const dlDirect = (file: string): string => `${RELEASE_DOWNLOAD_BASE}/${file}`;

// ── 下载源（desktop 与 website 共用）───────────────────────────
/**
 * `mirror` = 大陆加速镜像；`github` = GitHub 官方直连。
 * 默认大陆加速；镜像不可用或需要校验官方源时可切换为 GitHub。
 */
export type DownloadSource = "mirror" | "github";

export const DEFAULT_DOWNLOAD_SOURCE: DownloadSource = "mirror";

/** 供 <select> 渲染的选项（label 为展示名，hint 为说明）。 */
export const DOWNLOAD_SOURCE_OPTIONS: { value: DownloadSource; label: string; hint: string }[] = [
  { value: "mirror", label: "大陆加速", hint: "国内镜像站转发，速度更快" },
  { value: "github", label: "GitHub 直连", hint: "官方发布源，不经过第三方镜像" },
];

export const isDownloadSource = (value: unknown): value is DownloadSource =>
  value === "mirror" || value === "github";

/** 按下载源解析某个发布产物的下载 URL。 */
export const dlBySource = (file: string, source: DownloadSource): string =>
  source === "github" ? dlDirect(file) : dlMirror(file);

// ── 发布产物文件名（与 CI 打包产物名保持一致）─────────────────
export const INSTALLER_MSI = "SrP-CFG_Installer.msi";
export const INSTALLER_NSIS = "SrP-CFG_Setup_x64.exe";
export const CONFIG_PACKAGE_FILE = "SrP-CFG_Runtime_Core.zip";
export const MAP_GUIDES_FILE = "SrP-CFG_Map_Guides.zip";
export const VIDEO_SETTINGS_FILE = "SrP-CFG_Video_Settings.zip";
