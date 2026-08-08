import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";


const STATUS_STYLE = {
  Pending:      { bg: "rgba(245,158,11,.12)", color: "#d97706", border: "rgba(245,158,11,.3)" },
  "In Progress":{ bg: "rgba(59,130,246,.12)", color: "#2563eb", border: "rgba(59,130,246,.3)" },
  Hearing:      { bg: "rgba(139,92,246,.12)", color: "#7c3aed", border: "rgba(139,92,246,.3)" },
  Closed:       { bg: "rgba(107,114,128,.1)", color: "#6b7280", border: "rgba(107,114,128,.3)" },
};

function CaseTracker() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 6 });
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      const res = await api.get(`/api/cases/my?${params}`);
      setCases(res.data.cases || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCases(res.data.totalCases || 0);
    } catch { toast.error("Failed to load cases"); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); setSearch(searchInput.trim()); };

  const loadTimeline = async (caseId) => {
    if (expandedId === caseId) { setExpandedId(null); return; }
    setExpandedId(caseId);
    setTimelineLoading(true);
    try {
      const res = await api.get(`/api/cases/${caseId}/timeline`);
      setTimeline(res.data.timeline || []);
    } catch { toast.error("Failed to load timeline"); }
    finally { setTimelineLoading(false); }
  };

  return (
    <>
      

      <div className="lm-page-header">
        <div className="container lm-page-header-content d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="lm-gold-bar" />
            <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, fontSize: "2.2rem", marginBottom: ".3rem" }}>
              Case Tracker
            </h1>
            <p style={{ opacity: .75, marginBottom: 0 }}>Monitor all your active legal cases in real-time</p>
          </div>
          {totalCases > 0 && (
            <div style={{ background: "rgba(201,168,76,.15)", border: "1px solid rgba(201,168,76,.3)", borderRadius: "var(--radius-md)", padding: ".75rem 1.25rem", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 800, color: "var(--gold-400)", lineHeight: 1 }}>{totalCases}</div>
              <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.55)", textTransform: "uppercase", letterSpacing: ".07em" }}>Total Cases</div>
            </div>
          )}
        </div>
      </div>

      <div className="container py-4 py-lg-5">

        {/* Search + Filter */}
        <div className="lm-card p-3 p-md-4 mb-4 mb-md-5">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-6">
              <label style={{ fontWeight: 700, fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--navy-700)", display: "block", marginBottom: ".4rem" }}>
                Search Cases
              </label>
              <form onSubmit={handleSearch} className="d-flex gap-2">
                <input type="text" className="form-control flex-grow-1" placeholder="Case number or title..."
                  value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                  style={{ borderRadius: "var(--radius-sm)", minWidth: 0 }} />
                <button type="submit" className="btn btn-navy px-3 flex-shrink-0" style={{ borderRadius: "var(--radius-sm)" }}>🔍</button>
              </form>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <label style={{ fontWeight: 700, fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--navy-700)", display: "block", marginBottom: ".4rem" }}>
                Status
              </label>
              <select className="form-select" value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                style={{ borderRadius: "var(--radius-sm)" }}>
                <option value="">All Statuses</option>
                {["Pending","In Progress","Hearing","Closed"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <button className="btn btn-outline-gold w-100" style={{ borderRadius: "var(--radius-sm)" }}
                onClick={() => { setSearch(""); setSearchInput(""); setStatusFilter(""); setPage(1); }}>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: "var(--gold-500)", width: "3rem", height: "3rem" }} />
            <p className="mt-3" style={{ color: "var(--gray-500)", fontFamily: "var(--font-serif)" }}>Loading your cases...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="lm-card lm-empty-state">
            <div className="icon">⚖️</div>
            <h5>{search || statusFilter ? "No Cases Match Your Search" : "No Cases Yet"}</h5>
            <p>{search || statusFilter ? "Try adjusting your filters" : "Your legal cases will appear here once created"}</p>
            <Link to="/advocates" className="btn btn-gold mt-2 px-4">Find an Advocate</Link>
          </div>
        ) : (
          <>
            <div className="row g-4">
              {cases.map((c) => {
                const st = STATUS_STYLE[c.status] || STATUS_STYLE.Closed;
                return (
                  <div className="col-12 col-lg-6" key={c._id}>
                    <div className="lm-card h-100">
                      <div className="p-4">
                        {/* Header — case number + title + status */}
                        <div className="d-flex justify-content-between align-items-start mb-3 gap-2">
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <span style={{ background: "var(--navy-800)", color: "var(--gold-400)", padding: ".2rem .7rem", borderRadius: "30px", fontSize: ".73rem", fontWeight: 700, letterSpacing: ".04em", display: "inline-block", marginBottom: ".5rem" }}>
                              {c.caseNumber}
                            </span>
                            <h5 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--navy-800)", marginBottom: 0, fontSize: "1rem", wordBreak: "break-word" }}>
                              {c.caseTitle}
                            </h5>
                          </div>
                          <span style={{ background: st.bg, color: st.color, borderRadius: "30px", padding: ".25rem .9rem", fontSize: ".75rem", fontWeight: 700, whiteSpace: "nowrap", border: `1px solid ${st.border}`, flexShrink: 0 }}>
                            {c.status}
                          </span>
                        </div>

                        {/* Details grid — responsive 2-col */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: ".4rem .75rem", marginBottom: "1rem" }}>
                          {[
                            ["👨‍💼", "Advocate", c.advocateId?.fullName || "—"],
                            ["⚖️", "Category", c.category],
                            ["🏛️", "Court", c.courtName],
                            ["📅", "Filed", new Date(c.filingDate).toLocaleDateString("en-IN")],
                          ].map(([icon, label, val]) => (
                            <div key={label} style={{ fontSize: ".82rem", color: "var(--gray-600)", minWidth: 0 }}>
                              <span style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: ".05em", color: "var(--gray-400)", display: "block", marginBottom: ".1rem" }}>{label}</span>
                              <span style={{ fontWeight: 600, color: "var(--navy-800)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{icon} {val}</span>
                            </div>
                          ))}
                        </div>

                        {c.nextHearingDate && (
                          <div style={{ background: "rgba(139,92,246,.08)", border: "1px solid rgba(139,92,246,.2)", borderRadius: "var(--radius-sm)", padding: ".6rem 1rem", marginBottom: "1rem", fontSize: ".84rem" }}>
                            <span style={{ color: "#7c3aed", fontWeight: 700 }}>📅 Next Hearing: </span>
                            <span style={{ color: "var(--navy-800)", fontWeight: 600 }}>
                              {new Date(c.nextHearingDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                          </div>
                        )}

                        {c.description && (
                          <p style={{ fontSize: ".84rem", color: "var(--gray-500)", marginBottom: "1rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {c.description}
                          </p>
                        )}

                        <button className="btn btn-outline-gold w-100 btn-sm" onClick={() => loadTimeline(c._id)}>
                          {expandedId === c._id ? "▲ Hide Timeline" : "▼ View Timeline"}
                        </button>
                      </div>

                      {/* Timeline Drawer */}
                      {expandedId === c._id && (
                        <div style={{ borderTop: "1px solid var(--gray-100)", background: "var(--gray-50)", padding: "1.25rem 1.5rem", borderRadius: "0 0 var(--radius-lg) var(--radius-lg)" }}>
                          {timelineLoading ? (
                            <div className="text-center py-3">
                              <div className="spinner-border spinner-border-sm" style={{ color: "var(--gold-500)" }} />
                            </div>
                          ) : timeline.length === 0 ? (
                            <p style={{ color: "var(--gray-500)", fontSize: ".84rem", margin: 0 }}>No timeline events yet</p>
                          ) : (
                            <div style={{ paddingLeft: "1rem", borderLeft: "2px solid var(--gold-300)" }}>
                              {timeline.map((ev, idx) => (
                                <div key={idx} style={{ position: "relative", marginBottom: "1rem", paddingLeft: ".75rem" }}>
                                  <span style={{ position: "absolute", left: "-1.35rem", top: ".25rem", width: 10, height: 10, borderRadius: "50%", background: "var(--gold-500)", border: "2px solid var(--white)", display: "block" }} />
                                  <p style={{ fontWeight: 700, fontSize: ".84rem", color: "var(--navy-800)", margin: 0 }}>{ev.event}</p>
                                  {ev.description && <p style={{ fontSize: ".78rem", color: "var(--gray-500)", margin: ".1rem 0 .2rem" }}>{ev.description}</p>}
                                  <small style={{ color: "var(--gray-400)", fontSize: ".72rem" }}>
                                    {new Date(ev.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    {ev.performedBy && ` · ${ev.performedBy}`}
                                  </small>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-4 mt-5">
                <button className="btn btn-outline-gold" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Previous</button>
                <span style={{ color: "var(--gray-500)", fontSize: ".9rem" }}>Page {page} of {totalPages}</span>
                <button className="btn btn-outline-gold" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    
    </>
  );
}

export default CaseTracker;
