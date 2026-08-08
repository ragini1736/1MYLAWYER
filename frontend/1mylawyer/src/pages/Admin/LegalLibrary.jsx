/**
 * LegalLibrary.jsx  —  /admin/legal-library
 * ──────────────────────────────────────────
 * Connected to live backend APIs:
 *   GET    /api/admin/legal-library
 *   POST   /api/admin/legal-library   (multipart/form-data)
 *   PUT    /api/admin/legal-library/:id
 *   DELETE /api/admin/legal-library/:id
 */
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../components/Admin/AdminLayout";
import ConfirmModal from "../../components/Admin/ConfirmModal";
import {
  getLegalLibrary,
  uploadLegalDoc,
  updateLegalDoc,
  deleteLegalDoc,
} from "../../services/adminService";

/* ── constants ──────────────────────────────────────────── */
const CATEGORIES = ["All", "Government", "Court", "Notice", "Property", "Employment", "Family", "Corporate", "Other"];
const BASE        = import.meta.env.VITE_API_URL || "https://onemylawyer.onrender.com/";

const fmtSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/* ── blank form ─────────────────────────────────────────── */
const BLANK_FORM = { title: "", category: "", description: "", file: null };

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function LegalLibrary() {
  /* list state */
  const [docs,    setDocs   ] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState(null);

  /* filter state */
  const [search,   setSearch  ] = useState("");
  const [category, setCategory] = useState("All");

  /* upload / edit form */
  const [showForm,  setShowForm ] = useState(false);
  const [form,      setForm     ] = useState(BLANK_FORM);
  const [editId,    setEditId   ] = useState(null);   // null = create, id = edit
  const [saving,    setSaving   ] = useState(false);

  /* delete confirm */
  const [confirmId, setConfirmId] = useState(null);
  const [deleting,  setDeleting ] = useState(false);

  /* ── fetch ── */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLegalLibrary({
        search:   search.trim() || undefined,
        category: category !== "All" ? category : undefined,
      });
      setDocs(res.data.documents ?? []);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load documents";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { load(); }, [load]);

  /* ── open edit form ── */
  const handleEdit = (doc) => {
    setEditId(doc._id);
    setForm({ title: doc.title, category: doc.category, description: doc.description || "", file: null });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── reset form ── */
  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(BLANK_FORM);
  };

  /* ── save (create or update) ── */
  const handleSave = async () => {
    if (!form.title.trim()) { toast.warning("Title is required");    return; }
    if (!form.category)     { toast.warning("Category is required"); return; }
    if (!editId && !form.file) { toast.warning("Please select a file"); return; }

    setSaving(true);
    try {
      if (editId) {
        /* ── UPDATE: JSON body, no file ── */
        await updateLegalDoc(editId, {
          title:       form.title.trim(),
          category:    form.category,
          description: form.description.trim(),
        });
        toast.success("Document updated successfully");
      } else {
        /* ── CREATE: multipart/form-data ── */
        const fd = new FormData();
        fd.append("file",        form.file);
        fd.append("title",       form.title.trim());
        fd.append("category",    form.category);
        fd.append("description", form.description.trim());
        await uploadLegalDoc(fd);
        toast.success("Document uploaded successfully");
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ── */
  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await deleteLegalDoc(confirmId);
      toast.success("Document deleted");
      setConfirmId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  /* ── download ── */
  const handleDownload = (doc) => {
    const url = `${BASE}/api/admin/legal-library/${doc._id}/download`;
    const a   = document.createElement("a");
    a.href    = url;
    a.setAttribute("download", doc.originalName || doc.title);
    /* attach auth header via fetch — then trigger object-URL download */
    fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        /* optimistically increment counter in UI */
        setDocs((prev) => prev.map((d) => d._id === doc._id ? { ...d, downloads: (d.downloads || 0) + 1 } : d));
      })
      .catch(() => toast.error("Download failed"));
  };

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <AdminLayout title="Legal Library">

      {/* ── Page header ──────────────────────────────── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="lm-gold-bar" style={{ marginBottom: ".5rem" }} />
        <h4 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, color: "var(--navy-800)", margin: 0 }}>
          Legal Library
        </h4>
        <p style={{ color: "var(--gray-500)", fontSize: ".88rem", margin: 0 }}>
          Manage downloadable legal document templates · {docs.length} document{docs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Upload / Edit form ───────────────────────── */}
      {showForm && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)", boxShadow: "0 2px 12px rgba(6,14,30,.06)", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h6 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--navy-800)", marginBottom: "1.25rem" }}>
            {editId ? "✏️ Edit Document" : "⬆ Upload New Document"}
          </h6>

          <div className="row g-3">
            <div className="col-12 col-md-5">
              <label style={{ fontWeight: 600, fontSize: ".78rem", color: "var(--navy-800)", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: ".4rem" }}>
                Title *
              </label>
              <input
                type="text" className="form-control"
                placeholder="Document title…"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                style={{ borderRadius: 8, fontSize: ".9rem" }}
              />
            </div>

            <div className="col-12 col-md-3">
              <label style={{ fontWeight: 600, fontSize: ".78rem", color: "var(--navy-800)", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: ".4rem" }}>
                Category *
              </label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                style={{ borderRadius: 8, fontSize: ".9rem" }}
              >
                <option value="">Select…</option>
                {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* File picker — only for new uploads */}
            {!editId && (
              <div className="col-12 col-md-4">
                <label style={{ fontWeight: 600, fontSize: ".78rem", color: "var(--navy-800)", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: ".4rem" }}>
                  File (PDF / Word) *
                </label>
                <input
                  type="file" accept=".pdf,.doc,.docx" className="form-control"
                  onChange={(e) => setForm((f) => ({ ...f, file: e.target.files[0] || null }))}
                  style={{ borderRadius: 8, fontSize: ".88rem" }}
                />
                {form.file && (
                  <div style={{ fontSize: ".75rem", color: "var(--gray-500)", marginTop: 4 }}>
                    {form.file.name} · {fmtSize(form.file.size)}
                  </div>
                )}
              </div>
            )}

            <div className="col-12">
              <label style={{ fontWeight: 600, fontSize: ".78rem", color: "var(--navy-800)", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: ".4rem" }}>
                Description (optional)
              </label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Brief description of this document…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={{ borderRadius: 8, fontSize: ".88rem", resize: "vertical" }}
              />
            </div>
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: ".75rem" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-gold"
              style={{ borderRadius: 8, fontSize: ".85rem" }}
            >
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2" />{editId ? "Saving…" : "Uploading…"}</>
                : editId ? "💾 Save Changes" : "💾 Upload Document"}
            </button>
            <button
              onClick={resetForm}
              disabled={saving}
              className="btn btn-outline-secondary"
              style={{ borderRadius: 8, fontSize: ".85rem" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Toolbar: search + category chips + upload btn ── */}
      <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", flex: 1, alignItems: "center" }}>

          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)", pointerEvents: "none" }}>🔍</span>
            <input
              type="text" className="form-control"
              placeholder="Search documents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32, borderRadius: 8, height: 40, fontSize: ".88rem" }}
            />
          </div>

          {/* Category chips */}
          <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  background: category === c ? "var(--navy-800)" : "var(--gray-100)",
                  color:      category === c ? "#fff" : "var(--gray-700)",
                  border: "none", borderRadius: 20, padding: "4px 14px",
                  fontSize: ".8rem", fontWeight: 600, cursor: "pointer",
                  transition: "background .15s",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Upload button */}
        <button
          onClick={() => { setEditId(null); setForm(BLANK_FORM); setShowForm((v) => !v); }}
          className="btn btn-gold"
          style={{ borderRadius: 8, fontSize: ".85rem", whiteSpace: "nowrap" }}
        >
          ⬆ Upload Document
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="text-center py-5">
          <div className="lm-spinner" />
          <p style={{ color: "var(--gray-500)", fontSize: ".88rem", marginTop: 12 }}>Loading documents…</p>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center" style={{ borderRadius: 10 }}>
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-danger" onClick={load} style={{ borderRadius: 6 }}>Retry</button>
        </div>
      )}

      {/* ── Document grid ── */}
      {!loading && !error && (
        <div className="row g-3">
          {docs.length === 0 ? (
            <div className="col-12">
              <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
                <h5 style={{ fontFamily: "var(--font-serif)", color: "var(--navy-800)", fontWeight: 700, marginBottom: ".5rem" }}>
                  {search || category !== "All" ? "No documents match your filters" : "No documents yet"}
                </h5>
                <p style={{ color: "var(--gray-500)", fontSize: ".9rem", marginBottom: "1.5rem" }}>
                  {search || category !== "All"
                    ? "Try a different search term or category."
                    : "Upload your first legal document template using the button above."}
                </p>
                {(search || category !== "All") && (
                  <button
                    className="btn btn-outline-secondary"
                    style={{ borderRadius: 8, fontSize: ".85rem" }}
                    onClick={() => { setSearch(""); setCategory("All"); }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            docs.map((doc) => (
              <div key={doc._id} className="col-12 col-sm-6 col-xl-4">
                <div
                  style={{
                    background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)",
                    boxShadow: "0 2px 12px rgba(6,14,30,.06)", padding: "1.25rem",
                    display: "flex", flexDirection: "column", gap: ".75rem",
                    transition: "transform .2s, box-shadow .2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(6,14,30,.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(6,14,30,.06)"; }}
                >
                  {/* Icon + category badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--gold-100)", border: "1px solid rgba(201,168,76,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
                      {doc.fileType?.includes("pdf") ? "📄" : "📝"}
                    </div>
                    <span style={{ background: "rgba(59,130,246,.1)", color: "#1e40af", borderRadius: 20, padding: "2px 10px", fontSize: ".7rem", fontWeight: 700 }}>
                      {doc.category}
                    </span>
                  </div>

                  {/* Title */}
                  <div style={{ fontWeight: 700, fontSize: ".92rem", color: "var(--navy-800)", lineHeight: 1.35 }}>
                    {doc.title}
                  </div>

                  {/* Description */}
                  {doc.description && (
                    <div style={{ fontSize: ".78rem", color: "var(--gray-500)", lineHeight: 1.5, marginTop: "-.25rem" }}>
                      {doc.description}
                    </div>
                  )}

                  {/* Meta: size, downloads, date */}
                  <div style={{ display: "flex", gap: ".75rem", fontSize: ".76rem", color: "var(--gray-500)", flexWrap: "wrap" }}>
                    <span>📦 {fmtSize(doc.fileSize)}</span>
                    <span>⬇ {doc.downloads ?? 0} downloads</span>
                    <span>📅 {fmtDate(doc.createdAt)}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: ".5rem", marginTop: ".25rem" }}>
                    <button
                      onClick={() => handleDownload(doc)}
                      style={{ flex: 1, background: "rgba(16,185,129,.1)", border: "none", borderRadius: 7, padding: "6px 0", fontSize: ".78rem", color: "#065f46", fontWeight: 600, cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(16,185,129,.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(16,185,129,.1)"}
                    >
                      ⬇ Download
                    </button>
                    <button
                      onClick={() => handleEdit(doc)}
                      style={{ flex: 1, background: "rgba(59,130,246,.1)", border: "none", borderRadius: 7, padding: "6px 0", fontSize: ".78rem", color: "#1e40af", fontWeight: 600, cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59,130,246,.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(59,130,246,.1)"}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setConfirmId(doc._id)}
                      style={{ background: "rgba(239,68,68,.1)", border: "none", borderRadius: 7, padding: "6px 10px", fontSize: ".78rem", color: "#dc2626", fontWeight: 600, cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,.18)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,.1)"}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      <ConfirmModal
        show={!!confirmId}
        onHide={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message="This will permanently delete the document and remove the file from the server. This action cannot be undone."
        confirmText="Delete"
        danger
        loading={deleting}
      />

    </AdminLayout>
  );
}
