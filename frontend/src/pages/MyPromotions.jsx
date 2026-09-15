import { useState, useEffect } from "react";
import { getMyPromotions } from "../api/promotionApi";
import { useAuth } from "../context/AuthContext";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const statusBadge = (status) => {
  const map = {
    PENDING:  { cls: "badge badge-pending",  label: "Pending Review" },
    APPROVED: { cls: "badge badge-approved", label: "Approved" },
    REJECTED: { cls: "badge badge-rejected", label: "Rejected" },
  };
  const s = map[status?.toUpperCase()] || { cls: "badge badge-info", label: status || "Unknown" };
  return <span className={s.cls}>{s.label}</span>;
};

function MyPromotions() {
  const { token } = useAuth();

  // salesStaffId is embedded in the JWT (decode) or kept in localStorage
  // We expose a manual ID input as fallback
  const [salesStaffId, setSalesStaffId] = useState(
    localStorage.getItem("userId") || ""
  );
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  const fetchPromotions = async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await getMyPromotions(id);
      setPromotions(Array.isArray(data) ? data : []);
      setFetched(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Could not load your promotions. Make sure your Staff ID is correct."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && salesStaffId) fetchPromotions(salesStaffId);
  }, [token]);

  if (!token) {
    return (
      <div className="page-wrapper">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <h2 className="empty-state-title">Authentication Required</h2>
          <p className="empty-state-desc">Please log in to view your promotions.</p>
        </div>
      </div>
    );
  }

  const counts = promotions.reduce(
    (acc, p) => {
      const s = (p.status || "").toUpperCase();
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">My Promotions</h1>
        <p className="page-subtitle">Track all promotions you've submitted and their review status.</p>
      </div>

      {/* Staff ID input (in case userId isn't yet in localStorage) */}
      <div
        className="card"
        style={{ marginBottom: "32px", display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}
      >
        <div className="form-group" style={{ flex: "1", minWidth: "200px" }}>
          <label className="form-label" htmlFor="my-promos-staff-id">
            Your Sales Staff ID
          </label>
          <input
            id="my-promos-staff-id"
            className="form-input"
            type="number"
            min="1"
            value={salesStaffId}
            onChange={(e) => setSalesStaffId(e.target.value)}
            placeholder="Enter your staff ID"
          />
        </div>
        <button
          id="my-promos-fetch-btn"
          className="btn btn-primary"
          style={{ marginBottom: "2px" }}
          onClick={() => fetchPromotions(salesStaffId)}
          disabled={loading || !salesStaffId}
        >
          {loading ? (
            <>
              <span className="btn-spinner" /> Loading…
            </>
          ) : (
            "Load My Promotions"
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Stats Row */}
      {fetched && promotions.length > 0 && (
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-card-value" style={{ color: "var(--clr-accent-light)" }}>
              {promotions.length}
            </span>
            <span className="stat-card-label">Total Submitted</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value" style={{ color: "var(--clr-warning)" }}>
              {counts["PENDING"] || 0}
            </span>
            <span className="stat-card-label">Pending Review</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value" style={{ color: "var(--clr-success)" }}>
              {counts["APPROVED"] || 0}
            </span>
            <span className="stat-card-label">Approved</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value" style={{ color: "var(--clr-danger)" }}>
              {counts["REJECTED"] || 0}
            </span>
            <span className="stat-card-label">Rejected</span>
          </div>
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="spinner-container">
          <div className="spinner" />
        </div>
      )}

      {/* Empty state */}
      {fetched && !loading && promotions.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h2 className="empty-state-title">No Promotions Yet</h2>
          <p className="empty-state-desc">
            You haven't submitted any promotions. Create your first one to get started.
          </p>
        </div>
      )}

      {/* Promotions grid */}
      {!loading && promotions.length > 0 && (
        <div className="grid-cards">
          {promotions.map((promo, i) => {
            const status = (promo.status || "").toUpperCase();
            return (
              <div
                key={promo.id || i}
                className={`promo-card ${promo.isFeatured ? "featured" : ""}`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="promo-card-header">
                  <div>
                    <div className="promo-card-title">
                      {promo.isFeatured && <span style={{ marginRight: "6px" }}>⭐</span>}
                      {promo.title}
                    </div>
                    <div className="promo-card-meta">
                      Apartment #{promo.apartmentId}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="promo-discount-badge">
                      {promo.discountPercentage}%
                    </div>
                    {statusBadge(promo.status)}
                  </div>
                </div>

                <p className="promo-card-body">{promo.discountDetails}</p>

                {status === "REJECTED" && promo.rejectionReason && (
                  <div className="rejection-box">
                    <strong>Rejection Reason</strong>
                    {promo.rejectionReason}
                  </div>
                )}

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
                  {promo.isFeatured && (
                    <span className="badge badge-featured">Featured</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyPromotions;
