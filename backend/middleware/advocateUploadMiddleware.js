/**
 * advocateUploadMiddleware.js
 * ---------------------------
 * Multer configuration for advocate profile photo uploads.
 * Saves images to uploads/advocates/
 * Allows only image files (jpg, jpeg, png, webp).
 * Max size: 5MB.
 */
import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = "uploads/advocates";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, PNG, and WEBP images are allowed"), false);
};

export const advocateUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
