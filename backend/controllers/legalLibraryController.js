/**
 * legalLibraryController.js
 * ──────────────────────────
 * Admin CRUD for legal document templates.
 *
 * All routes are admin-only (authMiddleware + adminMiddleware in adminRoutes.js).
 *
 * Endpoints:
 *   GET    /api/admin/legal-library          — list with search + category filter
 *   POST   /api/admin/legal-library          — upload new document (multipart/form-data)
 *   PUT    /api/admin/legal-library/:id      — edit title / description / category
 *   DELETE /api/admin/legal-library/:id      — soft-delete record + hard-delete file
 *
 * File storage: Multer saves to uploads/legal-library/
 * Multer config is defined at the bottom of this file and exported
 * for use in adminRoutes.js.
 */

import fs   from "fs";
import path from "path";
import multer from "multer";
import LegalLibrary from "../models/LegalLibrary.js";

// ─────────────────────────────────────────────
// MULTER CONFIGURATION
// ─────────────────────────────────────────────

const uploadDir = "uploads/legal-library";

// Ensure the upload directory exists at startup
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    // Prepend timestamp + random suffix to guarantee unique file names on disk
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${file.originalname.replace(/\s+/g, "-")}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and Word documents are allowed (.pdf, .doc, .docx)"), false);
  }
};

export const legalLibraryUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// ─────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────

/**
 * getLegalLibrary
 * ───────────────
 * Returns all non-deleted documents with optional filters.
 *
 * Query params:
 *   ?search=affidavit        — regex on title and description
 *   ?category=Court          — filter by category
 *   ?page=1&limit=20         — pagination
 */
export const getLegalLibrary = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;

    const query = { isDeleted: false };

    if (category && category !== "All") {
      query.category = category;
    }

    if (search && search.trim()) {
      query.$or = [
        { title:       { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [total, docs] = await Promise.all([
      LegalLibrary.countDocuments(query),
      LegalLibrary.find(query)
        .populate("uploadedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success:     true,
      total,
      totalPages:  Math.ceil(total / limitNum),
      currentPage: pageNum,
      count:       docs.length,
      documents:   docs,
    });
  } catch (error) {
    console.error("[getLegalLibrary]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * createLegalDocument
 * ────────────────────
 * Accepts multipart/form-data with:
 *   - file  (req.file  — processed by legalLibraryUpload middleware)
 *   - title, category, description  (req.body)
 *
 * On validation failure the uploaded file is cleaned up from disk.
 */
export const createLegalDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Attach a PDF or Word document.",
      });
    }

    const { title, category, description } = req.body;

    if (!title || !title.trim()) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, message: "title is required" });
    }

    if (!category) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, message: "category is required" });
    }

    // Convert OS path to URL path (backslash → forward slash for Windows)
    const filePath = "/" + req.file.path.replace(/\\/g, "/");

    const doc = await LegalLibrary.create({
      title:        title.trim(),
      description:  description?.trim() || "",
      category,
      fileName:     req.file.filename,
      originalName: req.file.originalname,
      filePath,
      fileType:     req.file.mimetype,
      fileSize:     req.file.size,
      uploadedBy:   req.user.id,
    });

    res.status(201).json({
      success:  true,
      message:  "Document uploaded successfully",
      document: doc,
    });
  } catch (error) {
    // Clean up orphaned file if DB save failed
    if (req.file) fs.unlink(req.file.path, () => {});
    console.error("[createLegalDocument]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * updateLegalDocument
 * ────────────────────
 * Updates only editable metadata fields: title, description, category.
 * Does NOT replace the uploaded file (use delete + re-upload for that).
 */
export const updateLegalDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category } = req.body;

    const doc = await LegalLibrary.findOne({ _id: id, isDeleted: false });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (title !== undefined)       doc.title       = title.trim();
    if (description !== undefined) doc.description = description.trim();
    if (category !== undefined)    doc.category    = category;

    await doc.save();

    res.status(200).json({
      success:  true,
      message:  "Document updated successfully",
      document: doc,
    });
  } catch (error) {
    console.error("[updateLegalDocument]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * deleteLegalDocument
 * ────────────────────
 * Soft-deletes the MongoDB record and hard-deletes the physical file.
 * Same two-step pattern used in documentController.js.
 */
export const deleteLegalDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await LegalLibrary.findOne({ _id: id, isDeleted: false });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Step 1: Soft-delete the MongoDB record
    doc.isDeleted = true;
    await doc.save();

    // Step 2: Hard-delete the physical file from disk
    const absolutePath = path.join(process.cwd(), doc.filePath);
    try {
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (fileErr) {
      console.error(`[deleteLegalDocument] File deletion warning: ${fileErr.message}`);
    }

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("[deleteLegalDocument]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * incrementDownload
 * ──────────────────
 * Atomically increments the download counter and serves the file.
 * Called when a user clicks "Download" on any library document.
 * This route is PUBLIC — no auth required (downloads are open access).
 */
export const incrementDownload = async (req, res) => {
  try {
    const doc = await LegalLibrary.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const absolutePath = path.join(process.cwd(), doc.filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: "File not found on server" });
    }

    res.download(absolutePath, doc.originalName, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ success: false, message: "Error downloading file" });
      }
    });
  } catch (error) {
    console.error("[incrementDownload]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
