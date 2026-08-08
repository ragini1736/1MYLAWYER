/**
 * Documents.jsx  —  /admin/documents
 * ─────────────────────────────────────
 * GET  /api/admin/documents   ?isDeleted&category&userId
 * DELETE /api/admin/documents/:id  (registered in adminRoutes.js)
 * GET  /api/documents/:id/download  (uses the user-facing download endpoint
 *   which has admin bypass via ownership check in documentController)
 *
 * Field names from Document model:
 *   filePath   → URL path  (/uploads/documents/filename.pdf)
 *   fileType   → MIME type
 *   fileSize   → bytes
 *   originalName, fileName, category, userId, isDeleted, createdAt
 */
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../components/Admin/AdminLayout";
import ConfirmModal from "../../components/Admin/ConfirmModal";
import { getAllDocuments, adminDeleteDocument } from "../../services/adminService";

const BASE     = import.meta.env.VITE_API_URL || "https://onemylawyer.onrender.com/";
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtBytes = (b) => {
  if (!b) return "—";
  if (b < 1024)       return `${b} B`;
  if (b < 1048576)    return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

const CATEGORIES = ["Court Document","Legal Notice","Agreement","Affidavit","Evidence","Identity Proof","Property Document","Other"];

function FileIcon({ mime = "" }) {
  if (mime.includes("pdf"))                       return <span title="PDF">📄</span>;
  if (mime.includes("image"))                     return <span title="Image">🖼️</span>;
  if (mime.includes("word") || mime.includes("doc")) return <span title="Word">📝</span>;
  return <span>📎</span>;
}

/* Build a full URL from the stored filePath (/uploads/…) */
const fileUrl = (doc) => doc.filePath ? `${BASE}${doc.filePath}` : null;

/* Download via the dedicated download endpoint (sets Content-Disposition: attachment) */
const handleDownload = (doc) => {
  const url = `${BASE}/api/documents/${doc._id}/download`;
  const a   = document.createElement("a");
  a.href    = url;
  fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
    .then((r) => {
      if (!r.ok) throw new Error("Download failed");
      return r.blob();
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      a.href        = blobUrl;
      a.download    = doc.originalName || doc.fileName || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    })
    .catch(() => toast.error("Download failed — file may have been removed"));
};

export default function Documents() {
  const [docs,        setDocs       ] = useState([]);
  const [loading,     setLoading    ] = useState(true);
  const [error,       setError      ] = useState(null);
  const [search,      setSearch     ] = useState("");
  const [category,    setCategory   ] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page,        setPage       ] = useState(1);
  const [totalPages,  setTotalPages ] = useState(1);
  const [total,       setTotal      ] = useState(0);
  const [confirmDel,  setConfirmDel ] = useState(null);
  const [deleting,    setDeleting   ] = useState(false);
  const PAGE = 12;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getAllDocuments({
        isDeleted: showDeleted ? true : undefined,
        category:  category   || undefined,
        page,
        limit: PAGE,
      });
      const d = res.data;
      setDocs(d.documents ?? []);
      /* getAllDocuments in documentController does not paginate yet —
         it returns all matching docs. totalPages calculated client-side. */
      const all = d.documents?.length ?? 0;
      setTotal(d.count ?? all);
      setTotalPages(d.totalPages ?? Math.max(1, Math.ceil((d.count ?? all) / PAGE)));
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to load documents";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  }, [category, showDeleted, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [category, showDeleted]);

  /* client-side search — controller doesn't support ?search= */
  const visible = search.trim()
    ? docs.filter((d) =>
        [d.originalName, d.fileName, d.category, d.userId?.name]
          .some((f) => String(f ?? "").toLowerCase().includes(search.toLowerCase()))
      )
    : docs;

  const handleDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await adminDeleteDocument(confirmDel);
      toast.success("Document deleted");
      setConfirmDel(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    } finally { setDeleting(false); }
  };

  return (
    <AdminLayout title="Documents">
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="lm-gold-bar" style={{ marginBottom: ".5rem" }} />
        <h4 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, color: "var(--navy-800)", margin: 0 }}>Document Management</h4>
        <p style={{ color: "var(--gray-500)", fontSize: ".88rem", margin: 0 }}>{total} documents</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)", pointerEvents: "none" }}>🔍</span>
          <input type="text" className="form-control" placeholder="Search name, category, uploader…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32, borderRadius: 8, height: 40, fontSize: ".88rem" }} />
        </div>
        <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}
          style={{ borderRadius: 8, height: 40, fontSize: ".88rem", maxWidth: 200 }}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: ".45rem", fontSize: ".88rem", color: "var(--gray-700)", cursor: "pointer", userSelect: "none" }}>
          <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)}
            style={{ width: 16, height: 16, cursor: "pointer" }} />
          Show deleted
        </label>
        <button onClick={load} className="btn btn-outline-secondary" style={{ borderRadius: 8, height: 40, fontSize: ".88rem" }}>🔄 Refresh</button>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)", boxShadow: "0 2px 12px rgba(6,14,30,.06)", overflow: "hidden" }}>
        {loading ? (
          <div className="p-5 text-center">
            <div className="lm-spinner" />
            <p style={{ color: "var(--gray-500)", fontSize: ".88rem", marginTop: 12 }}>Loading documents…</p>
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
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr style={{ background: "var(--navy-800)" }}>
                    {["File","Category","Uploaded By","Size","Date","Actions"].map((h) => (
                      <th key={h} style={{ padding: ".75rem 1rem", fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "rgba(255,255,255,.9)", border: "none", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--gray-400)" }}>
                      {search ? "No documents match your search" : "No documents found"}
                    </td></tr>
                  ) : visible.map((d, idx) => {
                    const url = fileUrl(d);
                    return (
                      <tr key={d._id} style={{ borderBottom: "1px solid var(--gray-100)", background: d.isDeleted ? "rgba(239,68,68,.04)" : idx % 2 === 0 ? "#fff" : "var(--gray-50)" }}>
                        <td style={{ padding: ".75rem 1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                            <span style={{ fontSize: "1.2rem" }}><FileIcon mime={d.fileType} /></span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: ".85rem", color: "var(--navy-800)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {d.originalName || d.fileName || "—"}
                              </div>
                              {d.isDeleted && <span style={{ fontSize: ".68rem", color: "#dc2626", fontWeight: 700 }}>DELETED</span>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: ".75rem 1rem", fontSize: ".85rem", color: "var(--gray-700)" }}>{d.category || "—"}</td>
                        <td style={{ padding: ".75rem 1rem" }}>
                          <div style={{ fontSize: ".85rem", color: "var(--navy-800)", fontWeight: 500 }}>{d.userId?.name || "—"}</div>
                          <div style={{ fontSize: ".73rem", color: "var(--gray-500)" }}>{d.userId?.email || ""}</div>
                        </td>
                        {/* fileSize — correct model field name */}
                        <td style={{ padding: ".75rem 1rem", fontSize: ".82rem", color: "var(--gray-600)" }}>{fmtBytes(d.fileSize)}</td>
                        <td style={{ padding: ".75rem 1rem", fontSize: ".82rem", color: "var(--gray-500)", whiteSpace: "nowrap" }}>{fmtDate(d.createdAt)}</td>
                        <td style={{ padding: ".75rem 1rem" }}>
                          <div style={{ display: "flex", gap: ".35rem", flexWrap: "nowrap" }}>
                            {/* View — opens filePath URL in new tab */}
                            {url && (
                              <a href={url} target="_blank" rel="noreferrer"
                                style={{ background: "rgba(59,130,246,.1)", border: "none", borderRadius: 6, padding: "4px 9px", fontSize: ".75rem", color: "#1e40af", fontWeight: 600, textDecoration: "none" }}>
                                👁 View
                              </a>
                            )}
                            {/* Download — uses /api/documents/:id/download endpoint */}
                            {!d.isDeleted && url && (
                              <button onClick={() => handleDownload(d)}
                                style={{ background: "rgba(16,185,129,.1)", border: "none", borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontSize: ".75rem", color: "#065f46", fontWeight: 600 }}>
                                ⬇ Download
                              </button>
                            )}
                            {/* Delete */}
                            {!d.isDeleted && (
                              <button onClick={() => setConfirmDel(d._id)}
                                style={{ background: "rgba(239,68,68,.1)", border: "none", borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontSize: ".75rem", color: "#dc2626", fontWeight: 600 }}>
                                🗑 Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ padding: ".75rem 1rem", borderTop: "1px solid var(--gray-100)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ".5rem" }}>
                <span style={{ fontSize: ".8rem", color: "var(--gray-500)" }}>Page {page} of {totalPages}</span>
                <div style={{ display: "flex", gap: ".35rem" }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 6, fontSize: ".8rem" }}>← Prev</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return <button key={n} onClick={() => setPage(n)} className={`btn btn-sm ${n === page ? "btn-navy" : "btn-outline-secondary"}`} style={{ borderRadius: 6, fontSize: ".8rem", minWidth: 32 }}>{n}</button>;
                  })}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 6, fontSize: ".8rem" }}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        show={!!confirmDel} onHide={() => setConfirmDel(null)} onConfirm={handleDelete}
        title="Delete Document" confirmText="Delete" danger loading={deleting}
        message="This will permanently delete the document and remove the file from the server. This action cannot be undone."
      />
    </AdminLayout>
  );
}

