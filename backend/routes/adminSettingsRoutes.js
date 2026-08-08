import express from "express";

import {
  getSiteSettings,
  updateSiteSettings,
} from "../controllers/adminsettingsController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getSiteSettings);

router.put("/", authMiddleware, updateSiteSettings);

export default router;