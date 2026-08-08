import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  uploadDocument,
  getMyDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
  getDocumentsByCase,
  getAllDocuments,
} from "../controllers/documentController.js";

/**
 * documentRoutes.js
 * -----------------
 * Handles all routes for the Document Vault.
 *
 * Base path (registered in server.js): /api/documents
 *
 * UPLOAD MIDDLEWARE CHAIN:
 *   authMiddleware → upload.single("document") → multerErrorHandler → controller
 *
 *   WHY THIS ORDER?
 *   1. authMiddleware first — invalid tokens are rejected BEFORE any file touches the server.
 *      An unauthenticated user never gets to write to disk.
 *   2. upload.single("document") — parses multipart/form-data, validates file type and size,
 *      saves file to disk. Populates req.file with file metadata.
 *   3. multerErrorHandler — catches Multer-specific errors (LIMIT_FILE_SIZE etc.)
 *      and converts them to clean JSON responses.
 *   4. controller — req.file is available, saves metadata to MongoDB.
 *
 * MULTER ERROR HANDLER:
 *   Multer throws MulterError objects (not standard JS Error).
 *   error.code === "LIMIT_FILE_SIZE" → client sent a file > 10MB.
 *   This inline 4-parameter middleware intercepts MulterErrors before
 *   they reach the global error handler, where they'd produce generic responses.
 *   Any non-Multer error is passed through to the global error handler via next(err).
 *
 * ⚠️  ROUTE ORDERING (critical in Express):
 *   More specific routes MUST be registered before less specific ones.
 *   Correct: /my, /all, /case/:caseId, /:id/download, THEN /:id
 *   Incorrect: /:id before any of the others.
 *   Express matches routes top-to-bottom. If /:id came first,
 *   a request for "/my" would match /:id with id="my", leading to a CastError.
 *
 * FULL ROUTE MAP:
 *   POST   /api/documents/                → uploadDocument        (user)
 *   GET    /api/documents/my              → getMyDocuments        (user)
 *   GET    /api/documents/all             → getAllDocuments        (admin)
 *   GET    /api/documents/case/:caseId    → getDocumentsByCase    (user/admin)
 *   GET    /api/documents/:id/download    → downloadDocument      (user/admin)
 *   GET    /api/documents/:id             → getDocumentById       (user/admin)
 *   DELETE /api/documents/:id             → deleteDocument        (user/admin)
 *
 * QUERY PARAMETERS:
 *   GET /my:    ?category=, ?caseId=, ?sort=latest|oldest
 *   GET /all:   ?category=, ?userId=, ?isDeleted=true|false
 *
 * UPLOAD BODY (multipart/form-data):
 *   document    → File field (required) — the actual file
 *   category    → Text field (required) — one of the 7 enum values
 *   description → Text field (optional) — note about the document
 *   caseId      → Text field (optional) — link to a specific case
 */



const router = express.Router();

// ─────────────────────────────────────────────
// MULTER ERROR HANDLER
// ─────────────────────────────────────────────
/**
 * multerErrorHandler
 * ------------------
 * Inline error-handling middleware specifically for Multer errors.
 * Must have exactly 4 parameters — Express identifies error handlers by arity.
 *
 * Called when upload.single() throws:
 *   MulterError code "LIMIT_FILE_SIZE" → file exceeds 10MB limit
 *   MulterError code "LIMIT_UNEXPECTED_FILE" → wrong field name used
 *   Other MulterErrors → generic message
 *
 * For non-Multer errors, passes through to the global error handler.
 */
// eslint-disable-next-line no-unused-vars
const multerErrorHandler = (err, req, res, next) => {
  // Check if this is a Multer-specific error
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum allowed size is 10MB.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field. Use field name 'document'.",
      });
    }
    // Other Multer errors (rare)
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  // File type rejection — thrown by our fileFilter with a custom message
  // These come through as regular Error objects (not MulterError)
  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Not a Multer error — pass to the global error handler
  next(err);
};


// ─────────────────────────────────────────────
// USER ROUTES — Logged-in users only
// ─────────────────────────────────────────────

// POST /api/documents
// Uploads a file and saves document metadata to MongoDB.
// Body: multipart/form-data
//   document    → file field (required) — must match upload.single("document")
//   category    → text field (required)
//   description → text field (optional)
//   caseId      → text field (optional) — links to a case
// Max file size: 10MB | Allowed: pdf, doc, docx, jpg, jpeg, png
router.post(
  "/",
  authMiddleware,
  upload.single("document"), // Multer runs here — saves file to disk
  multerErrorHandler,        // Catches Multer errors before controller
  uploadDocument
);

// GET /api/documents/my
// Returns all non-deleted documents for the logged-in user.
// ?category=Identity Document&sort=latest
// ⚠️ Must be above /:id
router.get("/my", authMiddleware, getMyDocuments);

// ─────────────────────────────────────────────
// ADMIN ROUTES — Before parameterised routes
// ─────────────────────────────────────────────

// GET /api/documents/all
// Admin views all documents with optional filters.
// ?category=Court Document&userId=<id>&isDeleted=false
// ⚠️ Must be above /:id
router.get("/all", authMiddleware, adminMiddleware, getAllDocuments);

// ─────────────────────────────────────────────
// PREFIX PARAMETERISED ROUTES — Before /:id
// ─────────────────────────────────────────────

// GET /api/documents/case/:caseId
// Returns all non-deleted documents linked to a specific case.
// Used on the Case Detail page "Documents" tab.
// Controller checks case ownership.
// ⚠️ Must be above /:id — "/case/xyz" would match /:id as id="case" otherwise
router.get("/case/:caseId", authMiddleware, getDocumentsByCase);

// ─────────────────────────────────────────────
// PARAMETERISED ROUTES — Specific before General
// ─────────────────────────────────────────────

// ✅ FIXED: Specific `download` route is now BEFORE the general `/:id` route.
// GET /api/documents/:id/download
// Forces file download — sets Content-Disposition: attachment header.
// Controller enforces ownership.
router.get("/:id/download", authMiddleware, downloadDocument);

// GET /api/documents/:id
// Returns a single document by ObjectId.
// Controller enforces ownership — user can only view their own.
router.get("/:id", authMiddleware, getDocumentById);

// DELETE /api/documents/:id
// Two-step delete: soft-deletes DB record + hard-deletes file from disk.
// Controller enforces ownership — user can only delete their own documents.
// Admin can delete any document.
router.delete("/:id", authMiddleware, deleteDocument);

export default router;
