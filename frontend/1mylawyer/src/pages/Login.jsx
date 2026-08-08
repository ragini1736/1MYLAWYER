import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

/* ─────────────────────────────────────────────────────────────────
   Login.jsx — Premium Corporate Law Firm Auth Page
   
   Layout:
     Desktop (≥992px): two-column — navy branding left, form right
     Tablet  (≥576px): one column — compact centered card
     Mobile  (<576px): branding strip above form
   
   UI decisions:
     • double-ring fix: outline:none + single box-shadow on focus
     • input height 54px for luxury feel
     • card max-width 940px keeps it readable on wide screens
     • navy left panel has pattern overlay + animated gold orbs
     • button has press-down :active micro-interaction
   ───────────────────────────────────────────────────────────────── */

/* All styles are scoped to this file via the ll- prefix (Login Local).
   They are injected once via a <style> tag so they never clash with
   global index.css — and are automatically removed when component unmounts. */
const STYLES = `
  /* ── Page wrapper ──────────────────────────────────────────── */
  .ll-page {
    min-height: 100dvh;
    min-height: 100vh; /* fallback for older browsers */
    
    background: linear-gradient(135deg, #060e1e 0%, #0d1f3c 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem 1rem;
  }

  


  /* ── Outer card (the two-column container) ─────────────────── */
  .ll-card {
    width: 100%;
    max-width: 940px;
    border-radius: 24px;
    overflow: hidden;
    box-shadow:
      0 32px 80px rgba(6,14,30,.55),
      0 8px 24px rgba(6,14,30,.35);
    display: flex;
    flex-direction: row; /* overridden to column on mobile */
  }

  /* ── Left branding panel ───────────────────────────────────── */
  .ll-brand {
    flex: 0 0 380px;
    background: linear-gradient(160deg, #0d1f3c 0%, #060e1e 100%);
    padding: 3rem 2.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }

  /* Decorative gold orbs — pure CSS, no images */
  .ll-brand::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 280px; height: 280px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,.1) 0%, transparent 70%);
    pointer-events: none;
  }
  .ll-brand::after {
    content: '';
    position: absolute;
    bottom: -60px; left: -60px;
    width: 220px; height: 220px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .ll-brand-content { position: relative; z-index: 1; }

  .ll-logo {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.75rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -.01em;
    text-decoration: none;
    display: block;
    margin-bottom: .4rem;
  }
  .ll-logo .gold { color: #c9a84c; }

  .ll-logo-sub {
    font-size: .8rem;
    color: rgba(255,255,255,.45);
    letter-spacing: .08em;
    text-transform: uppercase;
    font-weight: 500;
  }

  .ll-divider {
    width: 40px; height: 2px;
    background: linear-gradient(90deg, #c9a84c, transparent);
    border-radius: 1px;
    margin: 2rem 0 1.5rem;
  }

  .ll-headline {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.75rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.25;
    margin-bottom: 1.5rem;
  }
  .ll-headline .gold { color: #d4af37; }

  .ll-feature {
    display: flex;
    align-items: flex-start;
    gap: .75rem;
    margin-bottom: .85rem;
  }
  .ll-feature-icon {
    width: 22px; height: 22px;
    border-radius: 50%;
    background: rgba(201,168,76,.18);
    border: 1px solid rgba(201,168,76,.35);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    font-size: .7rem;
    color: #c9a84c;
    font-weight: 800;
    margin-top: .1rem;
  }
  .ll-feature span {
    font-size: .875rem;
    color: rgba(255,255,255,.72);
    line-height: 1.5;
  }

  .ll-copyright {
    font-size: .75rem;
    color: rgba(255,255,255,.25);
    position: relative;
    z-index: 1;
    margin-top: 2rem;
  }

  /* ── Mobile brand strip ────────────────────────────────────── */
  .ll-brand-mobile {
    display: none; /* shown via media query below */
    background: linear-gradient(135deg, #0d1f3c, #060e1e);
    padding: 1.5rem 1.75rem;
    position: relative;
    overflow: hidden;
  }
  .ll-brand-mobile::after {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 100% at 100% 50%, rgba(201,168,76,.07), transparent);
    pointer-events: none;
  }
  .ll-brand-mobile .ll-logo {
    font-size: 1.4rem;
    margin-bottom: .2rem;
  }
  .ll-brand-mobile .ll-logo-sub { font-size: .72rem; }

  /* ── Right form panel ──────────────────────────────────────── */
  .ll-form-panel {
    flex: 1;
    background: #ffffff;
    padding: 3rem 2.75rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* ── Form heading block ────────────────────────────────────── */
  .ll-form-eyebrow {
    width: 40px; height: 3px;
    background: #c9a84c;
    border-radius: 2px;
    margin-bottom: .9rem;
  }

  .ll-form-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.9rem;
    font-weight: 800;
    color: #0a1628;
    margin: 0 0 .35rem;
    line-height: 1.15;
  }

  .ll-form-subtitle {
    font-size: .9rem;
    color: #6b7280;
    margin: 0 0 2rem;
    line-height: 1.55;
  }

  /* ── Labels ─────────────────────────────────────────────────── */
  .ll-label {
    display: block;
    font-size: .78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: #0d1f3c;
    margin-bottom: .45rem;
  }

  /* ── Input fields — single focus ring fix ───────────────────── */
  /*
    ROOT CAUSE of the double ring:
      1. Bootstrap sets box-shadow on .form-control:focus
      2. The browser sets its native outline on :focus
    Both fire simultaneously = two rings.
    
    FIX: outline: 0 + outline: none removes the browser native ring.
    We then control the entire focus appearance with a single box-shadow.
  */
  .ll-input {
    width: 100%;
    height: 54px;           /* luxury tall input */
    padding: 0 1rem;
    font-size: .95rem;
    font-family: 'Inter', -apple-system, sans-serif;
    color: #111827;
    background: #f8f9fc;
    border: 1.5px solid #e2e6ed;
    border-radius: 10px;
    transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
    /* Remove ALL browser-native outlines — both :focus and :focus-visible */
    outline: 0;
    -webkit-appearance: none;
    appearance: none;
  }

  .ll-input::placeholder {
    color: #9ca3af;
    font-size: .9rem;
  }

  .ll-input:hover {
    border-color: #cbd0db;
    background: #ffffff;
  }

  /* THE single, authoritative focus state — no outline, one shadow */
  .ll-input:focus,
  .ll-input:focus-visible {
    outline: 0 !important;           /* kills browser native ring */
    outline-offset: 0 !important;    /* kills any residual offset */
    border-color: #c9a84c !important;
    background: #ffffff !important;
    /* Single elegant gold glow — NOT a doubled ring */
    box-shadow: 0 0 0 3.5px rgba(201,168,76,.22) !important;
  }

  /* ── Field group ────────────────────────────────────────────── */
  .ll-field { margin-bottom: 1.25rem; }
  .ll-field:last-of-type { margin-bottom: 1.75rem; }

  /* ── Submit button ──────────────────────────────────────────── */
  .ll-btn {
    width: 100%;
    height: 52px;
    background: linear-gradient(135deg, #0d1f3c 0%, #0a1628 100%);
    color: #ffffff;
    font-family: 'Inter', sans-serif;
    font-size: .88rem;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
    box-shadow:
      0 4px 16px rgba(6,14,30,.3),
      0 1px 4px rgba(6,14,30,.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .6rem;
    position: relative;
    overflow: hidden;
    margin-bottom: 1.75rem;
  }

  /* Gold shimmer on hover */
  .ll-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(201,168,76,.12) 0%, transparent 60%);
    opacity: 0;
    transition: opacity .25s ease;
  }
  .ll-btn:hover::before { opacity: 1; }

  .ll-btn:hover {
    transform: translateY(-2px);
    box-shadow:
      0 8px 28px rgba(6,14,30,.4),
      0 2px 8px rgba(6,14,30,.25);
  }

  /* Press-down micro-interaction */
  .ll-btn:active {
    transform: translateY(1px) scale(.99);
    box-shadow:
      0 2px 8px rgba(6,14,30,.25),
      0 1px 3px rgba(6,14,30,.15);
    transition: transform .08s ease, box-shadow .08s ease;
  }

  .ll-btn:disabled {
    opacity: .65;
    cursor: not-allowed;
    transform: none !important;
  }
  .ll-btn:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 3px;
  }

  /* ── Spinner inside button ──────────────────────────────────── */
  .ll-btn-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: ll-spin .65s linear infinite;
    flex-shrink: 0;
  }
  @keyframes ll-spin { to { transform: rotate(360deg); } }

  /* ── Footer link ────────────────────────────────────────────── */
  .ll-footer-line {
    border-top: 1px solid #e2e6ed;
    padding-top: 1.5rem;
    text-align: center;
    font-size: .88rem;
    color: #6b7280;
  }
  .ll-footer-link {
    color: #a07830;
    font-weight: 700;
    text-decoration: none;
    transition: color .2s ease;
  }
  .ll-footer-link:hover { color: #c9a84c; text-decoration: underline; text-underline-offset: 3px; }

  /* ── Responsive ─────────────────────────────────────────────── */

  /* Tablet: narrow the form panel */
  @media (max-width: 991px) {
    .ll-brand { display: none; }        /* hide full left panel */
    .ll-brand-mobile { display: block; } /* show compact strip */
    .ll-card { flex-direction: column; max-width: 560px; }
    .ll-form-panel { padding: 2.5rem 2rem; }
  }

  @media (max-width: 575px) {
    .ll-page { padding: 0; align-items: flex-start; }
    .ll-card { border-radius: 0; box-shadow: none; min-height: 100dvh; min-height: 100vh; }
    .ll-brand-mobile { padding: 1.25rem 1.25rem; }
    .ll-form-panel { padding: 2rem 1.25rem; }
    .ll-form-title { font-size: 1.6rem; }
    .ll-input { height: 50px; }
    .ll-btn { height: 50px; }
  }
`;

/* Inject styles once when component mounts, clean up on unmount */
function useInjectStyle(id, css) {
  useEffect(() => {
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id;
      tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => {
      const tag = document.getElementById(id);
      if (tag) tag.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

function Login() {
  const navigate   = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading]   = useState(false);

  useInjectStyle("ll-login-styles", STYLES);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", formData);
      console.log("Response:", res.data);
console.log("User:", res.data.user);
console.log("Role:", res.data.user.role);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.dispatchEvent(new Event("authChange"));
      toast.success(`Welcome back, ${res.data.user.name.split(" ")[0]}!`);
      navigate("/dashboard");
      if (res.data.user.role === "admin") {
  navigate("/admin/dashboard",{replace:true});
} else {
  navigate("/dashboard",{replace:true});
}


    

 } catch (error) {
  const message =
    error.response?.data?.message ||
    error.response?.data?.error ||
    "Login failed";

  toast.error(message);

    } finally {
      setLoading(false);
    
  }
};

  const features = [
    "Track your active cases",
    "Manage appointments",
    "Secure document vault",
    "Real-time notifications",
  ];

  return (
    <div className="ll-page">

      {/* ─── Outer card ─────────────────────────────────────── */}
      <div className="ll-card">

        {/* ─── Left panel — desktop only ──────────────────── */}
        <aside className="ll-brand" aria-hidden="true">
          <div className="ll-brand-content">
            {/* Logo */}
            <div>
              <Link to="/" className="ll-logo">
                ⚖ 1My<span className="gold">Lawyer</span>
              </Link>
              <p className="ll-logo-sub">India's Premier Legal Platform</p>
            </div>

            {/* Divider */}
            <div className="ll-divider" />

            {/* Headline */}
            <h2 className="ll-headline">
              Welcome back to<br />
              your <span className="gold">Legal Dashboard</span>
            </h2>

            {/* Features */}
            <div>
              {features.map((f) => (
                <div className="ll-feature" key={f}>
                  <span className="ll-feature-icon">✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <p className="ll-copyright">© 2026 1MyLawyer. All rights reserved.</p>
        </aside>

        {/* ─── Mobile brand strip ─────────────────────────── */}
        <div className="ll-brand-mobile" aria-hidden="true">
          <Link to="/" className="ll-logo">
            ⚖ 1My<span className="gold">Lawyer</span>
          </Link>
          <p className="ll-logo-sub">India's Premier Legal Platform</p>
        </div>

        {/* ─── Right panel — form ──────────────────────────── */}
        <main className="ll-form-panel">

          {/* Heading */}
          <div className="ll-form-eyebrow" />
          <h1 className="ll-form-title">Sign In</h1>
          <p className="ll-form-subtitle">
            Enter your credentials to access your account
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>

            <div className="ll-field">
              <label htmlFor="login-email" className="ll-label">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                className="ll-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                autoFocus
                autoComplete="email"
                aria-label="Email address"
              />
            </div>

            <div className="ll-field">
              <label htmlFor="login-password" className="ll-label">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                name="password"
                className="ll-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                aria-label="Password"
              />
            </div>

            <button
              type="submit"
              className="ll-btn"
              disabled={loading}
              aria-label={loading ? "Signing in, please wait" : "Sign in to your account"}
            >
              {loading ? (
                <>
                  <span className="ll-btn-spinner" />
                  Signing in…
                </>
              ) : (
                "Sign In to Your Account"
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="ll-footer-line">
            Don't have an account?{" "}
            <Link to="/register" className="ll-footer-link">
              Create Account
            </Link>
          </div>

        </main>

      </div>
    </div>
  );
}

export default Login;
