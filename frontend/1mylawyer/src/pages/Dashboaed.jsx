import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import { SkeletonStatGrid } from "../components/Skeleton";

const STATUS_COLORS = {
  Pending: "#f59e0b", Approved: "#10b981",
  Cancelled: "#ef4444", Rejected: "#ef4444", Completed: "#3b82f6",
};

/* ── Count-up hook ───────────────────────────────────────────
   Animates a number from 0 to `target` over `duration` ms.
   WHY: Animated numbers draw attention to the stat cards and
   confirm that real data loaded — not a placeholder zero.
   Only runs once per mount. Uses requestAnimationFrame for
   smooth 60fps animation without setInterval jank.
──────────────────────────────────────────────────────────── */
function useCountUp(target, duration = 800, enabled = true) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!enabled || target === 0) { setCount(target); return; }
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out: fast start, slow finish
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, enabled]);

  return count;
}

/* ── Animated stat number ───────────────────────────────────── */
function AnimatedStat({ value, enabled }) {
  const count = useCountUp(value || 0, 900, enabled);
  return <div className="lm-stat-number">{count}</div>;
}

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const [apptRes, notifRes, caseRes, docRes] = await Promise.all([
        api.get("/api/appointments/my"),
        api.get("/api/notifications?limit=5"),
        api.get("/api/cases/my"),
        api.get("/api/documents/my"),
      ]);
      setStats({
        appointments: apptRes.data.count || 0,
        cases: caseRes.data.count || 0,
        documents: docRes.data.count || 0,
        unreadNotifications: notifRes.data.unreadCount || 0,
      });
      setAppointments(apptRes.data.appointments?.slice(0, 4) || []);
      setNotifications(notifRes.data.notifications?.slice(0, 4) || []);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const STAT_CARDS = [
    { label: "Appointments",  key: "appointments",         icon: "📅", link: "/my-appointments", sub: "Total scheduled"  },
    { label: "Active Cases",  key: "cases",                icon: "⚖️", link: "/cases",           sub: "Currently tracked" },
    { label: "Documents",     key: "documents",            icon: "📄", link: "/document",        sub: "Stored securely"  },
    { label: "Unread Alerts", key: "unreadNotifications",  icon: "🔔", link: "/notifications",   sub: "Notifications"    },
  ];

  const QUICK_ACTIONS = [
    { to: "/appointment", icon: "📅", label: "Book Appointment", variant: "btn-gold"         },
    { to: "/cases",       icon: "⚖️", label: "Track Cases",      variant: "btn-outline-gold" },
    { to: "/document",    icon: "📄", label: "Document Vault",   variant: "btn-outline-gold" },
    { to: "/profile",     icon: "👤", label: "Edit Profile",     variant: "btn-outline-gold" },
  ];

  return (
    <>
      <Navbar />

      <div className="lm-page-header">
        <div className="container lm-page-header-content">
          <div className="d-flex align-items-center gap-3 gap-md-4 flex-wrap">
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "var(--gold-500)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-serif)", fontSize: "1.5rem",
              fontWeight: 800, color: "var(--navy-900)", flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="lm-gold-bar mb-2" />
              <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, marginBottom: ".25rem", fontSize: "clamp(1.4rem,4vw,1.9rem)" }}>
                Welcome back, {user?.name?.split(" ")[0] || "Counsellor"}
              </h2>
              <p style={{ opacity: .75, marginBottom: 0, fontSize: ".9rem" }}>
                Here's your legal activity overview for today
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {loading ? (
          /* ── Skeleton loading — prevents layout shift ── */
          <>
            <SkeletonStatGrid />
            <div className="row g-3 g-md-4">
              <div className="col-12 col-lg-7">
                <div className="lm-card">
                  <div className="lm-card-header">
                    <span className="lm-skeleton" style={{ height:"1.1rem", width:180, display:"block" }} />
                  </div>
                  <div className="p-4">
                    {[0,1,2].map(i => (
                      <div key={i} className="d-flex align-items-center gap-3 mb-4">
                        <span className="lm-skeleton lm-skeleton-circle" style={{ width:40, height:40, display:"block", flexShrink:0 }} />
                        <div style={{ flex:1 }}>
                          <span className="lm-skeleton" style={{ height:".9rem", width:"55%", display:"block", marginBottom:".3rem" }} />
                          <span className="lm-skeleton" style={{ height:".75rem", width:"75%", display:"block" }} />
                        </div>
                        <span className="lm-skeleton" style={{ height:"1.5rem", width:64, display:"block", borderRadius:"30px" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-5">
                <div className="lm-card">
                  <div className="lm-card-header">
                    <span className="lm-skeleton" style={{ height:"1.1rem", width:160, display:"block" }} />
                  </div>
                  <div className="p-4">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="mb-4">
                        <span className="lm-skeleton" style={{ height:".85rem", width:"45%", display:"block", marginBottom:".3rem" }} />
                        <span className="lm-skeleton" style={{ height:".75rem", display:"block" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Stats — count-up animation on mount */}
            {/* lm-stagger-list staggers each card's fade-in */}
            <div className="row g-3 g-md-4 mb-4 mb-md-5 lm-stagger-list">
              {STAT_CARDS.map((s) => (
                <div className="col-6 col-lg-3" key={s.label}>
                  <Link to={s.link} className="lm-stat-card text-decoration-none">
                    <div className="lm-stat-icon">{s.icon}</div>
                    {/* AnimatedStat counts up from 0 to the real value */}
                    <AnimatedStat value={stats?.[s.key] ?? 0} enabled={!loading} />
                    <div className="lm-stat-label">{s.label}</div>
                    <small style={{ color:"var(--gray-400)", fontSize:".74rem" }}>{s.sub}</small>
                  </Link>
                </div>
              ))}
            </div>

            <div className="row g-3 g-md-4">

              {/* Recent Appointments — lm-stagger-list staggers rows */}
              <div className="col-12 col-lg-7">
                <div className="lm-card h-100">
                  <div className="lm-card-header">
                    <h5 className="lm-card-title">Recent Appointments</h5>
                    <Link to="/my-appointments" style={{ color:"var(--gold-600)", fontSize:".85rem", fontWeight:600, textDecoration:"none" }}>
                      View All →
                    </Link>
                  </div>
                  {appointments.length === 0 ? (
                    <div className="lm-empty-state">
                      <div className="icon">📅</div>
                      <h5>No Appointments Yet</h5>
                      <p>Book your first consultation with a verified advocate</p>
                      <Link to="/appointment" className="btn btn-gold btn-sm mt-2 px-4">Book Now</Link>
                    </div>
                  ) : (
                    <div className="lm-stagger-list">
                      {appointments.map((a, idx) => (
                        <div key={a._id} style={{
                          padding:"1rem 1.25rem",
                          borderBottom: idx < appointments.length-1 ? "1px solid var(--gray-100)" : "none",
                        }}>
                          <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                            <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ minWidth:0 }}>
                              <div style={{ width:40, height:40, borderRadius:"50%", background:"var(--navy-800)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--gold-500)", fontFamily:"var(--font-serif)", fontWeight:700, fontSize:".9rem" }}>
                                {a.advocateId?.fullName?.charAt(0) || "A"}
                              </div>
                              <div style={{ minWidth:0 }}>
                                <p style={{ margin:0, fontWeight:600, fontSize:".9rem", color:"var(--navy-800)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                  {a.advocateId?.fullName || "Advocate"}
                                </p>
                                <small style={{ color:"var(--gray-500)", fontSize:".78rem" }}>
                                  {a.service} · {new Date(a.appointmentDate).toLocaleDateString("en-IN",{ day:"numeric", month:"short", year:"numeric" })}
                                </small>
                              </div>
                            </div>
                            <span style={{ background: STATUS_COLORS[a.status]+"1a", color: STATUS_COLORS[a.status], border:`1px solid ${STATUS_COLORS[a.status]}40`, borderRadius:"30px", padding:".2rem .75rem", fontSize:".75rem", fontWeight:700, whiteSpace:"nowrap", flexShrink:0 }}>
                              {a.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="col-12 col-lg-5 d-flex flex-column gap-3 gap-md-4">

                {/* Notifications — gold highlight on unread */}
                <div className="lm-card flex-grow-1">
                  <div className="lm-card-header">
                    <h5 className="lm-card-title">Recent Notifications</h5>
                    <Link to="/notifications" style={{ color:"var(--gold-600)", fontSize:".85rem", fontWeight:600, textDecoration:"none" }}>
                      View All →
                    </Link>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding:"1.5rem", textAlign:"center", color:"var(--gray-500)", fontSize:".88rem" }}>
                      No notifications
                    </div>
                  ) : (
                    <div className="lm-stagger-list">
                      {notifications.map((n, idx) => (
                        <div key={n._id} style={{ padding:".85rem 1.25rem", borderBottom: idx < notifications.length-1 ? "1px solid var(--gray-100)" : "none", background: !n.isRead ? "var(--gold-100)" : "transparent", borderLeft: !n.isRead ? "3px solid var(--gold-500)" : "3px solid transparent", transition:"background .2s ease" }}>
                          <p style={{ margin:0, fontWeight:600, fontSize:".87rem", color:"var(--navy-800)" }}>{n.title}</p>
                          <p style={{ margin:0, color:"var(--gray-500)", fontSize:".78rem" }}>{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions — stagger the buttons */}
                <div className="lm-card">
                  <div className="lm-card-header">
                    <h5 className="lm-card-title">Quick Actions</h5>
                  </div>
                  <div className="p-3 p-md-4 d-grid gap-2 lm-stagger-list">
                    {QUICK_ACTIONS.map((a) => (
                      <Link key={a.to} to={a.to} className={`btn ${a.variant} text-start`} style={{ borderRadius:"var(--radius-sm)" }}>
                        <span className="me-2">{a.icon}</span>{a.label}
                      </Link>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
}

export default Dashboard;
