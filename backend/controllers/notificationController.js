import Notification from "../models/Notification.js";

/**
 * getMyNotifications
 * ------------------
 * Returns all notifications for the logged-in user.
 * Protected route — user only.
 *
 * Supports:
 *   ?isRead=true|false  → filter unread or read notifications
 *   ?page=1&limit=20    → pagination (default: page 1, limit 20)
 *
 * WHY return unreadCount alongside notifications?
 *   The frontend needs the bell badge count AND the notification list.
 *   Returning both in one response saves a second API call.
 *   The dashboard loads faster — one request instead of two.
 *
 * Sorted by createdAt descending — newest notification first.
 * This matches every notification panel UX pattern (Gmail, WhatsApp, etc.)
 */
export const getMyNotifications = async (req, res) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;

    // Base query — always scoped to the logged-in user
    const query = { userId: req.user.id };

    // Optional read/unread filter
    // isRead param comes as a string — parse to boolean
    if (isRead !== undefined) {
      query.isRead = isRead === "true";
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Run total count and notifications fetch in parallel — faster than sequential
    // Promise.all executes both DB queries simultaneously
    const [totalNotifications, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.find(query)
        .sort({ createdAt: -1 })  // Newest first
        .skip(skip)
        .limit(limitNum),
    ]);

    // Get unread count separately — always the total unread, not just current page
    // Frontend needs this to display the bell badge number accurately
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      totalNotifications,
      totalPages: Math.ceil(totalNotifications / limitNum),
      currentPage: pageNum,
      unreadCount,             // Bell badge number
      count: notifications.length,
      notifications,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * getUnreadCount
 * --------------
 * Returns only the unread notification count for the logged-in user.
 * Protected route — user only.
 *
 * WHY a dedicated endpoint?
 *   The frontend polls this endpoint periodically to keep the bell badge fresh.
 *   countDocuments() uses only the index — it never reads document content.
 *   It is significantly faster than fetching full notification documents.
 *   Returning { count: 5 } is ~10x faster than returning 5 full notification objects.
 *
 * Typical polling interval: every 30-60 seconds.
 * In Module 8 (Socket.io), this polling is replaced by real-time push.
 */
export const getUnreadCount = async (req, res) => {
  try {
    // countDocuments uses the compound index (userId + isRead) we defined in the model
    // This query never scans documents — pure index lookup
    const count = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount: count,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * markAsRead
 * ----------
 * Marks a single notification as read.
 * Protected route — user only, ownership enforced.
 *
 * WHY use findOneAndUpdate instead of find + save?
 *   find() fetches the full document from DB
 *   doc.isRead = true; await doc.save() writes it back
 *   That's 2 DB round-trips.
 *
 *   findOneAndUpdate() does ownership check AND update in ONE atomic DB operation.
 *   1 DB round-trip. Faster, cleaner, race-condition safe.
 *
 * { new: true } returns the updated document (after isRead: true is set).
 * Without it, Mongoose returns the old document (isRead: false) — confusing.
 */
export const markAsRead = async (req, res) => {
  try {
    // The query includes both _id AND userId — this is the ownership check
    // A user cannot mark another user's notification as read by guessing the ID
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,  // Ownership enforced at query level — atomic
      },
      { isRead: true },
      { new: true }           // Return updated document
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * markAllAsRead
 * -------------
 * Marks ALL unread notifications for the logged-in user as read.
 * Protected route — user only.
 *
 * WHY updateMany instead of a loop?
 *   A loop calling save() on each notification = N database round-trips.
 *   If a user has 50 unread notifications, that's 50 DB writes.
 *
 *   updateMany() sends ONE query to MongoDB.
 *   MongoDB updates all matching documents in one operation on the server.
 *   N round-trips → 1 round-trip. Always use bulk operations for bulk updates.
 *
 * modifiedCount in the response tells the frontend how many were marked read —
 * useful for showing "50 notifications marked as read" feedback.
 */
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        userId: req.user.id,
        isRead: false,         // Only update unread ones — skip already-read
      },
      {
        isRead: true,
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notification(s) marked as read`,
      modifiedCount: result.modifiedCount,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * deleteNotification
 * ------------------
 * Hard-deletes a single notification.
 * Protected route — user only, ownership enforced.
 *
 * WHY hard delete (not soft delete like documents)?
 *   Notifications have no legal, financial, or audit trail requirement.
 *   There is no reason to keep a "You booked an appointment" notification
 *   in a soft-deleted state — the appointment record itself is the audit trail.
 *   Hard delete keeps the notifications collection lean and fast.
 *
 * Ownership enforced at query level — findOneAndDelete({ _id, userId })
 * combines the ownership check and delete in one atomic operation.
 */
export const deleteNotification = async (req, res) => {
  try {
    // Atomic ownership check + delete in one DB operation
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,   // User can only delete their own notifications
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * deleteAllRead
 * -------------
 * Deletes all READ notifications for the logged-in user.
 * Protected route — user only.
 *
 * This is the "Clear notifications" button feature.
 * Only deletes read notifications — unread ones are preserved.
 *
 * WHY only delete read?
 *   Deleting unread notifications would make the user miss important updates
 *   they haven't seen yet (appointment approved, hearing scheduled, etc.)
 *   Deleting only read ones clears clutter while preserving unseen alerts.
 *
 * deletedCount in the response gives the frontend feedback on how many were cleared.
 */
export const deleteAllRead = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user.id,
      isRead: true,          // ONLY delete read notifications — preserve unread
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} read notification(s) cleared`,
      deletedCount: result.deletedCount,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
