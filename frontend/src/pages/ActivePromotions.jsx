import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Search, Tag, Star, PlusCircle, Trash2, Pencil, ThumbsUp, ThumbsDown, AlertTriangle, MessageSquareWarning, Building2, ArrowRight, Clock3,
} from "lucide-react";
import {
  getActivePromotions, getMyPromotions, getPendingPromotions,
  deletePromotion, approvePromotion, rejectPromotion,
} from "../api/promotionApi";
import { apartmentImageSrc } from "../api/apartmentApi";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../utils/errors";
import { useLiveRefresh } from "../utils/useLiveRefresh";
import { endsLabel } from "../utils/time";
import { fmtDate, fmtPercent, fmtPrice } from "../utils/format";
import { isStaffRole } from "../utils/roles";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { SkeletonPromoGrid } from "../components/Skeleton";
import { Alert, Badge, Button, Card, Modal, PageHeader, PublicHero, Textarea } from "../components/ui";
import { cx, fieldCls } from "../components/styles";

const isLive = (end) => !end || endsLabel(end) !== "Ended";

function statusOf(promo) {
  if (promo.status === "PENDING") return { status: "PENDING" };
  if (promo.status === "REJECTED") return { status: "REJECTED" };
  return isLive(promo.endDate) ? { status: "ACTIVE" } : { status: "EXPIRED" };
}

function PromoCard({ promo, index, canEdit, canReview, reviewBusy, onDelete, onEdit, onApprove, onReject }) {
  const meta = statusOf(promo);
  const showReview = canReview && promo.status === "PENDING";
  const ends = promo.status === "APPROVED" ? endsLabel(promo.endDate) : "";
  const urgent = ends && /today|tomorrow|in [1-7] days/.test(ends);

  return (
    <Card className={cx("overflow-hidden flex flex-col animate-rise", promo.isFeatured && "ring-1 ring-accent/40")} style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}>
      <Link to={`/apartments/${promo.apartmentId}`} className="apt-visual relative h-36 block group">
        {promo.apartmentImageUrl
          ? <img src={apartmentImageSrc(promo.apartmentImageUrl)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 size={40} strokeWidth={1.2} className="text-accent/70 group-hover:scale-110 transition-transform duration-500" />
            </div>
          )}
        <span className="absolute top-3 right-3 bg-accent text-white text-sm font-bold px-3 py-1 rounded-xl shadow">{fmtPercent(promo.discountPercentage)}% OFF</span>
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {promo.isFeatured && <span className="flex items-center gap-1 bg-white/90 text-accent-dark text-[11px] font-bold px-2 py-0.5 rounded-lg"><Star size={11} fill="currentColor" /> Featured</span>}
          {ends && ends !== "Ended" && <span className={cx("text-[11px] font-bold px-2 py-0.5 rounded-lg text-white", urgent ? "bg-red-500" : "bg-white/20 backdrop-blur")}>{ends}</span>}
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="text-accent-dark text-xs font-semibold uppercase tracking-wider line-clamp-1">{promo.title}</p>
          <Badge status={meta.status} size="xs" />
        </div>
        <Link to={`/apartments/${promo.apartmentId}`} className="font-semibold text-primary hover:text-accent-dark line-clamp-1 mb-2">
          {promo.apartmentTitle || `Apartment #${promo.apartmentId}`}
        </Link>
        {promo.apartmentPrice != null && (
          <p className="text-sm mb-3">
            <span className="text-lg font-black text-accent">{fmtPrice(promo.discountedPrice ?? promo.apartmentPrice)}</span>
            {promo.discountedPrice != null && <span className="text-grey-400 line-through ml-2 text-xs">{fmtPrice(promo.apartmentPrice)}</span>}
          </p>
        )}
        <p className="text-sm text-grey-500 line-clamp-2 mb-4">{promo.discountDetails || "No additional details provided."}</p>

        {promo.status === "REJECTED" && promo.rejectionReason && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-700 mb-4">
            <strong className="block mb-0.5">Rejection reason</strong>{promo.rejectionReason}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-grey-100 flex items-center justify-between gap-3 text-xs text-grey-400">
          <span>{fmtDate(promo.startDate)} — {fmtDate(promo.endDate)}</span>
          <Link to={`/apartments/${promo.apartmentId}`} className="text-accent-dark font-medium hover:underline flex items-center gap-1 whitespace-nowrap">View <ArrowRight size={12} /></Link>
        </div>

        {(showReview || canEdit) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {showReview && (
              <>
                <Button size="sm" variant="success" icon={ThumbsUp} loading={reviewBusy} onClick={onApprove}>Approve</Button>
                <Button size="sm" variant="danger" icon={ThumbsDown} disabled={reviewBusy} onClick={onReject}>Reject</Button>
              </>
            )}
            {canEdit && (
              <>
                <Button size="sm" variant="secondary" icon={Pencil} onClick={onEdit}>{promo.status === "REJECTED" ? "Edit & Resubmit" : "Edit"}</Button>
                <Button size="sm" variant="danger-ghost" icon={Trash2} onClick={onDelete}>Delete</Button>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function ActivePromotions() {
  const { token, role, userId } = useAuth();
  const { activeModal, openModal } = useModal();
  const toast = useToast();
  const isStaff = !!token && isStaffRole(role);
  const isAdmin = role === "ADMIN";
  const canCreate = role === "SALES_STAFF" || role === "OPERATIONS_MANAGER" || role === "ADMIN";
  const canReview = role === "OPERATIONS_MANAGER" || role === "ADMIN";

  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("discount");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewBusyId, setReviewBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const requests = [getActivePromotions()];
      if (canCreate) requests.push(getMyPromotions(userId));
      if (canReview) requests.push(getPendingPromotions());
      const results = await Promise.all(requests);
      const merged = new Map();
      results.flat().forEach((p) => merged.set(p.id, p));
      setAll(Array.from(merged.values()));
      setError("");
    } catch {
      setError("Could not load promotions. Try again later.");
    } finally {
      setLoading(false);
    }
  }, [canCreate, canReview, userId]);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);

  const prevModalRef = useRef(activeModal);
  useEffect(() => {
    if (prevModalRef.current === "createPromotion" && activeModal === null) load();
    prevModalRef.current = activeModal;
  }, [activeModal, load]);

  const ownsPromo = useCallback((p) => canCreate && String(p.salesStaffId) === String(userId), [canCreate, userId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return all.filter((p) => p.title?.toLowerCase().includes(q) || p.discountDetails?.toLowerCase().includes(q) || p.apartmentTitle?.toLowerCase().includes(q));
  }, [all, search]);

  const attention = useMemo(
    () => filtered.filter((p) => (ownsPromo(p) && p.status !== "APPROVED") || (canReview && p.status === "PENDING" && !ownsPromo(p))),
    [filtered, ownsPromo, canReview],
  );

  const approvedSorted = useMemo(() => {
    let r = filtered.filter((p) => p.status === "APPROVED");
    if (!canCreate && !canReview) r = r.filter((p) => isLive(p.endDate));
    if (sort === "discount") r = [...r].sort((a, b) => b.discountPercentage - a.discountPercentage);
    else if (sort === "endDate") r = [...r].sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    else if (sort === "featured") r = [...r].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    return r;
  }, [filtered, sort, canCreate, canReview]);

  const featured = approvedSorted.filter((p) => p.isFeatured);
  const regular = approvedSorted.filter((p) => !p.isFeatured);

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      await deletePromotion(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" was deleted.`);
      setAll((s) => s.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete promotion."));
    } finally {
      setDeleting(false);
    }
  };

  const handleApprove = async (promo) => {
    setReviewBusyId(promo.id);
    try {
      const updated = await approvePromotion(promo.id, userId);
      toast.success(`"${promo.title}" approved.`);
      setAll((s) => s.map((p) => (p.id === promo.id ? updated : p)));
    } catch (err) {
      toast.error(extractErrorMessage(err, "Approval failed."));
    } finally {
      setReviewBusyId(null);
    }
  };

  const handleRejectConfirmed = async () => {
    if (!rejectReason.trim()) return;
    setReviewBusyId(rejectTarget.id);
    try {
      const updated = await rejectPromotion(rejectTarget.id, userId, rejectReason.trim());
      toast.success(`"${rejectTarget.title}" rejected.`);
      setAll((s) => s.map((p) => (p.id === rejectTarget.id ? updated : p)));
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Rejection failed."));
    } finally {
      setReviewBusyId(null);
    }
  };

  const cardProps = (p) => ({
    canEdit: isAdmin || ownsPromo(p),
    canReview,
    reviewBusy: reviewBusyId === p.id,
    onDelete: () => setDeleteTarget(p),
    onEdit: () => openModal("createPromotion", p),
    onApprove: () => handleApprove(p),
    onReject: () => { setRejectTarget(p); setRejectReason(""); },
  });

  const grid = (list) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {list.map((p, i) => <PromoCard key={p.id} promo={p} index={i} {...cardProps(p)} />)}
    </div>
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-400 pointer-events-none" />
        <input id="promo-search" aria-label="Search promotions" className={fieldCls(false, "pl-10")} placeholder="Search promotions or apartments…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <select id="promo-sort" aria-label="Sort promotions" className={fieldCls(false, "w-auto! cursor-pointer")} value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="discount">Highest discount</option>
        <option value="endDate">Ending soon</option>
        <option value="featured">Featured first</option>
      </select>
      <span className="ml-auto text-sm text-grey-400">{approvedSorted.length} deal{approvedSorted.length !== 1 ? "s" : ""} found</span>
    </div>
  );

  return (
    <div>
      {isStaff ? (
        <PageHeader title="Promotions" subtitle="Discounts on listed apartments. New promotions go to an Operations Manager for approval."
          actions={canCreate && <Button icon={PlusCircle} onClick={() => openModal("createPromotion")}>Create Promotion</Button>} />
      ) : (
        <PublicHero eyebrow="Limited Time" title="Exclusive Promotions" subtitle="Live discounts on SmartNest apartments — no account needed to browse." />
      )}

      <div className={cx(!isStaff && "max-w-[1440px] mx-auto px-4 sm:px-8 pb-16")}>
        {toolbar}

        {error && <Alert className="mb-6">{error}</Alert>}
        {loading && <SkeletonPromoGrid count={6} />}

        {!loading && filtered.length === 0 && !error && (
          <Card>
            <EmptyState icon={search ? Search : Clock3} title="No promotions found"
              description={search ? "Try a different search." : "Check back soon — new deals are added regularly."} />
          </Card>
        )}

        {!loading && attention.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={17} className="text-amber-500" />
              <h2 className="font-semibold text-primary">Needs Your Attention</h2>
              <Badge status="PENDING" label={`${attention.length} item${attention.length !== 1 ? "s" : ""}`} />
            </div>
            {grid(attention)}
          </section>
        )}

        {!loading && featured.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent-dark text-xs font-bold px-3 py-1.5 rounded-xl">
                <Star size={13} fill="currentColor" /> Featured Deals
              </span>
              <div className="flex-1 h-px bg-accent/20" />
              <span className="text-xs text-grey-400">{featured.length} featured</span>
            </div>
            {grid(featured)}
          </section>
        )}

        {!loading && regular.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs font-semibold text-grey-500 uppercase tracking-wider flex items-center gap-1.5"><Tag size={13} /> {featured.length ? "More Deals" : "All Deals"}</span>
              <div className="flex-1 h-px bg-grey-200" />
              <span className="text-xs text-grey-400">{regular.length} available</span>
            </div>
            {grid(regular)}
          </section>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Promotion"
        description={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.` : ""}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Promotion" icon={MessageSquareWarning}
        description={rejectTarget ? `"${rejectTarget.title}" — give a reason so the staff member can revise and resubmit.` : ""}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="danger" disabled={!rejectReason.trim()} loading={reviewBusyId === rejectTarget?.id} onClick={handleRejectConfirmed}>Confirm Reject</Button>
          </>
        )}>
        <Textarea id="reject-reason" label="Reason for rejection" autoFocus
          placeholder="e.g. Discount percentage exceeds the allowed maximum…"
          value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
      </Modal>
    </div>
  );
}

export default ActivePromotions;
