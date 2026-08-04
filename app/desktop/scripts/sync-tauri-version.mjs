#!/usr/bin/env node
/**
 * 版本号统一（L4.2）：以 `app/desktop/package.json` 的 version 为唯一来源，
 * 同步到 `src-tauri/tauri.conf.json`（bundle version）与 `src-tauri/Cargo.toml`（[package] version）。
 *
 * 用法：
 *   node app/desktop/scripts/sync-tauri-version.mjs          # 同步并输出变更
 *   node app/desktop/scripts/sync-tauri-version.mjs --check  # 只校验，不一致时 exit 1（供 CI）
 *
 * 说明：core/ 子 crate 版本（0.1.0）是内部开发版本，不随发布版本走，不参与同步。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, "..");
const checkOnly = process.argv.includes("--check");

const pkg = JSON.parse(readFileSync(join(desktop, "package.json"), "utf8"));
const version = pkg.version;

const tauriConfPath = join(desktop, "src-tauri", "tauri.conf.json");
const cargoPath = join(desktop, "src-tauri", "Cargo.toml");

const changes = [];

// ── tauri.conf.json ─────────────────────────
const conf = JSON.parse(readFileSync(tauriConfPath, "utf8"));
if (conf.version !== version) {
  changes.push(`tauri.conf.json version: ${conf.version} -> ${version}`);
  if (!checkOnly) {
    conf.version = version;
    writeFileSync(tauriConfPath, JSON.stringify(conf, null, 2) + "\n");
  }
}

// ── Cargo.toml [package] version ────────────
const cargo = readFileSync(cargoPath, "utf8");
let inPackage = false;
const lines = cargo.split("\n").map((line) => {
  const trimmed = line.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    inPackage = trimmed === "[package]";
    return line;
  }
  if (inPackage && trimmed.startsWith("version = ")) {
    const match = trimmed.match(/^version = "([^"]*)"/);
    if (match && match[1] !== version) {
      changes.push(`Cargo.toml [package] version: ${match[1]} -> ${version}`);
      return line.replace(match[1], version);
    }
  }
  return line;
});

if (!checkOnly && changes.length > 0) {
  writeFileSync(cargoPath, lines.join("\n"));
}

// ── 输出 ────────────────────────────────────
if (changes.length === 0) {
  console.log(`✓ 版本一致：v${version}（package.json / tauri.conf.json / Cargo.toml）`);
} else {
  for (const change of changes) console.log(`· ${change}`);
  if (checkOnly) {
    console.error(`✘ 版本不一致，请运行 node app/desktop/scripts/sync-tauri-version.mjs`);
    process.exit(1);
  } else {
    console.log(`✓ 已同步到 v${version}`);
  }
}
