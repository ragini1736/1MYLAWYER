import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
} from "../controllers/notificationController.js";

/**
 * notificationRoutes.js
 * ---------------------
 * Handles all routes for the Notification resource.
 *
 * Base path (registered in server.js): /api/notifications
 *
 * PROTECTION:
 *   ALL routes require authMiddleware — notifications are always personal.
 *   There are no public notification routes.
 *   There are no admin-only notification routes.
 *   Ownership is enforced inside controllers via req.user.id.
 *
 * ⚠️  ROUTE ORDERING — Critical:
 *   /unread-count, /mark-all-read, /clear-read must be registered BEFORE /:id.
 *   If /:id comes first, Express matches these strings as an ObjectId parameter.
 *   Mongoose then tries ObjectId("unread-count") → CastError.
 *   Rule: all specific string routes BEFORE parameterised routes.
 *
 * FULL ROUTE MAP:
 *   GET    /api/notifications              → getMyNotifications   (paginated, filterable)
 *   GET    /api/notifications/unread-count → getUnreadCount       (bell badge)
 *   PUT    /api/notifications/mark-all-read → markAllAsRead       (bulk read)
 *   DELETE /api/notifications/clear-read   → deleteAllRead        (bulk delete read)
 *   PUT    /api/notifications/:id/read     → markAsRead           (single)
 *   DELETE /api/notifications/:id          → deleteNotification   (single)
 *
 * QUERY PARAMETERS (getMyNotifications):
 *   ?isRead=true|false   → filter read or unread notifications
 *   ?page=1&limit=20     → pagination
 */

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// STRING ROUTES — Must come before parameterised routes
// ─────────────────────────────────────────────────────────────

// GET /api/notifications
// Returns paginated notifications for the logged-in user.
// Response includes unreadCount for the bell badge.
// ?isRead=false → unread only | ?isRead=true → read only | no param → all
router.get("/", authMiddleware, getMyNotifications);

// GET /api/notifications/unread-count
// Returns only the unread count — fast index-only query.
// Used for polling to keep the bell badge number fresh.
// ⚠️ Must be above /:id
router.get("/unread-count", authMiddleware, getUnreadCount);

// PUT /api/notifications/mark-all-read
// Marks all unread notifications as read in one bulk DB operation.
// ⚠️ Must be above /:id
router.put("/mark-all-read", authMiddleware, markAllAsRead);

// DELETE /api/notifications/clear-read
// Deletes all READ notifications — preserves unread ones.
// ⚠️ Must be above /:id
router.delete("/clear-read", authMiddleware, deleteAllRead);

// ─────────────────────────────────────────────────────────────
// PARAMETERISED ROUTES — After all specific string routes
// ─────────────────────────────────────────────────────────────

// PUT /api/notifications/:id/read
// Marks a single notification as read.
// Atomic ownership check + update in one DB operation.
router.put("/:id/read", authMiddleware, markAsRead);

// DELETE /api/notifications/:id
// Hard-deletes a single notification.
// Atomic ownership check + delete in one DB operation.
router.delete("/:id", authMiddleware, deleteNotification);

export default router;
