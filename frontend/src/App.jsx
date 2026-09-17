import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ModalProvider } from "./context/ModalContext";
import ProtectedRoute from "./components/ProtectedRoute";
import TopNavbar from "./components/TopNavbar";
import GlobalModals from "./components/GlobalModals";

import Home             from "./pages/Home";
import Login            from "./pages/Login";
import Register         from "./pages/Register";
import ActivePromotions from "./pages/ActivePromotions";
import Users            from "./pages/Users";
import Profile          from "./pages/Profile";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ModalProvider>
          <BrowserRouter>
            <div className="app-shell">
              <TopNavbar />
              <main className="app-main">
                <Routes>
                  {/* ── Public — Home renders per role; promotions is the one consolidated page ── */}
                  <Route path="/"            element={<Home />} />
                  <Route path="/login"       element={<Login />} />
                  <Route path="/register"    element={<Register />} />
                  <Route path="/promotions"  element={<ActivePromotions />} />

                  {/* ── Any authenticated user ── */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />

                  {/* ── Admin only ── */}
                  <Route path="/users" element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <Users />
                    </ProtectedRoute>
                  } />

                  {/* ── Fallback — also catches old bookmarked routes (/dashboard, /my-promotions, etc.) ── */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <GlobalModals />
            </div>
          </BrowserRouter>
        </ModalProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
