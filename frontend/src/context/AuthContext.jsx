import { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token,     setToken]     = useState(localStorage.getItem("token")     || null);
  const [userId,    setUserId]    = useState(localStorage.getItem("userId")    || null);
  const [role,      setRole]      = useState(localStorage.getItem("role")      || null);
  const [firstName, setFirstName] = useState(localStorage.getItem("firstName") || "");
  const [lastName,  setLastName]  = useState(localStorage.getItem("lastName")  || "");

  // call after a successful login/register response
  const login = (newToken, newUserId, newRole, newFirstName = "", newLastName = "") => {
    localStorage.setItem("token",     newToken);
    localStorage.setItem("userId",    newUserId);
    localStorage.setItem("role",      newRole);
    localStorage.setItem("firstName", newFirstName);
    localStorage.setItem("lastName",  newLastName);
    setToken(newToken);
    setUserId(String(newUserId));
    setRole(newRole);
    setFirstName(newFirstName);
    setLastName(newLastName);
  };

  // Profile.jsx already lets a user edit their own name — keep the navbar in sync without a re-login
  const updateName = (newFirstName, newLastName) => {
    localStorage.setItem("firstName", newFirstName);
    localStorage.setItem("lastName",  newLastName);
    setFirstName(newFirstName);
    setLastName(newLastName);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    setToken(null);
    setUserId(null);
    setRole(null);
    setFirstName("");
    setLastName("");
  };

  return (
    <AuthContext.Provider value={{ token, userId, role, firstName, lastName, login, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
