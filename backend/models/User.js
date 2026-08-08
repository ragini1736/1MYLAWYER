import mongoose from "mongoose";

/**
 * userSchema
 * ----------
 * Defines the structure of every User document stored in MongoDB.
 *
 * Field-by-field explanation:
 *
 *  name
 *    - "required" (not "require") — Mongoose only reads "required".
 *      The original typo "require: true" was silently ignored, meaning
 *      a user could be saved without a name. Fixed here.
 *    - trim: removes leading/trailing whitespace before saving
 *
 *  email
 *    - unique: true — MongoDB creates an index on this field.
 *      Fast lookups + prevents duplicate accounts at the DB level.
 *    - lowercase: true — normalises "User@Email.COM" → "user@email.com"
 *      before saving, so login comparisons always work regardless of
 *      how the user typed their email.
 *
 *  phone
 *    - Stored as String, NOT Number.
 *      Reason: phone numbers can start with 0, contain + for country
 *      codes (+91), or have spaces/dashes. A Number would drop the
 *      leading zero and cannot hold "+91 98765 43210".
 *
 *  password
 *    - Stored as a bcrypt hash — NEVER plain text.
 *    - minlength: 6 is a schema-level guard. The controller also
 *      validates this before hashing.
 *
 *  role
 *    - enum restricts the value to only "user" or "admin".
 *      If someone sends role: "superadmin", Mongoose throws a
 *      validation error before anything hits the DB.
 *    - default: "user" — every new registration is a regular user.
 *      Admin accounts are promoted manually in the DB.
 *
 *  profilePhoto
 *    - Stores a URL string pointing to the uploaded image.
 *      On local storage this will be a server path like "/uploads/abc.jpg".
 *      On Cloudinary this will be a full HTTPS URL.
 *    - default: "" — empty string means no photo uploaded yet.
 *      The frontend checks if this is empty and shows a placeholder avatar.
 *
 *  timestamps: true
 *    - Mongoose automatically adds two fields:
 *        createdAt — when the document was first saved
 *        updatedAt — when the document was last modified
 *      You never have to set these manually.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // ✅ FIXED: was "require" (typo) — Mongoose only reads "required"
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,     // Creates a DB index for fast lookups + prevents duplicates
      lowercase: true,  // Normalises email casing before saving
      trim: true,
    },

    phone: {
      type: String,     // String, not Number — preserves leading zeros and country codes
      required: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,     // Minimum length validation at schema level
    },

    role: {
      type: String,
      enum: ["user", "admin"], // Only these two values are accepted
      default: "user",         // Every new user is a regular user by default
    },

    profilePhoto: {
      type: String,   // Stores a URL path to the uploaded image
      default: "",    // Empty string = no photo uploaded yet
    },
  },
  {
    timestamps: true, // Auto-adds createdAt and updatedAt to every document
  }
);

const User = mongoose.model("User", userSchema);

export default User;