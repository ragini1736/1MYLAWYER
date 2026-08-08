/**
 * Payments.jsx  —  /admin/payments
 * ──────────────────────────────────
 * GET /api/admin/payments   ?status&page&limit
 * ✅ Registered in adminRoutes.js: router.get("/payments", getAllPayments)
 *
 * Response shape: { success, total, totalPages, currentPage, count, payments }
 * Payment.amount is stored in paise → divide by 100 for rupees display.
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminLayout from "../../components/Admin/AdminLayout";
import { getAllPayments } from "../../services/adminService";

const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtAmt   = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_STYLE = {
  Paid:    { bg: "rgba(16,185,129,.12)", color: "#065f46" },
  Pending: { bg: "rgba(245,158,11,.12)", color: "#92400e" },
  Failed:  { bg: "rgba(239,68,68,.10)",  color: "#991b1b" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: "var(--gray-100)", color: "var(--gray-600)" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "2px 10px", fontSize: ".7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
      {status === "Paid" ? "✅ " : status === "Failed" ? "❌ " : "⏳ "}{status || "—"}
    </span>
  );
}

const STATUSES = ["Paid", "Pending", "Failed"];

export default function Payments() {
  const navigate = useNavigate();
  const [payments,   setPayments  ] = useState([]);
  const [loading,    setLoading   ] = useState(true);
  const [error,      setError     ] = useState(null);
  const [search,     setSearch    ] = useState("");
  const [status,     setStatus    ] = useState("");
  const [page,       setPage      ] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal     ] = useState(0);
  const [summary,    setSummary   ] = useState({ totalRevenue: 0, paid: 0, pending: 0, failed: 0 });
  const PAGE = 10;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getAllPayments({ status: status || undefined, page, limit: PAGE });
      const d = res.data;
      const list = d.payments ?? [];
      setPayments(list);
      setTotalPages(d.totalPages ?? 1);
      setTotal(d.total ?? d.totalCount ?? list.length);
      /* amount is stored in paise — divide by 100 for rupees */
      setSummary({
        totalRevenue: list
          .filter((p) => p.status === "Paid")
          .reduce((a, p) => a + (p.amount || 0) / 100, 0),
        paid:    list.filter((p) => p.status === "Paid").length,
        pending: list.filter((p) => p.status === "Pending").length,
        failed:  list.filter((p) => p.status === "Failed").length,
      });
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to load payments";
      setError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status]);

  const visible = search.trim()
    ? payments.filter((p) => [p.serviceName, p.userId?.name, p.invoiceNumber, p.razorpayPaymentId]
        .some((f) => String(f ?? "").toLowerCase().includes(search.toLowerCase())))
    : payments;

  return (
    <AdminLayout title="Payments">
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="lm-gold-bar" style={{ marginBottom: ".5rem" }} />
        <h4 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, color: "var(--navy-800)", margin: 0 }}>Payment Management</h4>
        <p style={{ color: "var(--gray-500)", fontSize: ".88rem", margin: 0 }}>{total} total transactions</p>
      </div>

      {/* Summary cards */}
      {!error && (
        <div className="row g-3 mb-4">
          {[
            { label: "Total Revenue", value: fmtAmt(summary.totalRevenue), icon: "💰", color: "#10b981" },
            { label: "Paid",          value: summary.paid,    icon: "✅", color: "#10b981" },
            { label: "Pending",       value: summary.pending, icon: "⏳", color: "#f59e0b" },
            { label: "Failed",        value: summary.failed,  icon: "❌", color: "#ef4444" },
          ].map((c) => (
            <div key={c.label} className="col-6 col-xl-3">
              <div style={{ background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", border: "1px solid var(--gray-200)", boxShadow: "0 2px 8px rgba(6,14,30,.05)", borderLeft: `4px solid ${c.color}`, display: "flex", alignItems: "center", gap: ".75rem" }}>
                <span style={{ fontSize: "1.4rem" }}>{c.icon}</span>
                <div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", fontWeight: 800, color: "var(--navy-800)", lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: ".72rem", color: "var(--gray-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginTop: 2 }}>{c.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status filter + Search */}
      <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 380 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)", pointerEvents: "none" }}>🔍</span>
          <input type="text" className="form-control" placeholder="Search service, user, invoice, txn ID…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32, borderRadius: 8, height: 40, fontSize: ".88rem" }} />
        </div>
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}
          style={{ borderRadius: 8, height: 40, fontSize: ".88rem", maxWidth: 160 }}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button onClick={load} className="btn btn-outline-secondary" style={{ borderRadius: 8, height: 40, fontSize: ".88rem" }}>🔄 Refresh</button>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)", boxShadow: "0 2px 12px rgba(6,14,30,.06)", overflow: "hidden" }}>
        {loading ? (
          <div className="p-5 text-center"><div className="lm-spinner" /><p style={{ color: "var(--gray-500)", fontSize: ".88rem", marginTop: 12 }}>Loading payments…</p></div>
        ) : error ? (
          <div className="p-4">
            <div className="alert alert-danger d-flex justify-content-between align-items-center" style={{ borderRadius: 10, margin: 0 }}>
              <span>⚠️ {error}</span>
              <button className="btn btn-sm btn-danger" onClick={load} style={{ borderRadius: 6 }}>Retry</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
                <thead>
                  <tr style={{ background: "var(--navy-800)" }}>
                    {["Invoice No.","User","Service","Advocate","Amount","Date","Status","Actions"].map((h) => (
                      <th key={h} style={{ padding: ".75rem 1rem", fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "rgba(255,255,255,.9)", border: "none", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "var(--gray-400)" }}>No payments found</td></tr>
                  ) : visible.map((p, idx) => (
                    <tr key={p._id} style={{ borderBottom: "1px solid var(--gray-100)", background: idx % 2 === 0 ? "#fff" : "var(--gray-50)" }}>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".78rem", fontFamily: "monospace", color: "var(--gray-500)" }}>
                        {p.invoiceNumber || `INV-${p._id.slice(-8).toUpperCase()}`}
                      </td>
                      <td style={{ padding: ".75rem 1rem" }}>
                        <div style={{ fontWeight: 600, fontSize: ".85rem", color: "var(--navy-800)" }}>{p.userId?.name || "—"}</div>
                        <div style={{ fontSize: ".73rem", color: "var(--gray-500)" }}>{p.userId?.email || ""}</div>
                      </td>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".85rem", color: "var(--gray-700)" }}>{p.serviceName || "—"}</td>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".85rem", color: "var(--gray-700)" }}>{p.advocateId?.fullName || "—"}</td>
                      <td style={{ padding: ".75rem 1rem", fontWeight: 700, color: "var(--navy-800)", fontSize: ".9rem", whiteSpace: "nowrap" }}>
                        {fmtAmt(p.amount)}
                      </td>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".82rem", color: "var(--gray-500)", whiteSpace: "nowrap" }}>
                        {fmtDate(p.paymentDate || p.createdAt)}
                      </td>
                      <td style={{ padding: ".75rem 1rem" }}><StatusBadge status={p.status} /></td>
                      <td style={{ padding: ".75rem 1rem" }}>
                        {p.status === "Paid" && (
                          <button
                            onClick={() => navigate(`/invoice/${p._id}`)}
                            style={{ background: "rgba(16,185,129,.1)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: ".75rem", color: "#065f46", fontWeight: 600 }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(16,185,129,.2)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(16,185,129,.1)"}
                          >
                            📄 Invoice
                          </button>
                        )}
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
