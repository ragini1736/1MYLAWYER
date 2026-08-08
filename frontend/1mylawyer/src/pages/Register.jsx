import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

// CSS lives in index.css under "LOGIN PAGE" section (ll- prefix).
// Same classes as Login — shared premium design system.

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match"); return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters"); return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/register", {
        name: formData.name, email: formData.email,
        phone: formData.phone, password: formData.password,
      });
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const FEATURES = [
    "Free account creation",
    "Verified legal advocates",
    "Secure case tracking",
    "Encrypted document vault",
    "24/7 legal assistance",
  ];

  return (
    <div className="ll-page">
      <div className="ll-card" style={{ maxWidth: 980 }}>

        {/* Left branding panel — desktop only */}
        <aside className="ll-left" aria-hidden="true">
          <div className="ll-left-inner">
            <div>
              <Link to="/" className="ll-logo">⚖ 1My<span className="llg">Lawyer</span></Link>
              <p className="ll-logo-sub">India's Premier Legal Platform</p>
            </div>
            <div className="ll-gold-rule" />
            <h2 className="ll-brand-h">
              Join Thousands of<br /><span className="llg">Satisfied Clients</span>
            </h2>
            <div>
              {FEATURES.map((f) => (
                <div className="ll-feat" key={f}>
                  <span className="ll-feat-dot" aria-hidden="true">✓</span>
                  <span className="ll-feat-text">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="ll-copy">© 2026 1MyLawyer. All rights reserved.</p>
        </aside>

        {/* Mobile brand strip */}
        <div className="ll-mob" aria-hidden="true">
          <Link to="/" className="ll-logo">⚖ 1My<span className="llg">Lawyer</span></Link>
          <p className="ll-logo-sub">India's Premier Legal Platform</p>
        </div>

        {/* Right form panel */}
        <main className="ll-right">
          <div className="ll-eyebrow" />
          <h1 className="ll-h1">Create Account</h1>
          <p className="ll-desc">Join 1MyLawyer for expert legal consultation</p>

          <form onSubmit={handleSubmit} noValidate>

            {/* Name + Phone row */}
            <div className="ll-two-col">
              <div>
                <label htmlFor="reg-name" className="ll-label">Full Name</label>
                <input id="reg-name" type="text" name="name" className="ll-input"
                  value={formData.name} onChange={handleChange}
                  placeholder="Your full name" required autoFocus autoComplete="name" />
              </div>
              <div>
                <label htmlFor="reg-phone" className="ll-label">Phone Number</label>
                <input id="reg-phone" type="text" name="phone" className="ll-input"
                  value={formData.phone} onChange={handleChange}
                  placeholder="+91 98765 43210" required autoComplete="tel" />
              </div>
            </div>

            {/* Email */}
            <div className="ll-field">
              <label htmlFor="reg-email" className="ll-label">Email Address</label>
              <input id="reg-email" type="email" name="email" className="ll-input"
                value={formData.email} onChange={handleChange}
                placeholder="your@email.com" required autoComplete="email" />
            </div>

            {/* Password + Confirm row */}
            <div className="ll-two-col" style={{ marginBottom: "1.75rem" }}>
              <div>
                <label htmlFor="reg-password" className="ll-label">Password</label>
                <input id="reg-password" type="password" name="password" className="ll-input"
                  value={formData.password} onChange={handleChange}
                  placeholder="Min 6 characters" required autoComplete="new-password" />
              </div>
              <div>
                <label htmlFor="reg-confirm" className="ll-label">Confirm Password</label>
                <input id="reg-confirm" type="password" name="confirmPassword" className="ll-input"
                  value={formData.confirmPassword} onChange={handleChange}
                  placeholder="Re-enter password" required autoComplete="new-password" />
              </div>
            </div>

            <button type="submit" className="ll-btn" disabled={loading}
              aria-label={loading ? "Creating account, please wait" : "Create your account"}>
              {loading
                ? <><span className="ll-spin" aria-hidden="true" />Creating Account…</>
                : "Create My Account"}
            </button>

          </form>

          <div className="ll-foot">
            Already have an account?{" "}
            <Link to="/login">Sign In</Link>
          </div>
        </main>

      </div>
    </div>
  );
}

export default Register;
