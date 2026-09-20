// Tauri 专用 renderer 构建配置（root = src/renderer）。
// Tauri 的 beforeDevCommand / beforeBuildCommand 使用本文件（vite 默认入口），
// 产物输出到 app/desktop/dist（tauri.conf.json frontendDist: ../dist）。
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json";

export default defineConfig({
  root: "src/renderer",
  plugins: [react()],
  // file:// 加载（打包后 Tauri 用 WebView2 加载本地资源）需要相对路径
  base: "./",
  define: {
    // 版本号单点来源：app/desktop/package.json（发版只改这一处）
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
});
