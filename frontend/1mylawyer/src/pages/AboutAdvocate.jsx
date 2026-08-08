import { Link } from "react-router-dom";
import Ankesh from "../assets/images/Ankesh.jpeg";

function AboutAdvocate() {
  return (
    <section style={{ background: "var(--white)", padding: "clamp(3rem,7vw,5rem) 0" }}>
      <div className="container">
        <div className="row align-items-center g-4 g-lg-5">

          {/* Image — full width on mobile, 4/12 on tablet+ */}
          <div className="col-12 col-md-4 text-center">
            <img
              src={Ankesh}
              alt="Advocate Ankesh Yadav"
              className="img-fluid rounded shadow"
              style={{ maxHeight: 460, width: "100%", objectFit: "cover" }}
            />
          </div>

          {/* Content — full width on mobile, 8/12 on tablet+ */}
          <div className="col-12 col-md-8">
            <div className="lm-gold-bar mb-3" />
            <h2 style={{
              fontFamily: "var(--font-serif)", fontWeight: 800,
              color: "var(--navy-800)", fontSize: "clamp(1.6rem,4vw,2.2rem)",
              marginBottom: "1rem",
            }}>
              About 1MyLawyer
            </h2>

            <p style={{ fontSize: "clamp(.92rem,2.5vw,1.05rem)", color: "var(--gray-600)", lineHeight: 1.75, marginBottom: "1.25rem" }}>
              We provide trusted legal consultation, case tracking and secure document
              management services — connecting clients with verified advocates across India.
            </p>

            {/* Feature list */}
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "flex", flexDirection: "column", gap: ".6rem" }}>
              {[
                ["⚖️", "Expert Advocates",        "Bar Council verified professionals"],
                ["📅", "Online Appointments",     "Book consultations in minutes"],
                ["📁", "Secure Document Vault",   "Encrypted legal document storage"],
                ["📊", "Real-Time Case Tracking", "Live updates on all your cases"],
              ].map(([icon, title, sub]) => (
                <li key={title} style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: "var(--radius-sm)",
                    background: "var(--gold-100)", border: "1px solid rgba(201,168,76,.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", flexShrink: 0,
                  }}>{icon}</span>
                  <div>
                    <span style={{ fontWeight: 700, color: "var(--navy-800)", fontSize: ".9rem" }}>{title}</span>
                    <span style={{ color: "var(--gray-500)", fontSize: ".8rem", marginLeft: ".4rem" }}>— {sub}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="d-flex gap-3 flex-wrap">
              <Link to="/appointment" className="btn btn-gold px-4">
                Book Consultation
              </Link>
              <Link to="/advocates" className="btn btn-outline-gold px-4">
                Browse Advocates
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default AboutAdvocate;
