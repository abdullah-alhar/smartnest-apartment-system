import { useState } from "react";
import { createPromotion } from "../api/promotionApi";
import { useAuth } from "../context/AuthContext";

function CreatePromotion() {
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    apartmentId: "",
    salesStaffId: "",
    title: "",
    discountDetails: "",
    discountPercentage: "",
    startDate: "",
    endDate: "",
    isFeatured: false,
  });

  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const payload = {
        ...formData,
        discountPercentage: parseFloat(formData.discountPercentage),
        apartmentId: parseInt(formData.apartmentId),
        salesStaffId: parseInt(formData.salesStaffId),
      };
      await createPromotion(payload);
      setStatus({
        type: "success",
        message: "🎉 Promotion submitted successfully and is pending approval.",
      });
      setFormData({
        apartmentId: "",
        salesStaffId: "",
        title: "",
        discountDetails: "",
        discountPercentage: "",
        startDate: "",
        endDate: "",
        isFeatured: false,
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Failed to create promotion. Please try again.";
      setStatus({ type: "error", message: String(msg) });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="page-wrapper">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <h2 className="empty-state-title">Authentication Required</h2>
          <p className="empty-state-desc">
            You must be logged in as Sales Staff or Admin to create a promotion.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Create Promotion</h1>
        <p className="page-subtitle">
          Submit a new promotion for a listing. It will be reviewed by an Operations Manager.
        </p>
      </div>

      <div
        className="card"
        style={{ maxWidth: "720px" }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Row 1: Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="promo-title">
              Promotion Title
            </label>
            <input
              id="promo-title"
              className="form-input"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Summer Move-In Special"
              required
            />
          </div>

          {/* Row 2: IDs */}
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="promo-apartmentId">
                Apartment ID
              </label>
              <input
                id="promo-apartmentId"
                className="form-input"
                name="apartmentId"
                type="number"
                min="1"
                value={formData.apartmentId}
                onChange={handleChange}
                placeholder="e.g. 42"
                required
              />
              <span className="form-hint">The ID of the apartment being promoted.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="promo-salesStaffId">
                Sales Staff ID
              </label>
              <input
                id="promo-salesStaffId"
                className="form-input"
                name="salesStaffId"
                type="number"
                min="1"
                value={formData.salesStaffId}
                onChange={handleChange}
                placeholder="e.g. 7"
                required
              />
              <span className="form-hint">Your staff account ID.</span>
            </div>
          </div>

          {/* Row 3: Discount */}
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="promo-discountPercentage">
                Discount Percentage
              </label>
              <input
                id="promo-discountPercentage"
                className="form-input"
                name="discountPercentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discountPercentage}
                onChange={handleChange}
                placeholder="e.g. 15"
                required
              />
              <span className="form-hint">Enter a value between 0 and 100.</span>
            </div>

            <div className="form-group" style={{ justifyContent: "center" }}>
              <label className="form-label" htmlFor="promo-isFeatured">
                Featured Listing
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                <label className="toggle-label" htmlFor="promo-isFeatured">
                  <input
                    id="promo-isFeatured"
                    className="toggle-input"
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                  />
                  <span className="toggle-track" />
                  <span style={{ fontSize: "14px" }}>
                    {formData.isFeatured ? (
                      <span className="text-warning">⭐ Featured</span>
                    ) : (
                      <span className="text-muted">Not featured</span>
                    )}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Row 4: Dates */}
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="promo-startDate">
                Start Date
              </label>
              <input
                id="promo-startDate"
                className="form-input"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="promo-endDate">
                End Date
              </label>
              <input
                id="promo-endDate"
                className="form-input"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Row 5: Details */}
          <div className="form-group">
            <label className="form-label" htmlFor="promo-discountDetails">
              Discount Details
            </label>
            <textarea
              id="promo-discountDetails"
              className="form-textarea"
              name="discountDetails"
              value={formData.discountDetails}
              onChange={handleChange}
              placeholder="Describe what's included in this promotion, terms and conditions, etc."
              rows={4}
              required
            />
          </div>

          {/* Status message */}
          {status.message && (
            <div className={`alert ${status.type === "success" ? "alert-success" : "alert-error"}`}>
              {status.message}
            </div>
          )}

          {/* Submit */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              id="create-promo-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  Submitting…
                </>
              ) : (
                "Submit Promotion"
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={() =>
                setFormData({
                  apartmentId: "",
                  salesStaffId: "",
                  title: "",
                  discountDetails: "",
                  discountPercentage: "",
                  startDate: "",
                  endDate: "",
                  isFeatured: false,
                })
              }
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePromotion;
