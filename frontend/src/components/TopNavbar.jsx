import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Tag, Users, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Brand from "./Brand";
import UserMenu from "./UserMenu";

// flat list per role — Promotions is the one page everyone sees; Users is ADMIN-only
function buildNavItems() {
  return {
    ADMIN: [
      { to: "/promotions", label: "Promotions", Icon: Tag },
      { to: "/users",      label: "Users",      Icon: Users },
    ],
    SALES_STAFF:         [{ to: "/promotions", label: "Promotions", Icon: Tag }],
    OPERATIONS_MANAGER:  [{ to: "/promotions", label: "Promotions", Icon: Tag }],
    CRO:                 [{ to: "/promotions", label: "Promotions", Icon: Tag }],
    MANAGING_DIRECTOR:   [{ to: "/promotions", label: "Promotions", Icon: Tag }],
    MARKETING_EXECUTIVE: [{ to: "/promotions", label: "Promotions", Icon: Tag }],
    CUSTOMER:            [{ to: "/promotions", label: "Promotions", Icon: Tag }],
  };
}

// logged-out visitors get a slim bar with no role-specific nav
function PublicTopBar() {
  return (
    <nav className="topbar-public">
      <div className="topbar-public-inner">
        <Link to="/promotions" className="navbar-brand"><Brand /></Link>
        <div className="navbar-actions">
          <Link to="/login" className="btn btn-ghost btn-sm" id="nav-login-btn">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm" id="nav-register-btn">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}

function TopNavbar() {
  const { token, role } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!token || !role) {
    return <PublicTopBar />;
  }

  const items = buildNavItems()[role] ?? [];

  return (
    <nav className="topbar">
      <div className="topbar-inner">
        <Link to="/promotions" className="navbar-brand"><Brand /></Link>

        <div className="topbar-links topbar-links-desktop">
          {items.map((item) => (
            <NavLink
              key={item.to} to={item.to}
              className={({ isActive }) => `topbar-link ${isActive ? "active" : ""}`}
            >
              <item.Icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="topbar-actions">
          <UserMenu />
          <button
            type="button" className="topbar-mobile-toggle"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="topbar-mobile-panel">
          {items.map((item) => (
            <NavLink
              key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `topbar-mobile-link ${isActive ? "active" : ""}`}
            >
              <item.Icon size={15} /> {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}

export default TopNavbar;
