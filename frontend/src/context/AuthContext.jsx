import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const STORED_KEYS = ["token", "userId", "role", "firstName", "lastName"];

/** True if the JWT's "exp" time has passed (or the token can't be read). Login tokens last 24 hours. */
function isTokenExpired(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return !exp || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

// An expired login would make every signed-in page fail with "Could not load ...", so forget it on start-up.
const savedToken = localStorage.getItem("token");
if (savedToken && isTokenExpired(savedToken)) {
  STORED_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function AuthProvider({ children }) {
  const [token,     setToken]     = useState(localStorage.getItem("token")     || null);
  const [userId,    setUserId]    = useState(localStorage.getItem("userId")    || null);
  const [role,      setRole]      = useState(localStorage.getItem("role")      || null);
  const [firstName, setFirstName] = useState(localStorage.getItem("firstName") || "");
  const [lastName,  setLastName]  = useState(localStorage.getItem("lastName")  || "");

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

  const updateName = (newFirstName, newLastName) => {
    localStorage.setItem("firstName", newFirstName);
    localStorage.setItem("lastName",  newLastName);
    setFirstName(newFirstName);
    setLastName(newLastName);
  };

  const logout = () => {
    STORED_KEYS.forEach((key) => localStorage.removeItem(key));
    setToken(null);
    setUserId(null);
    setRole(null);
    setFirstName("");
    setLastName("");
  };

  // If the login expires while the app is open, the backend answers 401/403 to every request.
  // Sign out so protected pages send the user to /login instead of showing "Could not load ...".
  // A 403 with a still-valid token (wrong role) is left alone.
  useEffect(() => {
    const id = axios.interceptors.response.use(undefined, (error) => {
      const status = error?.response?.status;
      const current = localStorage.getItem("token");
      if ((status === 401 || status === 403) && current && isTokenExpired(current)) {
        logout();
      }
      return Promise.reject(error);
    });
    return () => axios.interceptors.response.eject(id);
  }, []);

  return (
    <AuthContext.Provider value={{ token, userId, role, firstName, lastName, login, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
