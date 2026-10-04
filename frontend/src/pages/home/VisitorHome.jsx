import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Wallet, ArrowRight, Check, BadgePercent, CalendarCheck, ClipboardCheck, MessageCircle, Building2, Tag, ShieldCheck, KeyRound } from "lucide-react";
import { getFeaturedApartments, searchApartments } from "../../api/apartmentApi";
import { getActivePromotions } from "../../api/promotionApi";
import { apartmentImageSrc } from "../../api/apartmentApi";
import { useAuth } from "../../context/AuthContext";
import { endsLabel } from "../../utils/time";
import { PRICE_RANGES, fmtPercent, fmtPrice } from "../../utils/format";
import ApartmentCard, { ApartmentGridSkeleton } from "../../components/ApartmentCard";
import { SkeletonPromoGrid } from "../../components/Skeleton";
import { Button, SectionTitle } from "../../components/ui";
import WelcomeStrip from "./WelcomeStrip";

// Photo: Unsplash (photo-1512917774080), stored locally so the page works offline.
const HERO_IMAGE = "/images/hero-home.jpg";

const STEPS = [
  { Icon: Search, title: "Search & filter", text: "Find your ideal apartment with transparent prices, real listing details and live availability." },
  { Icon: MessageCircle, title: "View & inquire", text: "Examine the full listing and message our Customer Relations team directly with any question." },
  { Icon: CalendarCheck, title: "Visit & reserve", text: "Book a site visit or reserve online with an advance payment — the final price is shown up front." },
  { Icon: ClipboardCheck, title: "Confirmation", text: "An Operations Manager verifies your payment and locks the unit under your name." },
];

const heroSelect = "bg-white/90 text-primary text-sm px-4 py-3 rounded-xl border border-white/60 focus:border-accent font-medium";

function PromoCard({ promo }) {
  const ends = endsLabel(promo.endDate);
  return (
    <Link to={`/apartments/${promo.apartmentId}`}
      className="group relative rounded-2xl overflow-hidden bg-primary-light border border-white/10 hover:border-accent/40 transition-all">
      <div className="apt-visual relative h-40 overflow-hidden">
        {promo.apartmentImageUrl
          ? <img src={apartmentImageSrc(promo.apartmentImageUrl)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 size={44} strokeWidth={1.2} className="text-accent-light/70 group-hover:scale-110 transition-transform duration-500" />
            </div>
          )}
        <span className="absolute top-4 right-4 bg-accent text-white text-sm font-bold px-3 py-1 rounded-xl">{fmtPercent(promo.discountPercentage)}% OFF</span>
        {ends && <span className="absolute top-4 left-4 bg-white/15 backdrop-blur text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">{ends}</span>}
      </div>
      <div className="p-5">
        <p className="text-accent-light text-xs font-medium uppercase tracking-wider mb-1 line-clamp-1">{promo.title}</p>
        <h3 className="text-white font-semibold line-clamp-1">{promo.apartmentTitle || `Apartment #${promo.apartmentId}`}</h3>
        {promo.discountedPrice != null && (
          <p className="text-sm mt-2">
            <span className="text-white font-bold">{fmtPrice(promo.discountedPrice)}</span>
            {promo.apartmentPrice != null && <span className="text-white/40 line-through ml-2 text-xs">{fmtPrice(promo.apartmentPrice)}</span>}
          </p>
        )}
      </div>
    </Link>
  );
}

function VisitorHome() {
  const navigate = useNavigate();
  const { token, firstName } = useAuth();
  const displayName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "friend";
  const [form, setForm] = useState({ q: "", price: 0 });
  const [featured, setFeatured] = useState(null);
  const [latest, setLatest] = useState(null);
  const [promos, setPromos] = useState(null);
  const [total, setTotal] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getFeaturedApartments().then((r) => { if (!cancelled) setFeatured(r); }).catch(() => { if (!cancelled) setFeatured([]); });
    searchApartments({ size: 6, sort: "newest" })
      .then((r) => { if (!cancelled) { setLatest(r.content); setTotal(r.totalElements); } })
      .catch(() => { if (!cancelled) setLatest([]); });
    getActivePromotions()
      .then((rows) => {
        if (cancelled) return;
        const live = rows.filter((p) => p.status === "APPROVED" && endsLabel(p.endDate) !== "Ended");
        setPromos(live.sort((a, b) => b.discountPercentage - a.discountPercentage));
      })
      .catch(() => { if (!cancelled) setPromos([]); });
    return () => { cancelled = true; };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (form.q.trim()) params.set("q", form.q.trim());
    const range = PRICE_RANGES[form.price];
    if (range.min) params.set("min", range.min);
    if (range.max) params.set("max", range.max);
    navigate(`/apartments${params.toString() ? `?${params}` : ""}`);
  };

  const featuredIds = new Set((featured ?? []).map((a) => a.apartmentId));
  const justListed = (latest ?? []).filter((a) => !featuredIds.has(a.apartmentId)).slice(0, 3);
  const loadingLists = featured === null || latest === null;

  const stats = [
    { Icon: Building2, val: total ?? "—", label: "Apartments listed" },
    { Icon: Tag, val: promos?.length ?? "—", label: "Live promotions" },
    { Icon: ShieldCheck, val: "100%", label: "Listings reviewed by staff" },
    { Icon: KeyRound, val: "Online", label: "Reservations & site visits" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[88vh] flex flex-col overflow-hidden bg-primary">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-primary/60 to-transparent" />

        <div className="relative flex-1 flex items-center">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 w-full pt-28 pb-10">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-accent-light text-sm font-semibold mb-5 tracking-wider uppercase">
                <span className="w-6 h-px bg-accent-light" />
                {token ? `Welcome back, ${displayName}` : "Lanka Urban Residencies"}
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Find Your<br /><span className="text-accent-light italic">Perfect Home</span><br />in Sri Lanka
              </h1>
              <p className="text-white/70 text-lg mb-10 max-w-md leading-relaxed">
                {token
                  ? "Pick up where you left off — new listings and live promotions are waiting."
                  : "Verified apartments with transparent prices, exclusive promotions and online reservations."}
              </p>

              <form onSubmit={submit} role="search" aria-label="Search apartments"
                className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl p-3 flex flex-col sm:flex-row gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
                <label className="relative flex-[2]">
                  <span className="sr-only">Apartment name</span>
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-400 pointer-events-none" />
                  <input value={form.q} onChange={(e) => setForm((f) => ({ ...f, q: e.target.value }))}
                    placeholder="Search by apartment name" className={`${heroSelect} w-full pl-10 placeholder:text-grey-400`} />
                </label>
                <label className="relative flex-1">
                  <span className="sr-only">Budget</span>
                  <Wallet size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-400 pointer-events-none" />
                  <select value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className={`${heroSelect} w-full pl-10 cursor-pointer`}>
                    {PRICE_RANGES.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
                  </select>
                </label>
                <Button type="submit" variant="accent" size="lg" icon={Search} className="px-7">Search</Button>
              </form>

              <p className="text-white/50 text-xs mt-4 flex flex-wrap items-center gap-3">
                {total > 0 && <span className="flex items-center gap-1"><Check size={13} className="text-accent-light" /> {total} properties listed</span>}
                <span className="flex items-center gap-1"><Check size={13} className="text-accent-light" /> Verified listings</span>
                <span className="flex items-center gap-1"><Check size={13} className="text-accent-light" /> No brokerage fees</span>
              </p>
            </div>
          </div>
        </div>

        <div className="relative bg-primary/60 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map(({ Icon, val, label }) => (
              <div key={label} className="text-center">
                <Icon size={20} className="text-accent-light mx-auto mb-1" />
                <p className="text-white text-2xl font-bold">{val}</p>
                <p className="text-white/50 text-xs mt-0.5 tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {token && <WelcomeStrip />}

      {/* Promotions */}
      {(promos === null || promos.length > 0) && (
        <section className="py-16 bg-primary">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-accent-light text-xs uppercase tracking-widest font-medium">Limited Time</span>
                <h2 className="font-serif text-3xl text-white font-semibold mt-1">Featured Promotions</h2>
              </div>
              <Link to="/promotions" className="text-sm font-medium text-white/70 hover:text-accent-light flex items-center gap-1">All promotions <ArrowRight size={15} /></Link>
            </div>
            {promos === null
              ? <SkeletonPromoGrid count={3} />
              : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {promos.slice(0, 3).map((p) => <PromoCard key={p.id} promo={p} />)}
                </div>
              )}
          </div>
        </section>
      )}

      {/* Listings */}
      <section className="py-20 max-w-[1440px] mx-auto px-4 sm:px-8">
        <SectionTitle eyebrow="Curated for You" title="Featured Residences"
          action={<Link to="/apartments" className="text-sm font-medium text-primary hover:text-accent flex items-center gap-1 whitespace-nowrap">View all apartments <ArrowRight size={15} /></Link>} />

        {loadingLists && <ApartmentGridSkeleton count={3} />}

        {!loadingLists && featured.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent-dark text-xs font-bold px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" /> <BadgePercent size={14} /> Special Offers
              </span>
              <div className="flex-1 h-px bg-accent/20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.slice(0, 3).map((a, i) => <ApartmentCard key={a.apartmentId} apartment={a} index={i} />)}
            </div>
          </div>
        )}

        {!loadingLists && justListed.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-semibold text-grey-500 uppercase tracking-wider">Just Listed</span>
              <div className="flex-1 h-px bg-grey-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {justListed.map((a, i) => <ApartmentCard key={a.apartmentId} apartment={a} index={i} />)}
            </div>
          </div>
        )}

        {!loadingLists && featured.length === 0 && justListed.length === 0 && (
          <p className="text-grey-400 text-center py-10">New listings are on their way — check back soon.</p>
        )}
      </section>

      {/* How it works */}
      <section id="about" className="py-20 bg-primary">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="text-center mb-14">
            <span className="text-accent-light text-xs uppercase tracking-widest font-medium">How It Works</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-2">From First Look to Reserved</h2>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ Icon, title, text }, i) => (
              <li key={title} className="bg-primary-light/50 rounded-2xl p-8 border border-white/5 hover:border-accent/20 transition-colors">
                <div className="flex items-center justify-between mb-5">
                  <span className="w-12 h-12 rounded-2xl bg-accent/15 text-accent-light flex items-center justify-center"><Icon size={22} /></span>
                  <span className="font-serif text-4xl text-white/10 font-bold">{i + 1}</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-off-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-primary mb-4">
            {token ? "Ready for Your Next Step?" : "Ready to Find Your Home?"}
          </h2>
          <p className="text-grey-500 text-lg mb-8 max-w-xl mx-auto">
            {token
              ? "Browse available apartments, book a site visit, or check on your reservations."
              : "Create a free account to send inquiries, book site visits and reserve online."}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button to="/apartments" size="lg">Browse Apartments{total != null ? ` (${total})` : ""}</Button>
            {token
              ? <Button to="/reservations" variant="secondary" size="lg">My Reservations</Button>
              : <Button to="/register" variant="secondary" size="lg">Create Free Account</Button>}
          </div>
        </div>
      </section>
    </div>
  );
}

export default VisitorHome;
