import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, KeyRound, Tag, ClipboardList, MessageCircle, CalendarDays, PlusCircle, ArrowRight, CheckCircle2,
  BadgePercent, Bell, CircleCheck, CircleX, Clock, Users, CalendarPlus, CalendarClock, Ban,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { getDashboardSummary } from "../../api/dashboardApi";
import { getPendingApartments, getMyApartments } from "../../api/apartmentApi";
import { getPendingPromotions, getMyPromotions } from "../../api/promotionApi";
import { getNotifications } from "../../api/notificationApi";
import { NOTIFICATIONS_CHANGED } from "../../components/NotificationBell";
import { DonutChart, BarChart } from "../../components/Charts";
import { ApartmentVisual } from "../../components/ApartmentCard";
import { SkeletonBlock, SkeletonList } from "../../components/Skeleton";
import { Alert, Badge, Button, Card } from "../../components/ui";
import { fmtPrice } from "../../utils/format";
import { relativeTime } from "../../utils/time";
import { partOfDay, roleLabel } from "../../utils/roles";

const CREATOR_ROLES = ["SALES_STAFF", "OPERATIONS_MANAGER", "ADMIN"];
const REVIEWER_ROLES = ["OPERATIONS_MANAGER", "ADMIN"];

const COLORS = {
  good: "var(--color-green-600)", wait: "var(--color-amber-600)", bad: "var(--color-red-600)",
  neutral: "var(--color-grey-400)", primary: "var(--color-primary)", accent: "var(--color-accent)",
};

const ACTIVITY_META = {
  APPROVED:    { Icon: CircleCheck,   cls: "bg-green-100 text-green-600" },
  REJECTED:    { Icon: CircleX,       cls: "bg-red-100 text-red-500" },
  SUBMITTED:   { Icon: Clock,         cls: "bg-amber-100 text-amber-600" },
  REQUESTED:   { Icon: CalendarPlus,  cls: "bg-amber-100 text-amber-600" },
  RESPONDED:   { Icon: MessageCircle, cls: "bg-blue-100 text-blue-600" },
  RESCHEDULED: { Icon: CalendarClock, cls: "bg-purple-100 text-purple-600" },
  COMPLETED:   { Icon: CircleCheck,   cls: "bg-emerald-100 text-emerald-600" },
  CANCELLED:   { Icon: Ban,           cls: "bg-grey-100 text-grey-500" },
};

function cardsFor(role, s) {
  const all = {
    pendingReservations: { to: "/reservations", Icon: KeyRound, label: "Pending reservations", value: s.reservationsPending, hint: "Awaiting payment check", tint: "bg-amber-50 text-amber-600" },
    pendingListings: { to: "/apartments", Icon: ClipboardList, label: "Listings to review", value: s.listingsPending, hint: "Not live yet", tint: "bg-blue-50 text-blue-600" },
    pendingPromotions: { to: "/promotions", Icon: Tag, label: "Promotions to review", value: s.promotionsPending, hint: "Submitted by sales", tint: "bg-purple-50 text-purple-600" },
    activePromotions: { to: "/promotions", Icon: BadgePercent, label: "Active promotions", value: s.promotionsActive, hint: "Live on the site", tint: "bg-accent/10 text-accent-dark" },
    available: { to: "/apartments?status=AVAILABLE", Icon: Building2, label: "Available", value: s.apartmentsAvailable, hint: "Ready to sell", tint: "bg-green-50 text-green-600" },
    reserved: { to: "/apartments?status=RESERVED", Icon: KeyRound, label: "Reserved", value: s.apartmentsReserved, hint: "Held by a buyer", tint: "bg-amber-50 text-amber-600" },
    sold: { to: "/apartments?status=SOLD", Icon: CheckCircle2, label: "Sold", value: s.apartmentsSold, hint: "Completed sales", tint: "bg-grey-100 text-grey-500" },
    newInquiries: { to: "/inquiries", Icon: MessageCircle, label: "New inquiries", value: s.inquiriesNew, hint: "Unanswered", tint: "bg-blue-50 text-blue-600" },
    pendingVisits: { to: "/appointments", Icon: CalendarDays, label: "Pending site visits", value: s.appointmentsPending, hint: "Need a decision", tint: "bg-amber-50 text-amber-600" },
  };
  if (role === "CRO") return [all.newInquiries, all.pendingVisits, all.available, all.activePromotions];
  if (role === "SALES_STAFF") return [all.available, all.reserved, all.pendingListings, all.pendingPromotions, all.activePromotions, all.sold];
  if (role === "OPERATIONS_MANAGER") return [all.pendingReservations, all.pendingListings, all.pendingPromotions, all.available, all.reserved, all.sold];
  if (role === "ADMIN") return [all.pendingReservations, all.pendingListings, all.pendingPromotions, all.newInquiries, all.pendingVisits, all.available];
  return [all.available, all.reserved, all.sold, all.activePromotions];
}

function Panel({ title, action, children, className = "" }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="font-semibold text-primary">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

const openLink = (to) => <Link to={to} className="text-xs text-accent-dark font-medium hover:underline flex items-center gap-1">Open <ArrowRight size={13} /></Link>;

function StaffDashboard() {
  const { role, userId, firstName } = useAuth();
  const { openModal } = useModal();
  const canCreate = CREATOR_ROLES.includes(role);
  const canReview = REVIEWER_ROLES.includes(role);

  const [summary, setSummary] = useState(null);
  const [queue, setQueue] = useState(null);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardSummary().then((s) => { if (!cancelled) setSummary(s); }).catch(() => { if (!cancelled) setSummary(false); });

    const load = async () => {
      if (!canCreate) return [];
      const calls = canReview
        ? [getPendingApartments(), getPendingPromotions()]
        : [getMyApartments(userId), getMyPromotions(userId)];
      const [apts, promos] = await Promise.all(calls);
      const items = [
        ...apts.filter((a) => a.listingStatus !== "APPROVED").map((a) => ({
          key: `a${a.apartmentId}`, kind: "Listing", Icon: Building2, apartment: a, title: a.title, sub: `${a.address?.city ?? ""} · ${fmtPrice(a.price)}`, status: a.listingStatus, to: "/apartments",
        })),
        ...promos.filter((p) => p.status !== "APPROVED").map((p) => ({
          key: `p${p.id}`, kind: "Promotion", Icon: Tag, title: p.title, sub: `${p.apartmentTitle ?? "Apartment"} · ${p.discountPercentage}% off`, status: p.status, to: "/promotions",
        })),
      ];
      return items.slice(0, 6);
    };
    load().then((q) => { if (!cancelled) setQueue(q); }).catch(() => { if (!cancelled) setQueue([]); });

    const loadActivity = () => getNotifications().then((n) => { if (!cancelled) setActivity(n); }).catch(() => { if (!cancelled) setActivity([]); });
    loadActivity();
    window.addEventListener(NOTIFICATIONS_CHANGED, loadActivity);
    return () => { cancelled = true; window.removeEventListener(NOTIFICATIONS_CHANGED, loadActivity); };
  }, [role, userId, canCreate, canReview]);

  const cards = useMemo(() => (summary ? cardsFor(role, summary) : null), [role, summary]);

  const availability = summary && [
    { label: "Available", value: summary.apartmentsAvailable, color: COLORS.good },
    { label: "Reserved", value: summary.apartmentsReserved, color: COLORS.wait },
    { label: "Sold", value: summary.apartmentsSold, color: COLORS.neutral },
  ];
  const workload = summary && (role === "CRO"
    ? [
      { label: "New inquiries", value: summary.inquiriesNew, color: COLORS.primary },
      { label: "Pending site visits", value: summary.appointmentsPending, color: COLORS.accent },
    ]
    : [
      { label: "Pending", value: summary.reservationsPending, color: COLORS.wait },
      { label: "Approved", value: summary.reservationsApproved, color: COLORS.good },
      { label: "Rejected", value: summary.reservationsRejected, color: COLORS.bad },
      { label: "Cancelled", value: summary.reservationsCancelled, color: COLORS.neutral },
    ]);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-primary rounded-2xl p-6 sm:p-8 mb-8 text-white">
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-accent/10" />
        <div className="absolute right-24 -bottom-16 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-accent-light text-xs uppercase tracking-widest font-medium mb-2">Good {partOfDay()} · {today}</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">Welcome back, {firstName || "there"}</h1>
            <p className="text-white/60 text-sm mt-2">
              <span className="inline-flex items-center bg-accent/15 text-accent-light text-xs font-semibold px-2.5 py-1 rounded-lg border border-accent/20 mr-2">{roleLabel(role)}</span>
              Here's what needs your attention today.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canCreate && <Button variant="accent" icon={PlusCircle} onClick={() => openModal("createApartment")}>List Apartment</Button>}
            {canCreate && <Button variant="outline-light" icon={Tag} onClick={() => openModal("createPromotion")}>New Promotion</Button>}
            {role === "ADMIN" && <Button variant="outline-light" icon={Users} to="/users">Manage Users</Button>}
            {role === "CRO" && <Button variant="accent" icon={MessageCircle} to="/inquiries">Open Inquiries</Button>}
          </div>
        </div>
      </div>

      {summary === false && <Alert className="mb-6">Couldn't load the dashboard numbers. Refresh to try again.</Alert>}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {cards === null && summary !== false && [1, 2, 3, 4, 5, 6].map((k) => <SkeletonBlock key={k} height={132} radius={16} />)}
        {cards?.map(({ to, Icon, label, value, hint, tint }) => (
          <Link key={label} to={to} className="bg-white rounded-2xl p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${tint}`}><Icon size={18} /></span>
            <p className="text-2xl font-bold text-primary mb-0.5">{value}</p>
            <p className="text-xs text-grey-500 font-medium leading-tight">{label}</p>
            <p className="text-[11px] text-grey-300 mt-1">{hint}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="Apartment Status" action={openLink("/apartments")}>
          {availability ? <DonutChart data={availability} centerLabel="listed" /> : <SkeletonBlock height={150} radius={12} />}
        </Panel>

        <Panel title={role === "CRO" ? "Customer Requests Waiting" : "Reservations by Status"}
          action={openLink(role === "CRO" ? "/inquiries" : canReview ? "/reservations" : "/apartments")}>
          {workload ? <BarChart data={workload} /> : <SkeletonBlock height={150} radius={12} />}
        </Panel>

        <Panel title="Recent Activity">
          {activity === null && <SkeletonList rows={3} height={44} />}
          {activity?.length === 0 && (
            <div className="flex flex-col items-center text-center py-6 text-grey-400">
              <Bell size={26} strokeWidth={1.5} className="mb-2 text-grey-300" />
              <p className="text-sm">No activity yet.</p>
            </div>
          )}
          {activity?.length > 0 && (
            <ul className="flex flex-col gap-4">
              {activity.slice(0, 5).map((n) => {
                const meta = ACTIVITY_META[n.type] ?? ACTIVITY_META.SUBMITTED;
                return (
                  <li key={n.id} className="flex items-start gap-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.cls}`}><meta.Icon size={15} /></span>
                    <div className="min-w-0">
                      <p className="text-sm text-primary leading-snug">{n.message}</p>
                      <p className="text-xs text-grey-400 mt-0.5 truncate">{n.entityTitle ? `${n.entityTitle} · ` : ""}{relativeTime(n.sentDate)}</p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {canCreate && (
          <Panel className="lg:col-span-3" title={canReview ? "Waiting for Your Review" : "Your Unfinished Listings & Promotions"}>
            {queue === null && <SkeletonList rows={3} height={48} />}
            {queue?.length === 0 && (
              <div className="flex items-center gap-3 text-sm text-grey-500 bg-green-50 rounded-xl px-4 py-4">
                <CheckCircle2 size={20} className="text-green-600" /> All clear — nothing is waiting on you.
              </div>
            )}
            {queue?.length > 0 && (
              <ul className="divide-y divide-grey-100">
                {queue.map((item) => (
                  <li key={item.key} className="flex flex-wrap items-center gap-4 py-3.5">
                    {item.apartment?.imageUrl
                      ? <ApartmentVisual apartment={item.apartment} className="w-9 h-9 rounded-xl flex-shrink-0" />
                      : <span className="w-9 h-9 rounded-xl bg-off-white text-grey-500 flex items-center justify-center flex-shrink-0"><item.Icon size={16} /></span>}
                    <div className="flex-1 min-w-[180px]">
                      <p className="text-sm font-medium text-primary">{item.title}</p>
                      <p className="text-xs text-grey-400">{item.kind} · {item.sub}</p>
                    </div>
                    <Badge status={item.status} />
                    <Button to={item.to} variant="secondary" size="sm">Review</Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

export default StaffDashboard;
