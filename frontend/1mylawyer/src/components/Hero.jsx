import { Link } from "react-router-dom";
import Ankesh from "../assets/images/Ankesh.jpeg";

function Hero() {
  return (
    <section className="lm-hero">
      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row align-items-center g-5">

          {/* Left */}
          <div className="col-lg-6 col-12 lm-fade-in">
            <div className="lm-hero-eyebrow">
              <span>⚖</span> India's Premier Legal Platform
            </div>

            <h1 className="lm-hero-title">
              Expert Legal<br />
              Counsel, <span className="gold">On Demand</span>
            </h1>

            <p className="lm-hero-subtitle">
              Connect with verified advocates, track your cases in real-time,
              and manage all your legal affairs from one secure platform.
            </p>

            <div className="d-flex gap-3 flex-wrap mb-4">
              <Link to="/appointment" className="btn btn-gold btn-lg px-4">
                Book Consultation
              </Link>
              <Link to="/advocates" className="btn btn-outline-white btn-lg px-4">
                Browse Advocates
              </Link>
            </div>

            <div className="lm-hero-stats">
              {[
                { num: "500+",  lbl: "Cases Solved"   },
                { num: "1000+", lbl: "Happy Clients"  },
                { num: "2+",   lbl: "Years Combined" },
                { num: "24/7",  lbl: "Support"        },
              ].map((s) => (
                <div key={s.lbl}>
                  <div className="lm-hero-stat-num">{s.num}</div>
                  <div className="lm-hero-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="col-lg-6 col-12 text-center lm-fade-in-delay-1 pb-4 pb-lg-0">
            <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
              {/* Gold ring — hidden on mobile via CSS */}
              <div style={{
                position: "absolute", inset: -10,
                borderRadius: "var(--radius-xl)",
                border: "2px solid rgba(201,168,76,.25)",
                pointerEvents: "none",
              }} />
              <img
                src={Ankesh}
                alt="Advocate"
                className="lm-hero-img"
                style={{ maxHeight: 520 }}
              />
              {/* Floating badge — hidden on small screens via CSS media query */}
              <div style={{
                position: "absolute", bottom: 28, left: -20,
                background: "var(--white)",
                borderRadius: "var(--radius-md)",
                padding: ".75rem 1.1rem",
                boxShadow: "var(--shadow-lg)",
                display: "flex", alignItems: "center", gap: ".65rem",
                zIndex: 2,
              }}>
                <span style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "var(--gold-100)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.1rem",
                }}>✅</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".82rem", color: "var(--navy-800)", lineHeight: 1.2 }}>
                    Verified Advocate
                  </div>
                  <div style={{ fontSize: ".72rem", color: "var(--gray-500)" }}>Bar Council Certified</div>
                </div>
              </div>
              {/* Second badge — hidden on small screens via CSS media query */}
              <div style={{
                position: "absolute", top: 28, right: -20,
                background: "var(--navy-800)",
                borderRadius: "var(--radius-md)",
                padding: ".65rem 1rem",
                boxShadow: "var(--shadow-lg)",
                color: "var(--white)",
                fontSize: ".82rem", fontWeight: 700,
                textAlign: "center", minWidth: 96,
                zIndex: 2,
              }}>
                <div style={{ color: "var(--gold-400)", fontSize: "1.1rem", fontFamily: "var(--font-serif)" }}>
                  100%
                </div>
                <div style={{ fontSize: ".72rem", opacity: .8 }}>Confidential</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;
