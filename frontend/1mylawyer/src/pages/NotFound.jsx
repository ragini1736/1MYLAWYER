import { Link, useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <>

      <div style={{
        minHeight: "calc(100vh - 220px)",
        background: "linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>

        {/* Background glow */}
        <div style={{
          position: "absolute", top: "40%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 600, height: 300, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(201,168,76,.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="container text-center position-relative" style={{ zIndex: 1 }}>

          {/* 404 number */}
          <div style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(6rem, 15vw, 10rem)",
            fontWeight: 800,
            color: "transparent",
            WebkitTextStroke: "2px rgba(201,168,76,.4)",
            lineHeight: 1,
            marginBottom: "1rem",
            userSelect: "none",
          }}>
            404
          </div>

          {/* Icon */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(201,168,76,.12)",
            border: "2px solid rgba(201,168,76,.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.5rem", margin: "0 auto 1.5rem",
          }}>
            ⚖️
          </div>

          <div className="lm-gold-bar mx-auto mb-3" />

          <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, color: "var(--white)", fontSize: "2rem", marginBottom: ".75rem" }}>
            Page Not Found
          </h2>

          <p style={{ color: "rgba(255,255,255,.6)", fontSize: "1.05rem", maxWidth: 440, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            The page you are looking for doesn't exist or has been moved. Let us help you find what you need.
          </p>

          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <button onClick={() => navigate(-1)} className="btn btn-outline-white btn-lg px-5">
              ← Go Back
            </button>
            <Link to="/" className="btn btn-gold btn-lg px-5">
              Go to Homepage
            </Link>
          </div>

          {/* Quick links */}
          <div style={{ marginTop: "3rem", borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: "2rem" }}>
            <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".84rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Or visit one of these pages
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              {[
                ["/advocates",      "Browse Advocates"],
                ["/service",        "Our Services"   ],
                ["/appointment",    "Book Consultation"],
                ["/contact",        "Contact Us"     ],
              ].map(([to, label]) => (
                <Link key={to} to={to} style={{
                  color: "var(--gold-400)", fontSize: ".88rem", fontWeight: 600,
                  textDecoration: "none", padding: ".35rem .9rem",
                  border: "1px solid rgba(201,168,76,.2)", borderRadius: "30px",
                  transition: "var(--transition)",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,.1)"; e.currentTarget.style.borderColor = "rgba(201,168,76,.5)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(201,168,76,.2)"; }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

    
    </>
  );
}

export default NotFound;
