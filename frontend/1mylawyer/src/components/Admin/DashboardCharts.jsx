/**
 * DashboardCharts.jsx
 * ────────────────────
 * Two chart panels for the admin dashboard.
 *
 * Chart library: recharts (lightweight, tree-shakeable)
 * If recharts is not installed the components gracefully fall back
 * to a styled placeholder — no crash.
 *
 * Data sources:
 *   revenueData  — from GET /api/admin/reports/revenue  → { monthlyRevenue: [{month, revenue}] }
 *   usersData    — from GET /api/admin/reports/users    → { monthlyRegistrations: [{month, count}] }
 */
import { useEffect, useState } from "react";

/* ── Try to import recharts, fall back gracefully ── */
let LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, chartsAvailable;
try {
  const rc = await import("recharts");
  LineChart = rc.LineChart; Line = rc.Line;
  BarChart = rc.BarChart; Bar = rc.Bar;
  XAxis = rc.XAxis; YAxis = rc.YAxis;
  CartesianGrid = rc.CartesianGrid; Tooltip = rc.Tooltip;
  ResponsiveContainer = rc.ResponsiveContainer;
  chartsAvailable = true;
} catch {
  chartsAvailable = false;
}

/* ── mini bar rendered with plain divs (no lib needed) ── */
function MiniBar({ data = [], valueKey = "value", labelKey = "label", color = "var(--gold-500)" }) {
  if (!data.length) return <div style={{ color: "var(--gray-400)", fontSize: ".85rem", textAlign: "center", padding: "2rem" }}>No data</div>;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, padding: "0 4px" }}>
      {data.map((d, i) => {
        const h = Math.max(4, ((d[valueKey] || 0) / max) * 110);
        return (
          <div
            key={i}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
            title={`${d[labelKey]}: ${d[valueKey]}`}
          >
            <div style={{
              width: "100%", height: h, borderRadius: "4px 4px 0 0",
              background: color, transition: "height .3s ease",
              minWidth: 6,
            }} />
            <span style={{ fontSize: ".58rem", color: "var(--gray-400)", whiteSpace: "nowrap" }}>
              {String(d[labelKey]).slice(0, 3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Revenue chart ── */
export function RevenueChart({ data = [], loading = false }) {
  const months = data.map((d) => ({ ...d, month: String(d.month).slice(0, 3) }));

  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)",
      boxShadow: "0 2px 12px rgba(6,14,30,.06)", padding: "1.25rem 1.4rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h6 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--navy-800)", margin: 0, fontSize: ".95rem" }}>
            Monthly Revenue
          </h6>
          <p style={{ fontSize: ".75rem", color: "var(--gray-500)", margin: 0 }}>Last 12 months</p>
        </div>
        <span style={{ fontSize: "1.2rem" }}>📈</span>
      </div>

      {loading ? (
        <div className="lm-skeleton" style={{ height: 130, borderRadius: 8 }} />
      ) : chartsAvailable && months.length ? (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={months} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--gray-500)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--gray-500)" }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
            <Tooltip
              formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
              contentStyle={{ borderRadius: 8, fontSize: ".78rem", border: "1px solid var(--gray-200)" }}
            />
            <Line type="monotone" dataKey="revenue" stroke="var(--gold-500)" strokeWidth={2.5}
              dot={{ fill: "var(--gold-500)", r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <MiniBar data={months} valueKey="revenue" labelKey="month" color="var(--gold-500)" />
      )}
    </div>
  );
}

/* ── User registrations chart ── */
export function UsersChart({ data = [], loading = false }) {
  const months = data.map((d) => ({ ...d, month: String(d.month).slice(0, 3) }));

  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)",
      boxShadow: "0 2px 12px rgba(6,14,30,.06)", padding: "1.25rem 1.4rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h6 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--navy-800)", margin: 0, fontSize: ".95rem" }}>
            New Registrations
          </h6>
          <p style={{ fontSize: ".75rem", color: "var(--gray-500)", margin: 0 }}>Last 12 months</p>
        </div>
        <span style={{ fontSize: "1.2rem" }}>👥</span>
      </div>

      {loading ? (
        <div className="lm-skeleton" style={{ height: 130, borderRadius: 8 }} />
      ) : chartsAvailable && months.length ? (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={months} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--gray-500)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--gray-500)" }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => [v, "Users"]}
              contentStyle={{ borderRadius: 8, fontSize: ".78rem", border: "1px solid var(--gray-200)" }}
            />
            <Bar dataKey="count" fill="var(--navy-600)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <MiniBar data={months} valueKey="count" labelKey="month" color="var(--navy-600)" />
      )}
    </div>
  );
}
