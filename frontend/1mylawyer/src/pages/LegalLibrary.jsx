import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function LegalLibrary() {
  const [search, setSearch] = useState("");
  const [documents, setDocuments] = useState([]);

  const BASE = "http://localhost:5000";

useEffect(() => {
  fetch(`${BASE}/api/legal-library`)
    .then((res) => res.json())
    .then((data) => {
      setDocuments(data.documents || []);
    })
    .catch((err) => console.error(err));
}, []);

const filtered = documents.filter((doc) =>
  doc.title.toLowerCase().includes(search.toLowerCase()) ||
  (doc.description || "")
    .toLowerCase()
    .includes(search.toLowerCase())
);



  
 
  return (
    <>

      {/* Page Header */}
      <div className="lm-page-header" 
      style={{
       minHeight:"55vh",
       display:"flex",
       alignItems:"center",
       background:
      "radial-gradient(circle at top, rgba(212,175,55,.08), transparent 35%), linear-gradient(135deg,#05080F,#0B1835,#05080F)"
  }}

    
                                           >
        <div className="container lm-page-header-content text-center">
          <div className="lm-gold-bar mx-auto" />
          <h1 style={{
            fontFamily: "var(--font-serif)", fontWeight: 800,
            fontSize: "clamp(1.6rem,5vw,2.4rem)", marginBottom: ".5rem",
          }}>
            Legal Library
          </h1>
          <p style={{ opacity: .75, fontSize: "clamp(1.6rem,5vw,1.4rem)", maxWidth: 500, margin: "0 auto" }}>
            Download free legal document templates — verified and court-ready.
          </p>
        </div>
      </div>

      <div className="container  py-3 py-lg-5">

        {/* Search */}
       <div className="row justify-content-center mt-4 mb-md-5">
          <div className="col-12 col-sm-10 col-md-6">
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "18px", top: "50%",
                transform: "translateY(-50%)",color:"#999",fontSize: "1rem",
                pointerEvents: "none", color: "#9ca3af",
              }}>🔍</span>
              <input
                type="text"
                className="form-control ll-input"
                placeholder="Search legal templates…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "45px", height: "55px",
                  borderRadius:"30px"
                 }}
              />
            </div>
            {search && (
              <p style={{ fontSize: ".82rem", color: "var(--gray-500)", marginTop: ".4rem", marginBottom: 0 }}>
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
              </p>
            )}
            </div>
        
        </div>





        {/* Templates Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📂</div>
            <h5 style={{ fontFamily: "var(--font-serif)", color: "var(--navy-800)", fontWeight: 700 }}>
              No templates found
            </h5>
            <p style={{ color: "var(--gray-500)" }}>Try a different search term.</p>
            <button className="btn btn-outline-gold px-4" onClick={() => setSearch("")}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="row g-3 g-md-4">
            {filtered.map((doc) => (
              <div className="col-12 col-sm-6 col-lg-3" key={doc._id}>
                
                  <div
  className="lm-card h-100 d-flex flex-column"
  style={{
    padding: "1.8rem",
    borderRadius: "22px",
    background: "linear-gradient(145deg, #F5F7FB, #F9EEF7)",
color: "#ffff",
border: "1px solid rgba(212,175,55,.25)"
    
  }}
>


                   
                   <div
  style={{
    width: 50,
    height: 50,
    borderRadius: "18px",
    background: "linear-gradient(135deg,#fff7e6,#ffe9a8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    marginBottom: "1rem",
    border: "1px solid rgba(201,168,76,.3)"
  }}
>
  📄
</div>
                  
                   

                  {/* Title + desc */}

                  <h5
style={{
fontFamily:"var(--font-serif)",
fontSize:"1.05rem",
fontWeight:"700",
color:"var(--navy-800)",
marginBottom:".4rem"
}}
>
{doc.title}
</h5>
                  

                  <p
style={{
fontSize:".85rem",
color:"#6b7280",
lineHeight:"1.6",
minHeight:"55px"
}}
>
{doc.description || "Court verified legal document template."}
</p>
               
                  {/* Download button */}

                  {/* File Info */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    fontSize: ".8rem",
    color: "var(--gray-500)",
  }}
>
  <span>📄 PDF Document</span>
  <span
    style={{
      background: "var(--gold-100)",
      color: "var(--gold-600)",
      padding: "3px 8px",
      borderRadius: "20px",
      fontSize: ".72rem",
      fontWeight: 600,
    }}
  >
    PDF
  </span>
</div>

{/* Download Button */}
<a
  href={`https://onemylawyer.onrender.com/api/legal-library/${doc._id}/download`}
  className="btn btn-gold w-100"
  download
>
  ⬇ Download PDF
</a>

               


                 
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-5 pt-2">
          <p style={{ color: "var(--gray-500)", fontSize: ".9rem", marginBottom: "1rem" }}>
            Need a custom legal document drafted by an expert?
          </p>
          <Link to="/appointment" className="btn btn-gold px-5">
            Consult an Advocate →
          </Link>
        </div>

      </div>
    </>
  );
}

export default LegalLibrary;
