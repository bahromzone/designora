import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./ResponsiveShell.css";

const publicLinks = [{ label: "Kurslar", to: "/kurslar" }, { label: "Yo‘llar", to: "/learning-paths" }, { label: "Forum", to: "/forum" }];
const memberLinks = [{ label: "Mening kurslarim", to: "/kurslarim" }, { label: "Yutuqlar", to: "/achievements" }, { label: "Kalendar", to: "/calendar" }];

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    return () => document.body.classList.remove("nav-open");
  }, [open]);
  const links = isAuthenticated ? [...publicLinks, ...memberLinks] : publicLinks;
  return <header className="site-nav" data-testid="site-nav">
    <Link className="site-brand" to="/" aria-label="Designora bosh sahifa"><span aria-hidden="true">D</span><strong>Designora</strong></Link>
    <nav className="desktop-nav" aria-label="Asosiy navigatsiya">{links.map(link => <NavLink key={link.to} to={link.to}>{link.label}</NavLink>)}</nav>
    <div className="desktop-auth">{isAuthenticated ? <><span>{user?.full_name || user?.name}</span><button onClick={logout}>Chiqish</button></> : <><Link to="/?modal=login">Kirish</Link><Link className="nav-cta" to="/?modal=signup">Hisob yaratish</Link></>}</div>
    <button className="menu-toggle" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Menyuni yopish" : "Menyuni ochish"} onClick={() => setOpen(value => !value)}><span/><span/></button>
    <div className={`mobile-drawer ${open ? "is-open" : ""}`} id="mobile-navigation" aria-hidden={!open}>
      <nav aria-label="Mobil navigatsiya">{links.map((link, index) => <NavLink key={link.to} to={link.to}><span>{String(index + 1).padStart(2, "0")}</span>{link.label}</NavLink>)}</nav>
      <div className="mobile-auth">{isAuthenticated ? <button onClick={logout}>Hisobdan chiqish</button> : <><Link to="/?modal=login">Kirish</Link><Link to="/?modal=signup">Hisob yaratish</Link></>}</div>
    </div>
  </header>;
}
