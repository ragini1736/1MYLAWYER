import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";


const AVAIL_STYLE = {
  Available: { bg: "rgba(16,185,129,.15)", color: "#059669", border: "rgba(16,185,129,.3)" },
  Busy:      { bg: "rgba(245,158,11,.15)", color: "#d97706", border: "rgba(245,158,11,.3)" },
  "On Leave":{ bg: "rgba(239,68,68,.15)",  color: "#dc2626", border: "rgba(239,68,68,.3)"  },
};

function AdvocateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [advocate, setAdvocate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/advocates/${id}`)
      .then((res) => setAdvocate(res.data.advocate))
      .catch(() => { toast.error("Advocate not found"); navigate("/advocates"); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <>
    
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border" style={{ color: "var(--gold-500)", width: "3rem", height: "3rem" }} />
      </div>
      
    </>
  );

  if (!advocate) return null;

  const avail = AVAIL_STYLE[advocate.availability] || AVAIL_STYLE["On Leave"];

  const DETAILS = [
    { icon: "⚖️", label: "Specialization", value: advocate.specialization },
    { icon: "🎓", label: "Qualification",  value: advocate.qualification  },
    { icon: "📅", label: "Experience",     value: `${advocate.experience} years` },
    { icon: "📍", label: "Location",       value: advocate.location        },
    { icon: "📞", label: "Phone",          value: advocate.phone           },
    { icon: "📧", label: "Email",          value: advocate.email           },
  ];

  const TRUST = [
    "Verified by Bar Council of India",
    "100% Confidential Consultation",
    "Secure Online Platform",
    "Transparent Fee Structure",
    "Fast Response Guaranteed",
  ];

  return (
    <>
      

      {/* Hero Header */}
      <div className="lm-page-header">
        <div className="container lm-page-header-content">
          <div className="d-flex align-items-center gap-3 gap-md-4 flex-wrap">
            {/* Avatar — slightly smaller on mobile */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, var(--gold-600), var(--gold-400))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-serif)", fontSize: "1.8rem", fontWeight: 800,
              color: "var(--navy-900)",
              boxShadow: "0 0 0 3px rgba(201,168,76,.35), 0 0 0 6px rgba(201,168,76,.12)",
            }}>
              {advocate.fullName?.charAt(0)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="lm-gold-bar mb-2" />
              <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, fontSize: "clamp(1.4rem, 4vw, 2rem)", marginBottom: ".35rem", wordBreak: "break-word" }}>
                {advocate.fullName}
              </h1>
              <p style={{ marginBottom: ".6rem", opacity: .75, fontSize: ".9rem" }} className="d-none d-sm-block">
                {advocate.specialization} · {advocate.qualification} · {advocate.location}
              </p>
              <p style={{ marginBottom: ".6rem", opacity: .75, fontSize: ".88rem" }} className="d-block d-sm-none">
                {advocate.specialization}
              </p>
              <span style={{
                background: avail.bg, color: avail.color, border: `1px solid ${avail.border}`,
                borderRadius: "30px", padding: ".2rem .8rem", fontSize: ".75rem", fontWeight: 700,
              }}>
                ● {advocate.availability}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4 py-lg-5">
        <div className="row g-4">

          {/* Left */}
          <div className="col-12 col-lg-8">

            {/* About */}
            <div className="lm-card mb-4">
              <div className="lm-card-header">
                <h5 className="lm-card-title">About</h5>
              </div>
              <div className="p-4">
                <div style={{
                  borderLeft: "3px solid var(--gold-500)",
                  paddingLeft: "1.25rem", marginLeft: ".25rem",
                }}>
                  <p style={{ color: "var(--gray-700)", lineHeight: 1.8, margin: 0, fontSize: ".96rem" }}>
                    {advocate.about}
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div className="lm-card">
              <div className="lm-card-header">
                <h5 className="lm-card-title">Professional Details</h5>
              </div>
              <div className="p-4">
                <div className="row g-3">
                  {DETAILS.map((d) => (
                    <div className="col-12 col-sm-6" key={d.label}>
                      <div style={{
                        background: "var(--gold-100)",
                        border: "1px solid rgba(201,168,76,.2)",
                        borderRadius: "var(--radius-md)",
                        padding: "1rem 1.1rem",
                        display: "flex", alignItems: "center", gap: ".85rem",
                      }}>
                        <span style={{
                          width: 40, height: 40, borderRadius: "50%",
                          background: "var(--white)", border: "1px solid rgba(201,168,76,.3)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1rem", flexShrink: 0,
                        }}>
                          {d.icon}
                        </span>
                        <div>
                          <div style={{ fontSize: ".73rem", color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600 }}>
                            {d.label}
                          </div>
                          <div style={{ fontWeight: 700, color: "var(--navy-800)", fontSize: ".9rem" }}>
                            {d.value}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right — Booking Card
              On mobile: renders normally (not sticky, flows below content)
              On desktop (lg+): sticky top-80 so it follows the user while reading */}
          <div className="col-12 col-lg-4">
            <div className="lm-card" style={{ position:"sticky", top:"80px" }}>
              {/* Fee Display */}
              <div style={{
                background: "linear-gradient(135deg, var(--navy-800), var(--navy-900))",
                padding: "2rem", textAlign: "center",
                borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
              }}>
                <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".82rem", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: ".5rem" }}>
                  Consultation Fee
                </p>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", fontWeight: 800, color: "var(--gold-400)", lineHeight: 1 }}>
                  ₹{advocate.fees?.toLocaleString("en-IN")}
                </div>
                <p style={{ color: "rgba(255,255,255,.45)", fontSize: ".78rem", marginTop: ".4rem", marginBottom: 0 }}>
                  per consultation session
                </p>
              </div>

              <div className="p-4">
                <div className="d-grid gap-2 mb-4">
                  <Link to={`/appointment?advocateId=${advocate._id}`} className="btn btn-gold btn-lg">
                    📅 Book Appointment
                  </Link>
                  <Link to="/advocates" className="btn btn-outline-gold">
                    ← Back to Advocates
                  </Link>
                </div>

                <div style={{ borderTop: "1px solid var(--gray-100)", paddingTop: "1.25rem" }}>
                  <h6 style={{ fontFamily: "var(--font-serif)", color: "var(--navy-800)", fontWeight: 700, marginBottom: "1rem" }}>
                    Why Book With Us?
                  </h6>
                  {TRUST.map((item) => (
                    <div key={item} className="d-flex gap-2 align-items-start mb-2">
                      <span style={{ color: "var(--gold-500)", fontWeight: 700, marginTop: ".1rem", flexShrink: 0 }}>✓</span>
                      <span style={{ color: "var(--gray-600)", fontSize: ".86rem" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    
    </>
  );
}

export default AdvocateDetails;
