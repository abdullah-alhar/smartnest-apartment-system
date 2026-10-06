import { useState } from "react";
import { User, Mail, Lock, Shield, UserPlus } from "lucide-react";
import { createStaff } from "../../api/adminApi";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../utils/errors";
import { ROLE_LABEL } from "../../utils/roles";
import PhoneInput from "../PhoneInput";
import { Button, Input, Modal, Select } from "../ui";

const STAFF_ROLES = ["ADMIN", "SALES_STAFF", "CRO", "OPERATIONS_MANAGER", "MARKETING_EXECUTIVE"];

function CreateStaffModal({ onClose }) {
  const toast = useToast();

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", contactNumber: "", role: "" });
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
    if (digits.length > 0 && digits.length !== 9) errors.contactNumber = "Enter exactly 9 digits after +94.";
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
    <Modal onClose={onClose} size="lg" icon={UserPlus} title="Create Staff Account" description="Give a new staff member a role and system access."
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button id="cs-submit-btn" type="submit" form="staff-form" icon={UserPlus} loading={loading}>Create Staff Account</Button>
        </>
      )}>
      <form id="staff-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="cs-firstName" label="First Name" icon={User} name="firstName" placeholder="John" value={form.firstName} onChange={handle} required autoFocus />
          <Input id="cs-lastName" label="Last Name" name="lastName" placeholder="Doe" value={form.lastName} onChange={handle} required />
        </div>
        <Input id="cs-email" label="Email Address" icon={Mail} name="email" type="email" placeholder="staff@smartnest.com" value={form.email} onChange={handle} required />
        <Input id="cs-password" label="Temporary Password" icon={Lock} name="password" type="password" placeholder="Set a strong temporary password"
          value={form.password} onChange={handle} required hint="The staff member should change this on first sign-in." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PhoneInput id="cs-contact" value={form.contactNumber} onChange={handlePhoneChange} error={fieldErrors.contactNumber} />
          <Select id="cs-role" label="Role" icon={Shield} name="role" value={form.role} onChange={handle} required hint="Admins can assign any role, including Admin.">
            <option value="" disabled>Select a role…</option>
            {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </Select>
        </div>
      </form>
    </Modal>
  );
}

export default CreateStaffModal;
