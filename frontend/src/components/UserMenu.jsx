import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, UserCircle, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { initialsOf, roleLabel } from "../utils/roles";
import { cx } from "./styles";

function UserMenu({ light = false, compact = false }) {
  const { role, firstName, lastName, logout } = useAuth();
  const navigate = useNavigate();
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

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/");
  };

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Account";
  const initials = initialsOf(firstName, lastName);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Account menu"
        className={cx("flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl transition-colors",
          light ? "hover:bg-white/10" : "hover:bg-grey-100")}>
        <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{initials}</span>
        {!compact && (
          <span className="hidden sm:block text-left leading-tight">
            <span className={cx("block text-sm font-medium max-w-[140px] truncate", light ? "text-white" : "text-primary")}>{firstName || "Account"}</span>
            <span className={cx("block text-[10px] uppercase tracking-wider", light ? "text-white/50" : "text-grey-400")}>{roleLabel(role)}</span>
          </span>
        )}
        <ChevronDown size={14} className={cx("transition-transform", open && "rotate-180", light ? "text-white/60" : "text-grey-400")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-[var(--shadow-elevated)] border border-grey-100 overflow-hidden z-50 animate-fade-in">
          <div className="px-4 py-4 border-b border-grey-100 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent-dark font-bold flex-shrink-0">{initials}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary truncate">{fullName}</p>
              <p className="text-xs text-grey-400 truncate">{roleLabel(role)}</p>
            </div>
          </div>
          <div className="py-1.5" onClick={(e) => { if (e.target.closest("a")) setOpen(false); }}>
            <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-grey-600 hover:bg-off-white hover:text-primary">
              <UserCircle size={16} className="text-grey-400" /> Profile &amp; Settings
            </Link>
          </div>
          <div className="border-t border-grey-100 py-1.5">
            <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
