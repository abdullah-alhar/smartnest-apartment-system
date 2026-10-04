import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ModalProvider } from "./context/ModalContext";
import { isStaffRole } from "./utils/roles";
import ProtectedRoute from "./components/ProtectedRoute";
import TopNavbar from "./components/TopNavbar";
import StaffLayout from "./components/StaffLayout";
import GlobalModals from "./components/GlobalModals";
import Footer from "./components/Footer";

import Home             from "./pages/Home";
import Login            from "./pages/Login";
import Register         from "./pages/Register";
import ActivePromotions from "./pages/ActivePromotions";
import Apartments       from "./pages/Apartments";
import ApartmentDetails from "./pages/ApartmentDetails";
import NotFound         from "./pages/NotFound";
import Inquiries        from "./pages/Inquiries";
import Appointments     from "./pages/Appointments";
import Reservations     from "./pages/Reservations";
import Users            from "./pages/Users";
import Profile          from "./pages/Profile";

const FULL_SCREEN = ["/login", "/register"];

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"            element={<Home />} />
      <Route path="/login"       element={<Login />} />
      <Route path="/register"    element={<Register />} />
      <Route path="/promotions"  element={<ActivePromotions />} />
      <Route path="/apartments"  element={<Apartments />} />
      <Route path="/apartments/:id" element={<ApartmentDetails />} />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/inquiries" element={
        <ProtectedRoute allowedRoles={["CUSTOMER", "CRO", "ADMIN"]}>
          <Inquiries />
        </ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute allowedRoles={["CUSTOMER", "CRO", "ADMIN"]}>
          <Appointments />
        </ProtectedRoute>
      } />
      <Route path="/reservations" element={
        <ProtectedRoute allowedRoles={["CUSTOMER", "OPERATIONS_MANAGER", "ADMIN"]}>
          <Reservations />
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <Users />
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/** Customers and visitors get the public site; every staff role gets the sidebar portal. */
function Shell() {
  const { token, role } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);

  if (FULL_SCREEN.includes(pathname)) return <AppRoutes />;

  if (token && isStaffRole(role)) {
    return <StaffLayout><AppRoutes /></StaffLayout>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-off-white">
      <TopNavbar />
      <main className={pathname === "/" ? "flex-1" : "flex-1 pt-16"}>
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ModalProvider>
          <BrowserRouter>
            <Shell />
            <GlobalModals />
          </BrowserRouter>
        </ModalProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
