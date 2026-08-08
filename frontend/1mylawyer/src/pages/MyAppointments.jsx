import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";


const STATUS_STYLE = {
  Pending:   { bg:"rgba(245,158,11,.12)", color:"#d97706", border:"rgba(245,158,11,.3)" },
  Approved:  { bg:"rgba(16,185,129,.12)", color:"#059669", border:"rgba(16,185,129,.3)" },
  Cancelled: { bg:"rgba(239,68,68,.12)",  color:"#dc2626", border:"rgba(239,68,68,.3)"  },
  Rejected:  { bg:"rgba(239,68,68,.12)",  color:"#dc2626", border:"rgba(239,68,68,.3)"  },
  Completed: { bg:"rgba(59,130,246,.12)", color:"#2563eb", border:"rgba(59,130,246,.3)" },
};

function MyAppointments() {
  const [upcoming, setUpcoming]   = useState([]);
  const [history, setHistory]     = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading]     = useState(true);
  const [cancelId, setCancelId]   = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [upRes, histRes] = await Promise.all([
        api.get("/api/appointments/upcoming"),
        api.get("/api/appointments/history"),
      ]);
      setUpcoming(upRes.data.appointments || []);
      setHistory(histRes.data.appointments || []);
    } catch { toast.error("Failed to load appointments"); }
    finally { setLoading(false); }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.put(`/api/appointments/${cancelId}/cancel`, { reason: cancelReason || "Cancelled by user" });
      toast.success("Appointment cancelled");
      setCancelId(null); setCancelReason("");
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to cancel"); }
    finally { setCancelling(false); }
  };

  const list = activeTab === "upcoming" ? upcoming : history;

  /* ── Single appointment card ─────────────────────────── */
  const AppCard = ({ appt }) => {
    const st = STATUS_STYLE[appt.status] || STATUS_STYLE.Cancelled;
    return (
      <div className="lm-card mb-3">
        <div className="p-3 p-md-4">
          {/* Main row: avatar+info on left, badge+btn on right */}
          <div className="d-flex align-items-start gap-3">
            {/* Avatar */}
            <div style={{
              width:44, height:44, borderRadius:"50%", flexShrink:0,
              background:"var(--navy-800)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"var(--font-serif)", fontSize:".95rem",
              fontWeight:700, color:"var(--gold-500)",
            }}>
              {appt.advocateId?.fullName?.charAt(0) || "A"}
            </div>

            {/* Info — flex-grow so it fills remaining width */}
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:0, fontWeight:700, color:"var(--navy-800)", fontSize:".92rem",
                          fontFamily:"var(--font-serif)", overflow:"hidden",
                          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {appt.advocateId?.fullName || "Advocate"}
              </p>
              <p style={{ margin:"2px 0 0", fontSize:".79rem", color:"var(--gray-500)" }}>
                {appt.service}
              </p>
              <p style={{ margin:"1px 0 0", fontSize:".76rem", color:"var(--gray-400)" }}>
                📅 {new Date(appt.appointmentDate).toLocaleDateString("en-IN",{
                  day:"numeric", month:"short", year:"numeric"})}
                &nbsp;·&nbsp;🕐 {appt.timeSlot}
              </p>
            </div>

            {/* Status + Cancel — column so they stack nicely on all widths */}
            <div className="d-flex flex-column align-items-end gap-2" style={{ flexShrink:0 }}>
              <span style={{
                background:st.bg, color:st.color, border:`1px solid ${st.border}`,
                borderRadius:"30px", padding:".18rem .65rem",
                fontSize:".73rem", fontWeight:700, whiteSpace:"nowrap",
              }}>
                {appt.status}
              </span>
              {["Pending","Approved"].includes(appt.status) && (
                <button onClick={() => { setCancelId(appt._id); setCancelReason(""); }}
                  style={{
                    border:"1.5px solid rgba(239,68,68,.35)", color:"#dc2626",
                    borderRadius:"var(--radius-sm)", fontSize:".72rem",
                    padding:".18rem .6rem", background:"rgba(239,68,68,.06)",
                    cursor:"pointer", whiteSpace:"nowrap",
                  }}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Optional message */}
          {appt.message && (
            <p style={{ margin:".85rem 0 0", fontSize:".81rem", color:"var(--gray-500)",
                        borderTop:"1px solid var(--gray-100)", paddingTop:".7rem" }}>
              💬 {appt.message}
            </p>
          )}
          {appt.cancelReason && ["Rejected","Cancelled"].includes(appt.status) && (
            <p style={{ margin:".75rem 0 0", fontSize:".79rem", color:"#dc2626",
                        borderTop:"1px solid var(--gray-100)", paddingTop:".7rem" }}>
              ✗ Reason: {appt.cancelReason}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
  

      {/* Page Header */}
      <div className="lm-page-header">
        <div className="container lm-page-header-content d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="lm-gold-bar" />
            <h1 style={{ fontFamily:"var(--font-serif)", fontWeight:800,
                         fontSize:"clamp(1.5rem,5vw,2.2rem)", marginBottom:".3rem" }}>
              My Appointments
            </h1>
            <p style={{ opacity:.75, marginBottom:0, fontSize:".9rem" }}>
              Manage all your legal consultations
            </p>
          </div>
          <Link to="/appointment" className="btn btn-gold px-3 px-md-4" style={{ fontSize:".88rem" }}>
            + Book New
          </Link>
        </div>
      </div>

      <div className="container py-4">
        {/* Tabs — horizontally scrollable on mobile */}
        <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch",
                      borderBottom:"2px solid var(--gray-100)", marginBottom:"1.5rem",
                      scrollbarWidth:"none" }}>
          <div style={{ display:"flex", gap:0, minWidth:"max-content" }}>
            {[
              { key:"upcoming", label:"Upcoming", count:upcoming.length },
              { key:"history",  label:"History",  count:history.length  },
            ].map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{
                  background:"none", border:"none", padding:".7rem 1.25rem",
                  fontWeight:700, fontSize:".88rem", cursor:"pointer",
                  color: activeTab===t.key ? "var(--navy-800)" : "var(--gray-500)",
                  borderBottom: activeTab===t.key ? "2px solid var(--gold-500)" : "2px solid transparent",
                  marginBottom:-2, transition:"var(--transition)", whiteSpace:"nowrap",
                }}>
                {t.label}
                {t.count > 0 && (
                  <span style={{
                    marginLeft:".4rem",
                    background: activeTab===t.key ? "var(--gold-500)" : "var(--gray-200)",
                    color: activeTab===t.key ? "var(--navy-900)" : "var(--gray-600)",
                    borderRadius:"30px", padding:".1rem .5rem",
                    fontSize:".7rem", fontWeight:700,
                  }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color:"var(--gold-500)", width:"2.5rem", height:"2.5rem" }} />
            <p className="mt-3" style={{ color:"var(--gray-500)", fontFamily:"var(--font-serif)" }}>
              Loading appointments...
            </p>
          </div>
        ) : list.length === 0 ? (
          <div className="lm-card lm-empty-state">
            <div className="icon">📅</div>
            <h5>{activeTab === "upcoming" ? "No Upcoming Appointments" : "No Appointment History"}</h5>
            <p>{activeTab === "upcoming"
              ? "Book a consultation with a verified advocate"
              : "Your past appointments will appear here"}</p>
            {activeTab === "upcoming" && (
              <Link to="/advocates" className="btn btn-gold mt-2 px-4">Find an Advocate</Link>
            )}
          </div>
        ) : (
          <div className="row justify-content-center">
            <div className="col-12 col-lg-9">
              {list.map((a) => <AppCard key={a._id} appt={a} />)}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelId && (
        <div className="modal show d-block" style={{ background:"rgba(6,14,30,.65)" }}>
          <div className="modal-dialog modal-dialog-centered mx-2 mx-sm-auto">
            <div className="modal-content" style={{ borderRadius:"var(--radius-lg)", border:"none", boxShadow:"var(--shadow-xl)" }}>
              {/* Modal header */}
              <div style={{
                background:"linear-gradient(135deg,var(--navy-800),var(--navy-900))",
                borderRadius:"var(--radius-lg) var(--radius-lg) 0 0",
                padding:"1.1rem 1.25rem",
                display:"flex", justifyContent:"space-between", alignItems:"center",
              }}>
                <h5 style={{ fontFamily:"var(--font-serif)", fontWeight:700, color:"var(--white)", margin:0, fontSize:"1rem" }}>
                  Cancel Appointment
                </h5>
                <button style={{ background:"rgba(255,255,255,.1)", border:"none", color:"var(--white)", width:28, height:28, borderRadius:"50%", cursor:"pointer", fontSize:".85rem" }}
                  onClick={() => setCancelId(null)}>✕</button>
              </div>

              <div className="p-4">
                <p style={{ color:"var(--gray-600)", fontSize:".88rem", marginBottom:"1.1rem" }}>
                  Please provide a reason for cancellation (optional).
                </p>
                <textarea className="form-control" rows={3}
                  placeholder="Why are you cancelling?"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{ borderRadius:"var(--radius-sm)", fontSize:".9rem" }} />
              </div>

              <div style={{ padding:"0 1.25rem 1.25rem", display:"flex", gap:".6rem", justifyContent:"flex-end", flexWrap:"wrap" }}>
                <button className="btn btn-outline-gold btn-sm" onClick={() => setCancelId(null)}>
                  Keep Appointment
                </button>
                <button onClick={handleCancel} disabled={cancelling}
                  style={{ background:"linear-gradient(135deg,#dc2626,#b91c1c)", border:"none", color:"var(--white)", fontWeight:600, padding:".45rem 1.25rem", borderRadius:"var(--radius-sm)", cursor:"pointer", fontSize:".88rem" }}>
                  {cancelling
                    ? <><span className="spinner-border spinner-border-sm me-2" />Cancelling...</>
                    : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
    </>
  );
}

export default MyAppointments;
