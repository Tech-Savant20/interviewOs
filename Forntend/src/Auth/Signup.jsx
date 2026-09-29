import { API_URL } from "../config.js";
// Signup.jsx
import { useState } from 'react';
import { Eye, EyeOff, Users } from 'lucide-react';
import './Signup.css';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });

  const handleChange = (e) => {
    setError('');   // clear error on every keystroke
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const res = await response.json();

      console.log(res);

      // ❌ API returned error
      if (!response.ok || res.success === false) {
        setError(res.message || "Signup failed");
        return;
      }

      // ✅ Success
      setSuccess(res.message);

      alert("Signup successful! Please verify your email with the OTP sent to you.");

      // Store email before clearing form
      const userEmail = form.email;

      // Clear form
      setForm({
        username: "",
        email: "",
        password: "",
        role: "user",
      });

      // Navigate to OTP page
      navigate("/otp-verification", {
        state: { email: userEmail },
      });

    } catch (err) {
      console.error(err);

      // ❌ Network/server error
      setError("Cannot connect to server. Please try again.");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">

        {/* Header */}
        <div className="signup-header">
          <div className="signup-logo">
            <Users size={24} color="#fa5252" />
          </div>
          <h1 className="signup-title">Create your account</h1>
          <p className="signup-subtitle">Join InterviewOS to start hiring smarter</p>
        </div>

        {/* ✅ FIX 4: error/success banners with proper CSS classes */}
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success} <a href="/login">Log in</a></div>}

        {/* Form */}
        <form className="signup-form" onSubmit={handleSubmit} noValidate>

          {/* Username */}
          <div className="field-group">
            <label className="field-label" htmlFor="username">Username</label>
            <div className="input-wrapper">
              <input
                className="field-input"
                id="username"
                name="username"
                type="text"
                placeholder="e.g. john_doe"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="field-group">
            <label className="field-label" htmlFor="email">Email</label>
            <div className="input-wrapper">
              <input
                className={`field-input ${error && error.toLowerCase().includes('email') ? 'input-error' : ''}`}
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Role */}
          <div className="field-group">
            <label className="field-label" htmlFor="role">I am signing up as</label>
            <div className="input-wrapper">
              <select
                className="field-input"
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="user">Candidate</option>
                <option value="interviewer">Interviewer</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="field-group">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                className="field-input has-icon"
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
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
          {/* ✅ FIX 5: disable button while loading or after success */}
          <button
            className={`signup-btn ${loading ? 'loading' : ''}`}
            type="submit"
            disabled={loading || !!success}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          {/* Divider */}
          <div className="divider">
            <span className="divider-line" />
            <span className="divider-text">or continue with</span>
            <span className="divider-line" />
          </div>

          {/* Google OAuth */}
          <a className="google-btn" href={`${API_URL}/auth/google`}>
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              width="18"
              height="18"
            />
            Sign up with Google
          </a>

        </form>

        {/* Footer */}
        <p className="signup-footer">
          Already have an account? <a href="/login">Log in</a>
        </p>

      </div>
    </div>
  );
}