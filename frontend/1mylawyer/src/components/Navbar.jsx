/**
 * Navbar.jsx
 *
 * Desktop ≥992px  — pure flexbox, zero Bootstrap collapse, zero hamburger.
 *   [⚖ 1MyLawyer] [Home][Services][Advocates][Legal Library][Contact][My Cases][Documents]  [Sign In][Get Started]
 *   OR with logged-in user:
 *   [⚖ 1MyLawyer] [Home]…[Documents]  [● radhika ▾]
 *
 * Mobile <992px  — hamburger button + React-controlled slide-down drawer.
 *   No Bootstrap collapse. No navbar-toggler. No .collapse class.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

const NAV_LINKS = [
  { to: "/",          label: "Home"          },
  { to: "/service",   label: "Services"      },
  { to: "/advocates", label: "Advocates"     },
  { to: "/library",   label: "Legal Library" },
  { to: "/contact",   label: "Contact"       },
  { to: "/document",  label: "Documents"     },
];

const DROPDOWN_ITEMS = [
  { to: "/dashboard",       label: "Dashboard",         icon: "🏠" },
  { to: "/profile",         label: "My Profile",        icon: "👤" },
  { to: "/my-appointments", label: "My Appointments",   icon: "📅" },
  { to: "/cases",           label: "My Cases",          icon: "⚖️"  },
  { to: "/notifications",   label: "Notifications",     icon: "🔔" },
  { to: "/payment",         label: "Payment & Billing", icon: "💳" },
];

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dropRef   = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user,       setUser      ] = useState(null);
  const [scrolled,   setScrolled  ] = useState(false);
  const [dropOpen,   setDropOpen  ] = useState(false);   // profile dropdown
  const [menuOpen,   setMenuOpen  ] = useState(false);   // mobile drawer

  /* ── Auth sync ──────────────────────────────────────────── */
  const sync = useCallback(() => {
    const token = localStorage.getItem("token");
    const data  = localStorage.getItem("user");
    setIsLoggedIn(!!token);
    setUser(data ? JSON.parse(data) : null);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("authChange", sync);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("authChange", sync);
      window.removeEventListener("scroll", onScroll);
    };
  }, [sync]);

  /* ── Close profile dropdown on outside click ────────────── */
  useEffect(() => {
    if (!dropOpen) return;
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [dropOpen]);

  /* ── Close everything on route change ───────────────────── */
  useEffect(() => {
    setDropOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  /* ── Logout ─────────────────────────────────────────────── */
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    setDropOpen(false);
    setMenuOpen(false);
    window.dispatchEvent(new Event("authChange"));
    navigate("/login");
  }, [navigate]);

  const isActive = (p) => location.pathname === p;
  const avatar   = user?.name?.charAt(0).toUpperCase() ?? "U";
  const uname    = user?.name?.split(" ")[0] ?? "Account";

  /* ── Auth block — shared between desktop bar and mobile drawer ── */
  const AuthBlock = () => !isLoggedIn ? (
    <div className="nb-auth-btns">
      <Link to="/login"    className="nb-btn-in">Sign In</Link>
      <Link to="/register" className="nb-btn-go">Get Started</Link>
    </div>
  ) : (
    <div className="nb-drop" ref={dropRef}>
      <button
        className={`nb-profile-btn${dropOpen ? " nb-profile-btn--open" : ""}`}
        onClick={() => setDropOpen((v) => !v)}
        aria-expanded={dropOpen}
        aria-haspopup="true"
        aria-controls="nb-profile-panel"
        type="button"
      >
        <span className="nb-avatar">{avatar}</span>
        <span className="nb-uname">{uname}</span>
        <span className="nb-chevron" style={{ transform: dropOpen ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {dropOpen && (
        <div className="nb-panel" id="nb-profile-panel" role="menu">
          <div className="nb-panel__head">
            <span className="nb-avatar nb-avatar--lg">{avatar}</span>
            <div>
              <p className="nb-panel__name">{user?.name}</p>
              <p className="nb-panel__email">{user?.email}</p>
            </div>
          </div>
          <div className="nb-panel__sep" />
          <ul className="nb-panel__list">
            {DROPDOWN_ITEMS.map(({ to, label, icon }) => (
              <li key={to}>
                <Link to={to} className={`nb-panel__item${isActive(to) ? " nb-panel__item--active" : ""}`}>
                  <span className="nb-panel__icon">{icon}</span>{label}
                </Link>
              </li>
            ))}
            {user?.role === "admin" && (
              <li>
                <Link to="/admin" className="nb-panel__item">
                  <span className="nb-panel__icon">🛡️</span>Admin Dashboard
                </Link>
              </li>
            )}
          </ul>
          <div className="nb-panel__sep" />
          <div className="nb-panel__foot">
            <button className="nb-panel__item nb-panel__item--out" onClick={handleLogout} type="button">
              <span className="nb-panel__icon">🚪</span>Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );

  /* ══════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── NAVBAR BAR ────────────────────────────────────── */}
      <header className={`nb-bar${scrolled ? " nb-bar--scrolled" : ""}`} role="banner">
        <div className="nb-inner">

          {/* Logo */}
          <Link className="nb-brand" to="/">
            ⚖&nbsp;1My<span className="nb-accent">Lawyer</span>
          </Link>

          {/* Wrapper for desktop-only nav and auth */}
          <div className="nb-desktop-items">
            {/* ── DESKTOP NAV — always visible, no collapse ── */}
            <nav className="nb-desktop-nav" aria-label="Main navigation">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`nb-link${isActive(to) ? " nb-link--active" : ""}`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* ── DESKTOP AUTH — always visible ── */}
            <div className="nb-desktop-auth">
              <AuthBlock />
            </div>
          </div>

          {/* ── MOBILE ONLY (Hamburger) ─────────────────────────── */}
          <div className="nb-mobile-only">
            <button
              className="nb-hamburger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="Open menu"
              type="button"
            >
              <span className={`nb-ham-icon${menuOpen ? " nb-ham-icon--open" : ""}`}>
                <span /><span /><span />
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* ── MOBILE DRAWER ─────────────────────────────────── */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div className="nb-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />

          {/* Drawer */}
          <nav className="nb-drawer" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`nb-drawer-link${isActive(to) ? " nb-drawer-link--active" : ""}`}
              >
                {label}
              </Link>
            ))}
            <div className="nb-drawer-sep" />
            <AuthBlock />
          </nav>
        </>
      )}
    </>
  );
}
