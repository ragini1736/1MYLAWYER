import { Link } from "react-router-dom";

const SERVICES = [
  { icon: "⚖️", title: "Civil Law",         desc: "Property disputes, contracts, civil litigation and rights enforcement." },
  { icon: "🏛️", title: "Criminal Law",       desc: "Bail applications, FIR guidance, criminal defence and acquittals." },
  { icon: "👨‍👩‍👧", title: "Family Law",         desc: "Divorce, child custody, maintenance, adoption and matrimonial disputes." },
  { icon: "🏠", title: "Property Law",       desc: "Land disputes, sale deeds, registration and property agreements." },
  { icon: "🏢", title: "Corporate Law",      desc: "Business registration, compliance, contracts and corporate litigation." },
  { icon: "🌐", title: "Cyber Law",          desc: "Online fraud, data privacy, cybercrime defence and digital rights." },
];

const WHY_US = [
  { icon: "👨‍⚖️", title: "Experienced Advocates",    desc: "Bar Council verified professionals with proven track records." },
  { icon: "🔒", title: "Strictly Confidential",      desc: "Your case details are never shared. Complete privacy guaranteed." },
  { icon: "⚡", title: "Fast Legal Assistance",      desc: "Get expert guidance within 24 hours of booking." },
  { icon: "💰", title: "Transparent Pricing",        desc: "No hidden charges. Clear consultation fees upfront." },
];

const PROCESS = [
  { step: "01", title: "Book a Consultation", desc: "Choose your advocate and preferred time slot." },
  { step: "02", title: "Case Review",         desc: "Advocate reviews your matter and prepares strategy." },
  { step: "03", title: "Documentation",       desc: "All necessary legal documents are prepared securely." },
  { step: "04", title: "Resolution",          desc: "Your case is pursued to the best possible outcome." },
];

function Service() {
  return (
    <>
      

      {/* Hero */}
      <div
  className="lm-page-header"
  style={{
    padding: "6.5rem 0",
    background:
      "radial-gradient(circle at top, rgba(212,175,55,.12), transparent 35%), linear-gradient(135deg,#081A38,#0E2345,#081A38)"
  }}
>
      
        <div className="container lm-page-header-content text-center">
          <div className="lm-gold-bar mx-auto" />
          <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, fontSize: "3.2rem", marginBottom: ".6rem" }}>
            Our Legal Services
          </h1>
          <p style={{ opacity: .72, fontSize: "1.05rem", maxWidth: 540, margin: "0 auto 2.5rem" }}>
            Professional legal solutions for individuals, families and businesses across India.
          </p>
          <Link to="/appointment" className="btn btn-gold btn-lg px-5">
            Book Consultation
          </Link>
        </div>
      </div>

      {/* Services Grid */}
      <section style={{ background: "var(--gray-50)", padding: "clamp(3rem,7vw,5.5rem) 0" }}>
        <div className="container">
          <div className="text-center mb-5">
            <div className="lm-gold-bar mx-auto" />
            <h2 className="lm-section-title">Practice Areas</h2>
            <p className="lm-section-subtitle">
              We provide trusted legal consultation across all major areas of law.
            </p>
          </div>
          <div className="row g-4">
            {SERVICES.map((s) => (
              <div className="col-12 col-md-6 col-lg-4" key={s.title}>
                <div className="lm-service-card">
                  <div className="lm-service-icon">{s.icon}</div>
                  <h5>{s.title}</h5>
                  <p>{s.desc}</p>
                  <Link to={`/appointment`}
                    style={{ color: "var(--gold-600)", fontSize: ".84rem", fontWeight: 600, textDecoration: "none" }}>
                    Consult Now →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ background: "var(--navy-900)", padding: "clamp(3rem,7vw,5.5rem) 0", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 600, height: 300, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(201,168,76,.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div className="container position-relative">
          <div className="text-center mb-5">
            <div className="lm-gold-bar mx-auto" />
            <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, color: "var(--white)", fontSize: "2rem", marginBottom: ".5rem" }}>
              Why Choose 1MyLawyer?
            </h2>
            <p style={{ color: "rgba(255,255,255,.55)", fontSize: "1rem" }}>
              Trusted by thousands of clients across India.
            </p>
          </div>
          <div className="row g-4">
            {WHY_US.map((w) => (
              <div className="col-12 col-md-6 col-lg-3" key={w.title}>
                <div style={{
                  background: "rgba(255,255,255,.04)",
                  border: "1px solid rgba(201,168,76,.15)",
                  borderRadius: "var(--radius-lg)", padding: "2rem 1.5rem", textAlign: "center",
                  transition: "var(--transition)",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,.4)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,.15)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: "50%", margin: "0 auto 1.1rem",
                    background: "rgba(201,168,76,.12)", border: "1px solid rgba(201,168,76,.3)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem",
                  }}>{w.icon}</div>
                  <h6 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--white)", marginBottom: ".6rem" }}>
                    {w.title}
                  </h6>
                  <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".84rem", margin: 0 }}>{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section style={{ background: "var(--white)", padding: "clamp(3rem,7vw,5.5rem) 0" }}>
        <div className="container">
          <div className="text-center mb-5">
            <div className="lm-gold-bar mx-auto" />
            <h2 className="lm-section-title">Our Legal Process</h2>
            <p className="lm-section-subtitle">Simple, transparent, and client-focused at every step.</p>
          </div>
          <div className="row g-4">
            {PROCESS.map((p, idx) => (
              <div className="col-12 col-md-6 col-lg-3" key={p.step}>
                <div style={{ textAlign: "center", position: "relative" }}>
                  {idx < PROCESS.length - 1 && (
                    <div style={{
                      position: "absolute", top: 28, left: "60%", width: "80%", height: 2,
                      background: "linear-gradient(90deg, var(--gold-400), transparent)",
                      display: "none",
                    }} className="d-lg-block" />
                  )}
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%", margin: "0 auto 1.1rem",
                    background: "linear-gradient(135deg, var(--navy-800), var(--navy-700))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-serif)", fontSize: "1.1rem", fontWeight: 800, color: "var(--gold-400)",
                    position: "relative", zIndex: 1,
                    boxShadow: "0 4px 16px rgba(6,14,30,.15)",
                  }}>
                    {p.step}
                  </div>
                  <h6 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--navy-800)", marginBottom: ".5rem" }}>
                    {p.title}
                  </h6>
                  <p style={{ color: "var(--gray-500)", fontSize: ".86rem" }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, var(--navy-900), var(--navy-700))", padding: "clamp(3rem,6vw,5rem) 0" }}>
        <div className="container text-center">
          <div className="lm-gold-bar mx-auto mb-3" />
          <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, color: "var(--white)", fontSize: "2.2rem", marginBottom: ".75rem" }}>
            Need Professional Legal Help?
          </h2>
          <p style={{ color: "rgba(255,255,255,.65)", fontSize: "1.05rem", marginBottom: "2rem", maxWidth: 480, margin: "0 auto 2rem" }}>
            Schedule your consultation with our verified advocates today.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/appointment" className="btn btn-gold btn-lg px-5">
              Book Appointment
            </Link>
            <Link to="/advocates" className="btn btn-outline-white btn-lg px-5">
              Browse Advocates
            </Link>
          </div>
        </div>
      </section>

      
    </>
  );
}

export default Service;
