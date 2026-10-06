import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Tag, KeyRound, CalendarDays, MessageCircle, Users, UserCircle, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getDashboardSummary } from "../api/dashboardApi";
import { initialsOf, roleLabel } from "../utils/roles";
import Brand from "./Brand";
import NotificationBell, { NOTIFICATIONS_CHANGED } from "./NotificationBell";
import UserMenu from "./UserMenu";
import { cx } from "./styles";

const ALL = ["ADMIN", "SALES_STAFF", "CRO", "OPERATIONS_MANAGER", "MANAGING_DIRECTOR", "MARKETING_EXECUTIVE"];

// Mirrors the role checks in App.jsx and in each page, so nobody sees a link they can't open.
const NAV = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard, roles: ALL, end: true },
  { to: "/apartments", label: "Apartments", Icon: Building2, roles: ALL, count: (s) => s.listingsPending, countRoles: ["OPERATIONS_MANAGER", "ADMIN"] },
  { to: "/promotions", label: "Promotions", Icon: Tag, roles: ALL, count: (s) => s.promotionsPending, countRoles: ["OPERATIONS_MANAGER", "ADMIN"] },
  { to: "/reservations", label: "Reservations", Icon: KeyRound, roles: ["OPERATIONS_MANAGER", "ADMIN"], count: (s) => s.reservationsPending },
  { to: "/appointments", label: "Appointments", Icon: CalendarDays, roles: ["CRO", "ADMIN"], count: (s) => s.appointmentsPending },
  { to: "/inquiries", label: "Inquiries", Icon: MessageCircle, roles: ["CRO", "ADMIN"], count: (s) => s.inquiriesNew },
  { to: "/users", label: "Users & Roles", Icon: Users, roles: ["ADMIN"] },
  { to: "/profile", label: "My Profile", Icon: UserCircle, roles: ALL },
];

const TITLES = {
  "/": "Dashboard", "/apartments": "Apartments", "/promotions": "Promotions", "/reservations": "Reservations",
  "/appointments": "Appointments", "/inquiries": "Inquiries", "/users": "Users & Roles", "/profile": "My Profile",
};

function Sidebar({ onNavigate }) {
  const { role, firstName, lastName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => getDashboardSummary().then((s) => { if (!cancelled) setSummary(s); }).catch(() => {});
    load();
    window.addEventListener(NOTIFICATIONS_CHANGED, load);
    return () => { cancelled = true; window.removeEventListener(NOTIFICATIONS_CHANGED, load); };
  }, [location.pathname]);

  const items = NAV.filter((item) => item.roles.includes(role));

  return (
    <aside className="staff-sidebar w-64 h-full bg-primary flex flex-col border-r border-primary-light overflow-y-auto">
      <div className="px-6 py-5 border-b border-primary-light">
        <Link to="/" onClick={onNavigate}><Brand light subtitle="Staff Portal" /></Link>
      </div>

      <div className="px-4 py-4 border-b border-primary-light">
        <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium mb-1.5">Signed in as</p>
        <span className="inline-flex items-center gap-1.5 bg-accent/15 text-accent-light text-xs font-semibold px-2.5 py-1 rounded-lg border border-accent/20">
          {roleLabel(role)}
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {items.map(({ to, label, Icon, end, count, countRoles }) => {
          const n = summary && count && (!countRoles || countRoles.includes(role)) ? count(summary) : 0;
          return (
            <NavLink key={to} to={to} end={end} onClick={onNavigate}
              className={({ isActive }) => cx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border",
                isActive ? "bg-accent/15 text-accent-light border-accent/20" : "text-white/60 hover:text-white hover:bg-white/5 border-transparent",
              )}>
              <Icon size={18} strokeWidth={1.75} />
              {label}
              {n > 0 && <span className="ml-auto bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{n}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-primary-light flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-accent-light text-sm font-bold flex-shrink-0">
          {initialsOf(firstName, lastName)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{[firstName, lastName].filter(Boolean).join(" ")}</p>
          <p className="text-[11px] text-white/40 truncate">{roleLabel(role)}</p>
        </div>
        <button type="button" title="Sign out" aria-label="Sign out" onClick={() => { logout(); navigate("/"); }}
          className="text-white/30 hover:text-white/70"><LogOut size={16} /></button>
      </div>
    </aside>
  );
}

function StaffLayout({ children }) {
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  const section = "/" + (location.pathname.split("/")[1] ?? "");
  const title = TITLES[section] ?? "Staff Portal";

  return (
    <div className="flex min-h-screen bg-off-white">
      <div className="hidden lg:block sticky top-0 h-screen flex-shrink-0"><Sidebar /></div>

      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-primary/50" onClick={() => setDrawer(false)} />
          <div className="relative h-full animate-fade-in"><Sidebar onNavigate={() => setDrawer(false)} /></div>
          <button type="button" aria-label="Close menu" onClick={() => setDrawer(false)} className="relative m-3 w-9 h-9 rounded-xl bg-white text-primary flex items-center justify-center">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-grey-100 flex items-center justify-between gap-4 px-4 sm:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" aria-label="Open menu" onClick={() => setDrawer(true)} className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-primary hover:bg-grey-100">
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary truncate">{title}</p>
              <p className="hidden sm:block text-xs text-grey-400 truncate">Lanka Urban Residencies (Pvt) Ltd</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}

export default StaffLayout;
