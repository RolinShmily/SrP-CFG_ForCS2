const REPO = "RolinShmily/SrP-CFG_ForCS2";
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

async function fetchLatestVersion(): Promise<string> {
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

export const LATEST_VERSION = await fetchLatestVersion();
