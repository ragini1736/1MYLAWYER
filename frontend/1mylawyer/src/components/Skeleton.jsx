/**
 * Skeleton.jsx
 * ------------
 * Reusable skeleton loading components.
 *
 * WHY skeletons instead of spinners?
 *   Spinners = user stares at a spinning wheel with no idea of layout.
 *   Skeletons = user sees the shape of what's loading, feels faster.
 *   Research: skeletons reduce perceived load time by ~30%.
 *
 * USAGE:
 *   import { SkeletonCard, SkeletonStatCard, SkeletonList } from "../components/Skeleton";
 *
 *   {loading ? <SkeletonStatGrid /> : <RealContent />}
 *
 * All components use the .lm-skeleton CSS class which applies the shimmer.
 */

/* ── Base block ─────────────────────────────────────────────── */
export const SkeletonBlock = ({ height = "1rem", width = "100%", className = "" }) => (
  <span
    className={`lm-skeleton ${className}`}
    style={{ height, width, display: "block" }}
  />
);

/* ── Text lines ─────────────────────────────────────────────── */
export const SkeletonText = ({ lines = 3, lastWidth = "60%" }) => (
  <div>
    {Array.from({ length: lines }).map((_, i) => (
      <span
        key={i}
        className="lm-skeleton lm-skeleton-text"
        style={{ width: i === lines - 1 ? lastWidth : "100%", display: "block" }}
      />
    ))}
  </div>
);

/* ── Single stat card ───────────────────────────────────────── */
export const SkeletonStatCard = () => (
  <div className="lm-stat-card" style={{ pointerEvents: "none" }}>
    <span className="lm-skeleton lm-skeleton-circle" style={{ width: 52, height: 52, display: "block", margin: "0 auto .75rem" }} />
    <span className="lm-skeleton" style={{ height: "2.2rem", width: "60%", display: "block", margin: "0 auto .4rem" }} />
    <span className="lm-skeleton" style={{ height: ".75rem", width: "40%", display: "block", margin: "0 auto" }} />
  </div>
);

/* ── 4-col stat grid (matches Dashboard) ───────────────────── */
export const SkeletonStatGrid = () => (
  <div className="row g-3 g-md-4 mb-4 mb-md-5">
    {[0, 1, 2, 3].map((i) => (
      <div className="col-6 col-lg-3" key={i}>
        <SkeletonStatCard />
      </div>
    ))}
  </div>
);

/* ── Advocate card ──────────────────────────────────────────── */
export const SkeletonAdvocateCard = () => (
  <div className="lm-advocate-card" style={{ pointerEvents: "none" }}>
    <div className="p-4">
      <div className="d-flex align-items-center gap-3 mb-3">
        <span className="lm-skeleton lm-skeleton-circle flex-shrink-0" style={{ width: 56, height: 56, display: "block" }} />
        <div style={{ flex: 1 }}>
          <span className="lm-skeleton" style={{ height: "1rem", width: "70%", display: "block", marginBottom: ".4rem" }} />
          <span className="lm-skeleton" style={{ height: ".75rem", width: "50%", display: "block" }} />
        </div>
      </div>
      <span className="lm-skeleton" style={{ height: ".75rem", display: "block", marginBottom: ".4rem" }} />
      <span className="lm-skeleton" style={{ height: ".75rem", width: "80%", display: "block", marginBottom: ".4rem" }} />
      <span className="lm-skeleton" style={{ height: ".75rem", width: "60%", display: "block", marginBottom: "1rem" }} />
      <span className="lm-skeleton" style={{ height: "1.5rem", width: "40%", display: "block", borderRadius: "30px" }} />
    </div>
    <div style={{ padding: ".75rem 1.25rem", borderTop: "1px solid var(--gray-100)", display: "flex", gap: ".6rem" }}>
      <span className="lm-skeleton" style={{ height: "2.2rem", flex: 1, display: "block", borderRadius: "var(--radius-sm)" }} />
      <span className="lm-skeleton" style={{ height: "2.2rem", flex: 1, display: "block", borderRadius: "var(--radius-sm)" }} />
    </div>
  </div>
);

/* ── 3-col advocate grid ────────────────────────────────────── */
export const SkeletonAdvocateGrid = ({ count = 6 }) => (
  <div className="row g-4">
    {Array.from({ length: count }).map((_, i) => (
      <div className="col-12 col-md-6 col-lg-4" key={i}>
        <SkeletonAdvocateCard />
      </div>
    ))}
  </div>
);

/* ── Appointment card ───────────────────────────────────────── */
export const SkeletonAppointmentCard = () => (
  <div className="lm-card mb-3">
    <div className="p-3 p-md-4">
      <div className="d-flex align-items-start gap-3">
        <span className="lm-skeleton lm-skeleton-circle flex-shrink-0" style={{ width: 44, height: 44, display: "block" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="lm-skeleton" style={{ height: ".95rem", width: "55%", display: "block", marginBottom: ".4rem" }} />
          <span className="lm-skeleton" style={{ height: ".75rem", width: "75%", display: "block", marginBottom: ".3rem" }} />
          <span className="lm-skeleton" style={{ height: ".7rem",  width: "50%", display: "block" }} />
        </div>
        <span className="lm-skeleton" style={{ height: "1.6rem", width: 72, display: "block", borderRadius: "30px", flexShrink: 0 }} />
      </div>
    </div>
  </div>
);

/* ── Case card ──────────────────────────────────────────────── */
export const SkeletonCaseCard = () => (
  <div className="lm-card h-100">
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-start mb-3 gap-2">
        <div style={{ flex: 1 }}>
          <span className="lm-skeleton" style={{ height: "1.3rem", width: "40%", display: "block", borderRadius: "30px", marginBottom: ".5rem" }} />
          <span className="lm-skeleton" style={{ height: "1rem", width: "70%", display: "block" }} />
        </div>
        <span className="lm-skeleton" style={{ height: "1.6rem", width: 72, display: "block", borderRadius: "30px", flexShrink: 0 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem .75rem", marginBottom: "1rem" }}>
        {[0,1,2,3].map(i => (
          <div key={i}>
            <span className="lm-skeleton" style={{ height: ".65rem", width: "50%", display: "block", marginBottom: ".25rem" }} />
            <span className="lm-skeleton" style={{ height: ".85rem", display: "block" }} />
          </div>
        ))}
      </div>
      <span className="lm-skeleton" style={{ height: "2.1rem", display: "block", borderRadius: "var(--radius-sm)" }} />
    </div>
  </div>
);

/* ── Notification item ──────────────────────────────────────── */
export const SkeletonNotificationItem = () => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: ".85rem", padding: ".9rem 1rem", border: "1px solid var(--gray-100)", borderRadius: "var(--radius-md)", marginBottom: ".5rem", background: "var(--white)" }}>
    <span className="lm-skeleton lm-skeleton-circle" style={{ width: 40, height: 40, display: "block", flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <span className="lm-skeleton" style={{ height: ".9rem", width: "40%", display: "block", marginBottom: ".4rem" }} />
      <span className="lm-skeleton" style={{ height: ".75rem", display: "block", marginBottom: ".3rem" }} />
      <span className="lm-skeleton" style={{ height: ".75rem", width: "80%", display: "block" }} />
    </div>
  </div>
);

/* ── Page header skeleton ───────────────────────────────────── */
export const SkeletonPageHeader = () => (
  <div className="lm-page-header" style={{ minHeight: 100 }}>
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <span className="lm-skeleton" style={{ height: "3px", width: 48, display: "block", marginBottom: "1rem", background: "rgba(201,168,76,.3)" }} />
      <span className="lm-skeleton" style={{ height: "2rem", width: "45%", display: "block", marginBottom: ".75rem", background: "rgba(255,255,255,.15)" }} />
      <span className="lm-skeleton" style={{ height: "1rem", width: "30%", display: "block", background: "rgba(255,255,255,.1)" }} />
    </div>
  </div>
);

/* ── Full loading screen ────────────────────────────────────── */
export const SkeletonFullPage = ({ message = "Loading..." }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: "1rem" }}>
    <div className="lm-spinner lm-spinner-lg" />
    <p style={{ color: "var(--gray-400)", fontFamily: "var(--font-serif)", fontSize: "1rem", margin: 0 }}>
      {message}
    </p>
  </div>
);

export default SkeletonBlock;
