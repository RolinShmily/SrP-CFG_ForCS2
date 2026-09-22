<div align="center">

[English](THIRD_PARTY_NOTICES.md) | [简体中文](THIRD_PARTY_NOTICES.zh-CN.md)

</div>

# 第三方声明

SrP-CFG 以 [MIT License](LICENSE) 开源。本文件记录它所依赖的第三方成果、各方要求的署名，
以及支撑上述结论的许可审查结果。

**完整的组件清单** —— 每个包的名称、版本、SPDX 标识与版权行，以及每种许可正文的一份副本
—— 位于 [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)。该文件由脚本生成，本文件为人工撰写。

---

## 1. 字体

三款字体收录于 `app/shared/fonts/`，由桌面端与官网分别自托管。每款字体都带自己的
`LICENSE.txt`，`scripts/sync-fonts.mjs` 会把它复制进两端产物 —— **任一款字体缺失许可文件
都会直接让构建失败**，因此发布产物不可能悄悄漏掉其中之一。

三款字体均以 [SIL Open Font License 1.1](https://openfontlicense.org) 授权，该协议要求版权声明
与许可正文随每一份副本分发。

| 字体 | 版权 | 上游 |
| :--- | :--- | :--- |
| **Inter** | Copyright (c) 2016 The Inter Project Authors | [rsms/inter](https://github.com/rsms/inter) |
| **JetBrains Mono** | Copyright 2020 The JetBrains Mono Project Authors | [JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono) |
| **Noto Sans SC** | Copyright 2014-2021 Adobe, with Reserved Font Name 'Source' | [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk) · [Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+SC) |

`.woff2` 为上游可变字体经 [Fontsource](https://fontsource.org/) 重新打包的版本；字形轮廓、字距与
命名均未修改。保留字体名 `Source` 未被使用 —— CSS 字体族名为 `Inter Variable`、
`JetBrains Mono Variable` 与 `Noto Sans SC Variable`。

各字体的 OFL-1.1 全文见
[THIRD_PARTY_LICENSES.md § 自托管字体](THIRD_PARTY_LICENSES.md#3-self-hosted-fonts)。

---

## 2. CS2 游戏数据

### 指令与 ConVar 元数据

`app/website/public/data/commands.json` 支撑在线指令中心（2,789 条）。其中的名称、flags、类型与
分类提取自社区镜像
[SteamTracking/GameTracking-CS2](https://github.com/SteamTracking/GameTracking-CS2)
（`DumpSource2/commands.txt`、`DumpSource2/convars.txt`），该仓库转载自游戏二进制导出数据，
且**未声明任何许可**。

SrP-CFG 实际再分发的内容被刻意收窄：

- **包含**：指令与 ConVar 标识符、引擎 flags、取值类型、分类标签，以及**由本项目撰写**的中文说明。
- **不包含**：Valve 自己的帮助文本。数据集的 `d` 与 `en` 描述字段被有意留空，因此没有复制
  任何来自游戏或 Valve 文档的叙述性文字。

指令名及其引擎元数据属于功能性事实，数据集中唯一具有表达性的内容是本项目自撰的。SrP-CFG
已标注该镜像为数据来源，且不对 Valve 的数据主张任何权利。

### 地图标点与视频配置

`config/annotations/**` 与 `config/video/cs2_video.txt` 均为本项目自撰。它们使用 Valve 公开的
文件格式（`MapAnnotationNode` KV3、`video.cfg`），并引用作为游戏事实存在的地图名与世界坐标。
未再分发任何 Valve 撰写的文件。

### 商标

Counter-Strike 2、CS2、Steam 与 Valve 是 Valve Corporation 的商标。SrP-CFG 是独立开源项目，
与 Valve Corporation **无隶属、认可或赞助关系**。商标声明另见 [README](README.zh-CN.md#-开源许可证)。

---

## 3. 软件依赖

桌面端静态链接 Rust crate；桌面端与官网产物包含 npm 包；官网 Worker 运行在 Cloudflare 运行时上。
每一个组件的许可与版权都列在 [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) 中。

### 审查结论

| | |
| :--- | :--- |
| Rust crate（Windows `x86_64-pc-windows-msvc` 闭包） | 281 个 —— 以 MIT / Apache-2.0 双许可为主，另有 Unicode-3.0、Unlicense、MPL-2.0、Zlib、BSD-3-Clause、0BSD、CC0-1.0、CDLA-Permissive-2.0 |
| npm 包（生产依赖闭包） | 34 个 —— MIT、Apache-2.0、ISC、Unlicense |
| 产物中的 copyleft | **无。** 任何发布产物都未链接或附带 GPL / AGPL / LGPL 组件。 |
| 仅构建期使用的工具 | 已排除在清单外 —— 打包器、CSS 转换器、类型检查器与 Velite 内容管线都不会进入发布产物。 |

### 若干许可的说明

- **MPL-2.0**（`cssparser`、`dtoa-short`、`option-ext`、`selectors`，以及构建期的 `lightningcss`）：
  文件级 copyleft。这些 crate 均以未修改形式使用，不触发源码公开义务。其正文已收录于清单。
- **Unicode-3.0**（`icu4x` 系列与 `unicode-ident`）：宽松许可，要求复现版权声明与许可正文，二者
  均已在清单中给出。
- **CDLA-Permissive-2.0**（`webpki-root-certs`）：覆盖证书包的宽松数据许可，正文已收录于清单。
- **Apache-2.0**：所附带的 crate 与 npm 包均未提供 `NOTICE` 文件，故 §4(d) 的 notice 复现义务
  归结为清单中已列出的版权行。
- **LGPL-3.0-or-later**（`sharp` 附带的 libvips 预编译库，经 Velite 内容管线引入）：仅构建期使用，
  未链接进也未随任何产物分发，且已被刻意排除在生产依赖闭包之外。

### 桌面安装器运行时

Windows 版本依赖 [Microsoft Edge WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)，
由 Microsoft 按其自身条款安装与维护，本项目不再分发。

---

## 重新生成清单

`THIRD_PARTY_LICENSES.md` 由依赖图推导而来，而非人工维护：

```bash
pnpm gen:licenses     # 重新写入清单
pnpm check:licenses   # 校验清单与当前依赖图一致（CI 使用）
```

CI 会在每个 Pull Request 上运行 `check:licenses`：依赖发生变更却未同步清单时会直接失败，
而不是把未经审查的内容发出去。
