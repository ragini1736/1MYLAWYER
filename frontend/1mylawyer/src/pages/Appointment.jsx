import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";


const TIME_SLOTS = [
  "09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM", "12:00 PM - 01:00 PM",
  "02:00 PM - 03:00 PM", "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM", "05:00 PM - 06:00 PM",
];
const SERVICES = [
  "Civil Law", "Criminal Law", "Family Law",
  "Property Law", "Corporate Law", "Cyber Law",
];

function Appointment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const prefilledAdvocateId = searchParams.get("advocateId") || "";
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [advocates, setAdvocates] = useState([]);
  const [selectedAdvocate, setSelectedAdvocate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [advocatesLoading, setAdvocatesLoading] = useState(true);
  const [form, setForm] = useState({
    advocateId: prefilledAdvocateId,
    fullName: user?.name || "", email: user?.email || "",
    phone: user?.phone || "", service: "",
    appointmentDate: "", timeSlot: "", message: "",
  });

  useEffect(() => {
    api.get("/api/advocates?availability=Available")
      .then((r) => setAdvocates(r.data.advocates || []))
      .catch(() => toast.error("Could not load advocates"))
      .finally(() => setAdvocatesLoading(false));
  }, []);

  useEffect(() => {
    if (form.advocateId && advocates.length > 0) {
      const found = advocates.find((a) => a._id === form.advocateId);
      setSelectedAdvocate(found || null);
      if (found) setForm((p) => ({ ...p, service: found.specialization }));
    } else { setSelectedAdvocate(null); }
  }, [form.advocateId, advocates]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.advocateId) { toast.error("Please select an advocate"); return; }
    setLoading(true);
    try {
      await api.post("/api/appointments", form);
      toast.success("Appointment booked successfully! 🎉");
      navigate("/my-appointments");
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <>
      

      <div className="lm-page-header">
        <div className="container lm-page-header-content">
          <div className="lm-gold-bar" />
          <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, fontSize: "2.2rem", marginBottom: ".4rem" }}>
            Book an Appointment
          </h1>
          <p style={{ opacity: .75 }}>
            Schedule a consultation with a verified legal professional
          </p>
        </div>
      </div>

      <div className="container py-4 py-lg-5">
        <div className="row g-4 g-lg-5 justify-content-center">

          {/* Form — order 1 always (shows first on mobile) */}
          <div className="col-12 col-lg-7 order-1">
            <div className="lm-card">
              <div className="lm-card-header">
                <h5 className="lm-card-title">Appointment Details</h5>
              </div>
              <div className="p-3 p-md-4">

                <form
  className="needs-validation"
  noValidate
  onSubmit={(e) => {
    if (!e.currentTarget.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
    } else {
      handleSubmit(e);
    }

    e.currentTarget.classList.add("was-validated");
  }}
>
                


                  {/* Advocate */}
                  <div className="mb-4">
                    <label className="form-label">Select Advocate <span style={{ color: "var(--gold-500)" }}>*</span></label>
                    {advocatesLoading ? (
                      <div className="d-flex align-items-center gap-2" style={{ color: "var(--gray-500)" }}>
                        <div className="spinner-border spinner-border-sm" style={{ color: "var(--gold-500)" }} />
                        <span style={{ fontSize: ".9rem" }}>Loading advocates...</span>
                      </div>
                    ) : (
                      <select className="form-select" name="advocateId" value={form.advocateId} onChange={handleChange} required>
                        <option value="">— Choose an Advocate —</option>
                        {advocates.map((adv) => (
                          <option key={adv._id} value={adv._id}>
                            {adv.fullName} — {adv.specialization} (₹{adv.fees?.toLocaleString("en-IN")})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Name + Phone */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-sm-6">
                      <label className="form-label">Full Name <span style={{ color: "var(--gold-500)" }}>*</span></label>
                      <input type="text" className="form-control" name="fullName" value={form.fullName} onChange={handleChange} required />
              <div className="valid-feedback">
  Looks good!
</div>

<div className="invalid-feedback">
  Please enter your full name.
</div>

                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label">Phone <span style={{ color: "var(--gold-500)" }}>*</span></label>
                      <input type="text" className="form-control" name="phone" value={form.phone} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Email <span style={{ color: "var(--gold-500)" }}>*</span></label>
                    <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} required />
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Legal Service <span style={{ color: "var(--gold-500)" }}>*</span></label>
                    <select className="form-select" name="service" value={form.service} onChange={handleChange} required>
                      <option value="">— Select Service —</option>
                      {SERVICES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Date + Time */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-sm-6">
                      <label className="form-label">Date <span style={{ color: "var(--gold-500)" }}>*</span></label>
                      <input type="date" className="form-control" name="appointmentDate" value={form.appointmentDate} onChange={handleChange} min={today} required />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label">Time Slot <span style={{ color: "var(--gold-500)" }}>*</span></label>
                      <select className="form-select" name="timeSlot" value={form.timeSlot} onChange={handleChange} required>
                        <option value="">— Select Time —</option>
                        {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="form-label">Message (optional)</label>
                    <textarea className="form-control" name="message" rows={3} value={form.message} onChange={handleChange}
                      placeholder="Briefly describe your legal matter..." />
                  </div>

                  <button type="submit" className="btn btn-gold w-100 py-2" style={{ fontSize: "1rem" }} disabled={loading}>
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-2" />Booking...</>
                      : "Confirm Appointment"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar — order 2 on mobile (below form), order-lg-1 on desktop (right col) */}
          <div className="col-12 col-lg-4 order-2">

            {/* Advocate card */}
            {selectedAdvocate ? (
              <div className="lm-card mb-4">
                <div style={{ background: "linear-gradient(135deg, var(--navy-800), var(--navy-900))", padding: "1.75rem", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--gold-500)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 800, color: "var(--navy-900)", margin: "0 auto .75rem", border: "3px solid rgba(201,168,76,.4)" }}>
                    {selectedAdvocate.fullName?.charAt(0)}
                  </div>
                  <h5 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--white)", marginBottom: ".25rem" }}>{selectedAdvocate.fullName}</h5>
                  <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".84rem", marginBottom: 0 }}>{selectedAdvocate.qualification}</p>
                </div>
                <div className="p-4">
                  <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 800, color: "var(--gold-500)" }}>
                      ₹{selectedAdvocate.fees?.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: ".78rem", color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: ".06em" }}>per consultation</div>
                  </div>
                  {[
                    ["🎓", selectedAdvocate.qualification],
                    ["📅", `${selectedAdvocate.experience} yrs experience`],
                    ["📍", selectedAdvocate.location],
                    ["⚖️", selectedAdvocate.specialization],
                  ].map(([icon, val]) => (
                    <div key={val} style={{ display: "flex", gap: ".65rem", alignItems: "center", marginBottom: ".6rem", fontSize: ".86rem", color: "var(--gray-600)" }}>
                      <span>{icon}</span><span>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="lm-card mb-4 lm-empty-state" style={{ padding: "2rem" }}>
                <div className="icon">⚖️</div>
                <h5>Choose an Advocate</h5>
                <p>Select an advocate from the dropdown to see their profile and consultation fee</p>
              </div>
            )}

            {/* How it works */}
            <div className="lm-card">
              <div className="lm-card-header"><h5 className="lm-card-title">How It Works</h5></div>
              <div className="p-4">
                {[
                  ["01", "Choose your advocate"],
                  ["02", "Pick a date and time slot"],
                  ["03", "Describe your legal matter"],
                  ["04", "Await admin approval"],
                  ["05", "Attend your consultation"],
                ].map(([n, s]) => (
                  <div key={n} style={{ display: "flex", gap: ".85rem", alignItems: "flex-start", marginBottom: ".85rem" }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--navy-800)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", fontWeight: 800, color: "var(--gold-400)", flexShrink: 0 }}>{n}</span>
                    <span style={{ fontSize: ".87rem", color: "var(--gray-600)", paddingTop: ".2rem" }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    
    </>
  );
}

export default Appointment;
