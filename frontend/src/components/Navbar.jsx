import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/promotions" className="navbar-brand">
          {/* TODO: replace with your logo image →  <img src="/logo.png" alt="SmartNest" width="32" height="32" /> */}
          <span className="navbar-brand-text">SmartNest</span>
        </Link>

        {/* Navigation links */}
        <ul className="navbar-links">
          <li>
            <NavLink
              to="/promotions"
              className={({ isActive }) => isActive ? "active" : ""}
              id="nav-link-promotions"
            >
              🏷️ Promotions
            </NavLink>
          </li>
          {token && (
            <>
              <li>
                <NavLink
                  to="/promotions/create"
                  className={({ isActive }) => isActive ? "active" : ""}
                  id="nav-link-create"
                >
                  ✚ Create
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/promotions/mine"
                  className={({ isActive }) => isActive ? "active" : ""}
                  id="nav-link-mine"
                >
                  📋 My Promotions
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/promotions/pending"
                  className={({ isActive }) => isActive ? "active" : ""}
                  id="nav-link-pending"
                >
                  ⏳ Pending Approvals
                </NavLink>
              </li>
            </>
          )}
        </ul>

        {/* Actions */}
        <div className="navbar-actions">
          {token ? (
            <button
              id="nav-logout-btn"
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          ) : (
            <>
              <Link
                to="/login"
                id="nav-login-btn"
                className="btn btn-ghost btn-sm"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                id="nav-register-btn"
                className="btn btn-primary btn-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
