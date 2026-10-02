import type { Metadata, Viewport } from "next";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoAddCss = false;

import "./globals.css";
import { MotionProvider } from "@/components/motion-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/context/i18n-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "SrP-CFG - CS2 原生配置运行时与桌面套件",
  description:
    "面向 CS2 竞技选手与深度定制玩家的现代化原生配置运行时与跨平台桌面管理套件。100% VAC 安全原生机制，Steam 云同步双轨共存，全物理路径差异审计与 10 级时间戳快照回滚。",
  keywords: [
    "CS2",
    "Counter-Strike 2",
    "CFG",
    "autoexec",
    "jumpthrow",
    "practice cfg",
    "CS2 config",
    "Tauri",
    "Rust",
    "VAC Safe",
  ],
  authors: [{ name: "RoL1n_SrP", url: "https://blog.srprolin.top" }],
  creator: "RoL1n_SrP",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "SrP-CFG - CS2 原生配置运行时与桌面套件",
    description:
      "零注入 · 100% VAC 安全。原生机制、Steam 云同步双轨、秒级快照与 CS2 语法高亮编辑器。",
    url: "https://cfg.srprolin.top",
    siteName: "SrP-CFG",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SrP-CFG - CS2 原生配置运行时与桌面套件",
    description:
      "面向 CS2 竞技玩家的原生配置运行时与桌面管理套件，100% VAC 安全。",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e17" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {basePath && (
          <style
            dangerouslySetInnerHTML={{
              __html: `
                :root {
                  --cs2-bg-header: url("${basePath}/cs2/header_bg.svg");
                  --cs2-bg-orange: url("${basePath}/cs2/bgOrange.svg");
                  --cs2-bg-blue: url("${basePath}/cs2/bgDarkBlue.svg");
                  --cs2-bg-gray: url("${basePath}/cs2/bgGray.svg");
                  --cs2-linemap: url("${basePath}/cs2/linemap-20.png");
                }
              `,
            }}
          />
        )}
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <MotionProvider>
              <div className="relative flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </MotionProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
