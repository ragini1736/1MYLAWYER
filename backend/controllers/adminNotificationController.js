/**
 * adminNotificationController.js
 * ──────────────────────────────
 * Admin-only notification management.
 *
 * Endpoints (registered in adminRoutes.js):
 *   GET  /api/admin/notifications        — list all broadcast notifications, paginated
 *   POST /api/admin/notifications/send   — broadcast to all users / by role
 *
 * These are BROADCAST notifications sent by admin to users.
 * They are stored in the existing Notification collection with a
 * special isAdminBroadcast: true flag so they can be filtered separately.
 *
 * Uses the existing Notification model + User model — no new models needed.
 */

import Notification from "../models/Notification.js";
import User         from "../models/User.js";

/* ─────────────────────────────────────────────────────────────
 * getAdminNotifications
 * ─────────────────────────────────────────────────────────────
 * Returns all admin-broadcast notifications, newest first.
 * Query params: ?page=1&limit=20&type=announcement
 */
export const getAdminNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const query = { isAdminBroadcast: true };
    if (type) query.type = type;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.find(query)
        .populate("sentBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    // Group by targetRole for the summary banner
    const summary = await Notification.aggregate([
      { $match: { isAdminBroadcast: true } },
      { $group: { _id: "$targetRole", count: { $sum: 1 } } },
      { $project: { _id: 0, role: "$_id", count: 1 } },
    ]);

    res.status(200).json({
      success:       true,
      total,
      totalPages:    Math.ceil(total / limitNum),
      currentPage:   pageNum,
      count:         notifications.length,
      notifications,
      summary,
    });
  } catch (error) {
    console.error("[getAdminNotifications]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────
 * sendAdminNotification
 * ─────────────────────────────────────────────────────────────
 * Broadcasts a notification to all users matching targetRole.
 *
 * Body: { title, message, type, targetRole }
 *   type:       announcement | alert | reminder | update
 *   targetRole: all | user | advocate | admin
 *
 * Strategy:
 *   1. Find all users matching targetRole
 *   2. insertMany() — one DB round-trip regardless of recipient count
 *   3. Store one "master" broadcast record (sentBy = admin) for history
 */
export const sendAdminNotification = async (req, res) => {
  try {
    const { title, message, type = "announcement", targetRole = "all" } = req.body;

    if (!title?.trim())   return res.status(400).json({ success: false, message: "title is required" });
    if (!message?.trim()) return res.status(400).json({ success: false, message: "message is required" });

    const validTypes = ["announcement", "alert", "reminder", "update"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `type must be one of: ${validTypes.join(", ")}` });
    }

    // ── Step 1: find target users ──────────────────────────
    const userQuery = targetRole === "all" ? {} : { role: targetRole };
    const recipients = await User.find(userQuery).select("_id");

    if (recipients.length === 0) {
      return res.status(400).json({ success: false, message: `No users found with role: ${targetRole}` });
    }

    // ── Step 2: bulk-create one Notification per recipient ─
    const notifDocs = recipients.map((u) => ({
      userId:           u._id,
      type:             "announcement",   // maps to existing enum
      title:            title.trim(),
      message:          message.trim(),
      isRead:           false,
      isAdminBroadcast: true,
      targetRole,
      sentBy:           req.user.id,
    }));

    await Notification.insertMany(notifDocs, { ordered: false });

    res.status(201).json({
      success:        true,
      message:        `Notification sent to ${recipients.length} user${recipients.length !== 1 ? "s" : ""}`,
      recipientCount: recipients.length,
      targetRole,
    });
  } catch (error) {
    console.error("[sendAdminNotification]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
