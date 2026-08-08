import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * uploadMiddleware.js
 * -------------------
 * PURPOSE:
 *   Configures Multer for secure local file storage.
 *   Handles file type validation and file size limits BEFORE
 *   the file is written to disk and BEFORE the controller runs.
 *
 * WHY MIDDLEWARE AND NOT INSIDE THE CONTROLLER?
 *   File validation is a cross-cutting concern — not business logic.
 *   Any upload route in the app can reuse this middleware with one import.
 *   The controller stays clean: it only deals with saving metadata to MongoDB.
 *   Swapping disk storage for Cloudinary only requires changing this one file.
 *
 * STORAGE LOCATION:
 *   Files are saved to: backend/uploads/documents/
 *   This folder is served as static by Express (configured in server.js).
 *   URL to access a file: http://localhost:5000/uploads/documents/filename.pdf
 *
 * ALLOWED FILE TYPES:
 *   PDF  → application/pdf
 *   DOC  → application/msword
 *   DOCX → application/vnd.openxmlformats-officedocument.wordprocessingml.document
 *   JPG  → image/jpeg
 *   PNG  → image/png
 *
 * FILE SIZE LIMIT: 10MB
 *   Legal documents can be large (scanned court orders, property papers).
 *   10MB is generous but still prevents abuse.
 *
 * FILENAME STRATEGY: {timestamp}-{random9digits}-{originalname}
 *   WHY NOT just use the original filename?
 *     Two users uploading "aadhaar.pdf" would create a naming conflict.
 *     Timestamp + random digits guarantee uniqueness.
 *   WHY keep the original name at the end?
 *     Makes it easier to identify files in the uploads folder during debugging.
 */

// ─────────────────────────────────────────────
// ALLOWED MIME TYPES
// ─────────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  "application/pdf",                                                           // PDF
  "application/msword",                                                        // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  // .docx
  "image/jpeg",                                                                // .jpg / .jpeg
  "image/png",                                                                 // .png
];

// Human-readable list for error messages
const ALLOWED_EXTENSIONS = ".pdf, .doc, .docx, .jpg, .jpeg, .png";

// Maximum file size: 10MB in bytes (Multer uses bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Upload destination folder path


const UPLOAD_DIR = path.join(process.cwd(), "uploads", "documents");;

// ─────────────────────────────────────────────
// COMPONENT 1: DISK STORAGE CONFIGURATION
// ─────────────────────────────────────────────
const storage = multer.diskStorage({

  /**
   * destination
   * -----------
   * Tells Multer which folder to save the uploaded file in.
   *
   * fs.mkdirSync with recursive: true creates the folder if it doesn't exist.
   * WHY recursive? If "uploads/" doesn't exist either, it creates both levels at once.
   * Without this, the first upload would crash with "ENOENT: no such file or directory".
   *
   * cb(null, UPLOAD_DIR) = success, save to this folder
   */
  
  destination: (req, file, cb) => {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  cb(null, UPLOAD_DIR);
},

  /**
   * filename
   * --------
   * Generates a unique filename for each uploaded file.
   *
   * Format: {timestamp}-{random9digits}-{sanitised-original-name}
   * Example: 1721234567890-482951234-property-papers.pdf
   *
   * path.extname() extracts the file extension: "property-papers.pdf" → ".pdf"
   * path.basename() removes the extension for the base name.
   * .replace() removes spaces and special characters that break URLs.
   *
   * cb(null, filename) = success, use this filename
   */
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.floor(100000000 + Math.random() * 900000000); // 9-digit random
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, "-") // Replace spaces/symbols with hyphens
      .toLowerCase()
      .substring(0, 50); // Limit to 50 chars to prevent absurdly long filenames

    const uniqueFilename = `${timestamp}-${random}-${baseName}${ext}`;
    cb(null, uniqueFilename);
  },
});


// ─────────────────────────────────────────────
// COMPONENT 2: FILE FILTER (TYPE VALIDATION)
// ─────────────────────────────────────────────
/**
 * fileFilter
 * ----------
 * Called BEFORE any file data is written to disk.
 * Rejects files with disallowed MIME types immediately.
 *
 * WHY check mimetype and not just extension?
 *   File extensions can be trivially renamed (virus.exe → document.pdf).
 *   The browser sets mimetype based on the actual file content on most systems.
 *   Checking both mimetype (here) and extension (in controller) provides two layers.
 *
 * cb(error, false) = reject the file, pass error to Express error handler
 * cb(null, true)   = accept the file, proceed to disk storage
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    // File type is allowed — proceed
    cb(null, true);
  } else {
    // File type is not allowed — reject before writing to disk
    // The error message reaches the client via Express's error handler
    cb(
      new Error(
        `Invalid file type. Only ${ALLOWED_EXTENSIONS} files are allowed.`
      ),
      false
    );
  }
};


// ─────────────────────────────────────────────
// COMPONENT 3: MULTER INSTANCE
// ─────────────────────────────────────────────
/**
 * upload
 * ------
 * The configured Multer middleware instance.
 *
 * Usage in routes:
 *   upload.single("document") — accepts exactly ONE file per request
 *                               under the field name "document"
 *
 * "document" must match the field name in the frontend form:
 *   <input type="file" name="document" />
 *   OR in Thunder Client: Body → Form → file field named "document"
 *
 * limits.fileSize: rejects files larger than MAX_FILE_SIZE BEFORE writing to disk.
 * Multer throws a MulterError with code "LIMIT_FILE_SIZE" which we handle
 * in the controller with a check on error.code.
 */




const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE, // 10MB maximum
  },
});

export default upload;
