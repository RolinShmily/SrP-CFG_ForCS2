import { AppShowcase } from "@/components/app-showcase";
import { CtaSection } from "@/components/cta-section";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { MotionProvider } from "@/components/motion-provider";
import { Navbar } from "@/components/navbar";
import { PillarsSection } from "@/components/pillars-section";
import { WorkflowSection } from "@/components/workflow-section";
import { I18nProvider } from "@/context/i18n-context";

export function App() {
  return (
    <I18nProvider>
      <MotionProvider>
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main id="main-content" tabIndex={-1} className="flex-1">
            <HeroSection />
            <AppShowcase />
            <PillarsSection />
            <WorkflowSection />
            <CtaSection />
          </main>
          <Footer />
        </div>
      </MotionProvider>
    </I18nProvider>
  );
}
