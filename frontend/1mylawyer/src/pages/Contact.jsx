import { useState, } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import api from "../services/api";


const INIT = { name:"", email:"", phone:"", subject:"", message:"" };

const INFO = [
  { icon:"📍", title:"Our Office",   lines:["123 Legal Avenue","Lucknow, UP 226001"] },
  { icon:"📞", title:"Phone",        lines:["+91 9528349831"] },
  { icon:"📧", title:"Email",        lines:["support@1mylawyer.com"] },
  { icon:"🕐", title:"Office Hours", lines:["Mon–Sat: 9 AM – 7 PM","Sunday: Closed"] },
];

function Contact() {
  const [form, setForm]           = useState(INIT);
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const[validated,setValidated] =useState(false);
  

  const handleChange = (e) => setForm({ ...form, [e.target.name]:e.target.value });

  
  const handleSubmit = async (e) => {
  e.preventDefault();

  setValidated(true);

  const formElement = e.currentTarget;

  if (!formElement.checkValidity()) {
    e.stopPropagation();
    return;
  }

  setLoading(true);

  try {

    await api.post("/api/contact", form);
    


    toast.success("Message sent!");
    setForm(INIT);
    setSubmitted(true);   // Success screen ab sirf API success ke baad
  } catch (err) {
    toast.error("Failed to send");
  } finally {
    setLoading(false);
  }
};



    

  return (
    <>
      

      {/* Hero */}
      <div className="lm-page-header" style={{ padding:"3.5rem 0 2.5rem" }}>
        <div className="container lm-page-header-content text-center">
          <div className="lm-gold-bar mx-auto" />
          <h1 style={{ fontFamily:"var(--font-serif)", fontWeight:800,
                       fontSize:"clamp(1.8rem,5vw,2.6rem)", marginBottom:".5rem" }}>
            Contact Us
          </h1>
          <p style={{ opacity:.72, fontSize:"clamp(.9rem,3vw,1.05rem)",
                      maxWidth:480, margin:"0 auto" }}>
            Have a legal question? Our team is available 24/7 to help you.
          </p>
        </div>
      </div>

      <div className="container py-4 py-md-5">
        <div className="row g-4 g-lg-5 align-items-start">

          {/* ── FORM COLUMN ── */}
          <div className="col-12 col-lg-7">
            <div className="lm-card">
              <div className="lm-card-header">
                <h5 className="lm-card-title">Send Us a Message</h5>
              </div>
              <div className="p-3 p-md-4">
                {submitted ? (
                  <div className="text-center py-4 px-2">
                    <div style={{ width:72, height:72, borderRadius:"50%",
                                  background:"rgba(5,150,105,.1)",
                                  border:"2px solid rgba(5,150,105,.3)",
                                  display:"flex", alignItems:"center",
                                  justifyContent:"center", fontSize:"2rem",
                                  margin:"0 auto 1.25rem" }}>✅</div>
                    <h4 style={{ fontFamily:"var(--font-serif)", fontWeight:700,
                                 color:"var(--navy-800)", marginBottom:".5rem" }}>
                      Message Sent!
                    </h4>
                    <p style={{ color:"var(--gray-500)", marginBottom:"1.5rem", fontSize:".92rem" }}>
                      Thank you for contacting us. We'll respond within 24 hours.
                    </p>
                    <button className="btn btn-gold px-4 w-100 w-sm-auto"
                      onClick={() => setSubmitted(false)}>
                      Send Another Message
                    </button>
                  </div>
                ) : (

                  <form
  onSubmit={handleSubmit}
  className={`lm-form ${validated ? "was-validated" : ""}`}
  noValidate
>
                  

                    <div className="row g-3 mb-3">
                      <div className="col-12 col-sm-6">
                        <label className="form-label">
                          Full Name <span style={{ color:"var(--gold-500)" }}>*</span>
                        </label>
                        <input type="text" className="form-control" name="name"
                          value={form.name} onChange={handleChange}
                          placeholder="Your full name" required />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label">
                          Email <span style={{ color:"var(--gold-500)" }}>*</span>
                        </label>
                        <input type="email" className="form-control" name="email"
                          value={form.email} onChange={handleChange}
                          placeholder="your@email.com" required />
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-12 col-sm-6">
                        <label className="form-label">Phone</label>
                        <input type="text" className="form-control" name="phone"
                          value={form.phone} onChange={handleChange}
                          placeholder="+91 98765 43210" />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label">
                          Subject <span style={{ color:"var(--gold-500)" }}>*</span>
                        </label>
                        <input type="text" className="form-control" name="subject"
                          value={form.subject} onChange={handleChange}
                          placeholder="How can we help?" required />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label">
                        Message <span style={{ color:"var(--gold-500)" }}>*</span>
                      </label>
                      <textarea className="form-control" name="message" rows={5}
                        value={form.message} onChange={handleChange}
                        placeholder="Describe your legal matter in brief..." required />
                    </div>

                    <button type="submit"
                      className="btn btn-gold w-100 py-2"
                      style={{ fontSize:"1rem" }}
                      disabled={loading}>
                      {loading
                        ? <><span className="spinner-border spinner-border-sm me-2" />Sending...</>
                        : "Send Message"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* ── INFO COLUMN ── */}
          <div className="col-12 col-lg-5">
            <div className="lm-gold-bar mb-3" />
            <h3 style={{ fontFamily:"var(--font-serif)", fontWeight:800,
                         color:"var(--navy-800)", marginBottom:"1.25rem",
                         fontSize:"clamp(1.3rem,4vw,1.7rem)" }}>
              Get in Touch
            </h3>

            {/* Info cards */}
            <div className="d-flex flex-column gap-3 mb-4">
              {INFO.map((card) => (
                <div key={card.title} className="lm-card p-3">
                  <div className="d-flex gap-3 align-items-start">
                    <div style={{ width:44, height:44, borderRadius:"var(--radius-md)",
                                  background:"var(--gold-100)",
                                  border:"1px solid rgba(201,168,76,.2)",
                                  display:"flex", alignItems:"center",
                                  justifyContent:"center",
                                  fontSize:"1.2rem", flexShrink:0 }}>
                      {card.icon}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:700, color:"var(--navy-800)",
                                    fontSize:".86rem", marginBottom:".2rem",
                                    fontFamily:"var(--font-serif)" }}>
                        {card.title}
                      </div>
                      {card.lines.map((l) => (
                        <div key={l} style={{ color:"var(--gray-500)", fontSize:".83rem",
                                              overflow:"hidden", textOverflow:"ellipsis",
                                              whiteSpace:"nowrap" }}>
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA box */}
            <div style={{ background:"linear-gradient(135deg,var(--navy-800),var(--navy-900))",
                          borderRadius:"var(--radius-lg)", padding:"1.5rem",
                          textAlign:"center" }}>
              <div style={{ fontSize:"1.75rem", marginBottom:".65rem" }}>⚖️</div>
              <h5 style={{ fontFamily:"var(--font-serif)", fontWeight:700,
                           color:"var(--white)", marginBottom:".5rem",
                           fontSize:"1.05rem" }}>
                Need Urgent Legal Help?
              </h5>
              <p style={{ color:"rgba(255,255,255,.6)", fontSize:".84rem",
                          marginBottom:"1.1rem" }}>
                Book a direct consultation with a verified advocate today.
              </p>
              <Link to="/advocates" className="btn btn-gold w-100" style={{ fontSize:".88rem" }}>
                Browse Advocates →
              </Link>
            </div>
          </div>

        </div>
      </div>

      
    </>
  );
}

export default Contact;
