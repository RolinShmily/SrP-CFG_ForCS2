export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  assets: GitHubAsset[];
}

export interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export type InstallTarget = "global-cfg" | "user-video" | "annotations";

export interface InstallOptions {
  targets: InstallTarget[];
  userId?: string;
}
