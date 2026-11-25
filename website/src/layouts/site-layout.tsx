import { Outlet } from "react-router";

import { CommandPalette } from "@/components/command-palette";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function SiteLayout() {
  return (
    <div className="site-ambient-bg relative flex min-h-screen flex-col">
      <Navbar />
      <CommandPalette />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
