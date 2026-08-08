import mongoose from "mongoose";

/**
 * advocateSchema
 * --------------
 * Defines the structure of every Advocate document in MongoDB.
 *
 * Field-by-field explanation:
 *
 *  fullName
 *    - trim removes accidental whitespace before saving.
 *
 *  email
 *    - unique: true creates a DB index — fast lookups, no duplicate advocates.
 *    - lowercase: true normalises email casing before saving.
 *
 *  phone
 *    - String (not Number) — preserves leading zeros and country codes.
 *
 *  specialization
 *    - enum restricts values to a fixed list matching the frontend Service.jsx page.
 *    - WHY enum?
 *        Without it, "Civil Law", "civil law", "CIVIL LAW" are all different strings.
 *        Filtering with ?specialization=Civil Law would miss inconsistently saved records.
 *        enum enforces a single canonical value at the DB level — filtering is always exact.
 *    - Values match exactly what is shown in Service.jsx and Appointment.jsx dropdowns.
 *
 *  experience
 *    - Number — stores years of experience (e.g. 3, 10, 15).
 *
 *  qualification
 *    - String — e.g. "LLB", "LLM", "BA LLB".
 *
 *  location
 *    - String — city or area where the advocate practises.
 *
 *  fees
 *    - Number — consultation fee in rupees.
 *
 *  about
 *    - String — a short bio shown on the advocate's profile card.
 *
 *  profileImage
 *    - Stores a URL string pointing to the uploaded image.
 *    - default: "" means no image uploaded yet.
 *      Frontend checks this and shows a placeholder avatar.
 *
 *  availability
 *    - enum restricts to "Available", "Busy", "On Leave".
 *    - default: "Available" — every new advocate starts as available.
 *    - Frontend can show a coloured badge based on this value.
 *
 *  timestamps: true
 *    - Auto-adds createdAt and updatedAt to every document.
 */
const advocateSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,       // String, not Number — preserves leading zeros
      required: true,
    },

    specialization: {
      type: String,
      required: true,
      // ✅ ADDED: enum enforces a fixed list of valid specializations.
      // These values match exactly what the frontend shows in Service.jsx
      // and the appointment service dropdown in Appointment.jsx.
      // Mongoose rejects any value not in this list before hitting MongoDB.
      enum: [
        "Civil Law",
        "Criminal Law",
        "Family Law",
        "Property Law",
        "Corporate Law",
        "Cyber Law",
        "Labour Law",
        "Tax Law",
        "Constitutional Law",
      ],
    },

    experience: {
      type: Number,       // Years of experience e.g. 3, 10, 15
      required: true,
    },

    qualification: {
      type: String,       // e.g. "LLB", "LLM", "BA LLB"
      required: true,
    },

    location: {
      type: String,       // City or area where advocate practises
      required: true,
    },

    fees: {
      type: Number,       // Consultation fee in rupees
      required: true,
    },

    about: {
      type: String,       // Short bio shown on the advocate profile card
      required: true,
    },

    profileImage: {
      type: String,
      default: "",        // Empty string = no photo uploaded yet
    },

    availability: {
      type: String,
      enum: ["Available", "Busy", "On Leave"],
      default: "Available",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    /* isActive controls public visibility.
       Admin can toggle this without deleting the advocate.
       Only isActive=true advocates appear on the public site and appointment dropdown. */
    isActive: {
      type: Boolean,
      default: true,
    },

    barCouncilNumber: {
      type: String,
      default: "",
      trim: true,
    },

    languages: {
      type: [String],
      default: ["English", "Hindi"],
    },

    // Link to the User model - an advocate may or may not have a user account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,     // Auto-adds createdAt and updatedAt
  }
);

advocateSchema.index({ status: 1 });
advocateSchema.index({ isActive: 1 });
advocateSchema.index({ specialization: 1, isActive: 1 });

const Advocate = mongoose.model("Advocate", advocateSchema);

export default Advocate;