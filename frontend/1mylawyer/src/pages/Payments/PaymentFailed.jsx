import { Link } from "react-router-dom";

export default function PaymentFailed() {
  return (
    <>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="lm-card text-center p-5">

              {/* Failed icon */}
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                margin: "0 auto 1.75rem",
                background: "rgba(239,68,68,.1)",
                border: "3px solid rgba(239,68,68,.3)",
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "3rem",
              }}>
                ❌
              </div>

              <h2 style={{
                fontFamily: "var(--font-serif, 'Playfair Display', Georgia, serif)",
                fontWeight: 800, color: "var(--navy-800, #0a1628)",
                fontSize: "1.9rem", marginBottom: ".5rem",
              }}>
                Payment Failed
              </h2>

              <p style={{ color: "var(--gray-500, #6b7280)", marginBottom: "2rem" }}>
                Your payment could not be processed. No amount has been deducted from your account.
              </p>

              <div className="d-grid gap-2">
                <Link to="/payment" className="btn btn-gold">
                  🔄 Retry Payment
                </Link>
                <Link to="/payment/history" className="btn btn-outline-gold">
                  View Payment History
                </Link>
                <Link to="/dashboard"
                  className="btn"
                  style={{
                    background: "linear-gradient(135deg, var(--navy-700, #0d1f3c), var(--navy-800, #0a1628))",
                    color: "#fff", border: "none",
                    borderRadius: "var(--radius-sm, 6px)",
                  }}>
                  Back to Dashboard
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
