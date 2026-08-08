import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute
 * --------------
 * Guards routes that require authentication.
 * If no token in localStorage → redirect to /login.
 * If token exists → render the child component.
 *
 * WHY localStorage and not a context/state check?
 *   On page refresh, React state resets to undefined.
 *   localStorage persists across refreshes — the token is always available.
 *   This keeps the guard simple and reliable without needing a global auth context.
 *
 * USAGE in AppRoutes.jsx:
 *   <Route path="/dashboard" element={
 *     <ProtectedRoute><Dashboard /></ProtectedRoute>
 *   } />
 *
 * AdminRoute variant:
 *   Also checks localStorage "user" for role === "admin".
 *   Used for the Admin Dashboard route.
 */

// Standard protected route — any logged-in user
export const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    // No token — send to login, replace history so back button doesn't loop
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin-only protected route — checks role from stored user object
export const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    // Logged in but not admin — redirect to dashboard, not login
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
