import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { app } from "electron";
import type { GitHubRelease, UpdateCheckResult } from "../../renderer/types";

const RELEASES_API =
  "https://api.github.com/repos/RolinShmily/SrP-CFG_ForCS2/releases";
const CACHE_DIR = path.join(app.getPath("userData"), "update-cache");
const CACHE_FILE = path.join(CACHE_DIR, "cache.json");
const CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
const HTTP_TIMEOUT = 8000;

interface UpdateCache {
  lastCheckTime?: number;
  dismissedVersion?: string;
  cachedReleases?: GitHubRelease[];
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

function isDismissed(
  releases: GitHubRelease[],
  dismissedVersion?: string,
): boolean {
  if (!dismissedVersion || releases.length === 0) return false;
  return compareVersions(releases[0].tagName, dismissedVersion) <= 0;
}

interface GitHubReleaseRaw {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
}

function fetchAllReleases(): Promise<GitHubReleaseRaw[]> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      `${RELEASES_API}?per_page=10`,
      { headers: { "User-Agent": "SrP-CFG-Installer" } },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
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

function filterNewer(
  releases: GitHubRelease[],
  currentVersion: string,
): GitHubRelease[] {
  return releases.filter(
    (r) => compareVersions(r.tagName, currentVersion) > 0,
  );
}

function buildResult(
  current: string,
  releases: GitHubRelease[],
): UpdateCheckResult {
  return {
    currentVersion: current,
    hasUpdate: releases.length > 0,
    releases,
  };
}

export async function checkForUpdate(
  force = false,
): Promise<UpdateCheckResult> {
  const current = getCurrentVersion();
  const cache = loadCache();

  // Auto-check with cache throttle
  if (
    !force &&
    cache?.lastCheckTime &&
    Date.now() - cache.lastCheckTime < CHECK_INTERVAL
  ) {
    const newer = filterNewer(cache.cachedReleases || [], current);
    if (isDismissed(newer, cache.dismissedVersion)) {
      return buildResult(current, []);
    }
    return buildResult(current, newer);
  }

  try {
    const raw = await fetchAllReleases();

    const newer: GitHubRelease[] = raw
      .filter(
        (r) => compareVersions(r.tag_name.replace(/^v/, ""), current) > 0,
      )
      .map((r) => ({
        tagName: r.tag_name.replace(/^v/, ""),
        name: r.name || "",
        body: r.body || "",
        htmlUrl: r.html_url,
        publishedAt: r.published_at || "",
      }))
      .sort((a, b) => compareVersions(b.tagName, a.tagName));

    saveCache({
      lastCheckTime: Date.now(),
      dismissedVersion: cache?.dismissedVersion,
      cachedReleases: newer,
    });

    // Auto-check respects dismissal
    if (!force && isDismissed(newer, cache?.dismissedVersion)) {
      return buildResult(current, []);
    }

    return buildResult(current, newer);
  } catch {
    // Network failure, use cache
    const newer = filterNewer(cache?.cachedReleases || [], current);
    if (!force && isDismissed(newer, cache?.dismissedVersion)) {
      return buildResult(current, []);
    }
    return buildResult(current, newer);
  }
}

export function dismissVersion(version: string): void {
  const cache = loadCache() || {};
  cache.dismissedVersion = version;
  saveCache(cache);
}
