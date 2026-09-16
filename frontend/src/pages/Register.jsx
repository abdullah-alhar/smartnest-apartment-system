import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, CreditCard, MapPin, Loader2, UserPlus } from "lucide-react";
import { registerUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../utils/errors";
import Brand from "../components/Brand";
import PhoneInput from "../components/PhoneInput";

function Register() {
  const { login } = useAuth();
  const toast      = useToast();
  const navigate    = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "",
    contactNumber: "", city: "", postalCode: "", street: "", nic: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePhoneChange = (value) => {
    setFormData((p) => ({ ...p, contactNumber: value }));
    setFieldErrors((p) => ({ ...p, contactNumber: undefined }));
  };

  // old NIC: 9 digits + V/X, new NIC: 12 digits
  const NIC_PATTERN = /^([0-9]{9}[vVxX]|[0-9]{12})$/;

  const handleNicChange = (e) => {
    // uppercase as they type so a trailing v/x always lands as V/X
    setFormData((p) => ({ ...p, nic: e.target.value.toUpperCase() }));
    setFieldErrors((p) => ({ ...p, nic: undefined }));
  };

  const validate = () => {
    const errors = {};
    const digits = formData.contactNumber.replace(/^\+94/, "");
    if (digits.length !== 9) {
      errors.contactNumber = "Contact number is required (9 digits after +94).";
    }
    if (!formData.nic.trim()) {
      errors.nic = "NIC is required.";
    } else if (!NIC_PATTERN.test(formData.nic.trim())) {
      errors.nic = "Enter a valid NIC (old: 9 digits + V/X, new: 12 digits).";
    }
    if (!formData.city.trim())       errors.city = "City is required.";
    if (!formData.street.trim())     errors.street = "Street address is required.";
    if (!formData.postalCode.trim()) errors.postalCode = "Postal code is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await registerUser(formData);
      // Customers register → CUSTOMER role → go to /promotions
      login(data.token, data.userId, data.role ?? "CUSTOMER", data.firstName, data.lastName);
      toast.success("Account created! Redirecting…");
      setTimeout(() => navigate("/promotions"), 700);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Registration failed. Please check your details."));
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: "520px" }}>
        <div className="auth-logo">
          <Brand size="lg" />
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join SmartNest to discover great apartments</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-firstName">First Name</label>
              <div className="input-icon-wrap">
                <User size={16} className="input-icon" />
                <input id="reg-firstName" className="form-input has-icon" name="firstName"
                  placeholder="John" value={formData.firstName} onChange={handleChange} required autoFocus />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-lastName">Last Name</label>
              <input id="reg-lastName" className="form-input" name="lastName"
                placeholder="Doe" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input id="reg-email" className="form-input has-icon" name="email" type="email"
                placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input id="reg-password" className="form-input has-icon" name="password" type="password"
                placeholder="Create a strong password" value={formData.password} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-grid form-grid-2">
            <PhoneInput
              id="reg-contactNumber"
              value={formData.contactNumber}
              onChange={handlePhoneChange}
              error={fieldErrors.contactNumber}
              required
            />
            <div className="form-group">
              <label className="form-label" htmlFor="reg-nic">NIC</label>
              <div className="input-icon-wrap">
                <CreditCard size={16} className="input-icon" />
                <input id="reg-nic" className={`form-input has-icon ${fieldErrors.nic ? "has-error" : ""}`} name="nic"
                  placeholder="e.g. 851234567V or 199912345678" value={formData.nic} onChange={handleNicChange} required />
              </div>
              {fieldErrors.nic && <span className="field-error">{fieldErrors.nic}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-street">Street Address</label>
            <div className="input-icon-wrap">
              <MapPin size={16} className="input-icon" />
              <input id="reg-street" className={`form-input has-icon ${fieldErrors.street ? "has-error" : ""}`} name="street"
                placeholder="123 Main Street" value={formData.street} onChange={handleChange} required />
            </div>
            {fieldErrors.street && <span className="field-error">{fieldErrors.street}</span>}
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-city">City</label>
              <input id="reg-city" className={`form-input ${fieldErrors.city ? "has-error" : ""}`} name="city"
                placeholder="Colombo" value={formData.city} onChange={handleChange} required />
              {fieldErrors.city && <span className="field-error">{fieldErrors.city}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-postalCode">Postal Code</label>
              <input id="reg-postalCode" className={`form-input ${fieldErrors.postalCode ? "has-error" : ""}`} name="postalCode"
                placeholder="10000" value={formData.postalCode} onChange={handleChange} required />
              {fieldErrors.postalCode && <span className="field-error">{fieldErrors.postalCode}</span>}
            </div>
          </div>

          <button id="register-submit-btn" type="submit"
            className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading
              ? <><Loader2 size={17} className="icon-spin" /> Creating Account…</>
              : <><UserPlus size={16} /> Create Account</>
            }
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
