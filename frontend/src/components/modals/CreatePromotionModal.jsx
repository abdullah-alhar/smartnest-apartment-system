import { useState } from "react";
import { Building2, User, Tag, Percent, Calendar, Star, Loader2, Send, AlertCircle, X } from "lucide-react";
import { createPromotion, updatePromotion } from "../../api/promotionApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../utils/errors";

const MAX_DURATION_YEARS = 2;
const MAX_DISCOUNT_PERCENTAGE = 100;

// editTarget is the existing promotion being edited-and-resubmitted, or null/undefined for a fresh create
function CreatePromotionModal({ onClose, editTarget }) {
  const { userId } = useAuth();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const isEdit = !!editTarget;

  const [form, setForm] = useState({
    apartmentId:        editTarget?.apartmentId ?? "",
    salesStaffId:       editTarget?.salesStaffId ?? userId ?? "",
    title:              editTarget?.title ?? "",
    discountDetails:    editTarget?.discountDetails ?? "",
    discountPercentage: editTarget?.discountPercentage ?? "",
    startDate:          editTarget?.startDate ?? "",
    endDate:            editTarget?.endDate ?? "",
    isFeatured:         editTarget?.isFeatured ?? false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setFieldErrors((p) => ({ ...p, [name]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!(parseFloat(form.discountPercentage) > 0)) {
      errors.discountPercentage = "Discount percentage must be greater than 0.";
    } else if (parseFloat(form.discountPercentage) > MAX_DISCOUNT_PERCENTAGE) {
      errors.discountPercentage = `Discount percentage cannot exceed ${MAX_DISCOUNT_PERCENTAGE}%.`;
    }
    if (form.startDate && form.startDate < today) {
      errors.startDate = "Start date cannot be in the past.";
    }
    if (form.endDate && form.startDate && form.endDate <= form.startDate) {
      errors.endDate = "End date must be after start date.";
    } else if (form.endDate && form.startDate) {
      const maxEnd = new Date(form.startDate);
      maxEnd.setFullYear(maxEnd.getFullYear() + MAX_DURATION_YEARS);
      if (new Date(form.endDate) > maxEnd) {
        errors.endDate = `A promotion cannot run for more than ${MAX_DURATION_YEARS} years.`;
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const payload = {
      ...form,
      apartmentId:        parseInt(form.apartmentId, 10),
      // Always use the logged-in user's ID — never trust what's in the input field
      salesStaffId:       parseInt(userId, 10),
      discountPercentage: parseFloat(form.discountPercentage),
    };

    try {
      if (isEdit) {
        await updatePromotion(editTarget.id, payload);
        toast.success("Promotion resubmitted! It's now pending approval.");
      } else {
        await createPromotion(payload);
        toast.success("Promotion submitted! It's now pending approval.");
      }
      onClose();
    } catch (err) {
      toast.error(extractErrorMessage(err, `Failed to ${isEdit ? "resubmit" : "create"} promotion. Please check your inputs.`));
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <h2 className="modal-title">{isEdit ? "Edit Promotion" : "Create Promotion"}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="modal-desc">
          {isEdit
            ? "Update the details below and resubmit for Operations Manager review."
            : "Submit a new promotion for Operations Manager review."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="cp-apt">Apartment ID</label>
              <div className="input-icon-wrap">
                <Building2 size={16} className="input-icon" />
                <input id="cp-apt" className="form-input has-icon" name="apartmentId" type="number"
                  placeholder="e.g. 42" min="1" value={form.apartmentId} onChange={handle} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cp-staff">Sales Staff ID</label>
              <div className="input-icon-wrap">
                <User size={16} className="input-icon" />
                <input id="cp-staff" className="form-input has-icon" name="salesStaffId" type="number"
                  value={form.salesStaffId}
                  readOnly
                  style={{ opacity: 0.6, cursor: "not-allowed" }}
                />
              </div>
              <span className="form-hint">Your account ID — cannot be changed</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cp-title">Promotion Title</label>
            <div className="input-icon-wrap">
              <Tag size={16} className="input-icon" />
              <input id="cp-title" className="form-input has-icon" name="title" maxLength={255}
                placeholder="e.g. Summer Move-In Special" value={form.title} onChange={handle} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cp-details">Discount Details</label>
            <textarea id="cp-details" className="form-textarea" name="discountDetails" maxLength={1000}
              placeholder="Describe the promotion offer…" value={form.discountDetails} onChange={handle} />
          </div>

          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label className="form-label" htmlFor="cp-pct">Discount %</label>
              <div className="input-icon-wrap">
                <Percent size={16} className="input-icon" />
                <input id="cp-pct" className={`form-input has-icon ${fieldErrors.discountPercentage ? "has-error" : ""}`}
                  name="discountPercentage" type="number"
                  placeholder={`1–${MAX_DISCOUNT_PERCENTAGE}`} min="0.01" max={MAX_DISCOUNT_PERCENTAGE} step="0.01"
                  value={form.discountPercentage} onChange={handle} required />
              </div>
              {fieldErrors.discountPercentage && (
                <span className="field-error"><AlertCircle size={13} />{fieldErrors.discountPercentage}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cp-start">Start Date</label>
              <div className="input-icon-wrap">
                <Calendar size={16} className="input-icon" />
                <input id="cp-start" className={`form-input has-icon ${fieldErrors.startDate ? "has-error" : ""}`}
                  name="startDate" type="date" min={today}
                  value={form.startDate} onChange={handle} required />
              </div>
              {fieldErrors.startDate && (
                <span className="field-error"><AlertCircle size={13} />{fieldErrors.startDate}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cp-end">End Date</label>
              <div className="input-icon-wrap">
                <Calendar size={16} className="input-icon" />
                <input id="cp-end" className={`form-input has-icon ${fieldErrors.endDate ? "has-error" : ""}`}
                  name="endDate" type="date"
                  value={form.endDate} onChange={handle} required />
              </div>
              {fieldErrors.endDate && (
                <span className="field-error"><AlertCircle size={13} />{fieldErrors.endDate}</span>
              )}
            </div>
          </div>

          <label className="toggle-label">
            <input className="toggle-input" type="checkbox" name="isFeatured"
              checked={form.isFeatured} onChange={handle} />
            <span className="toggle-track" />
            <Star size={14} /> Mark as Featured
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="cp-submit-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? <><Loader2 size={16} className="icon-spin" /> {isEdit ? "Resubmitting…" : "Submitting…"}</>
                : <><Send size={15} /> {isEdit ? "Resubmit Promotion" : "Submit Promotion"}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePromotionModal;
