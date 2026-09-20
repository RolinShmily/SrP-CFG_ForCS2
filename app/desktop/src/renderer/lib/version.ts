import { useEffect, useState } from "react";

declare global {
  /** 构建期由 vite define 注入（来源：app/desktop/package.json 的 version，见 vite.config.ts）。 */
  const __APP_VERSION__: string;
}

/** 构建期注入的应用版本号。 */
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";

/**
 * 应用版本号 hook：优先取 Tauri 运行时版本（打包后来自 tauri.conf.json），
 * 开发/浏览器（mock api）环境回落构建期注入的 APP_VERSION。
 */
export function useAppVersion(): string {
  const [version, setVersion] = useState(APP_VERSION);

  useEffect(() => {
    window.api
      ?.getVersion?.()
      .then((v) => {
        if (v) setVersion(v);
      })
      .catch(() => {});
  }, []);

  return version;
}
