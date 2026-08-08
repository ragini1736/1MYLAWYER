/**
 * Settings.jsx  —  /admin/settings
 * ──────────────────────────────────
 * Live endpoints:
 *   GET /api/user/profile                    → load admin profile on mount
 *   PUT /api/user/profile                    → save name + phone
 *   PUT /api/user/profile/change-password    → change password
 *
 * Site Settings: no backend endpoint yet — UI preserved, save shows info toast.
 */
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../components/Admin/AdminLayout";
import { getAdminProfile, updateAdminProfile, changeAdminPassword,getSiteSettings,updateSiteSettings } from "../../services/adminService";

function SectionCard({ title, icon, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)", boxShadow: "0 2px 12px rgba(6,14,30,.06)", overflow: "hidden", marginBottom: "1.5rem" }}>
      <div style={{ background: "var(--gray-50)", padding: "1rem 1.5rem", borderBottom: "1px solid var(--gray-200)", display: "flex", alignItems: "center", gap: ".6rem" }}>
        <span style={{ fontSize: "1.1rem" }}>{icon}</span>
        <h6 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--navy-800)", margin: 0 }}>{title}</h6>
      </div>
      <div style={{ padding: "1.5rem" }}>{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <label style={{ display: "block", fontWeight: 600, fontSize: ".78rem", color: "var(--navy-800)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".4rem" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function Settings() {
  const raw  = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : {};

  /* Profile form — pre-filled from localStorage, refreshed from API on mount */
  const [profile, setProfile] = useState({
    name:  user.name  || "",
    email: user.email || "",
    phone: user.phone || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  /* Fetch latest profile from server on mount */
  useEffect(() => {
    getAdminProfile()
      .then((res) => {
        const u = res.data.user ?? res.data;
        setProfile({ name: u.name || "", email: u.email || "", phone: u.phone || "" });
      })
      .catch(() => {}); // silently fall back to localStorage data
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) { toast.warning("Name is required"); return; }
    setSavingProfile(true);
    try {
      const res = await updateAdminProfile({ name: profile.name.trim(), phone: profile.phone.trim() });
      const updated = res.data.user ?? res.data;
      /* update localStorage so Navbar avatar reflects the change immediately */
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, name: updated.name, phone: updated.phone }));
      window.dispatchEvent(new Event("authChange"));
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Profile update failed");
    } finally { setSavingProfile(false); }
  };

  useEffect(() => {
  getSiteSettings()
    .then((res) => {
      const s = res.data.settings ?? res.data;

      setSite({
        siteName: s.siteName || "1MyLawyer",
        contactEmail: s.contactEmail || "admin@1mylawyer.com",
        maintenanceMode: s.maintenanceMode ?? false,
        allowRegistration: s.allowRegistration ?? true,
      });
    })
    .catch((err) => {
      console.error("Failed to load site settings:", err);
    });
}, []);





  /* Password form */
  const [pwd, setPwd] = useState({ current: "", newPwd: "", confirm: "" });
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });
  const [savingPwd, setSavingPwd] = useState(false);

  /* Site settings (TODO) */
  const [site, setSite] = useState({
    siteName:      "1MyLawyer",
    contactEmail:  "admin@1mylawyer.com",
    maintenanceMode: false,
    allowRegistration: true,
  });
  const [savingSite, setSavingSite] = useState(false);

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwd.newPwd !== pwd.confirm) { toast.error("New passwords do not match"); return; }
    if (pwd.newPwd.length < 6)      { toast.error("Password must be at least 6 characters"); return; }
    setSavingPwd(true);
    try {
      await changeAdminPassword({ currentPassword: pwd.current, newPassword: pwd.newPwd });
      toast.success("Password changed successfully");
      setPwd({ current: "", newPwd: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change failed");
    } finally { setSavingPwd(false); }
  };

 

  const handleSiteSave = async (e) => {
  e.preventDefault();
  setSavingSite(true);

  try {
    const res = await updateSiteSettings({
      siteName: site.siteName.trim(),
      contactEmail: site.contactEmail.trim(),
      maintenanceMode: site.maintenanceMode,
      allowRegistration: site.allowRegistration,
    });

    const updated = res.data.settings ?? res.data;

    setSite({
      siteName: updated.siteName || "",
      contactEmail: updated.contactEmail || "",
      maintenanceMode: updated.maintenanceMode ?? false,
      allowRegistration: updated.allowRegistration ?? true,
    });

    toast.success("Site settings updated successfully");
  } catch (err) {
    console.error("UPDATE SITE SETTINGS ERROR:", err);

    toast.error(
      err.response?.data?.message || "Failed to update site settings"
    );
  } finally {
    setSavingSite(false);
  }
};



  const inputStyle = { borderRadius: 8, fontSize: ".9rem", border: "1.5px solid var(--gray-200)" };
const getValidationStyle = (value, valid = true) => {
  if (!value) {
    return {
      borderRadius: 8,
      fontSize: ".9rem",
      border: "1.5px solid #dc3545",
      background: "#fff5f5",
    };
  }

  if (!valid) {
    return {
      borderRadius: 8,
      fontSize: ".9rem",
      border: "1.5px solid #dc3545",
      background: "#fff5f5",
    };
  }

  return {
    borderRadius: 8,
    fontSize: ".9rem",
    border: "1.5px solid #198754",
    background: "#f3fff8",
  };
};





  return (
    <AdminLayout title="Settings">
      {/* ── page header ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="lm-gold-bar" style={{ marginBottom: ".5rem" }} />
        <h4 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, color: "var(--navy-800)", margin: 0 }}>Settings</h4>
        <p style={{ color: "var(--gray-500)", fontSize: ".88rem", margin: 0 }}>Manage admin profile and site configuration</p>
      </div>

      <div className="row g-0">
        <div className="col-12 col-xl-12">

          {/* ── Admin Profile ── */}
          <SectionCard title="Admin Profile" icon="👤">
            <form onSubmit={handleProfileSave} noValidate>
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <Field label="Full Name">
                    <input type="text" className="form-control" value={profile.name}
                      onChange={(e) => setProfile((f) => ({ ...f, name: e.target.value }))}
                      style={inputStyle} />
                  </Field>
                </div>
                <div className="col-12 col-sm-6">
                  <Field label="Email Address">
                    <input type="email" className="form-control" value={profile.email}
                      onChange={(e) => setProfile((f) => ({ ...f, email: e.target.value }))}
                      style={inputStyle} />
                  </Field>
                </div>
                <div className="col-12 col-sm-6">
                  <Field label="Phone">
                    <input type="tel" className="form-control" value={profile.phone}
                      onChange={(e) => setProfile((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 XXXXX XXXXX" style={inputStyle} />
                  </Field>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginTop: ".5rem" }}>
                <button type="submit" disabled={savingProfile} className="btn btn-gold" style={{ borderRadius: 8, fontSize: ".85rem" }}>
                  {savingProfile ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : "💾 Save Profile"}
                </button>
              </div>
            </form>
          </SectionCard>

          {/* ── Change Password ── */}

          {/* ── Change Password ── */}
<SectionCard title="Change Password" icon="🔒">
  <form onSubmit={handlePasswordSave} noValidate>

    {/* Current Password */}
    <Field label="Current Password">
      <div style={{ position: "relative" }}>
        <input
          type={showPwd.current ? "text" : "password"}
          className="form-control"
          placeholder="Enter current password"
          value={pwd.current}
          onChange={(e) =>
            setPwd((f) => ({ ...f, current: e.target.value }))
          }
          style={{
            ...inputStyle,
            paddingRight: 42,
            border:
              pwd.current.length > 0
                ? "1.5px solid #198754"
                : "1.5px solid var(--gray-200)",
            background:
              pwd.current.length > 0 ? "#f3fff8" : "#fff",
          }}
        />

        <button
          type="button"
          onClick={() =>
            setShowPwd((s) => ({ ...s, current: !s.current }))
          }
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: ".9rem",
            color: "var(--gray-400)",
            padding: 0,
          }}
        >
          {showPwd.current ? "🙈" : "👁"}
        </button>
      </div>

      {pwd.current.length === 0 && (
        <div
          style={{
            color: "#dc3545",
            fontSize: ".72rem",
            marginTop: ".35rem",
          }}
        >
          Current password is required
        </div>
      )}
    </Field>


    {/* New Password */}
    <Field label="New Password">
      <div style={{ position: "relative" }}>
        <input
          type={showPwd.newPwd ? "text" : "password"}
          className="form-control"
          placeholder="At least 6 characters"
          value={pwd.newPwd}
          onChange={(e) =>
            setPwd((f) => ({ ...f, newPwd: e.target.value }))
          }
          style={{
            ...inputStyle,
            paddingRight: 42,
            border:
              pwd.newPwd.length === 0
                ? "1.5px solid var(--gray-200)"
                : pwd.newPwd.length < 6
                ? "1.5px solid #dc3545"
                : "1.5px solid #198754",
            background:
              pwd.newPwd.length === 0
                ? "#fff"
                : pwd.newPwd.length < 6
                ? "#fff5f5"
                : "#f3fff8",
          }}
        />

        <button
          type="button"
          onClick={() =>
            setShowPwd((s) => ({ ...s, newPwd: !s.newPwd }))
          }
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: ".9rem",
            color: "var(--gray-400)",
            padding: 0,
          }}
        >
          {showPwd.newPwd ? "🙈" : "👁"}
        </button>
      </div>

      {/* Password strength */}
      {pwd.newPwd && (
        <div style={{ marginTop: ".5rem" }}>
          <div
            style={{
              height: 5,
              borderRadius: 4,
              background: "var(--gray-100)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 4,
                width:
                  pwd.newPwd.length < 6
                    ? "25%"
                    : pwd.newPwd.length < 10
                    ? "60%"
                    : "100%",
                background:
                  pwd.newPwd.length < 6
                    ? "#dc3545"
                    : pwd.newPwd.length < 10
                    ? "#f59e0b"
                    : "#198754",
                transition: "all .25s ease",
              }}
            />
          </div>

          <div
            style={{
              fontSize: ".72rem",
              marginTop: ".3rem",
              color:
                pwd.newPwd.length < 6
                  ? "#dc3545"
                  : pwd.newPwd.length < 10
                  ? "#b77900"
                  : "#198754",
              fontWeight: 600,
            }}
          >
            {pwd.newPwd.length < 6
              ? "Weak — minimum 6 characters required"
              : pwd.newPwd.length < 10
              ? "Medium password"
              : "Strong password ✓"}
          </div>
        </div>
      )}
    </Field>


    {/* Confirm Password */}
    <Field label="Confirm Password">
      <div style={{ position: "relative" }}>
        <input
          type={showPwd.confirm ? "text" : "password"}
          className="form-control"
          placeholder="Repeat new password"
          value={pwd.confirm}
          onChange={(e) =>
            setPwd((f) => ({ ...f, confirm: e.target.value }))
          }
          style={{
            ...inputStyle,
            paddingRight: 42,
            border:
              pwd.confirm.length === 0
                ? "1.5px solid var(--gray-200)"
                : pwd.confirm === pwd.newPwd && pwd.newPwd.length >= 6
                ? "1.5px solid #198754"
                : "1.5px solid #dc3545",
            background:
              pwd.confirm.length === 0
                ? "#fff"
                : pwd.confirm === pwd.newPwd && pwd.newPwd.length >= 6
                ? "#f3fff8"
                : "#fff5f5",
          }}
        />

        <button
          type="button"
          onClick={() =>
            setShowPwd((s) => ({ ...s, confirm: !s.confirm }))
          }
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: ".9rem",
            color: "var(--gray-400)",
            padding: 0,
          }}
        >
          {showPwd.confirm ? "🙈" : "👁"}
        </button>
      </div>

      {pwd.confirm && pwd.confirm !== pwd.newPwd && (
        <div
          style={{
            color: "#dc3545",
            fontSize: ".72rem",
            marginTop: ".35rem",
            fontWeight: 500,
          }}
        >
          Passwords do not match
        </div>
      )}

      {pwd.confirm &&
        pwd.confirm === pwd.newPwd &&
        pwd.newPwd.length >= 6 && (
          <div
            style={{
              color: "#198754",
              fontSize: ".72rem",
              marginTop: ".35rem",
              fontWeight: 600,
            }}
          >
            Passwords match ✓
          </div>
        )}
    </Field>


    <button
      type="submit"
      disabled={savingPwd}
      className="btn btn-navy"
      style={{
        borderRadius: 8,
        fontSize: ".85rem",
        marginTop: ".25rem",
      }}
    >
      {savingPwd ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" />
          Changing…
        </>
      ) : (
        "🔒 Change Password"
      )}
    </button>

  </form>
</SectionCard>


         
          {/* ── Site Settings ── */}
          <SectionCard title="Site Settings" icon="⚙️">
            <form onSubmit={handleSiteSave}>
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <Field label="Site Name">
                    <input type="text" className="form-control" value={site.siteName}
                      onChange={(e) => setSite((s) => ({ ...s, siteName: e.target.value }))}
                      style={inputStyle} />
                  </Field>
                </div>
                <div className="col-12 col-sm-6">
                  <Field label="Contact Email">
                    <input type="email" className="form-control" value={site.contactEmail}
                      onChange={(e) => setSite((s) => ({ ...s, contactEmail: e.target.value }))}
                      style={inputStyle} />
                  </Field>
                </div>
              </div>

              {/* Toggle switches */}
              <div style={{ display: "flex", flexDirection: "column", gap: ".85rem", marginTop: ".5rem", marginBottom: "1.25rem" }}>
                {[
                  { key: "maintenanceMode",    label: "Maintenance Mode",    sub: "Temporarily disable the site for non-admins" },
                  { key: "allowRegistration",  label: "Allow Registration",  sub: "Let new users sign up" },
                ].map(({ key, label, sub }) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", cursor: "pointer" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: ".9rem", color: "var(--navy-800)" }}>{label}</div>
                      <div style={{ fontSize: ".78rem", color: "var(--gray-500)" }}>{sub}</div>
                    </div>
                    <div
                      onClick={() => setSite((s) => ({ ...s, [key]: !s[key] }))}
                      style={{
                        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                        background: site[key] ? "var(--gold-500)" : "var(--gray-300)",
                        position: "relative", cursor: "pointer", transition: "background .2s",
                      }}
                    >
                      <div style={{
                        position: "absolute", top: 3,
                        left: site[key] ? 22 : 3,
                        width: 18, height: 18, borderRadius: "50%", background: "#fff",
                        boxShadow: "0 1px 4px rgba(0,0,0,.2)", transition: "left .2s",
                      }} />
                    </div>
                  </label>
                ))}
              </div>

              
     <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>

                
  <button
    type="submit"
    disabled={savingSite}
    className="btn btn-gold"
    style={{ borderRadius: 8, fontSize: ".85rem" }}
  >
    {savingSite ? (
      <>
        <span className="spinner-border spinner-border-sm me-2" />
        Saving…
      </>
    ) : (
      "💾 Save Settings"
    )}
  </button>





               
              </div>
            </form>
          </SectionCard>

        </div>
      </div>
    </AdminLayout>
  );
}
