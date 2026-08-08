import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

/**
 * userRoutes.js
 * -------------
 * Handles all routes related to the logged-in user's own account.
 *
 * Base path (registered in server.js): /api/user
 *
 * All routes here are protected — authMiddleware runs first on every route.
 * authMiddleware verifies the JWT and sets req.user = { id, role }.
 * The controllers then use req.user.id to operate on the correct user's data.
 *
 * Route map:
 *   GET  /api/user/profile               → getProfile
 *   PUT  /api/user/profile               → updateProfile (name, phone)
 *   PUT  /api/user/profile/change-password → changePassword
 *
 * Why PUT for change-password and not POST?
 *   PUT = updating an existing resource (the password field on the user).
 *   POST = creating a new resource.
 *   Changing a password is an update operation, so PUT is semantically correct.
 */
const router = express.Router();

// GET /api/user/profile
// Returns the logged-in user's profile data (password excluded)
router.get("/profile", authMiddleware, getProfile);

// PUT /api/user/profile
// Updates name and phone of the logged-in user
router.put("/profile", authMiddleware, updateProfile);

// PUT /api/user/profile/change-password
// Verifies current password, then saves a new hashed password
// Requires: { currentPassword, newPassword } in req.body
router.put("/profile/change-password", authMiddleware, changePassword);

export default router;