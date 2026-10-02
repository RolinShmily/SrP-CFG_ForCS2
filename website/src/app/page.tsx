import { HeroSection } from "@/components/hero-section";
import { PillarsSection } from "@/components/pillars-section";
import { WorkflowSection } from "@/components/workflow-section";
import { KeybindsSection } from "@/components/keybinds-section";
import { CtaSection } from "@/components/cta-section";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <PillarsSection />
      <WorkflowSection />
      <KeybindsSection />
      <CtaSection />
    </div>
  );
}
