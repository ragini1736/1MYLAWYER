/**
 * DataTable.jsx
 * Reusable responsive table with:
 *  - Search bar
 *  - Pagination
 *  - Empty / loading states
 *  - Column sorting (client-side, optional)
 *
 * Props:
 *   columns   Array<{ key, label, render?, sortable? }>
 *   data      Array<object>
 *   loading   boolean
 *   error     string | null
 *   onRetry   () => void
 *   pageSize  number (default 10)
 *   searchPlaceholder string
 *   searchKeys  Array<string>  — which object keys to search against
 *   actions   (row) => ReactNode  — renders action buttons per row
 *   emptyText string
 */
import { useState, useMemo } from "react";

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  error = null,
  onRetry,
  pageSize = 10,
  searchPlaceholder = "Search…",
  searchKeys = [],
  actions,
  emptyText = "No records found.",
}) {
  const [query,   setQuery  ] = useState("");
  const [page,    setPage   ] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  /* ── filter ── */
  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q))
    );
  }, [data, query, searchKeys]);

  /* ── sort ── */
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  /* ── paginate ── */
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current    = Math.min(page, totalPages);
  const paged      = sorted.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  /* reset page on search */
  const handleSearch = (v) => { setQuery(v); setPage(1); };

  /* ── render ── */
  return (
    <div>
      {/* Search */}
      <div className="mb-3" style={{ maxWidth: 380 }}>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "var(--gray-400)", pointerEvents: "none",
          }}>🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ paddingLeft: 36, borderRadius: 8, height: 40, fontSize: ".88rem" }}
          />
        </div>
        {query && (
          <div style={{ fontSize: ".78rem", color: "var(--gray-500)", marginTop: 4 }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <div className="lm-spinner" />
          <p style={{ color: "var(--gray-500)", fontSize: ".88rem", marginTop: 12 }}>Loading…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center" style={{ borderRadius: 10 }}>
          <span>⚠️ {error}</span>
          {onRetry && (
            <button className="btn btn-sm btn-danger" onClick={onRetry} style={{ borderRadius: 6 }}>
              Retry
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid var(--gray-200)" }}>
            <table className="table table-hover mb-0" style={{ minWidth: 560 }}>
              <thead style={{ background: "var(--navy-800)" }}>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                      style={{
                        padding: ".75rem 1rem",
                        fontSize: ".72rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".07em",
                        color: "rgba(255,255,255,.9)",
                        borderBottom: "none",
                        cursor: col.sortable ? "pointer" : "default",
                        whiteSpace: "nowrap",
                        userSelect: "none",
                      }}
                    >
                      {col.label}
                      {col.sortable && (
                        <span style={{ marginLeft: 4, opacity: .6 }}>
                          {sortKey === col.key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      )}
                    </th>
                  ))}
                  {actions && (
                    <th style={{
                      padding: ".75rem 1rem", fontSize: ".72rem", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: ".07em",
                      color: "rgba(255,255,255,.9)", borderBottom: "none",
                    }}>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (actions ? 1 : 0)}
                      className="text-center py-5"
                      style={{ color: "var(--gray-500)", fontSize: ".92rem" }}
                    >
                      {emptyText}
                    </td>
                  </tr>
                ) : (
                  paged.map((row, idx) => (
                    <tr key={row._id || idx} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            padding: ".75rem 1rem",
                            fontSize: ".88rem",
                            color: "var(--gray-700)",
                            verticalAlign: "middle",
                          }}
                        >
                          {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                        </td>
                      ))}
                      {actions && (
                        <td style={{ padding: ".75rem 1rem", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          {actions(row)}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
              <span style={{ fontSize: ".82rem", color: "var(--gray-500)" }}>
                Showing {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, sorted.length)} of {sorted.length}
              </span>
              <div className="d-flex gap-1 flex-wrap">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  style={{ borderRadius: 6, fontSize: ".8rem" }}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={current === 1}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - current) <= 1)
                  .reduce((acc, n, i, arr) => {
                    if (i > 0 && n - arr[i - 1] > 1) acc.push("…");
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((n, i) =>
                    n === "…" ? (
                      <span key={`e${i}`} style={{ padding: "0 4px", lineHeight: "30px", fontSize: ".8rem", color: "var(--gray-400)" }}>…</span>
                    ) : (
                      <button
                        key={n}
                        className={`btn btn-sm ${n === current ? "btn-navy" : "btn-outline-secondary"}`}
                        style={{ borderRadius: 6, fontSize: ".8rem", minWidth: 32 }}
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    )
                  )}
                <button
                  className="btn btn-sm btn-outline-secondary"
                  style={{ borderRadius: 6, fontSize: ".8rem" }}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={current === totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
