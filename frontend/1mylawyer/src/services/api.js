import axios from "axios";

/**
 * api.js
 * ------
 * Centralised Axios instance for the entire frontend.
 *
 * WHY A CENTRALISED INSTANCE?
 *   Without this, every component manually:
 *     1. Specifies the base URL
 *     2. Reads the token from localStorage
 *     3. Adds the Authorization header
 *     4. Handles 401 (expired token) separately
 *
 *   This file handles all four concerns in one place.
 *   Every component imports `api` and calls api.get/post/put/delete —
 *   headers, base URL, and error handling are automatic.
 *
 * USAGE IN COMPONENTS:
 *   import api from "../services/api";
 *
 *   // GET request (token auto-attached)
 *   const res = await api.get("/api/user/profile");
 *
 *   // POST request
 *   const res = await api.post("/api/appointments", formData);
 *
 *   // File upload (multipart)
 *   const res = await api.post("/api/documents", formData, {
 *     headers: { "Content-Type": "multipart/form-data" }
 *   });
 */

const api = axios.create({
  baseURL: "https://onemylawyer.onrender.com/",
  timeout: 15000, // 15 seconds — prevents requests hanging indefinitely
});

/**
 * REQUEST INTERCEPTOR
 * -------------------
 * Runs before EVERY request is sent.
 * Reads the JWT from localStorage and attaches it to the Authorization header.
 *
 * WHY HERE and not in each component?
 *   Token can change (login, logout). If you stored the token at import time
 *   in each component, you'd need to re-import after login.
 *   Reading from localStorage inside the interceptor gets the CURRENT token
 *   on every request — always fresh.
 *
 * If no token exists (unauthenticated request), the header is simply not set.
 * The server's authMiddleware will return 401, which the response interceptor handles.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 * --------------------
 * Runs after EVERY response is received.
 *
 * On 401 Unauthorized (expired or invalid token):
 *   1. Clear localStorage (remove stale token and user data)
 *   2. Redirect to /login
 *   This handles session expiry silently — the user is redirected to login
 *   without seeing a cryptic error message.
 *
 * All other errors are passed through to the calling component
 * where they are handled with try-catch and toast notifications.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear session and force re-login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Use window.location to avoid React Router dependency in this utility file
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// =============================================
// PAYMENT GATEWAY
// =============================================
export const getRazorpayKey = async () => {
  const { data } = await api.get("/api/payments/getkey");
  return data.key;
};

export const createRazorpayOrder = async (orderData) => {
  const { data } = await api.post("/api/payments/create-order", orderData);
  return data;
};

export const verifyRazorpayPayment = async (paymentData) => {
  const { data } = await api.post("/api/payments/verify", paymentData);
  return data;
};

export const getPaymentHistory = async () => {
  const { data } = await api.get("/api/payments/history");
  return data;
};

export const getInvoice = async (id) => {
  const { data } = await api.get(`/api/payments/invoice/${id}`);
  return data;
};
