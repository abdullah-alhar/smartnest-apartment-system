import { useState, useEffect } from "react";
import { User, Mail, Shield, Save, KeyRound, Lock } from "lucide-react";
import { getMyProfile, updateMyProfile, changeMyPassword } from "../api/userApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../utils/errors";
import { initialsOf, isStaffRole, roleLabel } from "../utils/roles";
import PhoneInput from "../components/PhoneInput";
import { SkeletonBlock } from "../components/Skeleton";
import { Button, Card, Input, PageHeader, PublicHero } from "../components/ui";
import { cx } from "../components/styles";

function Profile() {
  const toast = useToast();
  const { role, updateName } = useAuth();
  const isStaff = isStaffRole(role);

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
        setForm({ firstName: data.firstName ?? "", lastName: data.lastName ?? "", contactNumber: data.contactNumber ?? "" });
      })
      .catch((err) => toast.error(extractErrorMessage(err, "Could not load your profile.")))
      .finally(() => setLoading(false));
  }, [toast]);

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
    if (digits.length > 0 && digits.length !== 9) errors.contactNumber = "Enter exactly 9 digits after +94.";
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
    if (!pwForm.newPassword || pwForm.newPassword.length < 8) errors.newPassword = "New password must be at least 8 characters.";
    if (pwForm.newPassword !== pwForm.confirmPassword) errors.confirmPassword = "Passwords do not match.";
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

  const content = (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        {loading ? (
          <div className="flex gap-4 items-center">
            <SkeletonBlock width={64} height={64} radius={16} />
            <div className="flex-1"><SkeletonBlock width="40%" height={18} style={{ marginBottom: 8 }} /><SkeletonBlock width="60%" height={13} /></div>
          </div>
        ) : (
          <div className="flex gap-4 items-center flex-wrap">
            <span className="w-16 h-16 rounded-2xl bg-primary text-accent text-xl font-bold flex items-center justify-center">
              {initialsOf(profile?.firstName, profile?.lastName)}
            </span>
            <div className="flex-1 min-w-[180px]">
              <p className="text-lg font-semibold text-primary">{profile?.firstName} {profile?.lastName}</p>
              <p className="text-sm text-grey-400">{profile?.email}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent-dark text-xs font-semibold px-3 py-1.5 rounded-lg border border-accent/20">
              <Shield size={13} /> {roleLabel(profile?.role ?? role)}
            </span>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-primary mb-5 flex items-center gap-2"><User size={17} className="text-accent" /> Profile Information</h2>
        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="pf-firstName" label="First Name" icon={User} name="firstName" value={form.firstName} onChange={handleField} disabled={loading} error={profileErrors.firstName} />
            <Input id="pf-lastName" label="Last Name" name="lastName" value={form.lastName} onChange={handleField} disabled={loading} error={profileErrors.lastName} />
          </div>
          <Input id="pf-email" label="Email Address" icon={Mail} value={profile?.email ?? ""} disabled readOnly hint="Email cannot be changed." />
          <PhoneInput id="pf-contact" value={form.contactNumber} onChange={handlePhoneChange} error={profileErrors.contactNumber} />
          <div className="flex justify-end">
            <Button id="profile-save-btn" type="submit" icon={Save} loading={savingProfile} disabled={loading}>{savingProfile ? "Saving…" : "Save Changes"}</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-primary mb-5 flex items-center gap-2"><KeyRound size={17} className="text-accent" /> Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
          <Input id="pw-current" label="Current Password" icon={Lock} type="password" name="currentPassword" autoComplete="current-password"
            value={pwForm.currentPassword} onChange={handlePwField} error={pwErrors.currentPassword} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="pw-new" label="New Password" icon={Lock} type="password" name="newPassword" autoComplete="new-password"
              value={pwForm.newPassword} onChange={handlePwField} error={pwErrors.newPassword} hint="At least 8 characters." />
            <Input id="pw-confirm" label="Confirm New Password" icon={Lock} type="password" name="confirmPassword" autoComplete="new-password"
              value={pwForm.confirmPassword} onChange={handlePwField} error={pwErrors.confirmPassword} />
          </div>
          <div className="flex justify-end">
            <Button id="password-save-btn" type="submit" variant="secondary" icon={KeyRound} loading={savingPassword}>{savingPassword ? "Updating…" : "Update Password"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );

  if (isStaff) {
    return (
      <div className="max-w-3xl">
        <PageHeader title="My Profile" subtitle="Manage your account information and password." />
        {content}
      </div>
    );
  }

  return (
    <div>
      <PublicHero title="Profile & Settings" subtitle="Manage your account information and password." />
      <div className={cx("max-w-3xl mx-auto px-4 sm:px-8 pb-16")}>{content}</div>
    </div>
  );
}

export default Profile;
