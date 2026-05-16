import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");
const root = createRoot(rootEl);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
