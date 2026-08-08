import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  createCase,
  getMyCases,
  getCaseById,
  updateCaseStatus,
  addHearingDate,
  addCaseNote,
  closeCase,
  reopenCase,
  getAllCases,
  getCasesByAdvocate,
  getCaseTimeline,
} from "../controllers/caseController.js";

/**
 * CaseRoutes.js
 * -------------
 * Handles all routes for the Case resource.
 *
 * Base path (registered in server.js): /api/cases
 *
 * BUGS FIXED FROM ORIGINAL:
 *   ✅ All routes now have authMiddleware — previously completely unprotected
 *   ✅ Write routes have correct admin protection
 *   ✅ 10 new routes added to cover the full feature set
 *
 * PROTECTION LEVELS:
 *
 *   USER routes (authMiddleware only):
 *     Controllers enforce ownership — users only access their own cases.
 *
 *   ADMIN routes (authMiddleware + adminMiddleware):
 *     Route-level protection blocks non-admins before controller runs.
 *
 * ⚠️  ROUTE ORDERING — Critical in Express:
 *     String routes (/my, /all) and prefix routes (/advocate/:advocateId)
 *     MUST be registered BEFORE the generic parameterised route (/:id).
 *     If /:id comes first, Express matches "/my" as id="my" and
 *     tries Case.findById("my") → CastError.
 *     Rule: most specific routes always above least specific routes.
 *
 * FULL ROUTE MAP:
 *   POST   /api/cases/                         → createCase              (user)
 *   GET    /api/cases/my                        → getMyCases              (user)
 *   GET    /api/cases/all                       → getAllCases             (admin)
 *   GET    /api/cases/advocate/:advocateId      → getCasesByAdvocate      (admin)
 *   GET    /api/cases/:id                       → getCaseById             (user/admin)
 *   GET    /api/cases/:id/timeline              → getCaseTimeline         (user/admin)
 *   POST   /api/cases/:id/notes                 → addCaseNote             (user/admin)
 *   PUT    /api/cases/:id/status                → updateCaseStatus        (admin)
 *   PUT    /api/cases/:id/hearing               → addHearingDate          (admin)
 *   PUT    /api/cases/:id/close                 → closeCase               (admin)
 *   PUT    /api/cases/:id/reopen                → reopenCase              (admin)
 *
 * QUERY PARAMETERS (getMyCases):
 *   ?status=Pending|In Progress|Hearing|Closed
 *   ?category=Civil Law|Criminal Law|...
 *   ?search=keyword
 *   ?page=1&limit=10
 *   ?sort=latest|oldest
 *
 * QUERY PARAMETERS (getAllCases — admin):
 *   All of the above, plus:
 *   ?advocateId=<ObjectId>
 *   ?userId=<ObjectId>
 */

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// USER ROUTES — Logged-in users only
// ─────────────────────────────────────────────────────────────

// POST /api/cases
// Creates a new case. userId auto-set from JWT. caseNumber auto-generated.
// Body: { advocateId, caseTitle, clientName, category, caseType, courtName,
//         description, filingDate?, appointmentId?, paymentId? }
router.post("/", authMiddleware, createCase);

// GET /api/cases/my
// Returns logged-in user's cases with optional filters and pagination.
// Supports: ?status, ?category, ?search, ?page, ?limit, ?sort
// ⚠️ Must be above /:id — "my" would be matched as id otherwise
router.get("/my", authMiddleware, getMyCases);

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES — Registered before /:id to prevent route conflicts
// ─────────────────────────────────────────────────────────────

// GET /api/cases/all
// Admin views all cases with full filters, search, and pagination.
// Supports: ?status, ?category, ?advocateId, ?userId, ?search, ?page, ?limit, ?sort
// ⚠️ Must be above /:id — "all" would be matched as id otherwise
router.get("/all", authMiddleware, adminMiddleware, getAllCases);

// GET /api/cases/advocate/:advocateId
// Admin views all cases assigned to a specific advocate.
// Used in the admin dashboard advocate management view.
// ⚠️ Must be above /:id — Express would match /advocate/xyz as /:id otherwise
router.get(
  "/advocate/:advocateId",
  authMiddleware,
  adminMiddleware,
  getCasesByAdvocate
);

// ─────────────────────────────────────────────────────────────
// PARAMETERISED ROUTES — After all specific string/prefix routes
// ─────────────────────────────────────────────────────────────

// GET /api/cases/:id
// Returns a single case with full populate (user, advocate, appointment, payment).
// User can only view their own case. Admin can view any.
router.get("/:id", authMiddleware, getCaseById);

// GET /api/cases/:id/timeline
// Returns only the timeline array for a case — lightweight endpoint.
// Used for the case detail "Timeline" tab without fetching the full document.
// User can only view their own case timeline. Admin can view any.
router.get("/:id/timeline", authMiddleware, getCaseTimeline);

// POST /api/cases/:id/notes
// Adds a note to a case. User can add to their own; admin can add to any.
// Body: { text }
router.post("/:id/notes", authMiddleware, addCaseNote);

// PUT /api/cases/:id/status
// Admin updates the case status.
// Body: { status: "Pending" | "In Progress" | "Hearing" | "Closed" }
// Auto-appends "Status Changed" timeline entry.
router.put("/:id/status", authMiddleware, adminMiddleware, updateCaseStatus);

// PUT /api/cases/:id/hearing
// Admin schedules a new hearing date.
// Body: { hearingDate: "2026-09-15" }
// Pushes to hearingDates array, updates nextHearingDate, advances status to Hearing.
router.put("/:id/hearing", authMiddleware, adminMiddleware, addHearingDate);

// PUT /api/cases/:id/close
// Admin closes a case. Only non-closed cases can be closed.
// Auto-appends "Case Closed" timeline entry.
router.put("/:id/close", authMiddleware, adminMiddleware, closeCase);

// PUT /api/cases/:id/reopen
// Admin reopens a closed case. Only "Closed" cases can be reopened.
// Resets status to "In Progress". Auto-appends "Case Reopened" timeline entry.
router.put("/:id/reopen", authMiddleware, adminMiddleware, reopenCase);

export default router;
