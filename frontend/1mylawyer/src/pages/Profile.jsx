import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";


const TABS = [
  { key: "profile",  icon: "👤", label: "Edit Profile"     },
  { key: "password", icon: "🔒", label: "Change Password"  },
  { key: "billing",  icon: "💳", label: "Payments & Billing" },
];

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", role: "" });
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/user/profile");
      setProfile(res.data.user);
      setProfileForm({ name: res.data.user.name, phone: res.data.user.phone });
    } catch { toast.error("Failed to load profile"); }
    finally { setLoading(false); }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.put("/api/user/profile", profileForm);
      setProfile(res.data.user);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, name: res.data.user.name }));
      window.dispatchEvent(new Event("authChange"));
      toast.success("Profile updated successfully");
    } catch (err) { toast.error(err.response?.data?.message || "Update failed"); }
    finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (pwForm.newPassword.length < 6) { toast.error("Min 6 characters required"); return; }
    setPwLoading(true);
    try {
      await api.put("/api/user/profile/change-password", {
        currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword,
      });
      toast.success("Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) { toast.error(err.response?.data?.message || "Password change failed"); }
    finally { setPwLoading(false); }
  };

  const handleTabClick = (tabKey) => {
    if (tabKey === "billing") {
      navigate("/payment");
    } else {
      setActiveTab(tabKey);
    }
  };

  if (loading) return (
    <>
    
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border" style={{ color: "var(--gold-500)", width: "3rem", height: "3rem" }} />
      </div>
  
    </>
  );

  return (
    <>
    

      {/* Header */}
      <div className="lm-page-header">
        <div className="container lm-page-header-content">
          <div className="d-flex align-items-center gap-3 gap-md-4 flex-wrap">
            {/* Gold ring avatar */}
            <div style={{
              width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, var(--gold-600), var(--gold-400))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 800,
              color: "var(--navy-900)",
              boxShadow: "0 0 0 3px rgba(201,168,76,.3), 0 0 0 6px rgba(201,168,76,.1)",
            }}>
              {profile.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="lm-gold-bar mb-2" />
              <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, marginBottom: ".25rem", fontSize: "clamp(1.4rem, 4vw, 1.9rem)" }}>
                {profile.name}
              </h2>
              <p style={{ marginBottom: 0, opacity: .75, display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                  {profile.email}
                </span>
                <span style={{
                  background: "rgba(201,168,76,.2)", border: "1px solid rgba(201,168,76,.4)",
                  color: "var(--gold-300)", padding: ".15rem .6rem",
                  borderRadius: "30px", fontSize: ".75rem", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: ".06em", flexShrink: 0,
                }}>
                  {profile.role}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4 py-md-5">
        <div className="row g-4">

          {/* Sidebar */}
          <div className="col-12 col-md-3">
            <div className="lm-card p-3">
              <ul className="lm-sidebar-nav">
                {TABS.map((t) => (
                  <li className="nav-item" key={t.key}>
                    <button
                      className={`nav-link w-100 border-0 bg-transparent text-start ${activeTab === t.key ? "active" : ""}`}
                      onClick={() => handleTabClick(t.key)}
                    >
                      <span className="nav-icon">{t.icon}</span> {t.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content */}
          <div className="col-12 col-md-9">

            {activeTab === "profile" && (
              <div className="lm-card">
                <div className="lm-card-header">
                  <h5 className="lm-card-title">Edit Profile Information</h5>
                </div>
                <div className="p-3 p-md-4">
                  <form onSubmit={handleProfileUpdate} className="lm-form">
                    <div className="mb-4">
                      <label className="form-label">Full Name</label>
                      <input type="text" className="form-control"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        required />
                    </div>
                    <div className="mb-4">
                      <label className="form-label">Email Address</label>
                      <input type="email" className="form-control"
                        value={profile.email} disabled
                        style={{ background: "var(--gray-50)", cursor: "not-allowed" }} />
                      <small style={{ color: "var(--gray-500)", fontSize: ".8rem" }}>
                        Email address cannot be changed
                      </small>
                    </div>
                    <div className="mb-5">
                      <label className="form-label">Phone Number</label>
                      <input type="text" className="form-control"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        required />
                    </div>
                    <button type="submit" className="btn btn-gold px-5" disabled={profileLoading}>
                      {profileLoading
                        ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                        : "Save Changes"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "password" && (
              <div className="lm-card">
                <div className="lm-card-header">
                  <h5 className="lm-card-title">Change Password</h5>
                </div>
                <div className="p-3 p-md-4">
                  <div style={{
                    background: "var(--gold-100)", border: "1px solid rgba(201,168,76,.3)",
                    borderRadius: "var(--radius-md)", padding: "1rem 1.25rem", marginBottom: "1.5rem",
                  }}>
                    <p style={{ margin: 0, fontSize: ".88rem", color: "var(--navy-700)" }}>
                      🔒 For your security, please enter your current password before setting a new one.
                    </p>
                  </div>
                  <form onSubmit={handlePasswordChange} className="lm-form">
                    {[
                      { label: "Current Password",     field: "currentPassword", ph: "Enter current password" },
                      { label: "New Password",          field: "newPassword",     ph: "Minimum 6 characters" },
                      { label: "Confirm New Password",  field: "confirmPassword", ph: "Re-enter new password" },
                    ].map(({ label, field, ph }) => (
                      <div className="mb-4" key={field}>
                        <label className="form-label">{label}</label>
                        <input type="password" className="form-control" placeholder={ph}
                          value={pwForm[field]}
                          onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                          required />
                      </div>
                    ))}
                    <button type="submit" className="btn btn-navy px-5" disabled={pwLoading}>
                      {pwLoading
                        ? <><span className="spinner-border spinner-border-sm me-2" />Updating...</>
                        : "Update Password"}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

    
    </>
  );
}

export default Profile;
