import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2, LogIn } from "lucide-react";
import { loginUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../utils/errors";
import Brand from "../components/Brand";

function Login() {
  const { login } = useAuth();
  const toast      = useToast();
  const navigate    = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading,  setLoading]  = useState(false);

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginUser(formData);
      // data: { token, userId, role, firstName, lastName }
      login(data.token, data.userId, data.role, data.firstName, data.lastName);
      toast.success("Welcome back! Redirecting…");
      setTimeout(() => navigate("/promotions"), 700);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Invalid email or password."));
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <Brand size="lg" />
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your SmartNest account</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="login-email" className="form-input has-icon"
                name="email" type="email" placeholder="you@example.com"
                value={formData.email} onChange={handleChange} required autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="login-password" className="form-input has-icon"
                name="password" type="password" placeholder="••••••••"
                value={formData.password} onChange={handleChange} required
              />
            </div>
          </div>

          <button
            id="login-submit-btn" type="submit"
            className="btn btn-primary btn-lg btn-full" disabled={loading}
          >
            {loading
              ? <><Loader2 size={17} className="icon-spin" /> Signing in…</>
              : <><LogIn size={16} /> Sign In</>
            }
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
