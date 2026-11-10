import { Outlet, useLocation } from "react-router";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function SiteLayout() {
  const location = useLocation();
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <div key={location.pathname} className="route-page">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
