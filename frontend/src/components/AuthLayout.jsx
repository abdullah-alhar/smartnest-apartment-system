import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Brand from "./Brand";

// Photo: Unsplash (photo-1600596542815), stored locally so the page works offline.
const SIDE_IMAGE = "/images/auth-side.jpg";

/** Split-screen shell for sign-in and registration. */
function AuthLayout({ title, subtitle, wide = false, children, quote }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Return to the page that sent the user here (passed as state.from), otherwise home.
  // Browser history isn't reliable here: it may be empty, or bounce between sign-in and register.
  const from = location.state?.from;
  const goBack = () => navigate(from && from !== "/login" && from !== "/register" ? from : "/");

  return (
    <div className="min-h-screen flex bg-off-white">
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 sm:px-8 py-12">
        <div className={`w-full ${wide ? "max-w-xl" : "max-w-md"}`}>
          <button type="button" onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-grey-500 hover:text-primary mb-8 -ml-1 px-1 py-1 rounded-lg">
            <ArrowLeft size={16} /> Back
          </button>
          <Link to="/" className="block w-fit mb-10" aria-label="SmartNest home"><Brand /></Link>
          <h1 className="font-serif text-3xl font-bold text-primary mb-2">{title}</h1>
          <p className="text-grey-400 text-sm mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
      <div className="hidden lg:block flex-1 relative bg-primary">
        <img src={SIDE_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/25 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="font-serif text-3xl font-bold text-white mb-3">{quote ?? "“Verified apartments, transparent prices, and reservations you can track.”"}</p>
          <p className="text-white/60 text-sm">SmartNest · Lanka Urban Residencies (Pvt) Ltd</p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
