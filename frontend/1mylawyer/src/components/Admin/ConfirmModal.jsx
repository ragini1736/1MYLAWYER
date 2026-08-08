/**
 * ConfirmModal.jsx
 * Generic confirmation dialog using Bootstrap modal.
 *
 * Props:
 *   show        boolean
 *   onHide      () => void
 *   onConfirm   () => void
 *   title       string
 *   message     string | ReactNode
 *   confirmText string  (default "Confirm")
 *   danger      boolean (default false — red confirm button)
 *   loading     boolean (disables buttons while async action runs)
 */
export default function ConfirmModal({
  show,
  onHide,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  danger = false,
  loading = false,
}) {
  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1050 }}
        onClick={!loading ? onHide : undefined}
      />

      {/* Dialog */}
      <div
        className="modal fade show d-block"
        style={{ zIndex: 1055 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div
            className="modal-content"
            style={{ borderRadius: 16, border: "none", boxShadow: "0 20px 60px rgba(6,14,30,.25)" }}
          >
            {/* Header */}
            <div
              className="modal-header"
              style={{
                background: "var(--navy-800)",
                borderRadius: "16px 16px 0 0",
                borderBottom: "none",
                padding: "1.25rem 1.5rem",
              }}
            >
              <h5
                id="confirm-modal-title"
                className="modal-title"
                style={{ color: "#fff", fontFamily: "var(--font-serif)", fontWeight: 700, margin: 0 }}
              >
                {danger ? "⚠️ " : "❓ "}{title}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onHide}
                disabled={loading}
                aria-label="Close"
              />
            </div>

            {/* Body */}
            <div className="modal-body" style={{ padding: "1.5rem", fontSize: ".95rem", color: "var(--gray-700)" }}>
              {message}
            </div>

            {/* Footer */}
            <div
              className="modal-footer"
              style={{ borderTop: "1px solid var(--gray-100)", padding: "1rem 1.5rem", gap: ".75rem" }}
            >
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onHide}
                disabled={loading}
                style={{ borderRadius: 8, fontWeight: 600, fontSize: ".88rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${danger ? "btn-danger" : "btn-gold"}`}
                onClick={onConfirm}
                disabled={loading}
                style={{ borderRadius: 8, fontWeight: 600, fontSize: ".88rem", minWidth: 100 }}
              >
                {loading ? (
                  <span className="d-flex align-items-center gap-2">
                    <span className="spinner-border spinner-border-sm" />
                    {confirmText}…
                  </span>
                ) : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
