/**
 * AdminNavbar.jsx
 * ────────────────
 * Top bar for the admin panel.
 * Left  : hamburger (mobile/tablet) + page title
 * Right : search, notification bell, admin avatar + name
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminNavbar({ onMenuToggle, title = "Admin Panel" }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dropOpen, setDropOpen] = useState(false);

  const raw  = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;
  const initial = user?.name?.charAt(0).toUpperCase() ?? "A";
  const name    = user?.name ?? "Admin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authChange"));
    navigate("/login");
  };

  return (
    <header
      style={{
        height: 64,
        background: "#fff",
        borderBottom: "1px solid var(--gray-200)",
        display: "flex",
        alignItems: "center",
        padding: "0 1.5rem",
        gap: "1rem",
        position: "sticky",
        top: 0,
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* Hamburger — mobile/tablet only */}
      <button
        className="d-lg-none"
        onClick={onMenuToggle}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 6,
          borderRadius: 8,
          color: "var(--navy-800)",
          fontSize: "1.2rem",
          display: "flex",
          alignItems: "center",
        }}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {/* Page title */}
      <h6
        style={{
          margin: 0,
          fontFamily: "var(--font-serif)",
          fontWeight: 700,
          color: "var(--navy-800)",
          fontSize: "1rem",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </h6>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 280, width: "100%" }} className="d-none d-md-block">
        <span
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--gray-400)",
            fontSize: ".9rem",
            pointerEvents: "none",
          }}
        >
          🔍
        </span>
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            height: 36,
            paddingLeft: 32,
            paddingRight: 12,
            border: "1.5px solid var(--gray-200)",
            borderRadius: 8,
            fontSize: ".85rem",
            background: "var(--gray-50)",
            outline: "none",
            transition: "border-color .2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--gold-500)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--gray-200)")}
        />
      </div>

      {/* Notification bell */}
      <button
        onClick={() => navigate("/admin/notifications")}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: 6,
          borderRadius: 8,
          fontSize: "1.15rem",
          color: "var(--gray-700)",
          display: "flex",
          alignItems: "center",
        }}
        aria-label="Notifications"
      >
        🔔
        {/* unread dot */}
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#ef4444",
            border: "2px solid #fff",
          }}
        />
      </button>

      {/* Admin profile dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setDropOpen((v) => !v)}
          style={{
            background: "none",
            border: "1.5px solid var(--gray-200)",
            borderRadius: 10,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: ".5rem",
            padding: "5px 10px 5px 5px",
            transition: "border-color .18s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold-500)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--gray-200)")}
        >
          {/* Avatar */}
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--gold-500), var(--gold-600))",
              color: "var(--navy-900)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: ".85rem",
              flexShrink: 0,
            }}
          >
            {initial}
          </span>
          <span
            style={{
              fontSize: ".85rem",
              fontWeight: 600,
              color: "var(--navy-800)",
              maxWidth: 100,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            className="d-none d-md-inline"
          >
            {name}
          </span>
          <span style={{ fontSize: ".65rem", color: "var(--gray-400)" }}>▾</span>
        </button>

        {/* Dropdown */}
        {dropOpen && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 998 }}
              onClick={() => setDropOpen(false)}
            />
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "#fff",
                border: "1px solid var(--gray-200)",
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(6,14,30,.12)",
                zIndex: 999,
                minWidth: 200,
                overflow: "hidden",
              }}
            >
              {/* User info */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--gray-100)",
                  background: "var(--gray-50)",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--navy-800)" }}>{name}</div>
                <div style={{ fontSize: ".75rem", color: "var(--gray-500)" }}>{user?.email}</div>
              </div>
              {[
                { label: "⚙️  Settings", path: "/admin/settings" },
                { label: "🏠  View Site",  path: "/" },
              ].map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => { setDropOpen(false); navigate(path); }}
                  style={{
                    display: "flex",
                    width: "100%",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: ".88rem",
                    color: "var(--gray-700)",
                    textAlign: "left",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-50)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  {label}
                </button>
              ))}
              <div style={{ borderTop: "1px solid var(--gray-100)" }}>
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    width: "100%",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: ".88rem",
                    color: "#dc2626",
                    textAlign: "left",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  🚪  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
