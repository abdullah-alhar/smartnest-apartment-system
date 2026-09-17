import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search, Tag, Star, CheckCircle2, Clock3, XCircle, PlusCircle,
  Trash2, Pencil, ThumbsUp, ThumbsDown, Loader2, AlertTriangle, MessageSquareWarning, Building2,
} from "lucide-react";
import {
  getActivePromotions, getMyPromotions, getPendingPromotions,
  deletePromotion, approvePromotion, rejectPromotion,
} from "../api/promotionApi";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../utils/errors";
import EmptyState from "../components/EmptyState";
import { endsLabel } from "../utils/time";
import ConfirmDialog from "../components/ConfirmDialog";
import { SkeletonPromoGrid } from "../components/Skeleton";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) : "—";
// end date is inclusive — a promo ending today is still live
const isLive = (end) => !end || endsLabel(end) !== "Ended";

// PENDING/REJECTED come straight from the model; APPROVED is further split into Active/Expired by end date
function statusMeta(promo) {
  if (promo.status === "PENDING")  return { cls: "badge-pending",  Icon: Clock3,       label: "Pending"  };
  if (promo.status === "REJECTED") return { cls: "badge-rejected", Icon: XCircle,      label: "Rejected" };
  return isLive(promo.endDate)
    ? { cls: "badge-approved", Icon: CheckCircle2, label: "Active"   }
    : { cls: "badge-rejected", Icon: XCircle,      label: "Expired"  };
}

function PromoCard({ promo, index, canDelete, canEdit, canReview, reviewBusy, onDelete, onEdit, onApprove, onReject }) {
  const meta = statusMeta(promo);
  // review actions only ever apply to a PENDING item; ownership actions apply regardless of status —
  // editing a REJECTED promo resubmits it, editing anything else just updates it (and re-queues APPROVED for review)
  const showReview = canReview && promo.status === "PENDING";
  const showManage = canEdit || canDelete;

  return (
    <div
      className={`promo-card ${promo.isFeatured ? "featured" : ""}`}
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <div className="promo-card-header">
        <div>
          <div className="promo-card-title">
            {promo.isFeatured && <Star size={14} className="text-warning" style={{ marginRight: 6, verticalAlign: -2 }} fill="currentColor" />}
            {promo.title}
          </div>
          <div className="promo-card-meta">
            <Building2 size={12} strokeWidth={2.25} style={{ verticalAlign: -2, marginRight: 4 }} />
            Apartment #{promo.apartmentId}
          </div>
        </div>
        <div className="promo-discount-badge">
          {promo.discountPercentage}%<span style={{ fontSize: 12, opacity: .7 }}> off</span>
        </div>
      </div>

      <div className="promo-card-details">
        <span className="promo-card-details-label">Details</span>
        <p className="promo-card-body">{promo.discountDetails || "No additional details provided."}</p>
      </div>

      {promo.status === "REJECTED" && promo.rejectionReason && (
        <div className="rejection-box">
          <strong>Rejection Reason</strong>
          {promo.rejectionReason}
        </div>
      )}

      <div className="promo-card-footer">
        <div className="promo-card-dates">
          <div className="promo-date-item">
            <span className="promo-date-label">Starts</span>
            <span className="promo-date-val">{fmt(promo.startDate)}</span>
          </div>
          <div className="promo-date-item">
            <span className="promo-date-label">Ends</span>
            <span className="promo-date-val">{fmt(promo.endDate)}</span>
          </div>
        </div>

        <div className="promo-card-badges">
          <span className={`badge ${meta.cls}`}>
            <meta.Icon size={12} strokeWidth={2.5} />
            {meta.label}
          </span>
          {promo.isFeatured && (
            <span className="badge badge-featured">
              <Star size={12} strokeWidth={2.5} fill="currentColor" />
              Featured
            </span>
          )}
        </div>

        {/* Review actions — OPERATIONS_MANAGER/ADMIN deciding on a pending submission */}
        {showReview && (
          <div className="promo-card-actions promo-card-actions-review">
            <button type="button" className="btn btn-success btn-sm" disabled={reviewBusy} onClick={onApprove}>
              {reviewBusy ? <Loader2 size={13} className="icon-spin" /> : <ThumbsUp size={13} />} Approve
            </button>
            <button type="button" className="btn btn-danger btn-sm" disabled={reviewBusy} onClick={onReject}>
              <ThumbsDown size={13} /> Reject
            </button>
          </div>
        )}

        {/* Ownership actions — the creator managing their own listing (or Admin, on any listing) */}
        {showManage && (
          <div className="promo-card-actions promo-card-actions-manage">
            {canEdit && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={onEdit}>
                <Pencil size={13} /> {promo.status === "REJECTED" ? "Edit & Resubmit" : "Edit"}
              </button>
            )}
            {canDelete && (
              <button type="button" className="btn btn-ghost-danger btn-sm" onClick={onDelete}>
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivePromotions() {
  const { role, userId } = useAuth();
  const { activeModal, openModal } = useModal();
  const toast = useToast();
  const isAdmin = role === "ADMIN";
  const canCreate = role === "SALES_STAFF" || role === "OPERATIONS_MANAGER" || role === "ADMIN";
  const canReview = role === "OPERATIONS_MANAGER" || role === "ADMIN";

  const [all,      setAll]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [sort,     setSort]     = useState("discount");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewBusyId, setReviewBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
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

  // the Create/Edit modal lives outside this page — reload once it closes so new/resubmitted items show up
  const prevModalRef = useRef(activeModal);
  useEffect(() => {
    if (prevModalRef.current === "createPromotion" && activeModal === null) load();
    prevModalRef.current = activeModal;
  }, [activeModal, load]);

  const ownsPromo = (p) => canCreate && String(p.salesStaffId) === String(userId);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return all.filter((p) => p.title?.toLowerCase().includes(q) || p.discountDetails?.toLowerCase().includes(q));
  }, [all, search]);

  const attention = useMemo(() => {
    return filtered.filter((p) => (ownsPromo(p) && p.status !== "APPROVED") || (canReview && p.status === "PENDING" && !ownsPromo(p)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, canCreate, canReview, userId]);

  const approvedSorted = useMemo(() => {
    let r = filtered.filter((p) => p.status === "APPROVED");
    // customers/visitors browse live offers only — expired ones stay visible to staff managing them
    if (!canCreate && !canReview) r = r.filter((p) => isLive(p.endDate));
    if (sort === "discount") r = [...r].sort((a, b) => b.discountPercentage - a.discountPercentage);
    else if (sort === "endDate") r = [...r].sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    else if (sort === "featured") r = [...r].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    return r;
  }, [filtered, sort, canCreate, canReview]);

  const featured = approvedSorted.filter((p) => p.isFeatured);
  const regular  = approvedSorted.filter((p) => !p.isFeatured);

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
      setAll((s) => s.map((p) => p.id === promo.id ? updated : p));
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
      setAll((s) => s.map((p) => p.id === rejectTarget.id ? updated : p));
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Rejection failed."));
    } finally {
      setReviewBusyId(null);
    }
  };

  const cardProps = (p) => ({
    // Admin has full override access — can edit/delete any promotion, not just their own
    canDelete: isAdmin || ownsPromo(p),
    canEdit:   isAdmin || ownsPromo(p),
    // spec allows reviewing "any pending promotion" — no self-review carve-out for OPERATIONS_MANAGER or ADMIN
    canReview: canReview,
    reviewBusy: reviewBusyId === p.id,
    onDelete:  () => setDeleteTarget(p),
    onEdit:    () => openModal("createPromotion", p),
    onApprove: () => handleApprove(p),
    onReject:  () => { setRejectTarget(p); setRejectReason(""); },
  });

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <div className="hero-banner">
        <div className="flex" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div className="hero-pill"><Tag size={12} /> Live Deals</div>
            <h1 className="hero-title">Active Promotions</h1>
            <p className="hero-sub">Exclusive discounts on premium SmartNest apartments. No account needed.</p>
          </div>
          {canCreate && (
            <button type="button" className="btn btn-primary" onClick={() => openModal("createPromotion")}>
              <PlusCircle size={15} /> Create
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-6" style={{ flexWrap: "wrap", alignItems: "center" }}>
        <div className="input-icon-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
          <Search size={15} className="input-icon" />
          <input
            id="promo-search" className="form-input has-icon"
            placeholder="Search promotions…"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="promo-sort" className="form-select" style={{ width: 200 }}
          value={sort} onChange={(e) => setSort(e.target.value)}
        >
          <option value="discount">Highest Discount</option>
          <option value="endDate">Ending Soon</option>
          <option value="featured">Featured First</option>
        </select>
        <span className="text-muted" style={{ marginLeft: "auto", whiteSpace: "nowrap", fontSize: 13 }}>
          {approvedSorted.length} deal{approvedSorted.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <XCircle size={16} />
          {error}
        </div>
      )}
      {loading && <SkeletonPromoGrid count={6} />}

      {!loading && filtered.length === 0 && !error && (
        <EmptyState
          icon={search ? Search : Clock3}
          title="No Promotions Found"
          description={search ? "Try a different search." : "Check back soon — new deals added regularly."}
        />
      )}

      {!loading && attention.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-title">
              <AlertTriangle size={16} style={{ marginRight:6, verticalAlign:-2 }} className="text-warning" />
              Needs Your Attention
            </h2>
            <span className="badge badge-pending">{attention.length} item{attention.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="grid-cards mb-6">
            {attention.map((p, i) => <PromoCard key={p.id} promo={p} index={i} {...cardProps(p)} />)}
          </div>
        </>
      )}

      {!loading && featured.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-title">
              <Star size={16} style={{ marginRight:6, verticalAlign:-2 }} fill="currentColor" className="text-warning" />
              Featured Deals
            </h2>
            <span className="badge badge-featured">{featured.length} Featured</span>
          </div>
          <div className="grid-cards mb-6">
            {featured.map((p, i) => <PromoCard key={p.id} promo={p} index={i} {...cardProps(p)} />)}
          </div>
        </>
      )}

      {!loading && regular.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-title">{featured.length ? "More Deals" : "All Deals"}</h2>
            <span className="badge badge-info">{regular.length} Available</span>
          </div>
          <div className="grid-cards">
            {regular.map((p, i) => <PromoCard key={p.id} promo={p} index={i} {...cardProps(p)} />)}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Promotion"
        description={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.` : ""}
        confirmLabel={deleting ? <Loader2 size={15} className="icon-spin" /> : "Delete"}
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />

      {rejectTarget && (
        <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              <MessageSquareWarning size={20} style={{ verticalAlign:-4, marginRight:8, color:"var(--danger)" }} />
              Reject Promotion
            </h2>
            <p className="modal-desc">
              You are rejecting <strong style={{ color:"var(--text-heading)" }}>"{rejectTarget.title}"</strong>.
              Provide a reason so the staff member can revise and resubmit.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="reject-reason">Reason for Rejection</label>
              <textarea
                id="reject-reason" className="form-textarea"
                placeholder="e.g. Discount percentage exceeds the allowed maximum of 25%…"
                value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setRejectTarget(null)}>Cancel</button>
              <button
                className="btn btn-danger" disabled={!rejectReason.trim() || reviewBusyId === rejectTarget.id}
                onClick={handleRejectConfirmed}
              >
                {reviewBusyId === rejectTarget.id
                  ? <><Loader2 size={15} className="icon-spin" /> Rejecting…</>
                  : <><XCircle size={15} /> Confirm Reject</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivePromotions;
