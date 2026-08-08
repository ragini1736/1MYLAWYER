function Statistics() {
  const stats = [
    { num: "500+",  label: "Cases Solved",    sub: "Successfully handled legal cases",      icon: "⚖️" },
    { num: "1000+", label: "Happy Clients",   sub: "Clients trust our legal services",       icon: "👥" },
    { num: "2+",   label: "Years Experience",sub: "Combined professional legal experience", icon: "🏛️" },
    { num: "24/7",  label: "Support",         sub: "Round-the-clock legal assistance",       icon: "🛡️" },
  ];

  return (
    <section style={{ background: "var(--navy-900)", padding: "clamp(3rem,7vw,5rem) 0", position: "relative", overflow: "hidden" }}>
      {/* subtle gold glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 700, height: 300,
        background: "radial-gradient(ellipse, rgba(201,168,76,.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="container position-relative">
        <div className="text-center mb-5">
          <div className="lm-gold-bar mx-auto" />
          <h2 className="lm-section-title" style={{ color: "var(--white)", fontFamily: "var(--font-serif)" }}>
            Our Achievements
          </h2>
          <p style={{ color: "rgba(255,255,255,.55)", fontSize: "1rem" }}>
            Numbers that reflect our commitment to excellence in legal services.
          </p>
        </div>

        <div className="row g-4">
          {stats.map((s) => (
            <div className="col-12 col-sm-6 col-lg-3" key={s.label}>
              <div style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(201,168,76,.18)",
                borderTop: "3px solid var(--gold-500)",
                borderRadius: "var(--radius-lg)",
                padding: "2rem 1.5rem",
                textAlign: "center",
                transition: "var(--transition)",
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(201,168,76,.08)";
                  e.currentTarget.style.transform = "translateY(-6px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,.04)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: "rgba(201,168,76,.12)",
                  border: "1px solid rgba(201,168,76,.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.6rem", margin: "0 auto 1rem",
                }}>
                  {s.icon}
                </div>
                <div style={{
                  fontFamily: "var(--font-serif)", fontSize: "2.6rem",
                  fontWeight: 800, color: "var(--gold-400)", lineHeight: 1,
                  marginBottom: ".35rem",
                }}>
                  {s.num}
                </div>
                <div style={{ fontWeight: 700, color: "var(--white)", fontSize: ".95rem", marginBottom: ".4rem" }}>
                  {s.label}
                </div>
                <p style={{ color: "rgba(255,255,255,.45)", fontSize: ".82rem", margin: 0 }}>
                  {s.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Statistics;
