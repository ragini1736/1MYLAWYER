/**
 * paymentService.js
 * -----------------
 * Thin wrapper around the existing api.js Axios instance.
 * Maps to the backend paymentRoutes.js endpoints exactly.
 *
 * Backend routes (all under /api/payments):
 *   GET  /summary        → getPaymentSummary
 *   GET  /getkey         → getRazorpayKey
 *   POST /create-order   → createPaymentOrder  (body: { paymentId })
 *   POST /verify         → verifyPayment        (body: { razorpayOrderId, razorpayPaymentId, razorpaySignature })
 *   GET  /history        → getPaymentHistory
 *   GET  /invoice/:id    → downloadInvoice
 */
import api from "./api";

/** GET /api/payments/summary — returns { summary: { totalPaid, totalDue, pendingPayments, totalInvoices, pendingPaymentList } } */
export const fetchPaymentSummary = () =>
  api.get("/api/payments/summary");

/** GET /api/payments/getkey — returns { key: "rzp_test_..." } */
export const fetchRazorpayKey = () =>
  api.get("/api/payments/getkey");

/**
 * POST /api/payments/create-order
 * Backend expects: { paymentId }  — the MongoDB _id of a Pending payment
 * Returns: { success, order { id, amount, currency }, paymentId }
 */
export const createOrder = (paymentId) =>
  api.post("/api/payments/create-order", { paymentId });

/**
 * POST /api/payments/verify
 * Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 * Returns: { success, message, paymentId }
 */
export const verifyPayment = (payload) =>
  api.post("/api/payments/verify", payload);

/** GET /api/payments/history — returns { success, payments: [...] } */
export const fetchPaymentHistory = () =>
  api.get("/api/payments/history");

/** GET /api/payments/invoice/:id — returns { success, invoice: {...} } */
export const fetchInvoice = (id) =>
  api.get(`/api/payments/invoice/${id}`);

/**
 * POST /api/payments/create-test-payment
 * Creates a Pending payment in MongoDB for testing the Pay Now flow.
 * Body: { advocateId, amount, serviceName }
 */
export const createTestPayment = (payload) =>
  api.post("/api/payments/create-test-payment", payload);
