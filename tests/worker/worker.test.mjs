import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GITHUB_RELEASE_BASE,
  SITE_ORIGIN,
  handleReleaseRequest,
  rewriteReleaseManifest,
} from '../../worker/index.ts';

const validManifest = {
  version: '3.4.9',
  tag: 'v3.4.9',
  published_at: '2026-11-24T00:00:00Z',
  gui_zip_url: `${GITHUB_RELEASE_BASE}/download/v3.4.9/srp-cfg-v3.4.9-windows-x64-gui.zip`,
  gui_zip_sha256: 'a'.repeat(64),
  setup_exe_url: `${GITHUB_RELEASE_BASE}/download/v3.4.9/srp-cfg-v3.4.9-windows-x64-setup.exe`,
  setup_exe_sha256: 'b'.repeat(64),
  notes_zh: '中文摘要',
  notes_en: 'English summary',
};

test('rewriteReleaseManifest rewrites asset URLs to cfg.srprolin.com and preserves hashes and BOM safety', () => {
  const rewritten = rewriteReleaseManifest('\uFEFF' + JSON.stringify(validManifest));
  assert.ok(rewritten);
  const parsed = JSON.parse(rewritten);
  assert.equal(parsed.version, '3.4.9');
  assert.equal(parsed.tag, 'v3.4.9');
  assert.equal(parsed.gui_zip_url, `${SITE_ORIGIN}/releases/download/v3.4.9/srp-cfg-v3.4.9-windows-x64-gui.zip`);
  assert.equal(parsed.setup_exe_url, `${SITE_ORIGIN}/releases/download/v3.4.9/srp-cfg-v3.4.9-windows-x64-setup.exe`);
  assert.equal(parsed.gui_zip_sha256, validManifest.gui_zip_sha256);
  assert.equal(parsed.setup_exe_sha256, validManifest.setup_exe_sha256);
});

test('rewriteReleaseManifest rejects mismatched tags, versions, or untrusted URLs', () => {
  assert.equal(rewriteReleaseManifest(JSON.stringify({ ...validManifest, tag: 'v9.9.9' })), null);
  assert.equal(rewriteReleaseManifest(JSON.stringify({ ...validManifest, version: '3.4.9-beta' })), null);
  assert.equal(
    rewriteReleaseManifest(JSON.stringify({ ...validManifest, gui_zip_url: 'https://evil.example/a.zip' })),
    null,
  );
  assert.equal(
    rewriteReleaseManifest(
      JSON.stringify({
        ...validManifest,
        setup_exe_url: `${GITHUB_RELEASE_BASE}/download/v3.4.8/srp-cfg-v3.4.8-windows-x64-setup.exe`,
      }),
    ),
    null,
  );
  assert.equal(rewriteReleaseManifest('not json'), null);
});

test('handleReleaseRequest serves /releases/latest.json from GitHub Release', async () => {
  let requestedUrl = '';
  const mockFetch = async (url) => {
    requestedUrl = url;
    return new Response(JSON.stringify(validManifest), { status: 200 });
  };

  const res = await handleReleaseRequest(new Request(`${SITE_ORIGIN}/releases/latest.json`), mockFetch);
  assert.equal(requestedUrl, `${GITHUB_RELEASE_BASE}/latest/download/latest.json`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.match(res.headers.get('cache-control') || '', /max-age=120/);
  const body = await res.json();
  assert.equal(body.setup_exe_url, `${SITE_ORIGIN}/releases/download/v3.4.9/srp-cfg-v3.4.9-windows-x64-setup.exe`);
});

test('handleReleaseRequest streams allowlisted software downloads byte-for-byte', async () => {
  const payload = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01]);
  let requestedUrl = '';
  const mockFetch = async (url) => {
    requestedUrl = url;
    return new Response(payload, {
      status: 200,
      headers: { 'content-length': String(payload.byteLength), etag: '"abc123"' },
    });
  };

  const file = 'srp-cfg-v3.4.9-windows-x64-gui.zip';
  const res = await handleReleaseRequest(
    new Request(`${SITE_ORIGIN}/releases/download/v3.4.9/${file}`),
    mockFetch,
  );
  assert.equal(requestedUrl, `${GITHUB_RELEASE_BASE}/download/v3.4.9/${file}`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/zip');
  assert.equal(res.headers.get('content-disposition'), `attachment; filename="${file}"`);
  assert.equal(res.headers.get('content-length'), String(payload.byteLength));
  assert.equal(res.headers.get('etag'), '"abc123"');
  assert.match(res.headers.get('cache-control') || '', /immutable/);
  const bytes = new Uint8Array(await res.arrayBuffer());
  assert.deepEqual(bytes, payload);
});

test('handleReleaseRequest rejects non-allowlisted paths, query strings, and non-GET methods', async () => {
  const failFetch = async () => {
    throw new Error('fetch should not be called');
  };

  const post = await handleReleaseRequest(
    new Request(`${SITE_ORIGIN}/releases/latest.json`, { method: 'POST' }),
    failFetch,
  );
  assert.equal(post.status, 405);

  const rejectedPaths = [
    '/releases/latest.json?foo=1',
    '/releases/download/v3.4.9/srp-cfg-v3.4.8-windows-x64-gui.zip',
    '/releases/download/v3.4.9/srp-cfg-v3.4.9-windows-x64-cli.zip',
    '/releases/download/v3.4.9/arbitrary.exe',
    '/releases/download/v3.4.9/srp-cfg-v3.4.9-windows-x64-setup.exe?redirect=1',
    '/releases/other',
  ];
  for (const path of rejectedPaths) {
    const res = await handleReleaseRequest(new Request(`${SITE_ORIGIN}${path}`), failFetch);
    assert.equal(res.status, 404, `Expected 404 for ${path}`);
  }
});
