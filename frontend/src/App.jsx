import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import CreatePromotion from "./pages/CreatePromotion";
import MyPromotions from "./pages/MyPromotions";
import PendingApprovals from "./pages/PendingApprovals";
import ActivePromotions from "./pages/ActivePromotions";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/register"              element={<Register />} />
          <Route path="/login"                 element={<Login />} />
          <Route path="/promotions"            element={<ActivePromotions />} />

          {/* Authenticated */}
          <Route path="/promotions/create"     element={<CreatePromotion />} />
          <Route path="/promotions/mine"       element={<MyPromotions />} />
          <Route path="/promotions/pending"    element={<PendingApprovals />} />

          {/* Default redirect */}
          <Route path="/"                      element={<Navigate to="/promotions" replace />} />
          <Route path="*"                      element={<Navigate to="/promotions" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;