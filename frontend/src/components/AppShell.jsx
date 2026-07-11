import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import OnboardingModal from "./OnboardingModal";
import { trackEvent } from "../lib/track";
import "./ResponsiveShell.css";

export default function AppShell({ children }) {
  const location = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); trackEvent("page_view", { path: location.pathname }); }, [location.pathname]);
  return <div className="app-frame">
    <a className="skip-link" href="#asosiy-kontent">Asosiy kontentga o‘tish</a>
    <OnboardingModal />
    <Navbar />
    <main id="asosiy-kontent" className={location.pathname === "/" ? "page-main page-main--home" : "page-main"}>{children}</main>
    <footer className="site-footer">
      <div className="footer-statement"><strong>Designora</strong><p>Dizaynni amaliy ish, feedback va natija orqali o‘rganing.</p></div>
      <nav aria-label="Footer"><Link to="/kurslar">Kurslar</Link><Link to="/forum">Forum</Link><Link to="/pricing">Narxlar</Link><Link to="/maxfiylik">Maxfiylik</Link><Link to="/shartlar">Shartlar</Link></nav>
      <small>© 2026 Designora</small>
    </footer>
  </div>;
}
