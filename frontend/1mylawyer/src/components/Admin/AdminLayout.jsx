/**
 * AdminLayout.jsx
 * ────────────────
 * Wraps every admin page.
 * Desktop  : fixed 240px sidebar + scrollable right content
 * Tablet/Mobile : offcanvas sidebar triggered by hamburger in AdminNavbar
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebarDesktop, AdminSidebarOffcanvas } from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";

export default function AdminLayout({ children, title }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authChange"));
    navigate("/login");
  }, [navigate]);

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: "var(--gray-50)",
      fontFamily: "var(--font-sans)",
    }}>
      {/* Desktop sidebar — sticky, always visible on lg+ */}
      <AdminSidebarDesktop onLogout={handleLogout} />

      {/* Mobile / tablet offcanvas */}
      <AdminSidebarOffcanvas
        show={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Right column: navbar + scrollable page content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <AdminNavbar
          title={title}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />

        <main style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "1.75rem 1.5rem 3rem",
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
