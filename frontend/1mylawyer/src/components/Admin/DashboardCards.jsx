/**
 * DashboardCards.jsx
 * ───────────────────
 * Six stat cards for the admin dashboard.
 * Receives the stats object from GET /api/admin/stats
 *
 * Expected shape (from getDashboardStats controller):
 * {
 *   totalUsers, newUsersThisMonth,
 *   totalAdvocates, activeAdvocates,
 *   totalCases, activeCases,
 *   totalPayments, revenueThisMonth,
 *   todayAppointments, pendingAppointments,
 *   totalRevenue
 * }
 */

const CARDS = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: "👥",
    sub: (s) => `+${s.newUsersThisMonth ?? 0} this month`,
    color: "#3b82f6",
    link: "/admin/users",
  },
  {
    key: "totalAdvocates",
    label: "Advocates",
    icon: "⚖️",
    sub: (s) => `${s.activeAdvocates ?? 0} active`,
    color: "var(--gold-500)",
    link: "/admin/advocates",
  },
  {
    key: "totalCases",
    label: "Total Cases",
    icon: "📁",
    sub: (s) => `${s.activeCases ?? 0} active`,
    color: "#8b5cf6",
    link: "/admin/cases",
  },
  {
    key: "totalPayments",
    label: "Payments",
    icon: "💳",
    sub: (s) => `₹${(s.revenueThisMonth ?? 0).toLocaleString("en-IN")} this month`,
    color: "#10b981",
    link: "/admin/payments",
  },
  {
    key: "todayAppointments",
    label: "Today's Appts",
    icon: "📅",
    sub: (s) => `${s.pendingAppointments ?? 0} pending`,
    color: "#f59e0b",
    link: "/admin/appointments",
  },
  {
    key: "totalRevenue",
    label: "Total Revenue",
    icon: "💰",
    sub: () => "All time",
    color: "#ef4444",
    format: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`,
    link: "/admin/payments",
  },
];

import { useNavigate } from "react-router-dom";

export default function DashboardCards({ stats = {}, loading = false }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="row g-3 mb-4">
        {CARDS.map((_, i) => (
          <div key={i} className="col-12 col-sm-6 col-xl-4">
            <div
              className="lm-skeleton-card"
              style={{ borderRadius: 14, padding: "1.5rem" }}
            >
              <div className="lm-skeleton lm-skeleton-circle" style={{ width: 44, height: 44, marginBottom: 12 }} />
              <div className="lm-skeleton lm-skeleton-title" style={{ width: "40%" }} />
              <div className="lm-skeleton lm-skeleton-text" style={{ width: "60%" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="row g-3 mb-4">
      {CARDS.map((card) => {
        const raw   = stats[card.key] ?? 0;
        const value = card.format ? card.format(raw) : Number(raw).toLocaleString("en-IN");
        const sub   = card.sub(stats);

        return (
          <div key={card.key} className="col-12 col-sm-6 col-xl-4">
            <div
              onClick={() => navigate(card.link)}
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "1.25rem 1.4rem",
                boxShadow: "0 2px 12px rgba(6,14,30,.07)",
                border: "1px solid var(--gray-200)",
                borderLeft: `4px solid ${card.color}`,
                cursor: "pointer",
                transition: "transform .2s ease, box-shadow .2s ease",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(6,14,30,.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(6,14,30,.07)";
              }}
            >
              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${card.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.4rem", flexShrink: 0,
              }}>
                {card.icon}
              </div>

              {/* Text */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.65rem",
                  fontWeight: 800,
                  color: "var(--navy-800)",
                  lineHeight: 1.1,
                }}>
                  {value}
                </div>
                <div style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--gray-500)", marginTop: 2 }}>
                  {card.label}
                </div>
                <div style={{ fontSize: ".72rem", color: card.color, marginTop: 2, fontWeight: 500 }}>
                  {sub}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
