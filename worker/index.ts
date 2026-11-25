export const SITE_ORIGIN = "https://cfg.srprolin.com";
export const GITHUB_REPO = "RolinShmily/SrP-CFG_ForCS2";
export const GITHUB_RELEASE_BASE = `https://github.com/${GITHUB_REPO}/releases`;
export const LATEST_MANIFEST_PATH = "/releases/latest.json";

const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const DOWNLOAD_RE =
  /^\/releases\/download\/(v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))\/(srp-cfg-\1-windows-x64-(?:gui\.zip|setup\.exe))$/;

interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

export interface WorkerEnv {
  ASSETS: AssetsBinding;
}

type FetchLike = (input: string, init?: RequestInit & { cf?: Record<string, unknown> }) => Promise<Response>;

function isTrustedAssetUrl(raw: unknown, tag: string, filename: string): boolean {
  if (typeof raw !== "string") return false;
  try {
    const parsed = new URL(raw);
    if (parsed.search || parsed.hash || parsed.username || parsed.password) return false;
    const expectedGitHub = `/${GITHUB_REPO}/releases/download/${tag}/${filename}`;
    const expectedSite = `/releases/download/${tag}/${filename}`;
    return (
      (parsed.origin === "https://github.com" && parsed.pathname === expectedGitHub) ||
      (parsed.origin === SITE_ORIGIN && parsed.pathname === expectedSite)
    );
  } catch {
    return false;
  }
}

export function rewriteReleaseManifest(rawText: string, siteOrigin: string = SITE_ORIGIN): string | null {
  if (rawText.length > 256 * 1024) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText.replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

  const doc = { ...(parsed as Record<string, unknown>) };
  const version = doc.version;
  const tag = doc.tag;
  if (typeof version !== "string" || !SEMVER_RE.test(version) || tag !== `v${version}`) {
    return null;
  }

  const guiFile = `srp-cfg-${tag}-windows-x64-gui.zip`;
  const setupFile = `srp-cfg-${tag}-windows-x64-setup.exe`;

  if (doc.gui_zip_url !== undefined) {
    if (!isTrustedAssetUrl(doc.gui_zip_url, tag, guiFile)) return null;
    doc.gui_zip_url = `${siteOrigin}/releases/download/${tag}/${guiFile}`;
  }
  if (doc.setup_exe_url !== undefined) {
    if (!isTrustedAssetUrl(doc.setup_exe_url, tag, setupFile)) return null;
    doc.setup_exe_url = `${siteOrigin}/releases/download/${tag}/${setupFile}`;
  }

  return `${JSON.stringify(doc, null, 2)}\n`;
}

export async function handleReleaseRequest(
  request: Request,
  fetchFn: FetchLike = fetch as FetchLike,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD", "X-Content-Type-Options": "nosniff" },
    });
  }

  const url = new URL(request.url);
  if (url.search) {
    return new Response("Not Found", { status: 404, headers: { "X-Content-Type-Options": "nosniff" } });
  }

  if (url.pathname === LATEST_MANIFEST_PATH) {
    let upstream: Response;
    try {
      upstream = await fetchFn(`${GITHUB_RELEASE_BASE}/latest/download/latest.json`, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "SrP-CFG-Worker/1.0",
          Accept: "application/json",
        },
        cf: { cacheTtl: 120, cacheEverything: true },
      });
    } catch {
      return Response.json(
        { error: "upstream_unavailable" },
        { status: 502, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
      );
    }

    if (!upstream.ok) {
      return Response.json(
        { error: "upstream_unavailable" },
        { status: 502, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
      );
    }

    const rewritten = rewriteReleaseManifest(await upstream.text());
    if (!rewritten) {
      return Response.json(
        { error: "invalid_upstream_manifest" },
        { status: 502, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
      );
    }

    return new Response(request.method === "HEAD" ? null : rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=120, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const match = DOWNLOAD_RE.exec(url.pathname);
  if (!match) {
    return new Response("Not Found", { status: 404, headers: { "X-Content-Type-Options": "nosniff" } });
  }

  const [, tag, file] = match;
  let upstream: Response;
  try {
    upstream = await fetchFn(`${GITHUB_RELEASE_BASE}/download/${tag}/${file}`, {
      method: request.method,
      redirect: "follow",
      headers: { "User-Agent": "SrP-CFG-Worker/1.0" },
      cf: { cacheTtl: 86400, cacheEverything: true },
    });
  } catch {
    return new Response("Bad Gateway", { status: 502, headers: { "X-Content-Type-Options": "nosniff" } });
  }

  if (upstream.status === 404) {
    return new Response("Not Found", { status: 404, headers: { "X-Content-Type-Options": "nosniff" } });
  }
  if (!upstream.ok) {
    return new Response("Bad Gateway", { status: 502, headers: { "X-Content-Type-Options": "nosniff" } });
  }

  const headers = new Headers({
    "Content-Type": file.endsWith(".zip") ? "application/zip" : "application/octet-stream",
    "Content-Disposition": `attachment; filename="${file}"`,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);
  const etag = upstream.headers.get("etag");
  if (etag) headers.set("ETag", etag);

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: 200,
    headers,
  });
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/releases/")) {
      return handleReleaseRequest(request);
    }
    return env.ASSETS.fetch(request);
  },
};
