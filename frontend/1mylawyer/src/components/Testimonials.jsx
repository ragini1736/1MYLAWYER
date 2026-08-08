function Testimonials() {
  const reviews = [
    {
      name: "Rahul Sharma", role: "Property Dispute Client",
      text: "Exceptional legal guidance. My property case was resolved swiftly and professionally. The advocate was thorough, responsive, and truly understood my situation.",
      avatar: "https://i.pravatar.cc/100?img=11",
    },
    {
      name: "Priya Singh", role: "Family Law Client",
      text: "The platform made booking a consultation incredibly easy. The advocate provided clear advice and handled my family matter with great sensitivity and expertise.",
      avatar: "https://i.pravatar.cc/100?img=5",
    },
    {
      name: "Amit Verma", role: "Corporate Law Client",
      text: "Outstanding service from start to finish. The case tracker kept me updated at every step. I highly recommend 1MyLawyer for any legal consultation needs.",
      avatar: "https://i.pravatar.cc/100?img=3",
    },
  ];

  return (
    <section style={{ background: "var(--gray-50)", padding: "clamp(3rem,7vw,5.5rem) 0" }}>
      <div className="container">
        <div className="text-center mb-5">
          <div className="lm-gold-bar mx-auto" />
          <h2 className="lm-section-title">What Our Clients Say</h2>
          <p className="lm-section-subtitle">
            Trusted by hundreds of clients across India for expert legal consultation.
          </p>
        </div>

        <div className="row g-4">
          {reviews.map((r) => (
            <div className="col-12 col-md-4" key={r.name}>
              <div className="lm-testimonial h-100">
                <div className="lm-testimonial-quote">"</div>
                <p className="lm-testimonial-text mb-4">{r.text}</p>
                <div className="lm-star-gold mb-3">★★★★★</div>
                <div className="d-flex align-items-center gap-3">
                  <img
                    src={r.avatar} alt={r.name}
                    style={{
                      width: 48, height: 48, borderRadius: "50%",
                      border: "2px solid var(--gold-400)", objectFit: "cover",
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--navy-800)", fontSize: ".92rem", fontFamily: "var(--font-serif)" }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: ".78rem", color: "var(--gray-500)" }}>{r.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
