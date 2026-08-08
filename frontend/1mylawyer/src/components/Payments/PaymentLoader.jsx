/**
 * PaymentLoader.jsx
 * -----------------
 * Reusable full-section loading spinner for payment pages.
 * Matches the project's Navy + Gold theme.
 */
const PaymentLoader = ({ message = "Loading payment data..." }) => (
  <div
    className="d-flex flex-column align-items-center justify-content-center"
    style={{ minHeight: 320 }}
  >
    <div
      style={{
        width: 52, height: 52,
        border: "4px solid rgba(201,168,76,.2)",
        borderTopColor: "var(--gold-500, #c9a84c)",
        borderRadius: "50%",
        animation: "paymentSpin .75s linear infinite",
      }}
    />
    <p
      style={{
        marginTop: "1.25rem",
        color: "var(--gray-500, #6b7280)",
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: ".95rem",
      }}
    >
      {message}
    </p>

    {/* Keyframe injected inline — no extra CSS file needed */}
    <style>{`
      @keyframes paymentSpin { to { transform: rotate(360deg); } }
    `}</style>
  </div>
);

export default PaymentLoader;
