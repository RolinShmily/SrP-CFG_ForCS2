import type { ForgeConfig } from "@electron-forge/shared-types";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";

const config: ForgeConfig = {
  packagerConfig: {
    name: "SrP-CFG Installer",
    icon: "./resources/icon",
  },
  makers: [
    new MakerSquirrel({ name: "SrP-CFG_Installer" }),
    new MakerZIP({}, ["win32"]),
  ],
  plugins: [
    new VitePlugin({
      build: [
        { entry: "src/main/main.ts", config: "vite.main.config.ts" },
        { entry: "src/preload/preload.ts", config: "vite.preload.config.ts" },
      ],
      renderer: [
        { name: "main_window", config: "vite.renderer.config.ts" },
      ],
    }),
  ],
};

export default config;
