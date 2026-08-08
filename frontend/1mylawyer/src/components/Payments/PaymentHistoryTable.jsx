/**
 * PaymentHistoryTable.jsx
 * -----------------------
 * Self-contained component. Fetches its own data from
 * GET /api/payments/history and renders the full history table.
 *
 * Features:
 *  - Search by service, advocate, invoice no., transaction ID
 *  - Sort by Date / Amount / Status (toggle asc/desc)
 *  - Pagination (10 per page)
 *  - "View Invoice" link for Paid rows → /invoice/:id
 *  - Responsive: table on desktop, cards on mobile
 *  - Loading / error / empty states
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { format } from "date-fns";
import PaymentLoader from "./PaymentLoader";
import { fetchPaymentHistory } from "../../services/paymentService";

/* ── helpers ──────────────────────────────────── */
const fmtDate = (raw) => {
  if (!raw) return "—";
  try { return format(new Date(raw), "dd MMM yyyy"); }
  catch { return "—"; }
};

const fmtAmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_STYLE = {
  Paid:   { background: "rgba(5,150,105,.1)",  color: "#065f46", border: "1px solid rgba(5,150,105,.25)" },
  Failed: { background: "rgba(239,68,68,.09)", color: "#b91c1c", border: "1px solid rgba(239,68,68,.22)" },
};

const PAGE_SIZE = 10;

/* ── component ────────────────────────────────── */
export default function PaymentHistoryTable() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading ] = useState(true);
  const [error,    setError   ] = useState(null);
  const [search,   setSearch  ] = useState("");
  const [sortKey,  setSortKey ] = useState("paymentDate");
  const [sortDir,  setSortDir ] = useState("desc");
  const [page,     setPage    ] = useState(1);

  /* fetch */
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchPaymentHistory();
      setPayments(res.data.payments || []);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load payment history.";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  /* filter */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) =>
      [p.serviceName, p.advocateId?.fullName, p.invoiceNumber, p.razorpayPaymentId]
        .map((f) => (f || "").toLowerCase())
        .some((f) => f.includes(q))
    );
  }, [payments, search]);

  /* sort */
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av, bv;
      if (sortKey === "amount")        { av = a.amount || 0;  bv = b.amount || 0; }
      else if (sortKey === "status")   { av = a.status || ""; bv = b.status || ""; }
      else { av = new Date(a.paymentDate || 0).getTime(); bv = new Date(b.paymentDate || 0).getTime(); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages  = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated   = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };
  const sortIcon = (key) => sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";

  /* ── render ── */
  if (loading) return <PaymentLoader message="Loading payment history..." />;

  if (error) return (
    <div role="alert" style={{
      background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)",
      borderRadius: 12, color: "#b91c1c", padding: "1rem 1.5rem",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      flexWrap: "wrap", gap: "1rem",
    }}>
      <span>⚠️ {error}</span>
      <button onClick={load} style={{
        background: "#b91c1c", color: "#fff", border: "none",
        borderRadius: 6, padding: ".35rem 1rem", fontWeight: 600,
        fontSize: ".82rem", cursor: "pointer",
      }}>Retry</button>
    </div>
  );

  return (
    <>
      {/* Search bar */}
      <div className="mb-4" style={{ maxWidth: 480 }}>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: "1rem", top: "50%",
            transform: "translateY(-50%)", fontSize: "1rem",
            pointerEvents: "none", color: "#9ca3af",
          }}>🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search service, advocate, invoice, transaction…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              paddingLeft: "2.5rem", borderRadius: 10,
              border: "1.5px solid #e2e6ed", fontSize: ".9rem", height: 44,
            }}
          />
        </div>
        {search && (
          <div style={{ marginTop: ".4rem", fontSize: ".82rem", color: "#6b7280" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} found
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        /* empty state */
        <div className="text-center py-5" style={{
          background: "#fff", borderRadius: 18,
          border: "1px solid #e2e6ed",
          boxShadow: "0 4px 16px rgba(6,14,30,.07)",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
          <h5 style={{
            fontFamily: "'Playfair Display',Georgia,serif",
            color: "#0a1628", fontWeight: 700, marginBottom: ".5rem",
          }}>
            {search ? "No matching transactions" : "No Payment History Yet"}
          </h5>
          <p style={{ color: "#6b7280", fontSize: ".9rem", maxWidth: 380, margin: "0 auto 1.5rem" }}>
            {search
              ? "Try a different search term."
              : "Completed and failed payments will appear here once you make a payment."}
          </p>
          <Link to="/payment" className="btn btn-gold px-4">Go to Payments</Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="d-none d-md-block" style={{
            background: "#fff", borderRadius: 18,
            boxShadow: "0 4px 24px rgba(6,14,30,.09)",
            overflow: "hidden", border: "1px solid #e2e6ed",
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
                <thead>
                  <tr style={{ background: "#0a1628" }}>
                    {[
                      { label: "Invoice No.", key: null },
                      { label: "Service",     key: null },
                      { label: "Advocate",    key: null },
                      { label: "Amount",      key: "amount" },
                      { label: "Date",        key: "paymentDate" },
                      { label: "Status",      key: "status" },
                      { label: "Action",      key: null },
                    ].map(({ label, key }) => (
                      <th
                        key={label}
                        onClick={key ? () => toggleSort(key) : undefined}
                        style={{
                          padding: ".85rem 1rem", textAlign: "left",
                          fontSize: ".7rem", fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: ".08em",
                          color: "rgba(255,255,255,.85)", border: "none",
                          whiteSpace: "nowrap",
                          cursor: key ? "pointer" : "default",
                          userSelect: "none",
                        }}
                      >
                        {label}{key && sortIcon(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p, idx) => (
                    <tr key={p._id} style={{
                      borderBottom: "1px solid #f1f3f7",
                      background: idx % 2 === 0 ? "#fff" : "#fafbfc",
                    }}>
                      <td style={{ padding: ".85rem 1rem", fontSize: ".83rem", color: "#6b7280", fontFamily: "monospace" }}>
                        {p.invoiceNumber || `INV-${p._id.slice(-8).toUpperCase()}`}
                      </td>
                      <td style={{ padding: ".85rem 1rem", fontWeight: 600, color: "#0a1628", fontSize: ".88rem" }}>
                        {p.serviceName || "—"}
                      </td>
                      <td style={{ padding: ".85rem 1rem", color: "#374151", fontSize: ".88rem" }}>
                        {p.advocateId?.fullName || "—"}
                      </td>
                      <td style={{ padding: ".85rem 1rem", fontWeight: 700, color: "#0a1628", fontSize: ".92rem", whiteSpace: "nowrap" }}>
                        {fmtAmt(p.amount)}
                      </td>
                      <td style={{ padding: ".85rem 1rem", color: "#6b7280", fontSize: ".85rem", whiteSpace: "nowrap" }}>
                        {fmtDate(p.paymentDate)}
                      </td>
                      <td style={{ padding: ".85rem 1rem" }}>
                        <span style={{
                          ...(STATUS_STYLE[p.status] || { background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }),
                          borderRadius: 20, padding: ".25rem .85rem",
                          fontSize: ".74rem", fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: ".06em",
                          whiteSpace: "nowrap",
                        }}>
                          {p.status === "Paid" ? "✅ Paid" : "❌ Failed"}
                        </span>
                      </td>
                      <td style={{ padding: ".85rem 1rem" }}>
                        {p.status === "Paid" ? (
                          <Link to={`/invoice/${p._id}`} style={{
                            background: "#0a1628", color: "#c9a84c",
                            border: "1px solid #c9a84c", borderRadius: 6,
                            padding: ".3rem .85rem", fontSize: ".78rem",
                            fontWeight: 600, textDecoration: "none",
                            whiteSpace: "nowrap", display: "inline-block",
                          }}>
                            📄 Invoice
                          </Link>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: ".78rem" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="d-md-none d-flex flex-column gap-3">
            {paginated.map((p) => (
              <div key={p._id} style={{
                background: "#fff", borderRadius: 14,
                boxShadow: "0 2px 12px rgba(6,14,30,.08)",
                border: "1px solid #e2e6ed", padding: "1.25rem",
              }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div style={{ fontWeight: 700, color: "#0a1628", fontSize: ".95rem" }}>
                    {p.serviceName || "Legal Service"}
                  </div>
                  <span style={{
                    ...(STATUS_STYLE[p.status] || {}),
                    borderRadius: 20, padding: ".2rem .7rem",
                    fontSize: ".7rem", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: ".05em",
                  }}>
                    {p.status}
                  </span>
                </div>
                <div style={{ color: "#6b7280", fontSize: ".82rem", marginBottom: ".15rem" }}>
                  Advocate: {p.advocateId?.fullName || "—"}
                </div>
                <div style={{ color: "#6b7280", fontSize: ".82rem", marginBottom: ".15rem" }}>
                  Invoice: <span style={{ fontFamily: "monospace" }}>
                    {p.invoiceNumber || `INV-${p._id.slice(-8).toUpperCase()}`}
                  </span>
                </div>
                <div style={{ color: "#6b7280", fontSize: ".82rem", marginBottom: "1rem" }}>
                  Date: {fmtDate(p.paymentDate)}
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div style={{
                    fontFamily: "'Playfair Display',Georgia,serif",
                    fontWeight: 800, fontSize: "1.2rem", color: "#0a1628",
                  }}>
                    {fmtAmt(p.amount)}
                  </div>
                  {p.status === "Paid" && (
                    <Link to={`/invoice/${p._id}`} style={{
                      background: "#0a1628", color: "#c9a84c",
                      border: "1px solid #c9a84c", borderRadius: 6,
                      padding: ".35rem 1rem", fontSize: ".8rem",
                      fontWeight: 600, textDecoration: "none",
                    }}>
                      📄 Invoice
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">
              <div style={{ color: "#6b7280", fontSize: ".85rem" }}>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length}
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    background: currentPage === 1 ? "#f3f4f6" : "#0a1628",
                    color: currentPage === 1 ? "#9ca3af" : "#c9a84c",
                    border: "1px solid #e2e6ed", borderRadius: 8,
                    padding: ".4rem 1rem", fontSize: ".82rem", fontWeight: 600,
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                >← Prev</button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                  .reduce((acc, n, idx, arr) => {
                    if (idx > 0 && n - arr[idx - 1] > 1) acc.push("…");
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((n, i) =>
                    n === "…" ? (
                      <span key={`e${i}`} style={{ padding: ".4rem .3rem", color: "#9ca3af", fontSize: ".85rem" }}>…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        style={{
                          background: n === currentPage ? "#c9a84c" : "#fff",
                          color: n === currentPage ? "#0a1628" : "#374151",
                          border: "1px solid #e2e6ed", borderRadius: 8,
                          padding: ".4rem .85rem", fontSize: ".82rem",
                          fontWeight: n === currentPage ? 800 : 500,
                          cursor: "pointer", minWidth: 38,
                        }}
                      >{n}</button>
                    )
                  )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    background: currentPage === totalPages ? "#f3f4f6" : "#0a1628",
                    color: currentPage === totalPages ? "#9ca3af" : "#c9a84c",
                    border: "1px solid #e2e6ed", borderRadius: 8,
                    padding: ".4rem 1rem", fontSize: ".82rem", fontWeight: 600,
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                >Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
