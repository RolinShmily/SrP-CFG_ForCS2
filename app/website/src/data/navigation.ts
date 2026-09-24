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

/**
 * 工信部 ICP 备案信息。
 *
 * cfg.srprolin.top 与主站 www.srprolin.top 同属一个备案主体，复用主站备案号；
 * 展示于页脚底部，链接指向工信部政务服务平台备案查询系统。
 */
export const ICP_BEIAN = {
  number: "豫ICP备2025140316号-1",
  href: "https://beian.miit.gov.cn/#/Integrated/index",
} as const;

export const navLinks = [
  { href: "/", label: "首页" },
  { href: "/download", label: "下载" },
  { href: "/features", label: "功能" },
  { href: "/commands", label: "指令" },
  { href: "/about", label: "关于" },
];
