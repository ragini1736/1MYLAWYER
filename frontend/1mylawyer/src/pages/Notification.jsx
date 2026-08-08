import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../services/api";


const TYPE_META = {
  appointment_booked:    { icon:"📅", color:"#2563eb", bg:"rgba(37,99,235,.1)"   },
  appointment_approved:  { icon:"✅", color:"#059669", bg:"rgba(5,150,105,.1)"   },
  appointment_rejected:  { icon:"❌", color:"#dc2626", bg:"rgba(220,38,38,.1)"   },
  appointment_cancelled: { icon:"🚫", color:"#6b7280", bg:"rgba(107,114,128,.1)" },
  payment_success:       { icon:"💳", color:"#059669", bg:"rgba(5,150,105,.1)"   },
  payment_failed:        { icon:"⚠️", color:"#d97706", bg:"rgba(217,119,6,.1)"   },
  case_created:          { icon:"⚖️", color:"#7c3aed", bg:"rgba(124,58,237,.1)"  },
  case_status_changed:   { icon:"🔄", color:"#d97706", bg:"rgba(217,119,6,.1)"   },
  hearing_scheduled:     { icon:"🏛️", color:"#7c3aed", bg:"rgba(124,58,237,.1)"  },
  document_uploaded:     { icon:"📄", color:"#6b7280", bg:"rgba(107,114,128,.1)" },
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState("all");
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit:15 });
      if (filter === "unread") params.append("isRead","false");
      if (filter === "read")   params.append("isRead","true");
      const res = await api.get(`/api/notifications?${params}`);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch { toast.error("Failed to load notifications"); }
    finally { setLoading(false); }
  }, [filter, page]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const markOne = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((p) => p.map((n) => n._id===id ? {...n,isRead:true} : n));
      setUnreadCount((c) => Math.max(0,c-1));
    } catch { toast.error("Failed"); }
  };

  const markAll = async () => {
    setActionLoading(true);
    try { const res = await api.put("/api/notifications/mark-all-read"); toast.success(res.data.message); fetchNotifs(); }
    catch { toast.error("Failed"); }
    finally { setActionLoading(false); }
  };

  const deleteOne = async (id, wasUnread) => {
    setNotifications((p) => p.filter((x) => x._id!==id));
    if (wasUnread) setUnreadCount((c) => Math.max(0,c-1));
    try { await api.delete(`/api/notifications/${id}`); }
    catch { toast.error("Failed to delete"); fetchNotifs(); }
  };

  const clearRead = async () => {
    setActionLoading(true);
    try { const res = await api.delete("/api/notifications/clear-read"); toast.success(res.data.message); fetchNotifs(); }
    catch { toast.error("Failed"); }
    finally { setActionLoading(false); }
  };

  return (
    <>
      

      {/* Page Header */}
      <div className="lm-page-header">
        <div className="container lm-page-header-content">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <div className="lm-gold-bar" />
              <h1 style={{ fontFamily:"var(--font-serif)", fontWeight:800,
                           fontSize:"clamp(1.5rem,5vw,2.2rem)", marginBottom:".3rem",
                           display:"flex", alignItems:"center", gap:".6rem", flexWrap:"wrap" }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{ background:"var(--gold-500)", color:"var(--navy-900)", borderRadius:"30px", padding:".05rem .6rem", fontSize:"1rem", fontWeight:800, fontFamily:"var(--font-sans)" }}>
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p style={{ opacity:.75, marginBottom:0, fontSize:".9rem" }}>
                Stay updated on your legal activities
              </p>
            </div>
            {/* Action buttons — wrap on mobile */}
            <div className="d-flex gap-2 flex-wrap">
              {unreadCount > 0 && (
                <button className="btn btn-gold btn-sm px-3" onClick={markAll} disabled={actionLoading}>
                  ✓ Mark All Read
                </button>
              )}
              <button className="btn btn-outline-gold btn-sm px-3" onClick={clearRead} disabled={actionLoading}>
                🗑 Clear Read
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">

            {/* Tabs — horizontally scrollable on mobile */}
            <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch",
                          borderBottom:"2px solid var(--gray-100)", marginBottom:"1.5rem",
                          scrollbarWidth:"none" }}>
              <div style={{ display:"flex", minWidth:"max-content" }}>
                {[
                  { key:"all",    label:"All" },
                  { key:"unread", label:`Unread${unreadCount>0 ? ` (${unreadCount})` : ""}` },
                  { key:"read",   label:"Read" },
                ].map((t) => (
                  <button key={t.key} onClick={() => { setFilter(t.key); setPage(1); }}
                    style={{
                      background:"none", border:"none", padding:".65rem 1.1rem",
                      fontWeight:700, fontSize:".86rem", cursor:"pointer", whiteSpace:"nowrap",
                      color: filter===t.key ? "var(--navy-800)" : "var(--gray-500)",
                      borderBottom: filter===t.key ? "2px solid var(--gold-500)" : "2px solid transparent",
                      marginBottom:-2, transition:"var(--transition)",
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification list */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" style={{ color:"var(--gold-500)", width:"2.5rem", height:"2.5rem" }} />
                <p className="mt-3" style={{ color:"var(--gray-500)", fontFamily:"var(--font-serif)" }}>
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="lm-card lm-empty-state">
                <div className="icon">🔔</div>
                <h5>
                  {filter==="unread" ? "No Unread Notifications"
                  : filter==="read"  ? "No Read Notifications"
                  : "No Notifications Yet"}
                </h5>
                <p>Your legal activity updates will appear here</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {notifications.map((n) => {
                  const meta = TYPE_META[n.type] || { icon:"🔔", color:"var(--gray-500)", bg:"var(--gray-100)" };
                  return (
                    <div key={n._id}
                      onClick={() => !n.isRead && markOne(n._id)}
                      style={{
                        background: !n.isRead ? "var(--white)" : "var(--gray-50)",
                        border:`1px solid ${!n.isRead ? "rgba(201,168,76,.2)" : "var(--gray-200)"}`,
                        borderLeft:`3px solid ${!n.isRead ? "var(--gold-500)" : "transparent"}`,
                        borderRadius:"var(--radius-md)",
                        padding:".9rem 1rem",
                        cursor: !n.isRead ? "pointer" : "default",
                        transition:"var(--transition)",
                        boxShadow: !n.isRead ? "var(--shadow-sm)" : "none",
                        display:"flex", alignItems:"flex-start", gap:".85rem",
                      }}>

                      {/* Type icon */}
                      <div style={{ width:40, height:40, borderRadius:"50%", background:meta.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 }}>
                        {meta.icon}
                      </div>

                      {/* Text content — flex:1 + minWidth:0 prevents overflow */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <p style={{ margin:0, fontWeight:700, fontSize:".88rem", color:"var(--navy-800)", display:"flex", alignItems:"center", gap:".4rem", flexWrap:"wrap" }}>
                            {n.title}
                            {!n.isRead && (
                              <span style={{ background:"var(--gold-500)", color:"var(--navy-900)", borderRadius:"30px", padding:".03rem .45rem", fontSize:".62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:".05em", flexShrink:0 }}>
                                NEW
                              </span>
                            )}
                          </p>
                          <small style={{ color:"var(--gray-400)", fontSize:".72rem", flexShrink:0 }}>
                            {timeAgo(n.createdAt)}
                          </small>
                        </div>
                        {/* Message — word-break prevents overflow on mobile */}
                        <p style={{ margin:".25rem 0 0", fontSize:".81rem", color:"var(--gray-500)", lineHeight:1.5, wordBreak:"break-word" }}>
                          {n.message}
                        </p>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteOne(n._id, !n.isRead); }}
                        style={{ background:"none", border:"none", color:"var(--gray-300)", fontSize:"1.2rem", cursor:"pointer", padding:".1rem .25rem", lineHeight:1, flexShrink:0, transition:"var(--transition)" }}
                        onMouseEnter={(e) => e.currentTarget.style.color="#dc2626"}
                        onMouseLeave={(e) => e.currentTarget.style.color="var(--gray-300)"}>
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-3 mt-5 flex-wrap">
                <button className="btn btn-outline-gold btn-sm" disabled={page===1} onClick={() => setPage((p)=>p-1)}>← Prev</button>
                <span style={{ color:"var(--gray-500)", fontSize:".86rem" }}>Page {page} of {totalPages}</span>
                <button className="btn btn-outline-gold btn-sm" disabled={page===totalPages} onClick={() => setPage((p)=>p+1)}>Next →</button>
              </div>
            )}

          </div>
        </div>
      </div>

      
    </>
  );
}

export default Notification;
