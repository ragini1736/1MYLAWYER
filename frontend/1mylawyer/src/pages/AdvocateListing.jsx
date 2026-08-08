import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
//import Navbar from "../components/Navbar";
//import Footer from "../components/Footer";
import { SkeletonAdvocateGrid } from "../components/Skeleton";

const SPECIALIZATIONS = [
  "All", "Civil Law", "Criminal Law", "Family Law",
  "Property Law", "Corporate Law", "Cyber Law",
];

const AVAIL_STYLE = {
  Available: { bg: "rgba(16,185,129,.12)", color: "#059669", border: "rgba(16,185,129,.3)" },
  Busy:      { bg: "rgba(245,158,11,.12)", color: "#d97706", border: "rgba(245,158,11,.3)" },
  "On Leave":{ bg: "rgba(239,68,68,.12)",  color: "#dc2626", border: "rgba(239,68,68,.3)"  },
};

function AdvocateListing() {
  const [advocates, setAdvocates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("All");
  const [searchInput, setSearchInput] = useState("");

  const fetchAdvocates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (specialization !== "All") params.append("specialization", specialization);
      const res = await api.get(`/api/advocates?${params}`);
      setAdvocates(res.data.advocates || []);
    } catch { toast.error("Failed to load advocates"); }
    finally { setLoading(false); }
  }, [search, specialization]);

  useEffect(() => { fetchAdvocates(); }, [fetchAdvocates]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput.trim()); };
  const clearFilters = () => { setSearch(""); setSearchInput(""); setSpecialization("All"); };

  return (
    <>
    

      {/* Page Header */}
      <div className="lm-page-header">
        <div className="container lm-page-header-content text-center">
          <div className="lm-gold-bar mx-auto" />
          <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, fontSize: "2.4rem", marginBottom: ".5rem" }}>
            Find Your Legal Advocate
          </h1>
          <p style={{ opacity: .75, fontSize: "1.05rem", maxWidth: 520, margin: "0 auto" }}>
            Browse our network of verified legal professionals across all practice areas
          </p>
        </div>
      </div>

      <div className="container py-5">

        {/* Search + Filter */}
        <div className="lm-card p-4 mb-5">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-6 col-lg-4">
              <label className="form-label" style={{
                fontWeight: 700, fontSize: ".78rem", textTransform: "uppercase",
                letterSpacing: ".06em", color: "var(--navy-700)", marginBottom: ".4rem",
              }}>
                Search by Name
              </label>
              <form onSubmit={handleSearch} className="d-flex gap-2">
                <input type="text" className="form-control lm-form"
                  placeholder="e.g. Ankesh Yadav..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ borderRadius: "var(--radius-sm)" }} />
                <button type="submit" className="btn btn-navy px-3" style={{ borderRadius: "var(--radius-sm)" }}>
                  🔍
                </button>
              </form>
            </div>
            <div className="col-12 col-sm-6 col-md-4">
              <label className="form-label" style={{
                fontWeight: 700, fontSize: ".78rem", textTransform: "uppercase",
                letterSpacing: ".06em", color: "var(--navy-700)", marginBottom: ".4rem",
              }}>
                Practice Area
              </label>
              <select className="form-select" value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--gray-200)" }}>
                {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <button className="btn btn-outline-gold w-100" onClick={clearFilters}
                style={{ borderRadius: "var(--radius-sm)" }}>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {!loading && (
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
            <p style={{ color: "var(--gray-500)", margin: 0, fontSize: ".9rem" }}>
              Showing <strong style={{ color: "var(--navy-800)" }}>{advocates.length}</strong> advocate{advocates.length !== 1 ? "s" : ""}
              {specialization !== "All" && <> in <span style={{ color: "var(--gold-600)", fontWeight: 600 }}>{specialization}</span></>}
              {search && <> matching "<span style={{ color: "var(--gold-600)", fontWeight: 600 }}>{search}</span>"</>}
            </p>
            {(search || specialization !== "All") && (
              <button className="btn btn-outline-gold btn-sm" onClick={clearFilters}>
                View All Advocates
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: "var(--gold-500)", width: "3rem", height: "3rem" }} />
            <p className="mt-3" style={{ color: "var(--gray-500)", fontFamily: "var(--font-serif)", fontSize: "1.05rem" }}>
              Searching advocates...
            </p>
          </div>
        ) : advocates.length === 0 ? (
          <div className="lm-card lm-empty-state">
            <div className="icon">⚖️</div>
            <h5>No Advocates Found</h5>
            <p>Try adjusting your search criteria or browse all advocates</p>
            <button className="btn btn-gold mt-2 px-4" onClick={clearFilters}>Show All Advocates</button>
          </div>
        ) : (
          <div className="row g-4">
            {advocates.map((adv) => {
              const avail = AVAIL_STYLE[adv.availability] || AVAIL_STYLE["On Leave"];

              /* Two-letter initials fallback when no profile photo */
              const initials = (adv.fullName || "A")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div className="col-12 col-sm-6 col-lg-4 col-xl-3" key={adv._id}>
                  <div className="lm-advocate-card" style={{ borderRadius: 18, overflow: "hidden" }}>

                    {/* ── Header banner ───────────────────────────── */}
                  
                      <div className="lm-advocate-header">

                      {/* Availability pill — top right */}
                      <span style={{
                        position: "absolute", top: ".75rem", right: ".75rem",
                        background: avail.bg, color: avail.color,
                        border: `1px solid ${avail.border}`,
                        fontSize: ".62rem", fontWeight: 700,
                        padding: "2px 5px", borderRadius: 20,
                        textTransform: "uppercase", letterSpacing: ".05em",
                        backdropFilter: "blur(4px)",
                      }}>
                        ● {adv.availability}
                      </span>

                      {/* Avatar + name side-by-side */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>

                        {/* Avatar circle */}
                        <div style={{
                          width: 68, height: 68, borderRadius: "50%", flexShrink: 0,
                          background: adv.profileImage
                            ? "transparent"
                            : "linear-gradient(135deg, var(--gold-500), var(--gold-600))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 800,
                          color: "var(--navy-900)",
                          border: "3px solid rgba(201,168,76,.55)",
                          boxShadow: "0 0 0 4px rgba(201,168,76,.15)",
                          overflow: "hidden",
                        }}>
                          {adv.profileImage
                            ? <img src={adv.profileImage} alt={adv.fullName}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : initials}
                        </div>

                        {/* Name + qualification + verified */}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: ".4rem", flexWrap: "wrap", marginBottom: ".2rem" }}>
                            <h5 style={{
                              fontFamily: "var(--font-serif)", fontWeight: 800,
                              color: "#fff", fontSize: ".97rem",
                              margin: 0, lineHeight: 1.25,
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                              maxWidth: "100%",
                            }}>
                              {adv.fullName}
                            </h5>
                          </div>
                          <p style={{
                            fontSize: ".72rem", color: "rgba(255,255,255,.6)",
                            margin: "0 0 .4rem", fontWeight: 400,
                          }}>
                            {adv.qualification || "Advocate"} · {adv.experience} yrs exp.
                          </p>
                          {/* Verified badge */}
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            background: "rgba(201,168,76,.18)", color: "var(--gold-300)",
                            border: "1px solid rgba(201,168,76,.35)",
                            fontSize: ".62rem", fontWeight: 700,
                            padding: "2px 8px", borderRadius: 20,
                            letterSpacing: ".04em",
                          }}>
                            ✓ Verified Advocate
                          </span>
                        </div>

                      </div>
                    </div>
                    {/* ── /header banner ─────────────────────────── */}

                    {/* ── Card body ───────────────────────────────── */}
                    
                      <div className="lm-advocate-body">



                      {/* Specialization */}
                      <div style={{ marginBottom: ".8rem" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          background: "var(--navy-800)", color: "var(--gold-300)",
                          fontSize: ".72rem", fontWeight: 700,
                          padding: "4px 12px", borderRadius: 20,
                          letterSpacing: ".04em",
                        }}>
                          ⚖️ {adv.specialization}
                        </span>
                      </div>

                      {/* Location */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: ".45rem",
                        fontSize: ".82rem", color: "var(--gray-600)",
                        marginBottom: ".6rem",
                      }}>
                        <span style={{ flexShrink: 0 }}>📍</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {adv.location}
                        </span>
                      </div>

                      {/* About — 2-line clamp */}
                      {adv.about && (
                        <p style={{
                          fontSize: ".8rem", color: "var(--gray-500)", lineHeight: 1.6,
                          marginBottom: ".85rem",
                          display: "-webkit-box", WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {adv.about}
                        </p>
                      )}

                      {/* Spacer */}
                      <div style={{ flex: 1 }} />

                      {/* Fee */}
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "var(--gold-100)",
                        border: "1px solid rgba(201,168,76,.25)",
                        borderRadius: 8, padding: ".5rem .85rem",
                        marginBottom: ".85rem",
                      }}>
                        <span style={{ fontSize: ".72rem", color: "var(--gray-500)", fontWeight: 500 }}>
                          Consultation
                        </span>
                        <span style={{
                          fontFamily: "var(--font-serif)", fontSize: "1.05rem",
                          fontWeight: 800, color: "var(--navy-800)",
                        }}>
                          ₹{adv.fees?.toLocaleString("en-IN")}
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: ".7rem", fontWeight: 400, color: "var(--gray-500)", marginLeft: 3 }}>
                            /session
                          </span>
                        </span>
                      </div>

                      {/* Action buttons */}

                      <div style={{ display: "flex", gap: ".5rem" }}>
                        <Link
                          to={`/advocates/${adv._id}`}
                          className="btn btn-outline-gold btn-sm flex-grow-1"
                          style={{ borderRadius: 8, fontSize: ".75rem",marginTop:"auto", fontWeight: 600 }}
                        >
                          View Profile
                        </Link>
                        <Link
                          to={`/appointment?advocateId=${adv._id}`}
                          className="btn btn-gold btn-sm flex-grow-1"
                          style={{  flex:1,borderRadius: "10px", fontSize: ".8rem", fontWeight: 600 }}
                        >
                          Book Now
                        </Link>
                      </div>

                    </div>



                     
              
                    {/* ── /card body ─────────────────────────────── */}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      
    </>
  );
}

export default AdvocateListing;
