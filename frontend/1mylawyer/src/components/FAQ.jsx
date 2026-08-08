const FAQS = [
  { q: "How do I book a legal consultation?", a: "Click 'Book Consultation' on any advocate profile or the homepage. Select your preferred date, time slot, and describe your legal matter. Our team reviews and confirms within 24 hours." },
  { q: "What areas of law do you cover?", a: "We cover Civil Law, Criminal Law, Family Law, Property Law, Corporate Law, and Cyber Law. Our network of verified advocates handles cases across all major legal domains." },
  { q: "Can I track my case status online?", a: "Yes. Your dedicated Case Tracker dashboard shows real-time status, hearing dates, case timeline, and advocate notes — all in one place." },
  { q: "Is my personal information kept confidential?", a: "Absolutely. All consultations and documents are protected by strict confidentiality protocols. Your data is encrypted and never shared with third parties." },
  { q: "How are consultation fees calculated?", a: "Each advocate sets their own consultation fee, displayed clearly on their profile before booking. There are no hidden charges — you see the full amount before confirming." },
];

function FAQ() {
  return (
    <section style={{ background: "var(--white)", padding: "clamp(3rem,7vw,5.5rem) 0" }}>
      <div className="container">
        <div className="row g-5 align-items-start">

          {/* Left label */}
          <div className="col-12 col-lg-4">
            <div className="lm-gold-bar" />
            <h2 className="lm-section-title lm-heading">Frequently Asked Questions</h2>
            <p style={{ color: "var(--gray-500)", fontSize: ".95rem", lineHeight: 1.7, marginBottom: "2rem" }}>
              Everything you need to know about our legal consultation platform.
            </p>
            <div style={{
              background: "var(--navy-800)", borderRadius: "var(--radius-lg)",
              padding: "1.75rem", color: "var(--white)",
            }}>
              <div style={{ fontSize: "1.8rem", marginBottom: ".75rem" }}>💬</div>
              <h5 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, marginBottom: ".5rem" }}>
                Still have questions?
              </h5>
              <p style={{ color: "rgba(255,255,255,.65)", fontSize: ".88rem", marginBottom: "1rem" }}>
                Our legal team is available 24/7 to help you.
              </p>
              <a href="/contact" className="btn btn-gold btn-sm w-100">
                Contact Us
              </a>
            </div>
          </div>

          {/* Right accordion */}
          <div className="col-12 col-lg-8">
            <div className="accordion lm-accordion" id="faqAccordion">
              {FAQS.map((faq, i) => (
                <div className="accordion-item" key={i}>
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${i !== 0 ? "collapsed" : ""}`}
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#faq${i}`}
                    >
                      {faq.q}
                    </button>
                  </h2>
                  <div
                    id={`faq${i}`}
                    className={`accordion-collapse collapse ${i === 0 ? "show" : ""}`}
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body">{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default FAQ;
