/**
 * Cases.jsx  —  /admin/cases
 * ────────────────────────────
 * GET /api/admin/cases          ?status&category&page&limit
 * PUT /api/admin/cases/:id/status  { status }   ✅ registered in adminRoutes.js
 * PUT /api/admin/cases/:id/assign  TODO — not yet implemented in backend
 */
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../components/Admin/AdminLayout";
import ConfirmModal from "../../components/Admin/ConfirmModal";
import { getAllCases, updateCaseStatus } from "../../services/adminService";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_STYLE = {
  Hearing:    { bg: "rgba(59,130,246,.12)",  color: "#1e40af" },
  Active:     { bg: "rgba(16,185,129,.12)",  color: "#065f46" },
  Pending:    { bg: "rgba(245,158,11,.12)",  color: "#92400e" },
  Closed:     { bg: "rgba(107,114,128,.12)", color: "#374151" },
  Dismissed:  { bg: "rgba(239,68,68,.10)",   color: "#991b1b" },
  Resolved:   { bg: "rgba(16,185,129,.10)",  color: "#065f46" },
  "Under Review": { bg: "rgba(139,92,246,.1)", color: "#5b21b6" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: "var(--gray-100)", color: "var(--gray-600)" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "2px 10px", fontSize: ".7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
      {status || "—"}
    </span>
  );
}

const STATUSES   = ["Active","Pending","Hearing","Resolved","Closed","Dismissed","In Progress"];
const CATEGORIES = ["Criminal Law","Civil Law","Family Law","Corporate Law","Property Law","Labour Law","Tax Law","Constitutional Law","Cyber Law"];
/* Valid statuses accepted by updateCaseStatus controller */
const UPDATE_STATUSES = ["Pending","In Progress","Hearing","Closed"];

export default function Cases() {
  const [cases,      setCases     ] = useState([]);
  const [loading,    setLoading   ] = useState(true);
  const [error,      setError     ] = useState(null);
  const [search,     setSearch    ] = useState("");
  const [status,     setStatus    ] = useState("");
  const [category,   setCategory  ] = useState("");
  const [page,       setPage      ] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal     ] = useState(0);
  const[assignModal,setAssignModal]= useState(null);

  /* Status update modal */
  const [statusModal,  setStatusModal ] = useState(null);  // { caseId, caseNumber, current }
  const [newStatus,    setNewStatus   ] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const PAGE = 10;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getAllCases({ status: status || undefined, category: category || undefined, page, limit: PAGE });
      const d = res.data;
      setCases(d.cases ?? []);

     
      setTotalPages(d.totalPages ?? 1);
      /* getAllCases controller returns totalCases, not total */
      setTotal(d.totalCases ?? d.totalCount ?? d.total ?? 0);
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to load cases";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  }, [status, category, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status, category]);

  /* search is client-side — caseTitle field not title */
  const visible = search.trim()
    ? cases.filter((c) =>
        [c.caseTitle, c.caseNumber, c.clientName, c.advocateId?.fullName , c.userId?.name]
          .some((f) => String(f ?? "").toLowerCase().includes(search.toLowerCase()))
      )
    : cases;

  const handleStatusUpdate = async () => {
    if (!newStatus || !statusModal) return;
    setUpdatingStatus(true);
    try {
      await updateCaseStatus(statusModal.caseId, newStatus);
      toast.success(`Case status updated to "${newStatus}"`);
      setStatusModal(null);
      setNewStatus("");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Status update failed");
    } finally { setUpdatingStatus(false); }
  };

  console.log("assignModal state =", assignModal);
 




  return (
    <AdminLayout title="Cases">
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="lm-gold-bar" style={{ marginBottom: ".5rem" }} />
        <h4 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, color: "var(--navy-800)", margin: 0 }}>Case Management</h4>
        <p style={{ color: "var(--gray-500)", fontSize: ".88rem", margin: 0 }}>{total} total cases</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 340 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)", pointerEvents: "none" }}>🔍</span>
          <input type="text" className="form-control" placeholder="Search title, case no., client…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32, borderRadius: 8, height: 40, fontSize: ".88rem" }} />
        </div>
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}
          style={{ borderRadius: 8, height: 40, fontSize: ".88rem", maxWidth: 170 }}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}
          style={{ borderRadius: 8, height: 40, fontSize: ".88rem", maxWidth: 190 }}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button onClick={load} className="btn btn-outline-secondary" style={{ borderRadius: 8, height: 40, fontSize: ".88rem" }}>🔄 Refresh</button>
      </div>

      {/* ── Table card ── */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)", boxShadow: "0 2px 12px rgba(6,14,30,.06)", overflow: "hidden" }}>
        {loading ? (
          <div className="p-5 text-center"><div className="lm-spinner" /><p style={{ color: "var(--gray-500)", fontSize: ".88rem", marginTop: 12 }}>Loading cases…</p></div>
        ) : error ? (
          <div className="p-4"><div className="alert alert-danger d-flex justify-content-between align-items-center" style={{ borderRadius: 10, margin: 0 }}>
            <span>⚠️ {error}</span><button className="btn btn-sm btn-danger" onClick={load} style={{ borderRadius: 6 }}>Retry</button>
          </div></div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
                <thead>
                  <tr style={{ background: "var(--navy-800)" }}>
                    {["Case No.","Title","Client","Advocate","Category","Status","Filed","Actions"].map((h) => (
                      <th key={h} style={{ padding: ".75rem 1rem", fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "rgba(255,255,255,.9)", border: "none", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "var(--gray-400)" }}>No cases found</td></tr>
                  ) : visible.map((c, idx) => (
                    <tr key={c._id} style={{ borderBottom: "1px solid var(--gray-100)", background: idx % 2 === 0 ? "#fff" : "var(--gray-50)" }}>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".78rem", fontFamily: "monospace", color: "var(--gray-500)" }}>
                        {c.caseNumber || c._id.slice(-8).toUpperCase()}
                      </td>
                      <td style={{ padding: ".75rem 1rem", maxWidth: 180 }}>
                        <div style={{ fontWeight: 600, fontSize: ".85rem", color: "var(--navy-800)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.caseTitle || "—"}</div>
                      </td>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".85rem", color: "var(--gray-700)" }}>
                        {c.userId?.name || c.clientName || "—"}
                      </td>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".85rem", color: "var(--gray-700)" }}>
                        {c.advocateId?.fullName
                          || (c.advocateId ? <span style={{ color: "var(--gray-400)", fontStyle: "italic", fontSize: ".78rem" }}>ID: {String(c.advocateId).slice(-6)}</span> : <span style={{ color: "var(--gray-400)", fontStyle: "italic" }}>Unassigned</span>)}
                      </td>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".82rem", color: "var(--gray-600)" }}>{c.category || "—"}</td>
                      <td style={{ padding: ".75rem 1rem" }}><StatusBadge status={c.status} /></td>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".82rem", color: "var(--gray-500)", whiteSpace: "nowrap" }}>{fmtDate(c.filingDate || c.createdAt)}</td>
                      <td style={{ padding: ".75rem 1rem" }}>
                        <div style={{ display: "flex", gap: ".35rem" }}>
                          {/* Assign Advocate — TODO backend endpoint */}

                          <button
  onClick={() =>{ console.log("Assign clicked",c) ;
    console.log("advocateId =", c.advocateId);
console.log("Full case =", c);


    setAssignModal(c)}}
  style={{
    background: "rgba(139,92,246,.1)",
    border: "none",
    borderRadius: 6,
    padding: "4px 9px",
    cursor: "pointer",
    fontSize: ".72rem",
    color: "#5b21b6",
    fontWeight: 600,
  }}
  title="Assign Advocate"
>
  ⚖️ Assign
</button>


                         
                         <button   onClick={() => { setStatusModal({ caseId: c._id, caseNumber: c.caseNumber, current: c.status }); setNewStatus(c.status); }}
                            style={{ background: "rgba(16,185,129,.1)", border: "none", borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontSize: ".72rem", color: "#065f46", fontWeight: 600 }}
                            title="Update Status"
                          >✏️ Status</button>
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



      {assignModal && (
  <>
    <div
      onClick={() => setAssignModal(null)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        zIndex: 9998,
      }}
    />

    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "500px",
        maxWidth: "90%",
        background: "#fff",
        borderRadius: "12px",
        padding: "24px",
        zIndex: 9999,
        boxShadow: "0 20px 50px rgba(0,0,0,.3)",
      }}
    >
      <h4>Assign Advocate</h4>

      <hr />

      <p><strong>Case:</strong> {assignModal.caseTitle}</p>

      <p><strong>Current Advocate:</strong> {assignModal.advocateId?.fullName || "Unassigned"}</p>

      <div className="d-flex justify-content-end mt-3">
        <button
          className="btn btn-secondary"
          onClick={() => setAssignModal(null)}
        >
          Close
        </button>
      </div>
    </div>
  </>
)}


      

      {/* ── Status Update Modal ── */}
      {statusModal && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(6,14,30,.45)", zIndex: 1050 }}
            onClick={() => setStatusModal(null)} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            background: "#fff", borderRadius: 16, zIndex: 1055,
            width: "min(420px, calc(100vw - 32px))",
            boxShadow: "0 20px 60px rgba(6,14,30,.25)", overflow: "hidden",
          }}>
            <div style={{ background: "var(--navy-800)", padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h6 style={{ color: "#fff", fontFamily: "var(--font-serif)", fontWeight: 700, margin: 0 }}>
                Update Case Status
              </h6>
              <button onClick={() => setStatusModal(null)}
                style={{ background: "rgba(255,255,255,.1)", border: "none", color: "#fff", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: ".9rem" }}>✕</button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ fontSize: ".88rem", color: "var(--gray-600)", marginBottom: "1.25rem" }}>
                Case: <strong style={{ fontFamily: "monospace", color: "var(--navy-800)" }}>{statusModal.caseNumber}</strong>
                <br />Current status: <StatusBadge status={statusModal.current} />
              </p>
              <label style={{ display: "block", fontWeight: 600, fontSize: ".78rem", color: "var(--navy-800)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".5rem" }}>
                New Status
              </label>
              <select
                className="form-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ borderRadius: 8, fontSize: ".9rem", marginBottom: "1.25rem" }}
              >
                {UPDATE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ display: "flex", gap: ".75rem" }}>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus || newStatus === statusModal.current}
                  className="btn btn-gold"
                  style={{ borderRadius: 8, fontSize: ".85rem", flex: 1 }}
                >
                  {updatingStatus
                    ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                    : "✅ Update Status"}
                </button>
                <button onClick={() => setStatusModal(null)} className="btn btn-outline-secondary"
                  style={{ borderRadius: 8, fontSize: ".85rem" }}>Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}

    </AdminLayout>
  );
}