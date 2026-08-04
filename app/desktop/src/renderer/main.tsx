import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { createApi } from "./lib/api";
import "./styles/global.css";

// Tauri 无 preload：由本适配层以相同的 ElectronAPI 签名注入 window.api
// （renderer 各组件调用点零改动，Rust command 见 src-tauri/src/commands/）
window.api = createApi();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");
const root = createRoot(rootEl);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
