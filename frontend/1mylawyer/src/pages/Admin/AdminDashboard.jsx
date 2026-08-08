/**
 * AdminDashboard.jsx
 * ───────────────────
 * Route: /admin
 *
 * Data sources (all real endpoints from adminRoutes.js):
 *   GET /api/admin/stats              → stat cards
 *   GET /api/admin/reports/revenue    → revenue chart
 *   GET /api/admin/reports/users      → users chart
 *   GET /api/admin/appointments?limit=5 → recent activity
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminLayout from "../../components/Admin/AdminLayout";
import DashboardCards from "../../components/Admin/DashboardCards";
import {
  getDashboardStats,
  getAllAppointments,
} from "../../services/adminService";

/* ── Quick action buttons ── */
const QUICK_ACTIONS = [
  { label: "Add User",       icon: "👤", path: "/admin/users"         },
  { label: "View Cases",     icon: "📁", path: "/admin/cases"         },
  { label: "Appointments",   icon: "📅", path: "/admin/appointments"  },
  { label: "Payments",       icon: "💳", path: "/admin/payments"      },
  { label: "Legal Library",  icon: "📚", path: "/admin/legal-library" },
  { label: "Notifications",  icon: "🔔", path: "/admin/notifications" },
];

/* ── Status badge helper ── */
function StatusBadge({ status }) {
  const map = {
    Confirmed:  { bg: "rgba(16,185,129,.12)",  color: "#065f46" },
    Pending:    { bg: "rgba(245,158,11,.12)",  color: "#92400e" },
    Cancelled:  { bg: "rgba(239,68,68,.10)",   color: "#991b1b" },
    Completed:  { bg: "rgba(59,130,246,.10)",  color: "#1e40af" },
  };
  const s = map[status] || { bg: "var(--gray-100)", color: "var(--gray-600)" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "2px 10px", borderRadius: 20,
      fontSize: ".72rem", fontWeight: 700,
      textTransform: "uppercase", letterSpacing: ".05em",
    }}>
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats,           setStats          ] = useState({});
  const [recentAppts,     setRecentAppts    ] = useState([]);
  const [loadingStats,    setLoadingStats   ] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    /* getDashboardStats returns:
       { stats: { users: { total, newThisMonth }, advocates: { total },
                  appointments: { total, newThisMonth },
                  cases: { total }, documents: { total },
                  revenue: { totalRupees, totalPaidPayments } } }
       DashboardCards expects flat keys: totalUsers, totalAdvocates, etc.
       Normalize here so DashboardCards needs no changes. */
    getDashboardStats()
      .then((r) => {
        const s = r.data.stats ?? r.data;
        setStats({
          totalUsers:          s.users?.total              ?? s.totalUsers          ?? 0,
          newUsersThisMonth:   s.users?.newThisMonth       ?? s.newUsersThisMonth   ?? 0,
          totalAdvocates:      s.advocates?.total          ?? s.totalAdvocates      ?? 0,
          activeAdvocates:     s.advocates?.active         ?? s.activeAdvocates     ?? 0,
          totalCases:          s.cases?.total              ?? s.totalCases          ?? 0,
          activeCases:         s.cases?.active             ?? s.activeCases         ?? 0,
          totalPayments:       s.revenue?.totalPaidPayments ?? s.totalPayments      ?? 0,
          revenueThisMonth:    s.revenue?.revenueThisMonth ?? s.revenueThisMonth    ?? 0,
          todayAppointments:   s.appointments?.today       ?? s.todayAppointments   ?? 0,
          pendingAppointments: s.appointments?.newThisMonth ?? s.pendingAppointments ?? 0,
          totalRevenue:        s.revenue?.totalRupees      ?? s.totalRevenue        ?? 0,
        });
      })
      .catch(() => toast.error("Failed to load dashboard stats"))
      .finally(() => setLoadingStats(false));

    getAllAppointments({ limit: 5, sort: "latest" })
      .then((r) => setRecentAppts(r.data.appointments ?? []))
      .catch(() => {})
      .finally(() => setLoadingActivity(false));
  }, []);

  return (
    <AdminLayout title="Dashboard">

      {/* ── Stat Cards ── */}
      <DashboardCards stats={stats} loading={loadingStats} />

      {/* ── Charts row (disabled — DashboardCharts import commented out) ── */}
      {/*
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-7">
          <RevenueChart data={revenueData} loading={loadingCharts} />
        </div>
        <div className="col-12 col-lg-5">
          <UsersChart data={usersData} loading={loadingCharts} />
        </div>
      </div>
      */}

      {/* ── Bottom row: Recent Activity + Quick Actions ── */}
      <div className="row g-3">

        {/* Recent Activity */}
        <div className="col-12 col-lg-7">
          <div style={{
            background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)",
            boxShadow: "0 2px 12px rgba(6,14,30,.06)", padding: "1.25rem 1.4rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h6 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--navy-800)", margin: 0 }}>
                Recent Appointments
              </h6>
              <button
                onClick={() => navigate("/admin/appointments")}
                style={{ background: "none", border: "none", color: "var(--gold-500)", fontSize: ".8rem", fontWeight: 600, cursor: "pointer" }}
              >
                View all →
              </button>
            </div>

            {loadingActivity ? (
              <div className="d-flex flex-column gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="lm-skeleton lm-skeleton-text" style={{ height: 36, borderRadius: 8 }} />
                ))}
              </div>
            ) : recentAppts.length === 0 ? (
              <p style={{ color: "var(--gray-400)", fontSize: ".88rem", textAlign: "center", padding: "2rem 0" }}>
                No recent appointments
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {recentAppts.map((a) => (
                  <div
                    key={a._id}
                    style={{
                      display: "flex", alignItems: "center", gap: ".75rem",
                      padding: ".6rem .75rem", borderRadius: 8,
                      transition: "background .15s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gray-50)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => navigate("/admin/appointments")}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--navy-700), var(--navy-500))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: ".78rem", flexShrink: 0,
                    }}>
                      {(a.user?.name ?? a.userId?.name ?? a.clientName ?? a.fullName ?? "?").charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: ".85rem", fontWeight: 600, color: "var(--navy-800)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.user?.name ?? a.userId?.name ?? a.clientName ?? a.fullName ?? "User"}
                      </div>
                      <div style={{ fontSize: ".73rem", color: "var(--gray-500)" }}>
                        {a.advocateId?.fullName ?? "Advocate"} · {(a.appointmentDate || a.date) ? new Date(a.appointmentDate || a.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-12 col-lg-5">
          <div style={{
            background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)",
            boxShadow: "0 2px 12px rgba(6,14,30,.06)", padding: "1.25rem 1.4rem",
          }}>
            <h6 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--navy-800)", marginBottom: "1rem" }}>
              Quick Actions
            </h6>
            <div className="row g-2">
              {QUICK_ACTIONS.map((qa) => (
                <div key={qa.path} className="col-6">
                  <button
                    onClick={() => navigate(qa.path)}
                    style={{
                      width: "100%",
                      background: "var(--gray-50)",
                      border: "1px solid var(--gray-200)",
                      borderRadius: 10,
                      padding: ".75rem .5rem",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexDirection: "column", gap: ".35rem",
                      transition: "background .18s, border-color .18s, transform .15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--gold-100)";
                      e.currentTarget.style.borderColor = "var(--gold-400)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--gray-50)";
                      e.currentTarget.style.borderColor = "var(--gray-200)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <span style={{ fontSize: "1.3rem" }}>{qa.icon}</span>
                    <span style={{ fontSize: ".75rem", fontWeight: 600, color: "var(--navy-800)" }}>
                      {qa.label}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
