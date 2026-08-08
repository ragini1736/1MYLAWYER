 import express from "express";
import {
  getLegalLibrary,
  incrementDownload,
} from "../controllers/legalLibraryController.js";

const router = express.Router();

// Public routes
router.get("/", getLegalLibrary);
router.get("/:id/download", incrementDownload);

export default router;