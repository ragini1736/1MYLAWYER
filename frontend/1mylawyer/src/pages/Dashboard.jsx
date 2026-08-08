import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";


function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

      setAppointments(apptRes.data.appointments?.slice(0, 3) || []);
      setNotifications(notifRes.data.notifications?.slice(0, 4) || []);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      Pending: "warning", Approved: "success",
      Cancelled: "danger", Rejected: "danger", Completed: "info",
    };
    return <span className={`badge bg-${map[status] || "secondary"}`}>{status}</span>;
  };

  return (
    <>
    
      <section className="container-fluid bg-primary text-white py-4">
        <div className="container">
          <h2 className="fw-bold mb-0">
            Welcome back, {user?.name?.split(" ")[0] || "User"} 👋
          </h2>
          <p className="mb-0 opacity-75">Here's your legal activity overview</p>
        </div>
      </section>

      <div className="container py-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
            <p className="mt-2 text-muted">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="row g-4 mb-4">
              {[
                { label: "Appointments", value: stats?.appointments, color: "primary", icon: "📅", link: "/my-appointments" },
                { label: "Active Cases", value: stats?.cases, color: "success", icon: "⚖️", link: "/cases" },
                { label: "Documents", value: stats?.documents, color: "warning", icon: "📄", link: "/document" },
                { label: "Notifications", value: stats?.unreadNotifications, color: "danger", icon: "🔔", link: "/notifications" },
              ].map((s) => (
                <div className="col-6 col-lg-3" key={s.label}>
                  <Link to={s.link} className="text-decoration-none">
                    <div className={`card border-0 shadow text-center p-4 h-100 border-start border-4 border-${s.color}`}>
                      <div className="fs-2">{s.icon}</div>
                      <h2 className={`fw-bold text-${s.color} mb-0`}>{s.value ?? 0}</h2>
                      <p className="text-muted mb-0 small">{s.label}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            <div className="row g-4">
              {/* Recent Appointments */}
              <div className="col-12 col-lg-7">
                <div className="card shadow border-0 h-100">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">Recent Appointments</h5>
                    <Link to="/my-appointments" className="btn btn-sm btn-outline-primary">View All</Link>
                  </div>
                  <div className="card-body p-0">
                    {appointments.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        No appointments yet.{" "}
                        <Link to="/appointment">Book one</Link>
                      </div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {appointments.map((a) => (
                          <div key={a._id} className="list-group-item px-4 py-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <p className="fw-semibold mb-0">
                                  {a.advocateId?.fullName || "Advocate"}
                                </p>
                                <small className="text-muted">
                                  {a.service} · {new Date(a.appointmentDate).toLocaleDateString("en-IN")} · {a.timeSlot}
                                </small>
                              </div>
                              {statusBadge(a.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Notifications + Quick Actions */}
              <div className="col-12 col-lg-5">
                <div className="card shadow border-0 mb-4">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">Recent Notifications</h5>
                    <Link to="/notifications" className="btn btn-sm btn-outline-primary">View All</Link>
                  </div>
                  <div className="list-group list-group-flush">
                    {notifications.length === 0 ? (
                      <div className="list-group-item text-center text-muted py-3">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n._id} className={`list-group-item px-3 py-2 ${!n.isRead ? "bg-light" : ""}`}>
                          <p className="mb-0 fw-semibold small">{n.title}</p>
                          <p className="mb-0 text-muted" style={{ fontSize: "0.8rem" }}>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="card shadow border-0">
                  <div className="card-header bg-white"><h5 className="mb-0 fw-bold">Quick Actions</h5></div>
                  <div className="card-body d-grid gap-2">
                    <Link to="/appointment" className="btn btn-primary">📅 Book Appointment</Link>
                    <Link to="/cases" className="btn btn-outline-success">⚖️ Track My Cases</Link>
                    <Link to="/document" className="btn btn-outline-warning">📄 My Documents</Link>
                    <Link to="/profile" className="btn btn-outline-secondary">👤 Edit Profile</Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
    </>
  );
}

export default Dashboard;
