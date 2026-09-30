import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// wraps a route that needs auth; pass allowedRoles to also restrict by role
function ProtectedRoute({ children, allowedRoles, redirectTo = "/login" }) {
  const { token, role } = useAuth();

  if (!token) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
