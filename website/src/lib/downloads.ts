export const REPOSITORY = "https://github.com/RolinShmily/SrP-CFG_ForCS2";
export const RELEASES = `${REPOSITORY}/releases`;
export const RELEASE_MANIFEST = `${RELEASES}/latest/download/latest.json`;
export const RELEASE_API = "https://api.github.com/repos/RolinShmily/SrP-CFG_ForCS2/releases/latest";
export const MIRROR = "https://gh.269601.xyz/";
export type DownloadSource = "mirror" | "github";
export const packageIds = ["srp-cfg", "video", "annotations"] as const;
export type PackageId = typeof packageIds[number];
export interface DownloadAsset { url: string; sha256?: string; size?: number; }
export interface AppRelease { version: string; setup?: DownloadAsset; portable?: DownloadAsset; }
export interface ConfigPackage extends DownloadAsset { version: string; }
export type PackageManifest = Partial<Record<PackageId, ConfigPackage>>;
export function assetPath(path: string) { return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`; }
export function softwareUrl(url: string, source: DownloadSource) { return source === "mirror" ? MIRROR + url : url; }
function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
function checksum(value: unknown) { return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : undefined; }
function size(value: unknown) { return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : undefined; }
function releaseAsset(url: unknown, extension: string): url is string {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.origin === "https://github.com" && parsed.pathname.startsWith("/RolinShmily/SrP-CFG_ForCS2/releases/download/") && parsed.pathname.endsWith(extension) && !parsed.search && !parsed.hash && !parsed.username && !parsed.password;
  } catch (error) { if (error instanceof TypeError) return false; throw error; }
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
  for (const entry of [result.setup, result.portable]) if (entry && !new URL(entry.url).pathname.startsWith(`/RolinShmily/SrP-CFG_ForCS2/releases/download/v${version}/`)) return undefined;
  return result.setup || result.portable ? result : undefined;
}
export function parsePackageManifest(value: unknown): PackageManifest {
  const obj = object(value); const packages = object(obj?.packages);
  const result: PackageManifest = {};
  if (obj?.schema_version !== 1 || !packages) return result;
  for (const id of packageIds) {
    const entry = object(packages[id]);
    if (!entry || typeof entry.version !== "string" || !/^\d+\.\d+\.\d+$/.test(entry.version) || typeof entry.url !== "string") continue;
    try {
      const url = new URL(entry.url);
      if (url.origin !== "https://cfg.srprolin.top" || url.username || url.password || !url.pathname.startsWith(`/packages/${id}-`) || !url.pathname.endsWith(".zip") || url.search || url.hash) continue;
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
