/**
 * 站点导航与共享链接常量。
 *
 * REPO_URL / RELEASES_URL / DL_MIRROR_PREFIX / RELEASE_DOWNLOAD_BASE 单点定义在
 * @srp-cfg/ui（app/shared/ui/src/links.ts），此处仅做再导出，保持既有引用路径不变。
 */
export {
  REPO_URL,
  RELEASES_URL,
  WEBSITE_URL,
  DL_MIRROR_PREFIX,
  RELEASE_DOWNLOAD_BASE,
} from "@srp-cfg/ui";

export const navLinks = [
  { href: "/", label: "首页" },
  { href: "/download", label: "下载" },
  { href: "/docs", label: "文档" },
  { href: "/commands", label: "指令" },
  { href: "/about", label: "关于" },
];
