import { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Brand from "./Brand";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";

const linkClass = ({ isActive }) => `sn-nav-link ${isActive ? "active" : ""}`;
const menuClass = ({ isActive }) => `sn-menu-link ${isActive ? "active" : ""}`;

// hamburger shown below desktop width — carries the links the inline nav would otherwise show
function CompactMenu({ loggedIn, isAdmin }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDocClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [open]);

  return (
    <div className="sn-menu-wrap" ref={ref}>
      <button type="button" className="sn-icon-btn" title="Menu" aria-label="Menu" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}>
        <Menu size={20} />
      </button>
      {open && (
        <div className="sn-menu" onClick={(e) => { if (e.target.closest("a")) setOpen(false); }}>
          <NavLink to="/promotions" className={menuClass}>Promotions</NavLink>
          <NavLink to="/" end className={menuClass}>Home</NavLink>
          {isAdmin && <NavLink to="/users" className={menuClass}>Users</NavLink>}
          {loggedIn && <NavLink to="/profile" className={menuClass}>Profile</NavLink>}
        </div>
      )}
    </div>
  );
}

function TopNavbar() {
  const { token, role } = useAuth();
  const loggedIn = !!(token && role);
  const isAdmin = role === "ADMIN";

  return (
    <header className="sn-nav">
      <div className="sn-nav-row">
        <CompactMenu loggedIn={loggedIn} isAdmin={isAdmin} />

        <Link to="/" className="navbar-brand"><Brand /></Link>

        <nav className="sn-nav-links">
          <NavLink to="/promotions" className={linkClass}>Promotions</NavLink>
          {isAdmin && <NavLink to="/users" className={linkClass}>Users</NavLink>}
        </nav>

        <div className="sn-nav-spacer" />

        {loggedIn ? (
          <div className="sn-nav-actions">
            <NotificationBell />
            <UserMenu />
          </div>
        ) : (
          <div className="sn-nav-actions">
            <Link to="/login" className="btn btn-secondary" id="nav-login-btn">Sign in</Link>
            <Link to="/register" className="btn btn-primary" id="nav-register-btn">Create account</Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopNavbar;
