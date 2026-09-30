import { useState } from "react";
import { User, Mail, Lock, Shield, Loader2, UserPlus, X } from "lucide-react";
import { createStaff } from "../../api/adminApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../utils/errors";
import PhoneInput from "../PhoneInput";

// MANAGING_DIRECTOR and CUSTOMER left out on purpose — backend rejects both for this endpoint anyway
const STAFF_ROLES = [
  { value: "ADMIN",               label: "Administrator" },
  { value: "SALES_STAFF",         label: "Sales Staff" },
  { value: "CRO",                 label: "Chief Revenue Officer" },
  { value: "OPERATIONS_MANAGER",  label: "Operations Manager" },
  { value: "MARKETING_EXECUTIVE", label: "Marketing Executive" },
];

function CreateStaffModal({ onClose }) {
  const toast = useToast();

  const [form, setForm] = useState({
    firstName:     "",
    lastName:      "",
    email:         "",
    password:      "",
    contactNumber: "",
    role:          "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (value) => {
    setForm((p) => ({ ...p, contactNumber: value }));
    setFieldErrors((p) => ({ ...p, contactNumber: undefined }));
  };

  const validate = () => {
    const errors = {};
    const digits = form.contactNumber.replace(/^\+94/, "");
    if (digits.length > 0 && digits.length !== 9) {
      errors.contactNumber = "Enter exactly 9 digits after +94.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await createStaff(form);
      toast.success(`Staff account for ${form.email} created successfully!`);
      onClose();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to create staff account. Check the details and try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <h2 className="modal-title">Create Staff Account</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="modal-desc">Provision a new staff member with a specific role and system access.</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="cs-firstName">First Name</label>
              <div className="input-icon-wrap">
                <User size={16} className="input-icon" />
                <input
                  id="cs-firstName" className="form-input has-icon" name="firstName"
                  placeholder="John" value={form.firstName} onChange={handle} required autoFocus
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cs-lastName">Last Name</label>
              <input
                id="cs-lastName" className="form-input" name="lastName"
                placeholder="Doe" value={form.lastName} onChange={handle} required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cs-email">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="cs-email" className="form-input has-icon" name="email" type="email"
                placeholder="staff@smartnest.com" value={form.email} onChange={handle} required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cs-password">Temporary Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="cs-password" className="form-input has-icon" name="password" type="password"
                placeholder="Set a strong temporary password" value={form.password} onChange={handle} required
              />
            </div>
            <span className="form-hint">The staff member should change this on first login.</span>
          </div>

          <div className="form-grid form-grid-2">
            <PhoneInput
              id="cs-contact"
              value={form.contactNumber}
              onChange={handlePhoneChange}
              error={fieldErrors.contactNumber}
            />
            <div className="form-group">
              <label className="form-label" htmlFor="cs-role">Role</label>
              <select
                id="cs-role" className="form-select" name="role"
                value={form.role} onChange={handle} required
              >
                <option value="" disabled>Select a role…</option>
                {STAFF_ROLES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <span className="form-hint">Admins can assign any role including Admin.</span>
            </div>
          </div>

          {form.role && (
            <div className="flex items-center gap-2">
              <span className="text-muted" style={{ fontSize: 13 }}>This account will have:</span>
              <span className="dash-role-badge">
                <Shield size={12} />
                {STAFF_ROLES.find((r) => r.value === form.role)?.label ?? form.role}
              </span>
              <span className="text-muted" style={{ fontSize: 13 }}>access</span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              id="cs-submit-btn" type="submit"
              className="btn btn-primary" disabled={loading}
            >
              {loading
                ? <><Loader2 size={16} className="icon-spin" /> Creating Account…</>
                : <><UserPlus size={16} /> Create Staff Account</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateStaffModal;
