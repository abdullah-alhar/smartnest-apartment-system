import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { initialsOf } from "../utils/roles";
import Brand from "./Brand";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import { Button } from "./ui";
import { cx } from "./styles";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/apartments", label: "Apartments" },
  { to: "/promotions", label: "Promotions" },
];

// Extra links a signed-in customer sees in the header.
const CUSTOMER_LINKS = [
  { to: "/reservations", label: "Reservations" },
  { to: "/appointments", label: "Site Visits" },
  { to: "/inquiries", label: "Inquiries" },
];

/** Top navigation for visitors and customers. Staff use the sidebar portal instead. */
function TopNavbar() {
  const { token, firstName, lastName, logout } = useAuth();
  const loggedIn = !!token;
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const links = loggedIn ? [...LINKS, ...CUSTOMER_LINKS] : LINKS;
  const overHero = location.pathname === "/";
  const transparent = overHero && !scrolled && !menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Same primary bar on every page; only the home hero shows it as see-through glass until you scroll.
  const navBg = transparent
    ? "bg-primary/25 backdrop-blur-lg border-b border-white/10"
    : "bg-primary/95 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.25)]";

  const linkCls = ({ isActive }) => cx(
    "relative text-sm font-medium whitespace-nowrap transition-colors py-1",
    isActive ? "text-white" : "text-white/70 hover:text-white",
    isActive && "after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-accent",
  );

  return (
    <nav className={cx("fixed top-0 inset-x-0 z-40 transition-all duration-500", navBg)}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-6">
        <Link to="/" aria-label="SmartNest home"><Brand light /></Link>

        <div className={cx("items-center", loggedIn ? "hidden xl:flex gap-7" : "hidden md:flex gap-8")}>
          {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>{l.label}</NavLink>)}
        </div>

        <div className="flex items-center gap-2">
          {loggedIn ? (
            <>
              <NotificationBell light />
              <span className="hidden md:block"><UserMenu light compact /></span>
            </>
          ) : (
            <span className="hidden md:flex items-center gap-2">
              <Link to="/login" state={{ from: location.pathname }}
                className="text-sm font-medium px-4 py-2 rounded-xl transition-colors text-white hover:bg-white/10">
                Sign In
              </Link>
              <Button to="/register" variant="accent" size="md">Register</Button>
            </span>
          )}
          <button type="button" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}
            className={cx("w-9 h-9 rounded-xl flex items-center justify-center text-white", loggedIn ? "xl:hidden" : "md:hidden")}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className={cx("bg-white border-t border-grey-100 px-6 py-4 flex flex-col gap-1 shadow-lg", loggedIn ? "xl:hidden" : "md:hidden")}
          onClick={(e) => { if (e.target.closest("a, button")) setMenuOpen(false); }}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => cx("text-sm font-medium py-2", isActive ? "text-accent-dark" : "text-primary")}>
              {l.label}
            </NavLink>
          ))}
          {loggedIn ? (
            <>
              <div className="border-t border-grey-100 mt-2 pt-3 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 text-sm text-primary font-medium">
                  <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-xs font-bold">{initialsOf(firstName, lastName)}</span>
                  {firstName}
                </span>
                <span className="flex items-center gap-4">
                  <NavLink to="/profile" className="text-sm text-primary font-medium">Profile &amp; Settings</NavLink>
                  <button type="button" onClick={() => { logout(); navigate("/"); }} className="text-sm text-red-500 font-medium">Sign Out</button>
                </span>
              </div>
            </>
          ) : (
            <div className="flex gap-3 pt-3 mt-2 border-t border-grey-100">
              <Button to="/login" variant="secondary" className="flex-1">Sign In</Button>
              <Button to="/register" variant="accent" className="flex-1">Register</Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default TopNavbar;
