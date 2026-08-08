const CARDS = [
  { key:"totalPaid",       label:"Total Paid",       icon:"✅", accent:"#059669" },
  { key:"totalDue",        label:"Total Due",         icon:"💰", accent:"#c9a84c" },
  { key:"pendingPayments", label:"Pending Payments",  icon:"⏳", accent:"#d97706" },
  { key:"totalInvoices",   label:"Total Invoices",    icon:"📄", accent:"#2563eb" },
];

const fmt = (key, val) => {
  const n = Number(val || 0);
  if (key === "totalPaid" || key === "totalDue") return `₹${n.toLocaleString("en-IN")}`;
  return n;
};

export default function PaymentSummary({ summary }) {
  return (
    <div className="row g-3 mb-4">
      {CARDS.map(({ key, label, icon, accent }) => (
        <div className="col-6 col-lg-3" key={key}>
          <div style={{
            background: "#fff", borderRadius: 18,
            boxShadow: "0 4px 16px rgba(6,14,30,.09)",
            padding: "1.5rem 1.25rem", borderTop: `3px solid ${accent}`,
            textAlign: "center", height: "100%",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: `${accent}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.4rem", margin: "0 auto .75rem",
            }}>
              {icon}
            </div>
            <div style={{
              fontFamily: "'Playfair Display',Georgia,serif",
              fontSize: "1.75rem", fontWeight: 800,
              color: "#0a1628", lineHeight: 1, marginBottom: ".3rem",
            }}>
              {fmt(key, summary?.[key])}
            </div>
            <div style={{
              fontSize: ".74rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: ".07em", color: "#6b7280",
            }}>
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
