// Tauri 专用 renderer 构建配置（root = src/renderer）。
// Tauri 的 beforeDevCommand / beforeBuildCommand 使用本文件（vite 默认入口），
// 产物输出到 app/desktop/dist（tauri.conf.json frontendDist: ../dist）。
// 注：electron-forge 的 vite.renderer.config.ts 已随 L4 清理删除。
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src/renderer",
  plugins: [react()],
  // file:// 加载（打包后 Tauri 用 WebView2 加载本地资源）需要相对路径
  base: "./",
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
});
