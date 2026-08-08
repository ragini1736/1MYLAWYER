import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PaymentLoader from "../../components/Payments/PaymentLoader";
import { fetchInvoice } from "../../services/paymentService";

const fmtDate = (raw) => {
  if (!raw) return "—";
  try { return new Date(raw).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return "—"; }
};
const fmtAmt  = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const calcTax  = (t) => +((t * 18) / 118).toFixed(2);
const calcBase = (t) => +(t - calcTax(t)).toFixed(2);

export default function InvoicePage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchInvoice(id);
      setInvoice(res.data.invoice);
    } catch (err) {
      const msg = err.response?.status === 404
        ? "Invoice not found or access denied."
        : err.response?.data?.message || "Failed to load invoice.";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const base = invoice ? calcBase(invoice.amount) : 0;
  const tax  = invoice ? calcTax(invoice.amount)  : 0;

  return (
    <>
      <style>{`
        @media print {
          .d-print-none { display: none !important; }
          body           { background: #fff !important; }
          .inv-card      { box-shadow: none !important; border: 1px solid #ddd !important;
                           border-radius: 0 !important; max-width: 100% !important; margin: 0 !important; }
          @page          { margin: 1.5cm; }
        }
      `}</style>

      <div className="d-print-none"><Navbar /></div>

      <div style={{ background: "#f8f9fc", minHeight: "100vh", paddingBottom: "3rem" }}>

        {/* ─ Page Header ─ */}
        <div className="lm-page-header d-print-none">
          <div className="container lm-page-header-content">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <div className="lm-gold-bar" />
                <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 800, fontSize: "clamp(1.5rem,4vw,2.2rem)", marginBottom: ".3rem" }}>
                  Invoice
                </h1>
                <p style={{ opacity: .75, marginBottom: 0, fontSize: ".9rem" }}>Official payment receipt</p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <Link to="/payment/history" className="btn btn-outline-gold btn-sm px-3">← History</Link>
                {invoice && <button onClick={() => window.print()} className="btn btn-gold btn-sm px-3">🖨 Download / Print</button>}
              </div>
            </div>
          </div>
        </div>

        <div className="container py-4 py-lg-5">

          {loading && <PaymentLoader message="Loading invoice..." />}

          {!loading && error && (
            <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 12, color: "#b91c1c", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }} role="alert">
              <span>⚠️ {error}</span>
              <div className="d-flex gap-2">
                <button onClick={load} style={{ background: "#b91c1c", color: "#fff", border: "none", borderRadius: 6, padding: ".35rem 1rem", fontWeight: 600, fontSize: ".82rem", cursor: "pointer" }}>Retry</button>
                <Link to="/payment/history" style={{ background: "#fff", color: "#b91c1c", border: "1px solid #b91c1c", borderRadius: 6, padding: ".35rem 1rem", fontWeight: 600, fontSize: ".82rem", textDecoration: "none" }}>Back</Link>
              </div>
            </div>
          )}

          {!loading && !error && invoice && (
            <>
              {/* ─ Invoice Card ─ */}
              <div className="inv-card" style={{ background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(6,14,30,.12)", maxWidth: 820, margin: "0 auto", overflow: "hidden" }}>

                {/* Navy header */}
                <div style={{ background: "linear-gradient(135deg,#0a1628 0%,#0d1f3c 100%)", padding: "2rem 2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.75rem", fontWeight: 800, color: "#fff" }}>
                      ⚖ 1My<span style={{ color: "#c9a84c" }}>Lawyer</span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,.45)", fontSize: ".74rem", marginTop: ".3rem", letterSpacing: ".07em", textTransform: "uppercase" }}>India's Premier Legal Platform</div>
                    <div style={{ color: "rgba(255,255,255,.4)", fontSize: ".78rem", marginTop: ".45rem" }}>support@1mylawyer.com</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.3rem", fontWeight: 800, color: "#c9a84c" }}>TAX INVOICE</div>
                    <div style={{ color: "rgba(255,255,255,.75)", fontSize: ".88rem", marginTop: ".35rem", fontWeight: 600 }}>
                      {invoice.invoiceNumber || `INV-${invoice._id.slice(-8).toUpperCase()}`}
                    </div>
                    <div style={{ color: "rgba(255,255,255,.45)", fontSize: ".78rem", marginTop: ".2rem" }}>Date: {fmtDate(invoice.paymentDate)}</div>
                  </div>
                </div>

                {/* Gold stripe */}
                <div style={{ height: 3, background: "linear-gradient(90deg,#c9a84c,#d4af37,#c9a84c)" }} />

                {/* Body */}
                <div style={{ padding: "2rem 2.5rem" }}>

                  {/* Billed To / Service Details */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-sm-6">
                      <div style={{ background: "#f8f9fc", borderRadius: 12, padding: "1.25rem", height: "100%" }}>
                        <div style={{ fontWeight: 700, fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".09em", color: "#c9a84c", marginBottom: ".8rem" }}>Billed To</div>
                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#0a1628" }}>{invoice.userId?.name || "Client"}</div>
                        <div style={{ color: "#6b7280", fontSize: ".85rem", marginTop: ".25rem" }}>{invoice.userId?.email || "—"}</div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div style={{ background: "#f8f9fc", borderRadius: 12, padding: "1.25rem", height: "100%" }}>
                        <div style={{ fontWeight: 700, fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".09em", color: "#c9a84c", marginBottom: ".8rem" }}>Service Details</div>
                        {[
                          ["Service",        invoice.serviceName || "Legal Consultation"],
                          ["Advocate",       invoice.advocateId?.fullName || "—"],
                          ["Specialization", invoice.advocateId?.specialization || "—"],
                          ["Payment Method", invoice.paymentMethod || "—"],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: ".3rem" }}>
                            <span style={{ color: "#6b7280", fontSize: ".82rem" }}>{k}</span>
                            <span style={{ fontWeight: 600, fontSize: ".82rem", color: "#0a1628", textAlign: "right", maxWidth: "55%", wordBreak: "break-word" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Amount table */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
                      <thead>
                        <tr style={{ background: "#0a1628" }}>
                          {["Description", "HSN/SAC", "Amount", "GST (18%)", "Total"].map(h => (
                            <th key={h} style={{ padding: ".75rem 1rem", textAlign: "left", fontSize: ".71rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "rgba(255,255,255,.9)", border: "none", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid #f1f3f7" }}>
                          <td style={{ padding: ".9rem 1rem", fontWeight: 600, color: "#0a1628" }}>{invoice.serviceName || "Legal Consultation"}</td>
                          <td style={{ padding: ".9rem 1rem", color: "#6b7280", fontSize: ".85rem" }}>998212</td>
                          <td style={{ padding: ".9rem 1rem", fontWeight: 600, color: "#0a1628", whiteSpace: "nowrap" }}>{fmtAmt(base)}</td>
                          <td style={{ padding: ".9rem 1rem", color: "#6b7280", whiteSpace: "nowrap" }}>{fmtAmt(tax)}</td>
                          <td style={{ padding: ".9rem 1rem", fontWeight: 700, color: "#a07830", whiteSpace: "nowrap" }}>{fmtAmt(invoice.amount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                    <div style={{ minWidth: 280 }}>
                      {[["Sub-total", fmtAmt(base)], ["GST @ 18%", fmtAmt(tax)]].map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: ".4rem 0", borderBottom: "1px solid #f1f3f7" }}>
                          <span style={{ color: "#6b7280", fontSize: ".88rem" }}>{k}</span>
                          <span style={{ fontWeight: 600, fontSize: ".88rem", color: "#0a1628" }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: ".65rem 0", borderTop: "2px solid #c9a84c", marginTop: ".35rem" }}>
                        <span style={{ fontWeight: 800, color: "#0a1628", fontSize: "1rem" }}>Total</span>
                        <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 800, fontSize: "1.25rem", color: "#a07830" }}>{fmtAmt(invoice.amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction references */}
                  <div style={{ background: "#f8f9fc", borderRadius: 12, padding: "1.25rem", marginTop: "2rem" }}>
                    <div style={{ fontWeight: 700, fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".09em", color: "#c9a84c", marginBottom: ".8rem" }}>Transaction References</div>
                    <div className="row g-2">
                      {[
                        ["Invoice No.",   invoice.invoiceNumber || `INV-${invoice._id.slice(-8).toUpperCase()}`],
                        ["Payment ID",   invoice.razorpayPaymentId || "—"],
                        ["Order ID",     invoice.razorpayOrderId   || "—"],
                        ["Payment Date", fmtDate(invoice.paymentDate)],
                        ["Status",       invoice.status],
                      ].map(([k, v]) => (
                        <div className="col-12 col-sm-6" key={k}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem" }}>
                            <span style={{ color: "#6b7280", fontSize: ".81rem", flexShrink: 0 }}>{k}</span>
                            <span style={{ fontWeight: 600, fontSize: ".81rem", color: k === "Status" ? "#059669" : "#0a1628", textAlign: "right", wordBreak: "break-all" }}>{v}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer note */}
                  <div style={{ borderTop: "1px solid #e2e6ed", marginTop: "2rem", paddingTop: "1.25rem", textAlign: "center", color: "#9ca3af", fontSize: ".76rem", lineHeight: 1.7 }}>
                    Thank you for choosing 1MyLawyer · This is a computer-generated invoice and does not require a signature.<br />
                    For queries: support@1mylawyer.com
                  </div>

                </div>
              </div>

              {/* Bottom action buttons */}
              <div className="d-print-none d-flex justify-content-center gap-3 mt-4 flex-wrap">
                <button onClick={() => window.print()} className="btn btn-gold px-5">🖨 Download / Print PDF</button>
                <Link to="/payment/history" className="btn btn-outline-gold px-4">Back to History</Link>
              </div>
            </>
          )}

        </div>
      </div>

      <div className="d-print-none"><Footer /></div>
    </>
  );
}
