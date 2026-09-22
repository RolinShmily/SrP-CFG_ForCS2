#!/usr/bin/env node
/**
 * 生成 THIRD_PARTY_LICENSES.md —— 随发布产物分发的第三方组件与许可证清单。
 *
 * 覆盖范围（与三个交付物对齐）：
 *   1. 桌面套件  —— Rust crate（Windows x86_64 目标闭包）
 *   2. 官网/文档 —— npm 生产依赖闭包
 *   3. 自托管字体 —— app/shared/fonts/<pkg>/LICENSE.txt（OFL-1.1）
 *
 * 输出结构（保持精简且满足归属要求）：
 *   · 组件清单：名称 / 版本 / SPDX 标识 / 版权行（取自许可文件，缺失则回落到包作者字段）
 *   · 许可正文附录：每个 SPDX 标识只收录一份代表性全文
 *     （同一标识在 281 个 crate 中存在上百份仅空白与页眉不同的副本，逐份重复无意义；
 *      代表性副本按「被引用次数最多 → 最短 → 哈希」确定，保证跨平台确定性）
 *
 * 数据来源全部在本地解析，不访问任何第三方 API：
 *   · cargo metadata --format-version 1 --filter-platform x86_64-pc-windows-msvc
 *   · pnpm licenses list --prod --json
 *
 * 用法：
 *   node scripts/generate-third-party-licenses.mjs           # 写入清单
 *   node scripts/generate-third-party-licenses.mjs --check    # 只比对，漂移则退出码 1（CI 用）
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = join(ROOT, "THIRD_PARTY_LICENSES.md");
const CHECK = process.argv.includes("--check");
const RUST_TARGET = "x86_64-pc-windows-msvc";
const RUST_MANIFEST_DIR = join(ROOT, "app/desktop/src-tauri");
const FONTS_DIR = join(ROOT, "app/shared/fonts");

/** 包目录内的一级许可证 / 版权声明文件。 */
const LICENSE_FILE_RE = /^(licen[cs]e|copying|notice|copyright)/i;
/** 版权行（注释符可选，须以 copyright / © 开头）。 */
const COPYRIGHT_LINE_RE = /^\s*(?:\/\/|#|\*|;)?\s*(?:copyright\b|©)/i;
/** 许可正文里的占位与叙述句，不是归属信息。 */
const BOILERPLATE_RE = /\[yyyy\]|name of copyright owner|copyright notice|copyright license|copyright owner|copyright holder|copyright and related rights|licensed under|the work\b/i;

// ── 工具 ──────────────────────────────────────────────────────

function run(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    // Windows 上 pnpm / cargo 是 .cmd 垫片，必须经 shell 解析。
    shell: process.platform === "win32",
  });
}

function normalizeText(text) {
  return `${text.replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, "").trimEnd()}\n`;
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

/** `MIT OR Apache-2.0` / `(MIT OR Apache-2.0) AND Unicode-3.0` / `MIT/Apache-2.0` → ["MIT", "Apache-2.0", ...] */
function parseLicenseIds(license) {
  return [
    ...new Set(
      license
        .replace(/[()]/g, "")
        .split(/\s+OR\s+|\s+AND\s+|\s*\/\s*/i)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

/** 把许可文件名对应到 SPDX 标识：`LICENSE-MIT` → MIT，`LICENSE-APACHE` → Apache-2.0。 */
function matchFileToIds(fileName, ids) {
  const token = fileName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const matched = ids.filter((id) => {
    const exact = id.toLowerCase().replace(/[^a-z0-9]/g, "");
    const lead = id.toLowerCase().split(/[-.]/)[0].replace(/[^a-z0-9]/g, "");
    return token.includes(exact) || (lead.length >= 3 && token.includes(lead));
  });
  if (matched.length > 0) return matched;
  return ids.length === 1 ? ids : [];
}

/** 读取包目录下的许可文件，返回 [{ file, text, copyrights }]，按文件名排序保证确定性。 */
function readLicenseFiles(dir) {
  if (!dir || !existsSync(dir)) return [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries
    .filter((name) => LICENSE_FILE_RE.test(name) && !name.endsWith(".rs"))
    .filter((name) => {
      try {
        return statSync(join(dir, name)).isFile();
      } catch {
        return false;
      }
    })
    .sort()
    .map((name) => {
      const text = normalizeText(readFileSync(join(dir, name), "utf8"));
      const copyrights = text
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) =>
            COPYRIGHT_LINE_RE.test(line) &&
            !BOILERPLATE_RE.test(line) &&
            // 排除 “COPYRIGHT AND PERMISSION NOTICE” 这类全大写小节标题
            line !== line.toUpperCase() &&
            line.length < 180,
        )
        .slice(0, 2);
      return { file: name, text, copyrights };
    })
    .filter((entry) => entry.text.trim().length > 0);
}

// ── 采集 ──────────────────────────────────────────────────────

function collectRust() {
  const metadata = JSON.parse(
    run("cargo", ["metadata", "--format-version", "1", "--filter-platform", RUST_TARGET], RUST_MANIFEST_DIR),
  );
  const workspace = new Set(metadata.workspace_members);

  return metadata.packages
    .filter((pkg) => !workspace.has(pkg.id))
    .map((pkg) => ({
      name: pkg.name,
      version: pkg.version,
      license: pkg.license ?? "(not declared)",
      attribution: (pkg.authors ?? []).filter(Boolean).join(", "),
      dir: dirname(pkg.manifest_path),
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
}

/**
 * 定位 npm 包的实际目录。
 *
 * 注意：`.npmrc` 使用 `node-linker=hoisted`，此时 `pnpm licenses list --json` 仍会
 * 报告 `node_modules/.pnpm/<pkg>@<ver>/...` 这一虚拟存储路径，而该路径在扁平安装下
 * 并不存在。因此优先采用真实存在的报告路径，否则回落到各 workspace 的 node_modules。
 */
function resolvePackageDir(name, reportedPaths, version) {
  for (const candidate of reportedPaths) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  const roots = [ROOT, join(ROOT, "app/website"), join(ROOT, "app/desktop")];
  const dirs = roots.map((root) => join(root, "node_modules", name)).filter((dir) => existsSync(dir));
  if (dirs.length === 0) return null;
  // 版本对不上就不要用它的许可文件，避免把别的版本归属到当前闭包上。
  return (
    dirs.find((dir) => {
      try {
        return JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).version === version;
      } catch {
        return false;
      }
    }) ?? dirs[0]
  );
}

/**
 * 读包目录下 `package.json` 里声明的 npm 平台限制（`os` / `cpu`）。
 *
 * 凡声明了该限制的包都是“原生/平台专属”产物（例如 TypeScript 7 自带的
 * `@typescript/typescript-win32-x64` 原生编译器）。它们既不随任何发布产物分发
 * （两端前端产物均为纯 JS，Rust 侧由按目标平台枚举的 Rust 小节单独覆盖），
 * 又会让清单随“生成机器”变化 —— Windows 上出现 -win32-x64、Linux 上出现 -linux-x64 ——
 * 从而让 CI 的 `check:licenses` 在本地通过、在 CI 失败。因此一律排除。
 */
function platformRestricted(dir) {
  if (!dir) return false;
  try {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    return Boolean(pkg.os || pkg.cpu);
  } catch {
    return false;
  }
}

function collectNpm() {
  const raw = run("pnpm", ["licenses", "list", "--prod", "--json"], ROOT);
  // pnpm 会在 stdout 混入 DeprecationWarning 等噪声，取第一个 JSON 对象。
  const payload = JSON.parse(raw.slice(raw.indexOf("{")));

  const components = [];
  for (const [license, entries] of Object.entries(payload)) {
    for (const entry of entries) {
      const versions = entry.versions ?? [];
      const paths = entry.paths ?? [];
      const build = (version, dir) => ({
        name: entry.name,
        version,
        license,
        attribution: entry.author ?? "",
        dir,
      });

      if (versions.length === 0) {
        const dir = resolvePackageDir(entry.name, paths, null);
        if (!platformRestricted(dir)) components.push(build("?", dir));
        continue;
      }
      versions.forEach((version, index) => {
        const dir = resolvePackageDir(entry.name, [paths[index] ?? paths[0]], version);
        if (!platformRestricted(dir)) components.push(build(version, dir));
      });
    }
  }
  return components.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
}

function collectFonts() {
  return readdirSync(FONTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((pkg) => {
      const licensePath = join(FONTS_DIR, pkg, "LICENSE.txt");
      if (!existsSync(licensePath)) {
        throw new Error(`字体包 ${pkg} 缺少 LICENSE.txt（OFL-1.1 要求随副本分发）`);
      }
      const text = normalizeText(readFileSync(licensePath, "utf8"));
      return {
        name: pkg,
        version: "—",
        license: "OFL-1.1",
        attribution: text.split("\n")[0].trim(),
        dir: null,
        text,
        // OFL-1.1：版权声明与许可正文必须随字体副本分发，全部收录而非只留代表份。
        forceText: true,
      };
    });
}

// ── 归属与许可正文索引 ────────────────────────────────────────

/**
 * 为每个组件补齐 `copyright`（版权行）与 `ids`（SPDX 标识集合），
 * 并构建许可正文附录。
 *
 * 附录策略：每个 SPDX 标识收录一份代表性全文；但**自托管字体例外** —— OFL-1.1 要求
 * 版权声明与许可正文随字体副本一同分发，因此三个字体各自的正文全部收录。
 */
function indexComponents(components) {
  /** hash → { hash, text, ids: Set, refs, force, owners: Set } */
  const texts = new Map();

  for (const component of components) {
    const ids = parseLicenseIds(component.license);
    component.ids = ids;

    const files = component.text
      ? [{ file: "LICENSE.txt", text: component.text, copyrights: [component.attribution] }]
      : readLicenseFiles(component.dir);

    const copyrights = [];
    component.textHashes = [];
    for (const file of files) {
      for (const id of matchFileToIds(file.file, ids)) {
        const hash = sha256(file.text);
        if (!texts.has(hash)) {
          texts.set(hash, {
            hash,
            text: file.text,
            ids: new Set(),
            refs: 0,
            force: false,
            owners: new Set(),
          });
        }
        const record = texts.get(hash);
        record.ids.add(id);
        record.refs += 1;
        record.force ||= component.forceText === true;
        record.owners.add(component.name);
        component.textHashes.push(hash);
      }
      copyrights.push(...file.copyrights);
    }

    component.copyright = [...new Set(copyrights)].join("; ") || component.attribution || "—";
    // 部分 crate 未在 Cargo.toml 声明 authors，而许可文件里也无版权行。
    if (component.copyright === "—") component.copyright = "(not declared upstream)";
  }

  // 每个 SPDX 标识选一份代表性正文：被引用最多 → 版权行最少 → 最短 → 哈希。
  // 「版权行最少」使附录优先展示不带特定主体页眉的许可模板正文。
  const representative = new Map();
  for (const record of texts.values()) {
    for (const id of record.ids) {
      const current = representative.get(id);
      const better =
        !current ||
        record.refs > current.refs ||
        (record.refs === current.refs && copyrightCount(record) < copyrightCount(current)) ||
        (record.refs === current.refs &&
          copyrightCount(record) === copyrightCount(current) &&
          record.text.length < current.text.length) ||
        (record.refs === current.refs &&
          copyrightCount(record) === copyrightCount(current) &&
          record.text.length === current.text.length &&
          record.hash < current.hash);
      if (better) representative.set(id, record);
    }
  }

  // 组装附录：每个标识一份代表正文，加上所有强制收录的正文（字体）。
  const appendix = [];
  const anchorOfHash = new Map();
  for (const id of [...representative.keys()].sort((a, b) => a.localeCompare(b))) {
    const chosen = representative.get(id);
    const anchor = anchorOf(id);
    appendix.push({ anchor, id, title: id, text: chosen.text });
    anchorOfHash.set(`${id}\u0000${chosen.hash}`, anchor);

    for (const record of texts.values()) {
      if (!record.force || record === chosen || !record.ids.has(id)) continue;
      const owner = [...record.owners].sort()[0];
      const extraAnchor = `${anchor}-${owner.replace(/[^A-Za-z0-9]+/g, "-").toLowerCase()}`;
      appendix.push({ anchor: extraAnchor, id, title: `${id} — ${owner}`, text: record.text });
      anchorOfHash.set(`${id}\u0000${record.hash}`, extraAnchor);
    }
  }

  // 把每个组件指向它在附录中的落点（可能为空：上游未附正文时才没有落点）。
  for (const component of components) {
    component.textRefs = [];
    for (const hash of new Set(component.textHashes)) {
      for (const id of component.ids) {
        const anchor = anchorOfHash.get(`${id}\u0000${hash}`);
        if (anchor && !component.textRefs.some((ref) => ref.anchor === anchor)) {
          component.textRefs.push({ anchor, id });
        }
      }
    }
    component.textRefs.sort((a, b) => a.anchor.localeCompare(b.anchor));
  }

  return appendix;
}

function copyrightCount(record) {
  return record.text
    .split("\n")
    .filter((line) => COPYRIGHT_LINE_RE.test(line.trim()) && !BOILERPLATE_RE.test(line)).length;
}

// ── 渲染 ──────────────────────────────────────────────────────

function anchorOf(id) {
  return id.replace(/[^A-Za-z0-9.+-]+/g, "-").toLowerCase();
}

function renderSummary(components, covered) {
  const counts = new Map();
  for (const component of components) {
    for (const id of component.ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return [
    "| License | Components |",
    "| :--- | ---: |",
    // 只有真正带正文小节的标识才做锚点链接，否则会指向不存在的位置。
    ...rows.map(([id, count]) =>
      covered.has(id)
        ? `| [\`${id}\`](#${anchorOf(id)}) | ${count} |`
        : `| \`${id}\` | ${count} |`,
    ),
  ].join("\n");
}

function renderComponents(components, covered) {
  const sorted = [...components].sort(
    (a, b) => a.name.localeCompare(b.name) || String(a.version).localeCompare(String(b.version)),
  );
  return [
    "| Component | Version | License | Copyright |",
    "| :--- | :--- | :--- | :--- |",
    ...sorted.map((component) => {
      // 优先使用该组件具体的落点（例如某款字体自己的 OFL 小节），
      // 否则退回该标识的通用小节；上游未附正文的标识保持纯文本，不做死链。
      const preferred = new Map(component.textRefs.map((ref) => [ref.id, ref.anchor]));
      const license = component.ids
        .map((id) => {
          const anchor = preferred.get(id) ?? (covered.has(id) ? anchorOf(id) : null);
          return anchor ? `[\`${id}\`](#${anchor})` : `\`${id}\``;
        })
        .join(" / ");
      const copyright = component.copyright.replace(/\|/g, "\\|").replace(/\s+/g, " ");
      return `| \`${component.name}\` | ${component.version} | ${license} | ${copyright} |`;
    }),
  ].join("\n");
}

function renderTexts(appendix) {
  return appendix
    .map((entry) =>
      [
        `<a id="${entry.anchor}"></a>`,
        "",
        `### ${entry.title}`,
        "",
        `Reproduced for components licensed as \`${entry.id}\`.`,
        "",
        "```text",
        entry.text.trimEnd(),
        "```",
        "",
      ].join("\n"),
    )
    .join("\n");
}

function render(rust, npm, fonts, appendix) {
  const covered = new Set(appendix.map((entry) => entry.id));
  const missing = [...new Set([...rust, ...npm, ...fonts].flatMap((c) => c.ids))]
    .filter((id) => !covered.has(id))
    .sort();

  return `<!--
  GENERATED FILE — DO NOT EDIT BY HAND.
  Regenerate with: pnpm gen:licenses
  Verify without writing (CI): pnpm check:licenses
-->

# Third-Party Licenses

Inventory of every third-party component distributed with SrP-CFG, with the SPDX license
identifier and copyright line for each. SrP-CFG itself is licensed under the
[MIT License](LICENSE); see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for narrative
attribution and compliance notes (fonts, data sources, copyleft review).

## What is covered

| Artifact | Third-party content |
| :--- | :--- |
| \`SrP-CFG_Setup_x64.exe\` · \`SrP-CFG_Installer.msi\` | Rust crates (statically linked, \`${RUST_TARGET}\`) + bundled frontend npm packages + 3 self-hosted fonts |
| \`cfg.srprolin.top\` (website, docs, command center) | npm production dependencies + 3 self-hosted fonts |
| \`SrP-CFG_Runtime_Core.zip\` · \`_Map_Guides.zip\` · \`_Video_Settings.zip\` | None — project-authored configuration only |

Build-time-only tooling (bundlers, CSS transformers, type checkers, content pipeline) is
excluded: it is never linked into or shipped with a release artifact. Only
platform-agnostic packages are listed, so the inventory is identical on any machine and can
be verified on any CI runner.

## Contents

- [1. Desktop suite — Rust crates](#1-desktop-suite--rust-crates) (${rust.length})
- [2. Frontend & website — npm packages](#2-frontend--website--npm-packages) (${npm.length})
- [3. Self-hosted fonts](#3-self-hosted-fonts) (${fonts.length})
- [Appendix — license texts](#appendix--license-texts) (${appendix.length})

---

## 1. Desktop suite — Rust crates

Resolved for the \`${RUST_TARGET}\` target, excluding SrP-CFG workspace members.

${renderSummary(rust, covered)}

> A component under a dual license such as \`MIT OR Apache-2.0\` is counted in both
> rows, so the column total exceeds the component count.

<details>
<summary>Component list</summary>

${renderComponents(rust, covered)}

</details>

---

## 2. Frontend & website — npm packages

Production dependency closure of \`@srp-cfg/desktop\`, \`@srp-cfg/website\` and \`@srp-cfg/ui\`.
Packages that declare a platform restriction (the npm \`os\`/\`cpu\` fields — for example the
native compiler binaries shipped by TypeScript 7) are excluded: they are build tooling that
never reaches a release artifact, and including them would make this file depend on the
machine that generated it.

${renderSummary(npm, covered)}

<details>
<summary>Component list</summary>

${renderComponents(npm, covered)}

</details>

---

## 3. Self-hosted fonts

Vendored at \`app/shared/fonts/\` and copied into both apps' build output by
\`scripts/sync-fonts.mjs\`, which fails the build if any font is missing its license.

${renderComponents(fonts, covered)}

---

## Appendix — license texts

Each SPDX identifier below is reproduced once. Where a license requires the copyright
notice to accompany the license, that notice is the \`Copyright\` column above and, for
fonts, the first line of the text below.
${
  missing.length > 0
    ? `\n> ℹ️ No standalone text is reproduced for: ${missing
        .map((id) => `\`${id}\``)
        .join(", ")}. These identifiers appear only as an alternative in a disjunctive
> expression (currently \`dunce\`, declared \`CC0-1.0 OR MIT-0 OR Apache-2.0\`), and the crate
> ships a single generic \`LICENSE\` file that cannot be attributed to one alternative without
> guessing. They are listed for completeness; both are maximally permissive
> (public-domain-equivalent) licenses and their texts are available from the upstream projects.\n`
    : ""
}
${renderTexts(appendix)}
`;
}

// ── 入口 ──────────────────────────────────────────────────────

function main() {
  const rust = collectRust();
  const npm = collectNpm();
  const fonts = collectFonts();
  const appendix = indexComponents([...rust, ...npm, ...fonts]);
  const markdown = render(rust, npm, fonts, appendix);

  if (CHECK) {
    const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, "utf8") : "";
    if (current !== markdown) {
      console.error(
        "✗ THIRD_PARTY_LICENSES.md 与当前依赖闭包不一致。\n" +
          "  请运行 `pnpm gen:licenses` 重新生成后提交。",
      );
      process.exit(1);
    }
    console.log(
      `✓ 第三方许可清单已是最新（Rust ${rust.length} · npm ${npm.length} · 字体 ${fonts.length} · 正文 ${appendix.length}）`,
    );
    return;
  }

  writeFileSync(OUTPUT, markdown, "utf8");
  console.log(
    `✓ THIRD_PARTY_LICENSES.md 已生成（Rust ${rust.length} · npm ${npm.length} · 字体 ${fonts.length} · ` +
      `正文 ${appendix.length}，${(Buffer.byteLength(markdown) / 1024).toFixed(0)} KB）`,
  );
}

main();
