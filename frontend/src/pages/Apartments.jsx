import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Home, PlusCircle, Trash2, Pencil, ThumbsUp, ThumbsDown, AlertTriangle, MessageSquareWarning, MapPin, Ruler,
  CircleDollarSign, SearchX, RotateCcw, SlidersHorizontal, BedDouble, CalendarDays, X,
} from "lucide-react";
import {
  searchApartments, getMyApartments, getPendingApartments,
  deleteApartment, approveApartment, rejectApartment, markApartmentSold,
} from "../api/apartmentApi";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../utils/errors";
import { useDebounced } from "../utils/useDebounced";
import { PRICE_RANGES, fmtCompactPrice, fmtPrice } from "../utils/format";
import { isStaffRole } from "../utils/roles";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import ApartmentCard, { ApartmentGridSkeleton, ApartmentVisual } from "../components/ApartmentCard";
import { Alert, Badge, Button, Card, Modal, PageHeader, PublicHero, Textarea } from "../components/ui";
import { cx, fieldCls } from "../components/styles";

const PAGE_SIZE = 9;
const AVAILABILITY = [
  { value: "", label: "Any availability" },
  { value: "AVAILABLE", label: "Available" },
  { value: "RESERVED", label: "Reserved" },
  { value: "SOLD", label: "Sold" },
];

function ManageCard({ apartment, canEdit, canReview, reviewBusy, onDelete, onEdit, onApprove, onReject }) {
  const showReview = canReview && apartment.listingStatus === "PENDING";

  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <ApartmentVisual apartment={apartment} className="w-14 h-14 rounded-xl flex-shrink-0 [&_svg]:w-5 [&_svg]:h-5 [&_p]:hidden" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-primary truncate">{apartment.title}</p>
          <p className="text-xs text-grey-400 flex items-center gap-1 mt-0.5"><MapPin size={12} />{apartment.address?.city}</p>
        </div>
        <Badge status={apartment.listingStatus} />
      </div>
      <p className="text-lg font-bold text-primary mb-2">{fmtPrice(apartment.price)}</p>
      <p className="text-sm text-grey-500 line-clamp-2 mb-3">{apartment.description || "No description provided."}</p>
      <div className="flex gap-4 text-xs text-grey-500 mb-4">
        <span className="flex items-center gap-1"><BedDouble size={13} /> {apartment.roomCount} rooms</span>
        <span className="flex items-center gap-1"><Ruler size={13} /> {apartment.size} sqft</span>
        <span className="flex items-center gap-1"><CalendarDays size={13} /> {apartment.daysListed === 0 ? "Today" : `${apartment.daysListed}d ago`}</span>
      </div>

      {apartment.listingStatus === "REJECTED" && apartment.rejectionReason && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-700 mb-4">
          <strong className="block mb-0.5">Rejection reason</strong>{apartment.rejectionReason}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        {showReview && (
          <>
            <Button size="sm" variant="success" icon={ThumbsUp} loading={reviewBusy} onClick={onApprove}>Approve</Button>
            <Button size="sm" variant="danger" icon={ThumbsDown} disabled={reviewBusy} onClick={onReject}>Reject</Button>
          </>
        )}
        {canEdit && (
          <>
            <Button size="sm" variant="secondary" icon={Pencil} onClick={onEdit}>{apartment.listingStatus === "REJECTED" ? "Edit & Resubmit" : "Edit"}</Button>
            <Button size="sm" variant="danger-ghost" icon={Trash2} onClick={onDelete}>Delete</Button>
          </>
        )}
      </div>
    </Card>
  );
}

function Apartments() {
  const { token, role, userId } = useAuth();
  const { activeModal, openModal } = useModal();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const isStaff = !!token && isStaffRole(role);
  const isAdmin = role === "ADMIN";
  const canCreate = role === "SALES_STAFF" || role === "OPERATIONS_MANAGER" || role === "ADMIN";
  const canReview = role === "OPERATIONS_MANAGER" || role === "ADMIN";

  const status = params.get("status") ?? "";
  const withPromotion = params.get("promo") === "1";
  const sort = params.get("sort") ?? "newest";
  const page = Math.max(parseInt(params.get("page") ?? "0", 10) || 0, 0);

  const [text, setText] = useState({ q: params.get("q") ?? "", min: params.get("min") ?? "", max: params.get("max") ?? "" });
  const typed = useDebounced(text, 400);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const setParam = useCallback((patch, { keepPage = false } = {}) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([key, value]) => {
        if (value === "" || value == null || value === false) next.delete(key); else next.set(key, String(value));
      });
      if (!keepPage) next.delete("page");
      return next;
    }, { replace: true });
  }, [setParams]);

  useEffect(() => {
    if ((params.get("q") ?? "") !== typed.q.trim() || (params.get("min") ?? "") !== typed.min || (params.get("max") ?? "") !== typed.max) {
      setParam({ q: typed.q.trim(), min: typed.min, max: typed.max });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const query = params.toString();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchApartments({
      keyword: params.get("q") ?? "",
      minPrice: params.get("min") ?? "",
      maxPrice: params.get("max") ?? "",
      status, withPromotion, sort, page, size: PAGE_SIZE,
    })
      .then((data) => { if (!cancelled) { setResult(data); setError(""); } })
      .catch((err) => { if (!cancelled) setError(extractErrorMessage(err, "Could not load apartments. Please try again.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, reloadKey]);

  const priceMin = params.get("min") ?? "";
  const priceMax = params.get("max") ?? "";
  const pickPrice = (r) => {
    setText((t) => ({ ...t, min: r.min, max: r.max }));
    setParam({ min: r.min, max: r.max });
  };

  const hasFilters = !!(params.get("q") || params.get("min") || params.get("max") || status || withPromotion);
  const clearFilters = () => { setText({ q: "", min: "", max: "" }); setParams({}, { replace: true }); };

  const [attention, setAttention] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewBusyId, setReviewBusyId] = useState(null);

  const ownsApartment = useCallback((a) => canCreate && String(a.createdByStaffId) === String(userId), [canCreate, userId]);

  const loadAttention = useCallback(async () => {
    if (!canCreate) { setAttention([]); return; }
    try {
      const requests = [getMyApartments(userId)];
      if (canReview) requests.push(getPendingApartments());
      const merged = new Map();
      (await Promise.all(requests)).flat().forEach((a) => merged.set(a.apartmentId, a));
      setAttention([...merged.values()].filter((a) => (ownsApartment(a) && a.listingStatus !== "APPROVED")
        || (canReview && a.listingStatus === "PENDING" && !ownsApartment(a))));
    } catch {
      setAttention([]);
    }
  }, [canCreate, canReview, userId, ownsApartment]);

  useEffect(() => { loadAttention(); }, [loadAttention]);

  const prevModalRef = useRef(activeModal);
  useEffect(() => {
    if (prevModalRef.current === "createApartment" && activeModal === null) { loadAttention(); setReloadKey((k) => k + 1); }
    prevModalRef.current = activeModal;
  }, [activeModal, loadAttention]);

  const refreshAll = () => { loadAttention(); setReloadKey((k) => k + 1); };

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      await deleteApartment(deleteTarget.apartmentId);
      toast.success(`"${deleteTarget.title}" was deleted.`);
      setDeleteTarget(null);
      refreshAll();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete listing."));
    } finally {
      setDeleting(false);
    }
  };

  const handleApprove = async (apartment) => {
    setReviewBusyId(apartment.apartmentId);
    try {
      await approveApartment(apartment.apartmentId, userId);
      toast.success(`"${apartment.title}" approved.`);
      refreshAll();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Approval failed."));
    } finally {
      setReviewBusyId(null);
    }
  };

  const handleRejectConfirmed = async () => {
    if (!rejectReason.trim()) return;
    setReviewBusyId(rejectTarget.apartmentId);
    try {
      await rejectApartment(rejectTarget.apartmentId, userId, rejectReason.trim());
      toast.success(`"${rejectTarget.title}" rejected.`);
      setRejectTarget(null);
      setRejectReason("");
      refreshAll();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Rejection failed."));
    } finally {
      setReviewBusyId(null);
    }
  };

  const handleMarkSold = async (apartment) => {
    setReviewBusyId(apartment.apartmentId);
    try {
      await markApartmentSold(apartment.apartmentId);
      toast.success(`"${apartment.title}" marked as sold.`);
      refreshAll();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to mark as sold."));
    } finally {
      setReviewBusyId(null);
    }
  };

  const staffFooter = (a) => {
    const mine = isAdmin || ownsApartment(a);
    const canMarkSold = canReview && a.availabilityStatus === "RESERVED";
    if (!mine && !canMarkSold) return null;
    return (
      <>
        {mine && <Button size="xs" variant="secondary" icon={Pencil} onClick={() => openModal("createApartment", a)}>Edit</Button>}
        {canMarkSold && (
          <Button size="xs" variant="secondary" icon={CircleDollarSign} loading={reviewBusyId === a.apartmentId} onClick={() => handleMarkSold(a)}>Mark as Sold</Button>
        )}
        {mine && <Button size="xs" variant="danger-ghost" icon={Trash2} onClick={() => setDeleteTarget(a)}>Delete</Button>}
      </>
    );
  };

  const items = result?.content ?? [];
  const total = result?.totalElements ?? 0;

  const chips = [
    params.get("q") && { key: "q", label: `"${params.get("q")}"`, clear: () => setText((t) => ({ ...t, q: "" })) },
    (params.get("min") || params.get("max")) && {
      key: "price",
      label: PRICE_RANGES.find((r) => r.min === priceMin && r.max === priceMax)?.label
        ?? `${priceMin ? fmtCompactPrice(priceMin) : "Any"} – ${priceMax ? fmtCompactPrice(priceMax) : "Any"}`,
      clear: () => setText((t) => ({ ...t, min: "", max: "" })),
    },
    status && { key: "status", label: AVAILABILITY.find((o) => o.value === status)?.label, clear: () => setParam({ status: "" }) },
    withPromotion && { key: "promo", label: "Promotions only", clear: () => setParam({ promo: "" }) },
  ].filter(Boolean);

  const filterPanel = (
    <Card className="p-6 lg:sticky lg:top-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-primary flex items-center gap-2"><SlidersHorizontal size={16} /> Filters</h2>
        {hasFilters && <button type="button" onClick={clearFilters} className="text-xs text-accent-dark font-medium hover:underline">Clear all</button>}
      </div>

      {isStaff && (
        <div className="mb-6">
          <label htmlFor="apt-search" className="text-xs text-grey-400 uppercase tracking-wider font-medium mb-3 block">Search</label>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-400 pointer-events-none" />
            <input id="apt-search" className={fieldCls(false, "pl-10")} placeholder="Apartment name"
              value={text.q} onChange={(e) => setText((t) => ({ ...t, q: e.target.value }))} />
          </div>
        </div>
      )}

      <div className="mb-6">
        <p className="text-xs text-grey-400 uppercase tracking-wider font-medium mb-3">Price Range</p>
        <div className="flex flex-col gap-2">
          {PRICE_RANGES.map((r) => (
            <label key={r.label} className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="apt-price" className="accent-accent" checked={priceMin === r.min && priceMax === r.max} onChange={() => pickPrice(r)} />
              <span className="text-sm text-grey-600">{r.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs text-grey-400 uppercase tracking-wider font-medium mb-3">Availability</p>
        <div className="flex flex-col gap-1">
          {AVAILABILITY.map((o) => (
            <button key={o.value} type="button" onClick={() => setParam({ status: o.value })}
              className={cx("flex items-center gap-2.5 text-sm px-3 py-2 rounded-xl text-left transition-colors",
                status === o.value ? "bg-primary text-white" : "text-grey-600 hover:bg-off-white")}>
              <span className={cx("w-2 h-2 rounded-full flex-shrink-0", status === o.value ? "bg-accent" : "bg-grey-200")} />
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-sm text-grey-600">With promotion only</span>
        <span className="relative inline-flex">
          <input type="checkbox" className="peer sr-only" checked={withPromotion} onChange={(e) => setParam({ promo: e.target.checked ? "1" : "" })} />
          <span className="w-10 h-6 rounded-full bg-grey-200 peer-checked:bg-accent transition-colors" />
          <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
        </span>
      </label>
    </Card>
  );

  return (
    <div>
      {isStaff ? (
        <PageHeader title="Apartments" subtitle="Every listing on SmartNest. Listings are reviewed by an Operations Manager before they go live."
          actions={canCreate && <Button icon={PlusCircle} onClick={() => openModal("createApartment")}>List Apartment</Button>} />
      ) : (
        <PublicHero eyebrow="Browse Properties" title="Find Your Perfect Apartment"
          subtitle={result ? `${total} verified ${total === 1 ? "property" : "properties"} — every listing is reviewed before it goes live.` : "Verified listings across Sri Lanka."}>
          <form onSubmit={(e) => e.preventDefault()} role="search"
            className="mt-6 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-3 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-400 pointer-events-none" />
              <input id="apt-search" aria-label="Search by apartment name" value={text.q} onChange={(e) => setText((t) => ({ ...t, q: e.target.value }))}
                placeholder="Search by apartment name"
                className="w-full pl-10 pr-4 py-3 bg-white/90 text-primary text-sm rounded-xl border border-white/30 placeholder:text-grey-400 focus:border-accent font-medium" />
            </div>
            <select aria-label="Sort" value={sort} onChange={(e) => setParam({ sort: e.target.value === "newest" ? "" : e.target.value })}
              className="bg-white/90 text-primary text-sm px-4 py-3 rounded-xl border border-white/30 focus:border-accent font-medium cursor-pointer">
              <option value="newest">Newest first</option>
              <option value="priceAsc">Price: low to high</option>
              <option value="priceDesc">Price: high to low</option>
              <option value="discount">Biggest discount</option>
            </select>
          </form>
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-white/40 text-xs">Active filters:</span>
              {chips.map((c) => (
                <button key={c.key} type="button" onClick={c.clear}
                  className="inline-flex items-center gap-1.5 bg-accent/20 text-accent text-xs font-medium px-3 py-1 rounded-full border border-accent/30 hover:bg-accent/30">
                  {c.label} <X size={12} />
                </button>
              ))}
              <button type="button" onClick={clearFilters} className="text-white/40 text-xs hover:text-white underline ml-1">Clear all</button>
            </div>
          )}
        </PublicHero>
      )}

      <div className={cx(!isStaff && "max-w-[1440px] mx-auto px-4 sm:px-8 pb-16")}>
        {attention.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={17} className="text-amber-500" />
              <h2 className="font-semibold text-primary">Needs Your Attention</h2>
              <Badge status="PENDING" label={`${attention.length} item${attention.length !== 1 ? "s" : ""}`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {attention.map((a) => (
                <ManageCard key={a.apartmentId} apartment={a}
                  canEdit={isAdmin || ownsApartment(a)} canReview={canReview}
                  reviewBusy={reviewBusyId === a.apartmentId}
                  onDelete={() => setDeleteTarget(a)} onEdit={() => openModal("createApartment", a)}
                  onApprove={() => handleApprove(a)} onReject={() => { setRejectTarget(a); setRejectReason(""); }} />
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 flex-shrink-0">
            <Button variant="secondary" icon={SlidersHorizontal} className="lg:hidden w-full mb-4" onClick={() => setFiltersOpen((o) => !o)}>
              {filtersOpen ? "Hide filters" : "Show filters"}
            </Button>
            <div className={cx(!filtersOpen && "hidden", "lg:block")}>{filterPanel}</div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap" aria-live="polite">
                <p className="text-sm text-grey-500">
                  {loading && !result ? "Searching…" : <><span className="font-semibold text-primary">{total}</span> apartment{total !== 1 ? "s" : ""} found</>}
                  {params.get("q") && <span className="text-grey-400"> for "<span className="text-primary font-medium">{params.get("q")}</span>"</span>}
                </p>
                <button type="button" onClick={() => setParam({ promo: withPromotion ? "" : "1" })}
                  className={cx("inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all",
                    withPromotion ? "bg-accent text-white border-accent shadow-md" : "bg-white text-accent-dark border-accent/40 hover:border-accent hover:bg-accent/5")}>
                  <span className={cx("w-1.5 h-1.5 rounded-full", withPromotion ? "bg-white animate-pulse" : "bg-accent")} />
                  Promotions Only
                </button>
              </div>
              {isStaff && (
                <select aria-label="Sort" value={sort} onChange={(e) => setParam({ sort: e.target.value === "newest" ? "" : e.target.value })}
                  className="text-sm border border-grey-200 rounded-xl px-4 py-2 focus:border-accent bg-white text-primary cursor-pointer">
                  <option value="newest">Newest first</option>
                  <option value="priceAsc">Price: low to high</option>
                  <option value="priceDesc">Price: high to low</option>
                  <option value="discount">Biggest discount</option>
                </select>
              )}
            </div>

            {error && (
              <Alert className="mb-6" action={<Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => setReloadKey((k) => k + 1)}>Retry</Button>}>
                {error}
              </Alert>
            )}

            {loading && <ApartmentGridSkeleton count={6} />}

            {!loading && !error && items.length === 0 && (
              <Card>
                <EmptyState
                  icon={hasFilters ? SearchX : Home}
                  title={hasFilters ? "No apartments match your search" : "No apartments listed yet"}
                  description={hasFilters ? "Try a wider price range, fewer filters, or a different keyword." : "Check back soon — new listings are added regularly."}
                  actionLabel={hasFilters ? "Clear filters" : undefined}
                  actionOnClick={hasFilters ? clearFilters : undefined}
                />
              </Card>
            )}

            {!loading && !error && items.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {items.map((a, i) => <ApartmentCard key={a.apartmentId} apartment={a} index={i} footer={isStaff ? staffFooter(a) : null} />)}
                </div>
                <Pagination page={result.page} totalPages={result.totalPages}
                  onChange={(p) => { setParam({ page: p || "" }, { keepPage: true }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Listing"
        description={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"? It will disappear from the site. A listing with an active reservation can't be deleted.` : ""}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Listing" icon={MessageSquareWarning}
        description={rejectTarget ? `"${rejectTarget.title}" — give a reason so the listing staff can revise and resubmit.` : ""}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="danger" disabled={!rejectReason.trim()} loading={reviewBusyId === rejectTarget?.apartmentId} onClick={handleRejectConfirmed}>
              Confirm Reject
            </Button>
          </>
        )}>
        <Textarea id="apt-reject-reason" label="Reason for rejection" autoFocus
          placeholder="e.g. Price appears inconsistent with the listed size and location…"
          value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
      </Modal>
    </div>
  );
}

export default Apartments;
