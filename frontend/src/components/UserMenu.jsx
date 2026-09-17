import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, UserCircle, KeyRound, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function UserMenu() {
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
    logout();
    navigate("/login");
  };

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Account";
  const initials = [firstName, lastName].filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="sn-account" ref={ref}>
      <button type="button" className="sn-account-pill" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Account menu">
        <span className="sn-avatar">{initials}</span>
        <span className="sn-account-text">
          <span className="sn-account-name">{fullName}</span>
          <span className="sn-account-role">{role?.replace(/_/g, " ")}</span>
        </span>
        <ChevronDown size={16} className={`nav-dropdown-chevron ${open ? "open" : ""}`} />
      </button>
      {open && (
        <div className="nav-dropdown-menu sn-account-menu">
          <Link to="/profile" className="nav-dropdown-item" onClick={() => setOpen(false)}>
            <UserCircle size={15} /> Edit Profile
          </Link>
          <Link to="/profile" className="nav-dropdown-item" onClick={() => setOpen(false)}>
            <KeyRound size={15} /> Change Password
          </Link>
          <button type="button" className="nav-dropdown-item nav-dropdown-item-danger" onClick={handleLogout}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
