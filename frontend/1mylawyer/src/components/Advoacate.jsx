import { Link } from "react-router-dom";
import Ankesh from "../assets/images/Ankesh.jpeg";

function Advocate() {
  const HIGHLIGHTS = [
    { icon: "🏛️", label: "Civil & Property Law", sub: "Primary Specialization"  },
    { icon: "⚖️", label: "Criminal Defence",      sub: "Court Representation"   },
    { icon: "👨‍👩‍👧", label: "Family Law",            sub: "Matrimonial Disputes"  },
    { icon: "📅", label: "2+ Years Experience",  sub: "Bar Council Certified"   },
  ];

  return (
    <section style={{ background: "var(--white)", padding: "clamp(3rem,7vw,6rem) 0" }}>
      <div className="container">

        {/* Section Label */}
        <div className="text-center mb-5">
          <div className="lm-gold-bar mx-auto" />
          <h2 className="lm-section-title">Meet Our Lead Advocate</h2>
          <p className="lm-section-subtitle">
            Dedicated to delivering justice with integrity, expertise and compassion.
          </p>
        </div>

        <div className="row align-items-center g-5">

          {/* Image Column */}
          <div className="col-12 col-lg-5 text-center">
            <div style={{ position: "relative", display: "inline-block" }}>

              {/* Outer decorative ring */}
              <div style={{
                position: "absolute", inset: -16,
                borderRadius: "var(--radius-xl)",
                border: "1px solid rgba(201,168,76,.2)",
                pointerEvents: "none",
              }} />

              <img
                src={Ankesh}
                alt="Advocate Ankesh Yadav"
                style={{
                  width: "100%", maxWidth: 380,
                  height: "auto", maxHeight: 460,
                  objectFit: "cover",
                  borderRadius: "var(--radius-xl)",
                  boxShadow: "var(--shadow-xl)",
                  border: "4px solid rgba(201,168,76,.25)",
                  display: "block",
                }}
              />

              {/* Verified badge — hidden on mobile via d-none d-md-flex to prevent overflow */}
              <div className="d-none d-md-flex" style={{
                position: "absolute", bottom: 24, left: -24,
                background: "var(--white)",
                borderRadius: "var(--radius-md)",
                padding: ".85rem 1.1rem",
                boxShadow: "var(--shadow-lg)",
                alignItems: "center", gap: ".75rem",
                border: "1px solid var(--gray-100)",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "var(--gold-100)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.2rem",
                }}>✅</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".82rem", color: "var(--navy-800)", lineHeight: 1.2 }}>
                    Bar Council
                  </div>
                  <div style={{ fontSize: ".72rem", color: "var(--gray-500)" }}>
                    Verified Advocate
                  </div>
                </div>
              </div>

              {/* Case counter badge — hidden on mobile to prevent overflow */}
              <div className="d-none d-md-block" style={{
                position: "absolute", top: 24, right: -24,
                background: "linear-gradient(135deg, var(--navy-800), var(--navy-700))",
                borderRadius: "var(--radius-md)",
                padding: ".85rem 1.1rem",
                boxShadow: "var(--shadow-lg)",
                textAlign: "center", minWidth: 88,
              }}>
                <div style={{
                  fontFamily: "var(--font-serif)", fontSize: "1.5rem",
                  fontWeight: 800, color: "var(--gold-400)", lineHeight: 1,
                }}>
                  500+
                </div>
                <div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.6)", marginTop: ".2rem" }}>
                  Cases Solved
                </div>
              </div>
            </div>
          </div>

          {/* Content Column */}
          <div className="col-12 col-lg-7">

            {/* Name + Title */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: ".5rem",
              background: "var(--gold-100)", border: "1px solid rgba(201,168,76,.3)",
              color: "var(--gold-600)", fontSize: ".78rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: ".1em",
              padding: ".3rem .9rem", borderRadius: "30px", marginBottom: "1.1rem",
            }}>
              ⚖ Featured Advocate
            </div>

            <h2 style={{
              fontFamily: "var(--font-serif)", fontWeight: 800,
              color: "var(--navy-800)", fontSize: "2.2rem",
              lineHeight: 1.15, marginBottom: ".4rem",
            }}>
              Advocate Ankesh Yadav
            </h2>

            <p style={{
              color: "var(--gold-600)", fontWeight: 600, fontSize: ".95rem",
              marginBottom: "1.25rem", letterSpacing: ".02em",
            }}>
              LLB — Civil, Criminal &amp; Family Law Specialist
            </p>

            <div style={{
              borderLeft: "3px solid var(--gold-500)", paddingLeft: "1.25rem",
              marginBottom: "2rem",
            }}>
              <p style={{
                color: "var(--gray-600)", lineHeight: 1.8, margin: 0, fontSize: ".96rem",
              }}>
                With over 2 years of dedicated legal practice, Advocate Ankesh Yadav brings
                precision, empathy and expertise to every case. Known for his thorough case
                preparation, clear communication and unwavering commitment to client interests,
                he has successfully represented clients across civil disputes, criminal matters
                and family law proceedings.
              </p>
            </div>

            {/* Highlights Grid */}
            <div className="row g-3 mb-4">
              {HIGHLIGHTS.map((h) => (
                <div className="col-6" key={h.label}>
                  <div style={{
                    background: "var(--gray-50)",
                    border: "1px solid var(--gray-200)",
                    borderRadius: "var(--radius-md)",
                    padding: ".9rem 1rem",
                    display: "flex", alignItems: "center", gap: ".75rem",
                    transition: "var(--transition)",
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--gold-100)";
                      e.currentTarget.style.borderColor = "rgba(201,168,76,.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--gray-50)";
                      e.currentTarget.style.borderColor = "var(--gray-200)";
                    }}>
                    <span style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: "var(--navy-800)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: ".95rem", flexShrink: 0,
                    }}>
                      {h.icon}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: ".84rem", color: "var(--navy-800)", lineHeight: 1.2 }}>
                        {h.label}
                      </div>
                      <div style={{ fontSize: ".72rem", color: "var(--gray-500)" }}>
                        {h.sub}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="d-flex gap-3 flex-wrap">
              <Link to="/appointment" className="btn btn-gold btn-lg px-5">
                Book Consultation
              </Link>
              <Link to="/advocates" className="btn btn-outline-gold btn-lg px-4">
                View All Advocates
              </Link>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default Advocate;
