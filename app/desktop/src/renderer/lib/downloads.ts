// 仓库与下载链接配置：共享常量来自 @srp-cfg/ui（见 app/shared/ui/src/links.ts）。
// 保持本模块的导出名（dl / dlGithub 等），调用点无需改动。
export {
  REPO_URL,
  WEBSITE_URL,
  DOCS_URL,
  DL_MIRROR_PREFIX,
  RELEASE_DOWNLOAD_BASE,
  CONFIG_PACKAGE_FILE,
  INSTALLER_MSI,
  MAP_GUIDES_FILE,
  VIDEO_SETTINGS_FILE,
  dlMirror as dl,
  dlDirect as dlGithub,
  // 下载源（大陆加速 / GitHub 直连）
  DEFAULT_DOWNLOAD_SOURCE,
  DOWNLOAD_SOURCE_OPTIONS,
  isDownloadSource,
  dlBySource,
} from "@srp-cfg/ui";

export type { DownloadSource } from "@srp-cfg/ui";
