import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { createApi } from "./lib/api";
import "./styles/global.css";

// Tauri 无 preload：由本适配层以相同的 ElectronAPI 签名注入 window.api
// （renderer 各组件调用点零改动，Rust command 见 src-tauri/src/commands/）
window.api = createApi();

// 桌面端是套壳 WebView：禁止默认右键菜单（浏览器菜单的前进/后退/刷新/
// 查看源代码等对桌面应用无意义）。WebView2 在页面 contextmenu 被阻止后
// 不会再弹出默认 Chromium 菜单；如后续需要保留文本框的复制/粘贴菜单，
// 可在此改为仅对非可编辑元素 preventDefault。
window.addEventListener("contextmenu", (e) => e.preventDefault());

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");
const root = createRoot(rootEl);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
