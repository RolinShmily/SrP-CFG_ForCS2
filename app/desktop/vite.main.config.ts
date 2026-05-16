import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        "electron",
        "archiver",
        "extract-zip",
        "winreg",
        "path",
        "fs",
        "os",
        "child_process",
        "url",
      ],
    },
  },
});
