import { useAuth } from "../context/AuthContext";
import { isStaffRole } from "../utils/roles";
import VisitorHome from "./home/VisitorHome";
import StaffDashboard from "./home/StaffDashboard";

function HomePage() {
  const { token, role, userId } = useAuth();
  const staff = !!token && isStaffRole(role);
  // Re-mount on account switch so no data from the previous user lingers.
  const key = `${role ?? "visitor"}-${userId ?? ""}`;
  return staff ? <StaffDashboard key={key} /> : <VisitorHome key={key} />;
}

export default HomePage;
