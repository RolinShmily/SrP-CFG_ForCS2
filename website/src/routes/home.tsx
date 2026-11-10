import type { MetaFunction } from "react-router";

import { AppShowcase } from "@/components/app-showcase";
import { CtaSection } from "@/components/cta-section";
import { HeroSection } from "@/components/hero-section";
import { PillarsSection } from "@/components/pillars-section";
import { WorkflowSection } from "@/components/workflow-section";
import { pageMeta, websiteJsonLd } from "@/lib/console/seo";

const TITLE = "SrP-CFG — 你的 CS2 配置工作台";
const DESCRIPTION =
  "管理 CS2 预设、自由装配功能、定制视频设置与地图指南。下载 Windows 桌面软件及独立 srp-cfg、video、annotations 配置包。";

export const meta: MetaFunction = () => [
  ...pageMeta({
    title: TITLE,
    description: DESCRIPTION,
    path: "/",
    jsonLd: websiteJsonLd(),
  }),
  {
    name: "keywords",
    content:
      "CS2,Counter-Strike 2,CFG,autoexec,jumpthrow,practice cfg,CS2 config,Qt,HuskarUI,CS2 video settings",
  },
];

export default function HomeRoute() {
  return (
    <>
      <HeroSection />
      <AppShowcase />
      <PillarsSection />
      <WorkflowSection />
      <CtaSection />
    </>
  );
}
