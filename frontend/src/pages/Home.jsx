import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, MapPin, LayoutGrid, SlidersHorizontal, Search, Bell, CircleCheck, Clock, CircleX,
  Tag, Building2, MessageCircle, Calendar, KeyRound, User, Users, ShieldCheck, CreditCard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getActivePromotions, getMyPromotions, getPendingPromotions } from "../api/promotionApi";
import { listAllUsers } from "../api/adminApi";
import { getNotifications } from "../api/notificationApi";
import { NOTIFICATIONS_CHANGED } from "../components/NotificationBell";
import { relativeTime, endsLabel, hasStarted, isSameMonth } from "../utils/time";

const STATUS = {
  PENDING:  { cls: "badge-pending",  Icon: Clock,       label: "Pending"  },
  APPROVED: { cls: "badge-approved", Icon: CircleCheck, label: "Approved" },
  REJECTED: { cls: "badge-rejected", Icon: CircleX,     label: "Rejected" },
};

const CREATOR_ROLES = ["SALES_STAFF", "OPERATIONS_MANAGER", "ADMIN"];
const REVIEWER_ROLES = ["OPERATIONS_MANAGER", "ADMIN"];

const isLive = (p) => hasStarted(p.startDate) && endsLabel(p.endDate) !== "Ended";
const discountLabel = (p) => `−${Number(p.discountPercentage)}%`;

function partOfDay() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}

// ── shared pieces ─────────────────────────────────────────────────

function PhotoPlaceholder({ label, className }) {
  return (
    <div className={`home-photo ${className ?? ""}`}>
      <span className="home-photo-label">{label}</span>
    </div>
  );
}

function OfferCard({ promo }) {
  return (
    <article className="home-offer">
      <div className="home-offer-media">
        <PhotoPlaceholder label="apartment photo" />
        <span className="home-offer-discount">{discountLabel(promo)}</span>
      </div>
      <div className="home-offer-body">
        <div>
          <h3 className="home-offer-title">{promo.title}</h3>
          <div className="home-offer-meta">
            <Building2 size={14} color="var(--text-muted)" />
            Apartment #{promo.apartmentId}
          </div>
        </div>
        {promo.discountDetails && <p className="home-offer-details">{promo.discountDetails}</p>}
        <div className="home-divider" />
        <div className="home-spacer" />
        <div className="home-offer-foot">
          <span className="home-offer-ends"><Clock size={13} />{endsLabel(promo.endDate)}</span>
          <Link to="/promotions" className="btn btn-secondary">Details</Link>
        </div>
      </div>
    </article>
  );
}

function OfferSkeleton() {
  return (
    <div className="home-offer">
      <div className="home-offer-media sn-shimmer" />
      <div className="home-offer-body">
        <div className="home-skel-line sn-shimmer" style={{ height: 18, width: "80%" }} />
        <div className="home-skel-line sn-shimmer" style={{ width: "55%" }} />
        <div className="home-divider" />
        <div className="home-skel-line sn-shimmer" style={{ height: 28, width: "45%", borderRadius: 8 }} />
      </div>
    </div>
  );
}

function OffersSection({ title, promos }) {
  const offers = promos === null ? null : promos.filter(isLive).sort((a, b) => b.id - a.id).slice(0, 3);
  return (
    <section className="home-section-lg">
      <div className="home-section-head">
        <h2 className="home-h1">{title}</h2>
        <Link to="/promotions" className="home-link">See all promotions</Link>
      </div>
      {offers === null && (
        <div className="home-offer-grid">{[1, 2, 3].map((k) => <OfferSkeleton key={k} />)}</div>
      )}
      {offers !== null && offers.length === 0 && (
        <div className="home-card home-empty">
          <Tag size={36} strokeWidth={1.5} color="var(--text-muted)" />
          <span className="home-empty-title">No live offers right now</span>
          <span className="home-empty-caption">New promotions are reviewed and published every week — check back soon.</span>
        </div>
      )}
      {offers !== null && offers.length > 0 && (
        <div className="home-offer-grid">{offers.map((p) => <OfferCard key={p.id} promo={p} />)}</div>
      )}
    </section>
  );
}

// ── visitor ───────────────────────────────────────────────────────

const VALUES = [
  { Icon: ShieldCheck, title: "Reviewed listings", text: "Every promotion is approved by an operations manager before it appears publicly." },
  { Icon: MapPin, title: "Site visits on your schedule", text: "Book a viewing and our relations team confirms the slot with you directly." },
  { Icon: CreditCard, title: "Reserve online", text: "Hold an apartment with an advance payment, verified by our team." },
];

function VisitorHero() {
  return (
    <>
      <section className="home-hero">
        <div>
          <div className="home-eyebrow">
            <span className="home-eyebrow-dot" />
            <span className="home-label">Apartments across Colombo</span>
          </div>
          <h1 className="home-display">Find the apartment you'll actually want to come home to.</h1>
          <p className="home-lead">
            Browse verified listings, book a site visit with our relations team, and reserve online — all in one place.
            Every promotion on SmartNest is reviewed before it goes live.
          </p>
          <div className="home-cta-row">
            <Link to="/promotions" className="btn btn-primary btn-lg">Browse promotions <ArrowRight size={16} /></Link>
            <Link to="/register" className="btn btn-secondary btn-lg">Create an account</Link>
          </div>
        </div>
        <PhotoPlaceholder label="residential hero photo" className="home-hero-photo" />
      </section>

      {/* apartment search isn't built yet — fields are presentational, Search opens the live offers */}
      <section className="home-card home-search">
        {[
          { label: "Location", Icon: MapPin, value: "Any area" },
          { label: "Type", Icon: LayoutGrid, value: "Any size" },
          { label: "Budget", Icon: SlidersHorizontal, value: "Up to LKR 50M" },
        ].map(({ label, Icon, value }) => (
          <div key={label} className="home-search-field">
            <span className="home-label">{label}</span>
            <div className="home-search-box">
              <Icon size={15} color="var(--text-muted)" />
              <span>{value}</span>
            </div>
          </div>
        ))}
        <Link to="/promotions" className="btn btn-primary home-search-btn"><Search size={15} /> Search</Link>
      </section>
    </>
  );
}

function VisitorFooter() {
  return (
    <>
      <section className="home-section-lg">
        <div className="home-values">
          {VALUES.map(({ Icon, title, text }) => (
            <div key={title} className="home-value">
              <Icon size={20} color="var(--accent)" />
              <span className="home-value-title">{title}</span>
              <span className="home-value-text">{text}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="home-section-lg">
        <div className="home-cta-band">
          <div className="home-cta-copy">
            <h2 className="home-h1">Ready to reserve a viewing?</h2>
            <p className="home-lead" style={{ margin: 0 }}>
              Create a free account to save listings, submit inquiries and book site visits with our relations team.
            </p>
          </div>
          <div className="home-cta-row">
            <Link to="/register" className="btn btn-primary btn-lg">Register</Link>
            <Link to="/login" className="btn btn-secondary btn-lg">Sign in</Link>
          </div>
        </div>
      </section>
    </>
  );
}

// ── customer ──────────────────────────────────────────────────────

function CustomerView({ firstName, promos, activity }) {
  const live = promos === null ? null : promos.filter(isLive);
  let status = "";
  if (live !== null) {
    if (live.length === 0) {
      status = "No live promotions at the moment — we'll let you know as soon as one is published.";
    } else {
      const soonest = [...live].sort((a, b) => String(a.endDate).localeCompare(String(b.endDate)))[0];
      const n = live.length === 1 ? "1 promotion is" : `${live.length} promotions are`;
      status = `${n} live right now — the next one ${endsLabel(soonest.endDate).toLowerCase()}.`;
    }
  }

  const tiles = [
    { label: "Promotions", caption: live === null ? "Loading offers…" : `${live.length} live offer${live.length === 1 ? "" : "s"} to browse`, Icon: Tag, to: "/promotions" },
    { label: "Apartments", caption: "Coming soon", Icon: Building2 },
    { label: "My inquiries", caption: "Coming soon", Icon: MessageCircle },
    { label: "My appointments", caption: "Coming soon", Icon: Calendar },
    { label: "My reservations", caption: "Coming soon", Icon: KeyRound },
    { label: "Profile", caption: "Update your details and password", Icon: User, to: "/profile" },
  ];

  return (
    <>
      <section className="home-greeting">
        <h1 className="home-h1">Good {partOfDay()}, {firstName}</h1>
        <p className="home-lead" style={{ margin: 0, minHeight: "1.5em" }}>{status}</p>
      </section>

      <section>
        <h2 className="home-h2">Continue browsing</h2>
        <div className="home-tile-grid">
          {tiles.map(({ label, caption, Icon, to }) => {
            const inner = (
              <>
                <div className="home-tile-head">
                  <span className="home-icon-chip"><Icon size={18} /></span>
                  <span className="home-tile-label">{label}</span>
                </div>
                <span className="home-tile-caption">{caption}</span>
              </>
            );
            return to
              ? <Link key={label} to={to} className="home-tile">{inner}</Link>
              : <div key={label} className="home-tile disabled" aria-disabled="true">{inner}</div>;
          })}
        </div>
      </section>

      <section className="home-section">
        <div className="home-card home-activity">
          <div className="home-activity-head">
            <Bell size={16} color="var(--text)" />
            <span className="home-label" style={{ flex: 1 }}>Recent activity</span>
            <span className="home-activity-hint">Open the bell for all notifications</span>
          </div>
          {activity === null && [1, 2, 3].map((k) => (
            <div key={k} className="home-activity-row">
              <div className="home-skel-line sn-shimmer" style={{ width: "70%" }} />
            </div>
          ))}
          {activity !== null && activity.length === 0 && (
            <div className="home-activity-row home-activity-empty">
              Nothing new yet — updates about your account will appear here.
            </div>
          )}
          {activity !== null && activity.slice(0, 3).map((n) => (
            <div key={n.id} className={`home-activity-row ${n.isRead ? "" : "unread"}`}>
              <span className={`home-activity-dot ${n.isRead ? "" : "unread"}`} />
              <span className="home-activity-msg">{n.message}</span>
              {n.entityTitle && <span className="home-activity-entity">{n.entityTitle}</span>}
              <span className="home-activity-time">{relativeTime(n.sentDate)}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// ── staff / admin ─────────────────────────────────────────────────

function StaffView({ role, firstName, stats, queue }) {
  const shortcuts = [
    { label: "Promotions", Icon: Tag, to: "/promotions" },
    role === "ADMIN" ? { label: "Users", Icon: Users, to: "/users" } : null,
    { label: "Profile", Icon: User, to: "/profile" },
  ].filter(Boolean);

  return (
    <>
      <section className="home-greeting home-greeting-row">
        <h1 className="home-h1" style={{ margin: 0 }}>Good {partOfDay()}, {firstName}</h1>
        <span className="home-role-pill">{role.replace(/_/g, " ")}</span>
      </section>

      <section>
        <div className="home-stat-grid">
          {stats === null
            ? [1, 2, 3, 4].map((k) => (
              <div key={k} className="home-stat">
                <div className="home-skel-line sn-shimmer" style={{ height: 10, width: "60%" }} />
                <div className="home-skel-line sn-shimmer" style={{ height: 24, width: "32%", borderRadius: 8 }} />
              </div>
            ))
            : stats.map((s) => (
              <div key={s.label} className="home-stat">
                <span className="home-label">{s.label}</span>
                <span className="home-stat-value">{s.value}</span>
              </div>
            ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-card home-queue">
          <div className="home-queue-head">
            <h2 className="home-h2" style={{ margin: 0, flex: 1 }}>Needs your attention</h2>
            <Link to="/promotions" className="home-link">View all</Link>
          </div>

          {queue === null && [1, 2, 3].map((k) => (
            <div key={k} className="home-queue-skel">
              <div className="home-skel-line sn-shimmer" style={{ width: "40%" }} />
              <div className="home-skel-line sn-shimmer" style={{ width: "15%" }} />
            </div>
          ))}

          {queue !== null && queue.length === 0 && (
            <div className="home-empty">
              <CircleCheck size={36} strokeWidth={1.5} color="var(--text-muted)" />
              <span className="home-empty-title">Nothing waiting on you — the queue is clear</span>
              <span className="home-empty-caption">New submissions will appear here as soon as they arrive.</span>
            </div>
          )}

          {queue !== null && queue.length > 0 && (
            <div className="home-table-wrap">
              <table className="home-table">
                <thead>
                  <tr>
                    <th>Promotion</th>
                    <th>Submitted by</th>
                    <th className="num">Discount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((p) => {
                    const s = STATUS[p.status] ?? STATUS.PENDING;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="home-table-title">{p.title}</div>
                          <div className="home-table-meta">Apartment #{p.apartmentId}</div>
                        </td>
                        <td className="muted">{p.creatorName || `Staff #${p.salesStaffId}`}</td>
                        <td className="num">{discountLabel(p)}</td>
                        <td><span className={`badge ${s.cls}`}><s.Icon size={12} strokeWidth={2.5} />{s.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="home-section">
        <h2 className="home-h2">Shortcuts</h2>
        <div className="home-shortcut-grid">
          {shortcuts.map(({ label, Icon, to }) => (
            <Link key={label} to={to} className="home-shortcut">
              <span className="home-icon-chip neutral"><Icon size={18} /></span>
              <span className="home-shortcut-label">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

// ── page ──────────────────────────────────────────────────────────

function Home() {
  const { token, role, userId, firstName } = useAuth();
  const loggedIn = !!(token && role);
  const isCustomer = loggedIn && role === "CUSTOMER";
  const isStaff = loggedIn && !isCustomer;
  const canCreate = CREATOR_ROLES.includes(role);
  const canReview = REVIEWER_ROLES.includes(role);

  const [promos, setPromos] = useState(null);
  const [mine, setMine] = useState(null);
  const [pending, setPending] = useState(null);
  const [userCount, setUserCount] = useState(null);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const keep = (setter) => (value) => { if (!cancelled) setter(value); };

    getActivePromotions().then(keep(setPromos)).catch(() => keep(setPromos)([]));
    if (canCreate) getMyPromotions(userId).then(keep(setMine)).catch(() => keep(setMine)([]));
    if (canReview) getPendingPromotions().then(keep(setPending)).catch(() => keep(setPending)([]));
    if (role === "ADMIN") listAllUsers().then((u) => keep(setUserCount)(u.length)).catch(() => keep(setUserCount)(0));

    return () => { cancelled = true; };
  }, [role, userId, canCreate, canReview]);

  useEffect(() => {
    if (!isCustomer) return undefined;
    let cancelled = false;
    const load = () => getNotifications()
      .then((rows) => { if (!cancelled) setActivity(rows); })
      .catch(() => { if (!cancelled) setActivity([]); });
    load();
    window.addEventListener(NOTIFICATIONS_CHANGED, load);
    return () => { cancelled = true; window.removeEventListener(NOTIFICATIONS_CHANGED, load); };
  }, [isCustomer]);

  // stats wait for every source this role actually uses, so the cards never flash partial numbers
  const stats = useMemo(() => {
    if (!isStaff || promos === null) return null;
    if (canCreate && mine === null) return null;
    if (canReview && pending === null) return null;
    if (role === "ADMIN" && userCount === null) return null;

    if (role === "SALES_STAFF") {
      return [
        { label: "My promotions", value: mine.length },
        { label: "Pending mine", value: mine.filter((p) => p.status === "PENDING").length },
        { label: "Approved mine", value: mine.filter((p) => p.status === "APPROVED").length },
        { label: "Rejected mine", value: mine.filter((p) => p.status === "REJECTED").length },
      ];
    }
    const list = [];
    if (canReview) list.push({ label: "Pending review", value: pending.length });
    list.push({ label: "Approved this month", value: promos.filter((p) => isSameMonth(p.reviewedAt)).length });
    list.push({ label: "Active promotions", value: promos.filter(isLive).length });
    if (role === "ADMIN") list.push({ label: "Users", value: userCount });
    return list;
  }, [isStaff, role, promos, mine, pending, userCount, canCreate, canReview]);

  const queue = useMemo(() => {
    if (!isStaff) return null;
    if ((canCreate && mine === null) || (canReview && pending === null)) return null;
    const rows = new Map();
    (pending ?? []).forEach((p) => rows.set(p.id, p));
    (mine ?? []).filter((p) => p.status !== "APPROVED").forEach((p) => rows.set(p.id, p));
    return [...rows.values()].sort((a, b) => b.id - a.id).slice(0, 5);
  }, [isStaff, mine, pending, canCreate, canReview]);

  return (
    <div className="home-page">
      {!loggedIn && <VisitorHero />}
      {isCustomer && <CustomerView firstName={firstName} promos={promos} activity={activity} />}
      {isStaff && <StaffView role={role} firstName={firstName} stats={stats} queue={queue} />}
      {!isStaff && <OffersSection title={isCustomer ? "Latest offers" : "Current offers"} promos={promos} />}
      {!loggedIn && <VisitorFooter />}
      <div style={{ height: 64 }} />
    </div>
  );
}

// remount on sign-in/sign-out so one user's cached numbers never flash for the next
function HomePage() {
  const { role, userId } = useAuth();
  return <Home key={`${role ?? "visitor"}-${userId ?? ""}`} />;
}

export default HomePage;
