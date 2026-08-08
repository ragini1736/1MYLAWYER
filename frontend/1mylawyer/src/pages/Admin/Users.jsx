/**
 * Users.jsx
 * ──────────
 * Route: /admin/users
 * Real endpoints used:
 *   GET    /api/admin/users            ?search&role&page&limit&sort
 *   GET    /api/admin/users/:userId
 *   PUT    /api/admin/users/:userId/role
 *   DELETE /api/admin/users/:userId
 */
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../components/Admin/AdminLayout";
import ConfirmModal from "../../components/Admin/ConfirmModal";
import { getAllUsers, getUserDetails, updateUserRole, deleteUser } from "../../services/adminService";

/* ── helpers ── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function RoleBadge({ role }) {
  const isAdmin = role === "admin";
  return (
    <span style={{
      background: isAdmin ? "rgba(201,168,76,.15)" : "rgba(59,130,246,.1)",
      color: isAdmin ? "var(--gold-600)" : "#1e40af",
      border: `1px solid ${isAdmin ? "rgba(201,168,76,.3)" : "rgba(59,130,246,.2)"}`,
      borderRadius: 20, padding: "2px 10px",
      fontSize: ".7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em",
    }}>
      {isAdmin ? "🛡 Admin" : "👤 User"}
    </span>
  );
}

/* ── User detail side panel ── */
function UserDetailPanel({ user, onClose, onRoleChange }) {
  const [changing, setChanging] = useState(false);

  const isMobile=window.innerWidth<=768;
  if (!user) return null;
  const newRole = user.role === "admin" ? "user" : "admin";

  const handleRoleChange = async () => {
    setChanging(true);
    try {
      await onRoleChange(user._id, newRole);
      toast.success(`Role changed to ${newRole}`);
      onClose();
    } catch {
      toast.error("Failed to change role");
    } finally {
      setChanging(false);
    }
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(6,14,30,.4)", zIndex: 200 }} onClick={onClose} />
      
      <div
  style={{
    position: "fixed",
    top: 0,
    right: 0,
    width: "100%",
    maxWidth: "520px",      // Laptop par achha size
    height: "100vh",
    background: "#fff",
    zIndex: 201,
    overflowY: "auto",
    boxShadow: "-8px 0 32px rgba(6,14,30,.15)",
    animation: "lm-fadeIn .25s ease both",
    paddingBottom: "20px"
  }}
>


        {/* Header */}
        <div style={{ background: "var(--navy-800)", padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h6 style={{ color: "#fff", fontFamily: "var(--font-serif)", margin: 0 }}>User Profile</h6>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.1)", border: "none", color: "#fff", borderRadius: 6, width: 28, height: 28, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ padding: "1.5rem" }}>
          {/* Avatar + name */}
          <div style={{ textAlign: "center", marginBottom: "2.3rem" }}>
            <div style={{
              width: 95, height: 95, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--navy-700), var(--navy-500))",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto .75rem", color: "#fff",
              fontFamily: "var(--font-serif)", fontSize: "1.8rem", fontWeight: 800,
            }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <h5 style={{ fontFamily: "var(--font-serif)", color: "var(--navy-800)", margin: "0 0 .35rem",fontSize:"1.8rem",fontWeight:"700" }}>{user.name}</h5>
            <div style={{ fontSize: ".82rem", color: "var(--gray-500)" }}>{user.email}</div>
            <div style={{ marginTop: ".5rem" }}><RoleBadge role={user.role} /></div>
          </div>

          {/* Details */}
          {[
            ["Phone",    user.phone    || "—"],
            ["Joined",   fmtDate(user.createdAt)],
            ["Cases",    user.caseCount    ?? "—"],
            ["Appointments", user.appointmentCount ?? "—"],
            ["Total Spend", user.totalSpend ? `₹${Number(user.totalSpend).toLocaleString("en-IN")}` : "—"],
          ].map(([label, val]) => (

            <div
  key={label}
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    padding: "14px 16px",
    borderRadius: "10px",
    background: "#f8fafc",
    border: "1px solid #ececec"
  }}
>
            
           
              <span style={{ color: "var(--gray-500)", fontWeight: 500 }}>{label}</span>
              <span style={{ color: "var(--navy-800)", fontWeight: 600 }}>{val}</span>
            </div>
          ))}

          {/* Actions */}
          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: ".75rem" }}>
            <button
              onClick={handleRoleChange}
              disabled={changing}
              className="btn btn-gold w-100"
              style={{ borderRadius: 10, height:"48px",fontWeight:700,fontSize: ".85rem" }}
            >
              {changing ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              {changing ? "Updating…" : `Promote to ${newRole === "admin" ? "Admin" : "User"}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════ MAIN PAGE ══════════════════════ */
export default function Users() {
  const [users,       setUsers      ] = useState([]);
  const [loading,     setLoading    ] = useState(true);
  const [error,       setError      ] = useState(null);
  const [search,      setSearch     ] = useState("");
  const [roleFilter,  setRoleFilter ] = useState("all");
  const [page,        setPage       ] = useState(1);
  const [totalPages,  setTotalPages ] = useState(1);
  const [totalCount,  setTotalCount ] = useState(0);

  const [detailUser,  setDetailUser ] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [confirmDel,  setConfirmDel ] = useState(null); // userId to delete
  const [deleting,    setDeleting   ] = useState(false);

  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getAllUsers({
        search: search || undefined,
        role:   roleFilter !== "all" ? roleFilter : undefined,
        page,
        limit: PAGE_SIZE,
        sort: "latest",
      });
      const d = res.data;
      setUsers(d.users ?? []);
      setTotalPages(d.totalPages ?? 1);
      setTotalCount(d.totalCount ?? d.total ?? 0);
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to load users";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => { load(); }, [load]);
  /* reset page on filter change */
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const handleViewDetail = async (userId) => {
    setLoadingDetail(true);
    try {
      const res = await getUserDetails(userId);
      setDetailUser(res.data.user ?? res.data);
    } catch {
      toast.error("Could not load user details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    await updateUserRole(userId, newRole);
    load();
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await deleteUser(confirmDel);
      toast.success("User deleted");
      setConfirmDel(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title="Users">

      {/* Page header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="lm-gold-bar" style={{ marginBottom: ".5rem" }} />
        <h4 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, color: "var(--navy-800)", margin: "0 0 .35",fontSize:"1.8rem",fontWeight:"700" }}>
          User Management
        </h4>
        <p style={{ color: "var(--gray-500)", fontSize: ".88rem", margin:" 0 0 " }}>
          {totalCount} total users
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 380 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)", pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32, borderRadius: 8, height: 40, fontSize: ".88rem" }}
          />
        </div>
        <select
          className="form-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ borderRadius: 8, height: 40, fontSize: ".88rem", maxWidth: 160 }}
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
        <button onClick={load} className="btn btn-outline-secondary" style={{ borderRadius: 8, height: 40, fontSize: ".88rem" }}>
          🔄 Refresh
        </button>
      </div>

      {/* Table card */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)", boxShadow: "0 2px 12px rgba(6,14,30,.06)", overflow: "hidden" }}>

        {loading ? (
          <div className="p-5 text-center">
            <div className="lm-spinner" />
            <p style={{ color: "var(--gray-500)", fontSize: ".88rem", marginTop: 12 }}>Loading users…</p>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="alert alert-danger d-flex justify-content-between align-items-center" style={{ borderRadius: 10, margin: 0 }}>
              <span>⚠️ {error}</span>
              <button className="btn btn-sm btn-danger" onClick={load} style={{ borderRadius: 6 }}>Retry</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ background: "var(--navy-800)" }}>
                    {["User", "Email", "Role", "Joined", "Actions"].map((h) => (
                      <th key={h} style={{
                        padding: ".75rem 1rem", fontSize: ".72rem", fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: ".07em",
                        color: "rgba(255,255,255,.9)", border: "none", whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--gray-400)", fontSize: ".9rem" }}>
                        No users found
                      </td>
                    </tr>
                  ) : users.map((u, idx) => (
                    <tr key={u._id} style={{ borderBottom: "1px solid var(--gray-100)", background: idx % 2 === 0 ? "#fff" : "var(--gray-50)" }}>
                      <td style={{ padding: ".75rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--navy-700), var(--navy-500))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontWeight: 700, fontSize: ".78rem", flexShrink: 0,
                          }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: ".88rem", color: "var(--navy-800)" }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".85rem", color: "var(--gray-600)" }}>{u.email}</td>
                      <td style={{ padding: ".75rem 1rem" }}><RoleBadge role={u.role} /></td>
                      <td style={{ padding: ".75rem 1rem", fontSize: ".82rem", color: "var(--gray-500)", whiteSpace: "nowrap" }}>{fmtDate(u.createdAt)}</td>
                      <td style={{ padding: ".75rem 1rem" }}>
                        <div style={{ display: "flex", gap: ".4rem", flexWrap: "nowrap" }}>
                          <button
                            onClick={() => handleViewDetail(u._id)}
                            disabled={loadingDetail}
                            title="View"
                            style={{ background: "rgba(59,130,246,.1)", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: ".78rem", color: "#1e40af", fontWeight: 600, transition: "background .15s" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59,130,246,.2)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(59,130,246,.1)"}
                          >
                            👁 View
                          </button>
                          <button
                            onClick={() => handleRoleChange(u._id, u.role === "admin" ? "user" : "admin")}
                            title={u.role === "admin" ? "Demote" : "Promote"}
                            style={{ background: "rgba(201,168,76,.12)", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: ".78rem", color: "var(--gold-600)", fontWeight: 600, transition: "background .15s" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(201,168,76,.22)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(201,168,76,.12)"}
                          >
                            {u.role === "admin" ? "⬇ Demote" : "⬆ Promote"}
                          </button>
                          <button
                            onClick={() => setConfirmDel(u._id)}
                            title="Delete"
                            style={{ background: "rgba(239,68,68,.1)", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: ".78rem", color: "#dc2626", fontWeight: 600, transition: "background .15s" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,.18)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,.1)"}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: ".75rem 1rem", borderTop: "1px solid var(--gray-100)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ".5rem" }}>
                <span style={{ fontSize: ".8rem", color: "var(--gray-500)" }}>
                  Page {page} of {totalPages}
                </span>
                <div style={{ display: "flex", gap: ".35rem" }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 6, fontSize: ".8rem" }}>← Prev</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button key={n} onClick={() => setPage(n)}
                        className={`btn btn-sm ${n === page ? "btn-navy" : "btn-outline-secondary"}`}
                        style={{ borderRadius: 6, fontSize: ".8rem", minWidth: 32 }}>{n}</button>
                    );
                  })}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 6, fontSize: ".8rem" }}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirm modal */}
      <ConfirmModal
        show={!!confirmDel}
        onHide={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="This will permanently delete the user account and all associated data. This action cannot be undone."
        confirmText="Delete"
        danger
        loading={deleting}
      />

      {/* User detail panel */}
      <UserDetailPanel
        user={detailUser}
        onClose={() => setDetailUser(null)}
        onRoleChange={handleRoleChange}
      />
    </AdminLayout>
  );
}


