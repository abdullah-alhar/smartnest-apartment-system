import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Info } from "lucide-react";
import { loginUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../utils/errors";
import AuthLayout from "../components/AuthLayout";
import { Alert, Button, Input } from "../components/ui";

function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from || "/";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(formData);
      login(data.token, data.userId, data.role, data.firstName, data.lastName);
      toast.success(`Welcome back, ${data.firstName || "there"}! You're signed in.`);
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Invalid email or password."));
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to access your account, reservations and site visits.">
      {error && <Alert className="mb-5">{error}</Alert>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input id="login-email" label="Email Address" icon={Mail} name="email" type="email" placeholder="you@example.com"
          value={formData.email} onChange={handleChange} required autoFocus autoComplete="email" />
        <Input id="login-password" label="Password" icon={Lock} name="password" type="password" placeholder="••••••••"
          value={formData.password} onChange={handleChange} required autoComplete="current-password" />
        <Button id="login-submit-btn" type="submit" size="lg" fullWidth loading={loading} icon={LogIn}>
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-grey-200" /></div>
        <div className="relative flex justify-center"><span className="bg-off-white px-4 text-xs text-grey-400">or</span></div>
      </div>

      <p className="text-center text-sm text-grey-400">
        Don't have an account?{" "}
        <Link to="/register" state={location.state} className="text-accent-dark font-medium hover:underline">Create one</Link>
      </p>

      <p className="mt-8 pt-6 border-t border-grey-200 text-xs text-grey-400 flex items-start gap-2">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        Staff members sign in here too — you'll be taken straight to the staff portal for your role.
      </p>
    </AuthLayout>
  );
}

export default Login;
