/**
 * Notifications.jsx  —  /admin/notifications
 * ────────────────────────────────────────────
 * Connected to live backend APIs:
 *   GET  /api/admin/notifications
 *   POST /api/admin/notifications/send
 */
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../components/Admin/AdminLayout";
import { getNotifications, sendNotification } from "../../services/adminService";

const fmtDate = (d) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const TYPE_STYLE = {
  announcement: { bg: "rgba(59,130,246,.1)",  color: "#1e40af", label: "📢 Announcement" },
  alert:        { bg: "rgba(239,68,68,.1)",   color: "#991b1b", label: "🚨 Alert"        },
  reminder:     { bg: "rgba(245,158,11,.1)",  color: "#92400e", label: "⏰ Reminder"      },
  update:       { bg: "rgba(16,185,129,.1)",  color: "#065f46", label: "✅ Update"        },
};

export default function Notifications() {
  const [notifs,   setNotifs  ] = useState([]);
  const [loading,  setLoading ] = useState(true);
  const [sending,  setSending ] = useState(false);

  /* send form state */
  const [form, setForm] = useState({
    title:     "",
    message:   "",
    type:      "announcement",
    targetRole: "all",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ limit: 50 });
      setNotifs(res.data.notifications ?? []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load notifications");
      setNotifs([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.warning("Title and message are required"); return;
    }
    setSending(true);
    try {
      const res = await sendNotification(form);
      toast.success(res.data.message || "Notification sent successfully");
      setForm({ title: "", message: "", type: "announcement", targetRole: "all" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Send failed");
    } finally { setSending(false); }
  };

  return (
    <AdminLayout title="Notifications">
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="lm-gold-bar" style={{ marginBottom: ".5rem" }} />
        <h4 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, color: "var(--navy-800)", margin: 0 }}>Notifications</h4>
        <p style={{ color: "var(--gray-500)", fontSize: ".88rem", margin: 0 }}>Send announcements and view history</p>
      </div>

      <div className="row g-4">
        {/* ── Send form ── */}
        <div className="col-12 col-lg-5">
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)", boxShadow: "0 2px 12px rgba(6,14,30,.06)", padding: "1.5rem", height: "fit-content" }}>
            <h6 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--navy-800)", marginBottom: "1.25rem" }}>
              📤 Send Notification
            </h6>
            <form onSubmit={handleSend}>
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 600, fontSize: ".82rem", color: "var(--navy-800)", textTransform: "uppercase", letterSpacing: ".05em" }}>Title *</label>
                <input type="text" className="form-control" placeholder="Notification title…"
                  value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required style={{ borderRadius: 8, fontSize: ".9rem" }} />
              </div>
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 600, fontSize: ".82rem", color: "var(--navy-800)", textTransform: "uppercase", letterSpacing: ".05em" }}>Message *</label>
                <textarea className="form-control" placeholder="Write your message here…"
                  rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  required style={{ borderRadius: 8, fontSize: ".9rem", resize: "vertical" }} />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: ".82rem", color: "var(--navy-800)", textTransform: "uppercase", letterSpacing: ".05em" }}>Type</label>
                  <select className="form-select" value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    style={{ borderRadius: 8, fontSize: ".88rem" }}>
                    {Object.keys(TYPE_STYLE).map((t) => (
                      <option key={t} value={t}>{TYPE_STYLE[t].label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: ".82rem", color: "var(--navy-800)", textTransform: "uppercase", letterSpacing: ".05em" }}>Target</label>
                  <select className="form-select" value={form.targetRole}
                    onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))}
                    style={{ borderRadius: 8, fontSize: ".88rem" }}>
                    <option value="all">All Users</option>
                    <option value="user">Users Only</option>
                    <option value="advocate">Advocates Only</option>
                    <option value="admin">Admins Only</option>
                  </select>
                </div>
              </div>
              {/* Preview */}
              {(form.title || form.message) && (
                <div style={{ background: "var(--gray-50)", borderRadius: 10, padding: ".85rem 1rem", marginBottom: "1rem", border: "1px solid var(--gray-200)" }}>
                  <div style={{ fontSize: ".72rem", color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: ".35rem" }}>Preview</div>
                  {form.title && <div style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--navy-800)", marginBottom: ".2rem" }}>{form.title}</div>}
                  {form.message && <div style={{ fontSize: ".85rem", color: "var(--gray-600)", lineHeight: 1.5 }}>{form.message}</div>}
                </div>
              )}
              <button type="submit" disabled={sending} className="btn btn-gold w-100" style={{ borderRadius: 8, fontSize: ".88rem" }}>
                {sending ? <><span className="spinner-border spinner-border-sm me-2" />Sending…</> : "📤 Send Notification"}
              </button>
            </form>
          </div>
        </div>

        {/* ── History list ── */}
        <div className="col-12 col-lg-7">
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)", boxShadow: "0 2px 12px rgba(6,14,30,.06)", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h6 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--navy-800)", margin: 0 }}>
                📋 Announcement History
              </h6>
              <button onClick={load} style={{ background: "none", border: "none", color: "var(--gold-500)", fontSize: ".8rem", fontWeight: 600, cursor: "pointer" }}>🔄 Refresh</button>
            </div>

            {loading ? (
              <div className="d-flex flex-column gap-2">
                {[...Array(4)].map((_, i) => <div key={i} className="lm-skeleton lm-skeleton-text" style={{ height: 60, borderRadius: 10 }} />)}
              </div>
            ) : notifs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: ".75rem" }}>🔔</div>
                <p style={{ color: "var(--gray-400)", fontSize: ".9rem" }}>
                  No notifications sent yet. Use the form to send your first announcement.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: ".75rem", maxHeight: 520, overflowY: "auto" }}>
                {notifs.map((n) => {
                  const t = TYPE_STYLE[n.type] || TYPE_STYLE.announcement;
                  return (
                    <div key={n._id} style={{ background: t.bg, borderRadius: 10, padding: "1rem 1.1rem", borderLeft: `3px solid ${t.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: ".5rem", marginBottom: ".3rem" }}>
                        <div style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--navy-800)" }}>{n.title}</div>
                        <span style={{ fontSize: ".7rem", color: t.color, fontWeight: 700, whiteSpace: "nowrap", background: "#fff", padding: "2px 8px", borderRadius: 12 }}>
                          {t.label}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 .4rem", fontSize: ".85rem", color: "var(--gray-700)", lineHeight: 1.5 }}>{n.message}</p>
                      <div style={{ fontSize: ".72rem", color: "var(--gray-500)" }}>
                        Sent: {fmtDate(n.createdAt)} · To: {n.targetRole || "all"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
