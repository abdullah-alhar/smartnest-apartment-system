import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, CalendarDays, MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getCustomerReservations } from "../../api/reservationApi";
import { getCustomerAppointments } from "../../api/appointmentApi";
import { getCustomerInquiries } from "../../api/inquiryApi";
import { initialsOf } from "../../utils/roles";
import { Badge, Skeleton } from "../../components/ui";

const fmtWhen = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const newest = (rows, key) => [...rows].sort((a, b) => new Date(b[key]) - new Date(a[key]))[0];

function Tile({ to, Icon, tint, label, loading, children }) {
  return (
    <Link to={to} className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow min-w-0">
      <span className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${tint}`}><Icon size={19} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-grey-400">{label}</p>
        {loading ? <div className="flex flex-col gap-1.5 mt-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-16" /></div> : children}
      </div>
    </Link>
  );
}

/** "Welcome back, {name}" band shown to signed-in customers under the home hero. */
function WelcomeStrip() {
  const { userId, firstName, lastName } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const safe = (p) => p.catch(() => []);
    Promise.all([
      safe(getCustomerReservations(userId)),
      safe(getCustomerAppointments(userId)),
      safe(getCustomerInquiries(userId)),
    ]).then(([reservations, appointments, inquiries]) => {
      if (!cancelled) setData({ reservations, appointments, inquiries });
    });
    return () => { cancelled = true; };
  }, [userId]);

  const loading = data === null;
  const reservation = data && newest(data.reservations.filter((r) => r.status !== "CANCELLED"), "reservationDate");
  const upcoming = data && data.appointments
    .filter((a) => ["PENDING", "APPROVED", "RESCHEDULED"].includes(a.status))
    .sort((a, b) => new Date(a.scheduledDate ?? a.requestedDate) - new Date(b.scheduledDate ?? b.requestedDate))[0];
  const replies = data ? data.inquiries.filter((i) => i.status === "RESPONDED").length : 0;
  const openInquiries = data ? data.inquiries.filter((i) => i.status === "NEW" || i.status === "IN_PROGRESS").length : 0;

  return (
    <section className="bg-off-white border-b border-grey-200/60">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 flex flex-col xl:flex-row xl:items-center gap-5">
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-accent text-lg font-bold">{initialsOf(firstName, lastName)}</span>
          <div>
            <p className="text-xs text-grey-400 uppercase tracking-widest font-medium">Welcome back</p>
            <p className="text-xl font-semibold text-primary">{firstName || "there"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-w-0">
          <Tile to="/reservations" Icon={KeyRound} tint="bg-green-50 text-green-600" label="My Reservation" loading={loading}>
            {reservation
              ? <><p className="font-semibold text-primary truncate">{reservation.apartmentTitle}</p><Badge status={reservation.status} size="xs" className="mt-1" /></>
              : <><p className="font-semibold text-primary">None yet</p><p className="text-xs text-grey-400">Reserve an apartment online</p></>}
          </Tile>
          <Tile to="/appointments" Icon={CalendarDays} tint="bg-blue-50 text-blue-600" label="Next Site Visit" loading={loading}>
            {upcoming
              ? <><p className="font-semibold text-primary truncate">{fmtWhen(upcoming.scheduledDate ?? upcoming.requestedDate)}</p><Badge status={upcoming.status} size="xs" className="mt-1" /></>
              : <><p className="font-semibold text-primary">Nothing booked</p><p className="text-xs text-grey-400">Book a guided viewing</p></>}
          </Tile>
          <Tile to="/inquiries" Icon={MessageCircle} tint="bg-accent/10 text-accent-dark" label="Inquiries" loading={loading}>
            <p className="font-semibold text-primary">
              {replies > 0 ? `${replies} repl${replies === 1 ? "y" : "ies"} from our team` : openInquiries > 0 ? `${openInquiries} awaiting reply` : "No open questions"}
            </p>
            <p className="text-xs text-grey-400">View conversations</p>
          </Tile>
        </div>

      </div>
    </section>
  );
}

export default WelcomeStrip;
