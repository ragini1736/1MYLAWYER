import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="lm-footer">
      <div className="lm-divider-gold" />

      <div className="container">
        <div className="row g-4 py-4 py-md-5">

          {/* Brand Column */}
          <div className="col-12 col-lg-4">
            <div className="lm-footer-brand mb-2">
              ⚖ 1My<span className="accent">Lawyer</span>
            </div>
            <p className="lm-footer-tagline mb-4">
              India's premier digital legal consultation &amp; case management platform.
            </p>
            <div className="lm-footer-contact-item">
              <span className="icon">📍</span>
              <span>Office - Sherwani Nagar, Sitapur, Road, Lucknow.Office - Sherwani Nagar, Sitapur, Road, Lucknow.</span>
            </div>
            <div className="lm-footer-contact-item">
              <span className="icon">📞</span>
              <span>+91 9528349831</span>
            </div>
            <div className="lm-footer-contact-item">
              <span className="icon">📧</span>
              <span>support@1mylawyer.com</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-6 col-md-3 col-lg-2">
            <h6>Quick Links</h6>
            <ul className="lm-footer-links">
              {[
                ["/", "Home"],
                ["/service", "Services"],
                ["/advocates", "Advocates"],
                ["/library", "Legal Library"],
                ["/contact", "Contact Us"],
              ].map(([to, label]) => (
                <li key={to}><Link to={to}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Practice Areas */}
          <div className="col-6 col-md-3 col-lg-2">
            <h6>Practice Areas</h6>
            <ul className="lm-footer-links">
              {[
                "Civil Law", "Criminal Law", "Family Law",
                "Property Law", "Corporate Law", "Cyber Law",
              ].map((s) => (
                <li key={s}>
                  <Link to="/service">{s}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Client Portal */}
          <div className="col-12 col-md-6 col-lg-4">
            <h6>Client Portal</h6>
            <ul className="lm-footer-links mb-4">
              {[
                ["/dashboard",       "My Dashboard"],
                ["/my-appointments", "My Appointments"],
                ["/cases",           "Case Tracker"],
                ["/document",        "Document Vault"],
                ["/notifications",   "Notifications"],
              ].map(([to, label]) => (
                <li key={to}><Link to={to}>{label}</Link></li>
              ))}
            </ul>

            {/* CTA */}
            <div style={{
              background: "rgba(201,168,76,.1)",
              border: "1px solid rgba(201,168,76,.25)",
              borderRadius: "var(--radius-md)",
              padding: "1.1rem 1.25rem",
            }}>
              <p style={{ fontSize: ".82rem", color: "rgba(255,255,255,.7)", marginBottom: ".6rem" }}>
                Need immediate legal assistance?
              </p>
              <Link to="/appointment" className="btn btn-gold btn-sm w-100">
                Book Consultation →
              </Link>
            </div>
          </div>

        </div>
      </div>

      <div className="lm-footer-bottom">
        <div className="container">
          © 2026 <span>1MyLawyer</span>. All Rights Reserved. &nbsp;|&nbsp;
          Legal Consultation Platform Built with Excellence.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
