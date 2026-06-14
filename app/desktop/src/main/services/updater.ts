import * as fs from "fs";
import * as path from "path";
import { app, net } from "electron";
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
  /** Full releases from GitHub (all versions), used as fallback for history */
  cachedAllReleases?: GitHubRelease[];
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

interface GitHubAssetRaw {
  name: string;
}

interface GitHubReleaseRaw {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  assets: GitHubAssetRaw[];
}

async function fetchAllReleases(): Promise<GitHubReleaseRaw[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT);
  try {
    const res = await net.fetch(`${RELEASES_API}?per_page=10`, {
      headers: { "User-Agent": "SrP-CFG-Installer" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as GitHubReleaseRaw[];
  } finally {
    clearTimeout(timer);
  }
}

function hasDesktopAssets(assets: GitHubAssetRaw[]): boolean {
  return assets.some(
    (a) =>
      /^SrP-CFG_Installer\.msi$/i.test(a.name) ||
      /^SrP-CFG_Portable\.zip$/i.test(a.name),
  );
}

function mapRelease(r: GitHubReleaseRaw): GitHubRelease {
  return {
    tagName: r.tag_name.replace(/^v/, ""),
    name: r.name || "",
    body: r.body || "",
    htmlUrl: r.html_url,
    publishedAt: r.published_at || "",
    hasDesktopAssets: hasDesktopAssets(r.assets || []),
  };
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
  const hasDesktopUpdate = releases.some((r) => r.hasDesktopAssets);
  const hasPresetUpdate = releases.some((r) => !r.hasDesktopAssets);
  return {
    currentVersion: current,
    hasUpdate: releases.length > 0,
    hasDesktopUpdate,
    hasPresetUpdate,
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
    const allReleases = cache.cachedAllReleases || cache.cachedReleases || [];
    const newer = filterNewer(allReleases, current);
    if (isDismissed(newer, cache.dismissedVersion)) {
      return buildResult(current, []);
    }
    return buildResult(current, newer);
  }

  try {
    const raw = await fetchAllReleases();
    const allReleases = raw
      .map(mapRelease)
      .sort((a, b) => compareVersions(b.tagName, a.tagName));
    const newer = filterNewer(allReleases, current);

    saveCache({
      lastCheckTime: Date.now(),
      dismissedVersion: cache?.dismissedVersion,
      cachedReleases: newer,
      cachedAllReleases: allReleases,
    });

    // Auto-check respects dismissal
    if (!force && isDismissed(newer, cache?.dismissedVersion)) {
      return buildResult(current, []);
    }

    return buildResult(current, newer);
  } catch {
    // Network failure, use cache
    const allReleases = cache?.cachedAllReleases || cache?.cachedReleases || [];
    const newer = filterNewer(allReleases, current);
    if (!force && isDismissed(newer, cache?.dismissedVersion)) {
      return buildResult(current, []);
    }
    return buildResult(current, newer);
  }
}

export async function fetchUpdateHistory(): Promise<GitHubRelease[] | null> {
  try {
    const raw = await fetchAllReleases();
    const allReleases = raw
      .map(mapRelease)
      .filter((r) => compareVersions(r.tagName, "3.0.0") >= 0)
      .sort((a, b) => compareVersions(b.tagName, a.tagName));

    // Update cache with full releases for fallback
    const cache = loadCache() || {};
    cache.cachedAllReleases = allReleases;
    saveCache(cache);

    return allReleases;
  } catch {
    // Network failure, use cached full releases
    const cache = loadCache();
    const cached = (cache?.cachedAllReleases || [])
      .filter((r) => compareVersions(r.tagName, "3.0.0") >= 0)
      .sort((a, b) => compareVersions(b.tagName, a.tagName));
    return cached.length > 0 ? cached : null;
  }
}

export function dismissVersion(version: string): void {
  const cache = loadCache() || {};
  cache.dismissedVersion = version;
  saveCache(cache);
}

export async function getLatestVersion(): Promise<string> {
  const cache = loadCache();
  if (
    cache?.lastCheckTime &&
    Date.now() - cache.lastCheckTime < CHECK_INTERVAL &&
    cache.cachedAllReleases?.length
  ) {
    return cache.cachedAllReleases[0].tagName;
  }

  try {
    const raw = await fetchAllReleases();
    if (raw.length === 0) return getCurrentVersion();
    const latest = mapRelease(raw[0]);
    return latest.tagName;
  } catch {
    return cache?.cachedAllReleases?.[0]?.tagName ?? getCurrentVersion();
  }
}
