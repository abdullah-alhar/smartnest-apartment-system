import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Brand from "./Brand";

function Footer() {
  const { token } = useAuth();
  return (
    <footer id="contact" className="bg-primary text-white pt-16 pb-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <Brand light />
            <p className="text-white/40 text-sm leading-relaxed max-w-sm mt-4">
              Verified apartments across Sri Lanka — browse, book a site visit and reserve online with a team that reviews every listing.
            </p>
          </div>
          <nav aria-label="Explore">
            <p className="text-white/60 text-xs uppercase tracking-widest font-medium mb-4">Explore</p>
            <div className="flex flex-col gap-3 text-sm text-white/40">
              <Link to="/apartments" className="hover:text-accent-light">Apartments</Link>
              <Link to="/promotions" className="hover:text-accent-light">Promotions</Link>
              {token
                ? <><Link to="/reservations" className="hover:text-accent-light">My Reservations</Link><Link to="/profile" className="hover:text-accent-light">Profile &amp; Settings</Link></>
                : <><Link to="/login" className="hover:text-accent-light">Sign In</Link><Link to="/register" className="hover:text-accent-light">Create an Account</Link></>}
            </div>
          </nav>
          <div>
            <p className="text-white/60 text-xs uppercase tracking-widest font-medium mb-4">Contact</p>
            <div className="flex flex-col gap-3 text-sm text-white/40">
              <span className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 flex-shrink-0" />Lanka Urban Residencies (Pvt) Ltd, Colombo</span>
              <span className="flex items-center gap-2"><Phone size={15} />+94 11 234 5678</span>
              <span className="flex items-center gap-2"><Mail size={15} />info@smartnest.lk</span>
              <span className="flex items-center gap-2"><Clock size={15} />Mon–Sat, 9 AM – 6 PM</span>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10 text-white/30 text-xs">
          © {new Date().getFullYear()} Lanka Urban Residencies (Pvt) Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
