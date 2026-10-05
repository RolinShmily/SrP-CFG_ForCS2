# Third-Party Notices & Attribution (第三方开源声明)

SrP-CFG is licensed under the [MIT License](LICENSE) © 2025-2026 RoL1n_SrP.  
This document records the third-party open-source components, libraries, fonts, and frameworks used across the desktop suite, configuration packages, and official website.

---

## 1. Desktop Application Runtime & Libraries (桌面客户端)

### Qt 6 Toolkit
- **Copyright**: Copyright (C) 2024 The Qt Company Ltd. and other contributors.
- **License**: [GNU Lesser General Public License version 3 (LGPLv3)](https://www.gnu.org/licenses/lgpl-3.0.html) / Commercial.
- **Notice & LGPL Compliance**:
  - SrP-CFG dynamically links against Qt 6 libraries (`Qt6Core.dll`, `Qt6Gui.dll`, `Qt6Quick.dll`, `Qt6QuickControls2.dll`, `Qt6Concurrent.dll`, etc.).
  - In accordance with the GNU LGPLv3, end users have the right to modify, recompile, and replace these dynamic link libraries with their own compatible versions without violating the application license.
  - Full source code for SrP-CFG is openly available in this repository under the MIT License.
- **Upstream**: [https://www.qt.io/](https://www.qt.io/)

### HuskarUI
- **Copyright**: Copyright (c) 2026 mengps
- **License**: [MIT License](https://opensource.org/licenses/MIT)
- **Notice**: Embedded in `app/gui/3rdparty/HuskarUI`.
- **Upstream**: [https://github.com/mengps/HuskarUI](https://github.com/mengps/HuskarUI)

### QWindowKit
- **Copyright**:
  - Copyright (C) 2023-present Stdware Collections (https://www.github.com/stdware)
  - Copyright (C) 2021-2023 wangwenx190 (Yuhang Zhao)
- **License**: [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- **Notice**: Submodule / submodule dependency of HuskarUI under `app/gui/3rdparty/HuskarUI/3rdparty/qwindowkit`.
- **Upstream**: [https://github.com/stdware/qwindowkit](https://github.com/stdware/qwindowkit)

### QR Code Generator (C++)
- **Copyright**: Copyright (c) Project Nayuki
- **License**: [MIT License](https://opensource.org/licenses/MIT)
- **Notice**: Bundled in HuskarUI (`3rdparty/QR-Code-generator`).
- **Upstream**: [https://www.nayuki.io/page/qr-code-generator-library](https://www.nayuki.io/page/qr-code-generator-library)

---

## 2. Fonts (字体资产)

### Inter
- **Copyright**: Copyright (c) 2016 The Inter Project Authors
- **License**: [SIL Open Font License 1.1](https://openfontlicense.org)
- **Upstream**: [https://github.com/rsms/inter](https://github.com/rsms/inter)

### JetBrains Mono
- **Copyright**: Copyright 2020 The JetBrains Mono Project Authors
- **License**: [SIL Open Font License 1.1](https://openfontlicense.org)
- **Upstream**: [https://github.com/JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono)

### HuskarUI-Icons
- **Copyright**: Copyright (C) mengps. Shipped with HuskarUI.
- **License**: [SIL Open Font License 1.1](https://openfontlicense.org) / MIT

---

## 3. Web Showcase & Dependencies (展示网站及依赖)

The official website is built with Next.js, React, TypeScript, Tailwind CSS, Motion, Radix UI, and Lucide.  
All direct and transitive production dependencies are published under permissive open-source licenses (MIT, Apache-2.0, ISC, BSD).

| Component | License | Author / Copyright | Upstream |
| :--- | :--- | :--- | :--- |
| **Next.js** | MIT | Copyright (c) Vercel, Inc. | [vercel/next.js](https://github.com/vercel/next.js) |
| **React** | MIT | Copyright (c) Meta Platforms, Inc. | [facebook/react](https://github.com/facebook/react) |
| **Tailwind CSS** | MIT | Copyright (c) Tailwind Labs, Inc. | [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) |
| **Motion** | MIT | Copyright (c) Framer B.V. | [motiondivision/motion](https://github.com/motiondivision/motion) |
| **Radix UI** | MIT | Copyright (c) WorkOS | [radix-ui/primitives](https://github.com/radix-ui/primitives) |
| **Lucide Icons** | ISC | Copyright (c) Lucide Contributors | [lucide-icons/lucide](https://github.com/lucide-icons/lucide) |
| **FontAwesome** | MIT / CC BY 4.0 | Copyright (c) Fonticons, Inc. | [FortAwesome/Font-Awesome](https://github.com/FortAwesome/Font-Awesome) |

A complete dependency license manifest is automatically generated during build and accessible at `website/public/third-party-licenses.txt`.

---

## 4. Game Data & Trademarks (游戏数据与商标声明)

- **Trademarks**: Counter-Strike, Counter-Strike 2, CS2, Steam, and Valve are registered trademarks of **Valve Corporation**.
- **Disclaimer**: SrP-CFG is an independent open-source utility and is **not affiliated with, endorsed by, sponsored by, or associated with Valve Corporation**.
- **Game Compatibility**: SrP-CFG interacts with Counter-Strike 2 strictly through public engine command scripts (`.cfg`), KeyValues (`cs2_video.txt`), and native KV3 structures (`MapAnnotationNode`). No engine binaries are modified, and no anti-cheat boundaries are violated.
