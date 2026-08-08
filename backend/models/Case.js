import mongoose from "mongoose";

/**
 * Case.js
 * -------
 * PURPOSE:
 *   Stores the complete lifecycle of a legal case, from filing to closure.
 *
 * RELATIONSHIPS:
 *   userId       → User       (who owns this case)
 *   advocateId   → Advocate   (who is handling this case)
 *   appointmentId → Appointment (the consultation that originated this case — optional)
 *   paymentId    → Payment    (proof of payment for this case — optional)
 *
 * KEY DESIGN DECISIONS:
 *
 *   1. timeline is an ARRAY OF SUBDOCUMENTS — not a separate collection.
 *      WHY? Timeline events belong exclusively to one case. They have no
 *      independent existence outside their case document. Embedding them
 *      keeps reads simple — one query fetches the full case + full history.
 *      If timeline were a separate collection, every case view would need
 *      two queries. Embedded subdocuments are the correct MongoDB pattern
 *      for "owned" data that is always read together with the parent.
 *
 *   2. notes is also embedded — same reasoning as timeline.
 *      Notes belong to a case, are always read with the case, and have no
 *      independent existence.
 *
 *   3. hearingDates is an array of Date — grows over time as hearings are scheduled.
 *      nextHearingDate stores the NEXT upcoming hearing as a quick-access field.
 *      The full history is in hearingDates.
 *
 *   4. category uses the SAME enum as Advocate.specialization.
 *      This ensures consistency — a Civil Law advocate handles Civil Law cases.
 *      The frontend can use the same dropdown for both fields.
 */

// ─────────────────────────────────────────────
// SUB-SCHEMAS (embedded document schemas)
// ─────────────────────────────────────────────

/**
 * timelineEventSchema
 * -------------------
 * A single event in the case timeline.
 * Auto-created by the controller — never manually sent by the client.
 *
 * Events recorded automatically:
 *   "Case Created"        → when createCase runs
 *   "Status Changed"      → when updateCaseStatus runs
 *   "Hearing Scheduled"   → when addHearingDate runs
 *   "Note Added"          → when addCaseNote runs
 *   "Case Closed"         → when closeCase runs
 *   "Case Reopened"       → when reopenCase runs
 */
const timelineEventSchema = new mongoose.Schema(
  {
    // Short label for the event e.g. "Case Created", "Status Changed"
    event: {
      type: String,
      required: true,
    },

    // Human-readable description e.g. "Status changed from Pending to In Progress"
    description: {
      type: String,
      default: "",
    },

    // Who triggered this event — stores the user's name or "System"
    performedBy: {
      type: String,
      default: "System",
    },

    // When this event happened — defaults to now
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }, // Each timeline event gets its own _id for potential future lookups
);

/**
 * caseNoteSchema
 * --------------
 * A single note added to a case by a user or admin.
 * Stored as an embedded array — notes always travel with their case.
 */
const caseNoteSchema = new mongoose.Schema(
  {
    // The note content
    text: {
      type: String,
      required: true,
      trim: true,
    },

    // Who added this note — stores the user's name
    addedBy: {
      type: String,
      required: true,
    },

    // Role of the person who added the note — "user" or "admin"
    // Allows the frontend to display notes differently by role
    addedByRole: {
      type: String,
      enum: ["user", "admin", "advocate"],
      required: true,
    },

    // When this note was added
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }, // Each note gets its own _id for potential deletion later
);

// ─────────────────────────────────────────────
// MAIN CASE SCHEMA
// ─────────────────────────────────────────────
const caseSchema = new mongoose.Schema(
  {
    // ─── RELATIONSHIPS ───────────────────────

    // Who owns this case — set from JWT (req.user.id), never from req.body
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Which advocate is handling this case
    advocateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Advocate",
      required: true,
    },

    // The consultation appointment that originated this case (optional)
    // WHY optional? Admin can also create cases directly without a prior appointment.
    // When provided, the frontend can show "This case started from your appointment on..."
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    // Payment proof for this case (optional)
    // WHY optional? Same as appointmentId — some cases may be created without payment.
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    // ─── PAYMENT DETAILS ───────────────────

    // The total amount due for this case
    paymentAmount: {
      type: Number,
      default: 0,
    },

    // Current payment status
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    // When the payment is due
    paymentDueDate: {
      type: Date,
      default: null,
    },

    // ─── CASE IDENTIFICATION ─────────────────

    // Auto-generated unique case number — NEVER from req.body
    // Format: CASE-{year}-{timestamp}-{random4}
    // Example: CASE-2026-1721234567890-4521
    // unique: true — MongoDB enforces no duplicates at the DB level
    caseNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // Short human-readable title e.g. "Property Dispute vs Singh"
    // Displayed in case lists — more meaningful than a case number
    caseTitle: {
      type: String,
      required: true,
      trim: true,
    },

    // Full name of the client — snapshot at case creation time
    // Separate from User.name because the user might update their profile later
    clientName: {
      type: String,
      required: true,
      trim: true,
    },

    // Category of law — uses SAME enum as Advocate.specialization for consistency
    // Allows filtering: "show all my Criminal Law cases"
    category: {
      type: String,
      required: true,
      enum: [
        "Civil Law",
        "Criminal Law",
        "Family Law",
        "Property Law",
        "Corporate Law",
        "Cyber Law",
      ],
    },

    // Type of case — more specific than category
    // e.g. "Property Dispute", "Divorce Petition", "Bail Application"
    caseType: {
      type: String,
      required: true,
    },

    // Name of the court where the case is filed
    courtName: {
      type: String,
      required: true,
    },

    // Detailed description of the legal matter
    description: {
      type: String,
      required: true,
    },

    // ─── STATUS ──────────────────────────────

    // Current case status
    // Status flow:
    //   Pending → In Progress → Hearing → Closed   (normal flow)
    //   Closed → In Progress                       (reopen)
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Hearing", "Closed"],
      default: "Pending",
    },

    // ─── DATES ───────────────────────────────

    // When the case was filed in court — different from createdAt
    // createdAt = when the record was created in our system
    // filingDate = official court filing date (may be different)
    filingDate: {
      type: Date,
      default: Date.now, // Defaults to today if not explicitly provided
    },

    // Complete history of all hearing dates — grows over time
    // Each call to addHearingDate pushes a new Date to this array
    // The full hearing history is preserved here
    hearingDates: {
      type: [Date],
      default: [],
    },

    // The next upcoming hearing date — quick-access field
    // Updated every time a new hearing is added
    // null if no hearing has been scheduled yet
    nextHearingDate: {
      type: Date,
      default: null,
    },

    // ─── EMBEDDED ARRAYS ─────────────────────

    // Complete auto-generated audit trail of all case events
    // Populated by the controller — never sent by the client
    // Each entry: { event, description, performedBy, date }
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },

    // Notes added by the user or admin throughout the case
    // Each entry: { text, addedBy, addedByRole, date }
    notes: {
      type: [caseNoteSchema],
      default: [],
    },
  },
  {
    timestamps: true, // Auto-adds createdAt and updatedAt
  },
);

// ─────────────────────────────────────────────
// INDEXES for fast querying
// ─────────────────────────────────────────────
// These fields are frequently used in filter/search queries.
// MongoDB indexes make these queries significantly faster on large datasets.
caseSchema.index({ userId: 1 }); // Fast lookup of all cases for a user
caseSchema.index({ advocateId: 1 }); // Fast lookup of all cases for an advocate
caseSchema.index({ status: 1 }); // Fast filtering by status
caseSchema.index({ caseNumber: 1 }); // Fast lookup by case number (also unique)

export default mongoose.model("Case", caseSchema);
