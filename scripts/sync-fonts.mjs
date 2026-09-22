#!/usr/bin/env node
/**
 * 生成自托管字体副本（唯一真源：app/shared/fonts）。
 *
 * 背景：Tailwind v4 的构建管线无法可靠解析跨目录 `@import` 内的 url()，
 * 因此 woff2 必须落在各 app 的 vite publicDir 内（构建期复制进产物），
 * 对应 CSS 也需生成副本并把 url(...) 统一改写为 /fonts/... 绝对路径。
 * 本脚本保证「真源单点维护、两端副本可重复生成」，仓库无需提交副本。
 *
 * 同时复制每个字体包的 LICENSE.txt（OFL-1.1 要求随字体副本一并分发版权声明与许可正文），
 * 落到各 app 的 publicDir/fonts/licenses/ 下，确保官网与桌面端产物都带许可文件。
 *
 * 用法：node scripts/sync-fonts.mjs   （desktop/website 的 dev/build 脚本已自动调用）
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FONTS_SRC = join(ROOT, "app/shared/fonts");

/** 每个 app：publicDir 下的字体目录 + 生成 CSS 的目录（url 均以 /fonts/ 引用） */
const TARGETS = [
  {
    name: "desktop",
    filesDir: join(ROOT, "app/desktop/src/renderer/public/fonts"),
    cssDir: join(ROOT, "app/desktop/src/renderer/styles/fonts"),
  },
  {
    name: "website",
    filesDir: join(ROOT, "app/website/public/fonts"),
    cssDir: join(ROOT, "app/website/src/styles/fonts"),
  },
];

const packages = readdirSync(FONTS_SRC, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

if (packages.length === 0) {
  console.error(`✗ 未在 ${FONTS_SRC} 找到字体包目录`);
  process.exit(1);
}

for (const target of TARGETS) {
  // 全量重建，避免残留旧版本文件
  rmSync(target.filesDir, { recursive: true, force: true });
  rmSync(target.cssDir, { recursive: true, force: true });
  mkdirSync(join(target.filesDir), { recursive: true });
  mkdirSync(join(target.cssDir), { recursive: true });
  mkdirSync(join(target.filesDir, "licenses"), { recursive: true });

  for (const pkg of packages) {
    const srcFiles = join(FONTS_SRC, pkg, "files");
    const srcCss = join(FONTS_SRC, pkg, "index.css");
    const srcLicense = join(FONTS_SRC, pkg, "LICENSE.txt");

    // OFL-1.1 第 2 条：字体副本必须随附版权声明与许可正文，缺失即中止构建。
    if (!existsSync(srcLicense)) {
      console.error(`✗ 字体包 ${pkg} 缺少 LICENSE.txt，无法满足 OFL-1.1 分发要求`);
      process.exit(1);
    }

    for (const f of readdirSync(srcFiles)) {
      if (f.endsWith(".woff2")) cpSync(join(srcFiles, f), join(target.filesDir, f));
    }

    cpSync(srcLicense, join(target.filesDir, "licenses", `${pkg}.txt`));

    const css = readFileSync(srcCss, "utf8").replace(/url\(\.\/files\//g, "url(/fonts/");
    writeFileSync(join(target.cssDir, `${pkg}.css`), css, "utf8");
  }
  console.log(`✓ ${target.name}: fonts → ${target.filesDir.replace(ROOT, ".")}`);
}

console.log(`✓ 字体副本与 OFL 许可已同步（${packages.length} 个字体包 × ${TARGETS.length} 个 app）`);
