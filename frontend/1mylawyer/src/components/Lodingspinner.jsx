/**
 * Lodingspinner.jsx (name kept as-is — imported by existing pages)
 * -----------------------------------------------------------------
 * Full-page loading state. Used when an entire page is loading.
 * Upgraded from Bootstrap blue spinner to premium gold spinner.
 *
 * Uses .lm-spinner CSS class which:
 *   - Uses var(--gold-500) as the active arc color
 *   - Uses a light rgba(gold) as the inactive track
 *   - Rotates at .75s — professional pace, not frantic
 */
function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--gray-50)",
        gap: "1.25rem",
      }}
    >
      {/* Gold spinner */}
      <div className="lm-spinner lm-spinner-lg" />

      {/* Brand mark */}
      <div style={{
        fontFamily: "var(--font-serif)",
        fontSize: "1.1rem",
        fontWeight: 700,
        color: "var(--navy-800)",
        letterSpacing: ".02em",
      }}>
        ⚖ 1My<span style={{ color: "var(--gold-500)" }}>Lawyer</span>
      </div>

      {message && (
        <p style={{
          color: "var(--gray-400)",
          fontFamily: "var(--font-sans)",
          fontSize: ".88rem",
          margin: 0,
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default LoadingSpinner;
