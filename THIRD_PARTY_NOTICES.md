# Third-party notices / 第三方声明

SrP-CFG's own code and documentation are MIT licensed, © 2025–2026 RoL1n_SrP. The root [LICENSE](LICENSE) does not replace third-party licenses or grant rights to Valve trademarks and artwork.

SrP-CFG 自有代码和文档采用 MIT，作者 RoL1n_SrP。第三方库、字体、游戏图片和商标保留各自权利。

## Desktop / 桌面应用

| Component | Terms and copyright | License text |
| --- | --- | --- |
| Qt 6 runtime | LGPL-3.0, The Qt Company and contributors; dynamically linked | [Qt license notice, GPLv3 and LGPLv3](licenses/Qt-LGPL-3.0.txt) |
| HuskarUI | MIT, © 2026 mengps | [MIT](licenses/HuskarUI-MIT.txt) |
| QWindowKit | Apache-2.0, Stdware Collections and wangwenx190 | [Apache-2.0](licenses/QWindowKit-Apache-2.0.txt) |
| StdCoreLib | MIT, © 2022–present Stdware Collections | [MIT](licenses/StdCoreLib.txt) |
| QR Code Generator | MIT, Project Nayuki | [MIT](licenses/QRCodeGenerator-MIT.txt) |

HuskarUI and its icon-font asset are retained from the pinned upstream submodule. This repository does not assert a separate font license that upstream has not documented. See [HuskarUI](https://github.com/mengps/HuskarUI) for its source and notices.

Qt DLLs remain replaceable by compatible builds. Reverse engineering to debug modifications to LGPL components is permitted under their license. Qt source and module-specific third-party notices are available from [Qt source archives](https://download.qt.io/archive/qt/) and [Qt third-party licensing](https://doc.qt.io/qt-6/licenses-used-in-qt.html). Check the packaged DLL versions when obtaining matching Qt source. SrP-CFG's source is available in this repository; GPL-covered development tools are build tools rather than a relicensing of SrP-CFG itself.

Qt 动态库可替换为兼容版本；为调试 LGPL 组件修改而进行的逆向工程遵循 LGPL 权利。获取源码时应与发布包中的 Qt 版本对应。

## Website and fonts / 网站与字体

The website uses Next.js, React, Motion, Radix UI, Lucide, Tailwind CSS, Font Awesome and their dependencies. Their terms differ: Font Awesome includes CC-BY-4.0 artwork, fonts use OFL, and build-time native packages may have additional notices. Do not treat the entire dependency graph as MIT.

`node scripts/collect-licenses.mjs` collects installed production dependency license files into `website/public/third-party-licenses.txt`; the Pages workflow publishes this generated file. Uninstalled platform-specific dependencies are excluded. Packages without standalone license text retain their declared license and upstream reference in the generated report.

| Font | Copyright | Terms |
| --- | --- | --- |
| Inter | The Inter Project Authors | [OFL-1.1](licenses/Inter-OFL-1.1.txt) |
| JetBrains Mono | The JetBrains Mono Project Authors | [OFL-1.1](licenses/JetBrainsMono-OFL-1.1.txt) |

## CS2 content / 游戏内容

Counter-Strike, CS2, Steam and Valve are Valve Corporation trademarks. CS2 artwork and extracted game data remain subject to their original rights. Valve baseline data references [SteamDatabase/GameTracking-CS2](https://github.com/SteamDatabase/GameTracking-CS2). Community preset attribution is retained in the configuration files.

SrP-CFG is an independent tool with no Valve endorsement. It edits configuration files; this statement does not guarantee any particular anti-cheat or future game compatibility outcome.
