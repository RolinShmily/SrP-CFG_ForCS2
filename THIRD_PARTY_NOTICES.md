<div align="center">

[English](THIRD_PARTY_NOTICES.md) | [简体中文](THIRD_PARTY_NOTICES.zh-CN.md)

</div>

# Third-Party Notices

SrP-CFG is licensed under the [MIT License](LICENSE). This file records the third-party
work it builds on, the attribution each one requires, and the results of the license
review behind those statements.

The **complete component inventory** — every package, version, SPDX identifier and
copyright line, plus one reproduction of each license text — lives in
[THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md). That file is generated; this one is
written by hand.

---

## 1. Fonts

Three typefaces are vendored under `app/shared/fonts/` and self-hosted by both the
desktop suite and the website. Each ships with its own `LICENSE.txt`, which
`scripts/sync-fonts.mjs` copies into both build outputs — **the build fails if a font is
missing its license**, so a release cannot silently drop one.

All three are licensed under the [SIL Open Font License 1.1](https://openfontlicense.org),
which requires the copyright notice and license text to travel with every copy.

| Font | Copyright | Upstream |
| :--- | :--- | :--- |
| **Inter** | Copyright (c) 2016 The Inter Project Authors | [rsms/inter](https://github.com/rsms/inter) |
| **JetBrains Mono** | Copyright 2020 The JetBrains Mono Project Authors | [JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono) |
| **Noto Sans SC** | Copyright 2014-2021 Adobe, with Reserved Font Name 'Source' | [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk) · [Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+SC) |

The `.woff2` builds are the upstream variable fonts as repackaged by
[Fontsource](https://fontsource.org/); no glyph outlines, kerning or naming have been
modified. The reserved font name `Source` is not used — the CSS family names are
`Inter Variable`, `JetBrains Mono Variable` and `Noto Sans SC Variable`.

Full OFL-1.1 text for each font: [THIRD_PARTY_LICENSES.md § Self-hosted fonts](THIRD_PARTY_LICENSES.md#3-self-hosted-fonts).

---

## 2. CS2 game data

### Command & ConVar metadata

`app/website/public/data/commands.json` backs the online command center (2,789 entries).
Names, flags, types and categories are extracted from the community mirror
[SteamTracking/GameTracking-CS2](https://github.com/SteamTracking/GameTracking-CS2)
(`DumpSource2/commands.txt`, `DumpSource2/convars.txt`), which republishes data dumped
from the game binaries. That repository declares **no license**.

What SrP-CFG redistributes is deliberately narrow:

- **Included**: command and ConVar identifiers, engine flags, value types, category
  labels, and Chinese descriptions **written by this project**.
- **Not included**: Valve's own help text. The dataset's `d` and `en` description fields
  are intentionally empty, so no prose from the game or from Valve's documentation is
  reproduced.

Command names and their engine metadata are functional facts, and the only expressive
content in the dataset is authored here. SrP-CFG credits the mirror as its source and
makes no claim over Valve's data.

### Map annotations and video settings

`config/annotations/**` and `config/video/cs2_video.txt` are authored by this project.
They use Valve's public file formats (`MapAnnotationNode` KV3, `video.cfg`) and reference
map names and world coordinates that are facts about the game. No Valve-authored file is
redistributed.

### Trademarks

Counter-Strike 2, CS2, Steam and Valve are trademarks of Valve Corporation. SrP-CFG is an
independent open-source project and is **not affiliated with, endorsed by, or sponsored
by** Valve Corporation. See the trademark notice in the [README](README.md#-license).

---

## 3. Software dependencies

The desktop suite statically links Rust crates; the desktop and website bundles include
npm packages; the website Worker runs on Cloudflare's runtime. Every one of them is
listed with its license and copyright in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

### Review summary

| | |
| :--- | :--- |
| Rust crates (Windows `x86_64-pc-windows-msvc` closure) | 281 — MIT / Apache-2.0 dual-licensed majority, plus Unicode-3.0, Unlicense, MPL-2.0, Zlib, BSD-3-Clause, 0BSD, CC0-1.0, CDLA-Permissive-2.0 |
| npm packages (production closure) | 34 — MIT, Apache-2.0, ISC, Unlicense |
| Copyleft in shipped artifacts | **None.** No GPL, AGPL or LGPL component is linked into or shipped with any release artifact. |
| Build-time-only tooling | Excluded from the inventory — bundlers, CSS transformers, type checkers and the Velite content pipeline never reach a release artifact. |

### Notes on specific licenses

- **MPL-2.0** (`cssparser`, `dtoa-short`, `option-ext`, `selectors`, and `lightningcss` at
  build time): file-level copyleft. The crates are used unmodified, so no source
  disclosure obligation is triggered. Their full text is reproduced in the inventory.
- **Unicode-3.0** (the `icu4x` crates and `unicode-ident`): permissive, requires the
  copyright notice and license to be reproduced. Both are in the inventory.
- **CDLA-Permissive-2.0** (`webpki-root-certs`): permissive data license covering a
  certificate bundle. Its text is reproduced in the inventory.
- **Apache-2.0**: none of the bundled crates or packages ship a `NOTICE` file, so the
  §4(d) notice-reproduction obligation resolves to the copyright lines already listed.
- **LGPL-3.0-or-later** (`sharp`'s prebuilt libvips, pulled in by the Velite content
  pipeline): build-time only. It is not linked into or distributed with any artifact, and
  it is deliberately kept out of the production dependency closure.

### Desktop installer runtime

The Windows build targets [Microsoft Edge WebView2](https://developer.microsoft.com/microsoft-edge/webview2/),
which is installed and serviced by Microsoft under its own terms and is not redistributed
by this project.

---

## Regenerating the inventory

`THIRD_PARTY_LICENSES.md` is derived from the dependency graph, not maintained by hand:

```bash
pnpm gen:licenses     # rewrite the inventory
pnpm check:licenses   # verify it matches the current graph (used by CI)
```

CI runs `check:licenses` on every pull request, so a dependency change that is not
reflected in the inventory fails the build rather than shipping unreviewed.
