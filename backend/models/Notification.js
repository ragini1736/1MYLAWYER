import mongoose from "mongoose";

/**
 * Notification.js
 * ---------------
 * PURPOSE:
 *   Stores all in-app notifications for every user.
 *   Notifications are created automatically by the server when key events occur:
 *   appointment booked, payment verified, case status changed, hearing scheduled,
 *   document uploaded, etc.
 *   Users never create notifications manually — they only READ and DELETE them.
 *
 * DESIGN DECISIONS:
 *
 *   1. SEPARATE COLLECTION (not embedded in User):
 *      A user can accumulate hundreds of notifications over time.
 *      Embedding them in the User document would make it grow without bound.
 *      A separate collection keeps User documents small and fast to fetch.
 *      It also allows independent querying, pagination, and bulk operations
 *      (mark all as read, delete all read) without touching the User document.
 *
 *   2. DYNAMIC REFERENCE (refPath):
 *      referenceId can point to different collections depending on the notification type:
 *        appointment_booked   → Appointment document
 *        payment_success      → Payment document
 *        case_created         → Case document
 *        document_uploaded    → Document document
 *      A fixed ref: "Appointment" would limit referenceId to one collection.
 *      refPath: "referenceModel" lets Mongoose resolve the correct collection
 *      at query time based on the referenceModel field value.
 *      This is Mongoose's "dynamic population" pattern.
 *
 *   3. isRead FLAG (not a separate read collection):
 *      A separate "ReadNotification" collection would require joins on every fetch.
 *      A simple boolean on the notification document is faster, simpler, and
 *      scales well for the typical "< 1000 notifications per user" use case.
 */

const notificationSchema = new mongoose.Schema(
  {
    // ─── WHO RECEIVES THIS ───────────────────

    // The user who receives this notification — always set server-side
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── NOTIFICATION TYPE ───────────────────

    /**
     * type — machine-readable notification category
     *
     * WHY ENUM?
     *   The frontend maps each type to a specific icon and color:
     *     appointment_* → calendar icon (blue)
     *     payment_*     → rupee icon (green)
     *     case_*        → gavel icon (purple)
     *     hearing_*     → court icon (orange)
     *     document_*    → file icon (grey)
     *   Free-form strings would make this mapping impossible to maintain.
     *   Enum creates a strict contract between backend and frontend.
     */
    type: {
      type: String,
      required: true,
      enum: [
        "appointment_booked",     // User booked an appointment
        "appointment_approved",   // Admin approved the appointment
        "appointment_rejected",   // Admin rejected the appointment
        "appointment_cancelled",  // User cancelled the appointment
        "payment_success",        // Payment verified successfully
        "payment_failed",         // Payment signature verification failed
        "case_created",           // New case was created
        "case_status_changed",    // Admin changed case status
        "hearing_scheduled",      // Admin added a hearing date
        "document_uploaded",      // User uploaded a document
      ],
    },

    // ─── CONTENT ─────────────────────────────

    // Short headline shown in the notification list
    // e.g. "Appointment Approved", "Payment Successful"
    // Kept short — frontend displays at a larger font size
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Full descriptive message with details
    // e.g. "Your appointment with Adv. Ankesh Yadav on 15 Aug 2026 has been approved."
    // Frontend displays below the title at a smaller font size
    message: {
      type: String,
      required: true,
      trim: true,
    },

    // ─── READ STATUS ──────────────────────────

    // false = unread (red badge shown on notification bell)
    // true  = user has seen/read this notification
    // Default false — every new notification starts as unread
    isRead: {
      type: Boolean,
      default: false,
    },

    // ─── DEEP LINK REFERENCE ──────────────────

    /**
     * referenceId — the ObjectId of the related document
     *
     * WHY STORE THIS?
     *   Clicking a notification navigates to the relevant resource:
     *     "Appointment Approved" → /appointments/{referenceId}
     *     "Payment Successful"   → /payments/receipt/{referenceId}
     *     "Case Status Changed"  → /cases/{referenceId}
     *   Without referenceId, notifications are dead-end messages with no navigation.
     *
     * WHY refPath (not ref)?
     *   refPath enables dynamic population — referenceId can point to different
     *   collections depending on referenceModel.
     *   Mongoose reads referenceModel at query time to know which collection to look in.
     */
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "referenceModel", // Dynamic ref — resolved using referenceModel field
      default: null,
    },

    /**
     * referenceModel — the collection name for referenceId
     *
     * Must be one of the Mongoose model names registered in the app.
     * Mongoose uses this to resolve the correct collection for .populate("referenceId").
     *
     * Examples:
     *   type: "appointment_approved" → referenceModel: "Appointment"
     *   type: "payment_success"      → referenceModel: "Payment"
     *   type: "case_created"         → referenceModel: "Case"
     *   type: "document_uploaded"    → referenceModel: "Document"
     */
    referenceModel: {
      type: String,
      enum: ["Appointment", "Payment", "Case", "Document", null],
      default: null,
    },

    // ─── ADMIN BROADCAST FIELDS ───────────────────────────
    // Set only on notifications created by admin via POST /api/admin/notifications/send
    isAdminBroadcast: {
      type:    Boolean,
      default: false,
    },

    // Which user group was targeted: "all" | "user" | "advocate" | "admin"
    targetRole: {
      type:    String,
      default: null,
    },

    // The admin user who sent the broadcast
    sentBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "User",
      default: null,
    },
  },
  {
    timestamps: true, // createdAt = when notification was sent, updatedAt = when read
  }
);

// ─────────────────────────────────────────────
// INDEXES for fast querying
// ─────────────────────────────────────────────

// Most common query: "all notifications for user X" sorted by newest first
notificationSchema.index({ userId: 1, createdAt: -1 });

// Fast unread count query: "how many unread notifications does user X have?"
// This powers the red badge number on the notification bell icon
notificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
