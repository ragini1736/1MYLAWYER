/**
 * Advocates.jsx — /admin/advocates
 * Full CRUD: Add · Edit · Delete (with confirmation) · View detail drawer
 * Profile photo upload via multipart/form-data
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../components/Admin/AdminLayout";
import ConfirmModal from "../../components/Admin/ConfirmModal";
import {
  getAllAdvocates,
  getAdvocateDetails,
  createAdminAdvocate,
  updateAdminAdvocate,
  deleteAdminAdvocate,
} from "../../services/adminService";

/* ── constants ─────────────────────────────────────────────── */
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SPECS = [
  "Civil Law","Criminal Law","Family Law","Property Law",
  "Corporate Law","Cyber Law","Labour Law","Tax Law","Constitutional Law",
];
const AVAILS = ["Available","Busy","On Leave"];
const QUALS  = ["LLB","LLM","BA LLB","BBA LLB","Integrated LLB","PhD"];

const BLANK = {
  fullName:"", email:"", phone:"", qualification:"LLB",
  experience:"", specialization:"Civil Law", location:"",
  fees:"", about:"", availability:"Available", barCouncilNumber:"",
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-IN",{ day:"2-digit",month:"short",year:"numeric" })
  : "—";

/* ── Availability badge ─────────────────────────────────────── */
function AvailBadge({ status }) {
  const map = {
    Available: { bg:"rgba(16,185,129,.12)", color:"#065f46" },
    Busy:      { bg:"rgba(245,158,11,.12)", color:"#92400e" },
    "On Leave":{ bg:"rgba(239,68,68,.10)",  color:"#991b1b" },
  };
  const s = map[status] || { bg:"var(--gray-100)", color:"var(--gray-600)" };
  return (
    <span style={{
      background:s.bg, color:s.color, borderRadius:20,
      padding:"2px 10px", fontSize:".7rem", fontWeight:700,
      textTransform:"uppercase", letterSpacing:".05em",
    }}>{status||"—"}</span>
  );
}

/* ── Add/Edit drawer ────────────────────────────────────────── */
function AdvocateFormDrawer({ editData, onClose, onSaved }) {
  const [form,    setForm   ] = useState(editData ? { ...editData } : { ...BLANK });
  const [photo,   setPhoto  ] = useState(null);       // File object
  const [preview, setPreview] = useState(editData?.profileImage
    ? `${BASE}${editData.profileImage}` : null);
  const [saving,  setSaving ] = useState(false);
  const fileRef = useRef(null);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    const required = ["fullName","email","phone","qualification","experience",
                      "specialization","location","fees","about"];
    for (const k of required) {
      if (!form[k]?.toString().trim()) {
        toast.warning(`${k} is required`); return;
      }
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      if (photo) fd.append("profilePhoto", photo);

      if (editData?._id) {
        await updateAdminAdvocate(editData._id, fd);
        toast.success("Advocate updated");
      } else {
        await createAdminAdvocate(fd);
        toast.success("Advocate added");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const inputStyle = { borderRadius:8, fontSize:".88rem", border:"1.5px solid var(--gray-200)" };

  return (
    <>
      <div style={{ position:"fixed",inset:0,background:"rgba(6,14,30,.45)",zIndex:1200 }} onClick={onClose} />
      <div style={{
        position:"fixed",top:0,right:0,
        width:"min(560px,100vw)", height:"100vh",
        background:"#fff", zIndex:1201,
        display:"flex", flexDirection:"column",
        boxShadow:"-8px 0 40px rgba(6,14,30,.2)",
        animation:"lm-fadeIn .22s ease both",
      }}>
        {/* Header */}
        <div style={{
          background:"var(--navy-800)", padding:"1rem 1.5rem",
          display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0,
        }}>
          <h6 style={{ color:"#fff",fontFamily:"var(--font-serif)",margin:0,fontWeight:700 }}>
            {editData ? "Edit Advocate" : "Add New Advocate"}
          </h6>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,.12)",border:"none",color:"#fff",
            borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:".9rem",
          }}>✕</button>
        </div>

        {/* Scrollable form body */}
        <div style={{ flex:1,overflowY:"auto",padding:"1.5rem" }}>
          <form onSubmit={submit} noValidate>

            {/* Profile photo */}
            <div style={{ textAlign:"center",marginBottom:"1.5rem" }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  width:88,height:88,borderRadius:"50%",margin:"0 auto .75rem",
                  background: preview
                    ? "transparent"
                    : "linear-gradient(135deg,var(--gold-500),var(--gold-600))",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:"pointer",overflow:"hidden",
                  border:"3px solid rgba(201,168,76,.5)",
                  boxShadow:"0 0 0 4px rgba(201,168,76,.12)",
                  position:"relative",
                }}>
                {preview
                  ? <img src={preview} alt="preview"
                      style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                  : <span style={{
                      fontFamily:"var(--font-serif)",fontSize:"1.8rem",
                      fontWeight:800,color:"var(--navy-900)",
                    }}>
                      {(form.fullName||"A").charAt(0).toUpperCase()}
                    </span>}
                <div style={{
                  position:"absolute",bottom:0,left:0,right:0,
                  background:"rgba(0,0,0,.5)",color:"#fff",
                  fontSize:".6rem",fontWeight:700,textAlign:"center",
                  padding:"3px 0",letterSpacing:".05em",
                }}>PHOTO</div>
              </div>
              <input ref={fileRef} type="file" accept="image/*"
                style={{ display:"none" }} onChange={onFile} />
              <p style={{ fontSize:".72rem",color:"var(--gray-400)",margin:0 }}>
                Click avatar to upload photo (JPG/PNG, max 5MB)
              </p>
            </div>

            {/* Row: Full Name + Email */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label style={{ display:"block",fontWeight:600,fontSize:".78rem",
                  color:"var(--navy-800)",textTransform:"uppercase",
                  letterSpacing:".06em",marginBottom:".35rem" }}>
                  Full Name *
                </label>
                <input type="text" name="fullName" className="form-control"
                  value={form.fullName} onChange={handle}
                  placeholder="Ankesh Yadav" required style={inputStyle} />
              </div>
              <div className="col-12 col-sm-6">
                <label style={{ display:"block",fontWeight:600,fontSize:".78rem",
                  color:"var(--navy-800)",textTransform:"uppercase",
                  letterSpacing:".06em",marginBottom:".35rem" }}>
                  Email *
                </label>
                <input type="email" name="email" className="form-control"
                  value={form.email} onChange={handle}
                  placeholder="advocate@example.com" required style={inputStyle} />
              </div>
            </div>

            {/* Row: Phone + Bar Council */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label style={{ display:"block",fontWeight:600,fontSize:".78rem",
                  color:"var(--navy-800)",textTransform:"uppercase",
                  letterSpacing:".06em",marginBottom:".35rem" }}>
                  Phone *
                </label>
                <input type="text" name="phone" className="form-control"
                  value={form.phone} onChange={handle}
                  placeholder="+91 98765 43210" required style={inputStyle} />
              </div>
              <div className="col-12 col-sm-6">
                <label style={{ display:"block",fontWeight:600,fontSize:".78rem",
                  color:"var(--navy-800)",textTransform:"uppercase",
                  letterSpacing:".06em",marginBottom:".35rem" }}>
                  Bar Council No.
                </label>
                <input type="text" name="barCouncilNumber" className="form-control"
                  value={form.barCouncilNumber} onChange={handle}
                  placeholder="Optional" style={inputStyle} />
              </div>
            </div>

            {/* Row: Qualification + Experience */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label style={{ display:"block",fontWeight:600,fontSize:".78rem",
                  color:"var(--navy-800)",textTransform:"uppercase",
                  letterSpacing:".06em",marginBottom:".35rem" }}>
                  Qualification *
                </label>
                <select name="qualification" className="form-select"
                  value={form.qualification} onChange={handle} style={inputStyle}>
                  {QUALS.map((q) => <option key={q}>{q}</option>)}
                </select>
              </div>
              <div className="col-12 col-sm-6">
                <label style={{ display:"block",fontWeight:600,fontSize:".78rem",
                  color:"var(--navy-800)",textTransform:"uppercase",
                  letterSpacing:".06em",marginBottom:".35rem" }}>
                  Experience (years) *
                </label>
                <input type="number" name="experience" className="form-control"
                  value={form.experience} onChange={handle} min="0" max="60"
                  placeholder="5" required style={inputStyle} />
              </div>
            </div>

            {/* Row: Specialization + Availability */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label style={{ display:"block",fontWeight:600,fontSize:".78rem",
                  color:"var(--navy-800)",textTransform:"uppercase",
                  letterSpacing:".06em",marginBottom:".35rem" }}>
                  Specialization *
                </label>
                <select name="specialization" className="form-select"
                  value={form.specialization} onChange={handle} style={inputStyle}>
                  {SPECS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-12 col-sm-6">
                <label style={{ display:"block",fontWeight:600,fontSize:".78rem",
                  color:"var(--navy-800)",textTransform:"uppercase",
                  letterSpacing:".06em",marginBottom:".35rem" }}>
                  Availability
                </label>
                <select name="availability" className="form-select"
                  value={form.availability} onChange={handle} style={inputStyle}>
                  {AVAILS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* Row: Location + Fee */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label style={{ display:"block",fontWeight:600,fontSize:".78rem",
                  color:"var(--navy-800)",textTransform:"uppercase",
                  letterSpacing:".06em",marginBottom:".35rem" }}>
                  Location *
                </label>
                <input type="text" name="location" className="form-control"
                  value={form.location} onChange={handle}
                  placeholder="Lucknow, UP" required style={inputStyle} />
              </div>
              <div className="col-12 col-sm-6">
                <label style={{ display:"block",fontWeight:600,fontSize:".78rem",
                  color:"var(--navy-800)",textTransform:"uppercase",
                  letterSpacing:".06em",marginBottom:".35rem" }}>
                  Consultation Fee (₹) *
                </label>
                <input type="number" name="fees" className="form-control"
                  value={form.fees} onChange={handle} min="0"
                  placeholder="1000" required style={inputStyle} />
              </div>
            </div>

            {/* About */}
            <div className="mb-4">
              <label style={{ display:"block",fontWeight:600,fontSize:".78rem",
                color:"var(--navy-800)",textTransform:"uppercase",
                letterSpacing:".06em",marginBottom:".35rem" }}>
                About / Bio *
              </label>
              <textarea name="about" className="form-control" rows={4}
                value={form.about} onChange={handle}
                placeholder="Brief professional bio of the advocate..."
                required style={{ ...inputStyle, resize:"vertical" }} />
            </div>

            {/* Submit */}
            <div style={{ display:"flex",gap:".75rem" }}>
              <button type="submit" disabled={saving}
                className="btn btn-gold flex-grow-1"
                style={{ borderRadius:8,fontSize:".88rem",fontWeight:700 }}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-2" />
                      {editData ? "Saving…" : "Adding…"}</>
                  : editData ? "💾 Save Changes" : "➕ Add Advocate"}
              </button>
              <button type="button" onClick={onClose}
                className="btn btn-outline-secondary"
                style={{ borderRadius:8,fontSize:".88rem" }}>
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}

/* ── Detail view drawer ─────────────────────────────────────── */
function AdvocateDetailDrawer({ advocate, onClose, onEdit }) {
  if (!advocate) return null;
  const imgSrc = advocate.profileImage ? `${BASE}${advocate.profileImage}` : null;
  const initial = (advocate.fullName||"A").charAt(0).toUpperCase();

  const rows = [
    ["⚖️","Specialization", advocate.specialization||"—"],
    ["🎓","Qualification",  advocate.qualification||"—"],
    ["📅","Experience",     advocate.experience ? `${advocate.experience} yrs` : "—"],
    ["📍","Location",       advocate.location||"—"],
    ["📞","Phone",          advocate.phone||"—"],
    ["📧","Email",          advocate.email||"—"],
    ["🪪","Bar Council",    advocate.barCouncilNumber||"—"],
    ["🗓","Joined",         fmtDate(advocate.createdAt)],
    ["📋","Appointments",   advocate.appointmentCount ?? 0],
    ["📁","Cases",          advocate.caseCount ?? 0],
  ];

  return (
    <>
      <div style={{ position:"fixed",inset:0,background:"rgba(6,14,30,.45)",zIndex:1200 }} onClick={onClose} />
      <div style={{
        position:"fixed",top:0,right:0,
        width:"min(460px,100vw)",height:"100vh",
        background:"#fff",zIndex:1201,
        display:"flex",flexDirection:"column",
        boxShadow:"-8px 0 40px rgba(6,14,30,.2)",
        animation:"lm-fadeIn .22s ease both",
      }}>
        {/* Header */}
        <div style={{
          background:"var(--navy-800)",padding:"1rem 1.5rem",
          display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,
        }}>
          <h6 style={{ color:"#fff",fontFamily:"var(--font-serif)",margin:0,fontWeight:700 }}>
            Advocate Profile
          </h6>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,.12)",border:"none",color:"#fff",
            borderRadius:8,width:32,height:32,cursor:"pointer",
          }}>✕</button>
        </div>

        <div style={{ flex:1,overflowY:"auto" }}>
          {/* Identity block */}
          <div style={{
            padding:"1.5rem 1.5rem 1.25rem",
            borderBottom:"1px solid var(--gray-100)",
            display:"flex",alignItems:"center",gap:"1rem",
          }}>
            <div style={{
              width:64,height:64,borderRadius:"50%",flexShrink:0,
              background: imgSrc?"transparent":"linear-gradient(135deg,var(--gold-500),var(--gold-600))",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:"var(--font-serif)",fontSize:"1.5rem",fontWeight:800,
              color:"var(--navy-900)",
              border:"3px solid rgba(201,168,76,.5)",
              boxShadow:"0 0 0 4px rgba(201,168,76,.12)",
              overflow:"hidden",
            }}>
              {imgSrc
                ? <img src={imgSrc} alt={advocate.fullName}
                    style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                : initial}
            </div>
            <div style={{ minWidth:0,flex:1 }}>
              <h5 style={{ fontFamily:"var(--font-serif)",fontWeight:800,
                color:"var(--navy-800)",margin:"0 0 .2rem",
                fontSize:"clamp(.95rem,2.5vw,1.1rem)",wordBreak:"break-word" }}>
                {advocate.fullName}
              </h5>
              <p style={{ fontSize:".78rem",color:"var(--gray-500)",
                margin:"0 0 .4rem",wordBreak:"break-all" }}>
                {advocate.email}
              </p>
              <AvailBadge status={advocate.availability} />
            </div>
          </div>

          {/* About */}
          {advocate.about && (
            <div style={{ padding:"1rem 1.5rem",borderBottom:"1px solid var(--gray-100)" }}>
              <p style={{ fontSize:".85rem",color:"var(--gray-600)",lineHeight:1.65,margin:0 }}>
                {advocate.about}
              </p>
            </div>
          )}

          {/* Detail rows */}
          <div style={{ padding:"0 1.5rem" }}>
            {rows.map(([icon,label,val]) => (
              <div key={label} style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",
                gap:".75rem",padding:".65rem 0",
                borderBottom:"1px solid var(--gray-100)",
              }}>
                <div style={{ display:"flex",alignItems:"center",gap:".5rem",flexShrink:0 }}>
                  <span style={{ fontSize:".9rem" }}>{icon}</span>
                  <span style={{ fontSize:".82rem",color:"var(--gray-500)",fontWeight:500 }}>{label}</span>
                </div>
                <span style={{ fontSize:".88rem",color:"var(--navy-800)",
                  fontWeight:600,textAlign:"right",wordBreak:"break-word",maxWidth:"55%" }}>
                  {String(val)}
                </span>
              </div>
            ))}
          </div>

          {/* Fees block */}
          <div style={{ padding:"1.25rem 1.5rem",borderTop:"1px solid var(--gray-100)",
            display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <span style={{ fontSize:".82rem",color:"var(--gray-500)",fontWeight:500 }}>
              Consultation Fee
            </span>
            <span style={{ fontFamily:"var(--font-serif)",fontSize:"1.2rem",
              fontWeight:800,color:"var(--navy-800)" }}>
              ₹{Number(advocate.fees||0).toLocaleString("en-IN")}
              <span style={{ fontFamily:"var(--font-sans)",fontSize:".72rem",
                color:"var(--gray-400)",fontWeight:400,marginLeft:4 }}>/session</span>
            </span>
          </div>

          {/* Edit button */}
          <div style={{ padding:"0 1.5rem 1.5rem" }}>
            <button onClick={() => { onClose(); onEdit(advocate); }}
              className="btn btn-gold w-100"
              style={{ borderRadius:8,fontSize:".88rem",fontWeight:600 }}>
              ✏️ Edit This Advocate
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════ MAIN PAGE ══════════════════════════ */
export default function Advocates() {
  const [advocates,   setAdvocates  ] = useState([]);
  const [loading,     setLoading    ] = useState(true);
  const [error,       setError      ] = useState(null);
  const [search,      setSearch     ] = useState("");
  const [specFilter,  setSpecFilter ] = useState("");
  const [availFilter, setAvailFilter] = useState("");
  const [page,        setPage       ] = useState(1);
  const [totalPages,  setTotalPages ] = useState(1);
  const [totalCount,  setTotalCount ] = useState(0);

  /* drawer state */
  const [showForm,    setShowForm   ] = useState(false);
  const [editData,    setEditData   ] = useState(null);   // null = Add, obj = Edit
  const [viewAdv,     setViewAdv    ] = useState(null);   // detail drawer
  const [loadingDetail,setLoadingDetail] = useState(false);

  /* delete confirm */
  const [confirmId,   setConfirmId  ] = useState(null);
  const [deleting,    setDeleting   ] = useState(false);

  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getAllAdvocates({
        search:         search        || undefined,
        specialization: specFilter    || undefined,
        availability:   availFilter   || undefined,
        page,
        limit: PAGE_SIZE,
      });
      const d = res.data;
      setAdvocates(d.advocates ?? []);
      setTotalPages(d.totalPages ?? 1);
      setTotalCount(d.totalCount ?? d.total ?? 0);
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to load advocates";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  }, [search, specFilter, availFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, specFilter, availFilter]);

  const handleView = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await getAdvocateDetails(id);
      setViewAdv(res.data.advocate ?? res.data);
    } catch { toast.error("Could not load advocate details"); }
    finally { setLoadingDetail(false); }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await deleteAdminAdvocate(confirmId);
      toast.success("Advocate deleted");
      setConfirmId(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    } finally { setDeleting(false); }
  };

  return (
    <AdminLayout title="Advocates">

      {/* Page header */}
      <div style={{ marginBottom:"1.5rem" }}>
        <div className="lm-gold-bar" style={{ marginBottom:".5rem" }} />
        <div style={{ display:"flex",justifyContent:"space-between",
          alignItems:"center",flexWrap:"wrap",gap:"1rem" }}>
          <div>
            <h4 style={{ fontFamily:"var(--font-serif)",fontWeight:800,
              color:"var(--navy-800)",margin:0 }}>
              Advocate Management
            </h4>
            <p style={{ color:"var(--gray-500)",fontSize:".88rem",margin:0 }}>
              {totalCount} advocates registered
            </p>
          </div>
          <button
            onClick={() => { setEditData(null); setShowForm(true); }}
            className="btn btn-gold"
            style={{ borderRadius:8,fontSize:".88rem",fontWeight:700 }}>
            ➕ Add Advocate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex",gap:".75rem",flexWrap:"wrap",
        marginBottom:"1.25rem",alignItems:"center" }}>
        <div style={{ position:"relative",flex:"1 1 260px",maxWidth:360 }}>
          <span style={{ position:"absolute",left:10,top:"50%",
            transform:"translateY(-50%)",color:"var(--gray-400)",pointerEvents:"none" }}>
            🔍
          </span>
          <input type="text" className="form-control"
            placeholder="Search name, email, location…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft:32,borderRadius:8,height:40,fontSize:".88rem" }} />
        </div>
        <select className="form-select" value={specFilter}
          onChange={(e) => setSpecFilter(e.target.value)}
          style={{ borderRadius:8,height:40,fontSize:".88rem",maxWidth:200 }}>
          <option value="">All Specializations</option>
          {SPECS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="form-select" value={availFilter}
          onChange={(e) => setAvailFilter(e.target.value)}
          style={{ borderRadius:8,height:40,fontSize:".88rem",maxWidth:160 }}>
          <option value="">All Availability</option>
          {AVAILS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button onClick={load} className="btn btn-outline-secondary"
          style={{ borderRadius:8,height:40,fontSize:".88rem" }}>
          🔄 Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ background:"#fff",borderRadius:14,
        border:"1px solid var(--gray-200)",
        boxShadow:"0 2px 12px rgba(6,14,30,.06)",overflow:"hidden" }}>

        {loading ? (
          <div className="p-5 text-center">
            <div className="lm-spinner" />
            <p style={{ color:"var(--gray-500)",fontSize:".88rem",marginTop:12 }}>
              Loading advocates…
            </p>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="alert alert-danger d-flex justify-content-between align-items-center"
              style={{ borderRadius:10,margin:0 }}>
              <span>⚠️ {error}</span>
              <button className="btn btn-sm btn-danger" onClick={load}
                style={{ borderRadius:6 }}>Retry</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",minWidth:720 }}>
                <thead>
                  <tr style={{ background:"var(--navy-800)" }}>
                    {["Advocate","Specialization","Experience","Availability",
                      "Appointments","Actions"].map((h) => (
                      <th key={h} style={{
                        padding:".75rem 1rem",fontSize:".72rem",fontWeight:700,
                        textTransform:"uppercase",letterSpacing:".07em",
                        color:"rgba(255,255,255,.9)",border:"none",whiteSpace:"nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {advocates.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding:"3rem",textAlign:"center",
                        color:"var(--gray-400)" }}>
                        No advocates found.{" "}
                        <button onClick={() => { setEditData(null); setShowForm(true); }}
                          style={{ background:"none",border:"none",color:"var(--gold-500)",
                            fontWeight:700,cursor:"pointer",fontSize:".88rem" }}>
                          Add the first one →
                        </button>
                      </td>
                    </tr>
                  ) : advocates.map((a, idx) => {
                    const imgSrc = a.profileImage ? `${BASE}${a.profileImage}` : null;
                    const initial = (a.fullName||"A").charAt(0).toUpperCase();
                    return (
                      <tr key={a._id} style={{
                        borderBottom:"1px solid var(--gray-100)",
                        background: idx%2===0 ? "#fff" : "var(--gray-50)",
                      }}>
                        <td style={{ padding:".75rem 1rem" }}>
                          <div style={{ display:"flex",alignItems:"center",gap:".6rem" }}>
                            <div style={{
                              width:36,height:36,borderRadius:"50%",flexShrink:0,
                              background: imgSrc?"transparent"
                                :"linear-gradient(135deg,var(--gold-500),var(--gold-600))",
                              display:"flex",alignItems:"center",justifyContent:"center",
                              color:"var(--navy-900)",fontWeight:700,fontSize:".85rem",
                              overflow:"hidden",border:"2px solid rgba(201,168,76,.3)",
                            }}>
                              {imgSrc
                                ? <img src={imgSrc} alt={a.fullName}
                                    style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                                : initial}
                            </div>
                            <div>
                              <div style={{ fontWeight:600,fontSize:".88rem",
                                color:"var(--navy-800)" }}>{a.fullName}</div>
                              <div style={{ fontSize:".73rem",color:"var(--gray-500)" }}>
                                {a.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:".75rem 1rem",fontSize:".85rem",
                          color:"var(--gray-700)" }}>{a.specialization||"—"}</td>
                        <td style={{ padding:".75rem 1rem",fontSize:".85rem",
                          color:"var(--gray-700)",textAlign:"center" }}>
                          {a.experience ? `${a.experience} yrs` : "—"}
                        </td>
                        <td style={{ padding:".75rem 1rem" }}>
                          <AvailBadge status={a.availability} />
                        </td>
                        <td style={{ padding:".75rem 1rem",fontSize:".85rem",
                          color:"var(--gray-700)",textAlign:"center" }}>
                          {a.appointmentCount ?? 0}
                        </td>
                        <td style={{ padding:".75rem 1rem" }}>
                          <div style={{ display:"flex",gap:".35rem",flexWrap:"nowrap" }}>
                            {/* View */}
                            <button onClick={() => handleView(a._id)}
                              disabled={loadingDetail}
                              style={{ background:"rgba(59,130,246,.1)",border:"none",
                                borderRadius:6,padding:"4px 9px",cursor:"pointer",
                                fontSize:".75rem",color:"#1e40af",fontWeight:600 }}>
                              👁
                            </button>
                            {/* Edit */}
                            <button onClick={() => { setEditData(a); setShowForm(true); }}
                              style={{ background:"rgba(201,168,76,.12)",border:"none",
                                borderRadius:6,padding:"4px 9px",cursor:"pointer",
                                fontSize:".75rem",color:"var(--gold-600)",fontWeight:600 }}>
                              ✏️
                            </button>
                            {/* Delete */}
                            <button onClick={() => setConfirmId(a._id)}
                              style={{ background:"rgba(239,68,68,.1)",border:"none",
                                borderRadius:6,padding:"4px 9px",cursor:"pointer",
                                fontSize:".75rem",color:"#dc2626",fontWeight:600 }}>
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding:".75rem 1rem",borderTop:"1px solid var(--gray-100)",
                display:"flex",justifyContent:"space-between",
                alignItems:"center",flexWrap:"wrap",gap:".5rem" }}>
                <span style={{ fontSize:".8rem",color:"var(--gray-500)" }}>
                  Page {page} of {totalPages}
                </span>
                <div style={{ display:"flex",gap:".35rem" }}>
                  <button onClick={() => setPage((p) => Math.max(1,p-1))}
                    disabled={page===1} className="btn btn-sm btn-outline-secondary"
                    style={{ borderRadius:6,fontSize:".8rem" }}>← Prev</button>
                  {Array.from({ length:Math.min(5,totalPages) },(_,i) => {
                    const n = Math.max(1,Math.min(page-2,totalPages-4))+i;
                    return (
                      <button key={n} onClick={() => setPage(n)}
                        className={`btn btn-sm ${n===page?"btn-navy":"btn-outline-secondary"}`}
                        style={{ borderRadius:6,fontSize:".8rem",minWidth:32 }}>{n}</button>
                    );
                  })}
                  <button onClick={() => setPage((p) => Math.min(totalPages,p+1))}
                    disabled={page===totalPages} className="btn btn-sm btn-outline-secondary"
                    style={{ borderRadius:6,fontSize:".8rem" }}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Add/Edit form drawer ── */}
      {showForm && (
        <AdvocateFormDrawer
          editData={editData}
          onClose={() => { setShowForm(false); setEditData(null); }}
          onSaved={load}
        />
      )}

      {/* ── Detail view drawer ── */}
      {viewAdv && (
        <AdvocateDetailDrawer
          advocate={viewAdv}
          onClose={() => setViewAdv(null)}
          onEdit={(adv) => { setEditData(adv); setShowForm(true); }}
        />
      )}

      {/* ── Delete confirm ── */}
      <ConfirmModal
        show={!!confirmId}
        onHide={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Advocate"
        message="This will permanently delete the advocate and their profile photo. All related appointments and cases will reference a missing advocate. This cannot be undone."
        confirmText="Delete"
        danger
        loading={deleting}
      />

    </AdminLayout>
  );
}
