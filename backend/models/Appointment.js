import mongoose from "mongoose";

/**
 * appointmentSchema
 * -----------------
 * Defines the structure of every Appointment document in MongoDB.
 *
 * An appointment connects three things:
 *   1. A User     — who is booking the consultation
 *   2. An Advocate — who will provide the consultation
 *   3. A Date + TimeSlot — when the consultation happens
 *
 * Field-by-field explanation:
 *
 *  user
 *    - ObjectId reference to the User collection.
 *    - Set automatically from the JWT in the controller (req.user.id).
 *    - ref: "User" allows Mongoose to populate full user details with .populate("user")
 *
 *  advocateId
 *    - ✅ NEW: ObjectId reference to the Advocate collection.
 *    - WHY NEEDED?
 *        Module 4 (Payment) reads advocate.fees to create the payment order.
 *        Module 5 (Case) uses this to auto-assign the advocate.
 *        Without this link, we cannot build those modules correctly.
 *    - ref: "Advocate" allows .populate("advocateId") for full advocate details.
 *
 *  fullName, email
 *    - Stored directly on the appointment (not just referenced from User).
 *    - WHY? A user might update their profile after booking.
 *      The appointment should preserve the name/email at the time of booking.
 *
 *  phone
 *    - ✅ FIXED: Changed from Number to String.
 *    - Number drops leading zeros and cannot store country codes (+91).
 *    - Phone numbers are identifiers, not quantities — always use String.
 *
 *  service
 *    - The type of legal service requested (Civil Law, Criminal Law, etc.)
 *    - String to match what the frontend dropdown sends.
 *
 *  appointmentDate
 *    - The date of the appointment.
 *    - Stored as Date for proper sorting and comparison in queries.
 *
 *  timeSlot
 *    - ✅ NEW: The specific time window e.g. "10:00 AM - 11:00 AM".
 *    - WHY STRING and not Date?
 *      Time slots are predefined labels chosen from a dropdown.
 *      Storing as a string is simpler and directly displayable on the frontend.
 *
 *  message
 *    - Optional note from the user describing their legal issue.
 *    - default: "" means it's optional — no validation error if not sent.
 *
 *  status
 *    - ✅ FIXED: Added "Cancelled" to the enum.
 *    - Previous enum ["Pending","Approved","Completed","Rejected"] was missing
 *      "Cancelled" — any cancelAppointment call would throw a Mongoose ValidationError.
 *    - Status flow:
 *        Pending → Approved → Completed  (normal flow)
 *        Pending → Rejected              (admin rejects)
 *        Pending/Approved → Cancelled    (user cancels)
 *        Cancelled → Pending             (user reschedules — resets to Pending)
 *
 *  cancelReason
 *    - ✅ NEW: Stores why an appointment was cancelled or rejected.
 *    - WHY? Creates an audit trail. User can see "Rejected: Advocate unavailable."
 *    - default: "" — only populated when status becomes Cancelled or Rejected.
 *
 *  rescheduleReason
 *    - ✅ NEW: Stores why an appointment was rescheduled.
 *    - default: "" — only populated when a reschedule happens.
 *
 *  timestamps: true
 *    - Auto-adds createdAt and updatedAt to every document.
 */
const appointmentSchema = new mongoose.Schema(
  {
    // Who booked the appointment
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ NEW: Which advocate the appointment is with
    advocateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Advocate",
      required: true,   // Every appointment must be linked to an advocate
    },

    // Snapshot of user details at time of booking
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // ✅ FIXED: String instead of Number — preserves leading zeros and country codes
    phone: {
      type: String,
      required: true,
    },

    // Type of legal service e.g. "Civil Law", "Criminal Law"
    service: {
      type: String,
      required: true,
    },

    // Date of the appointment
    appointmentDate: {
      type: Date,
      required: true,
    },

    // ✅ NEW: Specific time slot e.g. "10:00 AM - 11:00 AM"
    timeSlot: {
      type: String,
      required: true,
    },

    // Optional message from user describing their legal issue
    message: {
      type: String,
      default: "",
    },

    // Current status of the appointment
    status: {
      type: String,
      // ✅ FIXED: Added "Cancelled" — was missing, breaking any cancel operation
      enum: ["Pending", "Approved", "Completed", "Rejected", "Cancelled"],
      default: "Pending",
    },

    // ✅ NEW: Reason for cancellation or rejection — audit trail
    cancelReason: {
      type: String,
      default: "",
    },

    // ✅ NEW: Reason for rescheduling — audit trail
    rescheduleReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // Auto-adds createdAt and updatedAt
  }
);

export default mongoose.model("Appointment", appointmentSchema);
