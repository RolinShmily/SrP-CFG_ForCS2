export const SITE_ORIGIN = "https://cfg.srprolin.com";
export const REPOSITORY = "https://github.com/RolinShmily/SrP-CFG_ForCS2";
export const RELEASES = `${REPOSITORY}/releases`;
export const RELEASE_MANIFEST = `${SITE_ORIGIN}/releases/latest.json`;
export const RELEASE_API = "https://api.github.com/repos/RolinShmily/SrP-CFG_ForCS2/releases/latest";
export type DownloadSource = "mirror" | "github";
// Website downloads include the agent skill; APP config package IDs remain separate.
export const packageIds = ["srp-cfg", "video", "annotations", "srp-cfg-csgo", "srpcfg-cli"] as const;
export type PackageId = typeof packageIds[number];
export const configPackageIds = ["srp-cfg", "video", "annotations", "srp-cfg-csgo"] as const;
export type ConfigPackageId = typeof configPackageIds[number];
// Package editions may carry a suffix (for example the CS:GO port's "3.4.2-csgo").
const PACKAGE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;
export const skillId = "srpcfg-cli" as const;
export type SkillId = typeof skillId;
export interface DownloadAsset { url: string; sha256?: string; size?: number; }
export interface AppRelease { version: string; setup?: DownloadAsset; portable?: DownloadAsset; }
export interface ConfigPackage extends DownloadAsset { version: string; }
export type PackageManifest = Partial<Record<PackageId, ConfigPackage>>;
// Vite injects the deployment prefix; plain Node (unit tests) has no `import.meta.env`.
const basePath = ((import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/+$/, "");
export function assetPath(path: string) { return `${basePath}${path}`; }
const GITHUB_DOWNLOAD_PREFIX = "/RolinShmily/SrP-CFG_ForCS2/releases/download/";
const SITE_DOWNLOAD_PREFIX = "/releases/download/";
function extractReleaseSuffix(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.search || parsed.hash || parsed.username || parsed.password) return undefined;
    if (parsed.origin === "https://github.com" && parsed.pathname.startsWith(GITHUB_DOWNLOAD_PREFIX)) {
      return parsed.pathname.slice(GITHUB_DOWNLOAD_PREFIX.length);
    }
    if (parsed.origin === SITE_ORIGIN && parsed.pathname.startsWith(SITE_DOWNLOAD_PREFIX)) {
      return parsed.pathname.slice(SITE_DOWNLOAD_PREFIX.length);
    }
    return undefined;
  } catch (error) {
    if (error instanceof TypeError) return undefined;
    throw error;
  }
}
export function softwareUrl(url: string, source: DownloadSource) {
  const suffix = extractReleaseSuffix(url);
  if (!suffix) return url;
  return source === "mirror" ? `${SITE_ORIGIN}${SITE_DOWNLOAD_PREFIX}${suffix}` : `${RELEASES}/download/${suffix}`;
}
function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
function checksum(value: unknown) { return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : undefined; }
function size(value: unknown) { return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : undefined; }
function releaseAsset(url: unknown, extension: string): url is string {
  if (typeof url !== "string") return false;
  const suffix = extractReleaseSuffix(url);
  return Boolean(suffix && suffix.endsWith(extension));
}
export function parseAppRelease(value: unknown): AppRelease | undefined {
  const obj = object(value);
  if (!obj) return undefined;
  const rawVersion = obj.version ?? obj.tag_name;
  if (typeof rawVersion !== "string" || !/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(rawVersion)) return undefined;
  const version = rawVersion.replace(/^v/, "");
  if (obj.tag !== undefined && obj.tag !== `v${version}`) return undefined;
  if (obj.prerelease === true || obj.draft === true) return undefined;
  const result: AppRelease = { version };
  if (releaseAsset(obj.setup_exe_url, "-setup.exe")) result.setup = { url: obj.setup_exe_url, sha256: checksum(obj.setup_exe_sha256) };
  if (releaseAsset(obj.gui_zip_url, "-gui.zip")) result.portable = { url: obj.gui_zip_url, sha256: checksum(obj.gui_zip_sha256) };
  if (Array.isArray(obj.assets)) for (const item of obj.assets) {
    const asset = object(item); if (!asset) continue;
    const sha = typeof asset.digest === "string" ? checksum(asset.digest.replace(/^sha256:/, "")) : undefined;
    if (releaseAsset(asset.browser_download_url, "-setup.exe")) result.setup = { url: asset.browser_download_url, size: size(asset.size), sha256: sha };
    if (releaseAsset(asset.browser_download_url, "-gui.zip")) result.portable = { url: asset.browser_download_url, size: size(asset.size), sha256: sha };
  }
  for (const entry of [result.setup, result.portable]) {
    if (entry) {
      const suffix = extractReleaseSuffix(entry.url);
      if (!suffix || !suffix.startsWith(`v${version}/`)) return undefined;
    }
  }
  return result.setup || result.portable ? result : undefined;
}
export function parsePackageManifest(value: unknown): PackageManifest {
  const obj = object(value); const packages = object(obj?.packages);
  const result: PackageManifest = {};
  if (obj?.schema_version !== 1 || !packages) return result;
  for (const id of packageIds) {
    const entry = object(packages[id]);
    if (!entry || typeof entry.version !== "string" || !PACKAGE_VERSION.test(entry.version) || typeof entry.url !== "string") continue;
    try {
      const url = new URL(entry.url);
      if (url.origin !== "https://cfg.srprolin.com" || url.username || url.password || !url.pathname.startsWith(`/packages/${id}-`) || !url.pathname.endsWith(".zip") || url.search || url.hash) continue;
      const hash = checksum(entry.sha256), bytes = size(entry.size);
      if (hash && bytes) result[id] = { version: entry.version, url: entry.url, sha256: hash, size: bytes };
    } catch (error) { if (!(error instanceof TypeError)) throw error; }
  }
  return result;
}
export async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(9000)]) : AbortSignal.timeout(9000), cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  if (text.length > 512 * 1024) throw new Error("Manifest exceeds size limit");
  return JSON.parse(text.replace(/^\uFEFF/, "")) as unknown;
}
export function formatSize(bytes?: number) { return bytes ? bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB` : ""; }
