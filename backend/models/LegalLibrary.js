/**
 * LegalLibrary.js
 * ───────────────
 * Stores admin-uploaded legal document templates.
 * These are public-facing downloadable files shown on the Legal Library page.
 *
 * Fields:
 *   title       — Human-readable name shown in the card grid
 *   description — Optional short description of the document
 *   category    — Used for filtering (Government, Court, Property, etc.)
 *   fileName    — Multer-generated unique file name on disk
 *   originalName— Original file name from the admin's machine (shown on download)
 *   filePath    — URL path served by Express static middleware
 *                 e.g. "/uploads/legal-library/filename.pdf"
 *   fileType    — MIME type (application/pdf, application/msword, etc.)
 *   fileSize    — Raw bytes; frontend formats to KB / MB for display
 *   downloads   — Counter incremented each time the file is downloaded
 *   uploadedBy  — Admin user who uploaded this document
 *   isDeleted   — Soft-delete flag; true = hidden from all public queries
 */

import mongoose from "mongoose";

const legalLibrarySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "Government",
          "Court",
          "Notice",
          "Property",
          "Employment",
          "Family",
          "Corporate",
          "Other",
        ],
        message: "Invalid category",
      },
    },

    fileName: {
      type: String,
      required: true,   // Set by Multer — never supplied by client
    },

    originalName: {
      type: String,
      required: true,   // Original filename for download dialog
    },

    filePath: {
      type: String,
      required: true,   // URL path: /uploads/legal-library/filename.pdf
    },

    fileType: {
      type: String,
      required: true,   // MIME type: application/pdf, etc.
    },

    fileSize: {
      type: Number,
      required: true,   // Bytes
      min: 0,
    },

    downloads: {
      type: Number,
      default: 0,
      min: 0,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,   // createdAt, updatedAt added automatically
  }
);

// Index for fast category filtering (used on both admin and public pages)
legalLibrarySchema.index({ category: 1, isDeleted: 1 });
// Text index for search on title and description
legalLibrarySchema.index({ title: "text", description: "text" });

export default mongoose.model("LegalLibrary", legalLibrarySchema);
