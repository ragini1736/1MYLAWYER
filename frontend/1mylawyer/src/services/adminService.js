/**
 * adminService.js
 * ───────────────
 * All API calls for the Admin Panel.
 *
 * ✅ FIXED: This file now uses the centralised `api` instance from `./api.js`.
 * This removes the need for the local `auth()` helper function. The `api`
 * instance has a request interceptor that automatically attaches the
 * 'Authorization: Bearer <token>' header to every request. This fixes the
 * "No token provided" error and centralises auth logic.
 */
import api from "./api";

/* ── Analytics ─────────────────────────────────────────────── */
export const getDashboardStats      = ()  => api.get(`/api/admin/stats`);
export const getRevenueAnalytics    = ()  => api.get(`/api/admin/reports/revenue`);
export const getUsersReport         = ()  => api.get(`/api/admin/reports/users`);
export const getAppointmentsReport  = ()  => api.get(`/api/admin/reports/appointments`);
export const getCasesReport         = ()  => api.get(`/api/admin/reports/cases`);

/* ── User Management ───────────────────────────────────────── */
export const getAllUsers    = (p = {}) => api.get(`/api/admin/users`, { params: p });
export const getUserDetails = (id)    => api.get(`/api/admin/users/${id}`);
export const updateUserRole = (id, role) => api.put(`/api/admin/users/${id}/role`, { role });
export const deleteUser     = (id)    => api.delete(`/api/admin/users/${id}`);

/* ── Advocate Management ───────────────────────────────────── */
export const getAllAdvocates     = (p = {}) => api.get(`/api/admin/advocates`, { params: p });
export const getAdvocateDetails  = (id)    => api.get(`/api/admin/advocates/${id}`);
export const approveAdvocate     = (id)    => api.post(`/api/admin/advocates/${id}/approve`);
export const rejectAdvocate      = (id)    => api.post(`/api/admin/advocates/${id}/reject`);
/* CRUD — POST/PUT use multipart/form-data for profile photo */
export const createAdminAdvocate  = (fd)     => api.post(`/api/admin/advocates`, fd);
export const updateAdminAdvocate  = (id, fd) => api.put(`/api/admin/advocates/${id}`, fd);
export const deleteAdminAdvocate  = (id)     => api.delete(`/api/admin/advocates/${id}`);
/* Toggle isActive on/off */
export const toggleAdvocateStatus = (id)     => api.patch(`/api/admin/advocates/${id}/toggle-status`);

/* ── Appointments ──────────────────────────────────────────── */
export const getAllAppointments = (p = {}) => api.get(`/api/admin/appointments`, { params: p });

/* ── Cases ─────────────────────────────────────────────────── */
export const getAllCases      = (p = {})       => api.get(`/api/admin/cases`, { params: p });
export const updateCaseStatus = (id, status)  => api.put(`/api/admin/cases/${id}/status`, { status });
export const assignAdvocate   = (id, advocateId) => api.put(`/api/admin/cases/${id}/assign`, { advocateId });

/* ── Payments ──────── */
export const getAllPayments = (p = {}) => api.get(`/api/admin/payments`, { params: p });

/* ── Documents ─────────────────────────────────────────────── */
export const getAllDocuments      = (p = {}) => api.get(`/api/admin/documents`, { params: p });
export const adminDeleteDocument  = (id)     => api.delete(`/api/admin/documents/${id}`);

/* ── Legal Library ─────────────────────────────────────── */
export const getLegalLibrary  = (p = {}) => api.get(`/api/admin/legal-library`, { params: p });
export const uploadLegalDoc   = (fd)     => api.post(`/api/admin/legal-library`, fd);
export const updateLegalDoc   = (id, d)  => api.put(`/api/admin/legal-library/${id}`, d);
export const deleteLegalDoc   = (id)     => api.delete(`/api/admin/legal-library/${id}`);

/* ── Notifications ─────────────────────────────────────────── */
export const getNotifications = (p = {}) => api.get(`/api/admin/notifications`, { params: p });
export const sendNotification = (data)   => api.post(`/api/admin/notifications/send`, data);

/* ── Settings ──────────────────────────────────────────────── */
export const getAdminProfile     = ()     => api.get(`/api/user/profile`);
export const updateAdminProfile  = (data) => api.put(`/api/user/profile`, data);
export const changeAdminPassword = (data) => api.put(`/api/user/profile/change-password`, data);

///admin settings
export const getSiteSettings = () =>
  api.get(`/api/admin/settings`);

export const updateSiteSettings = (data) =>
  api.put(`/api/admin/settings`, data);




export const updateAppointmentStatus = (id, status) => {
  return api.put(`/api/admin/appointments/${id}/status`, { status });
};


export const deleteAppointment = (id) => {
  return api.delete(`/admin/appointments/${id}`);
};