import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Ruler, BedDouble, CalendarDays, KeyRound, MessageCircle, Calendar,
  Pencil, Lock, Ban, Info, MapPin, Calculator, RotateCcw, CircleCheck, UserRound,
} from "lucide-react";
import { getApartmentById, getSimilarApartments } from "../api/apartmentApi";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { SkeletonBlock } from "../components/Skeleton";
import ApartmentCard, { ApartmentGridSkeleton, ApartmentVisual } from "../components/ApartmentCard";
import Breadcrumbs from "../components/Breadcrumbs";
import MortgageCalculator from "../components/MortgageCalculator";
import PriceBlock from "../components/PriceBlock";
import PromotionBanner from "../components/PromotionBanner";
import { NotFoundView } from "./NotFound";
import { availabilityLabel, fmtDate, fmtPercent, fmtPrice } from "../utils/format";
import { extractErrorMessage } from "../utils/errors";
import { isStaffRole } from "../utils/roles";
import { Alert, Badge, Button, Card } from "../components/ui";

const PAGE_MODALS = ["reserveApartment", "createInquiry", "bookAppointment", "createApartment"];

function DetailsSkeleton() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10">
      <SkeletonBlock width={260} height={14} style={{ marginBottom: 24 }} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <SkeletonBlock height={360} radius={16} />
          <SkeletonBlock width="55%" height={34} />
          <SkeletonBlock height={100} radius={16} />
        </div>
        <SkeletonBlock height={380} radius={16} />
      </div>
    </div>
  );
}

function ApartmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, role, userId } = useAuth();
  const { activeModal, openModal } = useModal();
  const toast = useToast();

  const [apt, setApt] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [similar, setSimilar] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getApartmentById(id);
      setApt(data);
      setState("ready");
    } catch (err) {
      if (err?.response?.status === 404) {
        setState("notfound");
      } else {
        setError(extractErrorMessage(err, "Could not load this apartment."));
        setState("error");
      }
    }
  }, [id]);

  useEffect(() => {
    setState("loading");
    setApt(null);
    setSimilar(null);
    window.scrollTo({ top: 0 });
    load();
    getSimilarApartments(id).then(setSimilar).catch(() => setSimilar([]));
  }, [id, load]);

  const prevModal = useRef(activeModal);
  useEffect(() => {
    if (PAGE_MODALS.includes(prevModal.current) && activeModal === null) load();
    prevModal.current = activeModal;
  }, [activeModal, load]);

  useEffect(() => {
    if (!apt) return undefined;
    const previous = document.title;
    document.title = `${apt.title} · SmartNest`;
    return () => { document.title = previous; };
  }, [apt]);

  const withLogin = (action) => () => {
    if (!token) {
      toast.info("Please sign in to continue.");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    action();
  };

  const isStaff = !!token && isStaffRole(role);
  const wrap = isStaff ? "" : "max-w-[1440px] mx-auto px-4 sm:px-8 py-10";

  if (state === "loading") return <DetailsSkeleton />;

  if (state === "notfound") {
    return (
      <NotFoundView title="Apartment not found"
        message="This apartment doesn't exist, or it is no longer listed."
        primaryTo="/apartments" primaryLabel="Browse apartments" />
    );
  }

  if (state === "error") {
    return (
      <div className={wrap}>
        <Alert className="mb-6">{error}</Alert>
        <Button icon={RotateCcw} onClick={() => { setState("loading"); load(); }}>Try again</Button>
      </div>
    );
  }

  const status = apt.availabilityStatus;
  const available = status === "AVAILABLE";
  const sold = status === "SOLD";
  const canEdit = isStaff && (role === "ADMIN" || String(apt.createdByStaffId) === String(userId));
  const payable = apt.discountedPrice ?? apt.price;
  const address = [apt.address?.street, apt.address?.city, apt.address?.postalCode].filter(Boolean).join(", ");

  const specs = [
    { Icon: BedDouble, label: "Rooms", val: apt.roomCount },
    { Icon: Ruler, label: "Floor Area", val: `${Number(apt.size).toLocaleString("en-US")} sqft` },
    { Icon: CalendarDays, label: "Listed", val: fmtDate(apt.listedDate) },
    { Icon: Info, label: "Availability", val: availabilityLabel(status) },
  ];

  return (
    <div className={wrap}>
      <Breadcrumbs items={[{ label: isStaff ? "Dashboard" : "Home", to: "/" }, { label: "Apartments", to: "/apartments" }, { label: apt.title }]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 min-w-0">
          <div className="relative rounded-2xl overflow-hidden mb-8">
            <ApartmentVisual apartment={apt} className="h-[260px] sm:h-[380px]" large />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge status={status} />
              {apt.discountedPrice && <span className="bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full">{fmtPercent(apt.discountPercentage)}% OFF — Limited Offer</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
            <div className="min-w-0">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-primary mb-1">{apt.title}</h1>
              <p className="text-grey-400 flex items-center gap-1.5"><MapPin size={16} /> {address}</p>
            </div>
            <div className="text-right"><PriceBlock price={apt.price} discountedPrice={apt.discountedPrice} discountPercentage={apt.discountPercentage} size="lg" /></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {specs.map(({ Icon, label, val }) => (
              <Card key={label} className="p-4 text-center">
                <Icon size={22} className="text-accent mx-auto mb-1.5" />
                <p className="text-xs text-grey-400 mb-0.5">{label}</p>
                <p className="font-semibold text-primary">{val}</p>
              </Card>
            ))}
          </div>

          <Card className="p-6 mb-6">
            <h2 className="font-semibold text-primary text-lg mb-3">About This Property</h2>
            <p className="text-grey-500 leading-relaxed whitespace-pre-line">{apt.description || "The seller hasn't added a description yet."}</p>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-primary text-lg mb-5 flex items-center gap-2"><Calculator size={18} className="text-accent" /> Installment Calculator</h2>
            <MortgageCalculator price={payable} />
          </Card>
        </div>

        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 flex flex-col gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-grey-400 uppercase tracking-wider font-medium">Asking Price</span>
                {apt.discountedPrice && <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">{fmtPercent(apt.discountPercentage)}% OFF</span>}
              </div>
              <PriceBlock price={apt.price} discountedPrice={apt.discountedPrice} discountPercentage={apt.discountPercentage} size="lg" />
              {apt.discountedPrice && <p className="text-sm font-semibold text-green-600 mt-1">You save {fmtPrice(Number(apt.price) - Number(apt.discountedPrice))}</p>}

              {!isStaff && (
                <div className="flex flex-col gap-3 mt-5">
                  {status === "RESERVED" && (
                    <div className="flex gap-2 bg-amber-50 text-amber-800 rounded-xl p-3 text-sm"><Lock size={16} className="flex-shrink-0 mt-0.5" /><span><b>Reserved</b> — another buyer is holding this apartment. You can still ask us a question.</span></div>
                  )}
                  {sold && (
                    <div className="flex gap-2 bg-grey-100 text-grey-600 rounded-xl p-3 text-sm"><Ban size={16} className="flex-shrink-0 mt-0.5" /><span><b>Sold</b> — this apartment is no longer available.</span></div>
                  )}
                  <Button size="lg" fullWidth icon={KeyRound} disabled={!available} onClick={withLogin(() => openModal("reserveApartment", apt.apartmentId))}>
                    Reserve Now
                  </Button>
                  <Button variant="accent" fullWidth icon={Calendar} disabled={!available} onClick={withLogin(() => openModal("bookAppointment", apt.apartmentId))}>
                    Book Site Visit
                  </Button>
                  <Button variant="secondary" fullWidth icon={MessageCircle} disabled={sold} onClick={withLogin(() => openModal("createInquiry", apt.apartmentId))}>
                    Ask a Question
                  </Button>
                  {available && (
                    <p className="text-xs text-grey-400 leading-relaxed">
                      Reserving needs an advance payment of about <b className="text-primary">{fmtPrice(apt.advancePaymentAmount)}</b> (10%). An Operations Manager confirms it.
                    </p>
                  )}
                  {!token && (
                    <p className="text-xs text-grey-400">
                      You'll be asked to <Link to="/login" state={{ from: location.pathname }} className="text-accent-dark font-medium hover:underline">sign in</Link> first — we'll bring you right back here.
                    </p>
                  )}
                </div>
              )}

              {isStaff && (
                <div className="flex flex-col gap-3 mt-5">
                  <div className="flex gap-2 bg-blue-50 text-blue-800 rounded-xl p-3 text-sm">
                    <Info size={16} className="flex-shrink-0 mt-0.5" />
                    <span>You're signed in as staff. Reservations, inquiries and visits are made from customer accounts.</span>
                  </div>
                  {canEdit && (
                    <Button variant="secondary" fullWidth icon={Pencil}
                      onClick={() => openModal("createApartment", { apartmentId: apt.apartmentId, title: apt.title })}>
                      Edit this listing
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {apt.promotion && <PromotionBanner promotion={apt.promotion} />}

            <Card className="p-6">
              <h3 className="font-semibold text-primary mb-3">Property Details</h3>
              <dl className="text-sm">
                {[
                  ["Rooms", apt.roomCount],
                  ["Size", `${Number(apt.size).toLocaleString("en-US")} sqft`],
                  ["Street", apt.address?.street],
                  ["City", apt.address?.city],
                  ["Postal code", apt.address?.postalCode],
                  ["Listed on", fmtDate(apt.listedDate)],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between gap-4 py-2.5 border-b border-grey-100 last:border-0">
                    <dt className="text-grey-400">{l}</dt>
                    <dd className="font-medium text-primary text-right">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            {apt.createdByName && (
              <div className="bg-primary rounded-2xl p-6 text-white">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Listed By</p>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent-light"><UserRound size={18} /></span>
                  <div>
                    <p className="font-semibold">{apt.createdByName}</p>
                    <p className="text-white/40 text-xs flex items-center gap-1"><CircleCheck size={12} className="text-accent-light" /> SmartNest sales team</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <section className="mt-16">
        <h2 className="font-serif text-2xl font-semibold text-primary mb-6">Similar Apartments</h2>
        {similar === null && <ApartmentGridSkeleton count={3} />}
        {similar !== null && similar.length === 0 && (
          <p className="text-grey-400">No similar apartments right now — <Link to="/apartments" className="text-accent-dark hover:underline">browse all listings</Link>.</p>
        )}
        {similar !== null && similar.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {similar.map((s, i) => <ApartmentCard key={s.apartmentId} apartment={s} index={i} />)}
          </div>
        )}
      </section>
    </div>
  );
}

export default ApartmentDetails;
