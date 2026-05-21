const REPO = "RolinShmily/SrP-CFG_ForCS2";
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

async function fetchLatestVersion(): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(API_URL, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return "0.0.0";
    const data = await res.json();
    return (data.tag_name as string)?.replace(/^v/, "") ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export const LATEST_VERSION = await fetchLatestVersion();
