import { useState, useEffect } from "react";
import { User, Mail, Shield, Save, Loader2, KeyRound, Lock } from "lucide-react";
import { getMyProfile, updateMyProfile, changeMyPassword } from "../api/userApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../utils/errors";
import PhoneInput from "../components/PhoneInput";
import { SkeletonBlock } from "../components/Skeleton";

const roleLabel = {
  ADMIN:               "Administrator",
  SALES_STAFF:         "Sales Staff",
  OPERATIONS_MANAGER:  "Operations Manager",
  CRO:                 "Chief Revenue Officer",
  MANAGING_DIRECTOR:   "Managing Director",
  MARKETING_EXECUTIVE: "Marketing Executive",
  CUSTOMER:            "Customer",
};

function Profile() {
  const toast = useToast();
  const { updateName } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", contactNumber: "" });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((data) => {
        setProfile(data);
        setForm({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          contactNumber: data.contactNumber ?? "",
        });
      })
      .catch((err) => toast.error(extractErrorMessage(err, "Could not load your profile.")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setProfileErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handlePhoneChange = (value) => {
    setForm((p) => ({ ...p, contactNumber: value }));
    setProfileErrors((p) => ({ ...p, contactNumber: undefined }));
  };

  const validateProfile = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = "First name is required.";
    if (!form.lastName.trim()) errors.lastName = "Last name is required.";
    const digits = form.contactNumber.replace(/^\+94/, "");
    if (digits.length > 0 && digits.length !== 9) {
      errors.contactNumber = "Enter exactly 9 digits after +94.";
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setSavingProfile(true);
    try {
      const updated = await updateMyProfile(form);
      setProfile(updated);
      updateName(updated.firstName, updated.lastName);
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to update profile."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePwField = (e) => {
    const { name, value } = e.target;
    setPwForm((p) => ({ ...p, [name]: value }));
    setPwErrors((p) => ({ ...p, [name]: undefined }));
  };

  const validatePassword = () => {
    const errors = {};
    if (!pwForm.currentPassword) errors.currentPassword = "Current password is required.";
    if (!pwForm.newPassword || pwForm.newPassword.length < 8) {
      errors.newPassword = "New password must be at least 8 characters.";
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    setPwErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setSavingPassword(true);
    try {
      await changeMyPassword(pwForm);
      toast.success("Password changed successfully.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to change password."));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1 className="page-title">Profile &amp; Settings</h1>
        <p className="page-subtitle">Manage your account information and password.</p>
      </div>

      {/* Identity summary */}
      <div className="card mb-6">
        {loading ? (
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <SkeletonBlock width={56} height={56} radius={999} />
            <div style={{ flex: 1 }}>
              <SkeletonBlock width="40%" height={18} style={{ marginBottom: 8 }} />
              <SkeletonBlock width="60%" height={13} />
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div className="profile-avatar">
              {(profile?.firstName?.[0] ?? "").toUpperCase()}{(profile?.lastName?.[0] ?? "").toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-heading)" }}>
                {profile?.firstName} {profile?.lastName}
              </div>
              <div className="flex items-center gap-2 mt-4" style={{ marginTop: 6 }}>
                <span className="dash-role-badge">
                  <Shield size={12} />
                  {roleLabel[profile?.role] ?? profile?.role}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile info form */}
      <div className="card mb-6">
        <h2 className="section-title" style={{ marginBottom: 18 }}>Profile Information</h2>
        <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="pf-firstName">First Name</label>
              <div className="input-icon-wrap">
                <User size={16} className="input-icon" />
                <input
                  id="pf-firstName" className={`form-input has-icon ${profileErrors.firstName ? "has-error" : ""}`}
                  name="firstName" value={form.firstName} onChange={handleField} disabled={loading}
                />
              </div>
              {profileErrors.firstName && <span className="field-error">{profileErrors.firstName}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pf-lastName">Last Name</label>
              <input
                id="pf-lastName" className={`form-input ${profileErrors.lastName ? "has-error" : ""}`}
                name="lastName" value={form.lastName} onChange={handleField} disabled={loading}
              />
              {profileErrors.lastName && <span className="field-error">{profileErrors.lastName}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pf-email">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="pf-email" className="form-input has-icon"
                value={profile?.email ?? ""} disabled readOnly
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
            </div>
            <span className="form-hint">Email cannot be changed.</span>
          </div>

          <PhoneInput
            id="pf-contact"
            value={form.contactNumber}
            onChange={handlePhoneChange}
            error={profileErrors.contactNumber}
          />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button id="profile-save-btn" type="submit" className="btn btn-primary" disabled={loading || savingProfile}>
              {savingProfile
                ? <><Loader2 size={16} className="icon-spin" /> Saving…</>
                : <><Save size={16} /> Save Changes</>
              }
            </button>
          </div>
        </form>
      </div>

      {/* Change password form */}
      <div className="card">
        <h2 className="section-title" style={{ marginBottom: 18 }}>
          <KeyRound size={17} style={{ verticalAlign: -3, marginRight: 8 }} />
          Change Password
        </h2>
        <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="pw-current">Current Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="pw-current" className={`form-input has-icon ${pwErrors.currentPassword ? "has-error" : ""}`}
                type="password" name="currentPassword" value={pwForm.currentPassword} onChange={handlePwField}
              />
            </div>
            {pwErrors.currentPassword && <span className="field-error">{pwErrors.currentPassword}</span>}
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="pw-new">New Password</label>
              <div className="input-icon-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  id="pw-new" className={`form-input has-icon ${pwErrors.newPassword ? "has-error" : ""}`}
                  type="password" name="newPassword" value={pwForm.newPassword} onChange={handlePwField}
                />
              </div>
              {pwErrors.newPassword && <span className="field-error">{pwErrors.newPassword}</span>}
              {!pwErrors.newPassword && <span className="form-hint">At least 8 characters.</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pw-confirm">Confirm New Password</label>
              <div className="input-icon-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  id="pw-confirm" className={`form-input has-icon ${pwErrors.confirmPassword ? "has-error" : ""}`}
                  type="password" name="confirmPassword" value={pwForm.confirmPassword} onChange={handlePwField}
                />
              </div>
              {pwErrors.confirmPassword && <span className="field-error">{pwErrors.confirmPassword}</span>}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button id="password-save-btn" type="submit" className="btn btn-secondary" disabled={savingPassword}>
              {savingPassword
                ? <><Loader2 size={16} className="icon-spin" /> Updating…</>
                : <><KeyRound size={16} /> Update Password</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
