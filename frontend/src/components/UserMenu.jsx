import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, UserCircle, KeyRound, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLE_LABEL = {
  ADMIN: "ADMINISTRATOR",
  SALES_STAFF: "SALES STAFF",
  CRO: "CHIEF REVENUE OFFICER",
  OPERATIONS_MANAGER: "OPERATIONS MANAGER",
  MANAGING_DIRECTOR: "MANAGING DIRECTOR",
  MARKETING_EXECUTIVE: "MARKETING EXECUTIVE",
  CUSTOMER: "CUSTOMER",
};

function UserMenu() {
  const { role, firstName, lastName, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // "R. Fernando" style — first initial + last name, falls back to full first name if no last name yet
  const displayName = lastName ? `${firstName?.[0] ?? ""}. ${lastName}` : (firstName || "Account");

  return (
    <div className="user-menu" ref={ref}>
      <button type="button" className="user-menu-trigger" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="user-menu-avatar">{(firstName?.[0] ?? "")}{(lastName?.[0] ?? "")}</div>
        <div className="user-menu-text">
          <div className="user-menu-name">{displayName}</div>
          <div className="user-menu-role">{ROLE_LABEL[role] ?? role}</div>
        </div>
        <ChevronDown size={14} className={`nav-dropdown-chevron ${open ? "open" : ""}`} />
      </button>
      {open && (
        <div className="nav-dropdown-menu user-menu-dropdown">
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
