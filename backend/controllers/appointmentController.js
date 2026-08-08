import Appointment from "../models/Appointment.js";
import Advocate from "../models/Advocate.js";
import Payment from "../models/Payment.js";
import Case from "../models/Case.js";
import { generateCaseNumber } from "./caseController.js";
import { createNotification } from "../utils/notificationHelper.js";

/**
 * bookAppointment
 * ---------------
 * Creates a new appointment for the logged-in user.
 * Protected route — requires valid JWT (authMiddleware).
 *
 * Fixes from original:
 *   ✅ Added full input validation
 *   ✅ Added past date validation — cannot book in the past
 *   ✅ Added advocateId — links appointment to a specific advocate
 *   ✅ Added timeSlot — specific time window for the consultation
 *   ✅ Verifies the advocate exists before booking
 *
 * Flow:
 *  1. Validate all required fields
 *  2. Check appointmentDate is not in the past
 *  3. Verify the advocate exists in the DB
 *  4. Create the appointment with user ID from JWT
 *  5. Return populated appointment (with advocate details)
 */
export const bookAppointment = async (req, res) => {
  try {
    const {
      advocateId,
      fullName,
      email,
      phone,
      service,
      appointmentDate,
      timeSlot,
      message,
    } = req.body;

    // Step 1: Validate all required fields
    if (
      !advocateId ||
      !fullName ||
      !email ||
      !phone ||
      !service ||
      !appointmentDate ||
      !timeSlot
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: advocateId, fullName, email, phone, service, appointmentDate, timeSlot",
      });
    }

    // Step 2: Validate the appointment date is not in the past
    // new Date(appointmentDate) parses the string into a Date object
    // new Date() is right now — compare timestamps (getTime() returns milliseconds)
    const selectedDate = new Date(appointmentDate);
    const today = new Date();
    // Set today's time to midnight so a date of "today" is still valid
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Appointment date cannot be in the past",
      });
    }

    // Step 3: Verify the advocate exists
    // We check this before creating the appointment to avoid orphaned records
    // (an appointment pointing to a non-existent advocate)
    const advocate = await Advocate.findById(advocateId);
    if (!advocate) {
      return res.status(404).json({
        success: false,
        message: "Advocate not found",
      });
    }

    // Step 4: Create the appointment
    // user ID comes from the JWT decoded by authMiddleware — not from req.body
    // This ensures a user can only book appointments under their own ID
    const appointment = await Appointment.create({
      user: req.user.id,   // Always from JWT — never trust the client for this
      advocateId,
      fullName,
      email,
      phone,
      service,
      appointmentDate: selectedDate,
      timeSlot,
      message: message || "",
    });

    // Step 5: Populate advocate details before returning
    // .populate() replaces the advocateId ObjectId with the full Advocate document
    // The frontend gets advocate name, specialization, fees in one response
    const populatedAppointment = await appointment.populate(
      "advocateId",
      "fullName specialization fees phone email"
    );

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment: populatedAppointment,
    });

    // Fire-and-forget notification — runs after response is sent
    // No await — notification failure must never affect the booking response
    createNotification({
      userId: req.user.id,
      type: "appointment_booked",
      title: "Appointment Booked",
      message: `Your appointment with Adv. ${advocate.fullName} for ${service} on ${selectedDate.toDateString()} has been booked successfully.`,
      referenceId: appointment._id,
      referenceModel: "Appointment",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * getMyAppointments
 * -----------------
 * Returns all appointments for the logged-in user.
 * Protected route — requires valid JWT.
 *
 * Fixes from original:
 *   ✅ Added .sort({ appointmentDate: 1 }) — ascending date order
 *   ✅ Added .populate() — returns advocate details with each appointment
 *
 * Why sort ascending (1)?
 *   The user wants to see their next upcoming appointment first.
 *   Ascending = earliest date first.
 */
export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user.id })
      .populate("advocateId", "fullName specialization fees phone email profileImage")
      .sort({ appointmentDate: 1 }); // 1 = ascending, upcoming first

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * getAppointmentById
 * ------------------
 * Returns a single appointment by its MongoDB ObjectId.
 * Protected route — user can only view their own appointments.
 * Admin can view any appointment.
 *
 * WHY THE OWNERSHIP CHECK?
 *   Without it, any logged-in user could view any appointment by guessing an ID.
 *   We compare appointment.user (ObjectId) with req.user.id (string from JWT).
 *   .toString() is required because ObjectIds are objects, not strings —
 *   direct equality (===) would always return false without conversion.
 */
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("advocateId", "fullName specialization fees phone email profileImage")
      .populate("user", "name email phone");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Ownership check: user can only see their own appointments
    // Admin (role === "admin") can see any appointment
    if (
      appointment.user._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own appointments.",
      });
    }

    res.status(200).json({
      success: true,
      appointment,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * cancelAppointment
 * -----------------
 * Allows a user to cancel their own appointment.
 * Protected route — user only.
 *
 * Business rules:
 *   - Only the owner of the appointment can cancel it
 *   - Only "Pending" or "Approved" appointments can be cancelled
 *   - "Completed", "Rejected", "Cancelled" appointments cannot be cancelled again
 *   - A reason is optional but stored when provided
 *
 * WHY check status before cancelling?
 *   Cancelling a "Completed" appointment makes no sense.
 *   Cancelling an already "Cancelled" appointment is a no-op.
 *   These guards prevent garbage data in the database.
 */
export const cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Ownership check — only the appointment owner can cancel it
    if (appointment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only cancel your own appointments.",
      });
    }

    // Status check — only Pending or Approved can be cancelled
    if (!["Pending", "Approved"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an appointment with status "${appointment.status}"`,
      });
    }

    // Update status and store the cancel reason
    appointment.status = "Cancelled";
    appointment.cancelReason = reason || "Cancelled by user";
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });

    // Notify the user their cancellation was processed
    createNotification({
      userId: appointment.user,
      type: "appointment_cancelled",
      title: "Appointment Cancelled",
      message: `Your appointment on ${appointment.appointmentDate.toDateString()} at ${appointment.timeSlot} has been cancelled.`,
      referenceId: appointment._id,
      referenceModel: "Appointment",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * rescheduleAppointment
 * ---------------------
 * Allows a user to reschedule their own appointment to a new date and time slot.
 * Protected route — user only.
 *
 * Business rules:
 *   - Only the owner can reschedule
 *   - Only "Pending" or "Cancelled" appointments can be rescheduled
 *     (Approved appointments need admin action first — user should cancel then rebook)
 *   - New date cannot be in the past
 *   - Status resets to "Pending" — admin must re-approve the rescheduled appointment
 *
 * WHY reset status to "Pending"?
 *   The admin approved a specific date and time.
 *   If that changes, the admin needs to re-confirm the new slot.
 *   Auto-keeping "Approved" on a rescheduled appointment would be incorrect.
 */
export const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentDate, timeSlot, reason } = req.body;

    // Validate required fields
    if (!appointmentDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "New appointmentDate and timeSlot are required",
      });
    }

    // Validate new date is not in the past
    const newDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newDate < today) {
      return res.status(400).json({
        success: false,
        message: "Rescheduled date cannot be in the past",
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Ownership check
    if (appointment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only reschedule your own appointments.",
      });
    }

    // Status check — only Pending or Cancelled can be rescheduled
    if (!["Pending", "Cancelled"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule an appointment with status "${appointment.status}". Please cancel first.`,
      });
    }

    // Apply the reschedule
    appointment.appointmentDate = newDate;
    appointment.timeSlot = timeSlot;
    appointment.status = "Pending";         // Reset to Pending for re-approval
    appointment.rescheduleReason = reason || "Rescheduled by user";
    appointment.cancelReason = "";          // Clear any previous cancel reason
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully. Awaiting approval.",
      appointment,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * approveAppointment
 * ------------------
 * Admin approves a pending appointment.
 * Protected route — admin only (enforced in routes).
 *
 * Business rule:
 *   Only "Pending" appointments can be approved.
 *   Approving an already "Approved" or "Completed" appointment is blocked.
 */

// ... (rest of the file is unchanged until approveAppointment)

/**
 * approveAppointment
 * ------------------
 * Admin approves a pending appointment and creates a pending payment record.
 * Protected route — admin only (enforced in routes).
 */
export const approveAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('advocateId', 'fees');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve an appointment with status "${appointment.status}"`,
      });
    }

    appointment.status = "Approved";
    await appointment.save();

    // --- Create a corresponding Payment record ---
    if (appointment.advocateId && appointment.advocateId.fees > 0) {
     await Payment.create({
        userId: appointment.user,
        advocateId: appointment.advocateId._id,
        appointmentId: appointment._id,
        serviceName: appointment.service,
        amount: appointment.advocateId.fees,
        dueDate: appointment.appointmentDate,
        status: "Pending",
      });
    }
    // -----------------------------------------

    res.status(200).json({
      success: true,
      message: "Appointment approved successfully and payment initiated",
      appointment,
    });

    createNotification({
      userId: appointment.user,
      type: "appointment_approved",
      title: "Appointment Approved",
      message: `Your appointment on ${appointment.appointmentDate.toDateString()} at ${appointment.timeSlot} has been approved. A payment is due.`,
      referenceId: appointment._id,
      referenceModel: "Appointment",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * rejectAppointment
 * -----------------
 * Admin rejects a pending appointment with a reason.
 * Protected route — admin only (enforced in routes).
 *
 * Business rules:
 *   - Only "Pending" appointments can be rejected
 *   - A reason is required — the user deserves to know why
 */
export const rejectAppointment = async (req, res) => {
  try {
    const { reason } = req.body;

    // Reason is required for rejection — user needs to know why
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason is required",
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Only Pending appointments can be rejected
    if (appointment.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject an appointment with status "${appointment.status}"`,
      });
    }

    appointment.status = "Rejected";
    appointment.cancelReason = reason; // Reuse cancelReason field to store rejection reason
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment rejected",
      appointment,
    });

    // Notify the user their appointment was rejected with the reason
    createNotification({
      userId: appointment.user,
      type: "appointment_rejected",
      title: "Appointment Rejected",
      message: `Your appointment on ${appointment.appointmentDate.toDateString()} has been rejected. Reason: ${reason}`,
      referenceId: appointment._id,
      referenceModel: "Appointment",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * getUpcomingAppointments
 * -----------------------
 * Returns the logged-in user's upcoming appointments.
 * "Upcoming" means: appointmentDate >= today AND status is Pending or Approved.
 * Protected route — user only.
 *
 * WHY separate from getMyAppointments?
 *   getMyAppointments returns ALL appointments (full history).
 *   This endpoint is specifically for the dashboard widget that shows
 *   "Your next appointments" — only future, active ones.
 *
 * MongoDB $gte operator:
 *   $gte = greater than or equal to.
 *   appointmentDate: { $gte: today } returns only future dates.
 *
 * $in operator:
 *   status: { $in: ["Pending", "Approved"] } matches either value.
 *   Equivalent to SQL: WHERE status IN ('Pending', 'Approved')
 */
export const getUpcomingAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today — include today's appointments

    const appointments = await Appointment.find({
      user: req.user.id,
      appointmentDate: { $gte: today },          // Date is today or in the future
      status: { $in: ["Pending", "Approved"] },  // Only active appointments
    })
      .populate("advocateId", "fullName specialization fees profileImage")
      .sort({ appointmentDate: 1 }); // Nearest upcoming first

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * getAppointmentHistory
 * ---------------------
 * Returns the logged-in user's past/completed/cancelled appointments.
 * Protected route — user only.
 *
 * "History" means: appointmentDate < today OR status is Completed/Cancelled/Rejected.
 * We use $or to capture both cases:
 *   - A past appointment that's still "Approved" (edge case — missed appointment)
 *   - A future appointment that's already "Cancelled" or "Rejected"
 *
 * $or operator:
 *   MongoDB returns documents matching ANY of the conditions in the array.
 *   Equivalent to SQL: WHERE date < today OR status IN ('Completed','Cancelled','Rejected')
 *
 * sorted descending (-1) — most recent history first
 */
export const getAppointmentHistory = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      user: req.user.id,
      $or: [
        { appointmentDate: { $lt: today } },                              // Past dates
        { status: { $in: ["Completed", "Cancelled", "Rejected"] } },     // Terminal statuses
      ],
    })
      .populate("advocateId", "fullName specialization fees profileImage")
      .sort({ appointmentDate: -1 }); // Most recent history first

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * getAllAppointments
 * -----------------
 * Admin-only: Returns every appointment in the system.
 * Protected route — admin only (enforced in routes).
 *
 * Uses .populate() on both user and advocateId so the admin dashboard
 * can display full user and advocate names without extra API calls.
 *
 * Supports optional status filter: GET /api/appointments/all?status=Pending
 * This lets the admin view only pending appointments needing action.
 */
export const getAllAppointments = async (req, res) => {
  try {
    const { status } = req.query;

    // Build query — if status param provided, filter by it
    const query = {};
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate("user", "name email phone")
      .populate("advocateId", "fullName specialization fees phone email")
      .sort({ appointmentDate: -1 }); // Most recent first for admin view

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};









export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.status = status;
    await appointment.save();

    // ── Auto-create a Case when an appointment is Approved ─────────────
    // Only runs when status is set to "Approved".
    // Checks for an existing case first to prevent duplicates.
    if (status === "Approved") {
      try {
        const existingCase = await Case.findOne({ appointmentId: appointment._id });

        if (!existingCase) {
          // Generate a unique case number using the same format as createCase()
          let caseNumber = generateCaseNumber();
          let collision = await Case.findOne({ caseNumber });
          while (collision) {
            caseNumber = generateCaseNumber();
            collision = await Case.findOne({ caseNumber });
          }

          // Map appointment.service to a valid Case.category enum value.
          // Case.category is restricted to 6 exact values — a free-form
          // service string must be mapped before calling Case.create(),
          // otherwise Mongoose throws a validation error and case creation fails.
          const categoryMap = {
            "Civil Law":      "Civil Law",
            "Criminal Law":   "Criminal Law",
            "Family Law":     "Family Law",
            "Property Law":   "Property Law",
            "Corporate Law":  "Corporate Law",
            "Cyber Law":      "Cyber Law",
          };
          const category = categoryMap[appointment.service] || "Civil Law";

          await Case.create({
            userId:        appointment.user,
            advocateId:    appointment.advocateId,
            appointmentId: appointment._id,
            clientName:    appointment.fullName,
            caseTitle:     `${appointment.service} Case`,
            category:      category,
            caseType:      appointment.service,
            description:   appointment.message || "Case created from approved appointment",
            courtName:     "Not Assigned",
            caseNumber,
            status:        "Pending",
            filingDate:    new Date(),
            paymentAmount: 0,
            paymentStatus: "Pending",
            hearingDates:  [],
            notes:         [],
            timeline: [{
              event:       "Case Created",
              description: "Automatically created after appointment approval",
              performedBy: "System",
              date:        new Date(),
            }],
          });
        }
      } catch (caseError) {
        // Case creation failure must never break the appointment status update.
        // Log and continue — the appointment response is returned regardless.
        console.error("❌ Auto case creation failed:", caseError.message);
      }
    }
    // ── End auto-case creation ──────────────────────────────────────────

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      appointment,
    });

  } catch (err) {
    console.error("STATUS ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};




/**
 * deleteAppointment
 * -----------------
 * Admin hard-deletes an appointment by ID.
 * Protected route — admin only (enforced in adminRoutes.js).
 */
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
