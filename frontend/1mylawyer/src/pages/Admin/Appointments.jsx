/**
 * Appointments.jsx
 * ─────────────────
 * Route: /admin/appointments
 * Real endpoint: GET /api/admin/appointments ?status&page&limit
 */
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../components/Admin/AdminLayout";
import { getAllAppointments, updateAppointmentStatus, deleteAppointment } from "../../services/adminService";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_STYLE = {
  Approved:   { bg: "rgba(16,185,129,.12)",  color: "#065f46" },   // shown as "Confirmed"
  Pending:    { bg: "rgba(245,158,11,.12)",  color: "#92400e" },
  Cancelled:  { bg: "rgba(239,68,68,.10)",   color: "#991b1b" },
  Completed:  { bg: "rgba(59,130,246,.10)",  color: "#1e40af" },
  Rejected:   { bg: "rgba(107,114,128,.12)", color: "#374151" },
};

// Display label shown on the chip — maps DB value → human label
const STATUS_LABEL = {
  Approved:  "Confirmed",
  Pending:   "Pending",
  Cancelled: "Cancelled",
  Completed: "Completed",
  Rejected:  "Rejected",
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: "var(--gray-100)", color: "var(--gray-600)" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "2px 10px", fontSize: ".7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
      {STATUS_LABEL[status] || status || "—"}
    </span>
  );
}

// DB values used for API filtering — order matches the tab display order
const STATUSES = ["Pending", "Approved", "Completed", "Rejected", "Cancelled"];

export default function Appointments() {
  const [appts,      setAppts     ] = useState([]);
  const [loading,    setLoading   ] = useState(true);
  const [error,      setError     ] = useState(null);
  const [search,     setSearch    ] = useState("");
  const [status,     setStatus    ] = useState("");
  const [page,       setPage      ] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal     ] = useState(0);
  /* ── delete confirm ── */
  const [deleteId,   setDeleteId  ] = useState(null);
  const [deleting,   setDeleting  ] = useState(false);

  const PAGE = 10;


  const updateStatus = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status);
      toast.success("Status Updated Successfully");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update Failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteAppointment(deleteId);
      toast.success("Appointment deleted");
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };





  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getAllAppointments({ status: status || undefined, page, limit: PAGE });
      console.log("Appointments API=",res.data);
      const d = res.data;
      setAppts(d.appointments ?? []);
      setTotalPages(d.totalPages ?? 1);
      setTotal(d.totalCount ?? d.total ?? 0);
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to load appointments";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status]);

  const visible = search.trim()
    ? appts.filter((a) => [a.userId?.name, a.fullName,a.advocateId?.fullName, a.service, a.message]
        .some((f) => String(f ?? "").toLowerCase().includes(search.toLowerCase())))
    : appts;


   



  /* summary counts */
  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = appts.filter((a) => a.status === s).length;
    return acc;
  }, {});

  return (
    <AdminLayout title="Appointments">
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="lm-gold-bar" style={{ marginBottom: ".5rem" }} />
        <h4 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, color: "var(--navy-800)", margin: 0 }}>Appointment Management</h4>
        <p style={{ color: "var(--gray-500)", fontSize: ".88rem", margin: 0 }}>{total} total appointments</p>
      </div>

      {/* Status summary chips */}
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <button
          onClick={() => { setStatus(""); setPage(1); }}
          style={{ background: !status ? "var(--navy-800)" : "var(--gray-100)", color: !status ? "#fff" : "var(--gray-700)", border: "none", borderRadius: 20, padding: "4px 14px", fontSize: ".8rem", fontWeight: 600, cursor: "pointer", transition: "background .15s" }}
        >
          All ({total})
        </button>
        {STATUSES.map((s) => {
          const st = STATUS_STYLE[s] || { bg: "var(--gray-100)", color: "var(--gray-600)" };
          const active = status === s;
          return (
            <button key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              style={{ background: active ? st.color : st.bg, color: active ? "#fff" : st.color, border: "none", borderRadius: 20, padding: "4px 14px", fontSize: ".8rem", fontWeight: 600, cursor: "pointer", transition: "background .15s" }}
            >
              {STATUS_LABEL[s]} ({counts[s] ?? "…"})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 380 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)", pointerEvents: "none" }}>🔍</span>
          <input type="text" className="form-control" placeholder="Search client, advocate, type…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32, borderRadius: 8, height: 40, fontSize: ".88rem" }} />
        </div>
        <button onClick={load} className="btn btn-outline-secondary" style={{ borderRadius: 8, height: 40, fontSize: ".88rem" }}>🔄 Refresh</button>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)", boxShadow: "0 2px 12px rgba(6,14,30,.06)", overflow: "hidden" }}>
        {loading ? (
          <div className="p-5 text-center"><div className="lm-spinner" /><p style={{ color: "var(--gray-500)", fontSize: ".88rem", marginTop: 12 }}>Loading appointments…</p></div>
        ) : error ? (
          <div className="p-4"><div className="alert alert-danger d-flex justify-content-between align-items-center" style={{ borderRadius: 10, margin: 0 }}>
            <span>⚠️ {error}</span><button className="btn btn-sm btn-danger" onClick={load} style={{ borderRadius: 6 }}>Retry</button>
          </div></div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr style={{ background: "var(--navy-800)" }}>
                    {["Client","Advocate","Date","Time","Type","Status","Notes","Actions"].map((h) => (
                      <th key={h} style={{ padding: ".75rem 1rem", fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "rgba(255,255,255,.9)", border: "none", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                    <td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "var(--gray-400)" }}>No appointments found</td> </tr>
                  ) : visible.map((a, idx) => (
                    <tr key={a._id} style={{ borderBottom: "1px solid var(--gray-100)", background: idx % 2 === 0 ? "#fff" : "var(--gray-50)" }}>
                     
                      
                                     
                      
                
                  
                      <td style={{padding:".75rem 1rem"}}>
                        <div style={{ fontWeight: 600, fontSize: ".88rem", color: "var(--navy-800)" }}>{a.userId?.name || a.fullName || "—"} </div>
                        <div style={{ fontSize: ".73rem", color: "var(--gray-500)" }}>{a.userId?.email ||  a.email || ""}</div>
                        </td>
                      
                      <td style={{ padding: ".75rem 1rem", fontSize: ".88rem", color: "var(--gray-700)" }}>
                        {a.advocateId?.fullName || "—"}
                      </td>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".85rem", color: "var(--gray-700)", whiteSpace: "nowrap" }}>
                        {fmtDate(a.date || a.appointmentDate)}
                      </td>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".85rem", color: "var(--gray-700)", whiteSpace: "nowrap" }}>
                        {a.time || a.timeSlot || "—"}
                      </td>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".82rem", color: "var(--gray-600)" }}>
                        {a.service|| "—"}
                      </td>
                      <td style={{ padding: ".75rem 1rem" }}><StatusBadge status={a.status} /></td>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".8rem", color: "var(--gray-500)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.message || "—"}
                      </td>


                      <td style={{ padding: ".75rem 1rem" }}>
                        <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>

                          {/* Pending: Approve + Reject + Cancel */}
                          {a.status === "Pending" && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => updateStatus(a._id, "Approved")}
                              >
                                ✅ Approve
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => updateStatus(a._id, "Rejected")}
                              >
                                ❌ Reject
                              </button>
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => updateStatus(a._id, "Cancelled")}
                              >
                                🚫 Cancel
                              </button>
                            </>
                          )}

                          {/* Approved: Complete + Cancel */}
                          {a.status === "Approved" && (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => updateStatus(a._id, "Completed")}
                              >
                                🏁 Complete
                              </button>
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => updateStatus(a._id, "Cancelled")}
                              >
                                🚫 Cancel
                              </button>
                            </>
                          )}

                          

                        </div>
                      </td>
              
         



                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ padding: ".75rem 1rem", borderTop: "1px solid var(--gray-100)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ".5rem" }}>
                <span style={{ fontSize: ".8rem", color: "var(--gray-500)" }}>Page {page} of {totalPages}</span>
                <div style={{ display: "flex", gap: ".35rem" }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 6, fontSize: ".8rem" }}>← Prev</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return <button key={n} onClick={() => setPage(n)} className={`btn btn-sm ${n === page ? "btn-navy" : "btn-outline-secondary"}`} style={{ borderRadius: 6, fontSize: ".8rem", minWidth: 32 }}>{n}</button>;
                  })}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 6, fontSize: ".8rem" }}>Next →</button>
                </div>
              </div>

          

            )}

            

          </>
        )}
        </div>
    </AdminLayout>
  

);
}