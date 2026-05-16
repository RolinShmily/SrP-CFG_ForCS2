import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { app } from "electron";

const RELEASES_API = "https://api.github.com/repos/RolinShmily/SrP-CFG_ForCS2/releases/latest";
const CACHE_DIR = path.join(app.getPath("userData"), "update-cache");
const CACHE_FILE = path.join(CACHE_DIR, "cache.json");
const CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
const HTTP_TIMEOUT = 5000;

interface UpdateCache {
  latestVersion?: string;
  dismissedVersion?: string;
  lastCheckTime?: number;
}

export interface UpdateInfo {
  latestVersion: string;
  currentVersion: string;
  htmlUrl: string;
}

function getCurrentVersion(): string {
  return app.getVersion() || "0.1.0";
}

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

function loadCache(): UpdateCache | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function saveCache(cache: UpdateCache): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch {
    // cache write failure is non-critical
  }
}

function evaluateFromCache(cache: UpdateCache, currentVersion: string): UpdateInfo | null {
  if (!cache.latestVersion) return null;
  if (cache.dismissedVersion === cache.latestVersion) return null;
  if (compareVersions(cache.latestVersion, currentVersion) <= 0) return null;

  return {
    latestVersion: cache.latestVersion,
    currentVersion,
    htmlUrl: `https://github.com/RolinShmily/SrP-CFG_ForCS2/releases/tag/v${cache.latestVersion}`,
  };
}

function fetchLatestRelease(): Promise<{ tagName: string; htmlUrl: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      RELEASES_API,
      { headers: { "User-Agent": "SrP-CFG-Installer" } },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve({
              tagName: json.tag_name.replace(/^v/, ""),
              htmlUrl: json.html_url,
            });
          } catch (e) {
            reject(e);
          }
        });
      },
    );

    req.setTimeout(HTTP_TIMEOUT, () => {
      req.destroy();
      reject(new Error("timeout"));
    });

    req.on("error", reject);
  });
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  const current = getCurrentVersion();
  const cache = loadCache();

  // Throttle: use cache if checked within 4 hours
  if (cache?.lastCheckTime && Date.now() - cache.lastCheckTime < CHECK_INTERVAL) {
    return evaluateFromCache(cache, current);
  }

  try {
    const release = await fetchLatestRelease();

    const newCache: UpdateCache = {
      latestVersion: release.tagName,
      dismissedVersion: cache?.dismissedVersion,
      lastCheckTime: Date.now(),
    };
    saveCache(newCache);

    if (
      compareVersions(release.tagName, current) > 0 &&
      cache?.dismissedVersion !== release.tagName
    ) {
      return {
        latestVersion: release.tagName,
        currentVersion: current,
        htmlUrl: release.htmlUrl,
      };
    }

    return null;
  } catch {
    // Network failure, fall back to cache
    if (cache) return evaluateFromCache(cache, current);
    return null;
  }
}

export function dismissVersion(version: string): void {
  const cache = loadCache() || {};
  cache.dismissedVersion = version;
  saveCache(cache);
}
