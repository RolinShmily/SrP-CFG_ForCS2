// Collect the installed production dependency licenses without changing the lockfile.
import { execFileSync } from 'node:child_process';
import { readdir, readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const repo = fileURLToPath(new URL('../', import.meta.url));
const command = 'pnpm --filter srp-cfg-website list --prod --depth Infinity --json';
const raw = execFileSync(
  process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
  process.platform === 'win32'
    ? ['/d', '/s', '/c', command]
    : ['--filter', 'srp-cfg-website', 'list', '--prod', '--depth', 'Infinity', '--json'],
  { cwd: repo, encoding: 'utf8' }
);
const packages = new Map();
function visit(node) {
  for (const [name, value] of Object.entries(node.dependencies || {})) {
    if (value.path) packages.set(`${name}@${value.version}`, value.path);
    visit(value);
  }
}
JSON.parse(raw).forEach(visit);
const parts = ['# Third-party website dependency licenses\n\nGenerated from the installed production graph. Original notices below apply to their respective components.\n'];
for (const [name, directory] of [...packages].sort(([a], [b]) => a.localeCompare(b))) {
  let manifest;
  try { manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8')); }
  catch (error) {
    // pnpm lists lockfile platform-optionals even when not installed on this host.
    if (error.code === 'ENOENT') { console.log(`Not installed on this platform: ${name}`); continue; }
    throw error;
  }
  const names = (await readdir(directory)).filter(name => /^(licen[cs]e|copying|notice)([.\-_]|$)/i.test(name));
  const texts = [];
  for (const name of names) {
    const path = join(directory, name);
    if ((await stat(path)).isFile()) texts.push(`## ${name}\n\n${await readFile(path, 'utf8')}`);
  }
  if (!texts.length && name.startsWith('@next/')) {
    texts.push(await readFile(resolve(repo, 'website/node_modules/next/license.md'), 'utf8'));
  }
  if (!texts.length) {
    texts.push(`No separate license text is shipped in this installed package. Consult its upstream distribution: ${JSON.stringify(manifest.repository || manifest.homepage || name)}. Declared terms: ${JSON.stringify(manifest.license)}.`);
    console.warn(`No standalone license file: ${name}`);
  }
  parts.push(`# ${name}\n\nDeclared license: ${typeof manifest.license === 'string' ? manifest.license : JSON.stringify(manifest.license)}\n\n${texts.join('\n\n')}\n`);
}
const destination = resolve(repo, process.argv[2] || 'website/public/third-party-licenses.txt');
await mkdir(resolve(destination, '..'), { recursive: true });
await writeFile(destination, parts.join('\n---\n\n'));
console.log(`Collected ${packages.size} production dependencies: ${destination}`);
