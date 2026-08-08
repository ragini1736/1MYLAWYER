import Notification from "../models/Notification.js";

/**
 * notificationHelper.js
 * ---------------------
 * PURPOSE:
 *   A single shared utility function for creating notifications across the entire app.
 *   Every controller that needs to send a notification imports and calls createNotification().
 *
 * WHY A UTILITY FUNCTION (not inline Notification.create in each controller)?
 *
 *   WITHOUT this file:
 *     appointmentController.js → contains Notification.create(...)
 *     paymentController.js     → contains Notification.create(...)
 *     caseController.js        → contains Notification.create(...)
 *     documentController.js    → contains Notification.create(...)
 *
 *   Problems with the inline approach:
 *     1. Duplication — same Notification.create() logic written 4+ times
 *     2. Drift — if you add a new field to every notification, you edit 4 files
 *     3. Error handling — you need try-catch in every controller for notifications
 *     4. Inconsistency — one controller might use different field names accidentally
 *
 *   WITH this file:
 *     One function. One import. One place to change. Zero drift.
 *     This is the DRY principle (Don't Repeat Yourself) applied correctly.
 *
 * WHY ERRORS ARE CAUGHT INTERNALLY AND NEVER RE-THROWN:
 *   A notification failure must NEVER fail the main operation.
 *
 *   Scenario: User books an appointment successfully. Notification DB write fails.
 *   Correct behaviour: Appointment is saved, user gets 201 success. Notification
 *                      failure is logged on server for debugging.
 *   Wrong behaviour:   500 error returned to user because a notification failed.
 *                      The booking was successful — the user loses trust in the system.
 *
 *   By catching errors internally, we guarantee notification failures are
 *   completely transparent to the end user and to the calling controller.
 *
 * USAGE:
 *   import { createNotification } from "../utils/notificationHelper.js";
 *
 *   // After a successful operation, call without await (fire-and-forget)
 *   // OR with await if you want to log success (both are fine)
 *   createNotification({
 *     userId: appointment.user,
 *     type: "appointment_booked",
 *     title: "Appointment Booked",
 *     message: `Your appointment with Adv. ${advocate.fullName} has been booked.`,
 *     referenceId: appointment._id,
 *     referenceModel: "Appointment",
 *   });
 *   // Note: No await needed — notification is fire-and-forget
 *   // The main controller response has already been sent by this point
 *
 * PARAMETERS:
 *   @param {Object} options
 *   @param {ObjectId|string} options.userId       — who receives the notification
 *   @param {string}          options.type         — notification type enum value
 *   @param {string}          options.title        — short headline
 *   @param {string}          options.message      — full descriptive message
 *   @param {ObjectId}        [options.referenceId]    — related document ObjectId (optional)
 *   @param {string}          [options.referenceModel] — collection name for referenceId (optional)
 *
 * RETURNS:
 *   Promise<void> — resolves on success, catches and logs errors silently
 */
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  referenceId = null,
  referenceModel = null,
}) => {
  try {
    // Validate required fields before attempting DB write
    // These are programming errors (wrong call from a controller) — log clearly
    if (!userId || !type || !title || !message) {
      console.error(
        "❌ createNotification: Missing required fields",
        { userId, type, title, message }
      );
      return; // Return silently — don't throw, don't affect calling controller
    }

    await Notification.create({
      userId,
      type,
      title,
      message,
      referenceId,
      referenceModel,
      isRead: false, // Every new notification starts as unread
    });

    // Optional: uncomment during development to trace notifications
    // console.log(`🔔 Notification created: [${type}] for user ${userId}`);

  } catch (error) {
    // Log the error for server-side debugging
    // DO NOT re-throw — notification failure must never affect the main operation
    console.error(
      `❌ Notification creation failed [type: ${type}, userId: ${userId}]: ${error.message}`
    );
  }
};
