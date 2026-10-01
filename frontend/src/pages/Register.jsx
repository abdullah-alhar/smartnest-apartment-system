import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Mail, Lock, CreditCard, MapPin, UserPlus } from "lucide-react";
import { registerUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../utils/errors";
import AuthLayout from "../components/AuthLayout";
import PhoneInput from "../components/PhoneInput";
import { Button, Input } from "../components/ui";

const NIC_PATTERN = /^([0-9]{9}[vVxX]|[0-9]{12})$/;

function Register() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from || "/";

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "",
    contactNumber: "", city: "", postalCode: "", street: "", nic: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handlePhoneChange = (value) => {
    setFormData((p) => ({ ...p, contactNumber: value }));
    setFieldErrors((p) => ({ ...p, contactNumber: undefined }));
  };

  const handleNicChange = (e) => {
    setFormData((p) => ({ ...p, nic: e.target.value.toUpperCase() }));
    setFieldErrors((p) => ({ ...p, nic: undefined }));
  };

  const validate = () => {
    const errors = {};
    const digits = formData.contactNumber.replace(/^\+94/, "");
    if (digits.length !== 9) errors.contactNumber = "Contact number is required (9 digits after +94).";
    if (!formData.nic.trim()) errors.nic = "NIC is required.";
    else if (!NIC_PATTERN.test(formData.nic.trim())) errors.nic = "Enter a valid NIC (old: 9 digits + V/X, new: 12 digits).";
    if (!formData.city.trim()) errors.city = "City is required.";
    if (!formData.street.trim()) errors.street = "Street address is required.";
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
      login(data.token, data.userId, data.role ?? "CUSTOMER", data.firstName, data.lastName);
      toast.success(`Welcome to SmartNest, ${data.firstName || formData.firstName}! Your account is ready.`);
      navigate(returnTo, { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err, "Registration failed. Please check your details."));
      setLoading(false);
    }
  };

  return (
    <AuthLayout wide title="Create Your Account" subtitle="Join SmartNest to send inquiries, book site visits and reserve online."
      quote="“From first viewing to reservation — all in one place.”">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="reg-firstName" label="First Name" icon={User} name="firstName" placeholder="John"
            value={formData.firstName} onChange={handleChange} required autoFocus />
          <Input id="reg-lastName" label="Last Name" name="lastName" placeholder="Doe"
            value={formData.lastName} onChange={handleChange} required />
        </div>
        <Input id="reg-email" label="Email Address" icon={Mail} name="email" type="email" placeholder="you@example.com"
          value={formData.email} onChange={handleChange} required autoComplete="email" />
        <Input id="reg-password" label="Password" icon={Lock} name="password" type="password" placeholder="Create a strong password"
          value={formData.password} onChange={handleChange} required autoComplete="new-password" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PhoneInput id="reg-contactNumber" value={formData.contactNumber} onChange={handlePhoneChange} error={fieldErrors.contactNumber} required />
          <Input id="reg-nic" label="NIC" icon={CreditCard} name="nic" placeholder="851234567V or 199912345678"
            value={formData.nic} onChange={handleNicChange} error={fieldErrors.nic} required />
        </div>
        <Input id="reg-street" label="Street Address" icon={MapPin} name="street" placeholder="123 Main Street"
          value={formData.street} onChange={handleChange} error={fieldErrors.street} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="reg-city" label="City" name="city" placeholder="Colombo"
            value={formData.city} onChange={handleChange} error={fieldErrors.city} required />
          <Input id="reg-postalCode" label="Postal Code" name="postalCode" placeholder="10000"
            value={formData.postalCode} onChange={handleChange} error={fieldErrors.postalCode} required />
        </div>
        <Button id="register-submit-btn" type="submit" size="lg" fullWidth loading={loading} icon={UserPlus}>
          {loading ? "Creating Account…" : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-sm text-grey-400 mt-6">
        Already have an account?{" "}
        <Link to="/login" state={location.state} className="text-accent-dark font-medium hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

export default Register;
