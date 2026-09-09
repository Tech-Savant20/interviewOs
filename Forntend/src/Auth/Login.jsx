// Login.jsx
import * as React from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import './Login.css';
import { useNavigate } from "react-router-dom";

import { useAuth } from '../AuthContext';
export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [form, setForm] = React.useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const { checkAuth } = useAuth();

  const handleChange = (e) => {
    setError('');
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  setError("");

  // Frontend validation
  if (!form.username.trim()) {
    setError("Username is required");
    return;
  }

  if (!form.password.trim()) {
    setError("Password is required");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(
      "https://interviewos.online/api/login",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      }
    );

    const res = await response.json();

    console.log("Login Response:", res);

    // Handle backend errors
    if (!response.ok) {
      setError(res.message || "Login failed");
      return;
    }

    // Successful login
    if (res.success) {
      await checkAuth();

      setForm({
        username: "",
        password: "",
      });

      
    } else {
      setError(res.message || "Login failed");
    }

    if (res.role === "interviewer") {
      navigate("/interviewer-dashboard", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  } catch (err) {
    console.error("Login Error:", err);

    setError(
      "Unable to connect to the server. Please try again later."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="login-page">

      {/* Left panel — branding */}
      <div className="login-left">
        <div className="brand-content">
          <div className="brand-logo">
            <LogIn size={28} color="#fff" />
          </div>
          <h2 className="brand-title">InterviewOS</h2>
          <p className="brand-desc">
            The all-in-one platform for technical interviews — live coding,
            video, and messaging in one room.
          </p>
          <div className="brand-stats">
            <div className="stat">
              <span className="stat-num">2k+</span>
              <span className="stat-label">Interviews done</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">98%</span>
              <span className="stat-label">Satisfaction rate</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">50+</span>
              <span className="stat-label">Companies</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="login-right">
        <div className="login-card">

          {/* Header */}
          <div className="login-header">
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Log in to your InterviewOS account</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="field-group">
              <label className="field-label" htmlFor="username">Username</label>
              <div className="input-wrapper">
                <input
                  className="field-input"
                  id="username"
                  name="username"
                  type="username"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="field-group">
              <div className="label-row">
                <label className="field-label" htmlFor="password">Password</label>
                <a className="forgot-link" href="/forgot-password">Forgot password?</a>
              </div>
              <div className="input-wrapper">
                <input
                  className="field-input has-icon"
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onMouseDown={e => e.preventDefault()}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              className={`login-btn ${loading ? 'loading' : ''}`}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>

            {/* Divider */}
            <div className="divider">
              <span className="divider-line" />
              <span className="divider-text">or continue with</span>
              <span className="divider-line" />
            </div>

            {/* Google OAuth */}
            <a className="google-btn" href="/auth/google">
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                width="18"
                height="18"
              />
              Log in with Google
            </a>

          </form>

          {/* Footer */}
          <p className="login-footer">
            Don't have an account? <a href="/signup">Sign up</a>
          </p>

        </div>
      </div>

    </div>
  );
}
