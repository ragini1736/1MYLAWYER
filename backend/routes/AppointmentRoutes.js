import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
  approveAppointment,
  rejectAppointment,
  getUpcomingAppointments,
  getAppointmentHistory,
  getAllAppointments,
} from "../controllers/appointmentController.js";

/**
 * AppointmentRoutes.js
 * --------------------
 * Handles all routes for the Appointment resource.
 *
 * Base path (registered in server.js): /api/appointments
 *
 * PROTECTION LEVELS:
 *
 *   USER routes (authMiddleware only):
 *     Logged-in users access these. The controller enforces ownership —
 *     users can only read/modify their own appointments.
 *
 *   ADMIN routes (authMiddleware + adminMiddleware):
 *     Only users with role "admin" can access these.
 *     The middleware chain blocks everyone else before the controller runs.
 *
 * ⚠️  ROUTE ORDERING IS CRITICAL IN EXPRESS:
 *     Routes are matched top-to-bottom in registration order.
 *     Specific string routes (/all, /my, /upcoming, /history) MUST be
 *     registered BEFORE the parameterised route (/:id).
 *
 *     WHY? If /:id is registered first, Express sees GET /all and
 *     matches it as /:id with id = "all". The controller then calls
 *     Appointment.findById("all") which throws a CastError.
 *
 *     Rule: Always register specific routes before parameterised routes.
 *
 * FULL ROUTE MAP:
 *   POST   /api/appointments/               → bookAppointment        (user)
 *   GET    /api/appointments/my             → getMyAppointments      (user)
 *   GET    /api/appointments/upcoming       → getUpcomingAppointments(user)
 *   GET    /api/appointments/history        → getAppointmentHistory  (user)
 *   GET    /api/appointments/all            → getAllAppointments      (admin)
 *   GET    /api/appointments/:id            → getAppointmentById     (user/admin)
 *   PUT    /api/appointments/:id/cancel     → cancelAppointment      (user)
 *   PUT    /api/appointments/:id/reschedule → rescheduleAppointment  (user)
 *   PUT    /api/appointments/:id/approve    → approveAppointment     (admin)
 *   PUT    /api/appointments/:id/reject     → rejectAppointment      (admin)
 */

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// USER ROUTES — Logged-in users only
// ─────────────────────────────────────────────────────────────

// POST /api/appointments
// Book a new appointment — requires advocateId, fullName, email, phone,
// service, appointmentDate, timeSlot in request body
router.post("/", authMiddleware, bookAppointment);

// GET /api/appointments/my
// Returns all appointments (full history) for the logged-in user
// Sorted ascending by appointmentDate — upcoming first
router.get("/my", authMiddleware, getMyAppointments);

// GET /api/appointments/upcoming
// Returns only future Pending/Approved appointments for the logged-in user
// Used for the dashboard "upcoming consultations" widget
router.get("/upcoming", authMiddleware, getUpcomingAppointments);

// GET /api/appointments/history
// Returns past/completed/cancelled/rejected appointments for the logged-in user
// Sorted descending — most recent history first
router.get("/history", authMiddleware, getAppointmentHistory);

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES — Admin only (registered before /:id — see ordering note above)
// ─────────────────────────────────────────────────────────────

// GET /api/appointments/all
// Returns every appointment in the system
// Optional query param: ?status=Pending filters by status
// ⚠️  MUST be above GET /:id — "all" would be matched as an id param otherwise
router.get("/all", authMiddleware, adminMiddleware, getAllAppointments);

// ─────────────────────────────────────────────────────────────
// PARAMETERISED ROUTES — Must come AFTER all specific string routes
// ─────────────────────────────────────────────────────────────

// GET /api/appointments/:id
// Returns a single appointment by MongoDB ObjectId
// Controller enforces: user can only view their own, admin can view any
router.get("/:id", authMiddleware, getAppointmentById);

// PUT /api/appointments/:id/cancel
// User cancels their own Pending or Approved appointment
// Body (optional): { reason: "Cannot attend" }
router.put("/:id/cancel", authMiddleware, cancelAppointment);

// PUT /api/appointments/:id/reschedule
// User reschedules to a new date and time slot
// Resets status to "Pending" for re-approval
// Body: { appointmentDate, timeSlot, reason (optional) }
router.put("/:id/reschedule", authMiddleware, rescheduleAppointment);

// PUT /api/appointments/:id/approve
// Admin approves a Pending appointment
router.put("/:id/approve", authMiddleware, adminMiddleware, approveAppointment);

// PUT /api/appointments/:id/reject
// Admin rejects a Pending appointment with a mandatory reason
// Body: { reason: "Advocate unavailable on this date" }
router.put("/:id/reject", authMiddleware, adminMiddleware, rejectAppointment);

export default router;
