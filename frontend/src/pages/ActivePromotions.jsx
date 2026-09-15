import { useState, useEffect } from "react";
import { getActivePromotions } from "../api/promotionApi";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const isActive = (endDate) => {
  if (!endDate) return true;
  return new Date(endDate) >= new Date();
};

function ActivePromotions() {
  const [promotions, setPromotions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("discount");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getActivePromotions();
        const list = Array.isArray(data) ? data : [];
        setPromotions(list);
        setFiltered(list);
      } catch (err) {
        setError("Could not load promotions. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Filter + sort whenever search/sortBy/promotions changes
  useEffect(() => {
    let result = promotions.filter((p) => {
      const q = search.toLowerCase();
      return (
        p.title?.toLowerCase().includes(q) ||
        p.discountDetails?.toLowerCase().includes(q)
      );
    });

    if (sortBy === "discount") {
      result = [...result].sort((a, b) => b.discountPercentage - a.discountPercentage);
    } else if (sortBy === "endDate") {
      result = [...result].sort(
        (a, b) => new Date(a.endDate) - new Date(b.endDate)
      );
    } else if (sortBy === "featured") {
      result = [...result].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    setFiltered(result);
  }, [search, sortBy, promotions]);

  const featured = filtered.filter((p) => p.isFeatured);
  const regular  = filtered.filter((p) => !p.isFeatured);

  return (
    <div className="page-wrapper">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.25)",
              borderRadius: "999px",
              padding: "4px 14px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--clr-accent-light)",
              marginBottom: "16px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            🏷️ Live Deals
          </div>
          <h1
            style={{
              fontSize: "40px",
              fontWeight: 800,
              margin: "0 0 10px",
              background: "linear-gradient(135deg, #f0f2f8, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Active Promotions
          </h1>
          <p style={{ color: "var(--clr-text-muted)", fontSize: "15px", maxWidth: "480px" }}>
            Explore exclusive discounts on premium SmartNest apartments. No account needed.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          id="promo-search-input"
          className="form-input"
          style={{ flex: "1", minWidth: "200px", maxWidth: "380px" }}
          placeholder="🔍 Search promotions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          id="promo-sort-select"
          className="form-select"
          style={{ width: "200px" }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="discount">Sort: Highest Discount</option>
          <option value="endDate">Sort: Ending Soon</option>
          <option value="featured">Sort: Featured First</option>
        </select>
        <span
          style={{
            fontSize: "13px",
            color: "var(--clr-text-muted)",
            marginLeft: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {filtered.length} deal{filtered.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="spinner-container">
          <div className="spinner" />
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-state-icon">🏷️</div>
          <h2 className="empty-state-title">No Promotions Found</h2>
          <p className="empty-state-desc">
            {search ? "Try a different search term." : "Check back soon — new deals are added regularly."}
          </p>
        </div>
      )}

      {/* Featured Section */}
      {!loading && featured.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-title">⭐ Featured Deals</h2>
            <span className="badge badge-featured">{featured.length} Featured</span>
          </div>
          <div className="grid-cards" style={{ marginBottom: "40px" }}>
            {featured.map((promo, i) => (
              <PromoCard key={promo.id || i} promo={promo} index={i} />
            ))}
          </div>
        </>
      )}

      {/* All Promotions Section */}
      {!loading && regular.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-title">
              {featured.length > 0 ? "More Deals" : "All Deals"}
            </h2>
            <span className="badge badge-info">{regular.length} Available</span>
          </div>
          <div className="grid-cards">
            {regular.map((promo, i) => (
              <PromoCard key={promo.id || i} promo={promo} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PromoCard({ promo, index }) {
  const active = isActive(promo.endDate);

  return (
    <div
      className={`promo-card ${promo.isFeatured ? "featured" : ""}`}
      style={{ animationDelay: `${index * 0.07}s` }}
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
        <div
          className="promo-discount-badge"
          style={{ fontSize: "20px" }}
          title={`${promo.discountPercentage}% off`}
        >
          {promo.discountPercentage}%<span style={{ fontSize: "12px", opacity: 0.7 }}> off</span>
        </div>
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

        <div className="tag-row">
          {active ? (
            <span className="badge badge-approved">Active</span>
          ) : (
            <span className="badge badge-rejected">Expired</span>
          )}
          {promo.isFeatured && <span className="badge badge-featured">Featured</span>}
        </div>
      </div>
    </div>
  );
}

export default ActivePromotions;
