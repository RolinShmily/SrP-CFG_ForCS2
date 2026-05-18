import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src/renderer",
  plugins: [react()],
  build: {
    outDir: "../../.vite/renderer/main_window",
    emptyOutDir: true,
  },
});
