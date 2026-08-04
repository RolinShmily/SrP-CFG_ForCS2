// Electron stub —— 供 L0.6 黄金样本 Node 版在 WSL/Linux 上运行
// app/desktop/src/main/services/*.ts 的纯逻辑部分（不依赖真实 Electron 运行时）
// 用法：SRP_CFG_SANDBOX=<sandbox> node golden-node.cjs
// 由 esbuild --alias:electron=<本文件> 注入到打包产物中。

"use strict";
const path = require("path");

const SANDBOX = process.env.SRP_CFG_SANDBOX;
if (!SANDBOX) {
  throw new Error("SRP_CFG_SANDBOX env is required (path to sandbox dir)");
}

// ── GitHub Releases 假数据（对应 updater 场景）──────────────
// tag/资产分布：v3.2.0 带 desktop marker + config 包；3.1.6/3.1.5 仅 config；
// 2.9.0 无资产（用于验证 filter_at_least >= 3.0.0 的下限过滤）。
const FAKE_RELEASES = [
  {
    tag_name: "v3.2.0",
    name: "Release 3.2.0",
    body: "desktop + config",
    html_url: "https://github.com/RolinShmily/SrP-CFG_ForCS2/releases/tag/v3.2.0",
    published_at: "2026-08-01T00:00:00Z",
    assets: [{ name: "DESKTOP_UPDATE_MARKER" }, { name: "SrP-CFG_Runtime_Core.zip" }],
  },
  {
    tag_name: "3.1.6",
    name: "Release 3.1.6",
    body: "config only",
    html_url: "https://github.com/RolinShmily/SrP-CFG_ForCS2/releases/tag/3.1.6",
    published_at: "2026-07-01T00:00:00Z",
    assets: [{ name: "SrP-CFG_Runtime_Core.zip" }],
  },
  {
    tag_name: "3.1.5",
    name: "Release 3.1.5",
    body: "config only",
    html_url: "https://github.com/RolinShmily/SrP-CFG_ForCS2/releases/tag/3.1.5",
    published_at: "2026-06-01T00:00:00Z",
    assets: [{ name: "SrP-CFG_Runtime_Core.zip" }],
  },
  {
    tag_name: "2.9.0",
    name: "Release 2.9.0",
    body: "old, no assets",
    html_url: "https://github.com/RolinShmily/SrP-CFG_ForCS2/releases/tag/2.9.0",
    published_at: "2026-05-01T00:00:00Z",
    assets: [],
  },
];

module.exports = {
  app: {
    getPath: (name) => {
      // appData → <sandbox>/appdata（install/res/save/staging/upload/download 的基目录）
      // userData → <sandbox>/userdata（updater 的 update-cache）
      if (name === "appData") return path.join(SANDBOX, "appdata");
      if (name === "userData") return path.join(SANDBOX, "userdata");
      return path.join(SANDBOX, name);
    },
    getVersion: () => "3.1.6",
  },
  net: {
    fetch: async () => ({ ok: true, status: 200, json: async () => FAKE_RELEASES }),
  },
  shell: {
    openPath: () => {},
    openExternal: () => {},
  },
  ipcMain: { handle: () => {}, on: () => {} },
  ipcRenderer: { invoke: async () => {}, on: () => {}, send: () => {} },
};
