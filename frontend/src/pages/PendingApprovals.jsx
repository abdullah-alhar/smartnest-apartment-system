import { useState, useEffect } from "react";
import {
  getPendingPromotions,
  approvePromotion,
  rejectPromotion,
} from "../api/promotionApi";
import { useAuth } from "../context/AuthContext";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function PendingApprovals() {
  const { token } = useAuth();

  const [managerId, setManagerId] = useState(
    localStorage.getItem("userId") || ""
  );
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState({});    // { [id]: 'approve'|'reject'|false }
  const [actionSuccess, setActionSuccess] = useState({});    // { [id]: message }
  const [actionError, setActionError]   = useState({});      // { [id]: message }

  // Reject modal
  const [rejectModal, setRejectModal] = useState(null);      // { id, title } | null
  const [rejectReason, setRejectReason] = useState("");

  const fetchPending = async () => {
    setLoading(true);
    setError("");
    setFetched(false);
    try {
      const data = await getPendingPromotions();
      setPromotions(Array.isArray(data) ? data : []);
      setFetched(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Could not load pending promotions. Make sure you are logged in as Operations Manager."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPending();
  }, [token]);

  const handleApprove = async (promo) => {
    if (!managerId) {
      setActionError((prev) => ({ ...prev, [promo.id]: "Enter your Manager ID first." }));
      return;
    }
    setActionLoading((prev) => ({ ...prev, [promo.id]: "approve" }));
    setActionError((prev) => ({ ...prev, [promo.id]: "" }));
    try {
      await approvePromotion(promo.id, managerId);
      setActionSuccess((prev) => ({
        ...prev,
        [promo.id]: `✅ "${promo.title}" approved successfully!`,
      }));
      setPromotions((prev) => prev.filter((p) => p.id !== promo.id));
    } catch (err) {
      setActionError((prev) => ({
        ...prev,
        [promo.id]: err?.response?.data?.message || "Approval failed.",
      }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [promo.id]: false }));
    }
  };

  const openRejectModal = (promo) => {
    setRejectModal({ id: promo.id, title: promo.title });
    setRejectReason("");
  };

  const handleRejectConfirm = async () => {
    if (!managerId) {
      setActionError((prev) => ({ ...prev, [rejectModal.id]: "Enter your Manager ID first." }));
      setRejectModal(null);
      return;
    }
    const id = rejectModal.id;
    setRejectModal(null);
    setActionLoading((prev) => ({ ...prev, [id]: "reject" }));
    setActionError((prev) => ({ ...prev, [id]: "" }));
    try {
      await rejectPromotion(id, managerId, rejectReason || "No reason provided.");
      setActionSuccess((prev) => ({
        ...prev,
        [id]: `❌ Promotion rejected.`,
      }));
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setActionError((prev) => ({
        ...prev,
        [id]: err?.response?.data?.message || "Rejection failed.",
      }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (!token) {
    return (
      <div className="page-wrapper">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <h2 className="empty-state-title">Authentication Required</h2>
          <p className="empty-state-desc">
            You must be logged in as Operations Manager to view pending approvals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Pending Approvals</h1>
        <p className="page-subtitle">
          Review and approve or reject promotions submitted by Sales Staff.
        </p>
      </div>

      {/* Manager ID + Refresh row */}
      <div
        className="card"
        style={{ marginBottom: "32px", display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}
      >
        <div className="form-group" style={{ flex: "1", minWidth: "200px" }}>
          <label className="form-label" htmlFor="manager-id-input">
            Your Operations Manager ID
          </label>
          <input
            id="manager-id-input"
            className="form-input"
            type="number"
            min="1"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            placeholder="Enter your manager ID"
          />
        </div>
        <button
          id="pending-refresh-btn"
          className="btn btn-secondary"
          style={{ marginBottom: "2px" }}
          onClick={fetchPending}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="btn-spinner" style={{ borderTopColor: "var(--clr-accent)" }} />
              Refreshing…
            </>
          ) : (
            "↻ Refresh"
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Stats */}
      {fetched && (
        <div className="stats-row" style={{ marginBottom: "32px" }}>
          <div className="stat-card">
            <span className="stat-card-value" style={{ color: "var(--clr-warning)" }}>
              {promotions.length}
            </span>
            <span className="stat-card-label">Awaiting Decision</span>
          </div>
        </div>
      )}

      {/* Spinner */}
      {loading && (
        <div className="spinner-container">
          <div className="spinner" />
        </div>
      )}

      {/* Empty state */}
      {fetched && !loading && promotions.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <h2 className="empty-state-title">All Clear!</h2>
          <p className="empty-state-desc">
            No promotions are waiting for review right now.
          </p>
        </div>
      )}

      {/* Cards */}
      {!loading && promotions.length > 0 && (
        <div className="grid-cards">
          {promotions.map((promo, i) => (
            <div
              key={promo.id}
              className={`promo-card ${promo.isFeatured ? "featured" : ""}`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {/* Success / error banners per card */}
              {actionSuccess[promo.id] && (
                <div className="alert alert-success" style={{ marginBottom: "12px" }}>
                  {actionSuccess[promo.id]}
                </div>
              )}
              {actionError[promo.id] && (
                <div className="alert alert-error" style={{ marginBottom: "12px" }}>
                  {actionError[promo.id]}
                </div>
              )}

              <div className="promo-card-header">
                <div>
                  <div className="promo-card-title">
                    {promo.isFeatured && <span style={{ marginRight: "6px" }}>⭐</span>}
                    {promo.title}
                  </div>
                  <div className="promo-card-meta">
                    Apartment #{promo.apartmentId} · Staff #{promo.salesStaffId}
                  </div>
                </div>
                <div className="promo-discount-badge">{promo.discountPercentage}%</div>
              </div>

              <p className="promo-card-body">{promo.discountDetails}</p>

              <div className="promo-card-footer">
                <div className="promo-card-dates">
                  <div className="promo-card-date-item">
                    <span className="promo-card-date-label">Starts</span>
                    <span className="promo-card-date-value">{formatDate(promo.startDate)}</span>
                  </div>
                  <div className="promo-card-date-item">
                    <span className="promo-card-date-label">Ends</span>
                    <span className="promo-card-date-value">{formatDate(promo.endDate)}</span>
                  </div>
                </div>

                <div className="promo-actions">
                  <button
                    id={`approve-btn-${promo.id}`}
                    className="btn btn-success btn-sm"
                    onClick={() => handleApprove(promo)}
                    disabled={!!actionLoading[promo.id]}
                  >
                    {actionLoading[promo.id] === "approve" ? (
                      <><span className="btn-spinner" /> Approving…</>
                    ) : (
                      "✓ Approve"
                    )}
                  </button>
                  <button
                    id={`reject-btn-${promo.id}`}
                    className="btn btn-danger btn-sm"
                    onClick={() => openRejectModal(promo)}
                    disabled={!!actionLoading[promo.id]}
                  >
                    {actionLoading[promo.id] === "reject" ? (
                      <><span className="btn-spinner" /> Rejecting…</>
                    ) : (
                      "✕ Reject"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="modal-overlay" id="reject-modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Reject Promotion</h2>
            <p style={{ fontSize: "14px", color: "var(--clr-text-muted)", marginBottom: "20px" }}>
              You're rejecting{" "}
              <strong style={{ color: "var(--clr-text-heading)" }}>"{rejectModal.title}"</strong>.
              Please provide a reason so the Sales Staff can improve their submission.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="reject-reason-input">Rejection Reason</label>
              <textarea
                id="reject-reason-input"
                className="form-textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Discount percentage is too high for this listing category…"
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button
                id="cancel-reject-btn"
                className="btn btn-ghost"
                onClick={() => setRejectModal(null)}
              >
                Cancel
              </button>
              <button
                id="confirm-reject-btn"
                className="btn btn-danger"
                onClick={handleRejectConfirm}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingApprovals;
