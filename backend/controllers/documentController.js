import fs from "fs";
import path from "path";
import Document from "../models/Document.js";
import Case from "../models/Case.js";
import { createNotification } from "../utils/notificationHelper.js";

/**
 * uploadDocument
 * --------------
 * Handles file upload and saves document metadata to MongoDB.
 * Protected route — requires valid JWT (authMiddleware).
 *
 * HOW IT WORKS WITH MULTER:
 *   The route applies upload.single("document") BEFORE this controller runs.
 *   Multer saves the file to disk and populates req.file with:
 *     - req.file.originalname  → original filename from user's machine
 *     - req.file.filename      → generated unique filename on disk
 *     - req.file.path          → full disk path: "uploads/documents/filename.pdf"
 *     - req.file.mimetype      → MIME type: "application/pdf"
 *     - req.file.size          → file size in bytes
 *
 *   If Multer's fileFilter rejected the file, req.file is undefined
 *   and the Multer error is passed to Express's error handler.
 *   We also check req.file manually to handle edge cases.
 *
 * MULTER ERROR HANDLING:
 *   Multer throws a MulterError object for its own errors (not standard JS Error).
 *   error.code === "LIMIT_FILE_SIZE" → file exceeded 10MB limit
 *   We handle this in the route file using a wrapper.
 *   Here we handle the case where req.file is simply absent.
 *
 * FILE PATH STORED IN DB:
 *   req.file.path returns "uploads/documents/filename.pdf" (relative, OS-style).
 *   We convert to a URL path with forward slashes: "/uploads/documents/filename.pdf"
 *   This is what the frontend appends to the base URL for preview/download.
 */
export const uploadDocument = async (req, res) => {
  try {
    // If req.file is undefined, Multer did not receive a file in the request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please attach a file with field name 'document'.",
      });
    }

    const { category, description, caseId } = req.body;

    // category is required — validate it
    if (!category) {
      // File was already saved to disk by Multer — clean it up before returning error
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: "category is required",
      });
    }

    // If caseId is provided, verify the case exists and belongs to this user
    if (caseId) {
      const caseDoc = await Case.findById(caseId);
      if (!caseDoc) {
        fs.unlink(req.file.path, () => {});
        return res.status(404).json({
          success: false,
          message: "Case not found",
        });
      }
      // Ownership check — user can only link documents to their own cases
      if (caseDoc.userId.toString() !== req.user.id && req.user.role !== "admin") {
        fs.unlink(req.file.path, () => {});
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only link documents to your own cases.",
        });
      }
    }

    // The web-accessible URL path for the document.
    // `server.js` exposes the `uploads/documents` directory at the `/uploads/documents` URL prefix.
    // We must store this URL path, not the full filesystem path.
    const filePath = `/uploads/documents/${req.file.filename}`;

    // Save document metadata to MongoDB
    // We never save the raw bytes — only the metadata and the URL path
    const document = await Document.create({
      userId: req.user.id,        // Always from JWT — never req.body
      caseId: caseId || null,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath,                   // URL path: /uploads/documents/filename.pdf
      fileType: req.file.mimetype,
      fileSize: req.file.size,    // Bytes — frontend converts to KB/MB for display
      category,
      description: description || "",
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document,
    });

    // Fire-and-forget — response already sent
    // req.file.originalname and category are in scope from the upload operation
    createNotification({
      userId: req.user.id,
      type: "document_uploaded",
      title: "Document Uploaded",
      message: `Your document "${req.file.originalname}" has been uploaded successfully under category "${category}".`,
      referenceId: document._id,
      referenceModel: "Document",
    });

  } catch (error) {
    // If DB save fails, clean up the orphaned file on disk
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * getMyDocuments
 * --------------
 * Returns all non-deleted documents for the logged-in user.
 * Protected route — user only.
 *
 * IMPORTANT: Every query always includes { isDeleted: false }
 *   Soft-deleted documents are completely invisible to the user.
 *
 * Supports query params:
 *   ?category=Identity Document|Court Document|...  → filter by category
 *   ?caseId=<ObjectId>                              → filter by case
 *   ?sort=latest|oldest                             → sort by upload date
 */
export const getMyDocuments = async (req, res) => {
  try {
    const { category, caseId, sort = "latest" } = req.query;

    // Base query — always scoped to this user and non-deleted
    const query = {
      userId: req.user.id,
      isDeleted: false,          // ALWAYS filter out soft-deleted documents
    };

    if (category) query.category = category;
    if (caseId) query.caseId = caseId;

    const sortOrder = sort === "oldest" ? 1 : -1;

    const documents = await Document.find(query)
      .populate("caseId", "caseNumber caseTitle status")
      .sort({ createdAt: sortOrder });

    // Convert fileSize from bytes to readable format for each document
    // We add this as a virtual field in the response — not stored in DB
    const docsWithSize = documents.map((doc) => ({
      ...doc.toObject(),
      fileSizeReadable: formatFileSize(doc.fileSize),
    }));

    res.status(200).json({
      success: true,
      count: documents.length,
      documents: docsWithSize,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * getDocumentById
 * ---------------
 * Returns a single document by its MongoDB ObjectId.
 * Protected route — ownership check applied.
 *
 * isDeleted check: a soft-deleted document returns 404 to the user —
 * from their perspective, it no longer exists.
 */
export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      isDeleted: false,          // Soft-deleted = not found
    }).populate("caseId", "caseNumber caseTitle status")
      .populate("userId", "name email");

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Ownership check — user can only view their own documents; admin can view any
    if (document.userId._id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own documents.",
      });
    }

    res.status(200).json({
      success: true,
      document: {
        ...document.toObject(),
        fileSizeReadable: formatFileSize(document.fileSize),
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * downloadDocument
 * ----------------
 * Forces a file download via res.download().
 * Protected route — ownership check applied.
 *
 * res.download(filePath, originalName) sets the response headers:
 *   Content-Disposition: attachment; filename="aadhaar-card.pdf"
 *   Content-Type: application/pdf
 *
 * WHY pass originalName as the second argument?
 *   Without it, the browser shows the generated filename:
 *   "1721234567890-482951234-aadhaar-card.pdf"
 *   With it, the user sees their original filename in the download dialog.
 *
 * WHY use res.download() instead of res.sendFile()?
 *   res.sendFile() serves the file inline — the browser may display it.
 *   res.download() forces the browser to download it every time.
 *   For a Document Vault "Download" button, forced download is the right UX.
 *   (Preview uses the filePath URL directly in the browser — separate feature.)
 */
export const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Ownership check
    if (document.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only download your own documents.",
      });
    }

    // Build the absolute disk path from the stored URL path
    // The stored path is a URL path like "/uploads/documents/file.pdf".
    // We need to convert it to an OS-specific filesystem path.
    const absolutePath = path.join(process.cwd(), document.filePath);

    console.log("Stored path:", document.filePath);
    console.log("Absolute path:", absolutePath);
    console.log("Exists:", fs.existsSync(absolutePath));

    // Check the file actually exists on disk before attempting download
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server. It may have been removed.",
      });
    }

    // res.download(path, filename, callback)
    // Forces download — browser shows "Save As" dialog with originalName
    res.download(absolutePath, document.originalName, (err) => {
      if (err) {
        // Only send error response if headers haven't been sent yet
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Error downloading file",
          });
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * deleteDocument
 * --------------
 * Soft-deletes the MongoDB record and hard-deletes the physical file from disk.
 * Protected route — ownership check applied.
 *
 * TWO-STEP DELETE:
 *   Step 1: Set isDeleted: true in MongoDB (audit trail preserved)
 *   Step 2: fs.unlink() deletes the physical file (disk space recovered)
 *
 * WHY ARE THESE TWO STEPS INDEPENDENT?
 *   If the file is already missing from disk (edge case — manual deletion),
 *   the MongoDB soft-delete still succeeds. We don't roll back the DB update
 *   just because the file was already gone.
 *   The two operations are wrapped in separate try-catch blocks.
 */
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Ownership check — user can only delete their own documents; admin can delete any
    if (document.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own documents.",
      });
    }

    // Step 1: Soft delete — mark as deleted in MongoDB
    // isDeleted: true makes it invisible in all user-facing queries
    document.isDeleted = true;
    await document.save();

    // Step 2: Hard delete physical file from disk
    // Wrapped separately — if file is missing, we still return success
    const absolutePath = path.join(process.cwd(), document.filePath);
    try {
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (fileError) {
      // Log but don't fail — file deletion is best-effort
      console.error(`Warning: Could not delete file from disk: ${fileError.message}`);
    }

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * getDocumentsByCase
 * ------------------
 * Returns all non-deleted documents linked to a specific case.
 * Protected route — ownership check on the case.
 *
 * Used on the Case Detail page "Documents" tab.
 * Shows all documents the user has linked to this case.
 */
export const getDocumentsByCase = async (req, res) => {
  try {
    const { caseId } = req.params;

    // Verify the case exists
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Ownership check on the case — user can only see docs for their own cases
    if (caseDoc.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view documents for your own cases.",
      });
    }

    const documents = await Document.find({
      caseId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    const docsWithSize = documents.map((doc) => ({
      ...doc.toObject(),
      fileSizeReadable: formatFileSize(doc.fileSize),
    }));

    res.status(200).json({
      success: true,
      count: documents.length,
      caseNumber: caseDoc.caseNumber,
      caseTitle: caseDoc.caseTitle,
      documents: docsWithSize,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * getAllDocuments
 * --------------
 * Admin-only: Returns all documents in the system.
 * Supports filters: ?category=, ?userId=, ?isDeleted=true/false
 *
 * WHY allow ?isDeleted=true for admin?
 *   Admin audit feature — "show all deleted documents this month"
 *   Useful for compliance and dispute resolution.
 */
export const getAllDocuments = async (req, res) => {
  try {
    const { category, userId, isDeleted = "false" } = req.query;

    const query = {};
    if (category) query.category = category;
    if (userId) query.userId = userId;

    // Parse isDeleted string to boolean — query params are always strings
    query.isDeleted = isDeleted === "true";

    const documents = await Document.find(query)
      .populate("userId", "name email phone")
      .populate("caseId", "caseNumber caseTitle")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─────────────────────────────────────────────
// PRIVATE HELPER
// ─────────────────────────────────────────────

/**
 * formatFileSize
 * --------------
 * Converts raw bytes to a human-readable string.
 * Used to add fileSizeReadable to document responses.
 *
 * 500        → "500 B"
 * 51200      → "50.0 KB"
 * 2621440    → "2.5 MB"
 */
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
