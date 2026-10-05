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
  title: "SrP-CFG — 你的 CS2 配置工作台",
  description:
    "管理 CS2 预设、自由装配功能、定制视频设置与地图指南。下载 Windows 桌面软件及独立 srp-cfg、video、annotations 配置包。",
  keywords: [
    "CS2",
    "Counter-Strike 2",
    "CFG",
    "autoexec",
    "jumpthrow",
    "practice cfg",
    "CS2 config",
    "Qt",
    "HuskarUI",
    "CS2 video settings",
  ],
  authors: [{ name: "RoL1n_SrP", url: "https://blog.srprolin.top" }],
  creator: "RoL1n_SrP",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/favicon.ico`,
  },
  openGraph: {
    title: "SrP-CFG — 你的 CS2 配置工作台",
    description: "预设、自由装配、视频设置与地图指南。在一个桌面工作台管理你的 CS2 配置。",
    url: "https://cfg.srprolin.top",
    siteName: "SrP-CFG",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SrP-CFG — 你的 CS2 配置工作台",
    description: "了解 SrP-CFG 桌面软件，下载便携版、安装版及独立配置包。",
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
        {basePath ? (
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
        ) : null}
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
                <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
                <Footer />
              </div>
            </MotionProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
