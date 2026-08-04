/**
 * 首页 /（对应原 src/pages/index.astro，React 化）。
 * 组装 Hero / Features / Showcase / Steps / CTA；meta 对齐原 MainLayout 的 title/description。
 * LATEST_VERSION 已改为 vite 插件构建期注入（见 data/version.ts / vite.config.ts）。
 */
import type { MetaFunction } from "react-router";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { Showcase } from "../components/Showcase";
import { Steps } from "../components/Steps";
import { CTA } from "../components/CTA";

export const meta: MetaFunction = () => [
  { title: "SrP-CFG v3 — CS2 模块化 CFG Runtime" },
  {
    name: "description",
    content:
      "SrP-CFG v3：把 Runtime 功能、Preset 案例、用户配置与 CS2 VCFG 状态分层管理。",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Showcase />
      <Steps />
      <CTA />
    </>
  );
}
