import { HeroSection } from "@/components/hero-section";
import { PillarsSection } from "@/components/pillars-section";
import { WorkflowSection } from "@/components/workflow-section";
import { AppShowcase } from "@/components/app-showcase";
import { CtaSection } from "@/components/cta-section";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <AppShowcase />
      <PillarsSection />
      <WorkflowSection />
      <CtaSection />
    </div>
  );
}
