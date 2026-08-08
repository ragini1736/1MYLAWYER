import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

import api from "../services/api";



const CATEGORIES = ["All", "Identity Document", "Court Document", "Legal Notice", "Agreement", "Evidence", "Case Related", "Other"];
const CAT_ICONS = { "Identity Document": "🪪", "Court Document": "🏛️", "Legal Notice": "📜", "Agreement": "🤝", "Evidence": "🔍", "Case Related": "⚖️", "Other": "📄" };

// Use the base URL from the shared API instance for consistency
const BASE_URL = api.defaults.baseURL;


function DocumentVault() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("All");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [uploadForm, setUploadForm] = useState({ category: "Identity Document", description: "" });

  useEffect(() => {
    fetchDocs();
  }, [catFilter]);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (catFilter !== "All") params.append("category", catFilter);
      const res = await api.get(`/api/documents/my?${params}`);
      setDocuments(res.data.documents || []);
    } catch {
      toast.error("Failed to load documents");
    }
    finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files[0];
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    const fd = new FormData();
    fd.append("document", file);
    fd.append("category", uploadForm.category);
    if (uploadForm.description) fd.append("description", uploadForm.description);
    setUploading(true);
    try {
      await api.post("/api/documents", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Document uploaded successfully");
      setUploadOpen(false);
      setUploadForm({ category: "Identity Document", description: "" });
      if (fileRef.current) fileRef.current.value = "";
      await fetchDocs(); // Re-fetch after upload
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    }
    finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/documents/${deleteId}`);
      toast.success("Document deleted");
      setDeleteId(null);
      await fetchDocs(); // Re-fetch after delete
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
    finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      // Use the dedicated download API endpoint
      const response = await api.get(`/api/documents/${doc._id}/download`, {
        responseType: 'blob', // Important: tells axios to expect a binary file
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalName); // Use the original filename
      document.body.appendChild(link);
      link.click();
      
      // Clean up by revoking the object URL and removing the link
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      toast.error("Download failed. The file may no longer exist.");
    }
  };
  
  const isImage = (t) => t?.startsWith("image/");

  return (
    <>
      

      {/* Page Header */}
      <div className="lm-page-header">
        <div className="container lm-page-header-content d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="lm-gold-bar" />
            <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 800, fontSize: "clamp(1.5rem,5vw,2.2rem)", marginBottom: ".3rem" }}>
              Document Vault
            </h1>
            <p style={{ opacity: .75, marginBottom: 0, fontSize: ".9rem" }}>
              Securely store and manage your legal documents
            </p>
          </div>
          <button className="btn btn-gold px-3 px-md-4" style={{ fontSize: ".88rem" }}
            onClick={() => setUploadOpen(true)}>
            + Upload
          </button>
        </div>
      </div>

      <div className="container py-4">

        {/* Category filter chips — wrap on mobile */}
        <div className="d-flex gap-2 flex-wrap mb-4">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              style={{
                background: catFilter === cat ? "var(--navy-800)" : "var(--white)",
                color: catFilter === cat ? "var(--gold-400)" : "var(--gray-600)",
                border: catFilter === cat ? "1.5px solid var(--navy-800)" : "1.5px solid var(--gray-200)",
                borderRadius: "30px", padding: ".3rem .85rem",
                fontSize: ".8rem", fontWeight: 600, cursor: "pointer", transition: "var(--transition)",
                whiteSpace: "nowrap",
              }}>
              {cat !== "All" && `${CAT_ICONS[cat]} `}{cat}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: "var(--gold-500)", width: "2.5rem", height: "2.5rem" }} />
            <p className="mt-3" style={{ color: "var(--gray-500)", fontFamily: "var(--font-serif)" }}>
              Loading documents...
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="lm-card lm-empty-state">
            <div className="icon">📁</div>
            <h5>{catFilter !== "All" ? `No ${catFilter} documents` : "No Documents Yet"}</h5>
            <p>Upload your first legal document to get started</p>
            <button className="btn btn-gold mt-2 px-4" onClick={() => setUploadOpen(true)}>
              Upload Document
            </button>
          </div>
        ) : (
          <div className="row g-3 g-md-4">
            {documents.map((doc) => (
              <div className="col-12 col-sm-6 col-lg-4" key={doc._id}>
                <div className="lm-card h-100" style={{ display: "flex", flexDirection: "column" }}>

                  {/* Preview */}


{isImage(doc.fileType) ? (
  <img
    src={`${BASE_URL}${doc.filePath}`}
    alt={doc.originalName}
    style={{
      height: 140,
      objectFit: "cover",
      width: "100%",
      borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
    }}
  />
) : (

                    <div style={{ height: 120, background: "linear-gradient(135deg,var(--navy-800),var(--navy-900))", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: ".4rem" }}>
                      <span style={{ fontSize: "2.5rem" }}>
                        {doc.fileType === "application/pdf" ? "📄" : "📝"}
                      </span>
                      <span style={{ color: "rgba(255,255,255,.4)", fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".08em" }}>
                        {doc.fileType?.split("/")[1]?.toUpperCase() || "FILE"}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-3 flex-grow-1 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span style={{ background: "var(--gold-100)", color: "var(--gold-600)", border: "1px solid rgba(201,168,76,.25)", borderRadius: "30px", padding: ".18rem .6rem", fontSize: ".7rem", fontWeight: 700 }}>
                        {CAT_ICONS[doc.category]} {doc.category}
                      </span>
                      <small style={{ color: "var(--gray-400)", fontSize: ".7rem" }}>
                        {doc.fileSizeReadable}
                      </small>
                    </div>

                    <h6 style={{ fontWeight: 700, color: "var(--navy-800)", marginBottom: ".25rem", fontSize: ".86rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.originalName}
                    </h6>

                    {doc.description && (
                      <p style={{ fontSize: ".78rem", color: "var(--gray-500)", margin: ".2rem 0 .4rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {doc.description}
                      </p>
                    )}

                    <p style={{ fontSize: ".72rem", color: "var(--gray-400)", marginBottom: 0, marginTop: "auto" }}>
                      📅 {new Date(doc.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div style={{ padding: ".65rem .9rem", borderTop: "1px solid var(--gray-100)", display: "flex", gap: ".4rem" }}>
                    {(isImage(doc.fileType) || doc.fileType === "application/pdf") && (

                      <a
  href={`${BASE_URL}${doc.filePath}`}
  target="_blank"
  rel="noreferrer"
  className="btn btn-outline-gold btn-sm flex-grow-1"
  style={{
    borderRadius: "var(--radius-sm)",
    fontSize: ".76rem",
  }}
>
  👁 Preview
</a>



                    )}
                    <button className="btn btn-sm flex-grow-1" onClick={() => handleDownload(doc)}
                      style={{ borderRadius: "var(--radius-sm)", background: "var(--navy-800)", color: "var(--gold-400)", border: "none", fontSize: ".76rem", fontWeight: 600 }}>
                      ⬇ Download
                    </button>
                    <button onClick={() => setDeleteId(doc._id)}
                      style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", color: "#dc2626", borderRadius: "var(--radius-sm)", padding: ".3rem .6rem", cursor: "pointer", fontSize: ".85rem", flexShrink: 0 }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="modal show d-block" style={{ background: "rgba(6,14,30,.65)" }}>
          <div className="modal-dialog modal-dialog-centered mx-2 mx-sm-auto">
            <div className="modal-content" style={{ borderRadius: "var(--radius-lg)", border: "none", boxShadow: "var(--shadow-xl)" }}>
              <div style={{ background: "linear-gradient(135deg,var(--navy-800),var(--navy-900))", padding: "1.1rem 1.25rem", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h5 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--white)", margin: 0, fontSize: "1rem" }}>
                  Upload Document
                </h5>
                <button style={{ background: "rgba(255,255,255,.1)", border: "none", color: "var(--white)", width: 28, height: 28, borderRadius: "50%", cursor: "pointer" }}
                  onClick={() => setUploadOpen(false)}>✕</button>
              </div>
              <form onSubmit={handleUpload} className="lm-form">
                <div className="p-4">
                  <div className="mb-3">
                    <label className="form-label">
                      Select File <span style={{ color: "var(--gold-500)" }}>*</span>
                    </label>
                    <input type="file" className="form-control" ref={fileRef}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" required
                      style={{ borderRadius: "var(--radius-sm)" }} />
                    <small style={{ color: "var(--gray-400)", fontSize: ".76rem" }}>
                      PDF, DOC, DOCX, JPG, PNG — max 10MB
                    </small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Category <span style={{ color: "var(--gold-500)" }}>*</span>
                    </label>
                    <select className="form-select" value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      style={{ borderRadius: "var(--radius-sm)" }}>
                      {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Description (optional)</label>
                    <textarea className="form-control" rows={2} value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      placeholder="Brief note about this document..."
                      style={{ borderRadius: "var(--radius-sm)" }} />
                  </div>
                </div>
                <div style={{ padding: "0 1.25rem 1.25rem", display: "flex", gap: ".6rem", justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-outline-gold" onClick={() => setUploadOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-gold" disabled={uploading}>
                    {uploading ? <><span className="spinner-border spinner-border-sm me-2" />Uploading...</> : "Upload"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal show d-block" style={{ background: "rgba(6,14,30,.65)" }}>
          <div className="modal-dialog modal-dialog-centered mx-2 mx-sm-auto">
            <div className="modal-content" style={{ borderRadius: "var(--radius-lg)", border: "none", boxShadow: "var(--shadow-xl)" }}>
              <div style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", padding: "1.1rem 1.25rem", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>
                <h5 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--white)", margin: 0, fontSize: "1rem" }}>
                  Delete Document
                </h5>
              </div>
              <div className="p-4">
                <p style={{ color: "var(--gray-600)", fontSize: ".9rem", marginBottom: "1.5rem" }}>
                  Are you sure you want to permanently delete this document? This cannot be undone.
                </p>
                <div className="d-flex gap-3 justify-content-end">
                  <button className="btn btn-outline-gold" onClick={() => setDeleteId(null)}>Cancel</button>
                  <button onClick={handleDelete} disabled={deleting}
                    style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", border: "none", color: "var(--white)", fontWeight: 600, padding: ".5rem 1.25rem", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
                    {deleting ? <><span className="spinner-border spinner-border-sm me-2" />Deleting...</> : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      
    </>
  );
}

export default DocumentVault;
