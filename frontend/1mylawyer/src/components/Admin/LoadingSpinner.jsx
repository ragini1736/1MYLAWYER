/**
 * LoadingSpinner.jsx
 * Centred gold spinner used across all admin pages.
 * size: "sm" | "md" (default) | "lg"
 */
export default function LoadingSpinner({ message = "Loading…", size = "md" }) {
  const dim = size === "sm" ? 28 : size === "lg" ? 56 : 40;
  const border = size === "sm" ? 3 : 4;

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: size === "lg" ? 320 : 180, gap: "1rem" }}
    >
      <div
        style={{
          width: dim, height: dim,
          border: `${border}px solid rgba(201,168,76,.2)`,
          borderTopColor: "var(--gold-500)",
          borderRadius: "50%",
          animation: "lm-spin .7s linear infinite",
        }}
      />
      {message && (
        <p style={{ color: "var(--gray-500)", fontSize: ".88rem", margin: 0 }}>
          {message}
        </p>
      )}
    </div>
  );
}
