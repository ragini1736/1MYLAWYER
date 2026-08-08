/**
 * AdminSidebar.jsx
 * ─────────────────
 * Desktop: fixed left sidebar (260px).
 * Tablet:  collapsible via Bootstrap offcanvas.
 * Mobile:  offcanvas drawer (d-lg-none trigger in AdminNavbar).
 *
 * Receives: onLogout, collapsed (tablet toggle state)
 */
import { NavLink, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/admin",               label: "Dashboard",     icon: "📊", end: true },
  { to: "/admin/users",         label: "Users",         icon: "👥" },
  { to: "/admin/advocates",     label: "Advocates",     icon: "⚖️"  },
  { to: "/admin/cases",         label: "Cases",         icon: "📁" },
  { to: "/admin/appointments",  label: "Appointments",  icon: "📅" },
  { to: "/admin/payments",      label: "Payments",      icon: "💳" },
  { to: "/admin/legal-library", label: "Legal Library", icon: "📚" },
  { to: "/admin/documents",     label: "Documents",     icon: "🗂️"  },
  { to: "/admin/notifications", label: "Notifications", icon: "🔔" },
  { to: "/admin/settings",      label: "Settings",      icon: "⚙️"  },
];

/* ── shared item styles ── */
const itemBase = {
  display: "flex",
  alignItems: "center",
  gap: ".7rem",
  padding: ".65rem 1rem",
  borderRadius: 10,
  fontSize: ".88rem",
  fontWeight: 500,
  textDecoration: "none",
  transition: "background .18s ease, color .18s ease",
  color: "rgba(255,255,255,.72)",
  border: "none",
  background: "transparent",
  width: "100%",
  cursor: "pointer",
};

const activeStyle = {
  background: "rgba(201,168,76,.18)",
  color: "#e8c96d",
  fontWeight: 600,
};

function SidebarContent({ onLogout, onClose }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--navy-900)",
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "1.4rem 1.25rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.2rem",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            1My<span style={{ color: "var(--gold-500)" }}>Lawyer</span>
          </div>
          <div
            style={{
              fontSize: ".68rem",
              color: "rgba(255,255,255,.35)",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            Admin Panel
          </div>
        </div>
        {/* Close button — visible only in offcanvas */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,.08)",
              border: "none",
              color: "rgba(255,255,255,.6)",
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "1rem",
            }}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: "auto", padding: ".75rem .75rem" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onClose}
                style={({ isActive }) => ({
                  ...itemBase,
                  ...(isActive ? activeStyle : {}),
                })}
              >
                <span style={{ fontSize: "1rem", width: 22, textAlign: "center", flexShrink: 0 }}>
                  {icon}
                </span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div
        style={{
          padding: ".75rem",
          borderTop: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <button
          onClick={onLogout}
          style={{
            ...itemBase,
            color: "#fca5a5",
            justifyContent: "flex-start",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,.12)";
            e.currentTarget.style.color = "#f87171";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#fca5a5";
          }}
        >
          <span style={{ fontSize: "1rem", width: 22, textAlign: "center", flexShrink: 0 }}>🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
}

/* ── Desktop sidebar (lg+) ── */
export function AdminSidebarDesktop({ onLogout }) {
  return (
    <div
      className="d-none d-lg-flex flex-column"
      style={{
        width: 240,
        minWidth: 240,
        height: "100vh",
        position: "sticky",
        top: 0,
        flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <SidebarContent onLogout={onLogout} />
    </div>
  );
}

/* ── Mobile/tablet offcanvas sidebar ── */
export function AdminSidebarOffcanvas({ show, onClose, onLogout }) {
  if (!show) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(6,14,30,.6)",
          zIndex: 1040,
          backdropFilter: "blur(2px)",
        }}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 260,
          height: "100vh",
          zIndex: 1045,
          animation: "lm-fadeIn .2s ease both",
        }}
      >
        <SidebarContent onLogout={onLogout} onClose={onClose} />
      </div>
    </>
  );
}
