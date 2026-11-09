import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import "./globals.css";
import { App } from "./App";

// The deployment base path is injected into index.html as CSS variables, so the
// artwork and preloaded images are already correct before this bundle runs.

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root is missing from index.html");

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Production builds are prerendered by scripts/prerender.mjs; Vite dev is not.
if (container.firstElementChild) hydrateRoot(container, app);
else createRoot(container).render(app);
