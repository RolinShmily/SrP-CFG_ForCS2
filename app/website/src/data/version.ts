const REPO = "RolinShmily/SrP-CFG_ForCS2";
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

/**
 * 构建期 fetch 最新版本号（L3.2 改造后由 vite.config.ts 的 srp-cfg-latest-version 插件调用）。
 * 保留纯函数形态：Astro 旧构建曾用模块顶层 await 执行，Vite 下不可直接沿用
 * （esbuild 打包 config 不支持 top-level await），故改为显式调用。
 */
export async function fetchLatestVersion(): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  // GITHUB_TOKEN 在 GitHub Actions 中自动注入，提供 5000次/h 配额
  if (typeof process !== "undefined" && process.env?.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(API_URL, { headers, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return "0.0.0";
    const data = await res.json();
    return (data.tag_name as string)?.replace(/^v/, "") ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

/**
 * 最新版本号。由 vite.config.ts 的 srp-cfg-latest-version 插件在构建开始时
 * fetchLatestVersion() 后经 define 注入（__SRP_CFG_LATEST_VERSION__）。
 * 未注入时回落 "0.0.0"，与旧 fetch 失败行为一致；typeof 守卫避免该标识符
 * 在 vite.config 打包（Node 环境、无 define）时直接引用报 ReferenceError。
 */
export const LATEST_VERSION: string =
  typeof __SRP_CFG_LATEST_VERSION__ !== "undefined"
    ? __SRP_CFG_LATEST_VERSION__
    : "0.0.0";
