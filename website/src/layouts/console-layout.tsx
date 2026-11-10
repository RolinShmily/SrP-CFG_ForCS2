import { Outlet, useLocation } from "react-router";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import "@/styles/console.css";

export default function ConsoleLayout() {
  const location = useLocation();
  return (
    <div className="console-shell flex min-h-screen flex-col">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="console-main flex-1">
        <div key={location.pathname} className="route-page">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
