/**
 * 首页 /（对应原 src/pages/index.astro，React 化）。
 * 组装 Hero / Features / Showcase / Steps / CTA；meta 对齐原 MainLayout 的 title/description。
 * TODO(L3.2 下载页)：LATEST_VERSION 由 data/version.ts 顶层 await 提供，
 * 现以静态 "3" 渲染（见 components/Hero.tsx / TerminalDemo.tsx），下载页迁移时统一改 SSG loader。
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
