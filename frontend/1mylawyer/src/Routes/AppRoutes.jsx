import { Routes, Route } from "react-router-dom";
import { ProtectedRoute, AdminRoute } from "../components/ProtectedRoute";

// Public pages
import Home from "../pages/Home";
import Service from "../pages/Service";
import Contact from "../pages/Contact";
import Login from "../pages/Login";
import Register from "../pages/Register";
import LegalLibrary from "../pages/LegalLibrary";
import AboutAdvocate from "../pages/AboutAdvocate";
import AdvocateListing from "../pages/AdvocateListing";
import AdvocateDetails from "../pages/AdvocateDetails";
import NotFound from "../pages/NotFound";

// Protected pages — require login
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import Appointment from "../pages/Appointment";
import MyAppointments from "../pages/MyAppointments";
import CaseTracker from "../pages/CaseTracker";
import DocumentVault from "../pages/DocumentVault";
import Notification from "../pages/Notification";

// Payment pages
import PaymentPage from "../pages/Payments/PaymentPage";
import PaymentHistoryPage from "../pages/Payments/PaymentHistoryPage";
import PaymentStatusPage from "../pages/Payments/PaymentStatusPage";
import InvoicePage from "../pages/Payments/InvoicePage";


// Admin only
import AdminDashboard    from "../pages/Admin/AdminDashboard";
import AdminUsers         from "../pages/Admin/Users";
import AdminAdvocates     from "../pages/Admin/Advocates";
import AdminCases         from "../pages/Admin/Cases";
import AdminAppointments  from "../pages/Admin/Appointments";
import AdminPayments      from "../pages/Admin/Payments";
import AdminDocuments     from "../pages/Admin/Documents";
import AdminNotifications from "../pages/Admin/Notifications";
import AdminSettings      from "../pages/Admin/Settings";
import AdminLegalLibrary from "../pages/Admin/LegalLibrary";
import MainLayout from "../layouts/MainLayout";

/**
 * AppRoutes.jsx
 * -------------
 * Central routing configuration for the entire app.
 *
 * This file now uses a `MainLayout` for all public and protected user routes,
 * ensuring a consistent Navbar and Footer. The Admin panel routes are grouped
 * separately and use their own `AdminLayout` (applied via `AdminRoute`).
 *
 * Routes outside the layouts (e.g., Login, NotFound) are rendered without
 * the standard Navbar/Footer.
 */
function AppRoutes() {
  return (
    <Routes>
      {/* ─── LAYOUT-WRAPPED ROUTES (Public and Protected) ─────────── */}
      <Route element={<MainLayout />}>
        {/* --- Public --- */}
        <Route path="/" element={<Home />} />
        <Route path="/service" element={<Service />} />
        <Route path="/about" element={<AboutAdvocate />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/library" element={<LegalLibrary />} />
        <Route path="/advocates" element={<AdvocateListing />} />
        <Route path="/advocates/:id" element={<AdvocateDetails />} />

        {/* --- Protected (User) --- */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointment"
          element={
            <ProtectedRoute>
              <Appointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-appointments"
          element={
            <ProtectedRoute>
              <MyAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases"
          element={
            <ProtectedRoute>
              <CaseTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/document"
          element={
            <ProtectedRoute>
              <DocumentVault />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notification />
            </ProtectedRoute>
          }
        />

        {/* --- Payment --- */}
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/history"
          element={
            <ProtectedRoute>
              <PaymentHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/status"
          element={
            <ProtectedRoute>
              <PaymentStatusPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoice/:id"
          element={
            <ProtectedRoute>
              <InvoicePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ─── STANDALONE ROUTES (no main layout) ─────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<NotFound />} />

      {/* ─── ADMIN ROUTES (handled by AdminLayout via AdminRoute) ─── */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/advocates"
        element={
          <AdminRoute>
            <AdminAdvocates />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/cases"
        element={
          <AdminRoute>
            <AdminCases />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/appointments"
        element={
          <AdminRoute>
            <AdminAppointments />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <AdminRoute>
            <AdminPayments />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/documents"
        element={
          <AdminRoute>
            <AdminDocuments />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <AdminRoute>
            <AdminNotifications />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminRoute>
            <AdminSettings />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/legal-library"
        element={
          <AdminRoute>
            <AdminLegalLibrary />
          </AdminRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
