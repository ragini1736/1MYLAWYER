import express from "express";
import {
  createAdvocate,
  getAllAdvocates,
  getAdvocateById,
  updateAdvocate,
  deleteAdvocate,
  toggleAdvocateStatus,
} from "../controllers/advocateController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

/**
 * AdvocateRoutes.js
 * -----------------
 * Handles all routes for the Advocate resource.
 *
 * Base path (registered in server.js): /api/advocates
 *
 * ROUTE PROTECTION STRATEGY:
 *
 *   PUBLIC routes (no auth needed):
 *     GET /api/advocates          → getAllAdvocates (with optional ?search and ?specialization)
 *     GET /api/advocates/:id      → getAdvocateById
 *
 *     WHY public? Visitors browsing the site must be able to see advocate
 *     listings and profiles without creating an account. These routes only
 *     READ data — they expose no sensitive information.
 *
 *   PROTECTED routes (admin only):
 *     POST   /api/advocates        → createAdvocate
 *     PUT    /api/advocates/:id    → updateAdvocate
 *     DELETE /api/advocates/:id    → deleteAdvocate
 *
 *     WHY admin only? Adding, editing, or deleting advocates changes the
 *     business data of the platform. Only admins should control which
 *     advocates are listed. A regular logged-in user has no business
 *     performing these operations.
 *
 * MIDDLEWARE CHAIN ON PROTECTED ROUTES:
 *   authMiddleware  → verifies JWT, sets req.user = { id, role }
 *   adminMiddleware → checks req.user.role === "admin", returns 403 if not
 *   controller      → runs only if both middleware pass
 *
 * QUERY PARAMETERS supported on GET /:
 *   ?search=ankesh                    → case-insensitive name search
 *   ?specialization=Civil Law         → exact specialization filter
 *   ?search=ankesh&specialization=... → both combined
 */

const router = express.Router();

// ─────────────────────────────────────────────
// PUBLIC ROUTES — No authentication required
// ─────────────────────────────────────────────

// GET /api/advocates
// GET /api/advocates?search=ankesh
// GET /api/advocates?specialization=Civil Law
// GET /api/advocates?search=ankesh&specialization=Civil Law
router.get("/", getAllAdvocates);

// GET /api/advocates/:id
router.get("/:id", getAdvocateById);

// ─────────────────────────────────────────────
// PROTECTED ROUTES — Admin only
// ─────────────────────────────────────────────

// POST /api/advocates
// Creates a new advocate — admin only
// Body: { fullName, email, phone, specialization, experience, qualification, location, fees, about }
router.post("/", authMiddleware, adminMiddleware, createAdvocate);

// PUT /api/advocates/:id
// Updates an advocate by ID — admin only
router.put("/:id", authMiddleware, adminMiddleware, updateAdvocate);

// DELETE /api/advocates/:id
router.delete("/:id", authMiddleware, adminMiddleware, deleteAdvocate);

// PATCH /api/advocates/:id/toggle-status
router.patch("/:id/toggle-status", authMiddleware, adminMiddleware, toggleAdvocateStatus);

export default router;
